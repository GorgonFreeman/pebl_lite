const respond = (res, status, data, contentType = 'application/json') => {
  return res.writeHead(status, { 'Content-Type': contentType }).end(contentType === 'application/json' ? JSON.stringify(data) : data);
};

const intsToRangeArray = (min, max) => {
  min = parseInt(min);
  max = parseInt(max);

  return [
    min,
    ...Array.from({ length: max - min }, (v,k) => min + k + 1),
  ];
};

module.exports = {
  respond,
  intsToRangeArray,
};