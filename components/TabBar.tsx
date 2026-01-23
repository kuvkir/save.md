'use client'

import { useState } from 'react'
import { Tab } from '@/lib/types'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
  onRenameTab: (id: string, title: string) => void
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab, onRenameTab }: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleDoubleClick = (tab: Tab) => {
    setEditingTabId(tab.id)
    setEditTitle(tab.title)
  }

  const handleTitleSubmit = (tabId: string) => {
    // Pass trimmed title (empty string resets to auto-extract)
    onRenameTab(tabId, editTitle.trim())
    setEditingTabId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter') {
      handleTitleSubmit(tabId)
    } else if (e.key === 'Escape') {
      setEditingTabId(null)
    }
  }

  return (
    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-2 overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer min-w-0 ${
            activeTabId === tab.id
              ? 'bg-white dark:bg-neutral-700 shadow-sm'
              : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          onClick={() => onSelectTab(tab.id)}
        >
          {editingTabId === tab.id ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => handleTitleSubmit(tab.id)}
              onKeyDown={e => handleKeyDown(e, tab.id)}
              className="bg-transparent outline-none border-b border-blue-500 w-24 text-sm"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className="truncate max-w-32 text-sm"
              onDoubleClick={() => handleDoubleClick(tab)}
            >
              {tab.title}
            </span>
          )}
          <button
            onClick={e => {
              e.stopPropagation()
              onCloseTab(tab.id)
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded p-0.5 transition-opacity"
            aria-label="Close tab"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={onNewTab}
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        aria-label="New tab"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
