import { Services } from "../translationServices";
import { observe } from "..";

describe('Test client translations', () => {
  test("Can detect Google client translation", () => {
    const lang = 'ro-ro';
    const mockClientCallback = jest.fn((service, lang) => {
      expect(service).toEqual(Services.GOOGLE);
      expect(lang).toEqual(lang);
    });
  
    document.documentElement.setAttribute("class", "");
    document.documentElement.lang = "en-us";
  
    observe({ onClient: mockClientCallback, onProxy: () => {} });
  
    document.documentElement.setAttribute("class", "translated-ltr");
    document.documentElement.lang = lang;
  });
})
