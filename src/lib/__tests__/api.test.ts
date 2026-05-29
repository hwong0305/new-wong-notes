import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchNotes,
  createNoteOnServer,
  updateNoteOnServer,
  deleteNoteOnServer,
  fetchNoteLogs,
  fetchNoteAtCommit,
  type Note,
  type NoteLogsResponse,
} from '@/lib/notes-store'

const API_BASE = ''

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch(200, []))
})

describe('fetchNotes', () => {
  it('calls GET /api/notes and normalizes results', async () => {
    const serverNotes = [
      { id: '1', title: 'Note 1', content: 'Body 1', createdAt: 100, updatedAt: 200 },
      { id: '2', name: 'Note 2', body: 'Body 2', updatedAt: 300 },
    ]
    vi.stubGlobal('fetch', mockFetch(200, serverNotes))

    const result = await fetchNotes()
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Note 1')
    expect(result[1].title).toBe('Note 2')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}))
    await expect(fetchNotes()).rejects.toThrow('Request failed: 500')
  })

  it('sends correct headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchNotes()
    const call = fetchMock.mock.calls[0]
    expect(call[0]).toBe(`${API_BASE}/api/notes`)
    expect(call[1]?.headers).toEqual({ 'Content-Type': 'application/json' })
  })
})

describe('createNoteOnServer', () => {
  it('calls POST /api/notes with empty title and content', async () => {
    const created = { id: 'new-id', title: '', content: '', createdAt: 100, updatedAt: 100 }
    vi.stubGlobal('fetch', mockFetch(201, created))

    const result = await createNoteOnServer()
    expect(result.id).toBe('new-id')
  })

  it('throws on error', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}))
    await expect(createNoteOnServer()).rejects.toThrow('Request failed: 500')
  })
})

describe('updateNoteOnServer', () => {
  const note: Note = {
    id: '1',
    title: 'Updated',
    content: 'Updated content',
    createdAt: 100,
    updatedAt: 200,
  }

  it('calls PUT /api/notes/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, note))

    const result = await updateNoteOnServer('1', note)
    expect(result.title).toBe('Updated')
  })

  it('includes commit message when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(note),
    })
    vi.stubGlobal('fetch', fetchMock)

    await updateNoteOnServer('1', note, 'my commit message')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.commit).toBe('my commit message')
  })
})

describe('deleteNoteOnServer', () => {
  it('calls DELETE /api/notes/:id', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { success: true }))
    await expect(deleteNoteOnServer('1')).resolves.toBeUndefined()
  })

  it('throws on error', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}))
    await expect(deleteNoteOnServer('1')).rejects.toThrow('Request failed: 500')
  })
})

describe('fetchNoteLogs', () => {
  it('calls GET /api/notes/:id/logs', async () => {
    const response: NoteLogsResponse = {
      data: { id: '1', title: 't', content: 'c', createdAt: 1, updatedAt: 2 },
      logs: {
        all: [{ hash: 'abc123', date: '2024-01-01', message: 'initial', author_name: 'me', author_email: 'me@x.com' }],
        total: 1,
        latest: { hash: 'abc123', date: '2024-01-01', message: 'initial', author_name: 'me', author_email: 'me@x.com' },
      },
    }
    vi.stubGlobal('fetch', mockFetch(200, response))

    const result = await fetchNoteLogs('1')
    expect(result.logs.all).toHaveLength(1)
    expect(result.logs.all[0].hash).toBe('abc123')
  })
})

describe('fetchNoteAtCommit', () => {
  it('calls GET /api/notes/:id/logs/:commit', async () => {
    const server = { id: '1', title: 'Old', content: 'Old content', createdAt: 1, updatedAt: 2 }
    vi.stubGlobal('fetch', mockFetch(200, server))

    const result = await fetchNoteAtCommit('1', 'abc123')
    expect(result.title).toBe('Old')
    expect(result.content).toBe('Old content')
  })
})
