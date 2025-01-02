import React from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryProvider, queryClient } from './lib/query'
import { ThemeProvider } from './context/theme-context'
import { ClerkAuthProvider } from './providers/clerk-provider'
import './index.css'

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <ClerkAuthProvider>
        <QueryProvider>
          <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
            <RouterProvider router={router} />
          </ThemeProvider>
        </QueryProvider>
      </ClerkAuthProvider>
    </React.StrictMode>,
  )
}
