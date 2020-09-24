/* eslint-disable max-len, no-unused-vars */
import fs from 'fs';
import { expect } from 'chai';
import sandbox from 'sd-sandbox';
import { safeLoad } from 'js-yaml';
import { getBaseTargetLang } from './detect-language';
import { SKIP_TO_MAIN_CONTENT_ID } from '../../../common/constants';

describe(__filename, sandbox(() => {
  let mockContentEl = {
    title: 'Skip to main content',
    innerText: 'Skip to main content',
  };

  /* beforeEach(() => {
    global.window = {
      document: {
        documentElement: {},
        getElementById: sandbox.stub(
          sel => (sel === SKIP_TO_MAIN_CONTENT_ID ? mockContentEl : null),
        );
        querySelector: sandbox.stub(
          sel => (sel === `#${SKIP_TO_MAIN_CONTENT_ID}` ? mockContentEl : null),
        ),
      },
    };
    global.document = global.window.document;
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  }); */

  describe('getFullyQualifiedPageLang', () => {
    describe('HTML element lang attribute', () => {
      it('should not add the target language to the html element if already set', () => {
        // window.document.documentElement.lang = ''
      });

      it('should correct the lang attribute if present but incorrect', () => {

      });

      it('should add the target language to the html element if not there', () => {

      });

      it('should not modify the HTML element’s lang attribute in QQ Browser’s side-by-side view', () => {

      });

      it('should add lang="zh" to QQ Browser’s side-by-side view container', () => {

      });

      it('should add lang="en" to QQ Browser’s side-by-side contents containers', () => {

      });

      it('should add lang="zh" to QQ Browser’s translated content container once translated', () => {

      });
    });
  });

  describe('language detector', () => {
    describe('in Bing (web)', () => {
      it('detects the language', () => {
        // Bing sets the lang attribute on the html element
      });
    });

    describe('in Baidu', () => {
      it('detects the language', () => {
        // const [, target] = window.location.search.slice(1).split('&').map(q => q.split('=')).find(([param]) => param === 'to')
        // target === 'zh' OR target === 'yue' etc

        // if window.location.search === "?query=https%3A%2F%2Fwww.sciencedirect.com%2Ftopics%2Fveterinary-science-and-veterinary-medicine%2Fepinephrine&from=auto&to=zh&source=url&frzj=cfy"

        // expect the result to be { lang: zh-t-en-t0-baidu' }


        // special case: test `&to=slo` and check that it correctly returns sl (Slovenian) not sk (Slovakian)
      });
    });

    describe('in Google (built-in Chrome extension)', () => {
      it('detects the language', () => {
        // should take a hint from the html lang attribute
        // should ignore any `-x-` extension
        // should replace obsolete/incorrect lang tags with correct ones
        // if lang is `iw-x-mtfrom-en` should return `he-t-en-t0-google`
        // if lang is `tl` should return `fil-t-SOURCE-t0-googch`
      });
    });

    describe('in Google (translate.google.com)', () => {
      it('detects the language', () => {
        // should take a hint from the html lang attribute
        // should ignore any `-x-` extension
        // should replace obsolete/incorrect lang tags with correct ones
        // if lang is `iw-x-mtfrom-en` should return `he-t-en-t0-google`
        // if lang is `tl` should return `fil-t-SOURCE-t0-googweb`
      });
    });

    describe('in GramTrans', () => {
      it('detects the language', () => {
        // query param "pair" indicates language pair
        // pair=eng2dan: da-t-en
        // pair=eng2epo: eo-t-en
        // pair=eng2qax: eo-t-en
        // pair=eng2nor: no-t-en

        const langs = {
          dan: 'da',
          deu: 'de',
          eng: 'en',
          'eng/us': 'en-US',
          'eng/uk': 'en-GB',
          epo: 'eo',
          nor: 'no',
          swe: 'sw',
          qax: 'eo',
        };

        // query param "url" contains original URL (URL-encoded)
        // should reset the URL for Adobe
      });
    });

    describe('in Papago', () => {
      it('detects the language', () => {

      });

      it('returns ko (Korean) if the target is set to auto', () => {
        // if window.parent.location.search includes `&target=<LANG>&` (LANG !== 'auto')
        // then we should return `LANG-t-SOURCE-t0-papago` (after filtering lang codes)
        // otherwise try to detect the language
        // and default to `ko-t-SOURCE-t0-papago`
      });
    });

    describe('in unknown translators', () => {
      it('detects the language if set on the HTML lang attribute', () => {

      });

      it('detects the language if set on the content element lang attribute', () => {

      });

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
              languages: [],
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
            it(`detects ${translator}’s “${t}” as ${lang}`, () => {
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
  });
}));
