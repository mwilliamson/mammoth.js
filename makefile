.PHONY: test mammoth.browser.js

test:
	npm test

setup: static/bootstrap static/jszip mammoth.browser.min.js
	
static/bootstrap:
	mkdir -p _build/bootstrap
	curl -L https://github.com/twitter/bootstrap/archive/v2.3.1.tar.gz | tar xz --directory _build/bootstrap --strip-components 1
	cd _build/bootstrap; npm install; make bootstrap
	cp -rT _build/bootstrap/bootstrap static/bootstrap

static/jszip:
	mkdir -p _build/jszip
	curl -L https://github.com/Stuk/jszip/archive/v1.0.1.tar.gz | tar xz --directory _build/jszip --strip-components 1
	mkdir -p static/jszip
	cp _build/jszip/*.js static/jszip
	
mammoth.browser.js:
	rm $@ -f
	cat static/jszip/jszip.js >> $@
	cat static/jszip/jszip-deflate.js >> $@
	cat static/jszip/jszip-inflate.js >> $@
	cat static/jszip/jszip-load.js >> $@
	node_modules/.bin/node-license-sniffer . --recurse --js-comment >> $@
	node_modules/.bin/browserify lib/index.js --standalone mammoth >> $@

mammoth.browser.min.js: mammoth.browser.js
	node_modules/.bin/uglifyjs mammoth.browser.js -c > $@
