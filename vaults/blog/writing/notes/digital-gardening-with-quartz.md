---
title: Kicking off a Digital Garden with Quartz
date: 2024-02-25
tags:
  - goblin-slaying
  - horticulture
  - engineering/typescript
  - notes
draft: false
---
I've decided that I'm pretty bad at capital-B Blogging™. The last "post" I made (as of writing) was [[structured-streaming|the Databricks guest post on Spark Structured Streaming]] that I did back when I worked at M Science in 2022. That particular post went through a few different stages of revisions:

1. Revising initial drafts as I learned more about Structured Streaming as a concept
2. Revising "personally final" drafts with the Structured Streaming engineering team at Databricks
3. Revising "technically final" drafts with somebody from our company's internal marketing team to make sure I didn't sound like a doofus/didn't make it seem like the company hired doofuses (it hired me, so it *totally* did, but that's obviously not something to broadcast openly)
4. Revising the "marketing final" draft with a lawyer to make sure I wasn't blabbing trade secrets to the general public
5. Revising the "legally final" draft with Databricks' blog team to make sure the formatting was right (which I didn't do a good job of, apparently - the [final published draft](https://www.databricks.com/blog/2022/07/14/using-spark-structured-streaming-to-scale-your-analytics.html) ended up having some weird formatting errors. Not totally sure what happened there ¯\\*(ツ)*/¯ ) ^1bc4a7

That was quite a bit more than I'd expected when initially pitching "What if we published our internal guide for everybody?". That, along with starting a new job that introduced me to a far higher standard for engineering, raised my own internal bar for "what should I put on the internet?" Since then, I've written quite a few posts that I'd describe as ~60% "done," but didn't end up hurdling internal (and arbitrary) bar for publishing.

Considering [[hello-blog|the editorial standards I started this blog with]], the idea that I've had any bar at all is a bit funny.

## The cost of learning is teaching

As somebody that has benefitted immensely from the free body of knowledge that exists on the internet, this doesn't make me happy. A graveyard of posts I've arbitrarily deemed "unfinished" isn't particularly helpful to anybody, including myself. Just because a set of knowledge isn't refined enough to be perfectly, 100% clear to a broad audience doesn't mean it wouldn't be helpful to *somebody*, including myself in the future.

I was fortunate enough to stumble on [Maggie Appleton's Ethos on Digital Gardening](https://arc.net/l/quote/abfpadro), which notably resonated with me more than many things I'd read in the recent past. In particular, this diagram she designed clicked something in my brain that'd remained un-clicked for quite awhile:

![Maggie Appleton's diagram of digital media on a spectrum of polish, ranging from chaos to cultivated, with digital gardening between "private notes" and "classic blog posts](https://res.cloudinary.com/dg3gyk0gu/image/upload/c_scale,f_auto,q_auto:good,w_1100/v1593765637/maggieappleton.com/notes/garden-history/digital-garden.png)

> **brief aside**: Maggie brings a level of polish and class to doodling that is [[structured-streaming#Using Spark Structured Streaming|frankly enviable]].

## The cost of perfection is infinite

Putting things on a spectrum of "chaos" to "cultivated", in conjunction with the idea that ["the cost of perfection is infinite"](https://youtube.com/clip/Ugkx9fkAb69oHPNZ3EDJPCJxPfWbBdyrI8OO?si=rh3P1LQ8pOkT4Nja) (if not asymptotic), puts into hardly-uncertain terms that simply because a thing is not perfect, or close to it, necessarily means that it is unhelpful and should die a slow death in a draft bin.