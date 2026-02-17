
import { useState, useEffect, useCallback } from "react"
import {
  Note,
  fetchNotes,
  createNoteOnServer,
  updateNoteOnServer,
  deleteNoteOnServer,
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
  const updateTimers = useState(() => new Map<string, ReturnType<typeof setTimeout>>())[0]

  // Load notes from server on mount
  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        const loadedNotes = await fetchNotes()
        if (!isActive) return
        setNotes(loadedNotes)
        if (loadedNotes.length > 0) {
          setSelectedNoteId(loadedNotes[0].id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isActive) setIsLoaded(true)
      }
    }
    load()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    return () => {
      updateTimers.forEach((timer) => clearTimeout(timer))
      updateTimers.clear()
    }
  }, [updateTimers])

  const scheduleUpdate = useCallback(
    (note: Note) => {
      const existingTimer = updateTimers.get(note.id)
      if (existingTimer) clearTimeout(existingTimer)
      const timer = setTimeout(async () => {
        updateTimers.delete(note.id)
        try {
          const saved = await updateNoteOnServer(note.id, note)
          setNotes((prev) =>
            prev.map((item) => (item.id === saved.id ? saved : item))
          )
        } catch (err) {
          console.error(err)
        }
      }, 400)
      updateTimers.set(note.id, timer)
    },
    [updateTimers]
  )

  const handleCreateNote = useCallback(() => {
    const create = async () => {
      try {
        const newNote = await createNoteOnServer()
        setNotes((prev) => [newNote, ...prev])
        setSelectedNoteId(newNote.id)
        setSidebarOpen(false)
      } catch (err) {
        console.error(err)
      }
    }
    create()
  }, [])

  const handleDeleteNote = useCallback(
    (id: string) => {
      const remove = async () => {
        try {
          await deleteNoteOnServer(id)
        } catch (err) {
          console.error(err)
        } finally {
          setNotes((prev) => {
            const newNotes = deleteNote(prev, id)
            if (selectedNoteId === id) {
              setSelectedNoteId(newNotes.length > 0 ? newNotes[0].id : null)
            }
            return newNotes
          })
        }
      }
      remove()
    },
    [selectedNoteId]
  )

  const handleContentChange = useCallback(
    (content: string) => {
      if (!selectedNoteId) return
      setNotes((prev) => {
        const updated = updateNote(prev, selectedNoteId, { content })
        const current = updated.find((note) => note.id === selectedNoteId)
        if (current) scheduleUpdate(current)
        return updated
      })
    },
    [selectedNoteId, scheduleUpdate]
  )

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!selectedNoteId) return
      setNotes((prev) => {
        const updated = updateNote(prev, selectedNoteId, { title })
        const current = updated.find((note) => note.id === selectedNoteId)
        if (current) scheduleUpdate(current)
        return updated
      })
    },
    [selectedNoteId, scheduleUpdate]
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
