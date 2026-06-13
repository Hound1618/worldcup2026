'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { id } = useParams()
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState<any[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: u } = await supabase.from('users').select('*').eq('id', id).single()
      setUser(u)
      setAvatarUrl(u?.avatar_url ?? '')
      const { data: pts } = await supabase.from('points').select('*').eq('user_id', id)
      setPoints(pts ?? [])
      const { data: fix } = await supabase.from('fixtures').select('*')
      setFixtures(fix ?? [])
    }
    load()
    const stored = localStorage.getItem('wc2026_user')
    if (stored) setCurrentUser(JSON.parse(stored))
  }, [id])

  const canEdit = currentUser?.id === id || currentUser?.is_admin

  async function saveAvatar() {
    setSaving(true)
    await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', id)
    setUser((u: any) => ({ ...u, avatar_url: avatarUrl }))
    setEditingAvatar(false)
    setSaving(false)
  }

  const total = points.reduce((s, p) => s + (p.total_points ?? 0), 0)
  const base = points.reduce((s, p) => s + (p.base_points ?? 0), 0)
  const optional = points.reduce((s, p) => s + (p.optional_points ?? 0), 0)

  if (!user) return <div className="text-center text-gray-500 py-20">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user.avatar_url
            ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            : <span className="text-3xl font-black text-yellow-400">{user.name[0]}</span>
          }
        </div>
        <div className="flex-1">
          <div className="text-2xl font-black flex items-center gap-2">
            {user.name}
            {user.is_core && <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">Core</span>}
            {user.is_admin && <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">Admin</span>}
          </div>
          <div className="text-gray-400 text-sm">{user.email}</div>
          {canEdit && (
            <button onClick={() => setEditingAvatar(!editingAvatar)} className="text-xs text-yellow-400 mt-1 hover:underline">
              {editingAvatar ? 'Cancel' : '✏️ Change avatar'}
            </button>
          )}
        </div>
      </div>

      {editingAvatar && (
        <div className="card mb-6">
          <label className="text-sm text-gray-400 block mb-1">Avatar image URL</label>
          <div className="flex gap-2">
            <input
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
            />
            <button onClick={saveAvatar} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Paste any image link — use a direct image URL ending in .jpg or .png</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-3xl font-black text-yellow-400">{total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Points</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-black text-white">{base}</div>
          <div className="text-xs text-gray-500 mt-1">Base Points</div>
        </div>
        <div className="card text-center">
          <div className={`text-3xl font-black ${optional >= 0 ? 'text-green-400' : 'text-red-400'}`}>{optional > 0 ? '+' : ''}{optional}</div>
          <div className="text-xs text-gray-500 mt-1">Bonus</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-yellow-400 mb-4">Match Results</h2>
        {points.length === 0 ? (
          <div className="text-gray-500 text-sm">No scored games yet.</div>
        ) : (
          <div className="space-y-2">
            {points.map(p => {
              const fix = fixtures.find(f => f.id === p.fixture_id)
              return (
                <div key={p.id} className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{fix ? `${fix.home_team} vs ${fix.away_team}` : 'Match'}</div>
                    {fix && <div className="text-xs text-gray-500">{format(new Date(fix.kickoff), 'dd MMM')}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-black text-yellow-400">+{p.total_points}</div>
                    <div className="text-xs text-gray-500">w:{p.win_points} s:{p.score_points} b:{p.optional_points}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}