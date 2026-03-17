import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { 
  IconType, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR  
} from '@/lib/types/icon'
import {
    TaskStatus,
    TaskPriority,
    TaskDifficulty,
  } from '@/lib/types/tasks'
import { getDefaultGoldReward, calculateTaskXP } from '@/lib/utils/tasks'
import { calculateXPForLevel } from '@/lib/utils/skills'

// =======================================
// DATABASE TYPES
// =======================================

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// =======================================
// INPUT TYPES
// =======================================

export interface CreateTaskInput {
    title: string
    description?: string
    icon?: string
    icon_type?: IconType
    icon_color?: string
    status?: TaskStatus
    priority: TaskPriority
    difficulty: TaskDifficulty
    start_date?: string
    due_date?: string
    skill_ids: string[] // 1-3 skill IDs required
    gold_reward: number
    use_custom_xp?: boolean
    character_xp: number
    skill_xp: number
}

export interface UpdateTaskInput {
    title?: string
    description?: string
    icon?: string
    icon_type?: IconType
    icon_color?: string
    status?: TaskStatus
    priority?: TaskPriority
    difficulty?: TaskDifficulty
    start_date?: string
    due_date?: string
    skill_ids?: string[]
    gold_reward?: number
    use_custom_xp?: boolean
    custom_character_xp?: number
    custom_skill_xp?: number
}

// =======================================
// EXTENDED TYPE
// =======================================

export interface TaskWithSkills extends TaskRow {
  task_skills: {
    skills: {
      id: string
      title: string
      icon: string
      icon_type: IconType
      icon_color: string
      level: number
    }
  }[]
}

// =======================================
// DATABASE FUNCTIONS
// =======================================

/** -------------------------------------
 * Fetch all skills for the current user
 * --------------------------------------
 */
export async function fetchTasks(): Promise<TaskWithSkills[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_skills (
        skills (
          id,
          title,
          icon,
          level
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }

  return data || []
}

/**-------------------------------------
 * Fetch a single task by ID
 * -------------------------------------
 */
export async function fetchTaskById(id: string): Promise<TaskWithSkills | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_skills (
        skills (
          id,
          title,
          icon,
          level
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching task:', error)
    throw error
  }

  return data
}

/**-------------------------------------
 * Create a new task
 * -------------------------------------
 */
export async function createTask(input: CreateTaskInput): Promise<TaskRow> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Validate skill count (1-3)
  if (input.skill_ids.length < 1 || input.skill_ids.length > 3) {
    throw new Error('Tasks must be linked to 1-3 skills')
  }

  // Prepare task data
  const taskData: TaskInsert = {
    user_id: user.id,
    title: input.title,
    description: input.description || null,
    icon: {
      type: input.icon_type || DEFAULT_ICON_TYPE,
      value: input.icon || DEFAULT_ICON,
      color: input.icon_color || DEFAULT_ICON_COLOR,
    },
    status: input.status || 'backlog',
    priority: input.priority,
    difficulty: input.difficulty,
    start_date: input.start_date || null,
    due_date: input.due_date || null,
    gold_reward: input.gold_reward ?? getDefaultGoldReward(input.difficulty),
    use_custom_xp: input.use_custom_xp ?? false,
    custom_character_xp: input.use_custom_xp ? input.custom_character_xp : null,
    custom_skill_xp: input.use_custom_xp ? input.custom_skill_xp : null,
  }

  // Insert task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (taskError) {
    console.error('Error creating task:', taskError)
    throw taskError
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
    await supabase.from('tasks').delete().eq('id', task.id)
    console.error('Error linking skills to task:', skillsError)
    throw skillsError
  }

  return task
}

/**-------------------------------------
 * Update an existing task
 * -------------------------------------
 */
export async function updateTask(id: string, updates: UpdateTaskInput): Promise<TaskRow> {
  const supabase = createClient()

  // Prepare task update data
  const taskUpdate: Partial<TaskUpdate> = {}
  
  if (updates.title !== undefined) taskUpdate.title = updates.title
  if (updates.description !== undefined) taskUpdate.description = updates.description
  if (updates.icon !== undefined || updates.icon_type !== undefined) {
    taskUpdate.icon = {
      type: updates.icon_type || 'emoji',
      value: updates.icon || DEFAULT_ICON,
      color: updates.icon_color,
    }
  }
  if (updates.status !== undefined) taskUpdate.status = updates.status
  if (updates.priority !== undefined) taskUpdate.priority = updates.priority
  if (updates.difficulty !== undefined) taskUpdate.difficulty = updates.difficulty
  if (updates.start_date !== undefined) taskUpdate.start_date = updates.start_date || null
  if (updates.due_date !== undefined) taskUpdate.due_date = updates.due_date || null
  if (updates.gold_reward !== undefined) taskUpdate.gold_reward = updates.gold_reward
  if (updates.use_custom_xp !== undefined) taskUpdate.use_custom_xp = updates.use_custom_xp
  if (updates.custom_character_xp !== undefined) taskUpdate.custom_character_xp = updates.custom_character_xp
  if (updates.custom_skill_xp !== undefined) taskUpdate.custom_skill_xp = updates.custom_skill_xp

  // Update task
  const { data, error } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating task:', error)
    throw error
  }

  // Update skill relationships if provided
  if (updates.skill_ids !== undefined) {
    if (updates.skill_ids.length < 1 || updates.skill_ids.length > 3) {
      throw new Error('Tasks must be linked to 1-3 skills')
    }

    // Delete existing relationships
    await supabase.from('task_skills').delete().eq('task_id', id)

    // Insert new relationships
    const taskSkills = updates.skill_ids.map((skill_id) => ({
      task_id: id,
      skill_id,
    }))

    const { error: skillsError } = await supabase
      .from('task_skills')
      .insert(taskSkills)

    if (skillsError) {
      console.error('Error updating task skills:', skillsError)
      throw skillsError
    }
  }

  return data
}

/**-------------------------------------
 * Delete a task
 * -------------------------------------
 */

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

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
export async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskRow> {
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

  return data
}