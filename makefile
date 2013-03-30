.PHONY: test

test:
	node_modules/.bin/mocha tests

setup:
	mkdir -p _build/bootstrap
	curl -L https://github.com/twitter/bootstrap/archive/v2.3.1.tar.gz | tar xz --directory _build/bootstrap --strip-components 1
	cd _build/bootstrap; npm install; make bootstrap
	cp -rT _build/bootstrap/bootstrap static/bootstrap
	
