export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'notes-app-data'

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getNotes(): Note[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function createNote(): Note {
  return {
    id: generateId(),
    title: 'Untitled Note',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function updateNote(notes: Note[], id: string, updates: Partial<Note>): Note[] {
  return notes.map((note) =>
    note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
  )
}

export function deleteNote(notes: Note[], id: string): Note[] {
  return notes.filter((note) => note.id !== id)
}

export function sortNotes(notes: Note[], sortBy: 'name' | 'recent'): Note[] {
  return [...notes].sort((a, b) => {
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title)
    }
    return b.updatedAt - a.updatedAt
  })
}
