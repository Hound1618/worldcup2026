import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getWCFixtures } from '@/lib/football-api'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getWCFixtures()

  for (const match of data.matches) {
    await supabaseAdmin.from('fixtures').upsert({
      external_id: match.id,
      home_team: match.homeTeam.name,
      away_team: match.awayTeam.name,
      kickoff: match.utcDate,
      stage: match.stage,
      group_name: match.group ?? null,
      status: match.status,
    }, { onConflict: 'external_id' })
  }

  return NextResponse.json({ synced: data.matches.length })
}