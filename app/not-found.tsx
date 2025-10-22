import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto">
          <img src="/logo.png" alt="Prode Libre" className="w-full h-full object-contain" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-orange-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Página no encontrada</h2>
          <p className="text-gray-600">La página que buscas no existe o ha sido movida.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
