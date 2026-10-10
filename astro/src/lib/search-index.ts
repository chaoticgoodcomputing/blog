// Where the search index is published, from the site's root: the integration writes it there
// (src/integrations/search.ts), and the search box imports Pagefind's script from it
// (src/components/Search.astro). A module of its own, with no imports, so that the search box's
// client script takes this and nothing of the notes query.
export const SEARCH_INDEX = "pagefind"
