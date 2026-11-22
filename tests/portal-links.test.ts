import { describe, expect, it } from "vitest";
import { autoLinkPortal, PORTAL_URL } from "@/lib/portal-links";

describe("autoLinkPortal", () => {
  it("enlaza la primera mención de un autor a su ficha del portal", () => {
    const r = autoLinkPortal("El psiquiatra Brian Weiss popularizó la regresión. Brian Weiss escribió un libro.");
    expect(r.content).toContain(`[Brian Weiss](${PORTAL_URL}/blog/brian-weiss-quien-es/)`);
    expect(r.content.match(/\]\(https:\/\/www\.regresionvidaspasadas\.com/g)).toHaveLength(1);
    expect(r.links).toEqual([{ slug: "brian-weiss-quien-es", anchor: "Brian Weiss" }]);
  });

  it("conserva las mayúsculas del texto original", () => {
    const r = autoLinkPortal("según DOLORES CANNON, el método cambió.");
    expect(r.content).toContain("[DOLORES CANNON](");
  });

  it("no enlaza dentro de encabezados, citas, código ni texto ya enlazado", () => {
    const md = [
      "## Brian Weiss y la regresión",
      "> Michael Newton dijo algo",
      "`Dolores Cannon`",
      "Mira [Ian Stevenson](https://ejemplo.com/x) aquí.",
    ].join("\n");
    expect(autoLinkPortal(md).content).toBe(md);
  });

  it("respeta el máximo de enlaces por artículo", () => {
    const filler = "texto de relleno ".repeat(40);
    const md = ["Brian Weiss.", filler, "Michael Newton.", filler, "Dolores Cannon.", filler, "Ian Stevenson."].join("\n");
    expect(autoLinkPortal(md).links).toHaveLength(2);
  });

  it("no añade enlaces si el artículo ya enlaza al portal", () => {
    const md = `Ver [esto](${PORTAL_URL}/blog/srt-que-es/) y [otro](${PORTAL_URL}/blog/hipnosis-que-es-realmente/). Brian Weiss.`;
    expect(autoLinkPortal(md).content).toBe(md);
  });

  it("no toca palabras que solo contienen el nombre", () => {
    const md = "Los brianweissistas no existen.";
    expect(autoLinkPortal(md).content).toBe(md);
  });
});
