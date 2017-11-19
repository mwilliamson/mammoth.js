import _ from 'underscore'

export class Result {
  constructor (value, messages) {
    this.value = value
    this.messages = messages || []
  }

  map (func) {
    return new Result(func(this.value), this.messages)
  }

  flatMap (func) {
    const funcResult = func(this.value)
    return new Result(funcResult.value, combineMessages([this, funcResult]))
  }

  flatMapThen (func) {
    const that = this
    return func(this.value).then(otherResult => new Result(otherResult.value, combineMessages([that, otherResult])))
  }

  static combine (results) {
    const values = _.flatten(_.pluck(results, 'value'))
    const messages = combineMessages(results)
    return new Result(values, messages)
  }
}

export const success = value => new Result(value, [])

export const warning = message => ({
  type: 'warning',
  message: message
})

export const error = exception => ({
  type: 'error',
  message: exception.message,
  error: exception
})

const combineMessages = results => {
  const messages = []
  _.flatten(_.pluck(results, 'messages'), true).forEach(message => {
    if (!containsMessage(messages, message)) messages.push(message)
  })
  return messages
}

const containsMessage = (messages, message) => _.find(messages, isSameMessage.bind(null, message)) !== undefined

const isSameMessage = (first, second) => first.type === second.type && first.message === second.message
