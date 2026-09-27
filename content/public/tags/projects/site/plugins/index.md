---
title: "#plugins"
---
`#projects/site/plugins` collects the `cgc-*` plugins this site is built with. Each is a [Quartz 5](https://quartz.jzhao.xyz/) plugin written for other sites to install too, and each page below is that plugin's README, published as a note. The rest of the site's own work is under [[/tags/projects/site/index|#site]].

Most of them share things with each other. The diagram shows how every package in the site's `quartz-v5/` folder depends on the others. Each plugin is a box, each library a rounded box, and each site plugin a hexagon:

- a **solid arrow** runs from a plugin to a plugin it declares as a dependency: an engine, such as `cgc-tags`, whose published data it reads, or `cgc-styles`, which gives its styles their place in the cascade;
- a **dotted arrow** runs from a package to one of the libraries it builds with, such as `tags-core`. A library is a plain npm package that a plugin inlines or runs when it builds, so it is never a plugin of its own;
- the **site plugins** carry this site's own look and layout, and are not meant for other sites.

Click a plugin to read its note.

%% plugin-dag: start. Generated from the packages' manifests by `pnpm nx run site-v5:plugin-dag`: don't edit by hand. %%

```mermaid
flowchart LR
  plugin_cgc_annotator["cgc-annotator"]
  plugin_cgc_backlinks["cgc-backlinks"]
  plugin_cgc_email_subscribe["cgc-email-subscribe"]
  plugin_cgc_mdx["cgc-mdx"]
  plugin_cgc_og_image["cgc-og-image"]
  plugin_cgc_page_source["cgc-page-source"]
  plugin_cgc_post_listing["cgc-post-listing"]
  plugin_cgc_posthog["cgc-posthog"]
  plugin_cgc_seo["cgc-seo"]
  plugin_cgc_social["cgc-social"]
  plugin_cgc_styles["cgc-styles"]
  plugin_cgc_tag_explorer["cgc-tag-explorer"]
  plugin_cgc_tag_list["cgc-tag-list"]
  plugin_cgc_tag_page["cgc-tag-page"]
  plugin_cgc_tags["cgc-tags"]
  plugin_quartz_graph["quartz-graph"]
  library_css_check(["css-check"])
  library_declarations(["declarations"])
  library_icons(["icons"])
  library_island_runtime(["island-runtime"])
  library_pipeline(["pipeline"])
  library_tags_core(["tags-core"])
  library_widgets(["widgets"])
  subgraph site_plugins["Site plugins"]
    site_plugin_site_components{{"site-components"}}
    site_plugin_site_styles{{"site-styles"}}
  end
  plugin_cgc_annotator --> plugin_cgc_styles
  plugin_cgc_backlinks --> plugin_cgc_styles
  plugin_cgc_email_subscribe --> plugin_cgc_styles
  plugin_cgc_page_source --> plugin_cgc_styles
  plugin_cgc_post_listing --> plugin_cgc_styles
  plugin_cgc_post_listing --> plugin_cgc_tags
  plugin_cgc_social --> plugin_cgc_styles
  plugin_cgc_tag_explorer --> plugin_cgc_styles
  plugin_cgc_tag_explorer --> plugin_cgc_tags
  plugin_cgc_tag_list --> plugin_cgc_styles
  plugin_cgc_tag_list --> plugin_cgc_tags
  plugin_cgc_tags --> plugin_cgc_styles
  plugin_quartz_graph --> plugin_cgc_styles
  plugin_quartz_graph --> plugin_cgc_tags
  plugin_cgc_annotator -.-> library_css_check
  plugin_cgc_annotator -.-> library_island_runtime
  plugin_cgc_annotator -.-> library_pipeline
  plugin_cgc_backlinks -.-> library_css_check
  plugin_cgc_backlinks -.-> library_icons
  plugin_cgc_backlinks -.-> library_tags_core
  plugin_cgc_email_subscribe -.-> library_css_check
  plugin_cgc_mdx -.-> library_island_runtime
  plugin_cgc_mdx -.-> library_pipeline
  plugin_cgc_page_source -.-> library_css_check
  plugin_cgc_post_listing -.-> library_css_check
  plugin_cgc_post_listing -.-> library_icons
  plugin_cgc_post_listing -.-> library_tags_core
  plugin_cgc_seo -.-> library_tags_core
  plugin_cgc_social -.-> library_css_check
  plugin_cgc_social -.-> library_tags_core
  plugin_cgc_social -.-> library_widgets
  plugin_cgc_tag_explorer -.-> library_css_check
  plugin_cgc_tag_explorer -.-> library_icons
  plugin_cgc_tag_explorer -.-> library_tags_core
  plugin_cgc_tag_list -.-> library_css_check
  plugin_cgc_tag_list -.-> library_icons
  plugin_cgc_tag_list -.-> library_tags_core
  plugin_cgc_tags -.-> library_tags_core
  plugin_quartz_graph -.-> library_css_check
  plugin_quartz_graph -.-> library_declarations
  plugin_quartz_graph -.-> library_icons
  plugin_quartz_graph -.-> library_tags_core
  library_tags_core -.-> library_css_check
  library_widgets -.-> library_css_check
  library_widgets -.-> library_icons
  click plugin_cgc_annotator "/plugins/cgc-annotator"
  click plugin_cgc_backlinks "/plugins/cgc-backlinks"
  click plugin_cgc_email_subscribe "/plugins/cgc-email-subscribe"
  click plugin_cgc_mdx "/plugins/cgc-mdx"
  click plugin_cgc_og_image "/plugins/cgc-og-image"
  click plugin_cgc_page_source "/plugins/cgc-page-source"
  click plugin_cgc_post_listing "/plugins/cgc-post-listing"
  click plugin_cgc_posthog "/plugins/cgc-posthog"
  click plugin_cgc_seo "/plugins/cgc-seo"
  click plugin_cgc_social "/plugins/cgc-social"
  click plugin_cgc_styles "/plugins/cgc-styles"
  click plugin_cgc_tag_explorer "/plugins/cgc-tag-explorer"
  click plugin_cgc_tag_list "/plugins/cgc-tag-list"
  click plugin_cgc_tag_page "/plugins/cgc-tag-page"
  click plugin_cgc_tags "/plugins/cgc-tags"
  click plugin_quartz_graph "/plugins/quartz-graph"
```

%% plugin-dag: end %%
