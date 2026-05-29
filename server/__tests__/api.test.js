// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import supertest from 'supertest'

const mockFiles = new Map()

vi.mock('fs', () => {
  const fsActual = vi.importActual('fs')
  return {
    ...fsActual,
    readdir: (dir, cb) => cb(null, Array.from(mockFiles.keys()).map((name) => `${name}.md`)),
    readFile: (filepath, encoding, cb) => {
      const name = filepath.split('/').pop().replace('.md', '')
      const data = mockFiles.get(name)
      if (data === undefined) return cb(new Error('ENOENT'))
      if (typeof cb === 'function') cb(null, data)
    },
    writeFile: (filepath, data, cb) => {
      const name = filepath.split('/').pop().replace('.md', '')
      mockFiles.set(name, data)
      if (typeof cb === 'function') cb(null)
    },
    unlink: (_path, cb) => { if (typeof cb === 'function') cb(null) },
    existsSync: () => true,
  }
})

vi.mock('simple-git', () => {
  return {
    default: () => ({
      add: () => Promise.resolve(),
      commit: () => Promise.resolve(),
      rm: () => Promise.resolve(),
      log: () => Promise.resolve({ all: [], total: 0, latest: null }),
      checkout: () => Promise.resolve(),
    }),
  }
})

vi.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}))

let app

beforeEach(async () => {
  mockFiles.clear()
  vi.resetModules()
  const mod = await import('../app.js')
  app = mod.app
})

describe('Server API', () => {
  describe('GET /api/notes', () => {
    it('returns empty array when no notes exist', async () => {
      const res = await supertest(app).get('/api/notes')
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('returns normalized notes', async () => {
      mockFiles.set('note-1', JSON.stringify({
        id: 'note-1',
        title: 'Test',
        content: 'Hello',
        createdAt: 1000,
        updatedAt: 2000,
      }))

      const res = await supertest(app).get('/api/notes')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('Test')
    })

    it('normalizes legacy fields (name/body)', async () => {
      mockFiles.set('legacy', JSON.stringify({
        id: 'legacy',
        name: 'Legacy',
        body: 'Old body',
      }))

      const res = await supertest(app).get('/api/notes')
      expect(res.body[0].title).toBe('Legacy')
      expect(res.body[0].content).toBe('Old body')
    })
  })

  describe('GET /api/notes/:id', () => {
    it('returns a single note', async () => {
      mockFiles.set('n1', JSON.stringify({
        id: 'n1', title: 'Single', content: 'Data', createdAt: 1, updatedAt: 2,
      }))

      const res = await supertest(app).get('/api/notes/n1')
      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Single')
    })

    it('returns 500 for non-existent note', async () => {
      const res = await supertest(app).get('/api/notes/nonexistent')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /api/notes', () => {
    it('creates a new note', async () => {
      const res = await supertest(app)
        .post('/api/notes')
        .send({ title: 'New', content: 'Note' })
      expect(res.status).toBe(201)
      expect(res.body.id).toBe('mocked-uuid')
      expect(res.body.title).toBe('New')
      expect(res.body.content).toBe('Note')
      expect(res.body.createdAt).toBeDefined()
      expect(res.body.updatedAt).toBeDefined()
    })
  })

  describe('PUT /api/notes/:id', () => {
    it('updates an existing note', async () => {
      mockFiles.set('n1', JSON.stringify({
        id: 'n1', title: 'Old', content: 'Old content', createdAt: 1, updatedAt: 2,
      }))

      const res = await supertest(app)
        .put('/api/notes/n1')
        .send({ title: 'Updated', content: 'New content' })
      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Updated')
      expect(res.body.content).toBe('New content')
    })

    it('creates note if not existing via PUT', async () => {
      const res = await supertest(app)
        .put('/api/notes/new-id')
        .send({ title: 'Created', content: 'Via PUT' })
      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Created')
    })
  })

  describe('DELETE /api/notes/:id', () => {
    it('deletes a note', async () => {
      const res = await supertest(app).delete('/api/notes/n1')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/notes/:id/logs', () => {
    it('returns logs for a note', async () => {
      mockFiles.set('n1', JSON.stringify({
        id: 'n1', title: 'Test', content: 'Data', createdAt: 1, updatedAt: 2,
      }))

      const res = await supertest(app).get('/api/notes/n1/logs')
      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.logs).toBeDefined()
    })
  })

  describe('GET /api/notes/:id/logs/:commit', () => {
    it('returns note at a specific commit', async () => {
      mockFiles.set('n1', JSON.stringify({
        id: 'n1', title: 'Old Version', content: 'Old', createdAt: 1, updatedAt: 2,
      }))

      const res = await supertest(app).get('/api/notes/n1/logs/abc123')
      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Old Version')
    })
  })
})
