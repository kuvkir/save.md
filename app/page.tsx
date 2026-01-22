'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TabBar } from '@/components/TabBar'
import { MarkdownEditor } from '@/components/Editor'
import { Tab } from '@/lib/types'

const STORAGE_KEY = 'markdown-tabs'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function createNewTab(): Tab {
  const now = Date.now()
  return {
    id: generateId(),
    title: 'Untitled',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim()
  if (!firstLine) return 'Untitled'
  // Remove markdown heading prefix
  const withoutHash = firstLine.replace(/^#+\s*/, '')
  // Truncate if too long
  return withoutHash.slice(0, 50) || 'Untitled'
}

export default function Home() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.tabs && data.tabs.length > 0) {
          setTabs(data.tabs)
          setActiveTabId(data.activeTabId || data.tabs[0].id)
        } else {
          const newTab = createNewTab()
          setTabs([newTab])
          setActiveTabId(newTab.id)
        }
      } else {
        const newTab = createNewTab()
        setTabs([newTab])
        setActiveTabId(newTab.id)
      }
    } catch {
      const newTab = createNewTab()
      setTabs([newTab])
      setActiveTabId(newTab.id)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage (debounced)
  const saveToStorage = useCallback((tabsToSave: Tab[], activeId: string | null) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          tabs: tabsToSave,
          activeTabId: activeId,
        }))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }, 300)
  }, [])

  // Save whenever tabs or activeTabId changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(tabs, activeTabId)
    }
  }, [tabs, activeTabId, isLoaded, saveToStorage])

  const handleNewTab = useCallback(() => {
    const newTab = createNewTab()
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [])

  const handleCloseTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id)
      if (newTabs.length === 0) {
        const newTab = createNewTab()
        setActiveTabId(newTab.id)
        return [newTab]
      }
      if (activeTabId === id) {
        const closedIndex = prev.findIndex(t => t.id === id)
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1)
        setActiveTabId(newTabs[newActiveIndex].id)
      }
      return newTabs
    })
  }, [activeTabId])

  const handleRenameTab = useCallback((id: string, title: string) => {
    setTabs(prev => prev.map(t =>
      t.id === id ? { ...t, title, updatedAt: Date.now() } : t
    ))
  }, [])

  const handleContentChange = useCallback((content: string) => {
    if (!activeTabId) return
    const title = extractTitle(content)
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, content, title, updatedAt: Date.now() } : t
    ))
  }, [activeTabId])

  const activeTab = tabs.find(t => t.id === activeTabId)

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    )
  }

  return (
    <main className="h-screen flex flex-col">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        onRenameTab={handleRenameTab}
      />
      {activeTab && (
        <MarkdownEditor
          content={activeTab.content}
          onChange={handleContentChange}
        />
      )}
    </main>
  )
}
