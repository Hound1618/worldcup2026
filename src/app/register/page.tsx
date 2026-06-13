'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) { setError('Both fields required'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim() })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setLoading(false); return }
    setDone(true)
  }

  if (done) return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-yellow-400">You're in!</h2>
      <p className="text-gray-400 mt-2 mb-6">Welcome to the WC2026 Predictor, {name}.</p>
      <button onClick={() => router.push('/fixtures')} className="btn-primary">View Fixtures →</button>
    </div>
  )

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-black text-yellow-400 mb-2">Join the League</h1>
      <p className="text-gray-400 mb-6 text-sm">Register to start predicting World Cup 2026 matches.</p>
      <div className="card space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Your Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Varun"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
          {loading ? 'Registering...' : 'Register →'}
        </button>
      </div>
    </div>
  )
}