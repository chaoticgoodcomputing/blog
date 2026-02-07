---
title: "APL: Pattern 2; The Distribution of Towns"
date: 1970-01-02
tags:
  - writing/annotations/a-pattern-language
  - projects/games/the-neighborhood
  - economics/policy
description: How close is too close? How far is too far? *A Pattern Language* annotations related to the statistical, economic, and ecologic concerns in balancing how dense human habitats ought to be.
---
← [[01-independent-regions|Independent Regions]] | [[03-city-country-fingers|City Country Fingers]] →

> [!QUOTE]
> ... consider now the character of settlements within the region: what balance of villages, towns, and cities is in keeping with the independence of the region—[[content/annotations/a-pattern-language/01-independent-regions|01-independent-regions]]?
> 
> — *[[tags/writing/annotations/a-pattern-language/index|A Pattern Language]]*

## Notes

Going into this hoping for a shorter rundown than Independent Regions.

The general topology of the chapter:

1. **Statistical Distribution:**
    1. So, if we abstract away "buildings as nodes" and just think purely about the "nodes" that represent subgraphs of towns and cities, this is talking about the literal statistical distribution of population around an area. That makes sense — it's not unlike the way that posts are the true atoms of this site, with their sizes on the graph determined by connections — effectively which posts "live" in them.
    2. It directly invokes a few areas of other research, some of which I know of, some of which are new:
        1. [George Kingsley Zipf](https://en.wikipedia.org/wiki/Zipf%27s_law), who (with others) established the Zipf Distribution for frequency. I've only ever seen this related to linguistics (and as an attachment to things like file compression), but it makes gut sense that this would apply to population distributions
        2. [Walter Christaller](https://en.wikipedia.org/wiki/Central_place_theory) a German geographer, who established [central place theory](https://en.wikipedia.org/wiki/Central_place_theory), a contribution to the field of [ekistics](https://en.wikipedia.org/wiki/Ekistics), which studies human urbanization. He was... maybe a Nazi? That's a complete nightmare that I don't want to even remotely approach, so in the spirit of "death of an author", let's focus on Central Place Theory absent his direct attachment.
           
        It seems to extend off of [economic geography & location economics](https://en.wikipedia.org/wiki/Economic_geography), which is something that came up a lot in my [[qamo|undergraduate]]. The general idea from location theory is "Given the chance to buy the same good, people will prefer to travel a lower distance". Central place theory seems to focus on situations where there's many goods that people need, and they prefer to be central to the ones they need often (bread) and are willing to travel further for specialized goods. TL;DR, it's the concept that you might travel to your closest grocery store for something generic, but would perhaps travel further to somewhere like a Trader Joe's, which has a selection of more unique goods. On a micro-level, this very much falls into the umbrella of [[tags/economics/strategy/index|economics of strategy]] — if you're a business, where should you locate yourself?
        3. [Herbert Simon](https://en.wikipedia.org/wiki/Herbert_A._Simon) — *zesty!* I know him primarily as one of the inventors of the [linked list](https://www.geeksforgeeks.org/dsa/linked-list-data-structure/), a seminal data structure that every intro Computer Science student learns about. I had no idea that he was related to economics — although I shouldn't be surprised. Part of the reason I chose economics as a field of study is because John von Neumann was responsible for many decisions in early computing architecture, *and* he also co-authored the seminal economics text *[Theory of Games and Economic Behavior](https://en.wikipedia.org/wiki/Theory_of_Games_and_Economic_Behavior)* with Oskar Morgenstern. The concept of expected utility came from that text — the full title is a [von Neumann-Morgenstern utility curve](https://en.wikipedia.org/wiki/Von_Neumann%E2%80%93Morgenstern_utility_theorem)
           
        I'm having a hard time from glancing Simon's specific contributions that *A Pattern Language* may be referring to — not necessarily because they may've been small, but because the guy covered a lot of ground. My closest guess would be something related to a brief mention of land economics and redistribution of rent.
         
        I do want to note, however, that he also contributed to research in industrial organization — precisely the field of work covered by [[content/annotations/evolutions-revolutions|Evolution and Revolution as Organizations Grow]].
    3. They cite that the overview of this work can be found in *[Alternate Explanations of Urban Rank-Size Relationships](https://www.jstor.org/stable/2561542)*, which may be worth a read. It may be easier to find the direct citation to Simon's work through that text.
1. **Economic Distribution:**
    1. This relates to the use of public policy to allow for mutual benefit between urban/suburban/rural areas, ensuring that the draw of people into metropolitan areas for economic reasons doesn't bleed benefits from rural and suburban areas. While the last section did have a distinctly libertarian undertone, it's interesting to see strong public policy and redistribution come into play in this section.
2. **Ecologic Distribution:**
    1. Finally, for the ecological distribution — this one makes the case that a space that becomes too dense runs the risk of demolishing the local ecosystem, which is absolutely a concern — some later patterns like [[content/annotations/a-pattern-language/22-nine-per-cent-parking|22-nine-per-cent-parking]], make the case to alleviate this by reducing the amount of structures that take up the most "wasted" surface area. Additionally, incorporations of organic structures into the manufactured ones — [[content/annotations/a-pattern-language/51-green-streets|51-green-streets]], [[content/annotations/a-pattern-language/172-garden-growing-wild|172-garden-growing-wild]], etc. — do some work in establishing this pattern
    2. As a personal observation — I think that this is what bugs me about Salt Lake City. There is a happy-go-lucky Americana desire for green lawns, even when the environment doesn't support it. We can see this in full view with [the impending loss of The Great Salt Lake](https://www.nytimes.com/2025/05/05/us/great-salt-lake-utah.html?unlocked_article_code=1.KVA.ZVR3.rgfVf23T4aoy&smid=url-share). This isn't just a matter of "awh, I'll miss the lake!" — it's a matter of the arsenic at the bottom of the lake hitting the air once it's no longer trapped by the water. Especially after the devastatingly low snowpack we've gotten this year, I have serious concerns about impending disaster for the area, in no small part because the settlement of the area has done a poor job of adjusting for its natural ecological structure.

## Conclusion

Well, I think I have *more* to read after this section, rather than less. Classic!

Regardless, I am excited — a lot of the overlap here gives a good sign that I'm on the right track into something incredibly interesting. It's nice to see that the overlap between this book and general software design patterns goes even deeper, and I'm excited to have a good excuse to dive back into policy. Economic policy is a wildly difficult thing to do as a hobby (at least to the same extent that software is), and I'm excited to do some follow-up writing.

![[assets/Pasted image 20260207163521.png]]

I'll repeat the mantra — maybe the next set of notes will be shorter!