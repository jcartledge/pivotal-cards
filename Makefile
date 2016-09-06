BIN = ./node_modules/.bin
SRC = ./src
DIST = ./dist
JS_DEST = $(DIST)/pivotal-cards.js
CSS_DEST = $(DIST)/pivotal-cards.css

build: $(JS_DEST) $(CSS_DEST)

phony: clean clean-css clean-js watch watch-css watch-js serve dev

clean: clean-css clean-js

clean-css:
	rm -rf $(CSS_DEST)

clean-js:
	rm -rf $(JS_DEST)

watch:
	$(BIN)/concurrently --kill-others 'make watch-css' 'make watch-js'

watch-css:
	$(BIN)/watch 'make clean-css && make $(CSS_DEST)'  $(SRC)/scss

watch-js:
	$(BIN)/watch 'make clean-js && make $(JS_DEST)'  $(SRC)/js

serve:
	$(BIN)/ws --https -c -d $(DIST)

dev:
	$(BIN)/concurrently --kill-others 'make watch' 'make serve'
css: $(DIST)

$(DIST):
	mkdir -p $(DIST)

$(JS_DEST): $(DIST)
	$(BIN)/browserify $(SRC)/js/pivotal-cards.js -t [ babelify --presets [ es2015 ] ] | $(BIN)/uglifyjs > $(JS_DEST)

$(CSS_DEST): $(DIST)
	$(BIN)/node-sass --include-path $(SRC)/scss $(SRC)/scss/pivotal-cards.scss|$(BIN)/postcss --use autoprefixer -b 'last 2 versions'|$(BIN)/postcss --use cssnano > $(CSS_DEST)
