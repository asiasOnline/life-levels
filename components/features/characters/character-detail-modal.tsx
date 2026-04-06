'use client'

import { useState } from 'react'
import { Character } from '@/lib/types/character'
import { IconData } from '@/lib/types/icon'
import { AVATAR_REGISTRY } from './avatars/avatar-registry'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { CharacterAvatarData } from '@/lib/types/character'
import { renderIcon } from '@/lib/utils/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { EditCharacterModal } from './edit-character-modal'
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

interface CharacterDetailModalProps {
  character: Character | null
  isOpen: boolean
  onClose: (isOpen: boolean) => void
  onCharacterUpdated: () => void
  onCharacterDeleted: () => void
}

// =======================================
// MAIN COMPONENT
// =======================================

export function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onCharacterUpdated,
  onCharacterDeleted,
}: CharacterDetailModalProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  if (!character) return null

  const selectedColor = character.color_theme
  const avatar = character.avatar as CharacterAvatarData | null
  const icon   = character.icon   as IconData

  const progressPct    = Math.min(100, Math.round((character.current_xp / character.xp_to_next_level) * 100))
  const xpRemaining    = character.xp_to_next_level - character.current_xp

  // ── Handlers ───────────────────────────────

  async function handleArchiveToggle() {
    if (!character) return
    setIsArchiving(true)
    try {
      if (character.is_archived) {
        await activateCharacter(character.id)
        toast(`${character.title} is active again.`)
      } else {
        await archiveCharacter(character.id)
        toast(`${character.title} has been archived.`)
      }
      onCharacterUpdated()
      onClose(false)
    } catch (error: any) {
      // Guard trigger fires when archiving the last active character
      if (error?.message?.includes('at least one active Character')) {
        toast.error("You can't archive your only active character.")
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally {
      setIsArchiving(false)
      setIsArchiveDialogOpen(false)
    }
  }

  async function handleDelete() {
    if (!character) return
    setIsDeleting(true)
    try {
      await deleteCharacter(character.id)
      toast(`${character.title} has been permanently deleted.`)
      onCharacterDeleted()
      onClose(false)
    } catch (error: any) {
      if (error?.message?.includes('at least one active Character')) {
        toast.error("You can't delete your only active character.")
      } else {
        toast.error('Failed to delete character. Make sure all linked activities are removed first.')
      }
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">

              {/* Icon + title */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-3xl"
                  style={{
                    backgroundColor: character.color_theme + '18',
                    borderColor: character.color_theme + '55',
                  }}
                >
                  {renderIcon(icon.value, icon.type, icon.color, 'w-8 h-8')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-2xl">{character.title}</DialogTitle>
                    {character.is_archived && (
                      <Badge variant="secondary" className="text-xs">Archived</Badge>
                    )}
                  </div>
                  <DialogDescription>
                    {character.description || 'No description'}
                  </DialogDescription>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditModalOpen(true)}
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
          </DialogHeader>

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
                      backgroundColor: character.color_theme + '22',
                      color: character.color_theme,
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
                      style={{ width: `${progressPct}%`, backgroundColor: character.color_theme }}
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
                        archetypeId={avatar.archetype_id}
                        skinTone={avatar.skin_tone as 'light' | 'mediumLight' | 'medium' | 'mediumDark' | 'deep'}
                        size={56}
                      />
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium">
                        {AVATAR_REGISTRY.find(a => a.id === avatar.archetype_id)?.label ?? avatar.archetype_id}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div
                          className="w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: avatar.skin_tone }}
                        />
                        <span>Skin tone</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div
                          className="w-3 h-3 rounded-full border border-border/50"
                        />
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
                        style={{ backgroundColor: character.color_theme }}
                      />
                      <span className="font-mono text-xs font-medium">
                        {character.color_theme}
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

              {/* Goals */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Goals</h4>
                      <p className="text-sm text-muted-foreground">0 linked goals</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                </div>
              </div>

              {/* Tasks */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <ListTodo className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Tasks</h4>
                      <p className="text-sm text-muted-foreground">0 linked tasks</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                </div>
              </div>

              {/* Habits */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Habits</h4>
                      <p className="text-sm text-muted-foreground">0 linked habits</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                </div>
              </div>

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
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ──────────────────── */}
      <EditCharacterModal
        character={character}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onCharacterUpdated={() => {
          onCharacterUpdated()
          setIsEditModalOpen(false)
        }}
      />

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
              Are you sure you want to permanently delete "{character.title}"? This action cannot
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