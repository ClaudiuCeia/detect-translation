describe('translator detector', () => {
  it('detects Bing (web)', () => {

  });

  it('detects Baidu', () => {
    // if window.location.origin is http://translate.baiducontent.com/

    // expect the result to be { lang: 'und-t-en-t0-baidu', text: 'abocado' }
  });

  it('detects Google (built-in Chrome extension)', () => {
    // if window.location.origin is NOT https://translate.googleusercontent.com/
    //   BUT document.querySelector('#goog-gt-tt.skiptranslate') returns something
    //   or document.querySelector('.goog-te-spinner-pos') returns something
    //   (or documentElement has class 'translated-ltr' or 'translated-rtl')
    // and title and innerText attributes are (abocado) not recognised

    // expect the result to be { lang: 'und-t-en-t0-googext', text: 'abocado' }
  });

  it('detects Google (translate.google.com)', () => {
    // if window.location.origin is https://translate.googleusercontent.com/
    // and no lang attribute is present
    // and title and innerText attributes are (abocado) not recognised

    // expect the result to be { lang: 'und-t-en-t0-googweb', text: 'abocado' }
  });

  it('detects GramTrans', () => {
    // window.location.origin === 'https://gramtrans.com'
  });

  it('detects IBM Watson', () => {
    // if lang is `tl` should return `fil-t-SOURCE-t0-ibmwatsn`
  });

  it('detects Microsoft Edge translation extension', () => {

  });

  it('detects Papago', () => {
    // if el.href
    //   or window.location
    // starts with 'https://papago.naver.net'
    // then Papago is translating
  });

  it('detects Sogou (web)', () => {

  });

  it('detects Sogou Browser', () => {
    // if lang is `tl` should return `fil-t-SOURCE-t0-sogou-browser`
  });

  it('detects Yandex.Translate', () => {
    // if window.location.origin === 'https://z5h64q92x9.net'
    //   OR document.querySelector('.tr-stripe')
    //   OR document.querySelector('#tr-stripe')
    //   OR document.querySelector('.tr-popup')
    //   OR document.querySelector('#tr-popup')
    // if lang is `tl` should return `fil-t-SOURCE-t0-yandex`
  });

  it('detects Youdao', () => {
    // if window.location.hostname === 'webtrans.yodao.com'
  });

  it('detects unknown translators and provides some metadata about them', () => {
    // if window.location.origin === 'https://www.supertrans.com'
    //   then should return (LangMetaString) 'xxy-und-x-supertrans' {  }
  });
});
