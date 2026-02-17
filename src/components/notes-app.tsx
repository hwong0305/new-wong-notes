
import { useState, useEffect, useCallback } from "react"
import {
  Note,
  fetchNotes,
  createNoteOnServer,
  updateNoteOnServer,
  deleteNoteOnServer,
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
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState("")
  const [draftContent, setDraftContent] = useState("")

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
          setDraftTitle(loadedNotes[0].title)
          setDraftContent(loadedNotes[0].content)
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

  const handleCreateNote = useCallback(() => {
    const create = async () => {
      try {
        const current = notes.find((note) => note.id === selectedNoteId)
        const isDirty =
          isEditing &&
          current &&
          (draftTitle !== current.title || draftContent !== current.content)
        if (isDirty) {
          const shouldDiscard = window.confirm(
            "You have unsaved changes. Discard them and create a new note?"
          )
          if (!shouldDiscard) return
        }
        const newNote = await createNoteOnServer()
        setNotes((prev) => [newNote, ...prev])
        setSelectedNoteId(newNote.id)
        setDraftTitle(newNote.title)
        setDraftContent(newNote.content)
        setIsEditing(true)
        setSidebarOpen(false)
      } catch (err) {
        console.error(err)
      }
    }
    create()
  }, [draftContent, draftTitle, isEditing, notes, selectedNoteId])

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
      setDraftContent(content)
    },
    [selectedNoteId]
  )

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!selectedNoteId) return
      setDraftTitle(title)
    },
    [selectedNoteId]
  )

  const handleSelectNote = useCallback(
    (id: string) => {
      if (id === selectedNoteId) return
      const current = notes.find((note) => note.id === selectedNoteId)
      const isDirty =
        isEditing &&
        current &&
        (draftTitle !== current.title || draftContent !== current.content)
      if (isDirty) {
        const shouldDiscard = window.confirm(
          "You have unsaved changes. Discard them and switch notes?"
        )
        if (!shouldDiscard) return
      }
      const selected = notes.find((note) => note.id === id)
      setSelectedNoteId(id)
      setSidebarOpen(false)
      if (selected) {
        setDraftTitle(selected.title)
        setDraftContent(selected.content)
      }
      setIsEditing(false)
    },
    [draftContent, draftTitle, isEditing, notes, selectedNoteId]
  )

  const handleEnterEditMode = useCallback(() => {
    if (!selectedNoteId) return
    const selected = notes.find((note) => note.id === selectedNoteId)
    if (selected) {
      setDraftTitle(selected.title)
      setDraftContent(selected.content)
    }
    setIsEditing(true)
  }, [notes, selectedNoteId])

  const handleCancelEdit = useCallback(() => {
    if (!selectedNoteId) return
    const selected = notes.find((note) => note.id === selectedNoteId)
    const isDirty =
      isEditing &&
      selected &&
      (draftTitle !== selected.title || draftContent !== selected.content)
    if (isDirty) {
      const shouldDiscard = window.confirm(
        "You have unsaved changes. Discard them?"
      )
      if (!shouldDiscard) return
    }
    if (selected) {
      setDraftTitle(selected.title)
      setDraftContent(selected.content)
    }
    setIsEditing(false)
  }, [draftContent, draftTitle, isEditing, notes, selectedNoteId])

  const handleSave = useCallback(async () => {
    if (!selectedNoteId) return
    const selected = notes.find((note) => note.id === selectedNoteId)
    if (!selected) return
    try {
      const saved = await updateNoteOnServer(selectedNoteId, {
        ...selected,
        title: draftTitle,
        content: draftContent,
      })
      setNotes((prev) =>
        prev.map((note) => (note.id === saved.id ? saved : note))
      )
      setDraftTitle(saved.title)
      setDraftContent(saved.content)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
    }
  }, [draftContent, draftTitle, notes, selectedNoteId])

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
            isEditing={isEditing}
            draftTitle={draftTitle}
            draftContent={draftContent}
            onEdit={handleEnterEditMode}
            onSave={handleSave}
            onCancel={handleCancelEdit}
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
