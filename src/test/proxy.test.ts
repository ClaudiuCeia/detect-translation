import { Services } from "../translationServices";
import { observe }  from "..";

describe("Test proxy translations", () => {
  test("Can detect Google proxy translation", () => {
    const lang = "ro-ro";
    const mockProxyCallback = jest.fn((service, lang) => {
      expect(service).toEqual(Services.GOOGLE);
      expect(lang).toEqual(lang);
    });

    document.documentElement.lang = lang;
    const location = {
      ...window.location,
      hostname: "translate.googleusercontent.com"
    };
      
    Object.defineProperty(window, "location", {
      writable: true,
      value: location
    });
      
    observe({ onClient: () => {}, onProxy: mockProxyCallback });
  });
});
