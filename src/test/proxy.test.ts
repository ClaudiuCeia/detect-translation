import type JSDOMEnvironment from "jest-environment-jsdom";
import { observe } from "..";
import { Services } from "../translationServices";
import whichProxyTranslation from "../whichProxyTranslation";

declare const jsdom: NonNullable<JSDOMEnvironment["dom"]>;

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

  test.each([
    [Services.APERTIUM, "www.apertium.org"],
    [Services.BAIDU, "translate.baiducontent.com"],
    [Services.BAIDU, "fanyi.baidu.com"],
    [Services.MICROSOFT, "www.translatoruser-int.com"],
    [Services.MICROSOFT, "www.translatetheweb.com"],
    [Services.MICROSOFT, "ssl.microsofttranslator.com"],
    [Services.MICROSOFT, "www.microsofttranslator.com"],
    [Services.CAIYUN, "interpreter.caiyunai.com"],
    [Services.GOOGLE, "translate.googleusercontent.com"],
    [Services.GOOGLE, "translate.google.de"],
    [Services.GRAMTRANS, "gramtrans.com"],
    [Services.LINGVANEX, "backenster.com"],
    [Services.LINGVANEX, "lingvanex.com"],
    [Services.NAVER, "papago.naver.net"],
    [Services.SOGOU, "translate.sogoucdn.com"],
    [Services.WORLDLINGO, "www.worldlingo.com"],
    [Services.YANDEX, "z5h64q92x9.net"],
    [Services.YANDEX, "translate.yandex.ru"],
    [Services.YOUDAO, "webtrans.yodao.com"],
  ])("detects the %s proxy hostname %s", (service, hostname) => {
    jsdom.reconfigure({ url: `https://${hostname}/` });

    expect(whichProxyTranslation({ lang: "fr" })).toEqual({
      lang: "fr",
      service,
      type: "proxy",
    });
  });

  test.each([
    "eviltranslate.google.com",
    "foo.microsofttranslator.com",
    "evil.translate.yandex.com",
  ])("does not match the near-miss hostname %s", (hostname) => {
    jsdom.reconfigure({ url: `https://${hostname}/` });

    expect(whichProxyTranslation({ lang: "fr" })).toEqual({
      lang: "fr",
      service: undefined,
      type: undefined,
    });
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
