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

module.exports = {
  respond,
  intsToRangeArray,
  extractCodeBetween,
  readFileYaml,
  askQuestion,
  capitaliseString,
};