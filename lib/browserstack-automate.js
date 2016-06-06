var webdriver = require('selenium-webdriver');
var lodash = require('lodash');
var path = require('path');
var fs = require('fs');
var ora = require('ora');
var chalk = require('chalk');
var debug = require('debug')('backend:debug');

var truncate = require('./truncate');
var delayPromise = require('./delay');

function createErrorHandler(msg) {
  return function(err) {
    console.error(chalk.red(msg));
    console.error(err);
  // process.exit(1);
  };
}

process.on(
  'unhandledRejection',
  createErrorHandler('Unhandled promise rejection')
);

// Patch webdriver to take screenshot
// From: https://www.browserstack.com/automate/node#enhancements
webdriver.WebDriver.prototype.saveScreenshot = function(filename) {
  // console.log('saveScreenshot', filename);
  var self = this;
  return new Promise(function(resolve, reject) {
    // console.log('saveScreenshot: in promise');
    self.takeScreenshot().then(
      function(data) {
        // console.log('saveScreenshot: have data', !!data);
        fs.writeFile(
          filename,
          data.replace(/^data:image\/png;base64,/, ''),
          'base64',
          function(err) {
            err ? reject(err) : resolve();
          }
        );
      },
      createErrorHandler('Error saving screenshot')
    );
  });
};

function getWidth(driver) {
  return driver.executeScript('return Math.max(document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth);');
}

function getHeight(driver) {
  return driver.executeScript("return Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);");
}

// From: https://gist.github.com/elcamino/5f562564ecd2fb86f559
function resizeWindowToMaxSize(driver) {
  // console.log('resizeWindowToMaxSize')

  return Promise.all([getWidth(driver), getHeight(driver)])
    .then(
      function(d) {
        // console.log('dimensions', d);
        return driver.manage().window().setSize(d[0] + 100, d[1] + 100).then(function() {
          // console.log('setSize promise is done');
          return Promise.resolve();
        });
      },
      createErrorHandler('Error resizing window to max size')
  );
}

function setWidth(driver, w) {
  return driver.manage().window().setSize(w, 600);
}

function resolve() {
  return Promise.resolve();
}

module.exports = function(credentials, options) {

  options = options || {};

  var browser = {
    'browserName': 'Firefox',
    'os': 'OS X',
    'os_version': 'El Capitan',
    'resolution': '1600x1200',
  };

  if (!credentials.username || !credentials.key) {
    throw new Error('Missing username and key')
  }

  var api = {
    'browserstack.user': credentials.username,
    'browserstack.key': credentials.key,
  };

  if (options.local === true) {
    api['browserstack.local'] = 'true';
  }

  var capabilities = lodash.assign({}, browser, api);

  debug('capabilities', capabilities);

  function createDriver() {
    return new webdriver.Builder().usingServer('http://hub.browserstack.com/wd/hub').withCapabilities(capabilities).build();
  }

  var driver = lodash.memoize(createDriver);

  return {
    list: resolve,
    snap: function(config) {
      var urls = config.urls;
      var widths = config.widths;
      var filenameMaker = config.filenameMaker;
      var urlDelayS = config.delay;
      var urlDelayMs = config.delay * 1000;

      var spinner;

      function filepath(params) {
        return path.join(config.outputDir, filenameMaker(params));
      }

      function navigateToUrl(url) {
        return driver().get(url)
          .then(
            function() {
              return driver().navigate().refresh();
            }
          );
      }

      function takeScreenshotAtWidth(width, url, context) {
        return setWidth(driver(), width)
          .then(
            resizeWindowToMaxSize.bind(null, driver()),
            createErrorHandler('Error setting page width')
        )
          .then(
            function() {
              const params = Object.assign(
                {},
                context,
                {
                  url: url,
                  width: width
                }
              );
              const file = filepath(params);
              console.log('\t\t📸 ', chalk.bold(file));
              return driver()
                .saveScreenshot(file);
            },
            createErrorHandler('Error resizing to max width')
        )
          .then(null, createErrorHandler('Error saving screenshot'))
      }

      function takeScreenshotsAtWidths(widths, url, context) {
        return widths.reduce(
          function(promise, width) {
            return promise.then(
              function() {
                console.log('\t\ttake screenshot at width:', chalk.bold(width));
                return takeScreenshotAtWidth(width, url, context);
              },
              createErrorHandler('Error in promise chain')
            );
          },
          Promise.resolve()
        );
      }

      function takeScreenshotForUrlAtWidths(url, widths, context) {
        var messageStart = 'Navigating to: ';
        var truncateLength = process.stdout.columns - 10 - messageStart.length;

        spinner = ora({
          text: messageStart + chalk.underline(truncate(url, truncateLength)),
          spinner: 'bounce'
        }).start();
        return navigateToUrl(url)
          .then(function() {
            console.log(' ✅');
            spinner.stop();
          },
          function (err) {
            if (/Authorization required/i.test(err.message)) {
              console.error( chalk.red('\n\nAuthorization error: check your API credentials') );
              process.exit(1);
            }
          })
          .then(function() {
            if (urlDelayMs) {
              console.log('\t\tdelay for ' + urlDelayS + 'sec');
              return delayPromise(urlDelayMs);
            } else {
              return Promise.resolve();
            }
          })
          .then(
            function() {
              return takeScreenshotsAtWidths(widths, url, context);
            },
            createErrorHandler('Error navigating to url: ' + url)
        );
      }

      console.log('Start snapping');

      return urls.reduce(
        function(curr, url, count) {
          return curr.then(
            function() {
              return takeScreenshotForUrlAtWidths(url.url, widths, {
                count: count,
                tag: url.tag
              });
            },
            createErrorHandler('error in url promise chain')
          );
        },
        Promise.resolve()
      );

    },
    destroy: function() {
      return driver().quit();
    }
  };
}
