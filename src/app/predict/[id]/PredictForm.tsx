'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = { id: string; name: string }
type Fixture = { id: string; home_team: string; away_team: string; kickoff: string; status: string }

export default function PredictForm({ fixture, users }: { fixture: Fixture; users: User[] }) {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [winner, setWinner] = useState('HOME')
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [optType, setOptType] = useState('GOAL')
  const [optPlayer, setOptPlayer] = useState('')
  const [optTeam, setOptTeam] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const locked = fixture.status !== 'SCHEDULED' || new Date(fixture.kickoff) < new Date()

  async function submit() {
    if (!userId) {
      setStatus('Pick a contestant first.')
      return
    }
    const optional_predictions = optPlayer.trim()
      ? [{ type: optType, player: optPlayer.trim(), team: optTeam.trim() }]
      : []

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        fixture_id: fixture.id,
        predicted_winner: winner,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        optional_predictions,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setStatus(json.error ?? 'Something went wrong.')
    } else {
      setStatus('Saved!')
      router.refresh()
    }
  }

  if (locked) {
    return <p className="text-center text-zinc-500">Predictions are locked for this match.</p>
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Contestant</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full border rounded px-2 py-1 bg-transparent">
          <option value="">Select...</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Winner</label>
        <select value={winner} onChange={(e) => setWinner(e.target.value)} className="w-full border rounded px-2 py-1 bg-transparent">
          <option value="HOME">{fixture.home_team}</option>
          <option value="DRAW">Draw</option>
          <option value="AWAY">{fixture.away_team}</option>
        </select>
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Score</label>
        <input type="number" min={0} value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} className="w-16 border rounded px-2 py-1 bg-transparent" />
        <span>-</span>
        <input type="number" min={0} value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} className="w-16 border rounded px-2 py-1 bg-transparent" />
      </div>

      <div className="border-t border-black/10 dark:border-white/10 pt-3">
        <label className="block text-sm font-medium mb-1">Optional: scorer/assist/card prediction</label>
        <div className="flex gap-2">
          <select value={optType} onChange={(e) => setOptType(e.target.value)} className="border rounded px-2 py-1 bg-transparent">
            <option value="GOAL">Goal</option>
            <option value="ASSIST">Assist</option>
            <option value="YELLOW_CARD">Yellow card</option>
            <option value="RED_CARD">Red card</option>
          </select>
          <input placeholder="Player name" value={optPlayer} onChange={(e) => setOptPlayer(e.target.value)} className="flex-1 border rounded px-2 py-1 bg-transparent" />
        </div>
        <input placeholder="Team (optional)" value={optTeam} onChange={(e) => setOptTeam(e.target.value)} className="w-full border rounded px-2 py-1 bg-transparent mt-2" />
        <p className="text-xs text-zinc-500 mt-1">+5 if correct, -1 if it doesn&apos;t happen.</p>
      </div>

      <button onClick={submit} className="bg-black text-white dark:bg-white dark:text-black rounded-full py-2 font-medium">
        Save Prediction
      </button>

      {status && <p className="text-sm text-center">{status}</p>}
    </div>
  )
}