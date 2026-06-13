import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculatePoints } from '@/lib/scoring'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: finishedFixtures } = await supabaseAdmin
    .from('fixtures')
    .select('*')
    .eq('status', 'FINISHED')

  if (!finishedFixtures || finishedFixtures.length === 0) {
    return NextResponse.json({ error: 'No finished fixtures found' })
  }

  const results = []

  for (const fixture of finishedFixtures) {
    if (fixture.home_score === null || fixture.away_score === null) {
      results.push({ fixture: `${fixture.home_team} vs ${fixture.away_team}`, skipped: 'No score set' })
      continue
    }

    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('fixture_id', fixture.id)

    if (!predictions || predictions.length === 0) {
      results.push({ fixture: `${fixture.home_team} vs ${fixture.away_team}`, skipped: 'No predictions' })
      continue
    }

    const { data: events } = await supabaseAdmin
      .from('match_events')
      .select('*')
      .eq('fixture_id', fixture.id)

    for (const pred of predictions) {
      const pts = calculatePoints(
        {
          predictedWinner: pred.predicted_winner,
          predictedHomeScore: pred.predicted_home_score,
          predictedAwayScore: pred.predicted_away_score,
          optionalPredictions: pred.optional_predictions ?? [],
        },
        {
          homeScore: fixture.home_score,
          awayScore: fixture.away_score,
        },
        events ?? []
      )

      const { error: upsertError } = await supabaseAdmin.from('points').upsert({
        user_id: pred.user_id,
        fixture_id: fixture.id,
        win_points: pts.winPoints,
        score_points: pts.scorePoints,
        optional_points: pts.optionalPoints,
        base_points: pts.basePoints,
        total_points: pts.totalPoints,
        calculated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,fixture_id' })

      results.push({
        fixture: `${fixture.home_team} vs ${fixture.away_team}`,
        user: pred.user_id,
        points: pts,
        upsertError: upsertError?.message ?? null,
      })
    }
  }

  return NextResponse.json({ ok: true, results })
}