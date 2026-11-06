---
title: "Planning With Agents: Better can be Better"
date: 2026-11-06
tags:
  - engineering/ai
  - writing/annotations
  - writing/fragments
description: Annotations on Maggie Appleton's 2026 talk about Boundary Objects
annotation-pages:
annotation-target: "https://maggieappleton.com/planning-agents"
annotation-target-type: web
---

This post (along with a recent Hank Green video about [the Navier-Stokes equation](https://www.youtube.com/watch?v=LvvG21CpaS4&t=1599s)) is a major inspiration for both the [[public/content/dead-math|Math is Dead]] post, and an upcoming sister post around (what ended up being defined, here, as) Boundary Objects.

Here are some of my notes around the post, as well as my experience using Chopin as a multiplayer harness.

>%%
>```annotation-json
>{"created":"2026-11-06T07:32:43.622Z","text":"As the person who introduced skills in general to my team/company, it is a very difficult thing to try and balance two truths:\n\n1. `/grill` is a better way to make sure agents have the information they need to successfully draw in the lines (feedforward); and\n2. It's *very, very* imperfect.\n\nIt's the subtlety that a solution can be better than nothing, but *far* from perfect.","updated":"2026-11-06T07:32:43.622Z","document":{"title":"Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces","link":[{"href":"https://maggieappleton.com/planning-agents"},{"href":"https://maggieappleton.com/planning-agents","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"title":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"type":["article"],"image":["https://maggieappleton.com/og/planning-agents.png"],"url":["https://maggieappleton.com/planning-agents"],"description":["Why we need richer, thicker interfaces and better boundary objects for collaborative planning with agents"],"locale":["en_GB"],"image:url":["https://maggieappleton.com/og/planning-agents.png"],"image:width":["1200"],"image:height":["630"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://maggieappleton.com/og/planning-agents.png"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"creator":["@mappletons"]},"favicon":"https://maggieappleton.com/images/favicon/favicon-16x16.png"},"uri":"https://maggieappleton.com/planning-agents","target":[{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[77]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[77]/p[2]","endOffset":234},{"type":"TextPositionSelector","start":12797,"end":13172},{"type":"TextQuoteSelector","exact":"Eventually, the agent stops asking questions and gives me a huge wall of Markdown to read. Then it asks: do you approve this plan, yes or no?There are some very obvious problems here. Especially in a CLI interface, I can’t edit the plan directly. The plan almost always has open questions in it, despite the grilling process, and I don’t have an interface for answering them.","prefix":"side the scope of our knowledge.","suffix":"I can’t pause on any of the ques"}]}]}
>```
>%%
>*%%PREFIX%%side the scope of our knowledge.%%HIGHLIGHT%% ==Eventually, the agent stops asking questions and gives me a huge wall of Markdown to read. Then it asks: do you approve this plan, yes or no?There are some very obvious problems here. Especially in a CLI interface, I can’t edit the plan directly. The plan almost always has open questions in it, despite the grilling process, and I don’t have an interface for answering them.== %%POSTFIX%%I can’t pause on any of the ques*
>%%LINK%%[[#^vn343q2472|show annotation]]
>%%COMMENT%%
>As the person who introduced skills in general to my team/company, it is a very difficult thing to try and balance two truths:
>
>1. `/grill` is a better way to make sure agents have the information they need to successfully draw in the lines (feedforward); and
>2. It's *very, very* imperfect.
>
>It's the subtlety that a solution can be better than nothing, but *far* from perfect.
>%%TAGS%%
>
^vn343q2472


>%%
>```annotation-json
>{"created":"2026-11-06T16:07:30.553Z","text":"Pulling and using Chopin with my team was, genuinely, the most mind-blowing moment that lit up \"multiplayer\" in all of our minds. I talk about this a bit in Season of Stamps, but a lot of my time in the last two years has been spent talking to robots *alone*. I was having trouble deciding if the problem in that state of affairs was the \"robots\" part, or the \"alone\" part. \n\nGetting to properly use a multiplayer harness pretty definitively answers: it's the *alone* part.\n\nWhile there's little ticky-tack things about Chopin that I had trouble with (notably, having to cobble together a local-first model, without the need for API tokens), it was greatly illuminating.\n\nIn my mind, to be multiplayer, the architecture of these types of harnesses should truly leverage actual game development prior art. The one that rattles around my brain is the idea of a [Listen Server](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.5/manual/learn/listenserverhostarchitecture.html) architecture. The best example I can think of is Minecraft's join-by-LAN feature. Whenever you play single-player Minecraft, you are *secretly* playing a multiplayer server by yourself.\n\nI think that the future of harnesses *is* listen server architecture: multiplayer by default, even if you are alone.","updated":"2026-11-06T16:17:25.457Z","document":{"title":"Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces","link":[{"href":"https://maggieappleton.com/planning-agents"},{"href":"https://maggieappleton.com/planning-agents","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"title":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"type":["article"],"image":["https://maggieappleton.com/og/planning-agents.png"],"url":["https://maggieappleton.com/planning-agents"],"description":["Why we need richer, thicker interfaces and better boundary objects for collaborative planning with agents"],"locale":["en_GB"],"image:url":["https://maggieappleton.com/og/planning-agents.png"],"image:width":["1200"],"image:height":["630"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://maggieappleton.com/og/planning-agents.png"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"creator":["@mappletons"]},"favicon":"https://maggieappleton.com/images/favicon/favicon-16x16.png"},"uri":"https://maggieappleton.com/planning-agents","target":[{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[119]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[119]/p[2]","endOffset":67},{"type":"TextPositionSelector","start":30178,"end":30455},{"type":"TextQuoteSelector","exact":"These kinds of rich, interactive plans are what I’m currently exploring in a project called    Chopin    . This is a multiplayer, real-time planning prototype that my coworker    Krzysztof     and I are making.It’s currently a very basic proof of concept and exploration space.","prefix":"e I’m answering other questions.","suffix":"You have your coworkers and agen"}]}],"links":{"html":"[[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces#^30g5wi0j7gk]]"}}
>```
>%%
>*%%PREFIX%%e I’m answering other questions.%%HIGHLIGHT%% ==These kinds of rich, interactive plans are what I’m currently exploring in a project called    Chopin    . This is a multiplayer, real-time planning prototype that my coworker    Krzysztof     and I are making.It’s currently a very basic proof of concept and exploration space.== %%POSTFIX%%You have your coworkers and agen*
>%%LINK%%[[#^30g5wi0j7gk|show annotation]]
>%%COMMENT%%
>Pulling and using Chopin with my team was, genuinely, the most mind-blowing moment that lit up "multiplayer" in all of our minds. I talk about this a bit in Season of Stamps, but a lot of my time in the last two years has been spent talking to robots *alone*. I was having trouble deciding if the problem in that state of affairs was the "robots" part, or the "alone" part. 
>
>Getting to properly use a multiplayer harness pretty definitively answers: it's the *alone* part.
>
>While there's little ticky-tack things about Chopin that I had trouble with (notably, having to cobble together a local-first model, without the need for API tokens), it was greatly illuminating.
>
>In my mind, to be multiplayer, the architecture of these types of harnesses should truly leverage actual game development prior art. The one that rattles around my brain is the idea of a [Listen Server](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.5/manual/learn/listenserverhostarchitecture.html) architecture. The best example I can think of is Minecraft's join-by-LAN feature. Whenever you play single-player Minecraft, you are *secretly* playing a multiplayer server by yourself.
>
>I think that the future of harnesses *is* listen server architecture: multiplayer by default, even if you are alone.
>%%TAGS%%
>
^30g5wi0j7gk


>%%
>```annotation-json
>{"created":"2026-11-06T16:18:43.826Z","text":"You may've noticed this on my own blog, just in the general uptick of diagrams and graphs in the last ~12 months, but it is easier than ever to add interactivity to static pages. At this point, I think any multiplayer harness that *doesn't* leverage MDX (over pure Markdown like an agent outputs in a TUI) is seriously, fundamentally lacking.","updated":"2026-11-06T16:18:43.826Z","document":{"title":"Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces","link":[{"href":"https://maggieappleton.com/planning-agents"},{"href":"https://maggieappleton.com/planning-agents","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"title":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"type":["article"],"image":["https://maggieappleton.com/og/planning-agents.png"],"url":["https://maggieappleton.com/planning-agents"],"description":["Why we need richer, thicker interfaces and better boundary objects for collaborative planning with agents"],"locale":["en_GB"],"image:url":["https://maggieappleton.com/og/planning-agents.png"],"image:width":["1200"],"image:height":["630"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://maggieappleton.com/og/planning-agents.png"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"creator":["@mappletons"]},"favicon":"https://maggieappleton.com/images/favicon/favicon-16x16.png"},"uri":"https://maggieappleton.com/planning-agents","target":[{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[120]/p[1]","startOffset":136,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[120]/p[1]","endOffset":156},{"type":"TextPositionSelector","start":30591,"end":30611},{"type":"TextQuoteSelector","exact":"It’s built with MDX.","prefix":"es lots of interactive visuals. ","suffix":"I didn’t touch on the social pie"}]}]}
>```
>%%
>*%%PREFIX%%es lots of interactive visuals.%%HIGHLIGHT%% ==It’s built with MDX.== %%POSTFIX%%I didn’t touch on the social pie*
>%%LINK%%[[#^r5wgo27wz2q|show annotation]]
>%%COMMENT%%
>You may've noticed this on my own blog, just in the general uptick of diagrams and graphs in the last ~12 months, but it is easier than ever to add interactivity to static pages. At this point, I think any multiplayer harness that *doesn't* leverage MDX (over pure Markdown like an agent outputs in a TUI) is seriously, fundamentally lacking.
>%%TAGS%%
>
^r5wgo27wz2q


>%%
>```annotation-json
>{"created":"2026-11-06T16:57:13.236Z","text":"It is *so important* to understand, conceptually, that `grill` is both a step forward in minimizing \"hallucination\" (which I'd define as just imprecise definition of a problem that folks truly misdiagnose at this point), but is far from a perfect solution.","updated":"2026-11-06T16:57:13.236Z","document":{"title":"Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces","link":[{"href":"https://maggieappleton.com/planning-agents"},{"href":"https://maggieappleton.com/planning-agents","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"title":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"type":["article"],"image":["https://maggieappleton.com/og/planning-agents.png"],"url":["https://maggieappleton.com/planning-agents"],"description":["Why we need richer, thicker interfaces and better boundary objects for collaborative planning with agents"],"locale":["en_GB"],"image:url":["https://maggieappleton.com/og/planning-agents.png"],"image:width":["1200"],"image:height":["630"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://maggieappleton.com/og/planning-agents.png"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"creator":["@mappletons"]},"favicon":"https://maggieappleton.com/images/favicon/favicon-16x16.png"},"uri":"https://maggieappleton.com/planning-agents","target":[{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[75]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[75]/p[1]","endOffset":247},{"type":"TextPositionSelector","start":12233,"end":12480},{"type":"TextQuoteSelector","exact":"When you or I start planning with an agent today, we’re in our CLI or desktop app of choice, alone, and we usually begin in some kind of plan mode or with the    /grill-me     skill enabled, and then proceed to answer 40 multiple-choice questions.","prefix":"Right now, it’s really not good.","suffix":"We get tired somewhere around qu"}]}]}
>```
>%%
>*%%PREFIX%%Right now, it’s really not good.%%HIGHLIGHT%% ==When you or I start planning with an agent today, we’re in our CLI or desktop app of choice, alone, and we usually begin in some kind of plan mode or with the    /grill-me     skill enabled, and then proceed to answer 40 multiple-choice questions.== %%POSTFIX%%We get tired somewhere around qu*
>%%LINK%%[[#^ny92rr4q7ij|show annotation]]
>%%COMMENT%%
>It is *so important* to understand, conceptually, that `grill` is both a step forward in minimizing "hallucination" (which I'd define as just imprecise definition of a problem that folks truly misdiagnose at this point), but is far from a perfect solution.
>%%TAGS%%
>
^ny92rr4q7ij


>%%
>```annotation-json
>{"created":"2026-11-06T16:58:51.732Z","text":"The recent Navier-Stokes kerfuffle is a huge highlight of this: the fact that the proof is there, but that we don't understand it, is exactly what [Hank Green](https://www.youtube.com/watch?v=LvvG21CpaS4) talks about in his recent video with Grant Sanderson (3blue1brown) about understanding and elegance: we (through agents) have proven something that we (as people) do not yet understand.","updated":"2026-11-06T16:58:51.732Z","document":{"title":"Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces","link":[{"href":"https://maggieappleton.com/planning-agents"},{"href":"https://maggieappleton.com/planning-agents","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"title":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"type":["article"],"image":["https://maggieappleton.com/og/planning-agents.png"],"url":["https://maggieappleton.com/planning-agents"],"description":["Why we need richer, thicker interfaces and better boundary objects for collaborative planning with agents"],"locale":["en_GB"],"image:url":["https://maggieappleton.com/og/planning-agents.png"],"image:width":["1200"],"image:height":["630"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://maggieappleton.com/og/planning-agents.png"],"image:alt":["Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces"],"creator":["@mappletons"]},"favicon":"https://maggieappleton.com/images/favicon/favicon-16x16.png"},"uri":"https://maggieappleton.com/planning-agents","target":[{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[83]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[83]/p[1]","endOffset":195},{"type":"TextPositionSelector","start":15338,"end":15533},{"type":"TextQuoteSelector","exact":"A lot of why this is a difficult problem to solve boils down to humans and agents being very different kinds of beings, with very different worlds, that are only partially legible to one another.","prefix":"ork and complex problem-solving.","suffix":"Let’s go back to Suchman’s resea"}]}]}
>```
>%%
>*%%PREFIX%%ork and complex problem-solving.%%HIGHLIGHT%% ==A lot of why this is a difficult problem to solve boils down to humans and agents being very different kinds of beings, with very different worlds, that are only partially legible to one another.== %%POSTFIX%%Let’s go back to Suchman’s resea*
>%%LINK%%[[#^w92wlhbwoo7|show annotation]]
>%%COMMENT%%
>The recent Navier-Stokes kerfuffle is a huge highlight of this: the fact that the proof is there, but that we don't understand it, is exactly what [Hank Green](https://www.youtube.com/watch?v=LvvG21CpaS4) talks about in his recent video with Grant Sanderson (3blue1brown) about understanding and elegance: we (through agents) have proven something that we (as people) do not yet understand.
>%%TAGS%%
>
^w92wlhbwoo7
