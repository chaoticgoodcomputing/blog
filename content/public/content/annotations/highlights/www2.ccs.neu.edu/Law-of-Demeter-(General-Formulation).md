---
title: Law of Demeter (LOD)
date: 2026-11-06
updated: 2026-11-17
tags:
  - engineering
  - writing/annotations
  - writing/fragments
description: Annotations on Karl Lieberherr's "Law of Demeter"
annotation-pages:
annotation-target: "https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html"
annotation-target-type: web
annotation-public: true
---


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1172c64a-529f-4e2f-a226-1bec0525e7c5","type":"Annotation","motivation":"commenting","body":{"id":"#^jbhq3zrlo2d","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","selector":[{"type":"RangeSelector","startContainer":"/address[1]","startOffset":1,"endContainer":"/address[1]/address[1]/address[1]/address[1]","endOffset":21},{"type":"TextPositionSelector","start":3154,"end":3295},{"type":"TextQuoteSelector","exact":"Professor Karl Lieberherr\nCollege of Computer and Information Science Science, Northeastern University\nBoston, MA 02115\nlieber at ccs.neu.edu","prefix":"\n\n Back to Demeter home page \n\n ","suffix":"                       \n\n\n"}]},"created":"2026-11-06T20:40:59.780Z","modified":"2026-11-06T20:40:59.780Z","hypothesis":{"id":"dUPiPOL8EfGkyhOMKdt5Rw","digest":"2f4d67d6e4a2"}}
> ```
> %%
> I'm not sure if this is a case of [frequency illusion](https://en.wikipedia.org/wiki/Frequency_illusion), but there is a part of me that is absolutely floored by how often random research paths eventually lead me back to "oh, *they* live in Boston, too?"
>
> The last notable one: [Wayland](https://arstechnica.com/information-technology/2011/03/the-linux-graphics-stack-from-x-to-wayland/)
^jbhq3zrlo2d


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9276cbe6-44a8-4e73-bd1f-b0109e86c4e1","type":"Annotation","motivation":"commenting","body":{"id":"#^wjvchhuae5","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","selector":[{"type":"RangeSelector","startContainer":"/p[1]","startOffset":1,"endContainer":"/p[1]","endOffset":240},{"type":"TextPositionSelector","start":272,"end":511},{"type":"TextQuoteSelector","exact":"A more general formulation of the Law of Demeter is:\nEach unit should have only limited knowledge about other units:\nonly units \"closely\" related to the current unit.\n\nOr: Each unit should only talk to its friends; Don't talk to strangers.","prefix":" fall of 1987 by Ian Holland.\n\n\n","suffix":"\n\n\nIn this general form, the LoD"}]},"created":"2026-11-06T20:47:17.919Z","modified":"2026-11-06T21:11:11.087Z","hypothesis":{"id":"dWoZyuL8EfG1bK9q5vCENA","digest":"1c67ebf73073b9"}}
> ```
> %%
> This a principle I've tried to stick through with Flowthru, which is made easy by connections between its primitives being closely tied to the DAG that they assemble: if you try coupling things together in terrible ways, the flows (which are all DAGs) become immediately nightmarish. "Ugly" DAGs have a somewhat pleasant aesthetic definition: if the visualization of a DAG is structurally fucked, then the DAG itself is probably *also* structurally fucked.
>
> Coming from Pragmatic Programmer, it's difficult not to think about this as a form of software rot (tip 3, software entropy): that by reaching for "but X should talk to Y!" too often, there's a tendency to tangle.
>
> I also think this hails back to [[Software Gardening]]: the role of a stack engineer is to make it structurally difficult for a unit of the code to know too much outside its immediate domain, making the Law of Demeter an actual *law*, rather than a soft rule to be shortcutted past by an agent.
>
> (The Pragmatic Programmer actually touches on that idea: its footnote on the Law of Demeter is "So it's not really law. It's more like The Jolly Good Idea of Demeter". I believe we have more tools than ever to codify this: that's part of why I enjoy writing linters that make use of .NET's Roslyn, and do this a *lot* in Flowthru.)
^wjvchhuae5


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d4170215-46c0-4be0-b48c-677b6ce809af","type":"Annotation","motivation":"commenting","body":{"id":"#^i1smereqnjp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","selector":[{"type":"RangeSelector","startContainer":"/p[6]","startOffset":44,"endContainer":"/p[6]","endOffset":327},{"type":"TextPositionSelector","start":2077,"end":2360},{"type":"TextQuoteSelector","exact":"A method should have \nlimited knowledge of an object model.\nThis view leads to aspect-oriented programming: we pull out \nthe method and transitively all its\nauxiliary methods into a separate aspect. This works best if the separate\naspect has limited knowledge about the object model.","prefix":"mmarizes the Law of Demeter as: ","suffix":"\n\n\nThe Law of Demeter and narrow"}]},"created":"2026-11-06T20:50:36.044Z","modified":"2026-11-06T20:50:36.044Z","hypothesis":{"id":"daERluL8EfGzu3eXgHiCzw","digest":"1600cc2c61b284"}}
> ```
> %%
> I think this is something that I really had to noodle on when I first entered into the domain of ORMs, which enforce databases and objects in code to align. Over a lot of time working with EFCore, specifically, I've developed a repulsion towards having methods attached to objects that should, in an ideal setup, be purely data objects representing the rows of a table.
>
> It also meshes well in my broken dev brain of thinking about things in terms of little machines on an assembly line, where the data (a product moving across the assembly line) and the actions done to that data ought to be separate things.
^i1smereqnjp
