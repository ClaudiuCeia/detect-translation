// Monkey-patch jsdom to make it support innerText
// see https://github.com/jsdom/jsdom/issues/1245#issuecomment-470192636
Object.defineProperty(Element.prototype, "innerText", {
  get(this: Element) {
    return this.textContent ?? "";
  },
  set(this: Element, text: string) {
    this.textContent = text;
  },
  configurable: true, // make it so that it doesn't blow chunks on re-running tests with things like --watch
});
