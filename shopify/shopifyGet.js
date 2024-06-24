const { respond, mandateParam, shopifyRequestSetup, customAxios, shopifyPaginateGraphql, capitaliseString, stripEdgesAndNodes } = require('../utils');

const defaultAttrs = `
  id
`;

const shopifyGet = async (keyObj, resource, { 
  perPage = 250,
  attrs = defaultAttrs,
  queries,
  reverse = false,
  limit = false,
  cursor,
  returnFinalCursor,
} = {}) => {

  const resources = `${ resource }s`;
  // Forgive me, this is a capital for legibility
  const Resources = capitaliseString(resources);

  const { url, headers } = shopifyRequestSetup(keyObj);

  const query = `
    query Get${ Resources } ($first: Int!, ${ queries ? `$query: String,` : '' } $reverse: Boolean, $cursor: String) {
      ${ resources }(
        first: $first,
        ${ queries ? `query: $query,` : '' }
        reverse: $reverse,
        after: $cursor,
      ) {
        edges {
          node {
            ${ attrs }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    reverse,
    first: perPage,
    ...queries && { query: queries.join(' AND ') },
  };

  const results = await shopifyPaginateGraphql(query, resources, url, headers, { variables, limit, cursor, returnFinalCursor });
  return stripEdgesAndNodes(results);
};

const shopifyGetApi = async (req, res) => {
  const { keyObj, resource, options } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'keyObj', keyObj),
    mandateParam(res, 'resource', resource),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyGet(keyObj, resource, options);
  respond(res, 200, result);
};

module.exports = {
  shopifyGet,
  shopifyGetApi,
};

// curl localhost:8000/shopifyGet -H "Content-Type: application/json" -d '{ "keyObj": { "key": "example" }, "resource": "customer" }'
// curl localhost:8000/shopifyGet -H "Content-Type: application/json" -d '{ "keyObj": { "key": "example" }, "resource": "customer", "options": { "limit": 500, "attrs": "id, firstName, email, lastName" } }'
