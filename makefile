.PHONY: test mammoth.browser.js npm-install

test:
	npm test

setup: npm-install mammoth.browser.min.js

npm-install:
	npm install

mammoth.browser.js:
	-rm $@ -f
	node_modules/.bin/node-license-sniffer . --recurse --js-comment >> $@
	node_modules/.bin/browserify lib/index.js --standalone mammoth >> $@

mammoth.browser.min.js: mammoth.browser.js
	node_modules/.bin/uglifyjs mammoth.browser.js -c > $@
