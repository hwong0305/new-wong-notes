export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

interface ServerNote {
  id: string
  title?: string
  name?: string
  content?: string
  body?: string
  createdAt?: number
  updatedAt?: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const toNumber = (value: unknown): number | null => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const normalizeNote = (note: ServerNote): Note => {
  const createdAtValue = toNumber(note.createdAt)
  const updatedAtValue = toNumber(note.updatedAt)
  const createdAt = createdAtValue ?? updatedAtValue ?? Date.now()
  const updatedAt = updatedAtValue ?? createdAt
  return {
    id: note.id,
    title: typeof note.title === 'string' ? note.title : note.name ?? 'Untitled Note',
    content: typeof note.content === 'string' ? note.content : note.body ?? '',
    createdAt,
    updatedAt,
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function fetchNotes(): Promise<Note[]> {
  const data = await request<ServerNote[]>('/api/notes')
  return data.map(normalizeNote)
}

export async function createNoteOnServer(): Promise<Note> {
  const data = await request<ServerNote>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Untitled Note',
      content: '',
    }),
  })
  return normalizeNote(data)
}

export async function updateNoteOnServer(id: string, note: Note): Promise<Note> {
  const data = await request<ServerNote>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: note.title,
      content: note.content,
    }),
  })
  return normalizeNote(data)
}

export async function deleteNoteOnServer(id: string): Promise<void> {
  await request(`/api/notes/${id}`, { method: 'DELETE' })
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
