import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/panelcliente/', '/formulario-de-admision/'],
      },
    ],
    sitemap: 'https://www.juanpabloloaiza.com/sitemap.xml',
  }
}
