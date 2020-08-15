const fs = require('fs');
const yaml = require('js-yaml');
const cldr = require('cldr');
const StringSet = require('../StringSet');

const {
  source: sourceFromYaml,
  translations: translationsFromYaml,
} = yaml.safeLoad(fs.readFileSync(`${__dirname}/lang-sources.yml`));

const output = Object.entries(
  Object.entries(translationsFromYaml).reduce((langs, [translator, ts]) => {
    Object.entries(ts).forEach(([lang, t]) => {
      if (!langs[lang]) langs[lang] = {};
      const langTranslations = langs[lang];
      if (!langTranslations[t]) langTranslations[t] = [];
      const langTranslationTranslators = langTranslations[t];
      langTranslationTranslators.push(translator);
    });
    return langs;
  }, {})
).sort(([l1], [l2]) => l1 > l2)
  .reduce((allLangs, [lang, ts]) => (allLangs[lang] = ts, allLangs), {});

fs.writeFileSync('./lang-sources-by-lang.yml', yaml.safeDump(output));
