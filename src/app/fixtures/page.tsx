'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'

export default function Fixtures() {
  const [grouped, setGrouped] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('fixtures')
        .select('*')
        .order('kickoff', { ascending: true })
      if (!data) return
      const g: Record<string, any[]> = {}
      for (const f of data) {
        const stage = f.stage ?? 'Unknown'
        if (!g[stage]) g[stage] = []
        g[stage].push(f)
      }
      setGrouped(g)
      setLoading(false)
    }
    load()
  }, [])

  const stageOrder = [
    'GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16',
    'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'
  ]

  const stageLabel: Record<string, string> = {
    GROUP_STAGE: 'Group Stage',
    ROUND_OF_32: 'Round of 32',
    ROUND_OF_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter Finals',
    SEMI_FINALS: 'Semi Finals',
    THIRD_PLACE: 'Third Place',
    FINAL: 'Final',
  }

  const statusColor: Record<string, string> = {
    FINISHED: 'text-green-400',
    IN_PLAY: 'text-yellow-400 animate-pulse',
    SCHEDULED: 'text-gray-400',
  }

  const sortedStages = Object.keys(grouped).sort(
    (a, b) => (stageOrder.indexOf(a) ?? 99) - (stageOrder.indexOf(b) ?? 99)
  )

  return (
    <div>
      <h1 className="text-3xl font-black text-yellow-400 mb-6">📅 Fixtures</h1>
      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading fixtures...</div>
      ) : (
        <div className="space-y-8">
          {sortedStages.map(stage => (
            <div key={stage}>
              <h2 className="text-lg font-bold text-white mb-3 border-l-4 border-yellow-500 pl-3">
                {stageLabel[stage] ?? stage}
              </h2>
              <div className="space-y-2">
                {grouped[stage].map(f => (
                  <Link href={`/predict/${f.id}`} key={f.id}>
                    <div className="card hover:border-yellow-500 transition-colors cursor-pointer flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {f.home_team} <span className="text-gray-500">vs</span> {f.away_team}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(f.kickoff), 'dd MMM yyyy, HH:mm')}
                          {f.group_name && ` · ${f.group_name}`}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {f.status === 'FINISHED' ? (
                          <div className="text-lg font-black text-white">
                            {f.home_score} – {f.away_score}
                          </div>
                        ) : (
                          <div className={`text-xs font-semibold ${statusColor[f.status] ?? 'text-gray-400'}`}>
                            {f.status === 'IN_PLAY' ? '🔴 LIVE' : 'Predict →'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}