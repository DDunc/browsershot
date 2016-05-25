var webdriver = require('selenium-webdriver');
var lodash = require('lodash');
var path = require('path');
var fs = require('fs');

// Patch webdriver to take screenshot
// From: https://www.browserstack.com/automate/node#enhancements
webdriver.WebDriver.prototype.saveScreenshot = function(filename) {
  console.log('saveScreenshot', filename);
  var self = this;
  return new Promise(function (resolve, reject) {
    console.log('in promise');
    self.takeScreenshot().then(function(data) {
      console.log('have data', !!data);
      fs.writeFile(filename, data.replace(/^data:image\/png;base64,/,''), 'base64', function(err) {
        err ? reject(err) : resolve();
      });
    });
  });
};

function getWidth(driver) {
  return driver.executeScript('return Math.max(document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth);');
}

function getHeight(driver) {
  return driver.executeScript("return Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);");
}

// From: https://gist.github.com/elcamino/5f562564ecd2fb86f559
function resizeWindowToMaxSize(driver){
  console.log('resizeWindowToMaxSize')

  return Promise.all([ getWidth(driver), getHeight(driver) ])
    .then(
      function (d) {
        console.log('dimensions', d);
        return driver.manage().window().setSize(d[0] + 100, d[1] + 100).then(function () {
          console.log('setSize promise is done');
          return Promise.resolve();
        });
      },
      function (err) {
        console.error('error', err);
      }
    );
}

function setWidth(driver, w){
  return driver.manage().window().setSize(w, 600);
}

module.exports = function (credentials) {

  var browser = {
    'browserName': 'Firefox',
    'os'         : 'OS X',
    'os_version' : 'El Capitan',
    'resolution' : '1600x1200',
  };

  var api = {
    'browserstack.user': credentials.username,
    'browserstack.key' : credentials.password,
  };

  var capabilities = lodash.assign({}, browser, api);

  function createDriver() {
    return new webdriver.Builder().
      usingServer('http://hub.browserstack.com/wd/hub').
      withCapabilities(capabilities).
      build();
  }

  var driver = lodash.memoize(createDriver);

  function resolve() {
    return Promise.resolve();
  }

  return {
    list: resolve,
    destroy: resolve,
    snap: function (config) {
      return driver()
        .get(config.urls[0])
        .then(
          function () {
            console.log('set width to 800');
            return setWidth(driver(), 800);
          }
        ).then(
          resizeWindowToMaxSize.bind(null, driver())
        )
        .then(
          function () {
            console.log('has resized window')
            return driver()
              .saveScreenshot( path.join(config.outputDir, 'screenshot.png'))
              .then(driver.quit, driver.quit);
          },
          function (err) {
            console.error('Error', err);
          }
        );
    }
  };
}
