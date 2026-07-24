import type { LangTranslatorInfo } from ".";
import { UNDETERMINED_LANGUAGE } from "./constants";
import normalizeLangTag from "./normalizeLangTag";

export type LangIds = { [lang: string]: RegExp };

type SourceDocumentMetadata = {
  lang: string;
  canary?: {
    selector?: string;
    isFirstContentfulChild?: boolean;
    text?: string;
    langIds?: LangIds;
  };
};

const getElementText = (element?: Element | null): string =>
  (element instanceof HTMLElement
    ? element.innerText
    : element?.textContent
  )?.trim() || "";

const getFirstContentfulText = (): string => {
  const firstContentfulChild = [...(document.body?.childNodes || [])].find(
    (node) => node.textContent?.trim(),
  );

  return firstContentfulChild instanceof Text
    ? firstContentfulChild.textContent?.trim() || ""
    : "";
};

// TODO: detect QQ Browser’s side-by-side comparison (it leaves the original untouched, and adds Chinese)

const getDocumentLang = (
  source: SourceDocumentMetadata,
): LangTranslatorInfo => {
  const doc = document.documentElement;
  const sourceLang = normalizeLangTag(source.lang);
  const documentLang = normalizeLangTag(doc.lang);
  const canary: { el: Element | null | undefined; text?: string } = {
    el: source?.canary?.selector
      ? document.querySelector(source.canary.selector)
      : undefined,
  };
  if (
    documentLang &&
    documentLang !== UNDETERMINED_LANGUAGE &&
    documentLang !== sourceLang &&
    documentLang !== "ku"
  ) {
    return {
      lang: documentLang,
    };
  }
  const canaryLang = normalizeLangTag(canary.el?.getAttribute("lang") || "");
  if (
    canaryLang &&
    canaryLang !== UNDETERMINED_LANGUAGE &&
    canaryLang !== sourceLang
  ) {
    return {
      lang: canaryLang,
    };
  }
  canary.text =
    getElementText(canary.el) ||
    // for any agent that replaces invisible links with a (translated) text node - such as Gramtrans
    ((source.canary?.isFirstContentfulChild ?? true) &&
      getFirstContentfulText()) ||
    "";
  if (documentLang === "ku" && documentLang !== sourceLang) {
    return {
      lang:
        identifyLangFromCanaryText(canary.text, source.canary?.langIds) ===
        "ckb"
          ? "ckb"
          : documentLang,
    };
  }
  if (canary.text === source.canary?.text) {
    return {
      lang: sourceLang,
    };
  }
  if (!canary.text) {
    // we can’t find the canary text and the document lang hasn’t been specified; fall back...

    // return 'und', i.e. undetermined
    return {
      lang: UNDETERMINED_LANGUAGE,
    };
  }
  // We know that the content is translated (canary.text !== source.canary.text) but don’t know the lang
  return {
    lang: identifyLangFromCanaryText(canary.text, source.canary?.langIds),
  };
};

const identifyLangFromCanaryText = (() => {
  let _text: string;
  let _langIds: LangIds;
  let _langIdsEntries: Array<[string, RegExp]>;
  let _result: string;

  return (text: string, langIds: LangIds | undefined): string => {
    if (!langIds) return UNDETERMINED_LANGUAGE;

    if (_text === text && _langIds === langIds && _result) {
      return _result;
    }

    // cache the result, so for a given string and langIds, we compute it only once
    if (_langIds !== langIds) {
      _langIds = langIds;
      _langIdsEntries = Object.entries(langIds);
    }
    _text = text;

    const [lang] = _langIdsEntries.find(([, re]) => re.test(text)) || [];

    _result = lang || UNDETERMINED_LANGUAGE;

    return _result;
  };
})();

export default getDocumentLang;
