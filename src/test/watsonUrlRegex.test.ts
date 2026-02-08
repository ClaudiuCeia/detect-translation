import { watsonUrlRegex } from "../services/identifyIBMWatson";

describe("watsonUrlRegex", () => {
  it("matches expected IBM Watson filename format (and escapes regex metacharacters)", () => {
    const sourceUrl = "https://www.example.com/path/page(1)?q=a+b&x=[y]#hash";

    const regex = watsonUrlRegex(sourceUrl);

    const enq = String.fromCharCode(5);
    const expectedPrefix = decodeURI(sourceUrl)
      .replace(/\\/g, enq)
      .replace(/:/g, " ")
      .replace(/\//g, "_")
      .replace(new RegExp(enq, "g"), "\\\\");

    expect(regex.test(`${expectedPrefix}_Chinese (Simplified).html`)).toBe(
      true,
    );
  });

  it("does not throw for malformed URIs", () => {
    expect(() => watsonUrlRegex("https://example.com/%E0%A4%A")).not.toThrow();
  });
});
