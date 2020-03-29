import { Services } from "./translationServices";

export const whichClientTranslation = (): Services | null => {
  if (document.querySelector('html.translated-ltr, head.translated-rtl')) {
    return Services.GOOGLE;
  }

  if (document.querySelector('ya-tr-span')) {
    return Services.YANDEX;
  }

  if (document.querySelector('*[_msttexthash]')) {
    return Services.BING;
  }

  return null;
}