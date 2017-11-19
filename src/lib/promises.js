import _ from 'underscore'
import { promisify } from 'util'

export { promisify }

export const nfcall = function (func) {
  const args = Array.prototype.slice.call(arguments, 1)
  const promisedFunc = promisify(func)
  return promisedFunc.apply(null, args)
}

export const also = func => value => {
  const returnValue = _.extend({}, value, func(value))
  return props(returnValue)
}
export const defer = () => {
  let _resolve
  let _reject
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })

  return {
    resolve: _resolve,
    reject: _reject,
    promise
  }
}

export const tap = handler => result => Promise.resolve(handler(result)).then(() => result)

/**
 * Behaves the same way as Promise.resolve(func()), but catches any synchronous error present in func.
 * @param {function} func
 * @returns {Promise<any>}
 */
export const attempt = func => new Promise((resolve, reject) => {
  try {
    resolve(func())
  } catch (error) {
    reject(error)
  }
})
/**
 * Helper function that allows to waterfall the execution of Promise.
 * The `waterfall` function which is a decorator (takes a function, returns a function) executes in order every promise
 * returned by said functions.
 * The guardian is the Promise 'state' at which the waterfall is, it's usually meant to be internal, but in some rare
 * cases is useful. Be careful when you use it, it is mutated each time the waterfall function is used (thus then need
 * of the getter).
 * @returns {{waterfall: (function(*=): function(...[*])), guardian}}
 */
const makeWaterfall = () => {
  let guardian = Promise.resolve()

  const waterfall = func => (...args) => {
    guardian = guardian.then(() => {
      return func(...args)
        .then(result => ({error: false, result}), result => ({error: true, result}))
    })
    return guardian.then(({error, result}) => {
      if (error) return Promise.reject(result)
      else return Promise.resolve(result)
    })
  }
  return {
    waterfall,
    get guardian () {
      return guardian
    }
  }
}
/**
 * Implementation of bluebird.mapSeries with native Promise
 * @param {Iterable|Promise<Iterable>} input
 * @param {mapSeries~mapper} mapper
 * @returns {Promise<Array<any>>}
 */
export const mapSeries = (input, mapper) => {
  const waterfall = makeWaterfall().waterfall
  return Promise.resolve(input)
    .then(_iterator => Array.from(_iterator))
    .then(array => {
      const length = array.length
      return Promise.all(array.map(waterfall((element, index) =>
        Promise.resolve(element)
          .then(_el => mapper(_el, index, length))
      )))
    })
}

/**
 * Callback used by myFunction.
 * @callback mapSeries~mapper
 * @param {any} item
 * @param {int} index
 * @param {int} length
 * @returns {any|Promise<any>}
 */

/**
 * @param obj
 * @returns {Promise<any>}
 */
export const props = obj => Promise.resolve(obj)
  .then(_obj => {
    if (_obj instanceof Map) {
      const keys = _obj.keys()
      return Promise.all(keys.map(key => Promise.resolve(_obj[key])))
        .then(arr => {
          const result = {}
          arr.forEach((value, index) => {
            result[keys[index]] = value
          })
          return result
        })
    } else if (_obj instanceof Array) return Promise.all(_obj)
    else {
      const keys = Object.keys(_obj)
      return Promise.all(keys.map(key => Promise.resolve(_obj[key])))
        .then(arr => {
          const result = {}
          arr.forEach((value, index) => {
            result[keys[index]] = value
          })
          return result
        })
    }
  })
