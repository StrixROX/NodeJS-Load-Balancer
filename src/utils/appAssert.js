function appAssert(condition, title, message) {
  if (!condition) {
    throw new Error(`${title}: ${message}`);
  }
}

module.exports = appAssert;
