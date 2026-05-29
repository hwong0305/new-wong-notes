import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VersionHistory } from '@/components/version-history'
import type { Note, GitCommit } from '@/lib/notes-store'

const mockNote: Note = {
  id: 'note-1',
  title: 'My Note',
  content: 'Hello',
  createdAt: 1000,
  updatedAt: 2000,
}

const mockCommits: GitCommit[] = [
  { hash: 'abc123def456', date: '2024-01-01T12:00:00Z', message: 'First commit', author_name: 'me', author_email: 'me@x.com' },
  { hash: '789012345678', date: '2024-01-02T12:00:00Z', message: 'Second commit', author_name: 'me', author_email: 'me@x.com' },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('VersionHistory', () => {
  it('shows loading state initially when open', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => new Promise(() => {}),
    }))

    render(
      <VersionHistory
        note={mockNote}
        open={true}
        onOpenChange={vi.fn()}
        onRevert={vi.fn()}
      />
    )
    expect(screen.getByText('Loading history...')).toBeInTheDocument()
  })

  it('renders version history dialog when open', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        data: mockNote,
        logs: { all: mockCommits, total: 2, latest: mockCommits[0] },
      }),
    }))

    render(
      <VersionHistory
        note={mockNote}
        open={true}
        onOpenChange={vi.fn()}
        onRevert={vi.fn()}
      />
    )

    expect(screen.getByText('Version History')).toBeInTheDocument()
    expect(screen.getByText(/Browse and restore previous versions/)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('First commit')).toBeInTheDocument()
      expect(screen.getByText('Second commit')).toBeInTheDocument()
    })
  })

  it('shows abbreviated commit hashes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        data: mockNote,
        logs: { all: mockCommits, total: 2, latest: mockCommits[0] },
      }),
    }))

    render(
      <VersionHistory
        note={mockNote}
        open={true}
        onOpenChange={vi.fn()}
        onRevert={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('abc123d')).toBeInTheDocument()
    })
  })

  it('calls onRevert when revert button is clicked', async () => {
    const onRevert = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: mockNote,
          logs: { all: mockCommits, total: 2, latest: mockCommits[0] },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockNote),
      }))

    const user = userEvent.setup()
    render(
      <VersionHistory
        note={mockNote}
        open={true}
        onOpenChange={onOpenChange}
        onRevert={onRevert}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('First commit')).toBeInTheDocument()
    })

    const revertButtons = screen.getAllByText('Revert')
    await user.click(revertButtons[0])

    await waitFor(() => {
      expect(onRevert).toHaveBeenCalledWith(mockNote, 'abc123def456')
    })
  })

  it('shows "No version history found" when there are no commits', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        data: mockNote,
        logs: { all: [], total: 0, latest: null },
      }),
    }))

    render(
      <VersionHistory
        note={mockNote}
        open={true}
        onOpenChange={vi.fn()}
        onRevert={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No version history found')).toBeInTheDocument()
    })
  })

  it('does not fetch when dialog is closed', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(
      <VersionHistory
        note={mockNote}
        open={false}
        onOpenChange={vi.fn()}
        onRevert={vi.fn()}
      />
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
