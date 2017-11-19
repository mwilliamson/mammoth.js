import lop from 'lop'

import * as results from './results'
import tokenise from './styles/parser/tokeniser'
import * as htmlPaths from './styles/html-paths'
import * as documentMatchers from './styles/document-matchers'

export const readStyle = string => parseString(styleRule, string)

const createStyleRule = () => lop.rules.sequence(
  lop.rules.sequence.capture(documentMatcherRule()),
  lop.rules.tokenOfType('whitespace'),
  lop.rules.tokenOfType('arrow'),
  lop.rules.sequence.capture(lop.rules.optional(lop.rules.sequence(
    lop.rules.tokenOfType('whitespace'),
    lop.rules.sequence.capture(htmlPathRule())
  ).head())),
  lop.rules.tokenOfType('end')
)
  .map((documentMatcher, htmlPath) => ({
    from: documentMatcher,
    to: htmlPath.valueOrElse(htmlPaths.empty)
  }))

export const readDocumentMatcher = string => parseString(documentMatcherRule(), string)

const documentMatcherRule = () => {
  const sequence = lop.rules.sequence

  const identifierToConstant = (identifier, constant) => lop.rules.then(
    lop.rules.token('identifier', identifier),
    () => constant
  )

  const paragraphRule = identifierToConstant('p', documentMatchers.paragraph)
  const runRule = identifierToConstant('r', documentMatchers.run)

  const elementTypeRule = lop.rules.firstOf('p or r or table',
    paragraphRule,
    runRule
  )

  const styleIdRule = lop.rules.then(
    classRule,
    styleId => ({styleId: styleId})
  )

  const styleNameMatcherRule = lop.rules.firstOf('style name matcher',
    lop.rules.then(
      lop.rules.sequence(
        lop.rules.tokenOfType('equals'),
        lop.rules.sequence.cut(),
        lop.rules.sequence.capture(stringRule)
      ).head(),
      styleName => ({styleName: documentMatchers.equalTo(styleName)})
    ),
    lop.rules.then(
      lop.rules.sequence(
        lop.rules.tokenOfType('startsWith'),
        lop.rules.sequence.cut(),
        lop.rules.sequence.capture(stringRule)
      ).head(),
      styleName => ({styleName: documentMatchers.startsWith(styleName)})
    )
  )

  const styleNameRule = lop.rules.sequence(
    lop.rules.tokenOfType('open-square-bracket'),
    lop.rules.sequence.cut(),
    lop.rules.token('identifier', 'style-name'),
    lop.rules.sequence.capture(styleNameMatcherRule),
    lop.rules.tokenOfType('close-square-bracket')
  ).head()

  const listTypeRule = lop.rules.firstOf('list type',
    identifierToConstant('ordered-list', {isOrdered: true}),
    identifierToConstant('unordered-list', {isOrdered: false})
  )
  const listRule = sequence(
    lop.rules.tokenOfType('colon'),
    sequence.capture(listTypeRule),
    sequence.cut(),
    lop.rules.tokenOfType('open-paren'),
    sequence.capture(integerRule),
    lop.rules.tokenOfType('close-paren')
  ).map((listType, levelNumber) => ({
    list: {
      isOrdered: listType.isOrdered,
      levelIndex: levelNumber - 1
    }
  }))

  const createMatcherSuffixesRule = rules => {
    const matcherSuffix = lop.rules.firstOf.apply(
      lop.rules.firstOf,
      ['matcher suffix'].concat(rules)
    )
    const matcherSuffixes = lop.rules.zeroOrMore(matcherSuffix)
    return lop.rules.then(matcherSuffixes, suffixes => {
      const matcherOptions = {}
      suffixes.forEach(suffix => {
        Object.assign(matcherOptions, suffix)
      })
      return matcherOptions
    })
  }

  const paragraphOrRun = sequence(
    sequence.capture(elementTypeRule),
    sequence.capture(createMatcherSuffixesRule([
      styleIdRule,
      styleNameRule,
      listRule
    ]))
  ).map((createMatcher, matcherOptions) => createMatcher(matcherOptions))

  const table = sequence(
    lop.rules.token('identifier', 'table'),
    sequence.capture(createMatcherSuffixesRule([
      styleIdRule,
      styleNameRule
    ]))
  ).map(options => documentMatchers.table(options))

  const bold = identifierToConstant('b', documentMatchers.bold)
  const italic = identifierToConstant('i', documentMatchers.italic)
  const underline = identifierToConstant('u', documentMatchers.underline)
  const strikethrough = identifierToConstant('strike', documentMatchers.strikethrough)
  const smallCaps = identifierToConstant('small-caps', documentMatchers.smallCaps)
  const commentReference = identifierToConstant('comment-reference', documentMatchers.commentReference)

  const breakMatcher = sequence(
    lop.rules.token('identifier', 'br'),
    sequence.cut(),
    lop.rules.tokenOfType('open-square-bracket'),
    lop.rules.token('identifier', 'type'),
    lop.rules.tokenOfType('equals'),
    sequence.capture(stringRule),
    lop.rules.tokenOfType('close-square-bracket')
  ).map(breakType => {
    switch (breakType) {
      case 'line':
        return documentMatchers.lineBreak
      case 'page':
        return documentMatchers.pageBreak
      case 'column':
        return documentMatchers.columnBreak
      default:
      // TODO: handle unknown document matchers
    }
  })

  return lop.rules.firstOf('element type',
    paragraphOrRun,
    table,
    bold,
    italic,
    underline,
    strikethrough,
    smallCaps,
    commentReference,
    breakMatcher
  )
}

export const readHtmlPath = string => parseString(htmlPathRule(), string)

const htmlPathRule = () => {
  const capture = lop.rules.sequence.capture
  const whitespaceRule = lop.rules.tokenOfType('whitespace')
  const freshRule = lop.rules.then(
    lop.rules.optional(lop.rules.sequence(
      lop.rules.tokenOfType('colon'),
      lop.rules.token('identifier', 'fresh')
    )),
    option => option.map(() => true).valueOrElse(false)
  )

  const separatorRule = lop.rules.then(
    lop.rules.optional(lop.rules.sequence(
      lop.rules.tokenOfType('colon'),
      lop.rules.token('identifier', 'separator'),
      lop.rules.tokenOfType('open-paren'),
      capture(stringRule),
      lop.rules.tokenOfType('close-paren')
    ).head()),
    option => option.valueOrElse('')
  )

  const tagNamesRule = lop.rules.oneOrMoreWithSeparator(
    identifierRule,
    lop.rules.tokenOfType('choice')
  )

  const styleElementRule = lop.rules.sequence(
    capture(tagNamesRule),
    capture(lop.rules.zeroOrMore(classRule)),
    capture(freshRule),
    capture(separatorRule)
  ).map((tagName, classNames, fresh, separator) => {
    const attributes = {}
    const options = {}
    if (classNames.length > 0) attributes['class'] = classNames.join(' ')
    if (fresh) options.fresh = true
    if (separator) options.separator = separator
    return htmlPaths.element(tagName, attributes, options)
  })

  return lop.rules.firstOf('html path',
    lop.rules.then(lop.rules.tokenOfType('bang'), () => htmlPaths.ignore),
    lop.rules.then(
      lop.rules.zeroOrMoreWithSeparator(
        styleElementRule,
        lop.rules.sequence(
          whitespaceRule,
          lop.rules.tokenOfType('gt'),
          whitespaceRule
        )
      ),
      htmlPaths.elements
    )
  )
}

const escapeSequences = {
  'n': '\n',
  'r': '\r',
  't': '\t'
}

const decodeEscapeSequences = value => value.replace(/\\(.)/g, (match, code) => escapeSequences[code] || code)

const identifierRule = lop.rules.then(
  lop.rules.tokenOfType('identifier'),
  decodeEscapeSequences
)
const integerRule = lop.rules.tokenOfType('integer')

const stringRule = lop.rules.then(
  lop.rules.tokenOfType('string'),
  decodeEscapeSequences
)

const classRule = lop.rules.sequence(
  lop.rules.tokenOfType('dot'),
  lop.rules.sequence.cut(),
  lop.rules.sequence.capture(identifierRule)
).head()

const parseString = (rule, string) => {
  const tokens = tokenise(string)
  const parser = lop.Parser()
  const parseResult = parser.parseTokens(rule, tokens)
  if (parseResult.isSuccess()) return results.success(parseResult.value())
  else return new results.Result(null, [results.warning(describeFailure(string, parseResult))])
}

const describeFailure = (input, parseResult) => `Did not understand this style mapping, so ignored it: ${input}
${parseResult.errors().map(describeError).join('\n')}`

const describeError = error => `Error was at character number ${error.characterNumber()}: Expected ${error.expected} but got ${error.actual}`

const styleRule = createStyleRule()
