const { respond, credsByKey } = require('../utils');

const shopifyGetSingle = async (keyObj, message) => {
  const creds = credsByKey(keyObj);
  return { 
    creds,
    response: `Heard ${ message }`,
  };
};

const shopifyGetSingleApi = async (req, res) => {
  const { keyObj, message } = req.body;
  const result = await shopifyGetSingle(keyObj, message);
  respond(res, 200, result);
};

module.exports = {
  shopifyGetSingle,
  shopifyGetSingleApi,
};

// curl localhost:8000/shopifyGetSingle -H "Content-Type: application/json" -d '{ "keyObj": { "platform": "shopify", "key": "example", "subkey": "alternate" }, "message": "Read the sign - no droids allowed." }'