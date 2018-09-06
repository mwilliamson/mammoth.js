.PHONY: test mammoth.browser.js npm-install

test:
	npm test

setup: npm-install mammoth.browser.min.js

npm-install:
	npm install

mammoth.browser.js:
	node_modules/.bin/browserify lib/index.js -t babelify --standalone mammoth -p browserify-prepend-licenses > $@

mammoth.browser.min.js: mammoth.browser.js
	node_modules/.bin/uglifyjs mammoth.browser.js -c > $@
	cp mammoth.browser.min.js ../capecon-web/public_html/wp-content/plugins/pragmatic-docx-gutenberg/assets/
