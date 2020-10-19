import identifyIBMWatson, {
  watsonUrlRegex,
} from "../services/identifyIBMWatson";
import { JSDOM } from "jsdom";
declare const jsdom: JSDOM;

describe("identifyIBMWatson", () => {
  it("should identify IBM Watson for an expected filename", () => {
    jsdom.reconfigure({
      // eslint-disable-line
      url:
        "file:///Users/name/Downloads/https%20__www.domain.com_path_pagename_Chinese%20(Simplified).html",
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { service, type } = identifyIBMWatson(
      {},
      "https://www.domain.com/path/pagename"
    );

    expect(service).toEqual("ibm");
    expect(type).toEqual("proxy");
  });
});

describe("watsonifyUrl", () => {
  it("should transform expected input", () => {
    const sourceUrl = "https://www.domain.com/path/pagename";
    const expected =
      "https __www\\.domain\\.com_path_pagename_[ \\(\\)A-Za-z]{3,21}\\.html";

    const result = watsonUrlRegex(sourceUrl);

    expect(result.source).toEqual(expected);
  });

  it("should deal with unexpected input", () => {
    const sourceUrl = "https://www.domain.com/path%5Cpagename%5Cnew";
    const expected =
      "https __www\\.domain\\.com_path\\\\pagename\\\\new_[ \\(\\)A-Za-z]{3,21}\\.html";

    const result = watsonUrlRegex(sourceUrl);

    expect(result.source).toEqual(expected);
  });
});
