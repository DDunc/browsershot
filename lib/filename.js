var parse = require('url').parse;
var reduce = require('lodash/reduce');
var pick = require('lodash/pick');
var compact = require('lodash/compact');

var whitelistedUrlComponents = [
  'protocol',
  'auth',
  'host',
  'port',
  'hostname',
  'hash',
  'search',
  'query',
  'pathname',
  'path',
  'href'
];

module.exports = function(tmpl) {
  return function(params) {
    params = params || {};
    var now = new Date();
    var urlParts = pick(parse(params.url), whitelistedUrlComponents);
    var allParts = Object.assign(
      urlParts,
      params,
      {
        url: params.url,
        date: now.toISOString(),
        timestamp: now.getTime(),
      }
    );
    return sanitise(replaceParts(tmpl, allParts));
  }
}

function sanitise(str) {
  if (str && str.replace) {
    return str.replace(/[\/\?<>\\:\*\|":]/g, '_');
  } else {
    return str;
  }
}

function replaceParts(str, parts) {
  return reduce(parts, function(curr, value, key) {
    if (value != null) {
      return curr.replace('{' + key + '}', value);
    } else {
      return curr;
    }
  }, str);
}
