import assert from 'assert'
import * as child_process from 'child_process' // eslint-disable-line camelcase
import * as path from 'path'
import { track } from 'temp'
import * as fs from 'fs'

import * as promises from '../lib/promises'
import { testPath } from './testing'

const temp = track()
const test = require('./test')(module)
test('HTML is printed to stdout if output file is not set', function () {
  return runMammoth(testPath('single-paragraph.docx'))
    .then(result => {
      assert.equal(result.stderrOutput, '')
      assert.equal(result.output, '<p>Walking on imported air</p>')
    })
})

test('HTML is written to file if output file is set', function () {
  return createTempDir().then(function (tempDir) {
    const outputPath = path.join(tempDir, 'output.html')
    return runMammoth(testPath('single-paragraph.docx'), outputPath)
      .then(result => {
        assert.equal(result.stderrOutput, '')
        assert.equal(result.output, '')
        assert.equal(fs.readFileSync(outputPath, 'utf8'), '<p>Walking on imported air</p>')
      })
  })
})

const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOvgAADr4B6kKxwAAAABNJREFUKFNj/M+ADzDhlWUYqdIAQSwBE8U+X40AAAAASUVORK5CYII='

test('inline images are included in output if writing to single file', function () {
  return runMammoth(testPath('tiny-picture.docx'))
    .then(result => {
      assert.equal(result.stderrOutput, '')
      assert.equal(result.output, '<p><img src="data:image/png;base64,' + imageBase64 + '" /></p>')
    })
})

test('images are written to separate files if output dir is set', function () {
  return createTempDir().then(function (tempDir) {
    const outputPath = path.join(tempDir, 'tiny-picture.html')
    const imagePath = path.join(tempDir, '1.png')
    return runMammoth(testPath('tiny-picture.docx'), '--output-dir', tempDir)
      .then(result => {
        assert.equal(result.stderrOutput, '')
        assert.equal(result.output, '')
        assert.equal(fs.readFileSync(outputPath, 'utf8'), '<p><img src="1.png" /></p>')
        assert.equal(fs.readFileSync(imagePath, 'base64'), imageBase64)
      })
  })
})

test('style map is used if set', function () {
  return createTempDir().then(function (tempDir) {
    const styleMapPath = path.join(tempDir, 'style-map')
    fs.writeFileSync(styleMapPath, 'p => span:fresh')
    return runMammoth(testPath('single-paragraph.docx'), '--style-map', styleMapPath)
      .then(result => {
        assert.equal(result.stderrOutput, '')
        assert.equal(result.output, '<span>Walking on imported air</span>')
      })
  })
})

test('--output-format=markdown option generate markdown output', function () {
  return runMammoth(testPath('single-paragraph.docx'), '--output-format=markdown')
    .then(result => {
      assert.equal(result.stderrOutput, '')
      assert.equal(result.output, 'Walking on imported air\n\n')
    })
})

const runMammoth = (...args) => {
  args = args.slice(0)
  const deferred = promises.defer()

  const processArgs = ['node', 'build/bin/mammoth'].concat(args)
  // TODO: proper escaping of args
  const command = processArgs.join(' ')
  child_process.exec(command, (error, stdout, stderr) => { // eslint-disable-line camelcase
    console.log(stderr) // eslint-disable-line no-console
    assert.equal(error, null)
    deferred.resolve({output: stdout, stderrOutput: stderr})
  })

  return deferred.promise
}

const createTempDir = () => promises.nfcall(temp.mkdir, null)
