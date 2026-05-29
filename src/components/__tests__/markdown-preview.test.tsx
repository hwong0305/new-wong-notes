import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownPreview, parseMarkdown } from '@/components/markdown-preview'

describe('parseMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(parseMarkdown('')).toBe('')
  })

  it('escapes HTML tags', () => {
    const result = parseMarkdown('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('parses h1-h6 headers', () => {
    expect(parseMarkdown('# H1')).toContain('<h1')
    expect(parseMarkdown('## H2')).toContain('<h2')
    expect(parseMarkdown('### H3')).toContain('<h3')
    expect(parseMarkdown('#### H4')).toContain('<h4')
    expect(parseMarkdown('##### H5')).toContain('<h5')
    expect(parseMarkdown('###### H6')).toContain('<h6')
  })

  it('parses bold text (** **)', () => {
    const result = parseMarkdown('**bold**')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('parses italic text (* *)', () => {
    const result = parseMarkdown('*italic*')
    expect(result).toContain('<em>italic</em>')
  })

  it('parses bold italic (*** ***)', () => {
    const result = parseMarkdown('***bold italic***')
    expect(result).toContain('<strong><em>bold italic</em></strong>')
  })

  it('parses bold with underscores', () => {
    const result = parseMarkdown('__bold__')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('parses italic with underscores', () => {
    const result = parseMarkdown('_italic_')
    expect(result).toContain('<em>italic</em>')
  })

  it('parses strikethrough', () => {
    const result = parseMarkdown('~~strike~~')
    expect(result).toContain('<del>strike</del>')
  })

  it('parses inline code', () => {
    const result = parseMarkdown('use `code` here')
    expect(result).toContain('<code class="inline-code">code</code>')
  })

  it('parses code blocks', () => {
    const result = parseMarkdown('```\nconst x = 1\n```')
    expect(result).toContain('<pre class="code-block"')
    expect(result).toContain('const x = 1')
  })

  it('parses code blocks with language', () => {
    const result = parseMarkdown('```js\nconsole.log("hi")\n```')
    expect(result).toContain('data-lang="js"')
    expect(result).toContain('console.log')
  })

  it('parses links', () => {
    const result = parseMarkdown('[click](https://example.com)')
    expect(result).toContain('<a href="https://example.com"')
    expect(result).toContain('>click</a>')
  })

  it('parses images', () => {
    const result = parseMarkdown('![alt](img.png)')
    expect(result).toContain('<img src="img.png" alt="alt"')
  })

  it('parses blockquotes', () => {
    const result = parseMarkdown('> quote')
    expect(result).toContain('<blockquote')
    expect(result).toContain('quote')
  })

  it('parses horizontal rules', () => {
    const result = parseMarkdown('---')
    expect(result).toContain('<hr')
  })

  it('parses unordered lists', () => {
    const result = parseMarkdown('- item1\n- item2')
    expect(result).toContain('<ul')
    expect(result).toContain('<li')
    expect(result).toContain('item1')
    expect(result).toContain('item2')
  })

  it('parses ordered lists', () => {
    const result = parseMarkdown('1. first\n2. second')
    expect(result).toContain('<ol')
    expect(result).toContain('first')
    expect(result).toContain('second')
  })

  it('wraps paragraphs in <p> tags', () => {
    const result = parseMarkdown('Hello world')
    expect(result).toContain('<p class="paragraph">Hello world</p>')
  })

  it('handles mixed content', () => {
    const md = '# Title\n\n**bold** and *italic*'
    const result = parseMarkdown(md)
    expect(result).toContain('<h1')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
  })
})

describe('MarkdownPreview component', () => {
  it('renders parsed markdown', () => {
    render(<MarkdownPreview content="# Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows placeholder when content is empty', () => {
    render(<MarkdownPreview content="" />)
    expect(screen.getByText('Start typing to see the preview...')).toBeInTheDocument()
  })

  it('shows placeholder for whitespace-only content', () => {
    render(<MarkdownPreview content="   " />)
    expect(screen.getByText('Start typing to see the preview...')).toBeInTheDocument()
  })
})
