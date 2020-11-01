import whichClientTranslation from "./whichClientTranslation";
import whichProxyTranslation from "./whichProxyTranslation";
import getDocumentLang, { LangIds } from "./getDocumentLang";
import identifyIBMWatson from "./services/identifyIBMWatson";
import { Services } from "./translationServices";
import { UNDETERMINED_LANGUAGE } from "./constants";
import skipToMainContentLangIds from "./translations/Skip-to-main-content";

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
  }
) => void;
export interface ObserverParams {
  onTranslation: Callback;
  sourceLang: string;
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
  let lastObservedLang = sourceLang;

  const observer = () => {
    let identified: LangTranslatorInfo = getDocumentLang({
      lang: sourceLang,
      canary: {
        selector: textSelector,
        text,
        isFirstContentfulChild: textIsFirstContentfulChild,
        langIds,
      },
    });

    if (identified.lang === lastObservedLang) {
      return;
    }

    identified = whichProxyTranslation(identified);

    if (identified.type !== "proxy") {
      identified = whichClientTranslation(identified);
    }

    // We check for IBM Watson after checking for client translations,
    // as the IBM Watson check is brittle as it’s purely based on the filename
    if (!identified.type) {
      identified = identifyIBMWatson(identified, sourceUrl);
    }

    if (!identified.lang || identified.lang === UNDETERMINED_LANGUAGE) {
      return;
    }

    identified.service ||= Services.UNDETERMINED;
    identified.type ||= "unknown"; // lgtm [js/implicit-operand-conversion]

    if (includeTranslatorInLangTag) {
      // https://unicode-org.github.io/cldr/ldml/tr35.html#t_Extension
      identified.lang = `${identified.lang}-t-${sourceLang}-t0-${identified.service}`;
    }

    onTranslation(identified.lang, {
      service: identified.service,
      type: identified.type,
    });
    lastObservedLang = identified.lang;
  };

  observer();

  const mutationObserver = new MutationObserver(observer);
  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "lang", "_msttexthash"],
  });
  if (textSelector) {
    const canaryEl = document.querySelector(textSelector);
    if (canaryEl) {
      mutationObserver.observe(
        canaryEl,
        // we need to observe any and all changes made to our canary content element
        {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        }
      );
    }
  }

  return mutationObserver;
};
