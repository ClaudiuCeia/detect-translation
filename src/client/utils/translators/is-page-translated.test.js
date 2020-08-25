import { expect } from 'chai';
import isPageTranslated from './is-page-translated';

const MOCK_EL = {
  childList: [],
  innerText: 'mock inner text',
};

describe(__filename, () => {
  afterEach(() => {
    delete global.document;
  });

  it('returns false if document is undefined', () => {
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
      querySelector: () => null,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.true;
  });

  it('returns truthy if document element lang attribute is not set to the source language', () => {
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
      querySelector: () => null,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });

  it('returns truthy if skip link lang attribute is not set to the source language', () => {
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
      querySelector: () => null,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });

  it('returns truthy if skip link innerText is not set to the original text', () => {
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
      querySelector: () => null,
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });

  it('returns truthy if QQ Browser’s side-by-side translation mode is active', () => {
    const mockDocumentElement = {
      lang: 'en',
    };

    const mockSkipLink = {
      title: 'Skip to main content',
      innerText: 'Skip to main content',
    };

    const QQ_SIDE_BY_SIDE_SELECTOR = '.qbTrans-common-compair-dialog';

    global.document = {
      documentElement: mockDocumentElement,
      getElementById: () => mockSkipLink,
      querySelector: sel => (sel === QQ_SIDE_BY_SIDE_SELECTOR ? MOCK_EL : null),
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
  });

  it('returns the translated text without the original in Caiyun.ai', () => {
    const mockDocumentElement = {
      lang: 'en',
    };

    const mockSkipLink = {
      title: 'Skip to main content',
      innerText: `Skip to main content ${MOCK_EL.innerText}`,
    };

    const CAIYUN_ORIGINAL_TEXT_CHILD_SELECTOR = '#skip > .cyxy-trs-target';

    global.document = {
      documentElement: mockDocumentElement,
      getElementById: () => mockSkipLink,
      querySelector: sel => (sel === CAIYUN_ORIGINAL_TEXT_CHILD_SELECTOR ? MOCK_EL : null),
    };

    const result = isPageTranslated();
    expect(result).not.to.be.false;
    expect(result.meta.text).to.equal('mock inner text');
  });
});
