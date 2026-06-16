/**
 * Pauses execution for a specific amount of milliseconds.
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = { delay };
