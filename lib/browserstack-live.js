var BrowserStack = require("browserstack");
var path = require('path');
var lodash = require('lodash');

var download = require('./download');

module.exports = function (credentials) {
  var browserStackCredentials = {
  	username: credentials.username,
  	password: credentials.password,
  };

  console.log('Credentials', browserStackCredentials);

  var client = BrowserStack.createClient(browserStackCredentials);

  function getRunningWorker() {
    return new Promise(function (resolve, reject) {
      client.getWorkers(function (err, workers) {
        console.log('Workers: ', workers.length, workers);
        var runningWorker = lodash.find(workers, { status: 'running'});
        runningWorker ? resolve(runningWorker) : reject();
      });
    });
  }

  function fetchRunningWorkerOrCreate(settings) {
    return getRunningWorker()
      .then(
        null,
        createWorker.bind(null, settings)
      );
  }

  function createWorker(settings) {
    return new Promise(function (resolve, reject) {
      client.createWorker(settings, function (err, worker) {
        if (err) {
          reject(err);
        } else {
          waitUntilUp(worker.id)
            .then(resolve.bind(null, worker));
        }
      });
    });
  }


  function isWorkerUp(id) {
    return new Promise(function (resolve, reject) {
      client.getWorker(id, function (error, worker) {
        worker.status === 'running' ? resolve() : reject();
      });
    });
  }

  function waitUntilUp(id) {
    console.log('waitUntilUp', id);
    return isWorkerUp(id)
        .then(
          function () {
            console.log('isWorkerUp', id);
            return;
          },
          function () {
            console.log('Not up, set poll');
            return delay(1000, id).then(waitUntilUp);
          }
        );
  }

  function delay(time, arg) {
    return new Promise(function (resolve) {
      setTimeout(resolve.bind(null, arg), time);
    });
  }

  var jobs = [];

  return {
    list: function () {
      return new Promise(function (resolve, reject) {
        client.getBrowsers(function (err, data) {
          err ? reject(err) : resolve(data);
        });
      });
    },
    snap: function (config) {
      var settings = {
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'Chrome',
        browser_version: 'latest',
        url: config.urls[0],
      };
      return new Promise(function (resolve, reject) {

        fetchRunningWorkerOrCreate(settings)
          .then(function (worker) {
            console.log('Worker is ready', worker);
            client.takeScreenshot(worker.id, function (err, data) {
              if (err) {
                reject(err);
              } else {
                console.log('screenshot done', data.url);
                download(data.url, path.join(config.outputDir, 'screenshot.png'))
                  .then(
                    function (){
                      console.log('download is done');
                      resolve();
                    },
                    function (err) {
                      console.error('error downloading file', err.stack);
                      reject();
                    }
                  );
              }
            });
          });

        /*
        client.createWorker(settings, function (err, worker) {
          if (err) {
            reject(err);
          } else {
            console.log('worker created', worker);

            waitUntilUp(worker.id)
              .then(
                function () {
                  console.log('Worker is up', worker);

                  client.takeScreenshot(worker.id, function (err, data) {
                    if (err) {
                      reject(err);
                    } else {
                      console.log('screenshot done', data.url);
                      download(data.url, path.join(config.outputDir, 'screenshot.png'))
                        .then(
                          function (){
                            console.log('download is done');
                            resolve();
                          },
                          function (err) {
                            console.error('error downloading file', err.stack);
                            reject();
                          }
                        );
                    }
                  });
                },
                function () { console.log('Error'); }
              );
          }
        });*/
      });
    },
    destroy: function () {
      return new Promise(function (resolve, reject) {
        client.getWorkers(function (err, workers) {
          console.log('Destroy workers: ', workers.length, workers);

          var destroyWorkerPromises = workers.map(function (worker) {
            return new Promise(
              function (resolve, reject) {
                client.terminateWorker(worker.id, resolve);
              }
            );
          });

          return Promise.all(destroyWorkerPromises).then(resolve);
        });
      });
    }
  };
};
