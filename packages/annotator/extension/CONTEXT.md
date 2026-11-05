# Annotator extension

The browser extension the web's annotations are made with: a hard fork of Hypothesis's browser
extension, which opens Hypothesis's own client on any page or PDF in the browser, and sends what is
made there to a Hypothesis service of its settings' choosing, in place of Hypothesis's servers.
Where the fork came from and the licenses of the work in it are in [NOTICE.md](./NOTICE.md).

Its words are on top of the Annotator's (`../plugin/CONTEXT.md`): **Hypothesis client**,
**Sidebar** and **Annotation record** mean the same here.

## Language

### The fork

**Extension**:
This browser extension: the fork, as it is in this repository.
_Avoid_: the Hypothesis extension (that is upstream's), the add-on (Firefox's word for any)

**Upstream**:
Hypothesis's browser extension, `hypothesis/browser-extension`, which is maintained; the fork is
taken from one of its commits (NOTICE.md), and may take later ones by hand.
_Avoid_: original, parent

### Building

**Settings**:
A build's choice of browser and of service, as one file of `settings/`: the service's addresses
(`apiUrl`, `serviceUrl`), its `authDomain`, and the browser (`browserIsFirefox`,
`browserIsChrome`). A build has one, and keeps it: changing service is building again.
_Avoid_: config, options (upstream's settings page, `src/options/`, is something else)

**Local settings**:
The fork's own settings, `settings/*-local.json`, which name a service on the user's machine,
`http://127.0.0.1:27183/`. Upstream's settings name Hypothesis's servers, or a Hypothesis server
run for its own development.

**Local service**:
The Hypothesis service the local settings name: the Annotator plugin, serving the vault's
annotation notes over HTTP while Obsidian runs (`../plugin/CONTEXT.md`), so that what is made in the
browser is kept in them.
_Avoid_: backend, server (where it is plain which is meant), Obsidian

**Relay**:
The sidebar's requests to the service, made by the background script for it
(`src/sidebar-api-relay.js`, `src/background/api-relay.ts`): a frame inside a public page may not
reach 127.0.0.1 in Firefox, by its Local Network Access.
_Avoid_: proxy, bridge

### Browsers

**Zen**:
The browser the extension is installed in for use: a Firefox, so built with Firefox's settings.
Firefox itself is for automated runs.
