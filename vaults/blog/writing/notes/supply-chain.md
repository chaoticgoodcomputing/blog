---
title: 'From the Archive: "What *are* Supply Chains, Anyway?"'
date: 2019-07-01
tags:
  - economics/finance
  - engineering/python
  - viz
  - notes
updated: 2024-02-27
---
Below, you'll find some graphs. These are what is known in the field of [[tags/viz/index|data visualization]] as "bad."

These graphs are (as far as I can recall) my first attempts at using & visualizing network structures. As much as I would like to say they're not too bad for a first attempt, they don't "speak for themselves" as much as they "scream torments in the face of the viewer."

The below graphs are stock tickers, connected to one another by their supplier relationships. For example, if Company A publicly noted that they received supplies from Company B, that would be denoted by a connecting edge.

![](assets/messy-graph.svg)

Below is my first (and only) attempt to organize the above output. If I'm recalling correctly (and this was in 2019, so [[caveat-lector|caveat lector]]), this was at least an attempt to get the first-order to third-order suppliers of a given set of equities and place their order in shells around the center. It's messy, it's noisy, and frankly, incomprehensible.

![](assets/circle-graph.png)

The hope of this analysis was to ultimately connect supply chains and, as a secondary goal, find [graph cycles](https://neopythonic.blogspot.com/2009/01/detecting-cycles-in-directed-graph.html) among a set of target stocks to find and catalog "supply loops", and see if stocks in a given supply loop rise and fall together. The visualization acted more as a sanity check to see if my web scraper was working and less of a rigorous tool for understanding.

Despite my area of focus being [[qamo|the parts of economics that aren't related to either studying (or making) money]], this is something I'd like to return to again in the future. However, I unfortunately don't have the same level of data access that I did as an undergraduate, and [purchasing access to a Bloomberg terminal falls well outside the financial means of CGC](https://arc.net/l/quote/fwsjojws). However, if you're ever looking for somebody to make bad graphs pro-bono and *do* have access to that kind of data, please [[contact|feel free to reach out]].