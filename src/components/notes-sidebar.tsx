
import { Note, sortNotes } from "@/lib/notes-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Plus,
  Search,
  SortAsc,
  Clock,
  MoreHorizontal,
  Trash2,
  ArrowUpDown,
} from "lucide-react"
import { useState, useMemo } from "react"

interface NotesSidebarProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
  sortBy: "name" | "recent"
  onSortChange: (sortBy: "name" | "recent") => void
}

export function NotesSidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  sortBy,
  onSortChange,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredNotes = useMemo(() => {
    let filtered = notes
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      )
    }
    return sortNotes(filtered, sortBy)
  }, [notes, searchQuery, sortBy])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: "short" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const getPreview = (content: string) => {
    const lines = content.split("\n").filter((line) => line.trim())
    const preview = lines.slice(0, 2).join(" ")
    return preview.substring(0, 60) || "No additional text"
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <h1 className="text-lg font-semibold text-sidebar-foreground">Notes</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateNote}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">New note</span>
        </Button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-sidebar-accent border-0 pl-8 text-sm text-sidebar-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-2">
        <span className="text-xs text-muted-foreground">
          {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-sidebar-foreground"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBy === "name" ? "Name" : "Recent"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onSortChange("recent")}>
              <Clock className="mr-2 h-4 w-4" />
              Recently edited
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("name")}>
              <SortAsc className="mr-2 h-4 w-4" />
              Name
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-0.5 p-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-0.5 rounded-lg p-3 transition-colors",
                selectedNoteId === note.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground"
              )}
              onClick={() => onSelectNote(note.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="truncate font-medium text-sm">
                    {note.title}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                        selectedNoteId === note.id
                          ? "hover:bg-sidebar-primary/80"
                          : "hover:bg-sidebar-accent"
                      )}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Note options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNote(note.id)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <span
                  className={cn(
                    "text-xs",
                    selectedNoteId === note.id
                      ? "text-sidebar-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {formatDate(note.updatedAt)}
                </span>
                <span
                  className={cn(
                    "truncate text-xs",
                    selectedNoteId === note.id
                      ? "text-sidebar-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {getPreview(note.content)}
                </span>
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {searchQuery ? "No notes found" : "No notes yet"}
              </p>
              {!searchQuery && (
                <Button
                  variant="link"
                  onClick={onCreateNote}
                  className="mt-2 text-primary"
                >
                  Create your first note
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
