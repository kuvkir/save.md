import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'save.md',
  description: 'Simple markdown editor with tabs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100`}>
        {children}
      </body>
    </html>
  )
}
