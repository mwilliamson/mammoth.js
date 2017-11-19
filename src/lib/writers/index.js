import * as htmlWriter from './html-writer'
import * as markdownWriter from './markdown-writer'

export const writer = (options = {}) =>
  (options).outputFormat === 'markdown'
    ? markdownWriter.writer()
    : htmlWriter.writer(options)
