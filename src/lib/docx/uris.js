export const uriToZipEntryName = (base, uri) => {
  if (uri.charAt(0) === '/') return uri.substr(1)
  // In general, we should check first and second for trailing and leading slashes,
  // but in our specific case this seems to be sufficient
  else return base + '/' + uri
}

export const replaceFragment = (uri, fragment) => {
  const hashIndex = uri.indexOf('#')
  if (hashIndex !== -1) uri = uri.substring(0, hashIndex)
  return uri + '#' + fragment
}
