export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "https://www.juanpabloloaiza.com"
);
