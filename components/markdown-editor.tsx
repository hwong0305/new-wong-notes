"use client"

import { Note } from "@/lib/notes-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link,
  ImageIcon,
  FileCode,
  Eye,
  Edit3,
  SplitSquareHorizontal,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { MarkdownPreview } from "./markdown-preview"

interface MarkdownEditorProps {
  note: Note
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
}

type ViewMode = "edit" | "preview" | "split"

export function MarkdownEditor({ note, onContentChange, onTitleChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("edit")

  const insertText = useCallback(
    (before: string, after: string = "") => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = note.content.substring(start, end)
      const newContent =
        note.content.substring(0, start) +
        before +
        selectedText +
        after +
        note.content.substring(end)

      onContentChange(newContent)

      // Set cursor position after the operation
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + before.length + selectedText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [note.content, onContentChange]
  )

  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const lineStart = note.content.lastIndexOf("\n", start - 1) + 1
      const newContent =
        note.content.substring(0, lineStart) +
        prefix +
        note.content.substring(lineStart)

      onContentChange(newContent)

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length
        )
      }, 0)
    },
    [note.content, onContentChange]
  )

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertText("**", "**"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertText("_", "_"),
    },
    {
      icon: Code,
      label: "Inline code",
      action: () => insertText("`", "`"),
    },
    { type: "separator" as const },
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertAtLineStart("# "),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => insertAtLineStart("## "),
    },
    { type: "separator" as const },
    {
      icon: List,
      label: "Bullet list",
      action: () => insertAtLineStart("- "),
    },
    {
      icon: ListOrdered,
      label: "Numbered list",
      action: () => insertAtLineStart("1. "),
    },
    {
      icon: Quote,
      label: "Quote",
      action: () => insertAtLineStart("> "),
    },
    { type: "separator" as const },
    {
      icon: Link,
      label: "Link",
      action: () => insertText("[", "](url)"),
    },
    {
      icon: ImageIcon,
      label: "Image",
      action: () => insertText("![alt](", ")"),
    },
    {
      icon: FileCode,
      label: "Code block",
      action: () => insertText("```\n", "\n```"),
    },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Title input */}
      <div className="border-b border-border px-6 py-4">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Note title..."
          className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) =>
            button.type === "separator" ? (
              <div
                key={index}
                className="mx-1 h-6 w-px bg-border"
                aria-hidden="true"
              />
            ) : (
              <Button
                key={button.label}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={button.action}
                title={button.label}
                disabled={viewMode === "preview"}
              >
                <button.icon className="h-4 w-4" />
                <span className="sr-only">{button.label}</span>
              </Button>
            )
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Button
            variant={viewMode === "edit" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setViewMode("edit")}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setViewMode("split")}
          >
            <SplitSquareHorizontal className="h-3.5 w-3.5" />
            Split
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === "edit" && (
          <textarea
            ref={textareaRef}
            value={note.content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Start writing your note..."
            className="h-full w-full resize-none bg-background p-6 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            spellCheck={false}
          />
        )}
        {viewMode === "preview" && (
          <div className="h-full overflow-auto p-6">
            <MarkdownPreview content={note.content} />
          </div>
        )}
        {viewMode === "split" && (
          <div className="flex h-full divide-x divide-border">
            <div className="w-1/2 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={note.content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Start writing your note..."
                className="h-full w-full resize-none bg-background p-6 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                spellCheck={false}
              />
            </div>
            <div className="w-1/2 overflow-auto p-6">
              <MarkdownPreview content={note.content} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
