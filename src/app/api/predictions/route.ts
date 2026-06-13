import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    user_id, fixture_id, predicted_winner,
    predicted_home_score, predicted_away_score,
    optional_predictions, admin_override
  } = body

  const { data: fixture } = await supabaseAdmin
    .from('fixtures').select('kickoff, status').eq('id', fixture_id).single()

  if (!fixture) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 })

  const isPast = new Date(fixture.kickoff) < new Date()
  const isStarted = fixture.status !== 'SCHEDULED'

  if (!admin_override && (isPast || isStarted)) {
    return NextResponse.json({ error: 'Predictions locked' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('predictions').upsert({
    user_id, fixture_id, predicted_winner,
    predicted_home_score, predicted_away_score,
    optional_predictions: optional_predictions ?? [],
    locked: isPast || isStarted,
  }, { onConflict: 'user_id,fixture_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}