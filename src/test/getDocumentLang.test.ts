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

  it("should not treat a regional source variant as a translation", () => {
    document.documentElement.lang = "en-US";
    el.innerText = "Skip to main content";

    const { lang: result } = getDocumentLang({
      lang: "en",
      canary: {
        selector: ".skip-link",
        text: "Skip to main content",
      },
    });

    expect(result).toBe("en");
  });

  it("should distinguish target scripts within the same language", () => {
    document.documentElement.lang = "zh-Hant";

    const { lang: result } = getDocumentLang({ lang: "zh" });

    expect(result).toBe("zh-Hant");
  });

  it("should return canonically cased target language tags", () => {
    document.documentElement.lang = "ZH-hans-cn";

    const { lang: result } = getDocumentLang({ lang: "en" });

    expect(result).toBe("zh-Hans-CN");
  });

  it("should normalize underscore-separated language tags", () => {
    document.documentElement.lang = "en_US";
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

  it("should distinguish Central Kurdish from an ambiguous document tag", () => {
    document.documentElement.lang = "ku";
    el.innerText = "بازدان بۆ ناوەڕۆکی سەرەکی";

    const { lang: result } = getDocumentLang({
      lang: "en",
      canary: {
        selector: ".skip-link",
        langIds: skipToMainContentLangIds,
      },
    });

    expect(result).toBe("ckb");
  });

  it("should use a translated first contentful text node", () => {
    document.documentElement.lang = "";
    const whitespace = document.createTextNode("\n  ");
    const translated = document.createTextNode("Passer au contenu principal");
    document.body.insertBefore(whitespace, el);
    document.body.insertBefore(translated, el);

    try {
      const { lang: result } = getDocumentLang({
        lang: "en",
        canary: {
          selector: ".missing",
          langIds: skipToMainContentLangIds,
        },
      });

      expect(result).toBe("fr");
    } finally {
      whitespace.remove();
      translated.remove();
    }
  });

  it("should read canary text from non-HTML elements", () => {
    document.documentElement.lang = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("svg-skip-link");
    svg.textContent = "Passer au contenu principal";
    document.body.appendChild(svg);

    try {
      const { lang: result } = getDocumentLang({
        lang: "en",
        canary: {
          selector: ".svg-skip-link",
          langIds: skipToMainContentLangIds,
        },
      });

      expect(result).toBe("fr");
    } finally {
      svg.remove();
    }
  });

  it("should normalize canonically equivalent canary text", () => {
    document.documentElement.lang = "";
    el.innerText = "Cafe\u0301";

    const { lang: result } = getDocumentLang({
      lang: "en",
      canary: {
        selector: ".skip-link",
        langIds: { fr: /Café/ },
      },
    });

    expect(result).toBe("fr");
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
