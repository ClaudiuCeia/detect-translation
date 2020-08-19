import { expect } from 'chai';
import { getLangIdSubstrings } from './create-lang-id-strings';
import StringSet from '../StringSet';

describe('getLangsFromYaml', () => {
  it('should return all the translations, ordered by number of speakers', () => {
    const langs = new Map([
      ['gl', new StringSet([
        'Saltar ao contido principal',
        'Ir ao contido principal',
      ])],
      ['fr', new StringSet([
        'Sauter sur le contenu principal',
        'Passer au contenu principal',
      ])],
    ]);

    const result = getLangIdSubstrings(langs);

    expect([...result.keys()]).to.include('ao');
  });
});
