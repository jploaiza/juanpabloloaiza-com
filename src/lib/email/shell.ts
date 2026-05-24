const LOGO_URL = "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png";
const PHOTO_URL = "https://media.juanpabloloaiza.com/images/jpl-newwsp.jpeg";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=56962081884";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * emailShell — master email wrapper for all outbound emails.
 *
 * Design: dark navy background, gold corner decorations, logo header,
 * author card (photo + WhatsApp button), social footer.
 *
 * @param content   Inner HTML (tables/paragraphs) for the email body.
 * @param footer    Optional fine-print block (unsubscribe link, legal copy).
 *                  Rendered below the social links row.
 *                  If omitted, shows just the contact email.
 */
export function emailShell(content: string, footer?: string): string {
  const defaultFineprint = `
    <p style="color:#4a6a8a;font-size:11px;margin:0;font-family:Georgia,serif;">
      <a href="mailto:contacto@juanpabloloaiza.com" style="color:#4a6a8a;text-decoration:none;">contacto@juanpabloloaiza.com</a>
      &nbsp;·&nbsp;
      <a href="${WHATSAPP_URL}" style="color:#4a6a8a;text-decoration:none;">+56 9 6208 1884</a>
    </p>`;

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Juan Pablo Loaiza</title>
</head>
<body style="margin:0;padding:0;background-color:#0a1628;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a1628;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Card with gold corners -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#16213e;border:1px solid rgba(197,160,89,0.25);">
          <!-- Top corners -->
          <tr>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
            <td style="border-top:1px solid rgba(197,160,89,0.25);height:12px;"></td>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
          </tr>
          <!-- Content column -->
          <tr>
            <td width="12" style="border-left:1px solid rgba(197,160,89,0.15);"></td>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Logo header -->
                <tr>
                  <td style="background-color:#0e1b30;padding:28px 32px 24px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
                    <img src="${LOGO_URL}" width="160" alt="Juan Pablo Loaiza" style="display:inline-block;max-width:160px;border:0;opacity:0.9;"/>
                  </td>
                </tr>
                <!-- Email body content -->
                ${content}
                <!-- Gold divider -->
                <tr>
                  <td style="padding:0 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:40px;height:1px;border-bottom:1px solid #C5A059;"></td>
                        <td style="height:1px;border-bottom:1px solid rgba(197,160,89,0.2);"></td>
                        <td style="width:40px;height:1px;border-bottom:1px solid #C5A059;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Author card -->
                <tr>
                  <td style="padding:20px 32px;background-color:#0e1b30;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="86" valign="top" style="padding-right:16px;">
                          <img src="${PHOTO_URL}" width="70" height="70" alt="Juan Pablo Loaiza"
                            style="display:block;width:70px;height:70px;object-fit:cover;border:1px solid rgba(197,160,89,0.4);"/>
                        </td>
                        <td valign="middle">
                          <p style="color:#C5A059;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0 0 3px;font-family:Georgia,serif;">Tu terapeuta</p>
                          <p style="color:#ffffff;font-size:14px;margin:0 0 4px;font-family:Georgia,serif;font-weight:normal;">Juan Pablo Loaiza</p>
                          <p style="color:#8a9bb5;font-size:12px;margin:0 0 12px;font-family:Georgia,serif;">Terapia de Regresión · Hipnoterapia · TRVP</p>
                          <a href="${WHATSAPP_URL}"
                            style="display:inline-block;padding:7px 20px;background-color:#C5A059;color:#020617;font-family:Georgia,serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Gold divider -->
                <tr>
                  <td style="padding:0 32px;background-color:#0e1b30;">
                    <div style="height:1px;background-color:rgba(197,160,89,0.2);"></div>
                  </td>
                </tr>
                <!-- Social links + fine print -->
                <tr>
                  <td style="padding:16px 32px 24px;text-align:center;background-color:#0e1b30;">
                    <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 12px;">Sígueme en redes</p>
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
                      <tr>
                        <td style="padding:0 4px;">
                          <a href="https://www.instagram.com/jploaizao"
                            style="display:inline-block;padding:6px 14px;border:1px solid rgba(197,160,89,0.35);color:#C5A059;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif;text-decoration:none;">
                            Instagram
                          </a>
                        </td>
                        <td style="padding:0 4px;">
                          <a href="https://www.youtube.com/@jploaizao"
                            style="display:inline-block;padding:6px 14px;border:1px solid rgba(197,160,89,0.35);color:#C5A059;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif;text-decoration:none;">
                            YouTube
                          </a>
                        </td>
                        <td style="padding:0 4px;">
                          <a href="https://www.tiktok.com/@jploaizao"
                            style="display:inline-block;padding:6px 14px;border:1px solid rgba(197,160,89,0.35);color:#C5A059;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif;text-decoration:none;">
                            TikTok
                          </a>
                        </td>
                      </tr>
                    </table>
                    ${footer ?? defaultFineprint}
                  </td>
                </tr>
              </table>
            </td>
            <td width="12" style="border-right:1px solid rgba(197,160,89,0.15);"></td>
          </tr>
          <!-- Bottom corners -->
          <tr>
            <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
            <td style="border-bottom:1px solid rgba(197,160,89,0.25);height:12px;"></td>
            <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
          </tr>
        </table>
        <!-- Copyright -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr><td style="padding:14px;text-align:center;">
            <p style="color:#2d4a6e;font-size:11px;margin:0;font-family:Georgia,serif;letter-spacing:1px;">
              © 2026 Juan Pablo Loaiza · Todos los derechos reservados
            </p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
