/* eslint-disable max-len */

/**
 * @extends {Set<string>}
 */
class StringSet extends Set {
  substrings({
    length: substringLength,
  }: {
    length: number;
  }): Map<string, StringSet> {
    if (!substringLength) {
      throw new Error("StringSet#substrings: must supply substring length");
    }
    const substrs = new Map<string, StringSet>();
    this.forEach((str) => {
      if (typeof str !== "string") return;
      const chars = [...str]; // splits into an array of Unicode graphemes
      const unicodeLength = chars.length; // (str.length would not count chars above U+FFFF properly)
      for (let i = 0; i <= unicodeLength - substringLength; i++) {
        // eslint-disable-line
        const substr = chars.slice(i, i + substringLength).join("");
        if (!substrs.has(substr)) substrs.set(substr, new StringSet());
        (substrs.get(substr) as StringSet).add(str);
      }
    });
    return substrs;
  }
}

export default StringSet;
