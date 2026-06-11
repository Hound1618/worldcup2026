import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')

  const { data: points } = await supabase
    .from('points')
    .select('*')

  const leaderboard = (users ?? []).map((user) => {
    const userPoints = (points ?? []).filter((p) => p.user_id === user.id)
    const total = userPoints.reduce((sum, p) => sum + (p.total_points ?? 0), 0)
    const base = userPoints.reduce((sum, p) => sum + (p.base_points ?? 0), 0)
    return { ...user, total, base }
  })

  leaderboard.sort((a, b) => b.total - a.total)

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 bg-zinc-50 dark:bg-black min-h-full">
      <main className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center">World Cup 2026 Predictions</h1>

        <div className="flex justify-center gap-4">
          <Link href="/fixtures" className="px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium">
            View Fixtures
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-full border border-black/20 dark:border-white/20 text-sm font-medium">
            Register
          </Link>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="text-left px-4 py-2">Rank</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-right px-4 py-2">Total Points</th>
                <th className="text-right px-4 py-2">Base (no optional)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, i) => (
                <tr key={user.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link href={`/profile/${user.id}`} className="hover:underline">
                      {user.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">{user.total}</td>
                  <td className="px-4 py-2 text-right text-zinc-500">{user.base}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}