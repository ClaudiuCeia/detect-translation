/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable max-len */
import fs from "fs";
import { safeLoad } from "js-yaml";
import cldr from "cldr";
import StringSet from "./utils/StringSet";

const CANARY_FILENAME = "Skip-to-main-content";

const SERBO_CROATIAN_LANGS = /^(sr-Latn|hr|bs|cnr)\b/;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const {
  source: sourceFromYaml,
  translations: {
    page: pageTranslationsFromYaml,
    textonly: textonlyTranslationsFromYaml,
  },
} = safeLoad(
  fs.readFileSync(`${__dirname}/../translations/${CANARY_FILENAME}.yml`)
);

const getAllLangsByNumSpeakers = (): Array<string> => {
  const langPopMap = Object.values(
    cldr.extractTerritoryInfo() as Record<string, Record<string, unknown>>
  ).reduce((result, { literacyPercent = 100, population, languages }) => {
    (languages as Array<Record<string, unknown>>).forEach(
      ({ id: lang, populationPercent = 100, writingPercent = 100 }) => {
        lang = (lang as string).replace(/_/g, "-");
        if (SERBO_CROATIAN_LANGS.test(lang as string)) {
          lang = "sh"; // We code Serbian, Croatian, Bosnian and Montenegrin as Serbo-Croatian
          // as they are too similar to each other
        }
        let langPop = (result.get(lang) || 0) as number;
        langPop += Math.floor(
          ((population as number) *
            <number>populationPercent *
            <number>literacyPercent *
            <number>writingPercent) /
            1000000 // divide the percentages by 100 each (100 * 100 * 100)
        );
        result.set(lang, langPop);
      }
    );
    return result;
  }, new Map()) as Map<string, number>;
  const result = [...langPopMap]
    .sort(([, p1], [, p2]) => p2 - p1)
    .map(([l]) => l);
  return result;
};

const allLangsByNumSpeakers = getAllLangsByNumSpeakers();

export const getLangsFromYaml = (): Map<string, StringSet> => {
  const langs = new Map<string, StringSet>();
  const addTranslation = ([l, t]) => {
    if (!langs.has(l)) langs.set(l, new StringSet());
    langs.get(l)?.add(t);
  };
  const duplicateTranslations = Object.keys(pageTranslationsFromYaml).every(
    (l) => textonlyTranslationsFromYaml[l] || sourceFromYaml[l]
  );
  if (duplicateTranslations) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Duplicate translations found for langs: ${duplicateTranslations}`
    );
  }
  Object.entries(sourceFromYaml).forEach(addTranslation);
  Object.entries({
    ...pageTranslationsFromYaml,
    ...textonlyTranslationsFromYaml,
  }).forEach(([l, ts]) =>
    Object.keys(ts as Record<string, string[]>).forEach((t) =>
      addTranslation([l, t])
    )
  );

  const langsOrderedByNumSpeakers: Map<
    string,
    StringSet
  > = allLangsByNumSpeakers.reduce((newLs, l) => {
    if (langs.has(l)) {
      newLs.set(l, langs.get(l) as StringSet);
    }
    return newLs;
  }, new Map<string, StringSet>());
  const langsWithUnknownSpeakers = [...langs].filter(
    ([l]) => !langsOrderedByNumSpeakers.has(l)
  );

  return new Map<string, StringSet>([
    ...langsOrderedByNumSpeakers,
    ...langsWithUnknownSpeakers,
  ]);
};

export const getLangIdSubstrings = (
  langs: Map<string, StringSet>
): Map<string, StringSet> => {
  /*
   * starting with short susbtrings,
   * create a Map { substrings => languages [Map] { lang => translations [Set] { <string> } } }
   * sort substrings by languages matched (ascending) and translations matched within each (descending)
   * add any substrings that only match one language to the result (keeping track of number of translations matched)
   * repeat until all translations are matched
   */

  const MAX_SUBSTRING_LEN = 100;
  const substringsMap = new Map<string, Map<string, StringSet>>();
  const langsRemaining: Map<string, StringSet> = new Map([...langs]);
  const allLangs = getLangsFromYaml(); // create another copy of the original so we can check against it later

  const translationsMultipleLangsMap = new Map(
    [
      ...[...langs].reduce((tsMulLangs, [l, ts]) => {
        ts.forEach((t) => {
          if (!tsMulLangs.has(t)) tsMulLangs.set(t, new StringSet());
          tsMulLangs.get(t).add(l);
        });
        return tsMulLangs;
      }, new Map()),
    ].filter(([, ls]) => ls.size > 1)
  );
  const langsWithSharedTranslations = [...translationsMultipleLangsMap].reduce(
    (result, [, ls]) => {
      [...(ls as StringSet)].forEach((l) => result.add(l));
      return result;
    },
    new StringSet()
  );

  // map translations to languages

  // n == substring length
  for (let n = 1; n <= MAX_SUBSTRING_LEN; n++) {
    // eslint-disable-line no-plusplus
    // map plain substrings
    langs.forEach((ts, lang) =>
      ts.substrings({ length: n }).forEach((tSet, substr) => {
        if (!substringsMap.has(substr)) substringsMap.set(substr, new Map());
        substringsMap.get(substr)?.set(lang, tSet);
      })
    );
  }

  /**
   * Remove languages from a list of lang->translations if the list already contains
   * another language that shares duplicate translations with a language
   */
  const ignoreDuplicateTranslations = (
    nondups: Array<[string, StringSet]>,
    [l, ts]: [string, StringSet]
  ) => {
    if (
      !langsWithSharedTranslations.has(l) ||
      !nondups.find(([l2, ts2]) =>
        [...translationsMultipleLangsMap].find(
          ([t, ls]) => ts.has(t) && ts2.has(t) && ls.has(l) && ls.has(l2)
        )
      )
    ) {
      nondups.push([l, ts]);
    }
    return nondups;
  };

  const mostPromisingSubstrings = new Map<string, Map<string, StringSet>>(
    [...substringsMap].sort((
      [ss1, lTm1],
      [ss2, lTm2] // ss == substring, lTm == languageTranslationMap
    ) =>
      ss1.length !== ss2.length || lTm1.size !== lTm2.size
        ? // sort short substrings and substrings with few language matches before others
          ss1.length +
          [...lTm1].reduce(ignoreDuplicateTranslations, []).length -
          (ss2.length +
            [...lTm2].reduce(ignoreDuplicateTranslations, []).length)
        : // if we can’t distinguish that way, sort substrings that match many translations first
          [...lTm2][0][1].size - [...lTm1][0][1].size
    )
  );

  // find the ones that can be matched with a single substring
  const singleLangSubstringIdMap = [...mostPromisingSubstrings].reduce(
    (langIds, [ss, lTm]) => {
      if (lTm.size === 1) {
        const [[l, ts]] = [...lTm];
        if (langsRemaining.get(l)) {
          if (!langIds.has(l)) langIds.set(l, new StringSet());
          if (
            [...(langsRemaining.get(l) as StringSet)].find((t) => ts.has(t))
          ) {
            const lTs = [...(allLangs.get(l) as StringSet)];
            if (
              lTs.every((t) => t.includes(ss)) &&
              langIds.get(l)?.size !== 0
            ) {
              langIds.set(l, new StringSet([ss]));
            } else {
              langIds.get(l)?.add(ss);
            }
            [...ts].forEach((t) => langsRemaining.get(l)?.delete(t));
            if (langsRemaining.get(l)?.size === 0) {
              langsRemaining.delete(l);
            }
          }
        }
      }
      return langIds;
    },
    new Map<string, StringSet>()
  );

  const pageTranslationLangs = new Set(Object.keys(pageTranslationsFromYaml));
  return new Map(
    [...singleLangSubstringIdMap].filter(([l]) => pageTranslationLangs.has(l))
  );
};

const langMapTolangRegexJSString = (
  stringMap,
  { or = "|", list = ",\n  " } = {}
) => `{
  ${[...(stringMap as Map<string, Set<string>>)]
    .sort(([l1], [l2]) => {
      const albns = allLangsByNumSpeakers;
      return (
        (albns.includes(l1) ? albns.indexOf(l1) : Infinity) -
        (albns.includes(l2) ? albns.indexOf(l2) : Infinity)
      );
    })
    .map(([lang, substrs]) => {
      const [langCode, scriptCode] = lang.split(/[-_]/) as [
        string,
        string | undefined
      ];
      const langName = cldr.extractLanguageDisplayNames("en")[langCode] as
        | string
        | undefined;
      const scriptName = cldr.extractScriptDisplayNames("en")[scriptCode] as
        | string
        | undefined;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return `${/[-_]/.test(lang) ? `"${lang}"` : lang}:${
        langName || scriptName
          ? ` /* ${
              (langName || "") + (scriptName ? ` (${scriptName})` : "")
            } */`
          : ""
      } /${typeof substrs === "string" ? substrs : [...substrs].join(or)}/`;
    })
    .join(list)}
}`;

export const buildLangMapToLangRegexJSString = (): string => {
  const langs = getLangsFromYaml();
  const idSubstringsMap = getLangIdSubstrings(langs);
  const output = langMapTolangRegexJSString(idSubstringsMap);
  return output;
};

export const writeLangIdSubstringMap = (): void => {
  const output = buildLangMapToLangRegexJSString();
  const filename = `${__dirname}/../translations/${CANARY_FILENAME}.ts`;

  fs.writeFileSync(
    filename,
    `// Run \`yarn build\` to update this file
import { LangIds } from '../src/getDocumentLang';

const langIds: LangIds = ${output};

export default langIds;\n`
  );
};

export default {
  translationsFromYaml: pageTranslationsFromYaml as Record<string, string[]>,
};
