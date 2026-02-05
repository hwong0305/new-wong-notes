
import { useMemo } from "react"

interface MarkdownPreviewProps {
  content: string
}

// Simple markdown parser for common elements
function parseMarkdown(text: string): string {
  if (!text) return ""

  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Code blocks with language
  html = html.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_, lang, code) =>
      `<pre class="code-block" data-lang="${lang || ""}"><code>${code.trim()}</code></pre>`
  )

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="inline-code">$1</code>'
  )

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="heading h6">$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="heading h5">$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="heading h4">$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="heading h3">$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="heading h2">$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="heading h1">$1</h1>')

  // Bold and Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>")
  html = html.replace(/_(.+?)_/g, "<em>$1</em>")

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>")

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="link" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="image" />'
  )

  // Blockquotes
  html = html.replace(
    /^>\s+(.+)$/gm,
    '<blockquote class="blockquote">$1</blockquote>'
  )

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="hr" />')

  // Unordered lists
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li class="list-item">$1</li>')
  html = html.replace(
    /(<li class="list-item">.*<\/li>\n?)+/g,
    '<ul class="unordered-list">$&</ul>'
  )

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="list-item-ordered">$1</li>')
  html = html.replace(
    /(<li class="list-item-ordered">.*<\/li>\n?)+/g,
    '<ol class="ordered-list">$&</ol>'
  )

  // Paragraphs (lines not already processed)
  html = html
    .split("\n\n")
    .map((block) => {
      if (
        block.startsWith("<h") ||
        block.startsWith("<ul") ||
        block.startsWith("<ol") ||
        block.startsWith("<blockquote") ||
        block.startsWith("<pre") ||
        block.startsWith("<hr")
      ) {
        return block
      }
      const trimmed = block.trim()
      if (!trimmed) return ""
      // Check if it contains block elements
      if (/<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(trimmed)) {
        return trimmed
      }
      return `<p class="paragraph">${trimmed.replace(/\n/g, "<br />")}</p>`
    })
    .join("\n")

  return html
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = useMemo(() => parseMarkdown(content), [content])

  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Start typing to see the preview...</p>
      </div>
    )
  }

  return (
    <div
      className="prose-custom"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
