import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  const { data: points } = await supabase
    .from('points')
    .select('*, fixtures(home_team, away_team, home_score, away_score)')
    .eq('user_id', id)

  if (!user) {
    return <div className="p-12 text-center">User not found.</div>
  }

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 bg-zinc-50 dark:bg-black min-h-full">
      <main className="w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">{user.name}</h1>
        <p className="text-center text-sm text-zinc-500">{user.email}</p>

        <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="text-left px-3 py-2">Match</th>
                <th className="text-right px-3 py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {(points ?? []).map((p: any) => (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-3 py-2">
                    {p.fixtures?.home_team} {p.fixtures?.home_score}-{p.fixtures?.away_score} {p.fixtures?.away_team}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{p.total_points}</td>
                </tr>
              ))}
              {(!points || points.length === 0) && (
                <tr><td colSpan={2} className="px-3 py-6 text-center text-zinc-500">No scored matches yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}