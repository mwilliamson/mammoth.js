export default element => {
  const relationships = {}
  element.children.forEach(child => {
    if (child.name === '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship') {
      relationships[child.attributes.Id] = {
        target: child.attributes.Target
      }
    }
  })
  return relationships
}
