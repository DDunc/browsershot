var BrowserStack = require("browserstack");

module.exports = function (credentials) {
  var browserStackCredentials = {
  	username: credentials.username,
  	password: credentials.password,
  };

  console.log('Credentials', browserStackCredentials);

  var screenshotClient = BrowserStack.createScreenshotClient(browserStackCredentials);

  var jobs = [];

  return {
    list: function () {
      return new Promise(function (resolve, reject) {
        screenshotClient.getBrowsers(function (err, data) {
          err ? reject(err) : resolve(data);
        });
      });
    },
    snap: function (config) {
      var browser = {
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'Chrome',
        // browser_version
      };
      var options = {
        url: "http://smallpdf.com",
        browsers: [browser],
      };
      return new Promise(function (resolve, reject) {
        screenshotClient.generateScreenshots(options, function (err, job) {
          err ? reject(err) : resolve(job);
        });
      });
    },
    destroy: function () {
      return Promise.resolve();
    }
  };
};
