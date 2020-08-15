import { expect } from 'chai';
import isPageTranslated from './is-page-translated';

describe(__filename, () => {
  afterEach(() => {
    delete global.document;
  });

  it('returns documentTranslated is false if document is undefined', () => {
    global.document = undefined;

    const result = isPageTranslated();
    expect(result).not.to.be.true;
  });

  it('returns false if document language is still the same as the source language', () => {
    const mockDocumentElement = {
      lang: 'en',
    };

    const mockSkipLink = {
      title: 'Skip to main content',
      innerText: 'Skip to main content',
    };

    global.document = {
      documentElement: mockDocumentElement,
      getElementById: () => mockSkipLink,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.true;
  });

  it('returns true if document element lang attribute is not set to the source language', () => {
    const mockDocumentElement = {
      lang: 'fr',
    };

    const mockSkipLink = {
      title: 'Skip to main content',
      innerText: 'Skip to main content',
    };

    global.document = {
      documentElement: mockDocumentElement,
      getElementById: () => mockSkipLink,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });

  it('returns true if skip link lang attribute is not set to the source language', () => {
    const mockDocumentElement = {
      lang: 'en',
    };

    const mockSkipLink = {
      lang: 'fr',
      title: 'Skip to main content',
      innerText: 'Skip to main content',
    };

    global.document = {
      documentElement: mockDocumentElement,
      getElementById: () => mockSkipLink,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });

  it('returns true if skip link title attribute is not set to the original title text', () => {
    const mockDocumentElement = {
      lang: 'en',
    };

    const mockSkipLink = {
      title: 'Passer au contenu principal',
      innerText: 'Skip to main content',
    };

    global.document = {
      documentElement: mockDocumentElement,
      getElementById: () => mockSkipLink,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });

  it('returns true if skip link innerText is not set to the original title text', () => {
    const mockDocumentElement = {
      lang: 'en',
    };

    const mockSkipLink = {
      title: 'Skip to main content',
      innerText: 'Passer au contenu principal',
    };

    global.document = {
      documentElement: mockDocumentElement,
      getElementById: () => mockSkipLink,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });
});
