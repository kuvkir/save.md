'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
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

// Detect if running on Mac
function useIsMac() {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
  }, [])
  return isMac
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
  const isMac = useIsMac()
  // Track cursor position for undo/redo
  const lastCursorRef = useRef({ start: 0, end: 0 })

  const highlight = useCallback((code: string) => {
    return highlightWithCodeBlocks(code)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Use metaKey on Mac, ctrlKey on Windows/Linux
    const modKey = isMac ? e.metaKey : e.ctrlKey
    if (!modKey) return

    const textarea = e.currentTarget
    const { selectionStart, selectionEnd } = textarea

    // Handle undo/redo - preserve cursor position
    if (e.key === 'z') {
      const cursorPos = { start: selectionStart, end: selectionEnd }
      requestAnimationFrame(() => {
        // Restore cursor to reasonable position after undo
        const newLen = textarea.value.length
        const safeStart = Math.min(cursorPos.start, newLen)
        const safeEnd = Math.min(cursorPos.end, newLen)
        textarea.selectionStart = safeStart
        textarea.selectionEnd = safeEnd
      })
      return // Let the default undo happen
    }

    // Helper to toggle wrap/unwrap for inline formatting
    const toggleWrap = (wrapper: string) => {
      e.preventDefault()
      const len = wrapper.length
      const selectedText = content.slice(selectionStart, selectionEnd)
      const before = content.slice(selectionStart - len, selectionStart)
      const after = content.slice(selectionEnd, selectionEnd + len)
      const isWrapped = before === wrapper && after === wrapper

      if (isWrapped) {
        textarea.setSelectionRange(selectionStart - len, selectionEnd + len)
        document.execCommand('insertText', false, selectedText)
        requestAnimationFrame(() => {
          textarea.selectionStart = selectionStart - len
          textarea.selectionEnd = selectionEnd - len
          textarea.focus()
        })
      } else {
        document.execCommand('insertText', false, `${wrapper}${selectedText}${wrapper}`)
        requestAnimationFrame(() => {
          textarea.selectionStart = selectionStart + len
          textarea.selectionEnd = selectionEnd + len
          textarea.focus()
        })
      }
    }

    // Helper to toggle line prefix (for lists)
    const toggleLinePrefix = (prefix: string) => {
      e.preventDefault()
      // Find the start of the current line
      const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1
      const lineEnd = content.indexOf('\n', selectionStart)
      const actualLineEnd = lineEnd === -1 ? content.length : lineEnd
      const line = content.slice(lineStart, actualLineEnd)

      // Check if line already has this prefix
      if (line.startsWith(prefix)) {
        // Remove prefix
        textarea.setSelectionRange(lineStart, lineStart + prefix.length)
        document.execCommand('insertText', false, '')
        requestAnimationFrame(() => {
          textarea.selectionStart = selectionStart - prefix.length
          textarea.selectionEnd = selectionEnd - prefix.length
          textarea.focus()
        })
      } else {
        // Add prefix at line start
        textarea.setSelectionRange(lineStart, lineStart)
        document.execCommand('insertText', false, prefix)
        requestAnimationFrame(() => {
          textarea.selectionStart = selectionStart + prefix.length
          textarea.selectionEnd = selectionEnd + prefix.length
          textarea.focus()
        })
      }
    }

    // Bold: Cmd+B / Ctrl+B
    if (e.key === 'b' && !e.shiftKey) {
      toggleWrap('**')
      return
    }

    // Italic: Cmd+I / Ctrl+I
    if (e.key === 'i' && !e.shiftKey) {
      toggleWrap('*')
      return
    }

    // Inline code: Cmd+E / Ctrl+E
    if (e.key === 'e' && !e.shiftKey) {
      toggleWrap('`')
      return
    }

    // Link: Cmd+K / Ctrl+K
    if (e.key === 'k' && !e.shiftKey) {
      e.preventDefault()

      let linkText: string
      let replaceStart = selectionStart
      let replaceEnd = selectionEnd

      if (selectionStart === selectionEnd) {
        // No selection - find word under cursor
        const wordChars = /[a-zA-Z0-9_-]/
        let wordStart = selectionStart
        let wordEnd = selectionStart

        // Find word start
        while (wordStart > 0 && wordChars.test(content[wordStart - 1])) {
          wordStart--
        }
        // Find word end
        while (wordEnd < content.length && wordChars.test(content[wordEnd])) {
          wordEnd++
        }

        linkText = content.slice(wordStart, wordEnd) || 'text'
        replaceStart = wordStart
        replaceEnd = wordEnd
      } else {
        linkText = content.slice(selectionStart, selectionEnd)
      }

      // Select the word/text to replace, then insert link
      textarea.setSelectionRange(replaceStart, replaceEnd)
      const newText = `[${linkText}](url)`
      document.execCommand('insertText', false, newText)

      // Select "url"
      requestAnimationFrame(() => {
        const urlStart = replaceStart + linkText.length + 3 // [text](
        textarea.selectionStart = urlStart
        textarea.selectionEnd = urlStart + 3 // "url"
        textarea.focus()
      })
      return
    }

    // Ordered list: Cmd+Shift+7 / Ctrl+Shift+7
    if (e.key === '7' && e.shiftKey) {
      toggleLinePrefix('1. ')
      return
    }

    // Unordered list: Cmd+Shift+8 / Ctrl+Shift+8
    if (e.key === '8' && e.shiftKey) {
      toggleLinePrefix('- ')
      return
    }
  }, [content, isMac])

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
