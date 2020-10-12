import { LangTranslatorInfo } from ".";
import { Services } from "./translationServices";

const SERVICES_SELECTORS: { [key in Services]?: string } = {
  // 360 Secure Browser uses Google Translate, so will identify as Google
  // TODO: Add Apple (Safari/iOS 14)
  // TODO: Add Baidu Browser
  [Services.MICROSOFT]: "[_msthash],[_msttexthash]",
  [Services.GOOGLE]: '[href^="https://translate.googleapis.com"],#goog-gt-tt,.goog-te-spinner-pos',
  // TODO: Add Huawei Browser
  [Services.QQ]: "#qbTrans-pageTrans-dialog,[class^=qbTrans-pageTrans-dialog]",
  [Services.SOGOU]: '[class^="sg-trans"]',
  // TODO: Add UC Browser
  // TODO: Add Xiaomi Browser
  [Services.YANDEX]: "ya-tr-span",
};

const whichClientTranslation = (identified: LangTranslatorInfo): LangTranslatorInfo => {
  const [service] =
    Object.entries(SERVICES_SELECTORS)
      .find(
        ([, selector]) => document.querySelector(selector as string)
      ) as ([Services, string] | undefined) || [];

  return {
    ...identified,
    service: service || identified.service,
    type: service ? 'client' : identified.type,
  };
};

export default whichClientTranslation;
