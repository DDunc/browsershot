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

function resolve() {
  return Promise.resolve();
}

function urlToFilename(url) {
  return url
    .replace('http://', '')
    .replace('https://', '')
    .replace('.', '_')
    .replace('/', '_');
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

  return {
    list: resolve,
    snap: function (config) {
      var urls = config.urls;
      var widths = config.widths;

      function filepath() {
        var parts = lodash.toArray(arguments).join('-');
        return path.join(config.outputDir, 'screenshot-' + parts + '.png');
      }

      function navigateToUrl(url) {
        return driver().get(url);
      }

      function takeScreenshotAtWidth(w, url) {
        console.log('   ', w, url);
        return setWidth(driver(), w)
          .then(
            resizeWindowToMaxSize.bind(null, driver())
          )
          .then(
            function () {
              return driver()
                .saveScreenshot( filepath(url, w) );
            }
          );
      }

      function takeScreenshotsAtWidths(widths, url) {
        return widths.reduce(
          function (promise, width) {
            return promise.then(function () {
              return takeScreenshotAtWidth(width, url);
            });
          },
          Promise.resolve()
        );
      }

      function takeScreenshotForUrlAtWidths(url, widths) {
        return navigateToUrl(url)
          .then(function () {
            return takeScreenshotsAtWidths(widths, urlToFilename(url));
          });
      }

      return urls.reduce(
        function (curr, url) {
          return curr.then(function () {
            return takeScreenshotForUrlAtWidths(url, widths);
          });
        },
        Promise.resolve()
      );

    },
    destroy: function () {
      return driver().quit();
    }
  };
}
