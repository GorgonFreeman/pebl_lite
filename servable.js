const servableFunctions = [
  'shopify/shopifyVariantGet',
  'shopify/shopifyGet',
  'shopify/shopifyGetSingle',
];

const slackErrorReportWrapper = async (func, ...args) => {
  // Not actually reporting to Slack in this demo
  console.log(func);
  try {
    return await func(...args);
  } catch (err) {
    console.error(err);
  }
  return false;
};

module.exports = Object.fromEntries(servableFunctions.map(funcPath => {
  const funcPathParts = funcPath.split('/');
  const funcName = funcPathParts[funcPathParts.length - 1];
  const apiFuncName = `${ funcName }Api`;
  const moduleExport = require(`./${ funcPath }`);
  const apiFunc = (...args) => slackErrorReportWrapper(moduleExport[apiFuncName], ...args);
  return [funcName, apiFunc];
}));