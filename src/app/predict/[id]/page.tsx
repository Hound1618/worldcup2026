'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

const OPTIONAL_TYPES = ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD']

export default function PredictPage() {
  const { id } = useParams()
  const router = useRouter()
  const [fixture, setFixture] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [winner, setWinner] = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [optionals, setOptionals] = useState<{ type: string; player: string; team: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  const isAdmin = currentUser?.is_admin
  const isLocked = fixture && (
  fixture.status === 'FINISHED' || 
  fixture.status === 'IN_PLAY' || 
  new Date(fixture.kickoff) < new Date()
)

  useEffect(() => {
    async function load() {
      const { data: fix } = await supabase.from('fixtures').select('*').eq('id', id).single()
      setFixture(fix)
      const { data: u } = await supabase.from('users').select('*').order('name')
      setUsers(u ?? [])
      const { data: preds } = await supabase.from('predictions').select('*, users(name)').eq('fixture_id', id)
      setPredictions(preds ?? [])
      const { data: ev } = await supabase.from('match_events').select('*').eq('fixture_id', id)
      setEvents(ev ?? [])
    }
    load()
    const stored = localStorage.getItem('wc2026_user')
    if (stored) {
      const u = JSON.parse(stored)
      setCurrentUser(u)
      setSelectedUserId(u.id)
    }
  }, [id])

  async function loginAsUser(email: string) {
    const { data } = await supabase.from('users').select('*').eq('email', email).single()
    if (data) {
      setCurrentUser(data)
      setSelectedUserId(data.id)
      localStorage.setItem('wc2026_user', JSON.stringify(data))
    } else {
      setError('No user found with that email')
    }
  }

  function addOptional() {
    setOptionals([...optionals, { type: 'GOAL', player: '', team: '' }])
  }

  function updateOptional(i: number, field: string, val: string) {
    const updated = [...optionals]
    updated[i] = { ...updated[i], [field]: val }
    setOptionals(updated)
  }

  function removeOptional(i: number) {
    setOptionals(optionals.filter((_, idx) => idx !== i))
  }

  async function submit() {
    if (!currentUser) { setError('Please identify yourself first'); return }
    if (!winner) { setError('Select a winner'); return }
    if (homeScore === '' || awayScore === '') { setError('Enter predicted score'); return }
    setLoading(true); setError('')

    const targetUserId = isAdmin ? selectedUserId : currentUser.id

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: targetUserId,
        fixture_id: id,
        predicted_winner: winner,
        predicted_home_score: parseInt(homeScore),
        predicted_away_score: parseInt(awayScore),
        optional_predictions: optionals.filter(o => o.player.trim()),
        admin_override: isAdmin,
      })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to save'); setLoading(false); return }
    setSaved(true)
    setLoading(false)
    const { data: preds } = await supabase.from('predictions').select('*, users(name)').eq('fixture_id', id)
    setPredictions(preds ?? [])
  }

  if (!fixture) return <div className="text-center text-gray-500 py-20">Loading...</div>

  const isPastKickoff = new Date(fixture.kickoff) < new Date()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Fixture Header */}
      <div className="card mb-6 text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
          {fixture.stage?.replace(/_/g, ' ')} {fixture.group_name ? `· ${fixture.group_name}` : ''}
        </div>
        <div className="text-2xl font-black mb-1">
          {fixture.home_team} <span className="text-yellow-400">vs</span> {fixture.away_team}
        </div>
        <div className="text-sm text-gray-400">
          {format(new Date(fixture.kickoff), 'dd MMM yyyy, HH:mm')}
        </div>
        {fixture.status === 'FINISHED' && (
          <div className="mt-3 text-3xl font-black text-green-400">
            {fixture.home_score} – {fixture.away_score}
          </div>
        )}
        {fixture.status === 'IN_PLAY' && (
          <div className="mt-2 text-yellow-400 font-bold animate-pulse">🔴 LIVE</div>
        )}
      </div>

      {/* Who Are You */}
      {!currentUser && (
        <div className="card mb-6">
          <h2 className="font-bold text-yellow-400 mb-3">Who are you?</h2>
          <p className="text-sm text-gray-400 mb-3">Enter your email to identify yourself</p>
          <div className="flex gap-2">
            <input
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500 text-sm"
            />
            <button onClick={() => loginAsUser(adminEmail)} className="btn-primary text-sm">Go</button>
          </div>
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        </div>
      )}

      {currentUser && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            Predicting as <strong className="text-white">{currentUser.name}</strong>
            {isAdmin && <span className="ml-2 text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">Admin</span>}
          </span>
          <button onClick={() => { setCurrentUser(null); localStorage.removeItem('wc2026_user') }} className="text-xs text-gray-500 hover:text-white">Switch user</button>
        </div>
      )}

      {/* Admin: pick who you're predicting for */}
      {isAdmin && (
        <div className="card mb-4 border-red-800">
          <div className="text-xs text-red-400 uppercase tracking-widest mb-2">Admin Override</div>
          <label className="text-sm text-gray-400 block mb-1">Enter prediction for:</label>
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
          >
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">As admin you can enter predictions for any user, even for past games.</p>
        </div>
      )}

      {/* Prediction Form */}
      {(currentUser && (!isLocked || isAdmin)) && (
        <div className="card mb-6">
          <h2 className="font-bold text-yellow-400 mb-4">
            {isLocked && isAdmin ? '⚠️ Admin Override — Match Already Started' : 'Your Prediction'}
          </h2>

          {/* Winner */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Who wins?</label>
            <div className="flex gap-2">
              {[
                { val: 'HOME', label: fixture.home_team },
                { val: 'DRAW', label: 'Draw' },
                { val: 'AWAY', label: fixture.away_team },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setWinner(opt.val)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${winner === opt.val ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-gray-800 border-gray-700 text-white hover:border-yellow-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Predicted Score</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">{fixture.home_team}</div>
                <input
                  type="number" min="0" max="20"
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="text-gray-500 font-bold text-xl">–</div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">{fixture.away_team}</div>
                <input
                  type="number" min="0" max="20"
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Optional Predictions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Optional Predictions <span className="text-xs">(+5 hit / -1 miss)</span></label>
              <button onClick={addOptional} className="text-xs btn-secondary">+ Add</button>
            </div>
            {optionals.map((opt, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select
                  value={opt.type}
                  onChange={e => updateOptional(i, 'type', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  {OPTIONAL_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <input
                  value={opt.player}
                  onChange={e => updateOptional(i, 'player', e.target.value)}
                  placeholder="Player name"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
                <select
                  value={opt.team}
                  onChange={e => updateOptional(i, 'team', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                >
                  <option value="">Team</option>
                  <option value={fixture.home_team}>{fixture.home_team}</option>
                  <option value={fixture.away_team}>{fixture.away_team}</option>
                </select>
                <button onClick={() => removeOptional(i)} className="text-red-400 hover:text-red-300 text-lg leading-none">×</button>
              </div>
            ))}
          </div>

          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
          {saved && <div className="text-green-400 text-sm mb-3">✅ Prediction saved!</div>}

          <button onClick={submit} disabled={loading} className="btn-primary w-full">
            {loading ? 'Saving...' : 'Save Prediction'}
          </button>
        </div>
      )}

      {isLocked && !isAdmin && currentUser && (
        <div className="card mb-6 text-center text-gray-500">
          🔒 Predictions are locked — match has started or already finished.
        </div>
      )}

      {/* All Predictions */}
      <div className="card">
        <h2 className="font-bold text-yellow-400 mb-4">All Predictions</h2>
        {predictions.length === 0 ? (
          <div className="text-gray-500 text-sm">No predictions yet.</div>
        ) : (
          <div className="space-y-3">
            {predictions.map(p => (
              <div key={p.id} className="bg-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{p.users?.name}</span>
                  <span className="text-xs text-gray-500">
                    {p.predicted_winner === 'HOME' ? fixture.home_team : p.predicted_winner === 'AWAY' ? fixture.away_team : 'Draw'}
                  </span>
                </div>
                <div className="text-lg font-black">
                  {p.predicted_home_score} – {p.predicted_away_score}
                </div>
                {p.optional_predictions?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.optional_predictions.map((o: any, i: number) => (
                      <span key={i} className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                        {o.type.replace('_', ' ')}: {o.player}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Events */}
      {events.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-bold text-yellow-400 mb-4">Match Events</h2>
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-8 text-right">{e.minute}'</span>
                <span>{e.event_type === 'GOAL' ? '⚽' : e.event_type === 'ASSIST' ? '🅰️' : e.event_type === 'YELLOW_CARD' ? '🟨' : '🟥'}</span>
                <span>{e.player_name}</span>
                <span className="text-gray-500 text-xs">{e.team}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}