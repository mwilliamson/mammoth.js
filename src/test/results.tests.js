import assert from 'assert'

import * as results from '../lib/results'

const Result = results.Result
const test = require('./test')(module)

test('Result.combine removes any duplicate messages', function () {
  const first = new Result(null, [results.warning('Warning...')])
  const second = new Result(null, [results.warning('Warning...')])

  const combined = Result.combine([first, second])

  assert.deepEqual(combined.messages, [results.warning('Warning...')])
})
