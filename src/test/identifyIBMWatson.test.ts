import type { JSDOM } from "jsdom";
import identifyIBMWatson from "../services/identifyIBMWatson";
import { Services } from "../translationServices";

declare const jsdom: JSDOM;

describe("identifyIBMWatson", () => {
  test("returns unchanged when hostname is present (not file://)", () => {
    jsdom.reconfigure({ url: "https://www.example.com/page" });

    const identified = identifyIBMWatson({ lang: "fr" }, "https://a.com/x");

    expect(identified.service).toBeUndefined();
    expect(identified.type).toBeUndefined();
    expect(identified.lang).toBe("fr");
  });

  test("returns unchanged when sourceUrl is missing", () => {
    jsdom.reconfigure({
      url: "file:///Users/name/Downloads/somefile.html",
    });

    const identified = identifyIBMWatson({ lang: "fr" });

    expect(identified.service).toBeUndefined();
    expect(identified.type).toBeUndefined();
    expect(identified.lang).toBe("fr");
  });

  test("detects IBM Watson downloaded filename and marks as proxy translation", () => {
    const sourceUrl = "https://www.domain.com/path/pagename";

    // This mirrors IBM Watson’s output naming convention as described in the source.
    const watsonFilename =
      "https __www.domain.com_path_pagename_Chinese (Simplified).html";

    jsdom.reconfigure({
      url: `file:///Users/name/Downloads/${encodeURIComponent(watsonFilename)}`,
    });

    const identified = identifyIBMWatson({ lang: "fr" }, sourceUrl);

    expect(identified.service).toBe(Services.IBM);
    expect(identified.type).toBe("proxy");
    expect(identified.lang).toBe("fr");
  });

  test("does not throw if filename is not valid percent-encoding", () => {
    // Malformed percent-encoding should not crash the detector.
    jsdom.reconfigure({
      url: "file:///Users/name/Downloads/%E0%A4%A.html",
    });

    expect(() =>
      identifyIBMWatson({ lang: "fr" }, "https://www.domain.com/path/pagename"),
    ).not.toThrow();
  });
});
