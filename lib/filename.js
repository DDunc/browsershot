var parse = require('url').parse;
var reduce = require('lodash/reduce');

module.exports = function (tmpl) {
  return function (params) {
    params = params || {};
    var now = new Date();
    var urlParts = parse(params.url);
    var allParts = Object.assign(
      urlParts,
      params,
      {
        date: now.toISOString(),
        timestamp: now.getTime(),
      }
    );
    return replaceParts(tmpl, allParts);
  }
}

function replaceParts(str, parts) {
  return reduce(parts, function (curr, value, key) {
    return curr.replace('{' + key + '}', value);
  }, str);
}
