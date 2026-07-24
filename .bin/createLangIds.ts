import fs from "node:fs";
import cldr from "cldr";
import { load } from "js-yaml";
import StringSet from "./utils/StringSet";

const SRC = `${__dirname}/../src`;
const CANARY_FILENAME = "Skip-to-main-content";

const SERBO_CROATIAN_LANGS = /^(sr-Latn|hr|bs|cnr)\b/;

export type TranslationMap = Record<string, Record<string, Array<string>>>;

type TranslationData = {
  source: Record<string, string>;
  sources: {
    translators: {
      page: Record<string, { langs?: string[]; url?: string }>;
      textonly: Record<string, string>;
    };
    cms: Record<string, string>;
    sites: Record<string, string>;
  };
  translations: {
    page: TranslationMap;
    textonly: TranslationMap;
  };
};

const {
  source: sourceFromYaml,
  sources: sourcesFromYaml,
  translations: {
    page: pageTranslationsFromYaml,
    textonly: textonlyTranslationsFromYaml,
  },
} = load(
  fs.readFileSync(`${SRC}/translations/${CANARY_FILENAME}.yml`, "utf8"),
) as TranslationData;

const getAllLangsByNumSpeakers = (): Array<string> => {
  const langPopMap = Object.values(
    cldr.extractTerritoryInfo() as Record<string, Record<string, unknown>>,
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
            1000000, // divide the percentages by 100 each (100 * 100 * 100)
        );
        result.set(lang, langPop);
      },
    );
    return result;
  }, new Map()) as Map<string, number>;
  const result = [...langPopMap]
    .sort(([l1, p1], [l2, p2]) => p2 - p1 || l1.localeCompare(l2))
    .map(([l]) => l);
  return result;
};

const allLangsByNumSpeakers = getAllLangsByNumSpeakers();

export const validateUniqueTranslationLangs = (
  ...translationGroups: Array<Record<string, unknown>>
): void => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  translationGroups.forEach((translations) => {
    Object.keys(translations).forEach((lang) => {
      if (seen.has(lang)) duplicates.add(lang);
      seen.add(lang);
    });
  });

  if (duplicates.size > 0) {
    throw new Error(
      `Duplicate translations found for langs: ${[...duplicates].join(", ")}`,
    );
  }
};

export const validateTranslationSources = (
  validSources: Set<string>,
  ...translationGroups: TranslationMap[]
): void => {
  const unknownSources = new Set<string>();

  translationGroups.forEach((translations) => {
    Object.values(translations).forEach((languageTranslations) => {
      Object.values(languageTranslations).forEach((translationSources) => {
        translationSources.forEach((source) => {
          if (!validSources.has(source)) unknownSources.add(source);
        });
      });
    });
  });

  if (unknownSources.size > 0) {
    throw new Error(
      `Unknown translation sources: ${[...unknownSources].sort().join(", ")}`,
    );
  }
};

export const validateUniqueSourceLangs = (
  pageSources: Record<string, { langs?: string[] }>,
): void => {
  const invalidSources = Object.entries(pageSources).flatMap(
    ([source, { langs = [] }]) => {
      const duplicates = [
        ...new Set(langs.filter((lang, i) => langs.indexOf(lang) !== i)),
      ];
      return duplicates.length > 0
        ? [`${source}: ${duplicates.sort().join(", ")}`]
        : [];
    },
  );

  if (invalidSources.length > 0) {
    throw new Error(`Duplicate source languages: ${invalidSources.join("; ")}`);
  }
};

export const getLangsFromYaml = (): Map<string, StringSet> => {
  const langs = new Map<string, StringSet>();
  const addTranslation = ([l, t]: [string, string]) => {
    if (!langs.has(l)) langs.set(l, new StringSet());
    langs.get(l)?.add(t.normalize("NFC"));
  };
  validateUniqueTranslationLangs(
    sourceFromYaml,
    pageTranslationsFromYaml,
    textonlyTranslationsFromYaml,
  );
  const validSources = new Set([
    ...Object.keys(sourcesFromYaml.translators.page),
    ...Object.keys(sourcesFromYaml.translators.textonly),
    ...Object.keys(sourcesFromYaml.cms),
    ...Object.keys(sourcesFromYaml.sites),
  ]);
  validateTranslationSources(
    validSources,
    pageTranslationsFromYaml,
    textonlyTranslationsFromYaml,
  );
  validateUniqueSourceLangs(sourcesFromYaml.translators.page);
  Object.entries(sourceFromYaml).forEach(addTranslation);
  Object.entries({
    ...pageTranslationsFromYaml,
    ...textonlyTranslationsFromYaml,
  }).forEach(([l, ts]) => {
    Object.keys(ts as Record<string, string[]>).forEach((t) => {
      addTranslation([l, t]);
    });
  });

  const langsOrderedByNumSpeakers: Map<string, StringSet> =
    allLangsByNumSpeakers.reduce((newLs, l) => {
      if (langs.has(l)) {
        newLs.set(l, langs.get(l) as StringSet);
      }
      return newLs;
    }, new Map<string, StringSet>());
  const langsWithUnknownSpeakers = [...langs].filter(
    ([l]) => !langsOrderedByNumSpeakers.has(l),
  );

  return new Map<string, StringSet>([
    ...langsOrderedByNumSpeakers,
    ...langsWithUnknownSpeakers,
  ]);
};

export const getLangIdSubstrings = (
  langs: Map<string, StringSet>,
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
    ].filter(([, ls]) => ls.size > 1),
  );
  const langsWithSharedTranslations = [...translationsMultipleLangsMap].reduce(
    (result, [, ls]) => {
      [...(ls as StringSet)].forEach((l) => {
        result.add(l);
      });
      return result;
    },
    new StringSet(),
  );

  // map translations to languages

  // n == substring length
  for (let n = 1; n <= MAX_SUBSTRING_LEN; n++) {
    // map plain substrings
    langs.forEach((ts, lang) => {
      ts.substrings({ length: n }).forEach((tSet, substr) => {
        if (!substringsMap.has(substr)) substringsMap.set(substr, new Map());
        substringsMap.get(substr)?.set(lang, tSet);
      });
    });
  }

  /**
   * Remove languages from a list of lang->translations if the list already contains
   * another language that shares duplicate translations with a language
   */
  const ignoreDuplicateTranslations = (
    nondups: Array<[string, StringSet]>,
    [l, ts]: [string, StringSet],
  ) => {
    if (
      !langsWithSharedTranslations.has(l) ||
      !nondups.find(([l2, ts2]) =>
        [...translationsMultipleLangsMap].find(
          ([t, ls]) => ts.has(t) && ts2.has(t) && ls.has(l) && ls.has(l2),
        ),
      )
    ) {
      nondups.push([l, ts]);
    }
    return nondups;
  };

  const mostPromisingSubstrings = new Map<string, Map<string, StringSet>>(
    [...substringsMap].sort(
      (
        [ss1, lTm1],
        [ss2, lTm2], // ss == substring, lTm == languageTranslationMap
      ) => {
        if (ss1.length !== ss2.length || lTm1.size !== lTm2.size) {
          // Sort short substrings and substrings with few language matches first.
          return (
            ss1.length +
            [...lTm1].reduce(ignoreDuplicateTranslations, []).length -
            (ss2.length +
              [...lTm2].reduce(ignoreDuplicateTranslations, []).length)
          );
        }

        // Otherwise prefer matches covering many translations, then sort stably.
        return (
          [...lTm2][0][1].size - [...lTm1][0][1].size || ss1.localeCompare(ss2)
        );
      },
    ),
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
            [...ts].forEach((t) => {
              langsRemaining.get(l)?.delete(t);
            });
            if (langsRemaining.get(l)?.size === 0) {
              langsRemaining.delete(l);
            }
          }
        }
      }
      return langIds;
    },
    new Map<string, StringSet>(),
  );

  const pageTranslationLangs = new Set(Object.keys(pageTranslationsFromYaml));
  return new Map(
    [...singleLangSubstringIdMap].filter(([l]) => pageTranslationLangs.has(l)),
  );
};

const escapeRegexLiteral = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

const langMapToLangRegexJSString = (
  stringMap: Map<string, Set<string> | string>,
  { or = "|", list = ",\n  " } = {},
) => `{
  ${[...stringMap]
    .sort(([l1], [l2]) => {
      const albns = allLangsByNumSpeakers;
      const l1Index = albns.includes(l1) ? albns.indexOf(l1) : Infinity;
      const l2Index = albns.includes(l2) ? albns.indexOf(l2) : Infinity;
      return l1Index === l2Index ? l1.localeCompare(l2) : l1Index - l2Index;
    })
    .map(([lang, substrs]) => {
      const [langCode, scriptCode] = lang.split(/[-_]/) as [
        string,
        string | undefined,
      ];
      const langName = cldr.extractLanguageDisplayNames("en")[langCode] as
        | string
        | undefined;
      const scriptName = cldr.extractScriptDisplayNames("en")[scriptCode] as
        | string
        | undefined;
      return `${/[-_]/.test(lang) ? `"${lang}"` : lang}:${
        langName || scriptName
          ? ` /* ${
              (langName || "") + (scriptName ? ` (${scriptName})` : "")
            } */`
          : ""
      } /${
        typeof substrs === "string"
          ? escapeRegexLiteral(substrs)
          : [...substrs].map(escapeRegexLiteral).join(or)
      }/`;
    })
    .join(list)}
}`;

export const buildLangMapToLangRegexJSString = (
  stringMap?: Map<string, Set<string> | string>,
): string => {
  const output = langMapToLangRegexJSString(
    stringMap || getLangIdSubstrings(getLangsFromYaml()),
  );
  return output;
};

export const writeLangIdSubstringMap = (): void => {
  const output = buildLangMapToLangRegexJSString();
  const filename = `${SRC}/translations/${CANARY_FILENAME}.ts`;

  fs.writeFileSync(
    filename,
    `// Run \`pnpm run langids\` to update this file
import { LangIds } from '../getDocumentLang';

const langIds: LangIds = ${output};

export default langIds;\n`,
  );
};
