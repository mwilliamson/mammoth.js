.PHONY: test mammoth.browser.js npm-install

test:
	npm test

setup: npm-install mammoth.browser.min.js

npm-install:
	npm install
	