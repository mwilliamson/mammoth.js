exports.readNumberingXml = readNumberingXml;
exports.Numbering = Numbering;
exports.defaultNumbering = new Numbering({});

function Numbering(nums) {
    return {
        findLevel: function(numId, level) {
            var num = nums[numId];
            if (num) {
                return num[level];
            } else {
                return null;
            }
        }
    };
}

function readNumberingXml(root) {
    var abstractNums = readAbstractNums(root);
    var nums = readNums(root, abstractNums);
    return new Numbering(nums);
}

function readAbstractNums(root) {
    var abstractNums = {};
    root.getElementsByTagName("w:abstractNum").forEach(function(element) {
        var id = element.attributes["w:abstractNumId"];
        abstractNums[id] = readAbstractNum(element);
    });
    return abstractNums;
}

function readAbstractNum(element) {
    var levels = {};
    element.getElementsByTagName("w:lvl").forEach(function(levelElement) {
        var levelIndex = levelElement.attributes["w:ilvl"];
        var numFmt = levelElement.first("w:numFmt").attributes["w:val"];
        levels[levelIndex] = {
            isOrdered: numFmt !== "bullet",
            level: levelIndex
        };
    });
    return levels;
}

function readNums(root, abstractNums) {
    var nums = {};
    root.getElementsByTagName("w:num").forEach(function(element) {
        var id = element.attributes["w:numId"];
        var abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
        nums[id] = abstractNums[abstractNumId];
    });
    return nums;
}
