/**
 * Class that holds a string, plus optional metadata
 *
 * @extends {String}
 */
class MetaString extends String {
  /**
   * @param {string} str - the string
   * @param {object} meta - object with metadata properties
   */
  constructor(str, meta = {}) {
    super(`${str}`);
    this.meta = {
      ...str.meta || {},
      ...meta,
    };
  }

  /**
   * @typedef {object} MetaStringToStringOptionsType
   *
   * @property {boolean} [meta]
   * @property {sting} [joiner]
   */
  /**
   * Returns the base string concatenated with metadata entries, if `meta` is true
   *
   * @param {MetaStringToStringOptionsType} [options]
   */
  toString({ meta = false, joiner = ',' } = {}) {
    if (meta) {
      const metaString = Object.entries(this.meta)
        .map(([prop, val]) => `${joiner}${prop}:${val}`)
        .join('');
      return `${super.toString()}${metaString}`;
    }
    return super.toString();
  }
}

/**
 * Class that holds a BCP47 standard lang tag, plus metadata
 *
 * @extends {MetaString}
 */
class LangMetaString extends MetaString {
  /**
   * Returns the base string concatenated with metadata entries, if `meta` is true
   *
   * @param {MetaStringToStringOptionsType} [options]
   */
  toString({ joiner = '|', ...options } = {}) {
    return super.joiner({ joiner, ...options });
  }
}

export default LangMetaString;
