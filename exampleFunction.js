const { respond } = require('./utils');

const exampleFunction = async (message) => {
  return { 
    response: `Heard ${ message }`,
  };
};

const exampleFunctionApi = async (req, res) => {
  const { message } = req.body;
  const result = await exampleFunction(message);
  respond(res, 200, result);
};

module.exports = {
  exampleFunction,
  exampleFunctionApi,
};

// curl localhost:8000/exampleFunction -H "Content-Type: application/json" -d '{ "message": "Read the sign - no droids allowed." }'