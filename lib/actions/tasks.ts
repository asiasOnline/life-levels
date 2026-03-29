import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR  
} from '@/lib/types/icon'
import {
    TaskStatus,
    TaskPriority,
    TaskDifficulty,
    TaskWithRelations,
    toTask,
    CreateTaskInput,
    UpdateTaskInput,
  } from '@/lib/types/tasks'
import type { SkillSummary } from '@/lib/types/skills'
import type { CharacterSummary } from '@/lib/types/character'
import { getDefaultGoldReward, calculateTaskXP } from '@/lib/utils/tasks'
import { calculateXPForLevel } from '@/lib/utils/skills'

// =======================================
// INTERNAL DATABASE TYPES
// =======================================

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Raw shape returned by Supabase when junction joins are included.
// Not exported — components always receive the clean TaskWithRelations shape.

type TaskRowWithRelations = TaskRow & {
  task_skills: {
    skills: { 
      id: string; 
      title: string; 
      icon: unknown; 
      level: number 
    } | null
  }[]
  task_characters: {
    characters: {
      id: string;
      title: string;
      icon: unknown;
      color_theme: string
    } | null
  }[]
  task_goals: {
      goal_id: string;
    }[]
}

// ===========================================
// RESULT TYPE
// ===========================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ===========================================
// SELECT STRINGS
// Centralised so every fetch function stays in sync if the schema changes.
// ===========================================
const TASK_WITH_RELATIONS_SELECT = `
  *,
  task_skills(
    skills(id, title, icon, level)
  ),
  task_characters(
    characters(id, title, icon, color_theme)
  ),
  task_goals(goal_id)
` as const

// ==============================================
// MAPPER
// Converts a raw Supabase join row → clean TaskWithRelations.
// Strips nulls from junction rows caused by deleted related records.
// ==============================================

function mapRowToTaskWithRelations(row: TaskRowWithRelations): TaskWithRelations {
  const base = toTask(row)

  const skills = (row.task_skills ?? [])
    .filter((hs) => hs.skills !== null)
    .map((hs) => hs.skills as SkillSummary)

  const characters = (row.task_characters ?? [])
    .filter((hc) => hc.characters !== null)
    .map((hc) => hc.characters as unknown as CharacterSummary)

  const goal_ids = (row.task_goals ?? []).map((hg) => hg.goal_id)

  return {
    ...base,
    skills,
    characters,
    goal_ids: goal_ids.length > 0 ? goal_ids : undefined,
  }
}

// ====================================================
// JUNCTION TABLE HELPERS
// All junction writes use the delete-then-insert pattern — no diffing,
// safe because junction rows carry no data beyond the foreign keys.
// =====================================================
async function syncTaskSkills(
  supabase: ReturnType<typeof createClient>,
  task_id: string, 
  skill_ids: string[], 
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('task_skills')
    .delete()
    .eq('task_id', task_id)

  if (deleteError) {
    console.error(`Failed to clear task skillsfor task ${task_id}:`, deleteError)
    throw deleteError
  }

  if (skill_ids.length === 0) return

  const rows = skill_ids.map(
    (skill_id) => ({ task_id, skill_id })
  )

  const { error: insertError } = await supabase
    .from('task_skills')
    .insert(rows)
  if (insertError) {
    console.error(`Failed to link skills for task ${task_id}:`, insertError)
    throw insertError
  }
}

async function syncTaskCharacters(
  supabase: ReturnType<typeof createClient>,
  task_id: string,
  character_ids: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('task_characters')
    .delete()
    .eq('task_id', task_id)

  if (deleteError) {
    console.error(`Failed to clear task characters for task ${task_id}:`, deleteError)
    throw deleteError
  }

  if (character_ids.length === 0) return

  const rows = character_ids.map((character_id) => ({ task_id, character_id }))
  const { error: insertError } = await supabase.from('task_characters').insert(rows)
  if (insertError) {
    console.error(`Failed to link characters for task ${task_id}:`, insertError)
    throw insertError
  }
}

async function syncTaskGoals(
  supabase: ReturnType<typeof createClient>,
  task_id: string,
  goal_ids: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('task_goals')
    .delete()
    .eq('task_id', task_id)

  if (deleteError) throw new Error(`Failed to clear task goals: ${deleteError.message}`)
  if (goal_ids.length === 0) return

  const rows = goal_ids.map((goal_id) => ({ task_id, goal_id }))
  const { error: insertError } = await supabase
    .from('task_goals')
    .insert(rows)
  if (insertError) throw new Error(`Failed to link goals: ${insertError.message}`)
}

// =======================================
// DATABASE FUNCTIONS
// =======================================

// =================================================
// FETCH ALL TASKS
// =================================================
/** -------------------------------------
 * Fetches all tasks for the authenticated user with linked Skills and Characters hydrated. Active habits are returned first, then paused, then archived.
 * --------------------------------------
 */
export async function fetchTasks(): Promise<ActionResult<TaskWithRelations[]>> {
  try {
    const supabase = createClient()
  
    const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser()
    
    if (authError || !user) return {
      success: false,
      error: 'Not authenticated'
    }

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_WITH_RELATIONS_SELECT)
      .eq('user_id', user.id)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) return { 
      success: false, 
      error: error.message 
    }

    const tasks = (data as TaskRowWithRelations[]).map(mapRowToTaskWithRelations) 
    return {
      success: true,
      data: tasks
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching tasks'
    return { success: false, error: message }
}
}

// =================================================
// FETCH A SINGLE TASK.
// =================================================
/**-------------------------------------
 * Returns a single task by ID with all relations hydrated.
 * -------------------------------------
 */
export async function fetchTaskById(
  id: string
): Promise<ActionResult<TaskWithRelations>> {
  try {
    const supabase = createClient()

    const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser()

    if (authError || !user) 
      return { 
        success: false, 
        error: 'Not authenticated' 
      }

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_WITH_RELATIONS_SELECT)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Task not found' }

    return { 
      success: true, 
      data: mapRowToTaskWithRelations(data as TaskRowWithRelations) 
    }
  } catch (err) {    
    const message = err instanceof Error ? err.message : 'Unexpected error fetching task'
    return { success: false, error: message }
  }
}

// =================================================
// CREATE A NEW TASK
// =================================================
/**-------------------------------------
 * Creates a new task and links it to the provided skills, characters,
 * and optionally goals. Rewards default to algorithm output when
 * use_custom_xp is false or omitted.
 *
 * Validation enforced here (in addition to DB constraints):
 * - At least 1 and at most 3 skill IDs
 * - At least 1 character ID
 * -------------------------------------
 */
export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  try {
  const supabase = createClient()
  
  const { 
    data: { user }, 
    error: authError
  } = await supabase.auth.getUser()
  
  if (authError || !user) return { 
    success: false, 
    error: 'Not authenticated' 
  }

  // ── Application-layer guards ──────────────────────────────────────────
  if (!input.skill_ids || input.skill_ids.length === 0) {
      return { 
        success: false, 
        error: 'At least one skill must be assigned.' }
    }
    if (input.skill_ids.length > 3) {
      return { 
        success: false, 
        error: 'A habit cannot be assigned to more than 3 skills.' }
    }
    if (!input.character_ids || input.character_ids.length === 0) {
      return { 
        success: false, 
        error: 'At least one character must be assigned.' }
    }

    // ── Reward defaults ───────────────────────────────────────────────────
    // When use_custom_xp is false, calculate via the algorithm so the DB row
    // always has concrete reward values rather than nulls.
    const useCustom = input.use_custom_xp ?? false
    let characterXp = input.character_xp ?? 0
    let skillXp     = input.skill_xp ?? 0
    let goldReward  = input.gold_reward ?? 0

    if (!useCustom) {
      const rewards = calculateTaskXP(
        input.difficulty, 
        input.skill_ids.length, 
        input.character_ids.length
      )
      characterXp = rewards.characterXP
      skillXp = rewards.skillXP
      goldReward = getDefaultGoldReward(input.difficulty)
    }

  // ── Build the insert row ───────────────────
  const taskInsert: TaskInsert = {
    user_id:            user.id,
    title:              input.title,
    description:        input.description || null,
    icon: {
      type:             input.icon_type || DEFAULT_ICON_TYPE,
      value:            input.icon || DEFAULT_ICON,
      color:            input.icon_color || DEFAULT_ICON_COLOR,
    },
    status:             input.status || 'backlog',
    priority:           input.priority,
    difficulty:         input.difficulty,
    start_date:         input.start_date || null,
    due_date:           input.due_date || null,
    use_custom_xp:      useCustom,
    use_custom_gold:    useCustom,
    gold_reward:        goldReward,
    character_xp:       characterXp,
    skill_xp:           skillXp,
  }

  // Insert task
  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert(taskInsert)
    .select()
    .single()

  if (insertError || !task) {
    return { 
        success: false, 
        error: insertError?.message ?? 'Failed to create new task' }
    }

  // Insert task-skill relationships
  const taskSkills = input.skill_ids.map((skill_id) => ({
    task_id: task.id,
    skill_id,
  }))

  const { error: skillsError } = await supabase
    .from('task_skills')
    .insert(taskSkills)

  if (skillsError) {
    // Rollback: delete the task if skill linking fails
    await supabase
    .from('tasks')
    .delete().eq('id', task.id)
    console.error('Error linking skills to task:', skillsError)
    throw skillsError
  }

  const result = await fetchTaskById(task.id)
  if (!result.success) return result

  return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error creating task'
    return { success: false, error: message }
  }
}

// =================================================
// UPDATE A TASK
// =================================================
/**-------------------------------------
 Updates task fields and/or replaces junction table links.
 Only fields present on UpdateTaskInput are written — omitted fields are left unchanged. Junction tables use full-replacement delete-then-insert when the corresponding _ids array is provided; omitting an _ids array leaves those links untouched.
 * -------------------------------------
 */
export async function updateTask(
  input: UpdateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  try {
  const supabase = createClient()

  const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser()
    
    if (authError || !user) return { 
      success: false, 
      error: 'Not authenticated' 
    }

  // ── Fetch the current row to fill in any missing algorithm inputs ─────
    const { data: existing, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', input.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return { 
        success: false, 
        error: fetchError?.message ?? 'Task not found' }
    }

  // ── Skill count for reward recalc ─────────────────────────────────────
    let currentSkillCount = 1

    if (input.skill_ids) {
      if (input.skill_ids.length === 0) {
        return { 
          success: false, 
          error: 'At least one skill must be assigned.' }
      }
      if (input.skill_ids.length > 3) {
        return { 
          success: false, 
          error: 'A task cannot be assigned to more than 3 skills.' }
      }
      currentSkillCount = input.skill_ids.length
    } else {
      const { count } = await supabase
        .from('task_skills')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', input.id)
      currentSkillCount = count ?? 1
    }

    if (input.character_ids !== undefined && input.character_ids.length === 0) {
      return { 
        success: false, 
        error: 'At least one character must be assigned.' }
    }

  // ── Build the update payload ─────────────────────
  const taskUpdate: TaskUpdate = {}
  
  if (input.title         !== undefined) taskUpdate.title = input.title
  if (input.description   !== undefined) taskUpdate.description = input.description
  if (input.icon          !== undefined || input.icon_type !== undefined) taskUpdate.icon = input.icon as unknown as TaskUpdate['icon']
  if (input.status        !== undefined) taskUpdate.status = input.status
  if (input.priority      !== undefined) taskUpdate.priority = input.priority
  if (input.difficulty !== undefined) taskUpdate.difficulty = input.difficulty
  if (input.start_date !== undefined) taskUpdate.start_date = input.start_date || null
  if (input.due_date !== undefined) taskUpdate.due_date = input.due_date || null
  if (input.use_custom_xp !== undefined) taskUpdate.use_custom_xp = input.use_custom_xp

  // Honour explicit custom reward overrides regardless of recalc
    if (input.gold_reward         !== undefined) taskUpdate.gold_reward         = input.gold_reward
    if (input.character_xp !== undefined) taskUpdate.character_xp = input.character_xp ?? undefined
    if (input.skill_xp     !== undefined) taskUpdate.skill_xp     = input.skill_xp ?? undefined

  // ── Write the task row if there is anything to update ──────
  if (Object.keys(taskUpdate).length > 0) {
    const { error: updateError } = await supabase
      .from('tasks')
      .update(taskUpdate)
      .eq('id', input.id)
      .eq('user_id', user.id)

    if (updateError) return { 
        success: false, 
        error: updateError.message }
  }

  // ── Sync junction tables (only when caller passed new IDs) ────────────
    if (input.skill_ids     !== undefined) await syncTaskSkills(supabase, input.id, input.skill_ids)
    if (input.character_ids !== undefined) await syncTaskCharacters(supabase, input.id, input.character_ids)
    if (input.goal_ids      !== undefined) await syncTaskGoals(supabase, input.id, input.goal_ids)

    const result = await fetchTaskById(input.id)
      if (!result.success) return result

  return { success: true, data: result.data }
} catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error updating task'
    return { success: false, error: message }
  }
}

// =================================================
// DELETE
// =================================================
/**-------------------------------------
 * Permanently deletes a task. Junction rows are removed automatically by
 * ON DELETE CASCADE. Gold and XP already awarded are retained by the user.
 * -------------------------------------
 */

export async function deleteTask(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = createClient()

    const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser()
    
    if (authError || !user) return { 
      success: false, 
      error: 'Not authenticated' 
    }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { 
      success: false, 
      error: error.message 
    }
  
    return { 
      success: true, 
      data: { id } 
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error deleting task'
    return { success: false, error: message }
  }
}

// =================================================
// COMPLETE
// =================================================
/**-------------------------------------
 * Complete a task
 * Awards XP to linked skills and gold to user
 * -------------------------------------
 */
export async function completeTask(id: string): Promise<TaskRow> {
  const supabase = createClient()

  // Fetch task with skills
  const { data: taskData, error: fetchError } = await supabase
    .from('tasks')
    .select(`
      *,
      task_skills (
        skill_id,
        skills (
          id,
          current_xp,
          level,
          xp_to_next_level
        )
      )
    `)
    .eq('id', id)
    .single()

  if (fetchError || !taskData) {
    throw fetchError || new Error('Task not found')
  }

  // Don't complete if already completed
  if (taskData.status === 'completed') {
    throw new Error('Task is already completed')
  }

  // Calculate XP to award
  const skillCount = taskData.task_skills.length
  const { skillXP } = taskData.use_custom_xp
    ? { skillXP: taskData.custom_skill_xp ?? 0 }
    : calculateTaskXP(taskData.difficulty as TaskDifficulty, skillCount, 1)

  // Award XP to each linked skill
  for (const taskSkill of taskData.task_skills) {
    const skill = taskSkill.skills
    if (!skill) continue

    let newCurrentXP = skill.current_xp + skillXP
    let newLevel = skill.level
    let newXPToNextLevel = skill.xp_to_next_level

    // Handle leveling up
    while (newCurrentXP >= newXPToNextLevel) {
      newCurrentXP -= newXPToNextLevel
      newLevel++
      newXPToNextLevel = calculateXPForLevel(newLevel)
    }

    // Update skill
    const { error: skillUpdateError } = await supabase
      .from('skills')
      .update({
        current_xp: newCurrentXP,
        level: newLevel,
        xp_to_next_level: newXPToNextLevel,
      })
      .eq('id', skill.id)

    if (skillUpdateError) {
      console.error('Error updating skill XP:', skillUpdateError)
    }
  }

  // Mark task as completed
  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Error completing task:', updateError)
    throw updateError
  }

  return updatedTask
}

/**-------------------------------------
 * Update task status
 * Convenience method for status changes
 * -------------------------------------
 */
export async function updateTaskStatus(
  id: string, 
  status: TaskStatus
): Promise<ActionResult<TaskRow>> {
  try {
    const supabase = createClient()

    const updateData: Partial<TaskUpdate> = { status }

    // Clear completed_at if moving away from completed
    if (status !== 'completed') {
      updateData.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task status:', error)
      throw error
    }

    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error updating task status'
    return { success: false, error: message }
  }
}