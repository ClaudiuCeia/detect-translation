import getDocumentLang from "../getDocumentLang";
import skipToMainContentLangIds from '../../translations/Skip-to-main-content';

describe('getDocumentLang', () => {
  let el: HTMLElement = (null as unknown) as HTMLElement;

  beforeEach(() => {
    document.documentElement.lang = 'en';
    el = document.createElement("a");
    el.classList.add('skip-link');
    document.body.appendChild(el);
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it('should identify the language from the HTML element', () => {
    document.documentElement.lang = 'pl';

    const { lang: result } = getDocumentLang({ lang: 'en' });

    expect(result).toEqual('pl');
  });

  it('should identify the language from the text element', () => {
    el.lang = 'ru';

    const { lang: result } = getDocumentLang({
      lang: 'en',
      canary: {
        selector: '.skip-link'
      },
    });

    expect(result).toEqual('ru');
  });

  it('should identify the language from the text content', () => {
    document.documentElement.lang = 'en';
    el.innerText = 'Passer au contenu principal';

    const { lang: result } = getDocumentLang({
      lang: 'en',
      canary: {
        selector: '.skip-link',
        langIds: skipToMainContentLangIds,
      },
    });

    expect(result).toEqual('fr');
  });

  it('should normalise the language tag', () => {
    document.documentElement.lang = 'iw';

    const { lang: result } = getDocumentLang({ lang: 'en' });

    expect(result).toEqual('he');
  })
});
