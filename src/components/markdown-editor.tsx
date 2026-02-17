import { Note } from "@/lib/notes-store";
import { Button } from "@/components/ui/button";
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
  Edit3,
  Eye,
  SplitSquareHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MarkdownPreview } from "./markdown-preview";

interface MarkdownEditorProps {
  note: Note;
  isEditing: boolean;
  draftTitle: string;
  draftContent: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
}

export function MarkdownEditor({
  note,
  isEditing,
  draftTitle,
  draftContent,
  onEdit,
  onSave,
  onCancel,
  onContentChange,
  onTitleChange,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">(
    "preview",
  );

  useEffect(() => {
    if (isEditing) {
      setViewMode("edit");
    } else {
      setViewMode("preview");
    }
  }, [isEditing]);

  const insertText = useCallback(
    (before: string, after: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = draftContent.substring(start, end);
      const newContent =
        draftContent.substring(0, start) +
        before +
        selectedText +
        after +
        draftContent.substring(end);

      onContentChange(newContent);

      // Set cursor position after the operation
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [draftContent, onContentChange],
  );

  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = draftContent.lastIndexOf("\n", start - 1) + 1;
      const newContent =
        draftContent.substring(0, lineStart) +
        prefix +
        draftContent.substring(lineStart);

      onContentChange(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length,
        );
      }, 0);
    },
    [draftContent, onContentChange],
  );

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
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Title input */}
      <div className="border-b border-border px-6 py-4">
        <input
          type="text"
          value={isEditing ? draftTitle : note.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Note title..."
          className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
          readOnly={!isEditing}
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
                disabled={!isEditing}
              >
                <button.icon className="h-4 w-4" />
                <span className="sr-only">{button.label}</span>
              </Button>
            ),
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  onClick={onSave}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={onEdit}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <Button
              variant={viewMode === "split" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={() => {
                if (!isEditing) onEdit();
                setViewMode("split");
              }}
            >
              <SplitSquareHorizontal className="h-3.5 w-3.5" />
              Split
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isEditing && viewMode === "edit" && (
          <textarea
            ref={textareaRef}
            value={draftContent}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Start writing your note..."
            className="h-full w-full resize-none bg-background p-6 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            spellCheck={false}
          />
        )}
        {isEditing && viewMode === "preview" && (
          <div className="h-full overflow-auto p-6">
            <MarkdownPreview content={draftContent} />
          </div>
        )}
        {isEditing && viewMode === "split" && (
          <div className="flex h-full divide-x divide-border">
            <div className="w-1/2 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={draftContent}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Start writing your note..."
                className="h-full w-full resize-none bg-background p-6 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                spellCheck={false}
              />
            </div>
            <div className="w-1/2 overflow-auto p-6">
              <MarkdownPreview content={draftContent} />
            </div>
          </div>
        )}
        {!isEditing && (
          <div className="h-full overflow-auto p-6">
            <MarkdownPreview content={note.content} />
          </div>
        )}
      </div>
    </div>
  );
}
