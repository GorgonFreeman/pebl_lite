const { respond } = require('../utils');

const shopifyGetSingle = async (message) => {
  return { 
    response: `Heard ${ message }`,
  };
};

const shopifyGetSingleApi = async (req, res) => {
  const { message } = req.body;
  const result = await shopifyGetSingle(message);
  respond(res, 200, result);
};

module.exports = {
  shopifyGetSingle,
  shopifyGetSingleApi,
};

// curl localhost:8000/shopifyGetSingle -H "Content-Type: application/json" -d '{ "message": "Read the sign - no droids allowed." }'