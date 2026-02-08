import fs from "node:fs";
import { load } from "js-yaml";
import {
  buildLangMapToLangRegexJSString,
  getLangIdSubstrings,
} from "../createLangIds";
import StringSet from "../utils/StringSet";

describe("createLangIds", () => {
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
      expect(result.get("gl")?.has("d")).toBe(true);
      expect(result.get("fr")?.has("u")).toBe(true);
    });
  });

  describe("buildLangMapToLangRegexJSString", () => {
    describe("should build regexes that match every translation to its language", () => {
      const {
        translations: { page: pageTranslations },
      } = load(
        fs.readFileSync(
          `${__dirname}/../../src/translations/Skip-to-main-content.yml`,
        ),
      );

      const langMap = Function(
        `return ${buildLangMapToLangRegexJSString()}`,
      )() as { [lang: string]: RegExp };

      const translations = Object.entries(
        pageTranslations as {
          [lang: string]: { [translation: string]: string[] };
        },
      )
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

      test.concurrent.each(
        translations,
      )("detects %s: “%s” (%s)", (lang, translation) => {
        const [resultLang] =
          Object.entries(langMap).find(([, regex]) =>
            regex.test(translation),
          ) || [];

        expect(resultLang).toEqual(lang);
      });
    });
  });
});
