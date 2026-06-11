import { supabase } from '@/lib/supabase'
import PredictForm from './PredictForm'

export const dynamic = 'force-dynamic'

export default async function PredictPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: fixture } = await supabase
    .from('fixtures')
    .select('*')
    .eq('id', id)
    .single()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (!fixture) {
    return <div className="p-12 text-center">Fixture not found.</div>
  }

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 bg-zinc-50 dark:bg-black min-h-full">
      <main className="w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">
          {fixture.home_team} vs {fixture.away_team}
        </h1>
        <p className="text-center text-sm text-zinc-500">
          {new Date(fixture.kickoff).toLocaleString()} · {fixture.stage}
        </p>
        <PredictForm fixture={fixture} users={users ?? []} />
      </main>
    </div>
  )
}