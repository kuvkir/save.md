'use client'

import { useEffect, useRef } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
}

export function Editor({ content, onChange }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={e => onChange(e.target.value)}
      className="flex-1 w-full p-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 resize-none outline-none font-mono text-sm leading-relaxed"
      placeholder="Start writing markdown..."
      spellCheck={false}
    />
  )
}
