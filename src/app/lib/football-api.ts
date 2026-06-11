const BASE = 'https://api.football-data.org/v4'
const headers = { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! }

export async function getWCFixtures() {
  const res = await fetch(`${BASE}/competitions/WC/matches`, { headers })
  return res.json()
}

export async function getFinishedMatches() {
  const res = await fetch(`${BASE}/competitions/WC/matches?status=FINISHED`, { headers })
  return res.json()
}

export async function getMatchDetail(matchId: number) {
  const res = await fetch(`${BASE}/matches/${matchId}`, { headers })
  return res.json()
}