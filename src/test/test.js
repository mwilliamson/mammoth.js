import * as path from 'path'

const root = path.dirname(__dirname)

module.exports = function (testModule) {
  const tests = testModule.exports[path.relative(root, testModule.filename)] = {}
  return function (name, func) {
    tests[name] = func
  }
}
