import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/.next/',
          '/api/',
          '/panelcliente/',
          '/formulario-de-admision/',
          '/academy/admin/',
        ],
      },
    ],
    sitemap: 'https://juanpabloloaiza.com/sitemap.xml',
  }
}
