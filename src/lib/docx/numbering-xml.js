export class Numbering {
  constructor (nums) {
    this.nums = nums
  }

  findLevel (numId, level) {
    const num = this.nums[numId]
    if (num) return num[level]
    else return null
  }
}

export const readNumberingXml = root => {
  const abstractNums = readAbstractNums(root)
  const nums = readNums(root, abstractNums)
  return new Numbering(nums)
}

const readAbstractNums = root => {
  const abstractNums = {}
  root.getElementsByTagName('w:abstractNum').forEach(element => {
    const id = element.attributes['w:abstractNumId']
    abstractNums[id] = readAbstractNum(element)
  })
  return abstractNums
}

const readAbstractNum = element => {
  const levels = {}
  element.getElementsByTagName('w:lvl').forEach(levelElement => {
    const levelIndex = levelElement.attributes['w:ilvl']
    const numFmt = levelElement.first('w:numFmt').attributes['w:val']
    levels[levelIndex] = {
      isOrdered: numFmt !== 'bullet',
      level: levelIndex
    }
  })
  return levels
}

const readNums = (root, abstractNums) => {
  const nums = {}
  root.getElementsByTagName('w:num').forEach(element => {
    const id = element.attributes['w:numId']
    const abstractNumId = element.first('w:abstractNumId').attributes['w:val']
    nums[id] = abstractNums[abstractNumId]
  })
  return nums
}

export const defaultNumbering = new Numbering({})
