import { observe } from "..";
import { JSDOM } from "jsdom";
declare const jsdom: JSDOM;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Observe", () => {
  let observer: MutationObserver | undefined;

  afterEach(() => {
    observer?.disconnect();
  });

  test("should check for translations on startup", async () => {
    const mockTranslationCallback = jest.fn();

    jsdom.reconfigure({ url: "https://translate.googleusercontent.com/" }); // eslint-disable-line

    document.documentElement.lang = "fr";

    observer = observe({
      onTranslation: mockTranslationCallback,
      sourceLang: "en",
    });

    // don’t change the DOM after setting up the observer

    await sleep(1);

    expect(mockTranslationCallback).toHaveBeenCalledWith("fr", {
      service: "google",
      type: "proxy",
    });
  });
});
