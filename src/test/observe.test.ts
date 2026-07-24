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

  test("observes text changes in a canary inserted after startup", async () => {
    jsdom.reconfigure({ url: "https://www.example.com/" });
    document.documentElement.lang = "en";

    const translation = new Promise<void>((resolve) => {
      observer = observe({
        sourceLang: "en",
        langIds: { fr: /contenu principal/ },
        onTranslation: (lang) => {
          expect(lang).toBe("fr");
          resolve();
        },
      });
    });
    const canary = document.createElement("a");
    canary.className = "skip-link";
    canary.append("Skip to main content");
    document.body.appendChild(canary);

    await sleep(1);
    (canary.firstChild as Text).data = "Passer au contenu principal";
    await translation;
    canary.remove();
  });

  test("observes mutations made by the startup callback", async () => {
    jsdom.reconfigure({ url: "https://www.example.com/" });
    document.documentElement.lang = "fr";

    const secondTranslation = new Promise<void>((resolve) => {
      observer = observe({
        sourceLang: "en",
        textSelector: "",
        onTranslation: (lang) => {
          if (lang === "fr") {
            document.documentElement.lang = "de";
          } else {
            expect(lang).toBe("de");
            resolve();
          }
        },
      });
    });

    await secondTranslation;
  });

  test("defaults the source language to English", async () => {
    jsdom.reconfigure({ url: "https://www.example.com/" });
    document.documentElement.lang = "en";

    const translation = new Promise<void>((resolve) => {
      observer = observe({
        textSelector: "",
        onTranslation: (lang) => {
          expect(lang).toBe("fr");
          resolve();
        },
      });
    });
    document.documentElement.lang = "fr";

    await translation;
  });
});
