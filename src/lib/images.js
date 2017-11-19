import _ from 'underscore'

import * as Html from './html/index'

export const imgElement = func => (element, messages) =>
  Promise.resolve(func(element))
    .then(result => {
      const attributes = _.clone(result)
      if (element.altText) attributes.alt = element.altText
      return [Html.freshElement('img', attributes)]
    })

// Undocumented, but retained for backwards-compatibility with 0.3.x
export { imgElement as inline }

export const dataUri = imgElement(element =>
  element.read('base64')
    .then(imageBuffer => ({
      src: 'data:' + element.contentType + ';base64,' + imageBuffer
    }))
)
