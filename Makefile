SHELL = /bin/bash -o pipefail
BIN = ./node_modules/.bin
SRC = ./src
JS_SRC_DIR = $(SRC)/js
JS_SRC = $(JS_SRC_DIR)/pivotal-cards.js
CSS_SRC_DIR = $(SRC)/scss
CSS_SRC = $(CSS_SRC_DIR)/pivotal-cards.scss
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
	$(BIN)/concurrently --raw --kill-others 'make watch-css' 'make watch-js'

watch-css:
	$(BIN)/watch 'make clean-css && make $(CSS_DEST)'  $(CSS_SRC_DIR)

watch-js:
	$(BIN)/watch 'make clean-js && make $(JS_DEST)'  $(JS_SRC_DIR)

serve:
	$(BIN)/ws --https -c -d $(DIST)

dev:
	$(BIN)/concurrently --raw --kill-others 'make watch' 'make serve'
css: $(DIST)

$(DIST):
	mkdir -p $@

$(JS_DEST): $(JS_SRC) $(DIST)
	$(BIN)/browserify $< -t [ babelify --presets [ es2015 ] ] | $(BIN)/uglifyjs > $@ && $(BIN)/chalk green "JS ✔ "

$(CSS_DEST): $(CSS_SRC) $(DIST)
	$(BIN)/node-sass --include-path $(CSS_SRC_DIR) $< | $(BIN)/postcss --use autoprefixer -b 'last 2 versions' | $(BIN)/postcss --use cssnano > $@ && $(BIN)/chalk green "CSS ✔ "
