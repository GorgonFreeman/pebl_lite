const { respond } = require('../utils');

const shopifyExample = async (message) => {
  return { 
    response: `Heard ${ message }`,
  };
};

const shopifyExampleApi = async (req, res) => {
  const { message } = req.body;
  const result = await shopifyExample(message);
  respond(res, 200, result);
};

module.exports = {
  shopifyExample,
  shopifyExampleApi,
};

// curl localhost:8000/shopifyExample -H "Content-Type: application/json" -d '{ "message": "Read the sign - no droids allowed." }'