const LOGO_URL = "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=56962081884";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function emailShell(content: string, footer?: string): string {
  const defaultFooter = `
    <p style="color:#C5A059;font-size:9px;letter-spacing:4px;text-transform:uppercase;font-family:Georgia,serif;margin:0 0 12px;">Juan Pablo Loaiza</p>
    <p style="color:#2d4a6e;font-size:11px;margin:0 0 8px;font-family:Georgia,serif;">
      <a href="mailto:newsletter@juanpabloloaiza.com" style="color:#4a6a8a;text-decoration:none;">newsletter@juanpabloloaiza.com</a>
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
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#16213e;border:1px solid rgba(197,160,89,0.25);">
          <tr>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
            <td style="border-top:1px solid rgba(197,160,89,0.25);height:12px;"></td>
            <td width="12" height="12" style="border-top:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
          </tr>
          <tr>
            <td width="12" style="border-left:1px solid rgba(197,160,89,0.15);"></td>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#0e1b30;padding:28px 32px 24px;text-align:center;border-bottom:1px solid rgba(197,160,89,0.2);">
                    <img src="${LOGO_URL}" width="160" alt="Juan Pablo Loaiza" style="display:inline-block;max-width:160px;border:0;opacity:0.9;"/>
                  </td>
                </tr>
              </table>
              ${content}
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 32px 28px;text-align:center;background-color:#0e1b30;border-top:1px solid rgba(197,160,89,0.15);">
                    ${footer ?? defaultFooter}
                  </td>
                </tr>
              </table>
            </td>
            <td width="12" style="border-right:1px solid rgba(197,160,89,0.15);"></td>
          </tr>
          <tr>
            <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-left:1px solid #C5A059;"></td>
            <td style="border-bottom:1px solid rgba(197,160,89,0.25);height:12px;"></td>
            <td width="12" height="12" style="border-bottom:1px solid #C5A059;border-right:1px solid #C5A059;"></td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr><td style="padding:16px;text-align:center;">
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
