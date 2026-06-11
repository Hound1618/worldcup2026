'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function submit() {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })
    const json = await res.json()
    if (!res.ok) {
      setStatus(json.error ?? 'Something went wrong.')
    } else {
      setStatus('Registered! Go to the homepage to see the leaderboard.')
      setName('')
      setEmail('')
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 bg-zinc-50 dark:bg-black min-h-full">
      <main className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Join the prediction game</h1>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2 bg-transparent" />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-3 py-2 bg-transparent" />
        <button onClick={submit} className="bg-black text-white dark:bg-white dark:text-black rounded-full py-2 font-medium">
          Register
        </button>
        {status && <p className="text-sm text-center">{status}</p>}
      </main>
    </div>
  )
}