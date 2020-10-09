import { Services } from "../translationServices";
import { observe, disconnect } from "..";

describe("Test client translations", () => {
  afterEach(() => {
    disconnect();
  });

  test("Can detect Google client translation", () =>
    new Promise((resolve, reject) => {
      const targetLang = "ro-ro";
      const mockClientCallback = jest.fn((service, lang) => {
        try {
          expect(service).toEqual(Services.GOOGLE);
          expect(lang).toEqual(targetLang);
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      document.documentElement.setAttribute("class", "");
      document.documentElement.lang = "en-us";

      observe({ onClient: mockClientCallback, onProxy: () => null });

      document.documentElement.setAttribute("class", "translated-ltr");
      document.documentElement.lang = targetLang;
    }));
});
