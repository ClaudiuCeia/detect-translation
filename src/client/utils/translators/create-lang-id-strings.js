const fs = require('fs');
const { safeLoad } = require('js-yaml');

const { translations } = safeLoad(fs.readFileSync('./lang-sources.yml'));

console.log(JSON.stringify(translations, null, 2));
