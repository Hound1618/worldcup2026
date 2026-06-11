import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FixturesPage() {
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .order('kickoff', { ascending: true })

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 bg-zinc-50 dark:bg-black min-h-full">
      <main className="w-full max-w-2xl flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center mb-2">Fixtures</h1>

        {(fixtures ?? []).map((f) => (
          <Link
            key={f.id}
            href={`/predict/${f.id}`}
            className="rounded-lg border border-black/10 dark:border-white/10 p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div>
              <div className="font-medium">{f.home_team} vs {f.away_team}</div>
              <div className="text-xs text-zinc-500">
                {new Date(f.kickoff).toLocaleString()} · {f.stage}
              </div>
            </div>
            <div className="text-sm">
              {f.status === 'FINISHED'
                ? `${f.home_score} - ${f.away_score}`
                : f.status}
            </div>
          </Link>
        ))}

        {(!fixtures || fixtures.length === 0) && (
          <p className="text-center text-zinc-500">
            No fixtures yet. Run /api/sync-fixtures?secret=YOUR_CRON_SECRET once to load them.
          </p>
        )}
      </main>
    </div>
  )
}