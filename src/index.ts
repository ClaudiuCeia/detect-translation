import { whichClientTranslation } from "./whichClientTranslation";
import { whichProxyTranslation } from "./whichProxyTranslation";
import { Services } from "./translationServices";

export type Callback = (service: Services, lang: string) => void;
export interface ObserverParams {
  onClient: Callback;
  onProxy: Callback;
}

let mutationObserver: MutationObserver | undefined;

export const observe = ({ onClient, onProxy }: ObserverParams) => {
  mutationObserver = new MutationObserver(function () {
    const client = whichClientTranslation();
    if (client) {
      onClient(client, document.documentElement.lang);
    }

    const proxy = whichProxyTranslation();
    if (proxy) {
      onProxy(proxy, document.documentElement.lang);
    }
  });

  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "lang", "_msttexthash"],
  });
};

export const disconnect = () => {
  mutationObserver?.disconnect();
  mutationObserver = undefined;
};
