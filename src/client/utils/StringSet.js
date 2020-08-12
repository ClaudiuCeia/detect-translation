class StringSet extends Set {
  substrings({ length: substringLength } = {}) {
    if (!substringLength) {
      throw new Error('StringSet#substrings: must supply substring length');
    }
    const substrs = new StringSet();
    this.forEach((str) => {
      if (typeof str !== 'string') return;
      const chars = [...str]; // splits into an array of Unicode graphemes
      const unicodeLength = chars.length; // (str.length would not count chars above U+FFFF properly)
      for (let i = 0; i <= unicodeLength - substringLength; i++) { // eslint-disable-line
        substrs.add(chars.slice(i, i + substringLength).join(''));
      }
    });
    return substrs;
  }
}

module.exports = StringSet;
