const { respond, shopifyRequestSetup, customAxios } = require('../utils');

const FUNC = async (keyObj, productId, { optionalArg } = {}) => {

  const { url, headers } = shopifyRequestSetup(keyObj);

  const query = `
    query GetProduct ($id: ID!) {
      product(id: $id) {
        ...
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Product/${ productId }`,
  };

  const result = await customAxios('post', url, { query, variables }, { headers });

  console.log(result);

  return result;
};

const FUNCApi = async (req, res) => {
  const { keyObj, productId, options } = req.body;
  const result = await FUNC(keyObj, productId, options);
  respond(res, 200, result);
};

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "keyObj": { "key": "example" }, "productId": "123" }'
