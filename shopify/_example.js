const { respond } = require('../utils');

const FUNC = async (message) => {
  return { 
    response: `Heard ${ message }`,
  };
};

const FUNCApi = async (req, res) => {
  const { message } = req.body;
  const result = await FUNC(message);
  respond(res, 200, result);
};

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "message": "Read the sign - no droids allowed." }'