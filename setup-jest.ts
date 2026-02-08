// setup-jest.js
import sanitizeHtml from "sanitize-html";
import {
  TextDecoder as UtilTextDecoder,
  TextEncoder as UtilTextEncoder,
} from "util";

// Monkey-patch jsdom to make it support innerText
// see https://github.com/jsdom/jsdom/issues/1245#issuecomment-470192636
Object.defineProperty(Element.prototype, "innerText", {
  get(this: Element) {
    return sanitizeHtml(this.textContent ?? "", {
      allowedTags: [], // remove all tags and return text content only
      allowedAttributes: {}, // remove all tags and return text content only
    });
  },
  set(this: Element, text: string) {
    this.textContent = text;
  },
  configurable: true, // make it so that it doesn't blow chunks on re-running tests with things like --watch
});

// Monkey-patch jsdom to support TextEncoder/TextDecoder
// Node.js provides these globals; older jsdom/test setups may not.
globalThis.TextEncoder ??= UtilTextEncoder;
globalThis.TextDecoder ??= UtilTextDecoder;
