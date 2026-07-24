import { UNDETERMINED_LANGUAGE } from "./constants";
import getDocumentLang, { type LangIds } from "./getDocumentLang";
import normalizeLangTag from "./normalizeLangTag";
import identifyIBMWatson from "./services/identifyIBMWatson";
import { Services } from "./translationServices";
import skipToMainContentLangIds from "./translations/Skip-to-main-content";
import whichClientTranslation from "./whichClientTranslation";
import whichProxyTranslation from "./whichProxyTranslation";

export type { LangIds };
export { Services };

export type TranslatorType = "client" | "proxy" | "unknown";

export type LangTranslatorInfo = {
  lang?: string;
  service?: Services;
  type?: TranslatorType;
};

export type Callback = (
  lang: string,
  {
    service,
    type,
  }: {
    service: Services;
    type: TranslatorType;
  },
) => void;
export interface ObserverParams {
  onTranslation: Callback;
  sourceLang?: string;
  sourceUrl?: string;
  textSelector?: string;
  text?: string;
  textIsFirstContentfulChild?: boolean;
  langIds?: LangIds;
  includeTranslatorInLangTag?: boolean;
}

export const observe = ({
  onTranslation,
  sourceLang = "en",
  sourceUrl,
  textSelector = ".skip-link",
  text = "Skip to main content",
  textIsFirstContentfulChild = true,
  langIds = skipToMainContentLangIds,
  includeTranslatorInLangTag = false,
}: ObserverParams): MutationObserver => {
  const normalizedSourceLang = normalizeLangTag(sourceLang);
  const sourceObservation = {
    lang: normalizedSourceLang,
    service: Services.UNDETERMINED,
    type: "unknown" as TranslatorType,
  };
  let lastObservation = sourceObservation;

  const detectTranslation = () => {
    let identified: LangTranslatorInfo = getDocumentLang({
      lang: normalizedSourceLang,
      canary: {
        selector: textSelector,
        text,
        isFirstContentfulChild: textIsFirstContentfulChild,
        langIds,
      },
    });

    if (!identified.lang || identified.lang === UNDETERMINED_LANGUAGE) {
      return;
    }

    if (identified.lang === normalizedSourceLang) {
      lastObservation = sourceObservation;
      return;
    }
    const detectedLang = identified.lang;

    identified = whichProxyTranslation(identified);

    if (identified.type !== "proxy") {
      identified = whichClientTranslation(identified);
    }

    // We check for IBM Watson after checking for client translations,
    // as the IBM Watson check is brittle as it’s purely based on the filename
    if (!identified.type) {
      identified = identifyIBMWatson(identified, sourceUrl);
    }

    identified.service ||= Services.UNDETERMINED;
    identified.type ||= "unknown";

    const observation = {
      lang: detectedLang,
      service: identified.service,
      type: identified.type,
    };
    if (
      observation.lang === lastObservation.lang &&
      observation.service === lastObservation.service &&
      observation.type === lastObservation.type
    ) {
      return;
    }
    if (
      observation.lang === lastObservation.lang &&
      lastObservation.service !== Services.UNDETERMINED &&
      observation.service === Services.UNDETERMINED
    ) {
      return;
    }

    lastObservation = observation;
    const callbackLang = includeTranslatorInLangTag
      ? // https://unicode-org.github.io/cldr/ldml/tr35.html#t_Extension
        `${observation.lang}-t-${normalizedSourceLang}-t0-${observation.service}`
      : observation.lang;
    onTranslation(callbackLang, {
      service: observation.service,
      type: observation.type,
    });
  };

  let observedCanary: Element | null = null;
  const observeCanary = (): void => {
    if (!textSelector) return;

    const canaryEl = document.querySelector(textSelector);
    if (!canaryEl || canaryEl === observedCanary) return;

    observedCanary = canaryEl;
    mutationObserver.observe(canaryEl, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  };

  const mutationObserver = new MutationObserver(() => {
    observeCanary();
    detectTranslation();
  });
  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      "class",
      "href",
      "id",
      "lang",
      "_msthash",
      "_msttexthash",
    ],
    childList: true,
    subtree: true,
  });
  try {
    observeCanary();
    detectTranslation();
  } catch (error) {
    mutationObserver.disconnect();
    throw error;
  }

  return mutationObserver;
};
