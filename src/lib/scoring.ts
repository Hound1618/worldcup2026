export interface MatchResult {
  homeScore: number
  awayScore: number
}

export interface MatchEvent {
  player_name: string
  team: string
  event_type: string
  minute: number
}

export interface OptionalPrediction {
  type: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD'
  player: string
  team: string
}

export interface Prediction {
  predictedWinner: string
  predictedHomeScore: number
  predictedAwayScore: number
  optionalPredictions: OptionalPrediction[]
}

export function calculatePoints(
  prediction: Prediction,
  result: MatchResult,
  events: MatchEvent[]
) {
  let winPoints = 0, scorePoints = 0, optionalPoints = 0

  const actualWinner =
    result.homeScore > result.awayScore ? 'HOME' :
    result.awayScore > result.homeScore ? 'AWAY' : 'DRAW'

  if (prediction.predictedWinner === actualWinner) winPoints = 1

  if (
    prediction.predictedHomeScore === result.homeScore &&
    prediction.predictedAwayScore === result.awayScore
  ) scorePoints = 3

  for (const opt of prediction.optionalPredictions) {
    const hit = events.some(e =>
      e.player_name.toLowerCase().includes(opt.player.toLowerCase()) &&
      e.event_type === opt.type
    )
    optionalPoints += hit ? 5 : -1
  }

  const basePoints = winPoints + scorePoints
  const totalPoints = basePoints + optionalPoints
  return { winPoints, scorePoints, optionalPoints, basePoints, totalPoints }
}