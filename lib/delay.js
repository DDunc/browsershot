module.exports = function (delayMs) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, delayMs);
  });
}
