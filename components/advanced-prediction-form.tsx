"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Target, CheckCircle, XCircle, Trophy, Calendar, Users, Eye } from "lucide-react"
import type { PredictionStats } from "@/lib/types"
import { formatStatsForDisplay } from "@/lib/scoring"

interface AdvancedPredictionFormProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  matchDate: Date
  onSubmit: (stats: PredictionStats) => void
  submitting: boolean
  userPrediction?: PredictionStats
  canPredict: boolean
}

export function AdvancedPredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  matchDate,
  onSubmit,
  submitting,
  userPrediction,
  canPredict,
}: AdvancedPredictionFormProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [stats, setStats] = useState<PredictionStats>({
    homeScore: userPrediction?.homeScore || 0,
    awayScore: userPrediction?.awayScore || 0,
    homeCorners: userPrediction?.homeCorners || 0,
    awayCorners: userPrediction?.awayCorners || 0,
    homePenalties: userPrediction?.homePenalties || 0,
    awayPenalties: userPrediction?.awayPenalties || 0,
    homeFreeKicks: userPrediction?.homeFreeKicks || 0,
    awayFreeKicks: userPrediction?.awayFreeKicks || 0,
    homeYellowCards: userPrediction?.homeYellowCards || 0,
    awayYellowCards: userPrediction?.awayYellowCards || 0,
    homeRedCards: userPrediction?.homeRedCards || 0,
    awayRedCards: userPrediction?.awayRedCards || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(stats)
  }

  const updateStat = (field: keyof PredictionStats, value: number) => {
    setStats(prev => ({ ...prev, [field]: Math.max(0, value) }))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (!canPredict) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            {homeTeam} vs {awayTeam}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(matchDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userPrediction ? (
            <div className="space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Pronóstico Guardado</p>
                <p className="text-lg font-bold text-green-700">
                  {formatStatsForDisplay(userPrediction)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Los pronósticos no se pueden modificar una vez guardados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">Pronósticos Cerrados</p>
                <p className="text-xs text-red-600">
                  Ya no se pueden hacer pronósticos para este partido
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          {homeTeam} vs {awayTeam}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {formatDate(matchDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">Pronóstico Básico</h3>
                <p className="text-sm text-muted-foreground">
                  Predice el resultado del partido (3 puntos por acierto exacto, 1 punto por resultado)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <Label htmlFor={`home-score-${matchId}`} className="text-sm font-medium">
                    {homeTeam}
                  </Label>
                  <Input
                    id={`home-score-${matchId}`}
                    type="number"
                    min="0"
                    max="20"
                    value={stats.homeScore}
                    onChange={(e) => updateStat('homeScore', parseInt(e.target.value) || 0)}
                    className="text-center h-12 text-lg font-semibold"
                    required
                  />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                </div>
                <div className="text-center">
                  <Label htmlFor={`away-score-${matchId}`} className="text-sm font-medium">
                    {awayTeam}
                  </Label>
                  <Input
                    id={`away-score-${matchId}`}
                    type="number"
                    min="0"
                    max="20"
                    value={stats.awayScore}
                    onChange={(e) => updateStat('awayScore', parseInt(e.target.value) || 0)}
                    className="text-center h-12 text-lg font-semibold"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-md font-medium" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Target className="w-4 h-4 mr-2 animate-pulse" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Guardar Pronóstico Básico
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">Pronóstico Avanzado</h3>
                <p className="text-sm text-muted-foreground">
                  Predice estadísticas adicionales para obtener más puntos
                </p>
              </div>

              {/* Resultado Principal */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <h4 className="font-medium">Resultado Principal</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <Label className="text-sm font-medium">{homeTeam}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={stats.homeScore}
                      onChange={(e) => updateStat('homeScore', parseInt(e.target.value) || 0)}
                      className="text-center h-10"
                    />
                  </div>
                  <div className="text-center text-muted-foreground">VS</div>
                  <div className="text-center">
                    <Label className="text-sm font-medium">{awayTeam}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={stats.awayScore}
                      onChange={(e) => updateStat('awayScore', parseInt(e.target.value) || 0)}
                      className="text-center h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Estadísticas Adicionales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <h4 className="font-medium">Estadísticas Adicionales</h4>
                </div>

                {/* Corners */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">📐 Corners</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="Local"
                        value={stats.homeCorners}
                        onChange={(e) => updateStat('homeCorners', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="Visitante"
                        value={stats.awayCorners}
                        onChange={(e) => updateStat('awayCorners', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>

                  {/* Penales */}
                  <div>
                    <Label className="text-sm font-medium">🎯 Penales</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Local"
                        value={stats.homePenalties}
                        onChange={(e) => updateStat('homePenalties', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Visitante"
                        value={stats.awayPenalties}
                        onChange={(e) => updateStat('awayPenalties', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Tiros Libres */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">⚡ Tiros Libres</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="Local"
                        value={stats.homeFreeKicks}
                        onChange={(e) => updateStat('homeFreeKicks', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="Visitante"
                        value={stats.awayFreeKicks}
                        onChange={(e) => updateStat('awayFreeKicks', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>

                  {/* Tarjetas Amarillas */}
                  <div>
                    <Label className="text-sm font-medium">🟨 Tarjetas Amarillas</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Local"
                        value={stats.homeYellowCards}
                        onChange={(e) => updateStat('homeYellowCards', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Visitante"
                        value={stats.awayYellowCards}
                        onChange={(e) => updateStat('awayYellowCards', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarjetas Rojas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">🟥 Tarjetas Rojas</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        placeholder="Local"
                        value={stats.homeRedCards}
                        onChange={(e) => updateStat('homeRedCards', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        placeholder="Visitante"
                        value={stats.awayRedCards}
                        onChange={(e) => updateStat('awayRedCards', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-md font-medium" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Target className="w-4 h-4 mr-2 animate-pulse" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Guardar Pronóstico Avanzado
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">Vista Previa</h3>
                <p className="text-sm text-muted-foreground">
                  Revisa tu pronóstico antes de guardarlo
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-lg">{homeTeam} vs {awayTeam}</h4>
                  <p className="text-sm text-muted-foreground">{formatDate(matchDate)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">⚽ Resultado:</span>
                    <span className="font-bold">{stats.homeScore} - {stats.awayScore}</span>
                  </div>
                  
                  {stats.homeCorners !== undefined && stats.awayCorners !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">📐 Corners:</span>
                      <span>{stats.homeCorners} - {stats.awayCorners}</span>
                    </div>
                  )}
                  
                  {stats.homePenalties !== undefined && stats.awayPenalties !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">🎯 Penales:</span>
                      <span>{stats.homePenalties} - {stats.awayPenalties}</span>
                    </div>
                  )}
                  
                  {stats.homeFreeKicks !== undefined && stats.awayFreeKicks !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">⚡ Tiros Libres:</span>
                      <span>{stats.homeFreeKicks} - {stats.awayFreeKicks}</span>
                    </div>
                  )}
                  
                  {stats.homeYellowCards !== undefined && stats.awayYellowCards !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">🟨 Tarjetas Amarillas:</span>
                      <span>{stats.homeYellowCards} - {stats.awayYellowCards}</span>
                    </div>
                  )}
                  
                  {stats.homeRedCards !== undefined && stats.awayRedCards !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">🟥 Tarjetas Rojas:</span>
                      <span>{stats.homeRedCards} - {stats.awayRedCards}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-4">
                  ⚠️ Una vez guardado, no podrás modificar tu pronóstico
                </p>
                <Button 
                  onClick={handleSubmit}
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-md font-medium" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Target className="w-4 h-4 mr-2 animate-pulse" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Pronóstico
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


