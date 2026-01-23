'use client'

import ReactMarkdown from 'react-markdown'

interface PreviewProps {
  content: string
}

export function MarkdownPreview({ content }: PreviewProps) {
  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900 p-4">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  )
}
