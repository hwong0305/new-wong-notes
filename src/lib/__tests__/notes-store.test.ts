import { describe, it, expect } from 'vitest'
import {
  normalizeNote,
  updateNote,
  deleteNote,
  sortNotes,
  type Note,
  type ServerNote,
} from '@/lib/notes-store'

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: 'Test Note',
  content: 'Hello world',
  createdAt: 1000,
  updatedAt: 2000,
  ...overrides,
})

describe('normalizeNote', () => {
  it('maps standard fields correctly', () => {
    const server: ServerNote = {
      id: 'abc-123',
      title: 'My Note',
      content: 'Some content',
      createdAt: 5000,
      updatedAt: 6000,
    }
    const result = normalizeNote(server)
    expect(result).toEqual({
      id: 'abc-123',
      title: 'My Note',
      content: 'Some content',
      createdAt: 5000,
      updatedAt: 6000,
    })
  })

  it('falls back to name/body when title/content are missing', () => {
    const server: ServerNote = {
      id: 'abc',
      name: 'Legacy Note',
      body: 'Legacy body',
    }
    const result = normalizeNote(server)
    expect(result.title).toBe('Legacy Note')
    expect(result.content).toBe('Legacy body')
  })

  it('prefers title over name', () => {
    const server: ServerNote = {
      id: '1',
      title: 'Title',
      name: 'Name',
      content: 'content',
    }
    expect(normalizeNote(server).title).toBe('Title')
  })

  it('prefers content over body', () => {
    const server: ServerNote = {
      id: '1',
      title: 't',
      content: 'Content',
      body: 'Body',
    }
    expect(normalizeNote(server).content).toBe('Content')
  })

  it('defaults title to Untitled note when no name or title', () => {
    const server: ServerNote = { id: '1' }
    expect(normalizeNote(server).title).toBe('Untitled note')
  })

  it('defaults content to empty string when no content or body', () => {
    const server: ServerNote = { id: '1', title: 't' }
    expect(normalizeNote(server).content).toBe('')
  })

  it('handles empty title string', () => {
    const server: ServerNote = { id: '1', title: '' }
    expect(normalizeNote(server).title).toBe('Untitled note')
  })

  it('uses updatedAt as createdAt if createdAt is missing', () => {
    const server: ServerNote = { id: '1', title: 't', updatedAt: 999 }
    const result = normalizeNote(server)
    expect(result.createdAt).toBe(999)
    expect(result.updatedAt).toBe(999)
  })

  it('uses Date.now() as fallback if both timestamps are missing', () => {
    const before = Date.now()
    const result = normalizeNote({ id: '1', title: 't' })
    const after = Date.now()
    expect(result.createdAt).toBeGreaterThanOrEqual(before)
    expect(result.createdAt).toBeLessThanOrEqual(after)
    expect(result.updatedAt).toBe(result.createdAt)
  })

  it('handles non-numeric timestamp values', () => {
    const server: ServerNote = {
      id: '1',
      title: 't',
      content: 'c',
      createdAt: 'invalid' as unknown as number,
      updatedAt: 500,
    }
    const result = normalizeNote(server)
    expect(result.createdAt).toBe(500)
    expect(result.updatedAt).toBe(500)
  })

  it('handles NaN timestamps', () => {
    const server: ServerNote = {
      id: '1',
      title: 't',
      content: 'c',
      createdAt: NaN,
      updatedAt: 100,
    }
    const result = normalizeNote(server)
    expect(result.createdAt).toBe(100)
    expect(result.updatedAt).toBe(100)
  })

  it('handles Infinity timestamps', () => {
    const server: ServerNote = {
      id: '1',
      title: 't',
      content: 'c',
      createdAt: Infinity,
      updatedAt: 100,
    }
    const result = normalizeNote(server)
    expect(result.createdAt).toBe(100)
    expect(result.updatedAt).toBe(100)
  })
})

describe('updateNote', () => {
  it('updates a note in the array immutably', () => {
    const notes = [makeNote({ id: '1' }), makeNote({ id: '2' })]
    const result = updateNote(notes, '1', { title: 'Updated' })
    expect(result).not.toBe(notes)
    expect(result[0].title).toBe('Updated')
    expect(result[0].id).toBe('1')
    expect(result[1]).toEqual(notes[1])
  })

  it('sets updatedAt to Date.now() on update', () => {
    const notes = [makeNote({ id: '1', updatedAt: 100 })]
    const before = Date.now()
    const result = updateNote(notes, '1', { title: 'New' })
    const after = Date.now()
    expect(result[0].updatedAt).toBeGreaterThanOrEqual(before)
    expect(result[0].updatedAt).toBeLessThanOrEqual(after)
  })

  it('preserves original array when id does not match', () => {
    const notes = [makeNote({ id: '1' })]
    const result = updateNote(notes, 'nonexistent', { title: 'X' })
    expect(result).toEqual(notes)
    expect(result).not.toBe(notes)
  })
})

describe('deleteNote', () => {
  it('removes a note by id', () => {
    const notes = [
      makeNote({ id: '1' }),
      makeNote({ id: '2' }),
      makeNote({ id: '3' }),
    ]
    const result = deleteNote(notes, '2')
    expect(result).toHaveLength(2)
    expect(result.map((n) => n.id)).toEqual(['1', '3'])
  })

  it('returns all notes when id not found', () => {
    const notes = [makeNote({ id: '1' })]
    const result = deleteNote(notes, 'nonexistent')
    expect(result).toHaveLength(1)
  })

  it('returns empty array when deleting last note', () => {
    const notes = [makeNote({ id: '1' })]
    const result = deleteNote(notes, '1')
    expect(result).toEqual([])
  })
})

describe('sortNotes', () => {
  const notes = [
    makeNote({ id: 'a', title: 'Zebra', updatedAt: 100 }),
    makeNote({ id: 'b', title: 'Apple', updatedAt: 300 }),
    makeNote({ id: 'c', title: 'Banana', updatedAt: 200 }),
  ]

  it('sorts by name alphabetically', () => {
    const result = sortNotes(notes, 'name')
    expect(result.map((n) => n.title)).toEqual(['Apple', 'Banana', 'Zebra'])
  })

  it('sorts by recent (updatedAt descending)', () => {
    const result = sortNotes(notes, 'recent')
    expect(result.map((n) => n.id)).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate original array', () => {
    const original = [...notes]
    sortNotes(notes, 'name')
    expect(notes).toEqual(original)
  })
})
