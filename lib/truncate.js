module.exports = function truncate(str, limit) {
  if (str.length > limit) {
    return str.slice(0, limit) + '…';
  } else {
    return str;
  }
}
