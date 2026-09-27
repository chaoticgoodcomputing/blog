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
  plugin_quartz_annotator["quartz-annotator"]
  plugin_quartz_backlinks["quartz-backlinks"]
  plugin_quartz_email_subscribe["quartz-email-subscribe"]
  plugin_quartz_graph["quartz-graph"]
  plugin_quartz_mdx["quartz-mdx"]
  plugin_quartz_og_image["quartz-og-image"]
  plugin_quartz_page_source["quartz-page-source"]
  plugin_quartz_post_listing["quartz-post-listing"]
  plugin_quartz_posthog["quartz-posthog"]
  plugin_quartz_seo["quartz-seo"]
  plugin_quartz_social["quartz-social"]
  plugin_quartz_styles["quartz-styles"]
  plugin_quartz_tag_explorer["quartz-tag-explorer"]
  plugin_quartz_tag_list["quartz-tag-list"]
  plugin_quartz_tag_page["quartz-tag-page"]
  plugin_quartz_tags["quartz-tags"]
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
  plugin_quartz_annotator --> plugin_quartz_styles
  plugin_quartz_backlinks --> plugin_quartz_styles
  plugin_quartz_email_subscribe --> plugin_quartz_styles
  plugin_quartz_graph --> plugin_quartz_styles
  plugin_quartz_graph --> plugin_quartz_tags
  plugin_quartz_page_source --> plugin_quartz_styles
  plugin_quartz_post_listing --> plugin_quartz_styles
  plugin_quartz_post_listing --> plugin_quartz_tags
  plugin_quartz_social --> plugin_quartz_styles
  plugin_quartz_tag_explorer --> plugin_quartz_styles
  plugin_quartz_tag_explorer --> plugin_quartz_tags
  plugin_quartz_tag_list --> plugin_quartz_styles
  plugin_quartz_tag_list --> plugin_quartz_tags
  plugin_quartz_tags --> plugin_quartz_styles
  plugin_quartz_annotator -.-> library_css_check
  plugin_quartz_annotator -.-> library_declarations
  plugin_quartz_annotator -.-> library_island_runtime
  plugin_quartz_annotator -.-> library_pipeline
  plugin_quartz_backlinks -.-> library_css_check
  plugin_quartz_backlinks -.-> library_declarations
  plugin_quartz_backlinks -.-> library_icons
  plugin_quartz_backlinks -.-> library_tags_core
  plugin_quartz_email_subscribe -.-> library_css_check
  plugin_quartz_email_subscribe -.-> library_declarations
  plugin_quartz_graph -.-> library_css_check
  plugin_quartz_graph -.-> library_declarations
  plugin_quartz_graph -.-> library_icons
  plugin_quartz_graph -.-> library_tags_core
  plugin_quartz_mdx -.-> library_declarations
  plugin_quartz_mdx -.-> library_island_runtime
  plugin_quartz_mdx -.-> library_pipeline
  plugin_quartz_og_image -.-> library_declarations
  plugin_quartz_page_source -.-> library_css_check
  plugin_quartz_page_source -.-> library_declarations
  plugin_quartz_post_listing -.-> library_css_check
  plugin_quartz_post_listing -.-> library_declarations
  plugin_quartz_post_listing -.-> library_icons
  plugin_quartz_post_listing -.-> library_tags_core
  plugin_quartz_posthog -.-> library_declarations
  plugin_quartz_seo -.-> library_declarations
  plugin_quartz_seo -.-> library_tags_core
  plugin_quartz_social -.-> library_css_check
  plugin_quartz_social -.-> library_declarations
  plugin_quartz_social -.-> library_tags_core
  plugin_quartz_social -.-> library_widgets
  plugin_quartz_styles -.-> library_declarations
  plugin_quartz_tag_explorer -.-> library_css_check
  plugin_quartz_tag_explorer -.-> library_declarations
  plugin_quartz_tag_explorer -.-> library_icons
  plugin_quartz_tag_explorer -.-> library_tags_core
  plugin_quartz_tag_list -.-> library_css_check
  plugin_quartz_tag_list -.-> library_declarations
  plugin_quartz_tag_list -.-> library_icons
  plugin_quartz_tag_list -.-> library_tags_core
  plugin_quartz_tag_page -.-> library_declarations
  plugin_quartz_tags -.-> library_declarations
  plugin_quartz_tags -.-> library_tags_core
  library_tags_core -.-> library_css_check
  library_widgets -.-> library_css_check
  library_widgets -.-> library_icons
  click plugin_quartz_annotator "/plugins/quartz-annotator"
  click plugin_quartz_backlinks "/plugins/quartz-backlinks"
  click plugin_quartz_email_subscribe "/plugins/quartz-email-subscribe"
  click plugin_quartz_graph "/plugins/quartz-graph"
  click plugin_quartz_mdx "/plugins/quartz-mdx"
  click plugin_quartz_og_image "/plugins/quartz-og-image"
  click plugin_quartz_page_source "/plugins/quartz-page-source"
  click plugin_quartz_post_listing "/plugins/quartz-post-listing"
  click plugin_quartz_posthog "/plugins/quartz-posthog"
  click plugin_quartz_seo "/plugins/quartz-seo"
  click plugin_quartz_social "/plugins/quartz-social"
  click plugin_quartz_styles "/plugins/quartz-styles"
  click plugin_quartz_tag_explorer "/plugins/quartz-tag-explorer"
  click plugin_quartz_tag_list "/plugins/quartz-tag-list"
  click plugin_quartz_tag_page "/plugins/quartz-tag-page"
  click plugin_quartz_tags "/plugins/quartz-tags"
```

%% plugin-dag: end %%
