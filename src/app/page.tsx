'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: allUsers, error: userError } = await supabase.from('users').select('*').order('name')
const { data: allPoints, error: pointsError } = await supabase.from('points').select('*')

console.log('Users:', allUsers, 'Error:', userError)
console.log('Points:', allPoints, 'Error:', pointsError)

if (!allUsers) return

      const ranked = allUsers.map(u => {
        const pts = allPoints?.filter(p => p.user_id === u.id) ?? []
        const total = pts.reduce((s, p) => s + (p.total_points ?? 0), 0)
        const base = pts.reduce((s, p) => s + (p.base_points ?? 0), 0)
        const optional = pts.reduce((s, p) => s + (p.optional_points ?? 0), 0)
        return { ...u, total, base, optional, gamesPlayed: pts.length }
      }).sort((a, b) => b.total - a.total)

      setUsers(ranked)
      setLoading(false)
    }
    load()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-yellow-400 tracking-tight">⚽ World Cup 2026</h1>
        <p className="text-gray-400 mt-1">Prediction League</p>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Points System</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          <span className="bg-gray-800 px-3 py-1 rounded-full">✅ Correct winner <strong className="text-yellow-400">+1</strong></span>
          <span className="bg-gray-800 px-3 py-1 rounded-full">🎯 Exact score <strong className="text-yellow-400">+3</strong></span>
          <span className="bg-gray-800 px-3 py-1 rounded-full">⭐ Optional hit <strong className="text-yellow-400">+5</strong></span>
          <span className="bg-gray-800 px-3 py-1 rounded-full">❌ Optional miss <strong className="text-red-400">-1</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading leaderboard...</div>
      ) : (
        <div className="space-y-3">
          {users.map((u, i) => (
            <Link href={`/profile/${u.id}`} key={u.id}>
              <div className={`card flex items-center gap-4 hover:border-yellow-500 transition-colors cursor-pointer ${i === 0 ? 'border-yellow-500 bg-yellow-950/20' : ''}`}>
                <div className="text-2xl w-8 text-center">{medals[i] ?? `#${i + 1}`}</div>
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                    : <span className="text-lg font-bold text-yellow-400">{u.name[0]}</span>
                  }
                </div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {u.name}
                    {u.is_core && <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">Core</span>}
                    {u.is_admin && <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">Admin</span>}
                  </div>
                  <div className="text-xs text-gray-500">{u.gamesPlayed} predictions made</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-yellow-400">{u.total}</div>
                  <div className="text-xs text-gray-500">base: {u.base} | bonus: {u.optional}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}