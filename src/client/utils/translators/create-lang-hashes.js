/* eslint-disable no-plusplus */

import stringHash from 'string-hash';
import sources from './lang-sources.yml';

const hashMap = {};

const createLangHashes = () => {
  const translations = Object.entries(sources.translations);

  for (let i = 0; i < translations.length; i++) {
    const [translation, lang] = translations[i];

    const hash = stringHash(translation);
    hashMap[hash] = lang;
  }

  const output = Object.entries(hashMap).map(([hash, lang]) => `${hash}:${lang}`).join('|');

  return output;
};

export default createLangHashes;
