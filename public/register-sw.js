// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado exitosamente:', registration.scope)
      })
      .catch((registrationError) => {
        console.log('SW falló al registrarse:', registrationError)
      })
  })
}
