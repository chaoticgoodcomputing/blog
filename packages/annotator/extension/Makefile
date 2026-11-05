# The settings to build with (settings/). The fork's own are the *-local ones.
SETTINGS_FILE := settings/firefox-local.json

ROLLUP := node_modules/.bin/rollup
ESLINT := node_modules/.bin/eslint
MUSTACHE := node_modules/.bin/mustache
PRETTIER := node node_modules/.bin/prettier

.PHONY: default
default: help

.PHONY: help
help:
	@echo "make help              Show this help message"
	@echo "make dev               Watch for changes and build the browser-extension"
	@echo "make build             Create a build of the browser-extension"
	@echo "make lint              Run the code linter(s) and print any warnings"
	@echo "make checkformatting   Check code formatting"
	@echo "make format            Automatically format code"
	@echo "make test              Run the unit tests once"
	@echo "make sure              Make sure that the formatter, linter, tests, etc all pass"
	@echo "make clean             Delete development artefacts (cached files, "
	@echo "                       dependencies, etc)"

.PHONY: build
build: node_modules/.uptodate extension

.PHONY: dev
dev: node_modules/.uptodate
	pnpm exec gulp watch

.PHONY: clean
clean:
	rm -f node_modules/.uptodate
	rm -rf build/*
	rm -rf dist/*

################################################################################

# The `build/settings.json` target is always rebuilt in case the value of
# `SETTINGS_FILE` changed, but the output file is only updated if needed.
.PHONY: force
build/settings.json: force
	tools/settings.js $(SETTINGS_FILE) > $@.tmp
	rsync --checksum $@.tmp $@
	rm $@.tmp

EXTENSION_SRC := pdfjs help images options

.PHONY: extension
extension: build/extension.bundle.js
extension: build/manifest.json
extension: build/client/build
extension: build/client/app.html
extension: build/client/sidebar-api-relay.js
extension: build/client/notebook.html
extension: build/client/profile.html
extension: build/unload-client.js
extension: build/LICENSE
extension: build/NOTICE.md
extension: build/licenses
extension: build/pdfjs-init.js
extension: $(addprefix build/,$(EXTENSION_SRC))

build/extension.bundle.js: src/background/*.ts rollup.config.js build/settings.json
	$(ROLLUP) -c rollup.config.js
build/manifest.json: src/manifest.json.mustache build/settings.json
	$(MUSTACHE) build/settings.json $< > $@
build/client/build: node_modules/hypothesis/build/manifest.json
	@mkdir -p $@
	cp -R node_modules/hypothesis/build/* $@
	@# The client's license, which its BSD 2-Clause terms ask a build to carry (NOTICE.md).
	cp node_modules/hypothesis/LICENSE $(dir $@)LICENSE
	@# Replace boot template with extension-specific URLs.
	node tools/render-boot-template.js $@/boot-template.js $@/boot.js
	rm $@/boot-template.js
	@# We can't leave the client manifest in the build or the Chrome Web Store
	@# will complain.
	rm $@/manifest.json
build/client/app.html: src/sidebar-app.html.mustache build/client build/settings.json
	tools/template-context-app.js build/settings.json | $(MUSTACHE) - $< >$@
build/client/sidebar-api-relay.js: src/sidebar-api-relay.js build/client/build
	cp $< $@
build/client/notebook.html: build/client/app.html
	cp $< $@
build/client/profile.html: build/client/app.html
	cp $< $@
# The extension's own license, which its BSD 2-Clause terms ask a build to carry, and where it came from.
build/LICENSE: LICENSE
	cp $< $@
build/NOTICE.md: NOTICE.md
	cp $< $@
# The notices of the packages the bundles hold (licenses/): fails if a bundle holds one without.
.PHONY: build/licenses
build/licenses: build/extension.bundle.js build/client/build
	node tools/third-party.js check
build/unload-client.js: src/unload-client.js
	cp $< $@
build/pdfjs-%.js: src/pdfjs-%.js
	cp $< $@
build/pdfjs: src/vendor/pdfjs
	cp -R $< $@
build/%: src/%
	@mkdir -p $@
	cp -R $</* $@

dist/%.zip dist/%.xpi: extension
	cd build && find . -not -path '*/\.*' -type f | zip -q -@ $(abspath $@)

.PHONY: lint
lint: node_modules/.uptodate build/settings.json
	$(ESLINT) .
	pnpm run typecheck

.PHONY: checkformatting
checkformatting: node_modules/.uptodate
	$(PRETTIER) --check '**/*.{ts,js,cjs}'

.PHONY: format
format: node_modules/.uptodate
	$(PRETTIER) --list-different --write '**/*.{ts,js,cjs}'

.PHONY: test
test: node_modules/.uptodate
	pnpm exec gulp test

.PHONY: sure
sure: checkformatting lint test

# Dependencies come from the workspace's `pnpm install`, at the repository's root.
node_modules/.uptodate: package.json
	@test -d node_modules || (echo "Run pnpm install at the repository's root first." && exit 1)
	@touch $@
