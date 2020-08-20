/* eslint-disable max-len */
const fs = require('fs');
const { safeLoad } = require('js-yaml');
const cldr = require('cldr');
const StringSet = require('../StringSet');

const {
  source: sourceFromYaml,
  translations: {
    page: pageTranslationsFromYaml,
    textonly: textonlyTranslationsFromYaml,
  },
} = safeLoad(fs.readFileSync(`${__dirname}/lang-sources.yml`));

/**
 * @extends Array
 */
class OrderedLangArray extends Array { } // eslint-disable-line no-unused-vars

/**
 * @returns {OrderedLangArray}
 */
const getAllLangsByNumSpeakers = () => Object.values(
  // efficiently extract ordered values from sparse array
  [
    ...Object.values(cldr.extractTerritoryInfo())
      .reduce((result, { literacyPercent = 100, population, languages }) => {
        languages.forEach(({ id: lang, populationPercent = 100, writingPercent = 100 }) => {
          lang = lang.replace(/_/g, '-');
          let langPop = result.get(lang) || 0;
          langPop += Math.floor(
            population
            * populationPercent * literacyPercent * writingPercent
            / 1000000, // divide the percentages by 100 each (100 * 100 * 100)
          );
          result.set(lang, langPop);
        });
        return result;
      }, new Map()),
  ].reduce((arr, [l, p]) => {
    arr[p] = l;
    return arr;
  }, [])
    .reverse(),
);

/**
 * @extends {Map<string, string[]>}
 */
class LangTranslationsMap extends Map { }

const getLangsFromYaml = () => { // eslint-disable-line import/prefer-default-export
  const langs = new LangTranslationsMap();
  const addTranslation = ([l, t]) => {
    if (!langs.has(l)) langs.set(l, new StringSet());
    langs.get(l).add(t);
  };
  Object.entries(sourceFromYaml).forEach(addTranslation);
  Object.entries({ ...pageTranslationsFromYaml, ...textonlyTranslationsFromYaml })
    .forEach(([l, ts]) => Object.keys(ts).forEach(t => addTranslation([l, t])));

  /** @type {LangTranslationsMap} */ const langsOrderedByNumSpeakers = getAllLangsByNumSpeakers()
    .reduce((newLs, l) => {
      if (langs.has(l)) {
        newLs.set(l, langs.get(l));
      }
      return newLs;
    }, new LangTranslationsMap());
  /** @type {LangTranslationsMap} */ const langsWithUnknownSpeakers = [...langs]
    .filter(([l]) => !langsOrderedByNumSpeakers.has(l));

  return new LangTranslationsMap([...langsOrderedByNumSpeakers, ...langsWithUnknownSpeakers]);
};

/**
 * @extends {Map<string, Set<string>>}
 */
class SubstringLanguagesMap extends Map { }

/**
 * @param {LangTranslationsMap} langs
 * @returns {Map<string, string | string[]>}
 */
const getLangIdSubstrings = (langs) => {
  /*
   * starting with short susbtrings,
   * create a Map { substrings => languages [Map] { lang => translations [Set] { <string> } } }
   * sort substrings by languages matched (ascending), then by proportion of translations matched within each (descending)
   * Consider combinations of substrings shorter than n-2 [TODO: refine this] that, combined,
   * would be max n characters and would match the same language’s translations
   * add any substrings that only match one language to the result (along with [number of] translations matched)
   * remove those substrings from the map
   * repeat until no new substrings are found
   *
   *  - we now have only languages that can’t easily be matched... look for more complex strategies
   */

  const MAX_SUBSTRING_LEN = 100;
  const substringsMap = new SubstringLanguagesMap();
  const langsRemaining = new Map([...langs]);

  const translationsMultipleLangsMap = new Map(
    [
      ...[...langs].reduce((tsMulLangs, [l, ts]) => {
        ts.forEach((t) => {
          if (!tsMulLangs.has(t)) tsMulLangs.set(t, new StringSet());
          tsMulLangs.get(t).add(l);
        });
        return tsMulLangs;
      }, new Map()),
    ].filter(([t, ls]) => ls.size > 1), // eslint-disable-line no-unused-vars
  );
  const langsWithSharedTranslations = [...translationsMultipleLangsMap]
    .reduce((result, [t, ls]) => { // eslint-disable-line no-unused-vars
      [...ls].forEach(l => result.add(l));
      return result;
    }, new StringSet());

  // map translations to languages

  // n == substring length
  for (let n = 1; n <= MAX_SUBSTRING_LEN; n++) { // eslint-disable-line no-plusplus
    // map plain substrings
    langs.forEach((ts, lang) => ts.substrings({ length: n }).forEach((tSet, substr) => {
      if (!substringsMap.has(substr)) substringsMap.set(substr, new Map());
      substringsMap.get(substr).set(lang, tSet);
    }));
  }

  /**
   * Remove languages from a list of lang->translations if the list already contains
   * another language that shares duplicate translations with a language
   *
   * @param {string[]} nondups
   * @param {[string, Set<string>]}
   */
  const ignoreDuplicateTranslations = (nondups, [l, ts]) => {
    if (
      !langsWithSharedTranslations.has(l)
      || !nondups.find(
        ([l2, ts2]) => [...translationsMultipleLangsMap].find(
          ([t, ls]) => ts.has(t) && ts2.has(t) && ls.has(l) && ls.has(l2),
        ),
      )
    ) {
      nondups.push([l, ts]);
    }
    return nondups;
  };

  const mostPromisingSubstrings = new SubstringLanguagesMap([...substringsMap].sort(
    ([ss1, lTm1], [ss2, lTm2]) => ( // ss == substring, lTm == languageTranslationMap
      ss1.length !== ss2.length || lTm1.size !== lTm2.size
        // sort short substrings and substrings with few language matches before others
        ? (ss1.length + [...lTm1].reduce(ignoreDuplicateTranslations, []).length)
        - (ss2.length + [...lTm2].reduce(ignoreDuplicateTranslations, []).length)
        // if we can’t distinguish that way, sort substrings that match many translations first
        : [...lTm2][0][1].size - [...lTm1][0][1].size
    ),
  ));

  // find the ones that can be matched with a single substring
  const singleLangSubstringIdMap = [...mostPromisingSubstrings].reduce((langIds, [ss, lTm]) => {
    if (lTm.size === 1) {
      const [[l, ts]] = [...lTm];
      if (
        langsRemaining.get(l)
      ) {
        if (!langIds.has(l)) langIds.set(l, new StringSet());
        if ([...langsRemaining.get(l)].find(t => ts.has(t))) {
          langIds.get(l).add(ss);
          [...ts].forEach(t => langsRemaining.get(l).delete(t));
          if (langsRemaining.get(l).size === 0) {
            langsRemaining.delete(l);
          }
        }
      }
    }
    return langIds;
  }, new Map());

  const pageTranslationLangs = new Set(Object.keys(pageTranslationsFromYaml));
  return new Map([...singleLangSubstringIdMap].filter(([l]) => pageTranslationLangs.has(l)));
};

const stringifyMap = (stringMap, { separator = ':', or = '|', list = ',' } = {}) => [...stringMap]
  .map(([k, v]) => `${typeof v === 'string' ? v : [...v].join(or)}${separator}${k}`).join(list);

const writeLangIdSubstringMap = () => {
  const langs = getLangsFromYaml();
  const idSubstringsMap = getLangIdSubstrings(langs);
  const outputString = stringifyMap(new Map(idSubstringsMap));

  fs.writeFileSync(
    `${__dirname}/lang-id-strings.js`,
    `// Run \`node ./create-lang-id-strings.js\` to update this file

export default '${
  outputString.replace(/'/gu, "\\'")
}';\n`,
  );
};

writeLangIdSubstringMap();

module.exports = {
  getLangsFromYaml,
  getLangIdSubstrings,
  writeLangIdSubstringMap,
  translationsFromYaml: pageTranslationsFromYaml,
};
