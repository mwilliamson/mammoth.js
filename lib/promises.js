exports.defer = defer;
exports.when = Promise.resolve.bind(Promise);
exports.resolve = Promise.resolve.bind(Promise);
exports.all = Promise.all.bind(Promise);
exports.reject = Promise.reject.bind(Promise);

exports.props = function (obj) {
  const keys = Object.keys(obj);
  const values = Object.values(obj);

  return Promise.all(values).then((resolvedValues) => {
    return keys.reduce((acc, key, index) => {
      acc[key] = resolvedValues[index];
      return acc;
    }, {});
  });
};

exports.promisify = function (fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, ...results) => {
        if (err) return reject(err);
        return resolve(results.length === 1 ? results[0] : results);
      });
    });
  };
};

exports.mapSeries = async function (arr, iterator) {
  const results = [];
  for (const item of arr) {
    results.push(await iterator(item));
  }
  return results;
};

exports.attempt = function (fn) {
  try {
    return Promise.resolve(fn());
  } catch (e) {
    return Promise.reject(e);
  }
};

// Replace nfcall with native implementation
exports.nfcall = function (func, ...args) {
  const promisifiedFunc = exports.promisify(func);
  return promisifiedFunc.apply(null, args);
};

// Add caught alias for catch (replacing Bluebird's fail)
Promise.prototype.caught = Promise.prototype.catch;

// Add also method (similar to Bluebird's implementation)
Promise.prototype.also = function (func) {
  return this.then((value) => {
    const returnValue = { ...value, ...func(value) };
    return exports.props(returnValue);
  });
};

function defer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    resolve,
    reject,
    promise,
  };
}
