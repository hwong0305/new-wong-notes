
import { useState, useEffect, useCallback } from "react"
import {
  Note,
  getNotes,
  saveNotes,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/notes-store"
import { NotesSidebar } from "./notes-sidebar"
import { MarkdownEditor } from "./markdown-editor"
import { Button } from "@/components/ui/button"
import { Menu, FileText } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent")
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  // Load notes from localStorage on mount
  useEffect(() => {
    const loadedNotes = getNotes()
    setNotes(loadedNotes)
    if (loadedNotes.length > 0) {
      setSelectedNoteId(loadedNotes[0].id)
    }
    setIsLoaded(true)
  }, [])

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveNotes(notes)
    }
  }, [notes, isLoaded])

  const handleCreateNote = useCallback(() => {
    const newNote = createNote()
    setNotes((prev) => [newNote, ...prev])
    setSelectedNoteId(newNote.id)
    setSidebarOpen(false)
  }, [])

  const handleDeleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const newNotes = deleteNote(prev, id)
        if (selectedNoteId === id) {
          setSelectedNoteId(newNotes.length > 0 ? newNotes[0].id : null)
        }
        return newNotes
      })
    },
    [selectedNoteId]
  )

  const handleContentChange = useCallback(
    (content: string) => {
      if (!selectedNoteId) return
      setNotes((prev) => updateNote(prev, selectedNoteId, { content }))
    },
    [selectedNoteId]
  )

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!selectedNoteId) return
      setNotes((prev) => updateNote(prev, selectedNoteId, { title }))
    },
    [selectedNoteId]
  )

  const handleSelectNote = useCallback((id: string) => {
    setSelectedNoteId(id)
    setSidebarOpen(false)
  }, [])

  const selectedNote = notes.find((n) => n.id === selectedNoteId)

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const sidebarContent = (
    <NotesSidebar
      notes={notes}
      selectedNoteId={selectedNoteId}
      onSelectNote={handleSelectNote}
      onCreateNote={handleCreateNote}
      onDeleteNote={handleDeleteNote}
      sortBy={sortBy}
      onSortChange={setSortBy}
    />
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="hidden w-72 shrink-0 border-r border-border md:block">
          {sidebarContent}
        </div>
      )}

      {/* Mobile sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 z-10 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <MarkdownEditor
            note={selectedNote}
            onContentChange={handleContentChange}
            onTitleChange={handleTitleChange}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
            <FileText className="h-16 w-16 opacity-50" />
            <div className="text-center">
              <p className="text-lg font-medium">No note selected</p>
              <p className="mt-1 text-sm">
                Create a new note or select one from the sidebar
              </p>
            </div>
            <Button onClick={handleCreateNote} className="mt-4">
              Create Note
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
