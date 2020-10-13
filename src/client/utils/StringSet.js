/* eslint-disable max-len */

/**
 * @extends {Map<string, string>}
 */
class SubstringStringMap extends Map { }

/**
 * @extends {Set<string>}
 */
class StringSet extends Set {
  substrings({ length: substringLength } = {}) {
    if (!substringLength) {
      throw new Error('StringSet#substrings: must supply substring length');
    }
    const substrs = new SubstringStringMap();
    this.forEach((str) => {
      if (typeof str !== 'string') return;
      const chars = [...str]; // splits into an array of Unicode graphemes
      const unicodeLength = chars.length; // (str.length would not count chars above U+FFFF properly)
      for (let i = 0; i <= unicodeLength - substringLength; i++) { // eslint-disable-line
        const substr = chars.slice(i, i + substringLength).join('');
        if (!substrs.has(substr)) substrs.set(substr, new StringSet());
        substrs.get(substr).add(str);
      }
    });
    return substrs;
  }
}

module.exports = StringSet;
