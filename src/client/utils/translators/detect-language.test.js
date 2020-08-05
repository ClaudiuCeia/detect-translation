describe('HTML element lang attribute', () => {
  it('should not add the target language to the html element if already there', () => {
    // 
  });

  it('should correct the lang attribute if present but incorrect', () => {

  });

  it('should add the target language to the html element if not there', () => {
    // 
  });
});

describe('identifies translators and languages', () => {
  describe('Bing', () => {
    it('should be detected correctly', () => {

    });

    it('should return the correct language code', () => {
      // Bing sets the lang attribute on the html element
    });
  });

  describe('Baidu', () => {
    it('should be detected correctly', () => {
      // if window.location.origin is http://translate.baiducontent.com/

      // expect the result to be { lang: 'und-t-en-t0-baidu', text: 'abocado' }
    });

    it('should return the correct language code', () => {
      // const [, target] = window.location.search.slice(1).split('&').map(q => q.split('=')).find(([param]) => param === 'to')
      // target === 'zh' OR target === 'yue' etc

      // if window.location.search === "?query=https%3A%2F%2Fwww.sciencedirect.com%2Ftopics%2Fveterinary-science-and-veterinary-medicine%2Fepinephrine&from=auto&to=zh&source=url&frzj=cfy"

      // expect the result to be { lang: zh-t-en-t0-baidu' }
    });
  });

  describe('Google (built-in Chrome extension)', () => {
    it('should be detected correctly', () => {
      // if window.location.origin is NOT https://translate.googleusercontent.com/
      //   BUT document.querySelector('#goog-gt-tt.skiptranslate') returns something
      //   or document.querySelector('.goog-te-spinner-pos') returns something
      //   (or documentElement has class 'translated-ltr' or 'translated-rtl')
      // and title and innerText attributes are (abocado) not recognised

      // expect the result to be { lang: 'und-t-en-t0-googch', text: 'abocado' }
    });

    it('should return the correct language code', () => {
      // should take a hint from the html lang attribute
      // should ignore any `-x-` extension
      // should replace obsolete/incorrect lang tags with correct ones
      // if lang is `iw-x-mtfrom-en` should return `he-t-en-t0-google`
      // if lang is `tl` should return `fil-t-SOURCE-t0-googch`
    });
  });

  describe('Google (translate.google.com)', () => {
    it('should be detected correctly', () => {
      // if window.location.origin is https://translate.googleusercontent.com/
      // and no lang attribute is present
      // and title and innerText attributes are (abocado) not recognised

      // expect the result to be { lang: 'und-t-en-t0-googweb', text: 'abocado' }
    });

    it('should return the correct language code', () => {
      // should take a hint from the html lang attribute
      // should ignore any `-x-` extension
      // should replace obsolete/incorrect lang tags with correct ones
      // if lang is `iw-x-mtfrom-en` should return `he-t-en-t0-google`
      // if lang is `tl` should return `fil-t-SOURCE-t0-googweb`
    });
  });

  describe('GramTrans', () => {
    it('should be detected correctly', () => {
      // window.location.origin === 'https://gramtrans.com'
    });

    it('should return the correct language code', () => {
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

  describe('IBM Watson', () => {
    // if lang is `tl` should return `fil-t-SOURCE-t0-ibmwatsn`
  });

  describe('Papago', () => {
    it('should be detected correctly', () => {
      // if el.href
      //   or window.location
      //   or window.parent.location.origin
      // starts with 'https://papago.naver.net'
      // then Papago is translating
    });

    it('should default to target = Korean', () => {
      // if window.parent.location.search includes `&target=<LANG>&` (LANG !== 'auto')
      // then we should return `LANG-t-SOURCE-t0-papago` (after filtering lang codes)
      // otherwise try to detect the language
      // and default to `ko-t-SOURCE-t0-papago`
    });
  });

  describe('Sogou Browser', () => {
    // if lang is `tl` should return `fil-t-SOURCE-t0-sogou-browser`
  });

  describe('Yandex.Translate', () => {
    it('should be detected correctly', () => {
      // if window.location.origin === 'https://z5h64q92x9.net'
      //   OR document.querySelector('.tr-stripe')
      //   OR document.querySelector('#tr-stripe')
      //   OR document.querySelector('.tr-popup')
      //   OR document.querySelector('#tr-popup')
    });
    // if lang is `tl` should return `fil-t-SOURCE-t0-yandex`
  });
});
