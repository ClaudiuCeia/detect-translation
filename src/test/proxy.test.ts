import { Services } from "../translationServices";
import { observe } from "..";
import { JSDOM } from "jsdom";
declare const jsdom: JSDOM;

describe("Test proxy translations", () => {
  let el: HTMLElement;
  let observer: MutationObserver | undefined;

  beforeEach(() => {
    el = document.createElement("a");
    el.classList.add("skip-link");
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
    observer?.disconnect();
  });

  test("Can detect Google proxy translation", (): Promise<void> =>
    new Promise((resolve, reject) => {
      const sourceLang = "en";
      const targetLang = "ro";
      const mockTranslationCallback = jest.fn((lang, { service, type }) => {
        try {
          expect(service).toEqual(Services.GOOGLE);
          expect(lang).toEqual(targetLang);
          expect(type).toBe("proxy");
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      jsdom.reconfigure({ url: "https://translate.googleusercontent.com/" });
      document.documentElement.lang = sourceLang;

      observer = observe({
        onTranslation: mockTranslationCallback,
        sourceLang,
      });

      document.documentElement.lang = targetLang;
    }));

  test("Can detect Baidu proxy translation", (): Promise<void> =>
    new Promise((resolve, reject) => {
      const sourceLang = "en";
      const targetLang = "ro";
      const mockTranslationCallback = jest.fn((lang, { service, type }) => {
        try {
          expect(service).toEqual(Services.BAIDU);
          expect(lang).toEqual(targetLang);
          expect(type).toBe("proxy");
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      jsdom.reconfigure({ url: "http://translate.baiducontent.com/" });
      document.documentElement.lang = sourceLang;

      observer = observe({
        onTranslation: mockTranslationCallback,
        sourceLang,
      });

      el.innerText = "Salt la conținutul principal";
    }));
});
