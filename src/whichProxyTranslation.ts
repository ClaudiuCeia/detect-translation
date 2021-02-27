import { LangTranslatorInfo } from ".";
import { Services } from "./translationServices";

type HostnamePattern = string | RegExp;

const PROXIES_HOSTNAMES: { [key in Services]?: Array<HostnamePattern> } = {
  [Services.APERTIUM]: ["www.apertium.org"],
  [Services.BAIDU]: ["translate.baiducontent.com", "fanyi.baidu.com"],
  [Services.MICROSOFT]: [
    "www.translatoruser-int.com",
    "www.translatetheweb.com",
    /^(ssl|www)\.microsofttranslator\.com$/,
  ],
  [Services.CAIYUN]: ["interpreter.caiyunai.com"],
  [Services.GOOGLE]: [
    "translate.googleusercontent.com",
    /^translate\.google\./,
  ],
  [Services.GRAMTRANS]: ["gramtrans.com"],
  [Services.LINGVANEX]: ["backenster.com", "lingvanex.com"],
  [Services.NAVER]: ["papago.naver.net"],
  [Services.SOGOU]: ["translate.sogoucdn.com"],
  [Services.WORLDLINGO]: ["www.worldlingo.com"],
  [Services.YANDEX]: ["z5h64q92x9.net", /^translate\.yandex\./],
  [Services.YOUDAO]: ["webtrans.yodao.com"],
};

const whichProxyTranslation = (
  identified: LangTranslatorInfo
): LangTranslatorInfo => {
  const { hostname } = location;

  const [service] = (Object.entries(PROXIES_HOSTNAMES).find(([, hostnames]) =>
    (hostnames as Array<HostnamePattern>).find((match) =>
      match instanceof RegExp ? match.test(hostname) : match === hostname
    )
  ) || []) as [Services, Array<HostnamePattern>];

  return {
    lang: identified.lang,
    service: service || identified.service,
    type: service ? "proxy" : identified.type,
  };
};

export default whichProxyTranslation;
