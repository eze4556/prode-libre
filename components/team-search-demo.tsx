"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, CheckCircle, XCircle } from "lucide-react"
import { searchTeams, type Team, testFootballAPI, testAPIDirectly } from "@/lib/football-api"

// ============================
// UI COMPONENT
// ============================
export function TeamSearchDemo() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [lastSearch, setLastSearch] = useState("")

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setLastSearch(searchQuery)

    try {
      console.log(`Buscando: "${searchQuery}"`)
      const teams = await searchTeams(searchQuery)
      setResults(teams)
      console.log(`Encontrados ${teams.length} equipos`)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Demo: Búsqueda de Equipos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar equipo (ej: River Plate, Boca Juniors, Flamengo...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log("🧪 Running API test...")
                testFootballAPI()
              }}
            >
              🧪 Test API
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log("🔬 Testing API directly...")
                testAPIDirectly()
              }}
            >
              🔬 Direct Test
            </Button>
          </div>

          {lastSearch && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Última búsqueda:</strong> "{lastSearch}"
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Equipos Encontrados ({results.length})
              </h3>
              <div className="grid gap-2">
                {results.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-green-800">{team.name}</div>
                      <div className="text-sm text-green-600">
                        {team.country}
                        {team.founded && ` • Fundado ${team.founded}`}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      ID: {team.id}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastSearch && results.length === 0 && !loading && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                No se encontraron equipos para "{lastSearch}". Puedes crear un equipo personalizado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Casos de Prueba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              "River Plate",
              "Boca Juniors",
              "Rosario Central",
              "Newell's Old Boys",
              "Independiente",
              "Flamengo",
              "Palmeiras",
              "Corinthians",
              "Santos",
              "Atletico Madrid",
              "Sevilla",
              "Valencia",
              "Betis",
              "Mi Equipo Local",
              "Equipo Inventado"
            ].map((team) => (
              <Button
                key={team}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(team)
                  setTimeout(() => handleSearch(), 100)
                }}
                className="text-xs"
              >
                {team}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}