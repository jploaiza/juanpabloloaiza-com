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
          '/admin/',
          '/panelcliente/',
          '/formulario-de-admision/',
          '/agenda/',
          '/entrevista/',
          '/academy/admin/',
        ],
      },
    ],
    sitemap: 'https://juanpabloloaiza.com/sitemap.xml',
  }
}
