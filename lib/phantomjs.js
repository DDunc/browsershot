var phantom = require('phantom');
var lodash = require('lodash');
var os = require('os');
var path = require('path');

module.exports = function () {

  var instance = lodash.memoize(createInstance);

  function createInstance() {
    return phantom.create();
  }

  return {
    list: function () {
      return new Promise(function (resolve, reject) {
        resolve({
          browser: 'phantomjs'
        });
      });
    },
    snap: function (config) {
      return new Promise(function (resolve, reject) {
        instance()
          .then(createPage)
          .then(setPageWidth(1200))
          .then(openUrl(config.urls[0]))
          .then(renderToFile( path.join(config.outputDir, 'screenshot.png') ))
          .then(
            function () {
              resolve();
            },
            function () {
              reject();
            }
          );
      });
    },
    destroy: function () {
      instance()
        .then(function (ph) {
          return ph.exit();
        });
    }
  };
};

function createPage(instance) {
  return instance.createPage();
}

function setPageWidth(width) {
  return function (page) {
    return page
      .property('viewportSize', {width: width, height: 600})
      .then(function () {
        return page;
      });
  }
}

function openUrl(url) {
  return function (page) {
    return page
      .open(url)
      .then(
        function (status) {
          if (status === 'success') {
            return page;
          } else {
            throw new Error('Cannot open URL: ' + url);
          }
        }
      );
  }
}

function renderToFile(path) {
  return function (page) {
    return page.render(path);
  }
}
