module.exports = function (tmpl) {
  return function (params) {
    params = params || {};
    return tmpl
      .replace('{url}', params.url)
      .replace('{width}', params.width);
  }
}
