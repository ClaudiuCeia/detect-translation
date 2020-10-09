import { Services } from "./translationServices";

export const whichProxyTranslation = (): Services | null => {
  const hostname = document.location.hostname;

  // Google Translate
  if (
    hostname == "translate.googleusercontent.com" ||
    hostname.startsWith("translate.google.")
  ) {
    return Services.GOOGLE;
  }

  // Microsoft Bing Translate
  if (
    [
      "www.translatoruser-int.com",
      "www.translatetheweb.com",
      "ssl.microsofttranslator.com",
      "www.microsofttranslator.com",
    ].includes(hostname)
  ) {
    return Services.BING;
  }

  // Baidu Translate
  if (["translate.baiducontent.com", "fanyi.baidu.com"].includes(hostname)) {
    return Services.BAIDU;
  }

  // Yandex Translate
  if (
    hostname == "z5h64q92x9.net" ||
    hostname.startsWith("translate.yandex.")
  ) {
    return Services.YANDEX;
  }

  // Naver Papago
  if (hostname == "papago.naver.net") {
    return Services.NAVER;
  }

  return null;
};
