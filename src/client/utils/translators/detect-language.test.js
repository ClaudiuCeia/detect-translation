/* eslint-disable max-len, no-unused-vars */
import fs from 'fs';
import { expect } from 'chai';
import { safeLoad } from 'js-yaml';
import { getBaseTargetLang } from './detect-language';

describe(__filename, () => {
  let mockContentEl = {
    title: 'Skip to main content',
    innerText: 'Skip to main content',
  };

  describe('lang strings', () => {
    const { translations: { page: pageTranslations } } = safeLoad(fs.readFileSync(`${__dirname}/lang-sources.yml`));

    beforeEach(() => {
      global.window = {
        document: {
          documentElement: {
            lang: 'en',
          },
          querySelector: sandbox.stub(),
        },
        navigator: {
          languages: ['xx'],
        },
      };
      global.document = global.window.document;
    });

    afterEach(() => {
      delete global.document;
      delete global.window;
    });

    Object.entries(pageTranslations).reduce((allTs, [lang, ts]) => [
      ...allTs,
      ...Object.entries(ts).map(([t, translators]) => [translators.join('/'), lang, t]),
    ], [])
      .sort(([tr1, l1], [tr2, l2]) => l1 > l2)
      .forEach(([translator, lang, t]) => {
        if (/sh/.test(lang)) { // Serbo-Croatian
          lang = ['bs', 'hr', 'sr-Latn'][Math.floor(Math.random() * 3)];
        }
        it(`detects ${lang} for ${translator}’s “${t}”`, () => {
          global.window.document.getElementById = sandbox.stub().callsFake((id) => {
            if (id === 'skip') {
              return { innerText: t };
            }
            return null;
          });
          global.window.navigator.languages = ['zxx', lang];

          const result = getBaseTargetLang();

          expect(`${result}`).to.equal(lang);
        });
      });
  });
});
