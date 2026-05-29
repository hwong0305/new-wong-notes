import { useState, useEffect, useCallback } from "react"
import { Note, GitCommit, fetchNoteLogs, fetchNoteAtCommit } from "@/lib/notes-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, RotateCcw, Clock, GitCommitVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface VersionHistoryProps {
  note: Note
  open: boolean
  onOpenChange: (open: boolean) => void
  onRevert: (note: Note, commitHash: string) => void
}

export function VersionHistory({
  note,
  open,
  onOpenChange,
  onRevert,
}: VersionHistoryProps) {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [loading, setLoading] = useState(false)
  const [reverting, setReverting] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchNoteLogs(note.id)
      .then((res) => setCommits(res.logs.all))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [note.id, open])

  const handleRevert = useCallback(
    async (commit: GitCommit) => {
      setReverting(commit.hash)
      try {
        const reverted = await fetchNoteAtCommit(note.id, commit.hash)
        await onRevert(reverted, commit.hash)
        onOpenChange(false)
      } catch (err) {
        console.error(err)
      } finally {
        setReverting(null)
      }
    },
    [note.id, onRevert, onOpenChange]
  )

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            Browse and restore previous versions of "{note.title}"
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            Loading history...
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-1 pr-2">
              {commits.map((commit) => (
                <div
                  key={commit.hash}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <GitCommitVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {commit.message}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {commit.hash.slice(0, 7)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(commit.date)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 gap-1 text-xs"
                    onClick={() => handleRevert(commit)}
                    disabled={reverting === commit.hash}
                  >
                    <RotateCcw
                      className={cn(
                        "h-3 w-3",
                        reverting === commit.hash && "animate-spin"
                      )}
                    />
                    Revert
                  </Button>
                </div>
              ))}
              {commits.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No version history found
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
