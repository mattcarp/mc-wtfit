import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WTFIT — What The Fuck Is This?',
    short_name: 'WTFIT',
    description: 'Photograph it. Keep it, build with it, or let it go for a good cause.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#F4F4F1',
    theme_color: '#D4FF3F',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
