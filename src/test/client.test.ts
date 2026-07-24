import type JSDOMEnvironment from "jest-environment-jsdom";
import { observe, Services } from "..";
import whichClientTranslation from "../whichClientTranslation";

declare const jsdom: NonNullable<JSDOMEnvironment["dom"]>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Test client translations", () => {
  let el: HTMLElement = null as unknown as HTMLElement;
  let observer: MutationObserver | undefined;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
    observer?.disconnect();
  });

  test.each([
    [Services.MICROSOFT, '<span _msthash="1"></span>'],
    [Services.GOOGLE, '<span id="goog-gt-tt"></span>'],
    [Services.TENCENT, '<span id="qbTrans-pageTrans-dialog"></span>'],
    [Services.SOGOU, '<span class="sg-translated"></span>'],
    [Services.YANDEX, "<ya-tr-span></ya-tr-span>"],
  ])("detects the %s client marker", (service, marker) => {
    el.innerHTML = marker;

    expect(whichClientTranslation({ lang: "fr" })).toEqual({
      lang: "fr",
      service,
      type: "client",
    });
  });

  test("Can detect Google client translation", (): Promise<void> =>
    new Promise((resolve, reject) => {
      const sourceLang = "en";
      const targetLang = "ro";
      const mockClientCallback = jest.fn((lang, { service, type }) => {
        try {
          expect(service).toEqual(Services.GOOGLE);
          expect(lang).toEqual(targetLang);
          expect(type).toBe("client");
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      jsdom.reconfigure({ url: "https://www.example.com/" });

      document.documentElement.setAttribute("class", "");
      document.documentElement.lang = sourceLang;

      observer = observe({
        onTranslation: mockClientCallback,
        sourceLang,
      });

      el.setAttribute("id", "goog-gt-tt");
      document.documentElement.lang = targetLang;
    }));

  test("updates translation metadata when a client marker appears", async () => {
    const mockClientCallback = jest.fn();

    jsdom.reconfigure({ url: "https://www.example.com/" });
    document.documentElement.lang = "en";
    observer = observe({
      onTranslation: mockClientCallback,
      sourceLang: "en",
      textSelector: "",
    });

    document.documentElement.lang = "ro";
    await sleep(1);

    expect(mockClientCallback).toHaveBeenCalledTimes(1);
    expect(mockClientCallback).toHaveBeenLastCalledWith("ro", {
      service: Services.UNDETERMINED,
      type: "unknown",
    });

    el.id = "goog-gt-tt";
    await sleep(1);

    expect(mockClientCallback).toHaveBeenCalledTimes(2);
    expect(mockClientCallback).toHaveBeenLastCalledWith("ro", {
      service: Services.GOOGLE,
      type: "client",
    });

    document.documentElement.className = "unrelated-change";
    await sleep(1);

    expect(mockClientCallback).toHaveBeenCalledTimes(2);
  });
});
