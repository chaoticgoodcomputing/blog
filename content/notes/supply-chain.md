# What *are* Supply Chains, Anyway?

> A first foray into network visualization: messy graphs, abject terror. Early data viz experiments searching for supply loops. Bad graphs; interesting questions.

- Page: https://blog.chaoticgood.computer/content/notes/supply-chain
- Author: Spencer Elkington
- Published: 2019-07-01
- Updated: 2026-09-26
- Tags: economics/finance, engineering/languages/python, engineering/data, projects/undergrad, writing/fragments

---

Below, you’ll find some graphs. These are what is known in the field of [data visualization](https://blog.chaoticgood.computer/tags/engineering/data) as “bad.”

These graphs are (as far as I can recall) my first attempts at using & visualizing network structures. As much as I would like to say they’re not too bad for a first attempt, they don’t “speak for themselves” as much as they “scream torments in the face of the viewer.”

The below graphs are stock tickers, connected to one another by their supplier relationships. For example, if Company A publicly noted that they received supplies from Company B, that would be denoted by a connecting edge.

![](https://blog.chaoticgood.computer/_astro/messy-graph.DbcxwQw8_Z6UvLS.svg)

Below is my first (and only) attempt to organize the above output. If I’m recalling correctly (and this was in 2019, so [caveat lector](https://blog.chaoticgood.computer/content/notes/caveat-lector)), this was at least an attempt to get the first-order to third-order suppliers of a given set of equities and place their order in shells around the center. It’s messy, it’s noisy, and frankly, incomprehensible.

![circle-graph](https://blog.chaoticgood.computer/_astro/circle-graph.BNaYqn1t_QMX8b.webp)

The hope of this analysis was to ultimately connect supply chains and, as a secondary goal, find [graph cycles](https://neopythonic.blogspot.com/2009/01/detecting-cycles-in-directed-graph.html) among a set of target stocks to find and catalog “supply loops”, and see if stocks in a given supply loop rise and fall together. The visualization acted more as a sanity check to see if my web scraper was working and less of a rigorous tool for understanding.

Despite my area of focus being [the parts of economics that aren’t related to either studying (or making) money](https://blog.chaoticgood.computer/content/notes/qamo), this is something I’d like to return to again in the future. However, I unfortunately don’t have the same level of data access that I did as an undergraduate, and [purchasing access to a Bloomberg terminal falls well outside the financial means of CGC](https://www.investopedia.com/articles/professionaleducation/11/bloomberg-terminal.asp#:~:text=How%20Much%20Does%20the%20Bloomberg,month%2C%20or%20%2424%2C000%20per%20year.). However, if you’re ever looking for somebody to make bad graphs pro-bono and *do* have access to that kind of data, please [feel free to reach out](https://blog.chaoticgood.computer/contact).
