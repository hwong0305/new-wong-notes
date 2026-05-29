import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotesSidebar } from '@/components/notes-sidebar'
import type { Note } from '@/lib/notes-store'

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: 'Test Note',
  content: 'Some content here',
  createdAt: 1000,
  updatedAt: 2000,
  ...overrides,
})

const defaultNotes = [
  makeNote({ id: '1', title: 'Alpha', content: 'First note', updatedAt: 3000 }),
  makeNote({ id: '2', title: 'Beta', content: 'Second note', updatedAt: 1000 }),
  makeNote({ id: '3', title: 'Gamma', content: 'Third note', updatedAt: 2000 }),
]

function renderSidebar(overrides: Partial<Parameters<typeof NotesSidebar>[0]> = {}) {
  const props = {
    notes: defaultNotes,
    selectedNoteId: null,
    onSelectNote: vi.fn(),
    onCreateNote: vi.fn(),
    sortBy: 'recent' as const,
    onSortChange: vi.fn(),
    ...overrides,
  }
  return render(<NotesSidebar {...props} />)
}

describe('NotesSidebar', () => {
  it('renders the title', () => {
    renderSidebar()
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('renders all notes', () => {
    renderSidebar()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
  })

  it('shows the note count', () => {
    renderSidebar()
    expect(screen.getByText('3 notes')).toBeInTheDocument()
  })

  it('shows "1 note" for a single note', () => {
    renderSidebar({ notes: [makeNote()] })
    expect(screen.getByText('1 note')).toBeInTheDocument()
  })

  it('filters by search query', () => {
    renderSidebar()
    const searchInput = screen.getByPlaceholderText('Search notes...')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
  })

  it('searches case-insensitively', () => {
    renderSidebar()
    const searchInput = screen.getByPlaceholderText('Search notes...')
    fireEvent.change(searchInput, { target: { value: 'alpha' } })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('searches within content', () => {
    renderSidebar()
    const searchInput = screen.getByPlaceholderText('Search notes...')
    fireEvent.change(searchInput, { target: { value: 'Second' } })
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
  })

  it('shows "No notes found" when search has no matches', () => {
    renderSidebar()
    const searchInput = screen.getByPlaceholderText('Search notes...')
    fireEvent.change(searchInput, { target: { value: 'zzz' } })
    expect(screen.getByText('No notes found')).toBeInTheDocument()
  })

  it('shows "No notes yet" when there are no notes', () => {
    renderSidebar({ notes: [] })
    expect(screen.getByText('No notes yet')).toBeInTheDocument()
  })

  it('calls onSelectNote when a note is clicked', () => {
    const onSelectNote = vi.fn()
    renderSidebar({ onSelectNote })
    fireEvent.click(screen.getByText('Alpha'))
    expect(onSelectNote).toHaveBeenCalledWith('1')
  })

  it('calls onCreateNote when plus button is clicked', () => {
    const onCreateNote = vi.fn()
    renderSidebar({ onCreateNote })
    fireEvent.click(screen.getByRole('button', { name: /new note/i }))
    expect(onCreateNote).toHaveBeenCalledOnce()
  })

  it('calls onCreateNote when "Create your first note" is clicked', () => {
    const onCreateNote = vi.fn()
    renderSidebar({ notes: [], onCreateNote })
    fireEvent.click(screen.getByText('Create your first note'))
    expect(onCreateNote).toHaveBeenCalledOnce()
  })

  it('highlights the selected note', () => {
    renderSidebar({ selectedNoteId: '1' })
    const noteElement = screen.getByText('Alpha').closest('div[class*="cursor-pointer"]')
    expect(noteElement?.className).toContain('bg-sidebar-primary')
  })

  it('sorts by name when sortBy is name', () => {
    renderSidebar({ sortBy: 'name' })
    const items = screen.getAllByText(/Alpha|Beta|Gamma/)
    expect(items[0]).toHaveTextContent('Alpha')
    expect(items[1]).toHaveTextContent('Beta')
    expect(items[2]).toHaveTextContent('Gamma')
  })

  it('displays the sort button with current sort label', () => {
    renderSidebar({ sortBy: 'name' })
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('displays "Recent" when sortBy is recent', () => {
    renderSidebar({ sortBy: 'recent' })
    expect(screen.getByText('Recent')).toBeInTheDocument()
  })

  it('renders note preview text', () => {
    renderSidebar()
    expect(screen.getByText('First note')).toBeInTheDocument()
  })
})
