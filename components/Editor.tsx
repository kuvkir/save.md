'use client'

import { useCallback } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markdown'

interface EditorProps {
  content: string
  onChange: (content: string) => void
}

const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightWithCodeBlocks(code: string): string {
  const fencedBlockRegex = /^(```(\w*)\n)([\s\S]*?)(^```$)/gm
  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = fencedBlockRegex.exec(code)) !== null) {
    const [fullMatch, opener, lang, codeContent, closer] = match
    const matchStart = match.index

    // Highlight markdown before this code block
    if (matchStart > lastIndex) {
      const before = code.slice(lastIndex, matchStart)
      result += Prism.highlight(before, Prism.languages.markdown, 'markdown')
    }

    // Highlight the code block
    const langKey = LANG_ALIASES[lang] || lang
    const grammar = Prism.languages[langKey]

    result += `<span class="token code-block">`
    result += `<span class="token punctuation">${escapeHtml(opener.trimEnd())}</span>\n`

    if (grammar) {
      result += Prism.highlight(codeContent.slice(0, -1), grammar, langKey)
    } else {
      result += escapeHtml(codeContent.slice(0, -1))
    }

    result += `\n<span class="token punctuation">${escapeHtml(closer)}</span>`
    result += `</span>`

    lastIndex = matchStart + fullMatch.length
  }

  // Highlight remaining markdown after last code block
  if (lastIndex < code.length) {
    result += Prism.highlight(code.slice(lastIndex), Prism.languages.markdown, 'markdown')
  }

  return result
}

export function MarkdownEditor({ content, onChange }: EditorProps) {
  const highlight = useCallback((code: string) => {
    return highlightWithCodeBlocks(code)
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
