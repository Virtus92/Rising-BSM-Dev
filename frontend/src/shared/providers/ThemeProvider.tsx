"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes/dist/types'

/**
 * Provider für Theme-Verwaltung
 * Verwendet next-themes für die konsistente Theme-Verwaltung (hell/dunkel/System)
 * mit Integration mit dem Browser- und Betriebssystemeinstellungen
 */
export function ThemeProvider({ 
  children, 
  attribute = "class",
  defaultTheme = "system",
  disableTransitionOnChange = true,
  ...props 
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  // Vermeidet Hydration-Fehler, indem der ThemeProvider erst nach dem
  // Client-seitigen Mounting gerendert wird
  useEffect(() => {
    setMounted(true)
  }, [])

  // Während des ersten Server-Side-Renderings oder Hydration
  // zeigen wir nur die Kinder ohne Theme-Wrapper an
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export default ThemeProvider;
