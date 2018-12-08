exports.readNumberingXml = readNumberingXml;
exports.Numbering = Numbering;
exports.defaultNumbering = new Numbering({});

function Numbering(nums, styleIdMap) {
    return {
        findLevel: function(numId, level, styleId) {
            var num = (nums[numId] && nums[numId][level]) || (styleIdMap && styleIdMap[styleId]);
            if (num) {
                return num;
            } else {
                return null;
            }
        }
    };
}

function readNumberingXml(root) {
    var abstractNums = readAbstractNums(root);
    var nums = readNums(root, abstractNums);
    var styleIdMap = createStyleIdMap(root, abstractNums);
    return new Numbering(nums, styleIdMap);
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
        var lvlText = levelElement.firstOrEmpty("w:lvlText").attributes["w:val"];
        var pStyle = levelElement.firstOrEmpty("w:pStyle").attributes["w:val"];
        levels[levelIndex] = {
            isOrdered: numFmt !== "bullet",
            level: levelIndex,
            numFmt: numFmt,
            lvlText: lvlText,
            pStyle: pStyle
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

function createStyleIdMap(root, abstractNums) {
    var map = {};
    Object.keys(abstractNums).forEach(function(numKey) {
        Object.keys(abstractNums[numKey]).forEach(function(k) {
            if (abstractNums[numKey][k].pStyle) {
                map[abstractNums[numKey][k].pStyle] = abstractNums[numKey][k];
            }
        });
    });
    return map;
}
