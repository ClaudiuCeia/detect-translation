const JSDOMEnvironment = require("jest-environment-jsdom");

// Expose Jest's underlying JSDOM instance as a global `jsdom`, for tests that
// need to call `jsdom.reconfigure({ url })`.
class JSDOMWithGlobal extends (JSDOMEnvironment.default ?? JSDOMEnvironment) {
  async setup() {
    await super.setup();
    this.global.jsdom = this.dom;
  }

  async teardown() {
    delete this.global.jsdom;
    await super.teardown();
  }
}

module.exports = JSDOMWithGlobal;
