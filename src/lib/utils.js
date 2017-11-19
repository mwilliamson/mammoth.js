export const indexBy = (object, key) => Object.keys(object).reduce((result, k) => {
  const value = object[k]
  result[typeof key === 'function' ? key(value) : value[key]] = value
  return result
}, [])

export const flatten = (arr, shallow = false) => {
  if (shallow) return Array.prototype.concat(...arr)
  else {
    let i = 0
    while (i < arr.length) {
      if (Array.isArray(arr[i])) arr.splice(i, 1, ...arr[i])
      else i++
    }
    return arr
  }
}

export const flatMap = (values, func) => flatten(values.map(func), true)

export const mapObject = (input, valueFunc, keyFunc) => Object.keys(input).reduce((result, key) => {
  const mappedKey = keyFunc(input[key], key, input)
  result[mappedKey] = valueFunc(input[key], key, input)
  return result
}, {})

export const negate = predicate => value => !predicate(value)

export const omit = (obj, ...keys) => {
  const result = Object.assign({}, obj)
  keys.forEach(key => {
    if (result.hasOwnProperty(key)) delete result[key]
  })
  return result
}
