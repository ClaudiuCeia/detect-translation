import { Services } from "../translationServices";
import { observe, disconnect } from "..";
import JSDOMEnvironment from "jest-environment-jsdom";
declare var jsdom: JSDOMEnvironment["dom"];

describe("Test proxy translations", () => {
  afterEach(() => {
    disconnect();
  });

  test("Can detect Google proxy translation", done => {
    const targetLang = "ro-ro";
    const mockProxyCallback = jest.fn((service, lang) => {
      try {
        expect(service).toEqual(Services.GOOGLE);
        expect(lang).toEqual(targetLang);
        done();
      } catch (err) {
        done(err);
      }
    });

    jsdom.reconfigure({ url: "https://translate.googleusercontent.com/" });

    observe({ onClient: () => { }, onProxy: mockProxyCallback });

    document.documentElement.lang = targetLang;
  });
});
