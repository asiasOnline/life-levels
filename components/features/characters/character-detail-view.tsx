'use client'

import { useState } from 'react'
import { CharacterWithRelations } from '@/lib/types/character'
import { IconData } from '@/lib/types/icon'
import { AVATAR_REGISTRY } from './avatars/avatar-registry'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { renderIcon } from '@/lib/utils/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LinkedItemsSection } from '@/components/layout/app/linked-items-section'
import { 
  Pencil, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Target, 
  ListTodo, 
  RefreshCw, 
  Trophy 
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  archiveCharacter, 
  activateCharacter, 
  deleteCharacter 
} from '@/lib/actions/characters'

// =======================================
// PROPS
// =======================================

interface CharacterDetailViewProps {
  character: CharacterWithRelations
  // Called after archive/reactivate so the page can refetch
  onCharacterUpdated: () => void
  // Called after the character is deleted; the page navigates back to the list
  onCharacterDeleted: () => void
  // The page owns the edit modal
  onEditRequest: (character: CharacterWithRelations) => void
}

// =======================================
// MAIN COMPONENT
// =======================================

export function CharacterDetailView({
  character,
  onCharacterUpdated,
  onCharacterDeleted,
  onEditRequest,
}: CharacterDetailViewProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const selectedColor = character.character_color
  const avatar = character.avatar
  const icon   = character.icon   as IconData

  const progressPct    = Math.min(100, Math.round((character.current_xp / character.xp_to_next_level) * 100))
  const xpRemaining    = character.xp_to_next_level - character.current_xp

  // ── Handlers ───────────────────────────────

  async function handleArchiveToggle() {
    setIsArchiving(true)
    try {
      const result = character.is_archived
        ? await activateCharacter(character.id)
        : await archiveCharacter(character.id)

      if (!result.success) {
        // Guard trigger fires when archiving the last active character
        if (result.error.includes('at least one active Character')) {
          toast.error("You can't archive your only active character.")
        } else {
          toast.error('Something went wrong. Please try again.')
        }
        return
      }

      toast(character.is_archived
        ? `${character.title} is active again.`
        : `${character.title} has been archived.`)
      onCharacterUpdated()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsArchiving(false)
      setIsArchiveDialogOpen(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteCharacter(character.id)

      if (!result.success) {
        if (result.error.includes('at least one active Character')) {
          toast.error("You can't delete your only active character.")
        } else {
          toast.error('Failed to delete character. Make sure all linked activities are removed first.')
        }
        return
      }

      toast(`${character.title} has been permanently deleted.`)
      onCharacterDeleted()
    } catch {
      toast.error('Failed to delete character. Make sure all linked activities are removed first.')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

// =======================================
// COMPONENT RENDER
// =======================================

  return (
    <>
      <div className="rounded-xl border bg-background p-6 max-w-4xl space-y-6">
          <header>
            <div className="flex items-start justify-between gap-4">

              {/* Icon + title */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-3xl"
                  style={{
                    backgroundColor: character.character_color + '18',
                    borderColor: character.character_color + '55',
                  }}
                >
                  {renderIcon(icon.value, icon.type, icon.color, 'w-8 h-8')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold">{character.title}</h1>
                    {character.is_archived && (
                      <Badge variant="secondary" className="text-xs">Archived</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {character.description || 'No description'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEditRequest(character)}
                  title="Edit character"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsArchiveDialogOpen(true)}
                  title={character.is_archived ? 'Reactivate character' : 'Archive character'}
                >
                  {character.is_archived
                    ? <ArchiveRestore className="h-4 w-4" />
                    : <Archive className="h-4 w-4" />
                  }
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title="Delete character"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </header>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* ── OVERVIEW TAB ─────────────*/}
            <TabsContent value="overview" className="space-y-6">

              {/* Level & XP */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Progress</h3>
                  <Badge
                    className="text-lg font-bold px-4 py-1 border-0"
                    style={{
                      backgroundColor: character.character_color + '22',
                      color: character.character_color,
                    }}
                  >
                    Level {character.level}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level XP</span>
                    <span className="font-medium tabular-nums">
                      {character.current_xp.toLocaleString()} / {character.xp_to_next_level.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%`, backgroundColor: character.character_color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progressPct}% to Level {character.level + 1}</span>
                    <span>{xpRemaining.toLocaleString()} XP remaining</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <span className="text-sm text-muted-foreground">All-time XP</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {character.total_xp.toLocaleString()} XP
                  </span>
                </div>
              </div>

              {/* Avatar */}
              {avatar && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Avatar</h3>
                  <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-3">
                    <div
                      className="shrink-0 rounded-xl border overflow-hidden"
                      style={{
                        backgroundColor: selectedColor + '22',
                        borderColor: selectedColor + '66',
                      }}
                    >
                      <AvatarRenderer
                        archetypeId={avatar}
                        color={character.avatar_color}
                        size={56}
                      />
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium">
                        {AVATAR_REGISTRY.find(a => a.id === avatar)?.label ?? avatar}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div
                          className="w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: character.avatar_color }}
                        />
                        <span>Avatar color</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color theme */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Color Theme</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: character.character_color }}
                      />
                      <span className="font-mono text-xs font-medium">
                        {character.character_color}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium mt-1">
                      {character.is_archived ? 'Archived' : 'Active'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium mt-1">
                      {new Date(character.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium mt-1">
                      {new Date(character.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── ACTIVITY TAB ──────────── */}
            <TabsContent value="activity" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Activities linked to this character contribute XP and Gold on completion.
              </p>

              <LinkedItemsSection
                label="Goals"
                singular="goal"
                basePath="/goals"
                items={character.goals ?? []}
                headerIcon={<Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                iconBgClassName="bg-blue-100 dark:bg-blue-900/20"
              />
              <LinkedItemsSection
                label="Tasks"
                singular="task"
                basePath="/tasks"
                items={character.tasks ?? []}
                headerIcon={<ListTodo className="h-5 w-5 text-green-600 dark:text-green-400" />}
                iconBgClassName="bg-green-100 dark:bg-green-900/20"
              />
              <LinkedItemsSection
                label="Habits"
                singular="habit"
                basePath="/habits"
                items={character.habits ?? []}
                headerIcon={<RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                iconBgClassName="bg-orange-100 dark:bg-orange-900/20"
              />

              {/* Rewards */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                      <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Rewards</h4>
                      <p className="text-sm text-muted-foreground">0 unlocked rewards</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
      </div>

      {/* ── Archive / Reactivate Confirmation ───────── */}
      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {character.is_archived ? 'Reactivate Character?' : 'Archive Character?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {character.is_archived
                ? `"${character.title}" will be restored to your active characters. XP earned during the archived period will not be applied retroactively.`
                : `"${character.title}" will be moved to your archive. All data and connections are preserved, and you can restore it at any time.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveToggle} disabled={isArchiving}>
              {isArchiving
                ? (character.is_archived ? 'Reactivating...' : 'Archiving...')
                : (character.is_archived ? 'Reactivate' : 'Archive')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirmation ─────────── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete `{character.title}`? This action cannot
              be undone. All XP history, avatar settings, and skill links will be removed.
              Linked Tasks, Goals, and Habits must be reassigned before deletion is permitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}