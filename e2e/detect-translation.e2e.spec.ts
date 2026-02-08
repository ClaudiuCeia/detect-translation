import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const bundlePath = path.join(process.cwd(), "dist-browser", "index.min.js");

type TranslationEvent = {
  lang: string;
  service: string;
  type: string;
};

type DetectTranslationObserverParams = {
  onTranslation: (
    lang: string,
    info: { service: string; type: string },
  ) => void;
  sourceLang: string;
  sourceUrl?: string;
  textSelector?: string;
};

type DetectTranslationWindow = Window & {
  __events: Array<TranslationEvent>;
  DetectTranslation: {
    observe: (params: DetectTranslationObserverParams) => unknown;
  };
};

test("client translation: detects Google client translation via marker element + html[lang]", async ({
  page,
}) => {
  await page.setContent(
    `<!doctype html><html lang="en"><body><main>hello</main></body></html>`,
  );
  await page.addScriptTag({ path: bundlePath });

  await page.evaluate(() => {
    const w = window as unknown as DetectTranslationWindow;
    w.__events = [];
    w.DetectTranslation.observe({
      onTranslation: (lang: string, info: { service: string; type: string }) =>
        w.__events.push({ lang, ...info }),
      sourceLang: "en",
      // Avoid coupling e2e to the default canary element; we just exercise MutationObserver behavior.
      textSelector: "",
    });
  });

  await page.evaluate(() => {
    const marker = document.createElement("div");
    marker.id = "goog-gt-tt";
    document.body.appendChild(marker);
    document.documentElement.lang = "ro";
  });

  await page.waitForFunction(
    () => (window as unknown as DetectTranslationWindow).__events.length > 0,
  );
  const event = await page.evaluate(
    () => (window as unknown as DetectTranslationWindow).__events[0],
  );

  expect(event).toMatchObject({
    lang: "ro",
    service: "google",
    type: "client",
  });
});

test("proxy translation: detects Google proxy translation by hostname on startup (chromium only)", async ({
  page,
}, testInfo) => {
  testInfo.skip(
    testInfo.project.name !== "chromium",
    "Requires chromium host resolver rules for deterministic hostname mapping.",
  );

  const server = http.createServer((_req, res) => {
    // Minimal page: observe() runs immediately, so set lang up front.
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><html lang="fr"><body>ok</body></html>`);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  try {
    await page.goto(`http://translate.googleusercontent.com:${port}/`);
    await page.addScriptTag({ path: bundlePath });

    await page.evaluate(() => {
      const w = window as unknown as DetectTranslationWindow;
      w.__events = [];
      w.DetectTranslation.observe({
        onTranslation: (
          lang: string,
          info: { service: string; type: string },
        ) => w.__events.push({ lang, ...info }),
        sourceLang: "en",
        textSelector: "",
      });
    });

    await page.waitForFunction(
      () => (window as unknown as DetectTranslationWindow).__events.length > 0,
    );
    const event = await page.evaluate(
      () => (window as unknown as DetectTranslationWindow).__events[0],
    );

    expect(event).toMatchObject({
      lang: "fr",
      service: "google",
      type: "proxy",
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("IBM Watson: detects downloaded file translation from filename (file://)", async ({
  page,
}) => {
  const sourceUrl = "https://www.domain.com/path/pagename";
  const watsonFilename =
    "https __www.domain.com_path_pagename_Chinese (Simplified).html";

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "detect-translation-"));
  const filePath = path.join(dir, watsonFilename);

  await fs.writeFile(
    filePath,
    `<!doctype html><html lang="fr"><body>ok</body></html>`,
    "utf8",
  );

  try {
    await page.goto(pathToFileURL(filePath).href);
    await page.addScriptTag({ path: bundlePath });

    await page.evaluate(
      (arg) => {
        const w = window as unknown as DetectTranslationWindow;
        w.__events = [];
        w.DetectTranslation.observe({
          onTranslation: (
            lang: string,
            info: { service: string; type: string },
          ) => w.__events.push({ lang, ...info }),
          sourceLang: "en",
          sourceUrl: arg.sourceUrl,
          textSelector: "",
        });
      },
      { sourceUrl },
    );

    await page.waitForFunction(
      () => (window as unknown as DetectTranslationWindow).__events.length > 0,
    );
    const event = await page.evaluate(
      () => (window as unknown as DetectTranslationWindow).__events[0],
    );

    expect(event).toMatchObject({
      lang: "fr",
      service: "ibm",
      type: "proxy",
    });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
