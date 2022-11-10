// setup-jest.js
import sanitizeHtml from "sanitize-html";
import "mutationobserver-shim";
import { TextDecoder, TextEncoder } from "text-encoding";

// Monkey-patch jsdom to make it support innerText
// see https://github.com/jsdom/jsdom/issues/1245#issuecomment-470192636
Object.defineProperty(global.Element.prototype, "innerText", {
  get() {
    return sanitizeHtml(this.textContent, {
      allowedTags: [], // remove all tags and return text content only
      allowedAttributes: {}, // remove all tags and return text content only
    });
  },
  set(text) {
    this.textContent = text;
  },
  configurable: true, // make it so that it doesn't blow chunks on re-running tests with things like --watch
});

// Monkey-patch jsdom to support TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
