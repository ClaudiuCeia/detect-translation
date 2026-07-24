import fs from "node:fs";
import { load } from "js-yaml";
import {
  buildLangMapToLangRegexJSString,
  getLangIdSubstrings,
  type TranslationMap,
  validateTranslationSources,
  validateUniqueSourceLangs,
  validateUniqueTranslationLangs,
} from "../createLangIds";
import StringSet from "../utils/StringSet";

describe("createLangIds", () => {
  describe("validateUniqueTranslationLangs", () => {
    it("accepts unique languages", () => {
      expect(() =>
        validateUniqueTranslationLangs(
          { en: "Skip to main content" },
          { fr: {} },
          { de: {} },
        ),
      ).not.toThrow();
    });

    it("reports every duplicated language", () => {
      expect(() =>
        validateUniqueTranslationLangs(
          { en: "Skip to main content", fr: "Contenu principal" },
          { en: {} },
          { fr: {} },
        ),
      ).toThrow("Duplicate translations found for langs: en, fr");
    });
  });

  describe("validateTranslationSources", () => {
    it("accepts registered translation sources", () => {
      expect(() =>
        validateTranslationSources(new Set(["google"]), {
          fr: { "Passer au contenu principal": ["google"] },
        }),
      ).not.toThrow();
    });

    it("reports unknown translation sources", () => {
      expect(() =>
        validateTranslationSources(new Set(["google"]), {
          fr: { "Passer au contenu principal": ["unknown", "Google"] },
        }),
      ).toThrow("Unknown translation sources: Google, unknown");
    });
  });

  describe("validateUniqueSourceLangs", () => {
    it("reports duplicate languages for each source", () => {
      expect(() =>
        validateUniqueSourceLangs({
          google: { langs: ["en", "fr", "en"] },
          yandex: { langs: ["de", "de"] },
        }),
      ).toThrow("Duplicate source languages: google: en; yandex: de");
    });
  });

  describe("getLangIdSubstrings", () => {
    it("should return a map of languages to unique substrings", () => {
      const langs = new Map([
        [
          "gl",
          new StringSet([
            "Saltar ao contido principal",
            "Ir ao contido principal",
          ]),
        ],
        [
          "fr",
          new StringSet([
            "Sauter sur le contenu principal",
            "Passer au contenu principal",
          ]),
        ],
      ]);

      const result = getLangIdSubstrings(langs);

      expect(result.size).toBe(2);
      for (const [lang, translations] of langs) {
        const identifiers = result.get(lang);
        expect(identifiers?.size).toBeGreaterThan(0);
        const regex = new RegExp([...(identifiers as StringSet)].join("|"));
        expect([...translations].every((text) => regex.test(text))).toBe(true);
      }
    });
  });

  describe("buildLangMapToLangRegexJSString", () => {
    describe("should build regexes that match every translation to its language", () => {
      const {
        translations: { page: pageTranslations },
      } = load(
        fs.readFileSync(
          `${__dirname}/../../src/translations/Skip-to-main-content.yml`,
          "utf8",
        ),
      ) as { translations: { page: TranslationMap } };

      const langMap = Function(
        `return ${buildLangMapToLangRegexJSString()}`,
      )() as { [lang: string]: RegExp };

      expect(langMap.ru.test("ю.")).toBe(true);
      expect(langMap.ru.test("юx")).toBe(false);

      const translations = Object.entries(pageTranslations)
        .reduce(
          (allTs, [lang, ts]) => {
            Object.entries(ts).forEach(([t, translators]) => {
              allTs.push([translators.join("/"), lang, t]);
            });
            return allTs;
          },
          [] as [string, string, string][],
        )
        .sort(([, l1], [, l2]) => +(l1 > l2))
        .reduce(
          (
            table,
            [translator, lang, translation]: [string, string, string],
          ) => {
            table.push([lang, translation, translator]);
            return table;
          },
          [] as [string, string, string][],
        );

      test.concurrent.each(translations)(
        "detects %s: “%s” (%s)",
        (lang, translation) => {
          const [resultLang] =
            Object.entries(langMap).find(([, regex]) =>
              regex.test(translation.normalize("NFC")),
            ) || [];

          expect(resultLang).toEqual(lang);
        },
      );
    });

    it("escapes regex metacharacters", () => {
      const literal = ".*+?^$" + "{}()|[]\\/";
      const langMap = Function(
        `return ${buildLangMapToLangRegexJSString(
          new Map([["en", new Set([literal])]]),
        )}`,
      )() as { [lang: string]: RegExp };

      expect(langMap.en.test(literal)).toBe(true);
      expect(langMap.en.test("unrelated text")).toBe(false);
    });
  });
});
