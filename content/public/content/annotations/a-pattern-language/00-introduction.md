---
title: "APL: Pattern 0; Introduction"
date: 2026-02-05
tags:
  - writing/annotations/a-pattern-language
  - projects/games/the-neighborhood
  - economics/policy
description: Can graphs be libertarian? Authoritarian? Annotations for the introductory portion of the 1977 book A Pattern Language.
---
← [[/content/annotations/a-pattern-language//content/notes/pattern-languages-of-the-neighborhood|Pattern Languages & The Neighborhood]] | [[/content/annotations/a-pattern-language/01-independent-regions|Independent Regions]] →

> [!QUOTE]
> The elements of this language are entities called *patterns.* Each pattern describes a problem which occurs over and over again in our environment, and then describes the core of the solution to that problem, in such a way that you can still use this solution a million times over, without ever doing it the same way twice.
> 
> — [[/tags/writing/annotations/a-pattern-language/index|A Pattern Language]] 

## Notes

### A Pattern Language

- I doubt that there's going to be *too* much new material in this set, versus in the [[/content/notes/pattern-languages-of-the-neighborhood|pre-read post]], but I do want to dig into the specifics here rather than focusing on the general project.
- "It is possible to read [*A Pattern Language* and The *Timeless Way of Building*] separately ... [b]ut to gain the insight which we have tried to communicate in them, it is essential that you read them both"
    - I do have *The Timeless Way* stashed away in a cart somewhere. I don't remember how it's laid out (e.g. if it runs parallel to this), but since this has already jacked up my site graph, I'll figure out after these notes are done whether or not to dedicate a whole project like this one to the first novel.
- "Each pattern describes a problem which occurs over and over again in our environment, and then describes the core of the solution to that problem ..."
    - This really does read off like the object-oriented equivalent, even in the style.
- I may want to incorporate the asterisk system they use in the text, where:
  - **2 stars** represents something they consider a "true invariant" — a fully generalized solution to the problem it describes. E.g., it's the only solution to that problem.
  - **1 star** represents something they feel comes close to invariant, but has corner cases.
  - **No stars** represents cases where they feel the solution is good, but not exclusive, for solving the problem.

Yeah, I'll probably find some way to incorporate the variability metric — but it may take me awhile. Even between now and the pre-read, I completely shed the `sub` and `super` tags (although that was more because of the standard of leaf tags being fully descriptive, in order to be used in listings of these posts for cases like [my personal README](https://github.com/Spelkington), and to make sure that the [OG images of this site can bear load without being cluttered](https://bsky.app/profile/chaoticgood.computer))). We'll see how far that goes — it's hard to distinguish valid collection of data, versus straight-up hoarding.

### Summary of the Language

This one is largely a table of contents — although it is important to note how much they stress a key concept: the ordering of the patterns matters. This makes a bit more sense in the section "Choosing a Language for Your Project", but the idea is that you select a subset of patterns to adhere to depending on your goal. Paraphrasing the authors, they state that, even though not every project will use every pattern, the granularity *is* sorted — that is to say, they prescribe filtering, but not reordering, the patterns as you define what you intend to use for a project.

One thing did catch my eye, in the Towns precursor description of the first 7 patterns ([[/content/annotations/a-pattern-language/01-independent-regions|01-independent-regions]] to [[/content/annotations/a-pattern-language/07-the-countryside|07-the-countryside]]):

> [!QUOTE]
> We begin with that part of the language which defines a town or community. These patterns can never be "designed" or "built" in one fell swoop—but patient piecemeal growth, designed in such a way that every individual act is always helping to create or generate these larger global patterns, will, slowly and surely, over the years, make a community that has these global patterns in it.
> 
> — *[A Pattern Language](https://www.patternlanguage.com/)

Well — that really puts a damper on my early drafts for [[/tags/projects/games/the-neighborhood/index|The Neighborhood]]. If it's possible for algorithms themselves to lie on a scale of "libertarian" to "authoritarian" — which, now that I think about it... *maybe?* — then my early drafts of the generation are certainly on the authoritarian scale. To put it in these terms:

> [!NOTE]
> An authoritarian graph generation approach goes *from* highest-level topology (global graph), *to* lowest level topology (nodes). A libertarian graph generation approach goes *from* nodes, *to* global-level generation.

An example of this: in the graph of my site, the tag nodes are a primarily *authoritarian* structure — I, ahead of time, decided how my tags would be laid out. However, the *post nodes* are libertarian — I don't particularly know, ahead of time, what tags a post will have (that typically comes after the writing is done. Not because I'm a libertarian soul, but because... I just forget to do them until the end).

An example of this: initially, when I was using (largely) the graph rendering logic of the [vanilla Quartz site](https://quartz.jzhao.xyz/), my graph was far more... blobby. Any global organization was very much an afterthought. I was primarily concerned with simply churning out posts and hyperlinking where appropriate, and wasn't nearly as concerned with how the global graph looked. I'd call this a *libertarian*, *node-first* approach:

![[/assets/Pasted image 20260205201309.png]]

Since then — largely based on feedback from friends and family who grow less patient with "Can I show you my graph?" by the day — I cleaned up the graph (specifically the global, default view) by doing two things:

- Any tag that is at the top of the tagging hierarchy ([[/tags/engineering/index|engineering]], [[/tags/economics/index|economics]]) "stick" to an outer shell, and a gravitational force pulls all other nodes (subtags and nodes) into the center. This forms something closer to a [ternary plot](https://en.wikipedia.org/wiki/Ternary_plot), with the strength of the connections pulling posts closer to the edge that most closely defines them
- Filtering to only posts in the last year (by default) in order to effectively "destroy" stale nodes over time. This recurses upward — if any tag (or its subtags) don't have direct child post for a long enough period of time, it filters out ([[/tags/projects/games/roblox/index|roblox]], [[/tags/projects/undergrad/index|college]])

![[/assets/Pasted image 20260205202218.png]]

This, then, is a far more *authoritarian, tag-first approach*. A global superstructure, defined by the tagging system, is used to give a skeleton to the graph. Then, the post nodes fit into that skeleton to flesh it out.

(Ironically, the authoritarian version of the graph kinda resembles a [Satanist pentagram](https://en.wikipedia.org/wiki/Satanism), a symbol of the highest-order libertarianism you could possibly think of.)

#### Back to The Neighborhood

Pulling this out of the realm of graph theory and into the real world — specifically, in the type of thinking important for The Neighborhood — let's consider zoning laws.

![[/assets/Pasted image 20260205202732.png]]

Above, we can see [the online zoning map for Salt Lake City](https://slcgov.maps.arcgis.com/apps/instant/sidebar/index.html?appid=fa801b661ce14222a6c1f7d42ce21636&center=-111.8869;40.7595&level=15&hiddenLayers=Groundwater_Source_Protection_Overlay_5010). If we think of each building (or plot) as a node on the graph, the highlighted areas — effectively, collection of nodes — as subgraphs of the global Salt Lake City graph. Nodes within a highlighted subgraph *must be* of the type that the subgraph area dictates. You want to start a business node? You'll need to jump through some hoops to put it in a yellow residential subgraph.

Remember — each of these zones also represent *laws*. You can literally see *the boundaries of a law* by the boundaries the law *defines*. Some get to be as small as *parts* of a block. You can see a lot of those in historic neighborhoods, where business developments wrap around protected properties.

![[/assets/Pasted image 20260205203634.png]]

This is almost precisely the same concept as the tag nodes of the site graph. Ahead of development, I used an overarching authority to pre-create the tags, effectively putting a zoning policy in place that "on this site, *these* post categories are allowed". Of course, this dictate is the authoritarian equivalent of a fart in the wind — I can, and will, overrule the current tags if (when) they inconvenience me. Nonetheless, they *are* still an authoritative structure — I can't build a node in a zone of any color that doesn't exist, yet, unless I override the rules (overturn the laws) of current zones.

All things considered, Salt Lake City is an odd case. We're a fairly young city, established when the concept of a zoning law already existed. A fun SLC fact: before the site for the city was even *discovered*, Joseph Smith had put together [plans for a divinely-planned city](https://ensignpeakfoundation.org/wp-content/uploads/2013/08/Joseph-Smith-Urban-Planner.pdf), even going as far as to direct the exact measurements of city blocks: [precisely 660 feet (1/8 mile) on all sides](https://gis.utah.gov/blog/2019-03-11-the-western-grid/).

If you live in an older city, see if your city publishes a zoning map. I bet you'll see *far* more cutouts, alcoves, and islands in your zoning map than we do.

### Choosing a Language for Your Project & The Poetry of the Language

This — like the introduction chapter, itself — has gotten longer than I expected. I'll begin to wind it down, here. This isn't necessarily because these portions aren't important — they absolutely are — but because much of my thoughts on these portions will be covered in the [[/content/notes/ants-in-the-neighborhood.mdx|Ants in the Neighborhood]] post, where we apply Markov Chains to the graphical structure of these patterns to determine which ones are more "central".

(Now that I think about it, *that* may be the good reason to include the star rankings. I'd expect that the canon level of each pattern decided by the authors would come back to, in some ways, the Markov ranking of the nodes. I'll be interested to see how that shakes out.)

I'll end, then, with a minor [[/tags/engineering/index|engineering-flavored adaptation]] of the text:

> [!QUOTE]
> You may think of this process of compressing patterns, as a way to make the cheapest possible [solution] which has the necessary patterns in it. It is, also, the only way of using a pattern language to make [solutions] that are poems.
> 
> — *[A Pattern Language](https://www.patternlanguage.com/)*
