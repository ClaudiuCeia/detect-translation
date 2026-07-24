import normalizeLangTag from "../normalizeLangTag";

describe("normalizeLangTag", () => {
  test.each([
    ["bs-Latn", "bs"],
    ["cat_valencia", "ca-valencia"],
    ["eng/us", "en-US"],
    ["eng/uk", "en-GB"],
    ["iw-IL", "he-IL"],
    ["kmr", "ku"],
    ["mww", "hmn"],
    ["tl-PH", "fil-PH"],
    ["kazlat", "kk-Latn"],
    ["sr-Cyrl-RS", "sr-RS"],
    ["usbcyr", "uz-Cyrl"],
    [" EN_us ", "en-US"],
  ])("normalizes %p to %p", (input, expected) => {
    expect(normalizeLangTag(input)).toBe(expected);
  });

  it("preserves malformed input after trimming", () => {
    expect(normalizeLangTag(" invalid/tag ")).toBe("invalid/tag");
  });
});
