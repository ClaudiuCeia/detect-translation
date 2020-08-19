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
const getLangIdSubstrings2 = (langs) => {
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
    ].filter(([t, ls]) => ls.size > 1)
  );
  console.log('Translations corresponding to multiple languages:', translationsMultipleLangsMap);
  const langsWithSharedTranslations = [...translationsMultipleLangsMap]
    .reduce((result, [t, ls]) => {
      [...ls].forEach(l => result.add(l));
      return result;
    }, new StringSet());
  console.log('Languages that share translations:', langsWithSharedTranslations);

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

  console.log('Finished finding single id substrings. Remaining languages:', langsRemaining.keys());

  // find the ones that can be matched with alternate substrings
  const alternateSubstringIdMap = [
    ...[...mostPromisingSubstrings].reduce((langIds, [ss, lTm]) => {
      if (
        singleLangSubstringIdMap.has(ss)
        || lTm.size !== 1
        || !langsRemaining.has([...lTm][0][0])
      ) {
        return langIds;
      }

      const [[l]] = [...lTm];
      if (!langIds.has(l)) langIds.set(l, new StringSet());
      langIds.get(l).add(ss);
      const lTremainingAfterThisSubstring = [...langsRemaining.get(l)].reduce((ts, t) => {
        if (!t.includes(ss)) ts.add(t);
        return ts;
      }, new StringSet());
      if (lTremainingAfterThisSubstring.size === 0) {
        langsRemaining.delete(l);
      } else {
        langsRemaining.set(l, lTremainingAfterThisSubstring);
      }

      return langIds;
    }, new Map()),
  ].map(([l, ss]) => [[...ss], l]);

  console.log('Alternate substrings:', alternateSubstringIdMap);
  console.log('Finished finding alternate id substrings. Remaining languages:', langsRemaining);

  return new Map([...singleLangSubstringIdMap]);

  /* combinations! .....
  // map substring combinations
  const allSubstrs = [...substringsMap.keys()];
  const allSubstrStringsSoFar = new Set(allSubstrs.filter(k => typeof k === 'string'));
  const allSubstrCombosSoFar = allSubstrs.filter(k => Array.isArray(k));
  allSubstrStringsSoFar.forEach((ss1) => {
    // on each iteration, look only for combinations with substrings of length n
    if (ss1.length !== n) return;
    allSubstrStringsSoFar.forEach(((ss2) => {
      if (ss1 === ss2) return;
      // crudely make sure the combination is in the right order for insertion
      const [ssX, ssY] = [ss1, ss2].sort((a, b) => a < b);
      // check that the same substring combo hasn’t already been added
      if (allSubstrCombosSoFar.find(([x, y]) => x === ssX && y === ssY)) return;

      langs.forEach((ts, lang) => {
        const matches = new StringSet([...ts].filter(t => t.includes(ssX) && t.includes(ssY)));
        if (matches.size) {
          const combo = [ssX, ssY];
          if (!substringsMap.has(combo)) substringsMap.set(combo, new Map());
          substringsMap.get(combo).set(lang, matches);
          allSubstrCombosSoFar.push([ssX, ssY]);
        }
      });
    }));
  }); */
};

const getLangIdSubstrings = (langs) => {
  /*
   *  create an empty map of languages to all substrings
   *  create an empty map of languages to id substrings
   *  for n of 1..max length
   *    for each language,
   *      add each substring of length n to the lang entry of the all substrings map
   *    for each language,
   *      if that language does not already have an entry in the language to id substring map
   *        for each substring of length n from the lang’s own map entry
   *          if that substring is not found in all translations for that lang, skip
   *          if that substring is in any of the other languages’ map entries / substring sets, skip;
   *          else, add this substring to the language to id substring map
   */
  const MAX_SUBSTRING_LEN = 100;
  // create an empty map of languages to id substrings
  const idSubstringsMap = new Map();
  // for n of 1..max length
  for (let n = 1; n <= MAX_SUBSTRING_LEN; n++) { // eslint-disable-line no-plusplus
    let foundIdSubstringsForAllLangs = true; // set to false below if we fail to find for any lang
    // create an empty map of languages to all substrings
    const allSubstringsMap = new Map();
    // for each language,
    //   add each substring of length n to the lang entry of the all substrings map
    langs.forEach((ts, lang) => allSubstringsMap.set(lang, ts.substrings({ length: n }).keys()));
    // check if no substrings are found (asking for substrings longer than the translations)
    // and break if so
    if ([...allSubstringsMap].every(([lang, substrs]) => !substrs.size)) {
      break;
    }
    // for each language,
    langs.forEach((ts, lang) => { // eslint-disable-line no-loop-func
      // if that language does not already have an entry in the language to id substring map
      if (idSubstringsMap.has(lang)) return;
      const allLangSubstrings = allSubstringsMap.get(lang);
      const allLangSubstringsInEveryTranslation = new StringSet(
        [...allLangSubstrings].filter(str => [...ts].every(t => t.includes(str))),
      );
      const allLangSubstringsToMatchAgainst = allLangSubstringsInEveryTranslation.size
        ? allLangSubstringsInEveryTranslation
        : allLangSubstrings;
      allLangSubstringsToMatchAgainst.forEach((substr) => {
        // if we’ve found a substring that’s unique to this lang
        if ([...allSubstringsMap].every(([l, substrs]) => l === lang || !substrs.has(substr))) {
          if (!idSubstringsMap.has(lang)) {
            idSubstringsMap.set(lang, new StringSet());
          }
          idSubstringsMap.get(lang).add(substr);
        }
      });

      if (!idSubstringsMap.has(lang)) {
        foundIdSubstringsForAllLangs = false;
      } else if (allLangSubstringsInEveryTranslation.size) {
        // we only need one substring to match against; let’s choose a random one ;)
        const idSubstrs = [...idSubstringsMap.get(lang)];
        const indexToKeep = Math.floor(Math.random() * idSubstrs.length);
        const idSubstrToKeep = idSubstrs[indexToKeep];
        idSubstringsMap.set(lang, new StringSet([idSubstrToKeep]));
      } else {
        // not all substrings are found in every translation; we need to filter out unnecessary ones
        const idSubstrs = [...idSubstringsMap.get(lang)];

        // count how many translations each substring hits
        const substringToNumTranslationsMap = new Map();
        [...idSubstrs].forEach((substr) => {
          substringToNumTranslationsMap.set(substr, 0);
          [...ts].forEach((t) => {
            if (t.includes(substr)) {
              substringToNumTranslationsMap.set(
                substr,
                substringToNumTranslationsMap.get(substr) + 1,
              );
            }
          });
        });

        // just pick the first substring that is most popular until we hit all translations
        const translationsToSubstringMap = new Map();
        [...substringToNumTranslationsMap]
          .sort(([s1, n1], [s2, n2]) => n1 < n2) // largest first
          .map(([s, n]) => [s, n])
          .forEach(([s]) => {
            [...ts].forEach(t => !translationsToSubstringMap.has(t) && t.includes(s) && translationsToSubstringMap.set(t, s));
          });

        const idSubstrsToKeep = [...translationsToSubstringMap].map(([t, s]) => s);
        idSubstringsMap.set(lang, new StringSet(idSubstrsToKeep));
      }
    });
    if (foundIdSubstringsForAllLangs) {
      break;
    }
  }
  const allLangsByNumSpeakers = getAllLangsByNumSpeakers();
  return new Map(
    [...idSubstringsMap].sort(
      ([l1], [l2]) => {
        const [i1, i2] = [l1, l2].map((l) => {
          let i = allLangsByNumSpeakers.indexOf(l);
          if (i === -1) {
            i = Infinity;
          }
          return i;
        });
        // if both are Infinity, i.e. not found, i1 - i2 === NaN so return 0 instead.
        return i1 - i2 || 0;
      },
    ),
  );
};

const stringifyMap = (stringMap, { separator = ':', or = '|', list = ',' } = {}) => [...stringMap]
  .map(([k, v]) => `${typeof v === 'string' ? v : [...v].join(or)}${separator}${k}`).join(list);

const writeLangIdSubstringMap = () => {
  const langs = getLangsFromYaml();
  // console.log('langs', langs);
  const idSubstringsMap = getLangIdSubstrings2(langs);
  console.log('idSubstringsMap', idSubstringsMap);
  // const undetectedLangs = new Map([...langs].filter(([l]) => !idSubstringsMap.has(l)));
  const outputString = stringifyMap(new Map(idSubstringsMap));

  fs.writeFileSync(`${__dirname}/lang-id-strings.js`, `export default '${
    outputString.replace(/'/gu, "\\'")
    }';\n`);
};

writeLangIdSubstringMap();

module.exports = {
  getLangsFromYaml,
  getLangIdSubstrings2,
  writeLangIdSubstringMap,
  translationsFromYaml: pageTranslationsFromYaml,
};
