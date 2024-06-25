const { respond, mandateParam } = require('../utils');

const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `
  id
  sku
`;

const shopifyVariantGet = async (keyObj, variantId, { attrs = defaultAttrs, ...options } = {}) => {
  return await shopifyGetSingle(keyObj, 'productVariant', variantId, { attrs, ...options });
};

const shopifyVariantGetApi = async (req, res) => {
  const { keyObj, variantId, options } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'keyObj', keyObj),
    mandateParam(res, 'variantId', variantId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyVariantGet(keyObj, variantId, options);
  respond(res, 200, result);
};

module.exports = {
  shopifyVariantGet,
  shopifyVariantGetApi,
};

// curl localhost:8000/shopifyVariantGet -H "Content-Type: application/json" -d '{ "keyObj": { "key": "example" }, "variantId": "41969051861075" }'