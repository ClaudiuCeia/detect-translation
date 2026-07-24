import getDocumentLang from "../getDocumentLang";
import skipToMainContentLangIds from "../translations/Skip-to-main-content";

describe("getDocumentLang", () => {
  let el: HTMLElement = null as unknown as HTMLElement;

  beforeEach(() => {
    document.documentElement.lang = "en";
    el = document.createElement("a");
    el.classList.add("skip-link");
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it("should identify the language from the HTML element", () => {
    document.documentElement.lang = "pl";

    const { lang: result } = getDocumentLang({ lang: "en" });

    expect(result).toBe("pl");
  });

  it("should identify the language from the text element", () => {
    el.lang = "ru";

    const { lang: result } = getDocumentLang({
      lang: "en",
      canary: {
        selector: ".skip-link",
      },
    });

    expect(result).toBe("ru");
  });

  it("should identify the language from the text content", () => {
    document.documentElement.lang = "en";
    el.innerText = "Passer au contenu principal";

    const { lang: result } = getDocumentLang({
      lang: "en",
      canary: {
        selector: ".skip-link",
        langIds: skipToMainContentLangIds,
      },
    });

    expect(result).toBe("fr");
  });

  it.each(["iw", "IW"])("should normalise the language tag %s", (lang) => {
    document.documentElement.lang = lang;

    const { lang: result } = getDocumentLang({ lang: "en" });

    expect(result).toBe("he");
  });

  it.each(["", "und"])(
    "should use the canary when the document language is %p",
    (lang) => {
      document.documentElement.lang = lang;
      el.innerText = "Passer au contenu principal";

      const { lang: result } = getDocumentLang({
        lang: "en",
        canary: {
          selector: ".skip-link",
          langIds: skipToMainContentLangIds,
        },
      });

      expect(result).toBe("fr");
    },
  );

  it("should compare language tags canonically", () => {
    document.documentElement.lang = "EN-us";
    el.innerText = "Skip to main content";

    const { lang: result } = getDocumentLang({
      lang: "en-US",
      canary: {
        selector: ".skip-link",
        text: "Skip to main content",
      },
    });

    expect(result).toBe("en-US");
  });

  it("should return canonically cased target language tags", () => {
    document.documentElement.lang = "ZH-hans-cn";

    const { lang: result } = getDocumentLang({ lang: "en" });

    expect(result).toBe("zh-Hans-CN");
  });

  it("should not throw when canary selector is an empty string", () => {
    document.documentElement.lang = "en";

    expect(() =>
      getDocumentLang({
        lang: "en",
        canary: {
          selector: "",
        },
      }),
    ).not.toThrow();
  });
});
