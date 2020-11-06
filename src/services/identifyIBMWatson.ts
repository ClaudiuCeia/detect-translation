import { LangTranslatorInfo } from "..";
import { Services } from "../translationServices";

let expectedRegex: RegExp | undefined;
let _sourceUrl: string;

const CONTROL_CODE_ENQ = "\x05";
const MATCH_ALL_CONTROL_CODE_ENQ = /\x05/g; // eslint-disable-line no-control-regex

const identifyIBMWatson = (
  identified: LangTranslatorInfo,
  sourceUrl?: string
): LangTranslatorInfo => {
  const { hostname, pathname } = location;

  // hostname is expected to be the empty string as IBM Watson’s translated pages are
  //   offered as a file for the user to download to their computer.
  // We can’t do this check without a source URL for the page.
  if (hostname || !sourceUrl) return identified;

  if (sourceUrl !== _sourceUrl) {
    // Given an input URL like https://www.domain.com/path/pagename
    // IBM Watson spits out filenames of the form
    // https __www.domain.com_path_pagename_Chinese (Simplified).html
    // so location.href is something like
    // file:///Users/name/Downloads/https%20__www.domain.com_path_pagename_Chinese%20(Simplified).html
    expectedRegex = watsonUrlRegex(sourceUrl);
    _sourceUrl = sourceUrl;
  }

  const filename = decodeURIComponent(pathname.split(/\\|\//).reverse()[0]);

  const isIBMWatson = !!(expectedRegex as RegExp).test(filename);

  return {
    ...identified,
    service: isIBMWatson ? Services.IBM : identified.service,
    type: isIBMWatson ? "proxy" : identified.type,
  };
};

export const watsonUrlRegex = (sourceUrl: string): RegExp =>
  new RegExp(
    decodeURI(sourceUrl)
      .replace(/\\/g, CONTROL_CODE_ENQ) // replace \ with a placeholder ENQ character
      .replace(/:/g, " ")
      .replace(/\//g, "_")
      .replace(/\./g, "\\.")
      .replace(MATCH_ALL_CONTROL_CODE_ENQ, "\\\\") + // put \ back and escape them
      // actual language names are between 4 and 21 chars; we’re coding 3-21 to account for
      // possible shorter language names (e.g. Ewe) - longer ones are unlikely.
      "_[ \\(\\)A-Za-z]{3,21}\\.html"
  );

export default identifyIBMWatson;
