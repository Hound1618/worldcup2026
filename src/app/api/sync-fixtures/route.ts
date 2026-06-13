import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getWCFixtures } from '@/lib/football-api'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await getWCFixtures()

    if (!data.matches) {
      return NextResponse.json({ error: 'No matches returned', raw: data }, { status: 500 })
    }

    let synced = 0
    const errors = []

    for (const match of data.matches) {
      try {
        const { error } = await supabaseAdmin.from('fixtures').upsert({
          external_id: match.id,
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          kickoff: match.utcDate,
          stage: match.stage,
          group_name: match.group ?? null,
          status: match.status,
        }, { onConflict: 'external_id' })

        if (error) {
          errors.push({ match: match.id, error: error.message })
        } else {
          synced++
        }
      } catch (e: any) {
        errors.push({ match: match.id, error: e.message })
      }
    }

    return NextResponse.json({ synced, total: data.matches.length, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}