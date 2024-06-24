const { respond, shopifyRequestSetup, customAxios, capitaliseString } = require('../utils');

const shopifyGetSingle = async (keyObj, resource, id, { subKey, attrs = defaultAttrs } = {}) => {

  const Resource = capitaliseString(resource);

  const { url, headers } = shopifyRequestSetup(keyObj);

  const query = `
    query Get${ Resource } ($id: ID!) {
      ${ resource }(id: $id) {
        ${ attrs }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/${ Resource }/${ id }`,
  };

  const results = await customAxios('post', url, { query, variables }, { headers });

  // TO DO: Return error if resource not there
  const data = results?.data?.[resource];
  if (!data) {
    return { error: results };
  }
  
  return data;
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

// curl localhost:8000/shopifyGetSingle -H "Content-Type: application/json" -d '{ "keyObj": { "key": "example", "subkey": "alternate" }, "message": "Read the sign - no droids allowed." }'