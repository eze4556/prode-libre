// Football API service using TheSportsDB (FREE, NO API KEY REQUIRED)
const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"

export interface Team {
  id: number
  name: string
  logo: string
  country: string
  founded?: number
}

export interface TheSportsDBResponse {
  teams: Array<{
    idTeam: string
    strTeam: string
    strTeamAlternate: string
    strTeamShort: string
    intFormedYear: string
    strSport: string
    strLeague: string
    strCountry: string
    strBadge: string
    strLogo: string
    strStadium: string
    strWebsite: string
    strDescriptionEN: string
  }>
}

interface CachedTeams {
  data: Team[]
  timestamp: number
}

// Cache para evitar requests repetidos
const teamCache = new Map<string, CachedTeams>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

// Buscar equipos usando TheSportsDB (GRATIS, SIN API KEY)
export async function searchTeams(query: string): Promise<Team[]> {
  const cacheKey = `search_${query.toLowerCase()}`
  const cached = teamCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    console.log(`🔍 Searching teams for: "${query}" using TheSportsDB`)
    const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(query)}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    })

    console.log(`📊 Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data: TheSportsDBResponse = await response.json()

    if (!data.teams || data.teams.length === 0) {
      console.log(`❌ No results found for "${query}"`)
      return []
    }

    const teams: Team[] = data.teams.map(team => ({
      id: parseInt(team.idTeam),
      name: team.strTeam,
      logo: team.strBadge || team.strLogo || "",
      country: team.strCountry,
      founded: team.intFormedYear ? parseInt(team.intFormedYear) : undefined
    }))

    console.log(`✅ Found ${teams.length} teams for "${query}"`)
    teams.forEach(team => {
      console.log(`   🏆 ${team.name} (${team.country}) - ${team.logo}`)
    })

    // Cachear
    teamCache.set(cacheKey, {
      data: teams,
      timestamp: Date.now()
    })

    return teams
  } catch (error) {
    console.error("💥 Error searching teams:", error)
    
    // Fallback: buscar en equipos populares
    console.log(`🔄 Using fallback for "${query}"`)
    const fallbackTeams = getPopularTeams().filter(team => 
      team.name.toLowerCase().includes(query.toLowerCase())
    )
    
    console.log(`🏆 Found ${fallbackTeams.length} teams in fallback`)
    fallbackTeams.forEach(team => {
      console.log(`   - ${team.name} (${team.country})`)
    })
    
    return fallbackTeams
  }
}

// Obtener un equipo específico por nombre exacto
export async function getTeamByName(teamName: string): Promise<Team | null> {
  try {
    const teams = await searchTeams(teamName)
    return teams.find(
      team => team.name.toLowerCase() === teamName.toLowerCase()
    ) || null
  } catch (error) {
    console.error("Error getting team by name:", error)
    return null
  }
}

// Obtener logo de un equipo por nombre
export async function getTeamLogo(teamName: string): Promise<string | null> {
  try {
    const team = await getTeamByName(teamName)
    return team?.logo || null
  } catch (error) {
    console.error("Error getting team logo:", error)
    return null
  }
}

// Equipos populares como fallback cuando TheSportsDB no encuentra nada
export function getPopularTeams(): Team[] {
  return [
    // Equipos Argentinos
    {
      id: 435,
      name: "River Plate",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1901
    },
    {
      id: 436,
      name: "Boca Juniors",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1905
    },
    {
      id: 437,
      name: "Rosario Central",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1889
    },
    {
      id: 438,
      name: "Newell's Old Boys",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1903
    },
    {
      id: 439,
      name: "Independiente",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1905
    },
    {
      id: 440,
      name: "Racing Club",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1903
    },
    {
      id: 441,
      name: "San Lorenzo",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1908
    },
    {
      id: 442,
      name: "Estudiantes",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/89ejr11721138251.png",
      country: "Argentina",
      founded: 1905
    },
    // Equipos Brasileños
    {
      id: 1213,
      name: "Flamengo",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Brazil",
      founded: 1895
    },
    {
      id: 1214,
      name: "Palmeiras",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Brazil",
      founded: 1914
    },
    {
      id: 1215,
      name: "Corinthians",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Brazil",
      founded: 1910
    },
    {
      id: 1216,
      name: "Santos",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Brazil",
      founded: 1912
    },
    {
      id: 1217,
      name: "São Paulo",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Brazil",
      founded: 1930
    },
    {
      id: 1218,
      name: "Grêmio",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Brazil",
      founded: 1903
    },
    // Equipos Europeos
    {
      id: 541,
      name: "Real Madrid",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Spain",
      founded: 1902
    },
    {
      id: 529,
      name: "Barcelona",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Spain",
      founded: 1899
    },
    {
      id: 530,
      name: "Atletico Madrid",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Spain",
      founded: 1903
    },
    {
      id: 33,
      name: "Manchester United",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "England",
      founded: 1878
    },
    {
      id: 40,
      name: "Liverpool",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "England",
      founded: 1892
    },
    {
      id: 50,
      name: "Manchester City",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "England",
      founded: 1880
    },
    {
      id: 49,
      name: "Chelsea",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "England",
      founded: 1905
    },
    {
      id: 42,
      name: "Arsenal",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "England",
      founded: 1886
    },
    {
      id: 85,
      name: "Paris Saint Germain",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "France",
      founded: 1970
    },
    {
      id: 157,
      name: "Bayern Munich",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Germany",
      founded: 1900
    },
    {
      id: 109,
      name: "Juventus",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Italy",
      founded: 1897
    },
    {
      id: 98,
      name: "AC Milan",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Italy",
      founded: 1899
    },
    {
      id: 108,
      name: "Inter",
      logo: "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png",
      country: "Italy",
      founded: 1908
    }
  ]
}

// Test function to verify TheSportsDB API
export async function testFootballAPI() {
  console.log("🧪 Testing TheSportsDB API...")

  const testQueries = [
    "Flamengo",
    "Real Madrid",
    "Barcelona",
    "River Plate",
    "Boca Juniors",
    "Rosario Central",
    "Newell's Old Boys",
    "Independiente"
  ]

  for (const query of testQueries) {
    console.log(`\n🔍 Testing: "${query}"`)
    try {
      const teams = await searchTeams(query)
      console.log(`✅ Found ${teams.length} teams:`)
      teams.forEach(team => {
        console.log(`   - ${team.name} (${team.country}) - ${team.logo}`)
      })
    } catch (error) {
      console.error(`❌ Error searching "${query}":`, error)
    }
  }
}

// Probar la API directamente
export async function testAPIDirectly() {
  console.log("🧪 Testing TheSportsDB API directly...")

  const testUrl = `${BASE_URL}/searchteams.php?t=Rosario%20Central`
  
  try {
    console.log(`🌐 Testing URL: ${testUrl}`)
    const response = await fetch(testUrl, { method: "GET" })
    console.log(`📊 Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error response: ${errorText}`)
      return
    }

    const data = await response.json()
    console.log("📋 Full API Response:", JSON.stringify(data, null, 2))

    if (data.teams && data.teams.length > 0) {
      console.log(`✅ Found ${data.teams.length} teams:`)
      data.teams.forEach((team: any, index: number) => {
        console.log(
          `   ${index + 1}. ${team.strTeam} (${team.strCountry}) - ${team.strBadge}`
        )
      })
    } else {
      console.log("❌ No teams found")
    }
  } catch (error) {
    console.error("💥 Direct API test failed:", error)
  }
}