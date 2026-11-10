---
title: Law of Demeter (LOD)
date: 2026-11-06
updated: 2026-11-10
tags:
  - engineering
  - writing/annotations
  - writing/fragments
description:
annotation-pages:
annotation-target: "https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html"
annotation-target-type: web
---


>%%
>```annotation-json
>{"created":"2026-11-06T20:40:59.780Z","text":"I'm not sure if this is a case of [frequency illusion](https://en.wikipedia.org/wiki/Frequency_illusion), but there is a part of me that is absolutely floored by how often random research paths eventually lead me back to \"oh, *they* live in Boston, too?\"\n\nThe last notable one: [Wayland](https://arstechnica.com/information-technology/2011/03/the-linux-graphics-stack-from-x-to-wayland/)","updated":"2026-11-06T20:40:59.780Z","document":{"title":"Law of Demeter (General Formulation)","link":[{"href":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html"}],"dc":{},"eprints":{},"facebook":{},"highwire":{},"prism":{},"twitter":{}},"uri":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","target":[{"source":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","selector":[{"type":"RangeSelector","startContainer":"/address[1]","startOffset":1,"endContainer":"/address[1]/address[1]/address[1]/address[1]","endOffset":21},{"type":"TextPositionSelector","start":3154,"end":3295},{"type":"TextQuoteSelector","exact":"Professor Karl Lieberherr\nCollege of Computer and Information Science Science, Northeastern University\nBoston, MA 02115\nlieber at ccs.neu.edu","prefix":"\n\n Back to Demeter home page \n\n ","suffix":"                       \n\n\n"}]}]}
>```
>%%
>*%%PREFIX%%Back to Demeter home page%%HIGHLIGHT%% ==Professor Karl Lieberherr
>College of Computer and Information Science Science, Northeastern University
>Boston, MA 02115
>lieber at ccs.neu.edu== %%POSTFIX%%*
>%%LINK%%[[#^jbhq3zrlo2d|show annotation]]
>%%COMMENT%%
>I'm not sure if this is a case of [frequency illusion](https://en.wikipedia.org/wiki/Frequency_illusion), but there is a part of me that is absolutely floored by how often random research paths eventually lead me back to "oh, *they* live in Boston, too?"
>
>The last notable one: [Wayland](https://arstechnica.com/information-technology/2011/03/the-linux-graphics-stack-from-x-to-wayland/)
>%%TAGS%%
>
^jbhq3zrlo2d


>%%
>```annotation-json
>{"created":"2026-11-06T20:47:17.919Z","text":"This a principle I've tried to stick through with Flowthru, which is made easy by connections between its primitives being closely tied to the DAG that they assemble: if you try coupling things together in terrible ways, the flows (which are all DAGs) become immediately nightmarish. \"Ugly\" DAGs have a somewhat pleasant aesthetic definition: if the visualization of a DAG is structurally fucked, then the DAG itself is probably *also* structurally fucked.\n\nComing from Pragmatic Programmer, it's difficult not to think about this as a form of software rot (tip 3, software entropy): that by reaching for \"but X should talk to Y!\" too often, there's a tendency to tangle.\n\nI also think this hails back to [[Software Gardening]]: the role of a stack engineer is to make it structurally difficult for a unit of the code to know too much outside its immediate domain, making the Law of Demeter an actual *law*, rather than a soft rule to be shortcutted past by an agent.\n\n(The Pragmatic Programmer actually touches on that idea: its footnote on the Law of Demeter is \"So it's not really law. It's more like The Jolly Good Idea of Demeter\". I believe we have more tools than ever to codify this: that's part of why I enjoy writing linters that make use of .NET's Roslyn, and do this a *lot* in Flowthru.)","updated":"2026-11-06T21:11:11.087Z","document":{"title":"Law of Demeter (General Formulation)","link":[{"href":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html"}],"dc":{},"eprints":{},"facebook":{},"highwire":{},"prism":{},"twitter":{}},"uri":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","target":[{"source":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","selector":[{"type":"RangeSelector","startContainer":"/p[1]","startOffset":1,"endContainer":"/p[1]","endOffset":240},{"type":"TextPositionSelector","start":272,"end":511},{"type":"TextQuoteSelector","exact":"A more general formulation of the Law of Demeter is:\nEach unit should have only limited knowledge about other units:\nonly units \"closely\" related to the current unit.\n\nOr: Each unit should only talk to its friends; Don't talk to strangers.","prefix":" fall of 1987 by Ian Holland.\n\n\n","suffix":"\n\n\nIn this general form, the LoD"}]}],"links":{"html":"[[public/content/annotations/highlights/www2.ccs.neu.edu/Law-of-Demeter-(General-Formulation)#^wjvchhuae5]]"}}
>```
>%%
>*%%PREFIX%%fall of 1987 by Ian Holland.%%HIGHLIGHT%% ==A more general formulation of the Law of Demeter is:
>Each unit should have only limited knowledge about other units:
>only units "closely" related to the current unit.
>
>Or: Each unit should only talk to its friends; Don't talk to strangers.== %%POSTFIX%%In this general form, the LoD*
>%%LINK%%[[#^wjvchhuae5|show annotation]]
>%%COMMENT%%
>This a principle I've tried to stick through with Flowthru, which is made easy by connections between its primitives being closely tied to the DAG that they assemble: if you try coupling things together in terrible ways, the flows (which are all DAGs) become immediately nightmarish. "Ugly" DAGs have a somewhat pleasant aesthetic definition: if the visualization of a DAG is structurally fucked, then the DAG itself is probably *also* structurally fucked.
>
>Coming from Pragmatic Programmer, it's difficult not to think about this as a form of software rot (tip 3, software entropy): that by reaching for "but X should talk to Y!" too often, there's a tendency to tangle.
>
>I also think this hails back to [[Software Gardening]]: the role of a stack engineer is to make it structurally difficult for a unit of the code to know too much outside its immediate domain, making the Law of Demeter an actual *law*, rather than a soft rule to be shortcutted past by an agent.
>
>(The Pragmatic Programmer actually touches on that idea: its footnote on the Law of Demeter is "So it's not really law. It's more like The Jolly Good Idea of Demeter". I believe we have more tools than ever to codify this: that's part of why I enjoy writing linters that make use of .NET's Roslyn, and do this a *lot* in Flowthru.)
>%%TAGS%%
>
^wjvchhuae5


>%%
>```annotation-json
>{"created":"2026-11-06T20:50:36.044Z","text":"I think this is something that I really had to noodle on when I first entered into the domain of ORMs, which enforce databases and objects in code to align. Over a lot of time working with EFCore, specifically, I've developed a repulsion towards having methods attached to objects that should, in an ideal setup, be purely data objects representing the rows of a table.\n\nIt also meshes well in my broken dev brain of thinking about things in terms of little machines on an assembly line, where the data (a product moving across the assembly line) and the actions done to that data ought to be separate things.","updated":"2026-11-06T20:50:36.044Z","document":{"title":"Law of Demeter (General Formulation)","link":[{"href":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html"}],"dc":{},"eprints":{},"facebook":{},"highwire":{},"prism":{},"twitter":{}},"uri":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","target":[{"source":"https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html","selector":[{"type":"RangeSelector","startContainer":"/p[6]","startOffset":44,"endContainer":"/p[6]","endOffset":327},{"type":"TextPositionSelector","start":2077,"end":2360},{"type":"TextQuoteSelector","exact":"A method should have \nlimited knowledge of an object model.\nThis view leads to aspect-oriented programming: we pull out \nthe method and transitively all its\nauxiliary methods into a separate aspect. This works best if the separate\naspect has limited knowledge about the object model.","prefix":"mmarizes the Law of Demeter as: ","suffix":"\n\n\nThe Law of Demeter and narrow"}]}]}
>```
>%%
>*%%PREFIX%%mmarizes the Law of Demeter as:%%HIGHLIGHT%% ==A method should have 
>limited knowledge of an object model.
>This view leads to aspect-oriented programming: we pull out 
>the method and transitively all its
>auxiliary methods into a separate aspect. This works best if the separate
>aspect has limited knowledge about the object model.== %%POSTFIX%%The Law of Demeter and narrow*
>%%LINK%%[[#^i1smereqnjp|show annotation]]
>%%COMMENT%%
>I think this is something that I really had to noodle on when I first entered into the domain of ORMs, which enforce databases and objects in code to align. Over a lot of time working with EFCore, specifically, I've developed a repulsion towards having methods attached to objects that should, in an ideal setup, be purely data objects representing the rows of a table.
>
>It also meshes well in my broken dev brain of thinking about things in terms of little machines on an assembly line, where the data (a product moving across the assembly line) and the actions done to that data ought to be separate things.
>%%TAGS%%
>
^i1smereqnjp
