require('dotenv').config();
const jsYaml = require('js-yaml');
const readline = require('readline');
const fs = require('fs').promises;
const axios = require('axios');

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

const customAxios = async (method, ...args) => {
  const [url, ...rest] = args;

  if (!method) {
    throw new Error('Called customAxios without a method');
  }

  // At the end of the day, return response.data or equivalent
  let responseData;

  const MAX_ATTEMPTS = 10;
  const WAIT_TIME = 3000;
  let attempts = 0;
  let keepTrying = true;

  while (keepTrying) {

    ++attempts;
    keepTrying = false;

    if (attempts > 1) {
      console.warn(`Attempt ${ attempts }`);
    }

    let response;
    try {
      response = await axios[method](...args);  
    } catch(err) {
      const { response: errResponse, request: errRequest } = err;

      if (errResponse) {
        // The request was made and the server responded with a status code outside the range of 2xx
        console.error(errResponse);

        const { status } = errResponse;
        if (status === 429) {
          console.warn('Throttled');

          if (attempts >= MAX_ATTEMPTS) {
            console.error(`customAxios ran out of throttling attempts.`);
            return { error: err };
          }

          keepTrying = true;
          await wait(WAIT_TIME);
          continue;
        }

      } else if (errRequest) {
        // The request was made but no response was received
        console.error(errRequest);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(err);
      }

      return { error: err };
    }
    
    ({ data: responseData } = response);

    // Shopify error handling
    const { errors } = responseData;
    if (errors) {
      if (errors.every(err => err?.message === 'Throttled')) {
        console.warn('Throttled');
        // Our response was throttled - nothing else was wrong, so wait and try again.
        if (attempts >= MAX_ATTEMPTS) {
          console.error(`customAxios ran out of throttling attempts.`);
          return { error: errors };
        }

        keepTrying = true;
        await wait(WAIT_TIME);
        continue;
      }

      return { error: errors };
    }
  }

  return responseData;
};

const isObject = input => {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
};

const stripEdgesAndNodes = input => {

  // console.log(input);

  const transformObject = obj => {
    try {
      // If object is only edges, return that.
      const objKeys = Object.keys(obj);
      if (objKeys.length === 1 && objKeys.every(key => key === 'edges')) {
        return obj.edges.map(e => e.node);
      }
      
      // Otherwise, preserve other properties, pretty much to rescue pageInfo. 
      // edge nodes go into 'items'
      const { edges, ...rest } = obj;
      return {
        ...rest,
        ...{ items: obj.edges.map(e => e.node) },
      };
    } catch(err) {
      // console.log(err);      
    }

    return obj;
  };

  if (Array.isArray(input)) {

    // console.log('input is array');
    return input.map(item => stripEdgesAndNodes(item));

  } else if (isObject(input)) {
    // console.log('input is object');

    input = transformObject(input);

    for (let [k,v] of Object.entries(input)) {
      input[k] = stripEdgesAndNodes(v);
    }
    return input;
  }

  // console.log('input is not an array or object');
  return input;
};

// TO DO: Handle response in xApi function and provide all errors, instead of responding here
const mandateParam = async (res, paramName, paramValue, validator) => {
  const valid = validator ? await validator(paramValue) : paramValue;
  if (valid) {
    return true;
  }

  console.error(`Param '${ paramName }' not ${ validator ? 'valid' : 'provided' }`);
  respond(res, 400, { error: `Please provide a ${ validator ? 'valid ' : '' }value for '${ paramName }'` });
  return false;
};

// Mandatory params are passed by themselves, optional params are passed in an object, so you can leave them all off or include just the ones you need.
const shopifyPaginateGraphql = async (query, nodePath, url, headers, { method = 'post', variables = {}, limit = false, cursor, returnFinalCursor } = {}) => {

  const mandatoryParams = { query, nodePath, url, headers };
  const missingMandatoryParams = Object.entries(mandatoryParams).filter(([name, param]) => param === undefined);
  if (missingMandatoryParams.length > 0) {
    const errMessage = `shopifyPaginateGraphql called with ${ missingMandatoryParams.map(([name, param]) => `'${ name }'`).join(', ') } missing.`;
    console.error(errMessage);
    throw new Error(errMessage);
  }

  // nodePath: Used to be nodeName e.g. products, 
  //   but to allow pagination within a nested query like collectionByHandle, 
  //   it now takes a dot-separated path, e.g. collectionByHandle.products.
  //   For most cases, just the node name will still be fine.
  const nodeParts = nodePath.split('.');
  const nodeName = nodeParts.pop();

  if (!query.includes(nodeName)) {
    const errMessage = `Provided query does not include nodeName '${ nodeName }'`;
    console.error(errMessage, query, nodeName);
    throw new Error(errMessage);
  }

  if (!query.includes('$cursor')) {
    const errMessage = `Provided query has nowhere to use $cursor`;
    console.error(errMessage, query);
    throw new Error(errMessage);
  }

  const allResults = [];

  let latestResponse;
  let finalCursor;
  try {
    // let cursor; // cursor moved to params to allow starting from a certain point
    let hasNextPage = true;
    let limitReached = false;

    while (hasNextPage && !limitReached) {

      const variablesWithCursor = { ...variables, cursor };
      const responseData = await customAxios(method, url, { query, variables: variablesWithCursor }, { headers });
      latestResponse = responseData;

      let interrogableObject = responseData?.data;

      if (nodeParts.length > 0) {
        for (const nodePart of nodeParts) {
          interrogableObject = interrogableObject?.[nodePart];
        }
      }

      let { [nodeName]: items } = interrogableObject;
      const { pageInfo } = items;
      items = items?.edges.map(edge => edge.node);

      allResults.push(...items);
      console.log(allResults.length);
      
      ({ hasNextPage, endCursor: cursor } = pageInfo);
      finalCursor = cursor;

      if (!limit) {
        continue;
      }
      limitReached = allResults.length >= limit;
    }
  } catch(err) {
    console.error(err, latestResponse);
    throw new Error(err);
  }

  if (!returnFinalCursor) {
    return allResults;  
  }

  return {
    finalCursor,
    items: allResults,
  };
};

module.exports = {
  respond,
  intsToRangeArray,
  extractCodeBetween,
  readFileYaml,
  askQuestion,
  capitaliseString,
  credsByKey,
  customAxios,
  stripEdgesAndNodes,
  mandateParam,

  shopifyRequestSetup,
  shopifyPaginateGraphql,
};