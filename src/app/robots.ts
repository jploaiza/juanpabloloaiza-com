import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/.next/",
          "/api/",
          "/admin/",
          "/panelcliente/",
          "/formulario-de-admision/",
          "/agenda/",
          "/entrevista/",
          "/academy/admin/",
          "/template/",
          // Restos de la antigua instalación de WordPress
          "/wp-content/",
          "/wp-admin/",
          "/wp-includes/",
          // Generada por la ofuscación de correo de Cloudflare
          "/cdn-cgi/",
        ],
      },
    ],
    sitemap: "https://www.juanpabloloaiza.com/sitemap.xml",
  };
}
