var BrowserStack = require("browserstack");

module.exports = function (credentials) {
  var browserStackCredentials = {
  	username: credentials.username,
  	password: credentials.password,
  };

  var screenshotClient = BrowserStack.createScreenshotClient(browserStackCredentials);

  return {
    list: function () {
      return new Promise(function (resolve, reject) {
        screenshotClient.getBrowsers(function (err, data) {
          err ? reject(err) : resolve(data);
        });
      });
    },
    snap: function (config) {
      return new Promise(function (resolve, reject) {
        screenshotClient.generateScreenshots(config, function (err, job) {
          err ? reject(err) : resolve(job);
        });
      });
    }
  };
};
