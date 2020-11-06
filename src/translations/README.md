# Translations

`Skip-to-main-content.yml` records translations into all languages found on the Internet
of the source phrase “Skip to main content”.

## Keys:

<dl>
  <dt>source
    <dd>the source phrase, “Skip to main content”
  <dt>sources
    <dd>lists the name used to refer to each translation source, along with
      metadata such as URL and (for web page translators) the languages that the tool
      is capable of translating into. Sources are subdivided into translators, CMSs and
      localized web sites (many of them multinational companies and organizations).
  <dt>translations
    <dd>translations of the source phrase into each language, along with
      the sources where each individual translation was observed. Translations
      are subdivided into “page” (languages that we know online translations can
      translate pages into) and “textonly” (languages we have translations for, but
      which it is not possible to translate web pages into).
</dl>

## Notes

“Textonly” translations are maintained for two reasons:

- from time to time, new languages are added to online web page translators, and we
  can then move these translations into the “page” key
- we include known translations of the source phrase into these languages in the list
  of substrings used to find the substrings that can uniquely identify “page”
  languages. Including “textonly” translations in this helps to avoid using
  any substring which is shared between two “page” and “textonly” languages.

Resources to look up and understand BCP 47 language codes:

- BCP 47 language subtag lookup: https://r12a.github.io/app-subtags/
- Unicode CLDR Likely Subtags: https://unicode-org.github.io/cldr-staging/charts/38/supplemental/likely_subtags.html
