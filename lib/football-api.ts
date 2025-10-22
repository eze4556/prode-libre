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

    const teams: Team[] = data.teams.map(team => {
      // Limpiar y validar la URL del logo
      let logoUrl = team.strBadge || team.strLogo || ""
      
      // Si la URL está vacía o es inválida, usar un placeholder
      if (!logoUrl || logoUrl === "null" || logoUrl === "undefined") {
        logoUrl = ""
      }
      
      // Validar que la URL sea válida
      try {
        if (logoUrl && !logoUrl.startsWith('http')) {
          logoUrl = ""
        }
      } catch {
        logoUrl = ""
      }
      
      return {
        id: parseInt(team.idTeam),
        name: team.strTeam,
        logo: logoUrl,
        country: team.strCountry,
        founded: team.intFormedYear ? parseInt(team.intFormedYear) : undefined
      }
    })

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
    
    // No usar fallback - solo devolver array vacío si la API falla
    console.log(`❌ API failed for "${query}" - returning empty results`)
    return []
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