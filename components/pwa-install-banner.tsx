'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

export function PWAInstallBanner() {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar banner solo si puede instalarse y no está ya instalado
    if (canInstall && !isInstalled) {
      // Verificar si el usuario ya cerró el banner anteriormente
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-white dark:bg-gray-800 shadow-lg border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Instalar Prode Libre
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Instala la app para una mejor experiencia
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-3 flex space-x-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              Instalar
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Ahora no
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
