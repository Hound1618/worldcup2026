import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'World Cup 2026 Predictor',
  description: 'Predict. Compete. Win.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <nav className="bg-gray-900 border-b border-yellow-500 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-2 font-bold text-yellow-400 text-lg tracking-wide">
            ⚽ WC2026
          </Link>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/" className="hover:text-yellow-400 transition-colors">Leaderboard</Link>
            <Link href="/fixtures" className="hover:text-yellow-400 transition-colors">Fixtures</Link>
            <Link href="/register" className="hover:text-yellow-400 transition-colors">Register</Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}