import { describe, expect, it } from "vitest";
import { anchorTokens, autoLinkContent, type LinkablePost } from "../../src/lib/internal-links";

const mk = (slug: string, content: string, tags: string[] = ["a"]): LinkablePost => ({ slug, title: slug, tags, content });

describe("anchorTokens", () => {
  it("quita solo las palabras de pregunta que no cambian el tema", () => {
    expect(anchorTokens("que-es-la-hipnoterapia-clinica")).toEqual(["hipnoterapia", "clinica"]);
    expect(anchorTokens("alma-gemela-que-es")).toEqual(["alma", "gemela"]);
    expect(anchorTokens("cuanto-cuesta-una-regresion")).toEqual(["cuanto", "cuesta", "una", "regresion"]);
  });
  it("descarta slugs de una sola palabra", () => {
    expect(anchorTokens("hipnoterapeuta")).toBeNull();
  });
});

describe("autoLinkContent", () => {
  const target = mk("hipnosis-para-el-duelo", "x");
  const filler = Array.from({ length: 6 }, (_, i) => mk(`otro-${i}`, "texto sin relación"));

  it("enlaza la primera mención, ignorando tildes, mayúsculas y artículos", () => {
    const post = mk("origen", "Hablamos de Hipnosis para duelo en consulta. Otra vez hipnosis para el duelo.");
    const { content, links } = autoLinkContent(post, [post, target, ...filler]);
    expect(links).toEqual([{ slug: "hipnosis-para-el-duelo", anchor: "Hipnosis para duelo" }]);
    expect(content.match(/\]\(\/blog\/hipnosis-para-el-duelo\)/g)).toHaveLength(1);
  });

  it("no toca encabezados, texto ya enlazado ni el propio artículo", () => {
    const post = mk("origen", "## Hipnosis para el duelo\n\nVer [hipnosis para el duelo](/blog/x) aquí.");
    expect(autoLinkContent(post, [post, target, ...filler]).links).toEqual([]);
    const self = mk("hipnosis-para-el-duelo", "hipnosis para el duelo");
    expect(autoLinkContent(self, [self, ...filler]).links).toEqual([]);
  });

  it("no modifica artículos que ya tienen 3 enlaces internos", () => {
    const post = mk("origen", "[a](/blog/a) [b](/blog/b) [c](/blog/c) hipnosis para el duelo");
    expect(autoLinkContent(post, [post, target, ...filler]).links).toEqual([]);
  });
});
