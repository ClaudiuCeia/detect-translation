import { Services } from "../translationServices";
import { observe } from "..";
import { JSDOM } from "jsdom";
declare const jsdom: JSDOM;

describe("Test proxy translations", () => {
  let el: HTMLElement;
  let observer: MutationObserver | undefined;

  beforeEach(() => {
    el = document.createElement("a");
    el.classList.add('skip-link');
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
    observer?.disconnect();
  });

  test("Can detect Google proxy translation", () =>
    new Promise((resolve, reject) => {
      const sourceLang = "en";
      const targetLang = "ro";
      const mockTranslationCallback = jest.fn((lang, { service, type }) => {
        try {
          expect(service).toEqual(Services.GOOGLE);
          expect(lang).toEqual(targetLang + '-t-en-t0-google');
          expect(type).toEqual('proxy');
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      jsdom.reconfigure({ url: "https://translate.googleusercontent.com/" }); // eslint-disable-line
      document.documentElement.lang = sourceLang;

      observer = observe({
        onTranslation: mockTranslationCallback,
        sourceLang,
      });

      document.documentElement.lang = targetLang;
    }));

  test("Can detect Baidu proxy translation", () =>
    new Promise((resolve, reject) => {
      const sourceLang = "en";
      const targetLang = "ro";
      const mockTranslationCallback = jest.fn((lang, { service, type }) => {
        try {
          expect(service).toEqual(Services.BAIDU);
          expect(lang).toEqual(targetLang + '-t-en-t0-baidu');
          expect(type).toEqual('proxy');
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      jsdom.reconfigure({ url: "http://translate.baiducontent.com/" }); // eslint-disable-line
      document.documentElement.lang = sourceLang;

      observer = observe({
        onTranslation: mockTranslationCallback,
        sourceLang,
      });

      el.innerText = 'Salt la conținutul principal';
    }));
});
