import { Services } from "../translationServices";
import { observe } from "..";
import JSDOMEnvironment from "jest-environment-jsdom";
declare const jsdom: JSDOMEnvironment["dom"];

describe("Test client translations", () => {
  let el: HTMLElement = null as unknown as HTMLElement;
  let observer: MutationObserver | undefined;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
    observer?.disconnect();
  });

  test("Can detect Google client translation", (): Promise<void> =>
    new Promise((resolve, reject) => {
      const sourceLang = "en";
      const targetLang = "ro";
      const mockClientCallback = jest.fn((lang, { service, type }) => {
        try {
          expect(service).toEqual(Services.GOOGLE);
          expect(lang).toEqual(targetLang);
          expect(type).toBe("client");
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      jsdom!.reconfigure({ url: "https://www.example.com/" }); // eslint-disable-line

      document.documentElement.setAttribute("class", "");
      document.documentElement.lang = sourceLang;

      observer = observe({
        onTranslation: mockClientCallback,
        sourceLang,
      });

      el.setAttribute("id", "goog-gt-tt");
      document.documentElement.lang = targetLang;
    }));
});
