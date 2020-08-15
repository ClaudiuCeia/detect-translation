const fs = require('fs');
const { safeLoad } = require('js-yaml');
const cldr = require('cldr');
const StringSet = require('../StringSet');

const {
  source: sourceFromYaml,
  translations: translationsFromYaml,
} = safeLoad(fs.readFileSync(`${__dirname}/lang-sources.yml`));

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

const getLangsFromYaml = () => { // eslint-disable-line import/prefer-default-export
  const langs = new Map();
  const addTranslation = ([l, t]) => {
    if (!langs.has(l)) langs.set(l, new StringSet());
    langs.get(l).add(t);
  };
  Object.entries(sourceFromYaml).forEach(addTranslation);
  Object.values(translationsFromYaml)
    .forEach(ts => Object.entries(ts).forEach(addTranslation));
  const langsOrderedByNumSpeakers = getAllLangsByNumSpeakers()
    .reduce((newLs, l) => {
      if (langs.has(l)) {
        newLs.set(l, langs.get(l));
      }
      return newLs;
    }, new Map());
  const langsWithUnknownSpeakers = [...langs]
    .filter(([l]) => !langsOrderedByNumSpeakers.has(l));

  return new Map([...langsOrderedByNumSpeakers, ...langsWithUnknownSpeakers]);
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
    langs.forEach((ts, lang) => allSubstringsMap.set(lang, ts.substrings({ length: n })));
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
        return i1 - i2 || 0; // if both are Infinity, i1 - i2 === NaN so return 0 instead.
      },
    ),
  );
};

const stringifyMap = (stringMap, { separator = ':', or = '|', list = ',' } = {}) => [...stringMap]
  .map(([k, v]) => `${typeof v === 'string' ? v : [...v].join(or)}${separator}${k}`).join(list);

const writeLangIdSubstringMap = () => {
  const langs = getLangsFromYaml();
  const idSubstringsMap = getLangIdSubstrings(langs);
  const undetectedLangs = new Map([...langs].filter(([l]) => !idSubstringsMap.has(l)));
  const outputString = stringifyMap(new Map([...idSubstringsMap, ...undetectedLangs]));

  if (outputString.includes("'")) throw new Error('Cannot serialise output string as it contains ')
  fs.writeFileSync(`${__dirname}/lang-id-strings.js`, `export default '${outputString}';\n`);
};

writeLangIdSubstringMap();

module.exports = {
  getLangsFromYaml,
  writeLangIdSubstringMap,
  translationsFromYaml,
};
