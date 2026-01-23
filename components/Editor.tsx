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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey) {
      const textarea = e.currentTarget
      const { selectionStart, selectionEnd } = textarea

      let wrapper: string | null = null
      if (e.key === 'b') {
        wrapper = '**'
      } else if (e.key === 'i') {
        wrapper = '*'
      }

      if (wrapper) {
        e.preventDefault()
        const len = wrapper.length
        const selectedText = content.slice(selectionStart, selectionEnd)

        // Check if selection starts and ends with wrapper (selection includes wrappers)
        const startsWithWrapper = selectedText.startsWith(wrapper)
        const endsWithWrapper = selectedText.endsWith(wrapper)

        let newText: string
        let newSelectionStart: number
        let newSelectionEnd: number

        if (startsWithWrapper && endsWithWrapper && selectedText.length >= len * 2) {
          // Unwrap: remove wrappers from inside selection
          newText = selectedText.slice(len, -len)
          newSelectionStart = selectionStart
          newSelectionEnd = selectionStart + newText.length
        } else {
          // Wrap the selection
          newText = `${wrapper}${selectedText}${wrapper}`
          newSelectionStart = selectionStart
          newSelectionEnd = selectionStart + newText.length
        }

        // Use execCommand to integrate with browser's undo stack
        textarea.focus()
        document.execCommand('insertText', false, newText)

        requestAnimationFrame(() => {
          textarea.selectionStart = newSelectionStart
          textarea.selectionEnd = newSelectionEnd
          textarea.focus()
        })
      }
    }
  }, [content])

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown={handleKeyDown as any}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          minHeight: '100%',
        }}
      />
    </div>
  )
}
