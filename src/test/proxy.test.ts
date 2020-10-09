import { Services } from "../translationServices";
import { observe, disconnect } from "..";
import { JSDOM } from "jsdom";
declare const jsdom: JSDOM;

describe("Test proxy translations", () => {
  afterEach(() => {
    disconnect();
  });

  test("Can detect Google proxy translation", () =>
    new Promise((resolve, reject) => {
      const targetLang = "ro-ro";
      const mockProxyCallback = jest.fn((service, lang) => {
        try {
          expect(service).toEqual(Services.GOOGLE);
          expect(lang).toEqual(targetLang);
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      jsdom.reconfigure({ url: "https://translate.googleusercontent.com/" }); // eslint-disable-line

      observe({ onClient: () => null, onProxy: mockProxyCallback });

      document.documentElement.lang = targetLang;
    }));
});
