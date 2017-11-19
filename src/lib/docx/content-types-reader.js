const fallbackContentTypes = {
  'png': 'png',
  'gif': 'gif',
  'jpeg': 'jpeg',
  'jpg': 'jpeg',
  'tif': 'tiff',
  'tiff': 'tiff',
  'bmp': 'bmp'
}

export default element => {
  const extensionDefaults = {}
  const overrides = {}

  element.children.forEach(child => {
    if (child.name === 'content-types:Default') extensionDefaults[child.attributes.Extension] = child.attributes.ContentType
    if (child.name === 'content-types:Override') {
      let name = child.attributes.PartName
      if (name.charAt(0) === '/') {
        name = name.substring(1)
      }
      overrides[name] = child.attributes.ContentType
    }
  })
  return contentTypes(overrides, extensionDefaults)
}

const contentTypes = (overrides, extensionDefaults) => ({
  findContentType: path => {
    const overrideContentType = overrides[path]
    if (overrideContentType) return overrideContentType
    else {
      const pathParts = path.split('.')
      const extension = pathParts[pathParts.length - 1]
      if (extensionDefaults.hasOwnProperty(extension)) return extensionDefaults[extension]
      else {
        const fallback = fallbackContentTypes[extension.toLowerCase()]
        if (fallback) return 'image/' + fallback
        else return null
      }
    }
  }
})

export const defaultContentTypes = contentTypes({}, {})
