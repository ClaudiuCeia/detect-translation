import { getLangIdSubstrings } from './create-lang-id-strings';
import StringSet from '../StringSet';

describe(__filename, () => {
  describe('getLangIdSubstrings', () => {
    it('should return a map of languages to unique substrings', () => {
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

      expect(result.size).to.equal(2);
      expect(result.get('gl').has('d')).to.equal(true);
      expect(result.get('fr').has('u')).to.equal(true);
    });
  });
});
