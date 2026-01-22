'use client'

import { useCallback } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-markdown'

interface EditorProps {
  content: string
  onChange: (content: string) => void
}

export function MarkdownEditor({ content, onChange }: EditorProps) {
  const highlight = useCallback((code: string) => {
    return Prism.highlight(code, Prism.languages.markdown, 'markdown')
  }, [])

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900">
      <Editor
        value={content}
        onValueChange={onChange}
        highlight={highlight}
        padding={16}
        placeholder="Start writing markdown..."
        className="min-h-full font-mono text-sm leading-relaxed"
        textareaClassName="outline-none"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          minHeight: '100%',
        }}
      />
    </div>
  )
}
