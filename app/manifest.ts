import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DailyFlux',
    short_name: 'DailyFlux',
    description: 'Acompanhamento de atividades e fluxo de dailies da Squad Raiz',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#06061a',
    theme_color: '#06061a',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Daily',
        short_name: 'Daily',
        description: 'Ver o quadro de daily do squad',
        url: '/daily',
        icons: [{ src: '/icon', sizes: '512x512' }],
      },
      {
        name: 'Minhas Tarefas',
        short_name: 'Tarefas',
        description: 'Ver suas tarefas de hoje',
        url: '/dashboard',
        icons: [{ src: '/icon', sizes: '512x512' }],
      },
    ],
  }
}
