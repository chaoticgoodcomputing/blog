---
title: "APL: Pattern 1; Independent Regions"
date: 2026-02-07
tags:
  - writing/annotations/a-pattern-language
  - projects/games/the-neighborhood
  - economics/policy
description: Home isn't where the heart is — it's a single node on a very, very large graph. Annotations for the "Independent Regions" pattern of *A Pattern Language*.
---
← [[00-introduction|Introduction]] | [[02-the-distribution-of-towns|The Distribution of Towns]] →

> [!QUOTE]
> **Metropolitan regions will not come to balance until each one is small and autonomous enough to be an independent sphere of culture.**
> 
> — *[[tags/writing/annotations/a-pattern-language/index|A Pattern Language]]*

## Notes

This will be a twofer — this chapter will cover both **Independent Regions**, but will also cover the precursor entry for the **Towns** subsection ([[content/annotations/a-pattern-language/01-independent-regions|Independent Regions (01)]] to [[content/annotations/a-pattern-language/94-sleeping-in-public|Sleeping in Public (94)]])

### Towns

A lot of this portion has to do with setting up a lot of what I've been calling superstructures — the way nodes, like buildings, homes, offices, etc. are organized in the larger pattern. It has a particular focus on setting up a hierarchical structure. From the text:

> [!QUOTE]
> - **A.** The region: 8,000,000 people.
> - **B.** The major city: 500,000 people.
> - **C.** Communities and small towns: 5-10,000 people each.
> - **D.** Neighborhood: 500-1000 people each.
> - **E.** House clusters and work communities: 30-50 people each.
> - **F.** Families and work groups: 1-15 people each.
> 
> — *[[tags/writing/annotations/a-pattern-language/index|A Pattern Language]]*

I *loves* me some hard numbers. Setting up this hierarchy, then, I wanted to throw together a quick flowchart to check some of the logic — specifically, some ratios:

![[assets/2667A052-7382-49C4-96F3-AF1B0EDFDE3B_1_201_a.jpeg]]

My goal, here, is to think about these in ratios (A city has X communities) rather than absolute numbers. The numbers towards the bottom of the graph — the smallest collection units — feel right. For example, it feels like it'd make sense for a House Cluster or Work Community to be comprised of anywhere between 2 to 50 Families or Work Groups. Likewise, I feel that it makes sense for a town or metro community to be comprised of 5 to 20 neighborhoods.

Where things get a little bit finicky, in my mind, is the top of the graph. In particular:

1. A region being hard-set at 8,000,000 people
2. A region being comprised of just 1 city
3. A region being comprised of 750-1,500 small towns
4. A city being comprised of 50-100 subcommunities (although, typing this out, I do feel like this is less egregious than I first thought).

To think about this with a real-world backing: this system puts forward that a region is comprised of 500,000 people in a city, and 7,500,000 in rural/suburban communities.

![[public/assets/Pasted image 20260207124302.png]]

(I don't typically condone the use of pie charts, but this particular viz doesn't feel like any hill worth dying on.)

Okay — so, 6.3% in cities, 93.7% in towns in A Pattern Language's hypothetical example. Checking this against one of my examples — Salt Lake City, and Utah — we get populations of:

1. **Salt Lake City:** 218,000 ([est. as of 2024](https://www.census.gov/quickfacts/fact/table/saltlakecitycityutah/PST045224))
2. **Utah:** 3,503,000 ([est. as of 2024](https://www.census.gov/quickfacts/fact/table/UT/PST045224))

I feel this is a good example, because Utah doesn't have a particularly grand metro scene outside of Salt Lake City[^1]. In this case, the Utah region has a split of... 6.2% metro?!

*Well.* It's not often that napkin math on random examples comes in almost exactly the same as the toy scenario. I do wonder how this holds against other U.S. states and territories, but I'll let it lie, for now.

Looking a bit closer, I think the problem with the definitions (and, particularly, of the hard count definitions) comes into view. From Wikipedia's [List of municipalities in Utah](https://en.wikipedia.org/wiki/List_of_municipalities_in_Utah):

| Name             | County     | Type | Population (2023) |
| ---------------- | ---------- | ---- | ----------------- |
| Salt Lake City*  | Salt Lake  | City | 203,888           |
| West Valley City | Salt Lake  | City | 137,955           |
| West Jordan      | Salt Lake  | City | 116,277           |
| Provo*           | Utah       | City | 114,303           |
| St. George*      | Washington | City | 99,184            |
| Orem             | Utah       | City | 97,048            |

Aye, there's the issue — there's a gap between the size of cities and the sizes of towns. If cities are necessarily population centers of ~500,000, and towns max out at ~10,000, there's the whole 10,001-499,999 range unaccounted for. This means making a judgement call of cities versus towns, as two things are in contention:

1. Make Salt Lake City a town, meaning the region of Utah would need to expand to fit a metro area that includes the definition
2. Make other cities Cities, which would constitute more cities in a region than the prescribed 1-per-region ratio.

So — is A Pattern Language... *wrong*?

["All models are wrong, but some are useful"](https://en.wikipedia.org/wiki/All_models_are_wrong), holds as true for the behavioral sciences as the natural ones. "Truth is much too complicated to allow anything but approximations" (John von Neumann, paraphrased)[^2].

While trying to assign hard numbers is always a tricky business, I do think that the overall topology that they've put forward is distinct. I feel it addresses the distinct cultural difference than a metro area and suburban/rural areas in the same region, and still makes its point towards the more atomic portions of the hierarchy: that communities have a natural limit before they stop feeling *like* communities. Structures of different sizes *require* substructures that keep them intact. We see the same thing in other fields — the concept is not unlike the one put forward in [[content/annotations/evolutions-revolutions|Evolution and Revolution as Organizations Grow]].

I would be genuinely interested to, following this year's midterm elections, figure out the apportionments of how many people each seat in the U.S. House of Representatives represents. Does it match — or at least correlate — with any given level within the model hierarchy APL proposes? I'd do it now, but given the current redistricting war being waged ahead of the midterms, trying to figure out where it is (or will be in a year's time) seems like an absolute shitshow.

That aside — I'll get on with the rest of the note. My last couple thoughts on the Towns intro:

> [!QUOTE]
> Another group wanting to build a small communal workshop, in a neighborhood currently zones for residential use only, can argue their case based on [[content/annotations/a-pattern-language/09-scattered-work|Scattered Work]], [[content/annotations/a-pattern-language/156-settled-work|Settled Work]], etc., and possibly get the city or zoning department to change the zoning regulation on this matter, and thereby slowly work toward introducing patterns, one at a time within the current framework of codes and zoning. 
> 
> — *[[tags/writing/annotations/a-pattern-language/index|A Pattern Language]]*

I'm glad that zoning came up in [[content/annotations/a-pattern-language/00-introduction|00-introduction]], as I feel like it will come up far more in future chapters, especially ones where the rubber hits the road.

> [!QUOTE]
> We have worked out a partial version of this process at the Eugene campus of the University of Oregon. That work is described in Volume 3, *The Oregon Experiment*.
> 
> — *[[tags/writing/annotations/a-pattern-language/index|A Pattern Language]]*

I may want to reach out to a couple people I know who are UO alums to see how they think about that campus, versus where they live now. Additionally — it may be worth investigating if the changes made in Volume 3 have persisted. That was, after all, a few decades ago.

### Independent Regions

The starter portion of this is a numbered list, so to reflect that:

1. **"There are natural limits to the size of groups that can govern themselves in a human way"**
    1.  It does mention how "in a population of N persons, there are of the order of N^2 person-to-person links needed to keep channels of communication open". While this *is* true in a dense graph, this is part of the reason hierarchies — like the ones in the last section — become the case. Hierarchy is the definition of a direct democracy vs a democratic republic — if a community subgraph can come to a decision without needing outside connections to nodes in other community subgraphs, we can create a sparse graph structure that allows abstractions via representatives.
Hot take: "We believe the limits are reached when the population of a region reaches some 2 to 10 million". Okay — that does give a stronger range setup for the graph in the last portion. I don't think I disagree with this.
2. **"Unless a region has at least several million people in it, it will not be large enough to have a seat in a world government..."**
    1. Aaaalright — this is the section that talks about a world federation of a thousand states. This is the portion that feels very pie-in-the-sky — but that is to be expected, given that this is *the most abstract pattern* in the grand scheme of things. But hey! I appreciate the hot take. It's not any wishy-washy bullshit: it's a resolution to be evaluated on it's merits.
    2. I have no idea who Lord Weymouth of Warminster, England is, or what weight his word held when he wrote to the new York Times in 1973, but this statement feels entirely cracked out:
        1. **"I am suggesting that in the Europe of the future, we shall see England split down into Kent, Wessex, Mercia, Anglia, and Northumbria, with an independent Scotland, Wales, and Ireland, of course. Other European examples will include Brittany, Bavaria, and Calabria. The national identities of our contemporary Europe will have lost their political significance."**
        2. It has the same vibe as [post-Brexit satire](https://youtu.be/qt8gEvGJe_I?t=366).
3. **"Unless the regions have the power to be self-governing, they will not be able to solve their own environmental problems"**
    1. It's important to understand that by "environmental", they mean "problems for their community", not necessarily anything "green"-coded like carbon emissions.
4. **"Finally, unless the present-day great nations have their power greatly decentralized, the beautiful and differentiated languages, cultures, customs, and ways of life of the earth's people, vital to the health of the planet, will vanish."**
    1. Well — writing from the world of 50 years into the future — 2026 — when we're seeing a strange shift away from rules-based diplomacy and back into spheres of influence, it appears the arc of society has bent... not *quite* in that direction.

This certainly doesn't feel as realistic as it may've in the 70s, but I do appreciate the high-minded idealism of this chapter. Shoot for the stars, and you may land on... walkable communities and workable bike lanes.

![[assets/Pasted image 20260207140254.png]]

## Conclusion

These are certainly far more abstract patterns than ones we might find in the future. There is some concern that, maybe, I should start at the end of Towns ([[content/annotations/a-pattern-language/94-sleeping-in-public|Sleeping in Public (94)]]) and work my way forward (from least abstract to most abstract within the Town portions). No doubt, progress on the beginning chapters will simply be slower, and the notes longer, in order to cover, here, a proportional amount of ground that the patterns themselves cover.

I have little doubt that future patterns, like [[content/annotations/a-pattern-language/251-different-chairs|Different Chairs (251)]], will solicit far less additional thinking than Independent Regions has.


[^1]: Yes — I know that Ogden, Provo, St. George, etc. could all be considered vaguely metro areas, at least worthy of showing up on the widest view of a regional map. However, considering Salt Lake City is *already* below the limit A Pattern City uses in their overview, I'm going to say that it'll constitute as the region's 1x city. If I held to the hard limit of 500,000, we'd probably have to expand the region of Utah to include either Las Vegas or Denver, which feels blasphemous.
[^2]: I don't particularly like ripping off quotes from indirect sources. I've tracked down the origin of this quote the best I could, which seems to've been von Neumann's essay *The Mathematician*, published in 1947 as part of a collection of works called *The Works of the Mind*, where the actual quote is: "I think that it is a relatively good approximation to truth — which is much too complicated to allow anything but approximations— that mathematical ideas originate in empirics, although the genealogy is sometimes long and obscure."
