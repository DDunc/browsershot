var http = require('http');
var https = require('https');
var fs = require('fs');
var parse = require('url').parse;

module.exports = function (url, path) {
  console.log('Download ', url, ' to ', path);
  var protocol = parse(url).protocol;

  // protocol can have a trailing colon e.g. 'http:'
  var client = /https/.test(protocol) ? https : http;

  return new Promise(function (resolve, reject) {
    var file = fs.createWriteStream(path);
    var request = client.get(url, function(response) {
      response.pipe(file, { end: false });

      file.on('end', function() {
        console.log('done');
        file.close(resolve);
      });
    });
  });
}
