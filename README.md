# detect-translation

This package detects when a page is translated on the client (using, for example, Google Translate in Chrome) or via a proxy (like using translate.google.com directly).

[![npm version](https://badge.fury.io/js/detect-translation.svg)](https://badge.fury.io/js/detect-translation)

## What You Get

- Detects translation type: `client`, `proxy`, or `unknown`
- Detects translation service: `google`, `bing`, `yandex`, `baidu`, etc
- Reports the target language via the document `<html lang="...">` attribute (plus heuristics for services that don’t set it reliably)

## Supported translators

`detect-translation` can currently detect the following services:

### Popular translators

<!-- TODO: Add Apple (Safari/iOS 14) here -->

- [Baidu translate](https://fanyi.baidu.com/)
- [Google Translate](https://translate.google.com/)
- [Microsoft/Bing Translate](https://www.bing.com/translator/)
- [Naver Papago](https://papago.naver.com/)
- [Yandex Translate](https://translate.yandex.com/)
- [QQ Browser](https://browser.qq.com/)
- [Sogou translate](https://fanyi.sogou.com/)
- [Youdao translate](http://fanyi.youdao.com/)

### Other supported translators

- [Apertium](https://apertium.org/)
- [Caiyun](https://fanyi.caiyunapp.com/)
- [Gramtrans](https://gramtrans.com/)
- [IBM Watson](https://www.ibm.com/watson/services/language-translator/#demo)
- [Lingvanex](https://lingvanex.com/chinese-english-translation/)
- [Worldlingo](http://www.worldlingo.com/en/products/instant_website_translator.html)

## Installation

```
pnpm add detect-translation
```

_You can use npm or yarn if you prefer: `npm i detect-translation`, `yarn add detect-translation`_

The package is written in TypeScript and ships its own types.

---

## Getting started

```ts
import { observe } from "detect-translation";

observe({
  onTranslation: (lang, { service, type }) => {
    // type: "proxy" | "client" | "unknown"
    // service: e.g. "google", "bing", "yandex", "baidu" (see Services enum)
    // lang: a BCP 47-ish language tag (e.g. "zh", "fr", "ru", "de", "hi", "es", "pt")
    console.log(`${type} translation using ${service}, language ${lang}`);
  },
  sourceLang: "en",
});
```

Ensure the script that calls `observe` runs after your HTML content is in the DOM.

`lang` is based on the `<html>` [`lang` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang) (set by the translation service when possible), or identified heuristically if you provide a “Skip to main content” link (see below).

## Browser usage (no bundler)

This package also ships a browser bundle that exposes a global `DetectTranslation` (useful for CDN usage).

```html
<script src="https://unpkg.com/detect-translation@latest/dist-browser/index.min.js"></script>
<script>
  DetectTranslation.observe({
    sourceLang: "en",
    onTranslation: function (lang, info) {
      console.log(info.type, info.service, lang);
    },
  });
</script>
```

If you use a bundler, prefer the module import shown in “Getting started”.

## Advanced usage

### Use a “Skip to main content” link for more reliable matches

Some translation services do not identify the page language using standard `lang` attributes. To identify the language of translation in these cases, `detect-translation` uses heuristics based on known translations of a “canary” element on your pages.

By default, we use a hidden “Skip to main content” link, which is a common way of meeting a key accessibility requirement.

If you don’t already have a skip link on your pages, it’s easy to add. It’s best if it’s the first contentful element on the page:

```html
<html lang="en">
  <!-- or your page’s language, if not English -->
  <body>
    <a class="skip-link" href="#main-content">
      Skip to main content
      <!-- or the same phrase in your page’s language -->
    </a>
    <nav>
      <!-- Add your navigation links here -->
    </nav>
    <main id="main-content">
      <!-- your main page content goes here -->
    </main>
  </body>
</html>
```

It’s usual to use CSS to hide this skip link until it receives keyboard focus. For details about styling hidden navigation links accessibly, see [Carnegie Museums’ Web Accessibility Guidelines](http://web-accessibility.carnegiemuseums.org/code/skip-link/#content) and [How to Create a “Skip to Content” Link](https://css-tricks.com/how-to-create-a-skip-to-content-link/).

If you have a “Skip to main content” link on your page, provide a selector which `detect-translation` can use to find it:

```ts
import { observe } from "detect-translation";

observe({
  onTranslation: (lang, { service, type }) => {
    // type will be 'proxy', 'client' or 'unknown'
    console.log(`${type} translation using ${service}, language ${lang}`);
  },
  sourceLang: "en", // or your page’s language, if different
  sourceUrl: "https://www.mywebsite.com/path/to/page.html",

  // no need to specify these if your skip link has a class of “.skip-link” and text
  // “Skip to main content”
  textSelector: ".skip-link", // a valid CSS selector passed to document.querySelector
  text: "Skip to main content", // or the text in your page’s language
});
```

`textSelector` and `text` default to `".skip-link"` and `"Skip to main content"`, respectively.

### Include the translation details in your language tags

`detect-translation` can embed details of the translator in the language tags it passes to your callback, using the standard Transformed Content extension. For example, your callback can receive a language tag like `zh-t-en-t0-baidu` (using the BCP 47 T extension to indicate content in Chinese, translated from English by Baidu). This could be useful for analytics.

To enable this feature, just set `includeTranslatorInLangTag` to `true` in the options you pass to `observe`:

```ts
import { observe } from "detect-translation";

observe({
  onTranslation: (lang, { service, type }) => {
    // lang will be the BCP 47 code, for example zh, fr, ru, de, hi, es, pt etc
    // type will be 'proxy', 'client' or 'unknown'
    // service will be for example, 'google', 'bing', 'yandex', 'baidu' etc
    console.log(`${type} translation using ${service}, language ${lang}`);
  },
  sourceLang: "en",
  includeTranslatorInLangTag: true,
});
```

## Why a “Skip to main content” link?

A skip link is a common way of meeting a key accessibility requirement. It is [a recommended technique](https://www.w3.org/TR/WCAG20-TECHS/G1.html#G1-ex2) to meet the [WCAG 2.1 requirement 2.4.1 Bypass Blocks](https://www.w3.org/TR/WCAG21/#bypass-blocks). Having this link before the navigation links on your pages allows users of assistive technology such as screenreaders to jump directly to your main content. See [Deque University’s summary](https://dequeuniversity.com/tips/add-skip-navigation-link) for more.

Then, if any translation service does not indicate the target language, we simply use the text of this element — which is translated along with your content — to identify the language.

### What if I need to use another element?

It’s quite possible to use another phrase to identify translated content languages. Please just open an issue!

---

## Development

This repository uses `pnpm`.

Common commands:

```bash
pnpm install
pnpm test
pnpm run lint        # biome
pnpm run knip        # dead-code / unused deps
pnpm run build
pnpm run prepublish  # the main verification gate (tests + lint + typecheck + knip + build + checks)
```

### Releases

Releases are tag-driven:

1. Bump `package.json` version.
2. Create and push a tag like `v0.2.1`.

GitHub Actions will run sanity checks and then publish to npm (requires the `NPM_TOKEN` repo secret), and create a GitHub Release with autogenerated notes.

---

MIT @ [Claudiu Ceia](https://github.com/ClaudiuCeia)
