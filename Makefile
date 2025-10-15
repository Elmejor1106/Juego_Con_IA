install: 
	npm install

build:
	npm run build

clean:
	rm -rf dist node_modules

start:
	npm start

.DEFAULT_GOAL := build
	