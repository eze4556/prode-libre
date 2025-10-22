"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Shield } from "lucide-react"
import { searchTeams, getPopularTeams, type Team } from "@/lib/football-api"

interface TeamSelectorProps {
  label: string
  value: string
  logo?: string
  onChange: (team: string, logo?: string) => void
  placeholder?: string
}

export function TeamSelector({ 
  label, 
  value, 
  logo, 
  onChange, 
  placeholder = "Buscar equipo..." 
}: TeamSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  // Cargar equipos populares al inicio
  useEffect(() => {
    // No cargar equipos populares inicialmente - solo cuando se busque
    setTeams([])
  }, [])

  // Buscar equipos cuando cambie la query
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchTeamsDebounced(searchQuery)
    } else if (searchQuery.trim().length === 0) {
      // No mostrar equipos populares cuando se borre - solo limpiar
      setTeams([])
    }
  }, [searchQuery])

  const searchTeamsDebounced = async (query: string) => {
    setLoading(true)
    try {
      const results = await searchTeams(query)
      setTeams(results)
    } catch (error) {
      console.error('Error searching teams:', error)
      // No mostrar equipos populares como fallback - solo limpiar
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
    onChange(team.name, team.logo)
    setSearchQuery(team.name)
    setShowResults(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowResults(true)
    
    // Si se borra el input, limpiar selección
    if (query.trim() === "") {
      setSelectedTeam(null)
      onChange("", undefined)
    } else {
      // Actualizar el valor incluso si no hay equipo seleccionado
      onChange(query, undefined)
    }
  }

  const handleInputFocus = () => {
    setShowResults(true)
  }

  const handleInputBlur = () => {
    // Delay para permitir clicks en los resultados
    setTimeout(() => setShowResults(false), 200)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="team-search">{label}</Label>
      
      <div className="relative">
        <div className="flex items-center gap-2">
          {selectedTeam?.logo ? (
            <img 
              src={selectedTeam.logo} 
              alt={selectedTeam.name}
              className="w-8 h-8 object-contain rounded"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNOCAxMkgxNlYyMEg4VjEyWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTYgOEgyNFYxNkgxNlY4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <Input
            id="team-search"
            placeholder={placeholder || "Buscar equipo o escribir nombre personalizado..."}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="flex-1"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        {showResults && teams.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-2">
              <div className="space-y-1">
                {teams.map((team) => (
                  <Button
                    key={team.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2"
                    onClick={() => handleTeamSelect(team)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {team.logo ? (
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNNiA5SDEyVjE1SDZWOloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEyIDZIMThWMTJIMTJWNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                          <Shield className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{team.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {team.country}
                          {team.founded && ` • Fundado ${team.founded}`}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {team.country}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ayuda para equipos personalizados */}
        {!showResults && !selectedTeam && (
          <div className="text-xs text-gray-500 mt-1 px-1">
            💡 Puedes escribir cualquier nombre de equipo personalizado
          </div>
        )}
      </div>

      {selectedTeam && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          {selectedTeam.logo ? (
            <img 
              src={selectedTeam.logo} 
              alt={selectedTeam.name}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNNiA5SDEyVjE1SDZWOloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEyIDZIMThWMTJIMTJWNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='
              }}
            />
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
              <Shield className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <span className="text-sm font-medium">{selectedTeam.name}</span>
          <Badge variant="secondary" className="text-xs">
            {selectedTeam.country}
          </Badge>
        </div>
      )}

      {value && !selectedTeam && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            {value} (sin escudo)
          </span>
          <span className="text-xs text-blue-600 ml-auto">
            ✓ Equipo personalizado
          </span>
        </div>
      )}
    </div>
  )
}
