import type JSDOMEnvironment from "jest-environment-jsdom";
import { observe } from "..";

declare const jsdom: NonNullable<JSDOMEnvironment["dom"]>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Observe", () => {
  let observer: MutationObserver | undefined;

  afterEach(() => {
    observer?.disconnect();
  });

  test("should check for translations on startup", async () => {
    const mockTranslationCallback = jest.fn();

    jsdom.reconfigure({ url: "https://translate.googleusercontent.com/" });

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

  test("does not repeat transformed language callbacks", async () => {
    const mockTranslationCallback = jest.fn();

    jsdom.reconfigure({ url: "https://www.example.com/" });
    document.documentElement.lang = "fr";

    observer = observe({
      onTranslation: mockTranslationCallback,
      sourceLang: "en",
      textSelector: "",
      includeTranslatorInLangTag: true,
    });

    document.documentElement.className = "changed";
    await sleep(1);

    expect(mockTranslationCallback).toHaveBeenCalledTimes(1);
    expect(mockTranslationCallback).toHaveBeenCalledWith("fr-t-en-t0-und", {
      service: "und",
      type: "unknown",
    });
  });

  test("does not report casing-only language changes", async () => {
    const mockTranslationCallback = jest.fn();

    jsdom.reconfigure({ url: "https://www.example.com/" });
    document.documentElement.lang = "en-US";

    observer = observe({
      onTranslation: mockTranslationCallback,
      sourceLang: "en-US",
      textSelector: "",
    });

    document.documentElement.lang = "EN-us";
    await sleep(1);

    expect(mockTranslationCallback).not.toHaveBeenCalled();
  });
});
