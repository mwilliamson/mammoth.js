var mammoth = require('./lib/index');
var markdownWriter = require('./lib/writers/markdown-writer').writer;

// 直接使用writer函数来生成Markdown
var writer = markdownWriter();

// 生成表格
writer.open('p');
writer.text('Above');
writer.close('p');

writer.open('table');
writer.open('thead');
writer.open('tr');
writer.open('th');
writer.text('Top left');
writer.close('th');
writer.open('th');
writer.text('Top right');
writer.close('th');
writer.close('tr');
writer.close('thead');
writer.open('tbody');
writer.open('tr');
writer.open('td');
writer.text('Bottom left');
writer.close('td');
writer.open('td');
writer.text('Bottom right');
writer.close('td');
writer.close('tr');
writer.close('tbody');
writer.close('table');

writer.open('p');
writer.text('Below');
writer.close('p');

var markdown = writer.asString();
console.log('Generated Markdown:', markdown);

// 验证输出是否符合期望
var expected = `Above


| Top left | Top right | 
| ----------|----------|
| Bottom left | Bottom right | 


Below
`;

if (markdown.trim() === expected.trim()) {
  console.log('✓ Table conversion matches expected format!');
} else {
  console.log('✗ Table conversion does not match expected format.');
  console.log('Expected:');
  console.log(expected);
  console.log('Actual:');
  console.log(markdown);
}