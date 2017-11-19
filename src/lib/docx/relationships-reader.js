exports.readRelationships = readRelationships;


function readRelationships(element) {
    var relationships = {};
    element.children.forEach(function(child) {
        if (child.name === "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship") {
            relationships[child.attributes.Id] = {
                target: child.attributes.Target
            };
        }
    });
    return relationships;
}
