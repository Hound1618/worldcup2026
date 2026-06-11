import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getFinishedMatches, getMatchDetail } from '@/lib/football-api'
import { calculatePoints } from '@/lib/scoring'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = req.nextUrl.searchParams.get('secret')
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    secret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getFinishedMatches()

  for (const match of data.matches) {
    await supabaseAdmin.from('fixtures').update({
      home_score: match.score.fullTime.home,
      away_score: match.score.fullTime.away,
      status: 'FINISHED',
      updated_at: new Date().toISOString(),
    }).eq('external_id', match.id)

    const detail = await getMatchDetail(match.id)

    const events: any[] = []
    for (const goal of detail.goals ?? []) {
      const { data: fix } = await supabaseAdmin
        .from('fixtures').select('id').eq('external_id', match.id).single()
      if (!fix) continue

      if (goal.scorer?.name) {
        events.push({ fixture_id: fix.id, player_name: goal.scorer.name, team: goal.team.name, event_type: 'GOAL', minute: goal.minute })
      }
      if (goal.assist?.name) {
        events.push({ fixture_id: fix.id, player_name: goal.assist.name, team: goal.team.name, event_type: 'ASSIST', minute: goal.minute })
      }
    }
    for (const booking of detail.bookings ?? []) {
      const { data: fix } = await supabaseAdmin
        .from('fixtures').select('id').eq('external_id', match.id).single()
      if (!fix) continue
      events.push({
        fixture_id: fix.id,
        player_name: booking.player.name,
        team: booking.team.name,
        event_type: booking.card === 'RED_CARD' ? 'RED_CARD' : 'YELLOW_CARD',
        minute: booking.minute,
      })
    }

    if (events.length > 0) {
      await supabaseAdmin.from('match_events').upsert(events)
    }

    const { data: fixture } = await supabaseAdmin
      .from('fixtures').select('id').eq('external_id', match.id).single()
    if (!fixture) continue

    const { data: predictions } = await supabaseAdmin
      .from('predictions').select('*').eq('fixture_id', fixture.id)
    const { data: dbEvents } = await supabaseAdmin
      .from('match_events').select('*').eq('fixture_id', fixture.id)

    for (const pred of predictions ?? []) {
      const pts = calculatePoints(
        {
          predictedWinner: pred.predicted_winner,
          predictedHomeScore: pred.predicted_home_score,
          predictedAwayScore: pred.predicted_away_score,
          optionalPredictions: pred.optional_predictions ?? [],
        },
        { homeScore: match.score.fullTime.home, awayScore: match.score.fullTime.away },
        dbEvents ?? []
      )
      await supabaseAdmin.from('points').upsert({
        user_id: pred.user_id,
        fixture_id: fixture.id,
        ...pts,
        calculated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,fixture_id' })
    }
  }

  return NextResponse.json({ ok: true, processed: data.matches.length })
}