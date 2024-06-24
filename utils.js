require('dotenv').config();
const jsYaml = require('js-yaml');
const readline = require('readline');
const fs = require('fs').promises;

const respond = (res, status, data, contentType = 'application/json') => {
  return res.writeHead(status, { 'Content-Type': contentType }).end(contentType === 'application/json' ? JSON.stringify(data) : data);
};

const intsToRangeArray = (min, max) => {
  min = parseInt(min);
  max = parseInt(max);

  return [
    min,
    ...Array.from({ length: max - min }, (v,k) => min + k + 1),
  ];
};

const extractCodeBetween = (text, start, end, options) => {
  const { excludeEnds } = options;

  const textContainsStart = text.includes(start);
  const textContainsEnd = text.includes(end);
  if (!(textContainsStart && textContainsEnd)) {
    return null;
  }

  let extractedText = text;

  const textSplitByStart = extractedText.split(start);
  textSplitByStart.shift();
  extractedText = textSplitByStart.join(start);

  const textSplitByEnd = extractedText.split(end);
  const partBeforeEnd = textSplitByEnd.shift();
  extractedText = [
    excludeEnds ? null : start, 
    partBeforeEnd, 
    excludeEnds ? null : end,
  ].join('');

  return extractedText;
};

const readFileYaml = async filePath => {
  const fileContents = await fs.readFile(filePath, 'utf8');
  return jsYaml.load(fileContents);
};

const askQuestion = query => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
};

const capitaliseString = string => `${ string[0].toUpperCase() }${ string.slice(1) }`;

const credsByKey = ({ platform, key, subkey } = {}) => {
  const { env } = process;

  if (!platform) {
    const message = 'credsByKey used with no platform';
    throw new Error(message);
  }

  if (!key) {
    const message = 'credsByKey used with no key';
    throw new Error(message);
  }

  let { CREDS } = env;
  CREDS = JSON.parse(CREDS);

  // console.log(CREDS);

  const keyCreds = CREDS?.[platform]?.[key];
  const subkeyCreds = CREDS?.[platform]?.[key]?.[subkey];

  if (subkey && !subkeyCreds) {
    console.warn(`No creds found for ${ platform } > ${ key } > ${ subkey } - will use key-level creds`);
  }

  if (subkeyCreds) {
    // Make any arrays into single values - TBD whether this should apply to all creds
    for (const [k, v] of Object.entries(subkeyCreds)) {
      if (Array.isArray(v)) {
        subkeyCreds[k] = v[randomNumber(0, v.length - 1)];
      }
    }
  }

  const creds = {
    ...keyCreds,
    ...(subkey ? subkeyCreds : {}),
  };

  // Keep only uppercase attributes
  for (const k of Object.keys(creds)) {
    if (k !== k.toUpperCase()) {
      delete creds[k];
    }
  }

  // console.log(creds);

  return creds;
};

const shopifyRequestSetup = (keyObj) => {
  // returns { url, headers }
  const creds = credsByKey({ 
    ...keyObj, 
    ...{
      platform: 'shopify',
    },
  });
  const { STORE_URL, SHOPIFY_API_KEY } = creds;
  const url = `https://${ STORE_URL }.myshopify.com/admin/api/2024-07/graphql.json`;
  const headers = {
    'X-Shopify-Access-Token': SHOPIFY_API_KEY,
    // This is just a useful default, can override if desired
    'Content-Type': 'application/json',
  };
  return { url, headers }; 
};

module.exports = {
  respond,
  intsToRangeArray,
  extractCodeBetween,
  readFileYaml,
  askQuestion,
  capitaliseString,
  credsByKey,
  shopifyRequestSetup,
};