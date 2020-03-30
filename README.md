# detect-translation

This package attempts to detect when a website was translated on the client (using, for example, Google Translate in Chrome)
or via a proxy (like using translate.google.com directly). 

[![npm version](https://badge.fury.io/js/detect-translation.svg)](https://badge.fury.io/js/detect-translation)

## Installation

```
yarn add detect-translation
```

*You can use npm if you prefer*

The package was written in Typescript, so no need to install types separately. 

---

## Example Usage

```ts
import { observe } from 'detect-translation';

observe({
  onClient: (service, lang) => {
    console.log(`Client translation using ${service}, language ${lang}`);
  },
  onProxy: (service, lang) => {
    console.log(`Proxy translation using ${service}, language ${lang}`);
  }
});
```

`detect-translation` can currently detect the following services:
- [Google Translate](https://translate.google.com/)
- [Microsoft/Bing Translate](https://www.bing.com/translator/)
- [Baidu Translate](https://fanyi.baidu.com/)
- [Yandex Translate](https://translate.yandex.com/)
- [Naver Papago](https://papago.naver.com/)

`lang` is the value of the `<html>` [`lang` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang) - this gets set by the translation service.

----

MIT @ [Claudiu Ceia](https://github.com/ClaudiuCeia)
