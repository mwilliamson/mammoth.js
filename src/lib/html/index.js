import { isVoidElement } from './ast'
import simplify from './simplify'

export { simplify }
export { freshElement, nonFreshElement, elementWithTag, text, forceWrite } from './ast'

export const write = (writer, nodes) => {
  nodes.forEach(node => {
    writeNode(writer, node)
  })
}

const writeNode = (writer, node) => {
  toStrings[node.type](writer, node)
}

const generateElementString = (writer, node) => {
  if (isVoidElement(node)) writer.selfClosing(node.tag.tagName, node.tag.attributes)
  else {
    writer.open(node.tag.tagName, node.tag.attributes)
    write(writer, node.children)
    writer.close(node.tag.tagName)
  }
}

const generateTextString = (writer, node) => {
  writer.text(node.value)
}

const toStrings = {
  element: generateElementString,
  text: generateTextString,
  forceWrite: () => {}
}
