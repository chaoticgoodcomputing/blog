---
title: "No Silver Bullet: Essence and Accident in Software Engineering"
date: 2026-11-06
updated: 2026-11-17
tags:
  - engineering
  - engineering/ai
  - economics/management
  - writing/annotations
annotation-target: https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf
description:
annotation-pages:
---
I recently got into a discussion about [computer-aided software engineering](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) with some folks, recently, for... [[public/tags/engineering/ai|reasons that should be obvious]].

For some context: Brooks is the author of [*The Mythical Man-Month*](https://en.wikipedia.org/wiki/The_Mythical_Man-Month), originally published in 1975, about engineering and project management. It's been awhile since reading it ("awhile" meaning 2022, at the recommendation of my manager at the time), but the book's core premise is that adding more engineering hours to a project doesn't necessarily make it complete faster: a combination of an irreducible core of work, with added management overhead in parallelization and coordination of work, may end up delaying it.

In this particular paper, written 9 years after *The Mythical Man-Month*, Brooks defines a framework for evaluating the potential lower bound for optimizations in software engineering. In particular, the key premise is that time spent software engineering (defined loosely as taking an idea and cpublic/content/annotations/programming-as-theory-building.mdonverting it into a runnable computer program) is spent in either two areas of work:[^1]

- **Accidental** work, which "attend its production, but are not inherent"; and
- **Essential** work, which is "inherent to the nature of the software"
  
In thinking about optimization, he categorizes a silver bullet as something that might decrease the amount of time it takes to complete a task by an order of magnitude (10x). His conclusion, looking on the horizon from 1986, was that there weren't any clear silver bullets.

Obviously, we have the benefit of hindsight. You might think that this post is solely about modern LLM and agentic development,[^2] but there's been a *lot* of ground to cover in the software optimization space since then. The first Mac and Windows machines were released in 1984 and 1985, respectively, just a couple years before the paper was written. IDEs and object-oriented programming were just barely entering the scene. Development by rapid iteration -- which he does actually touch on, if in spirit if not in name -- wasn't formalized into the modern Agile we're familiar with until 25 years later.

Writing with 40 years of hindsight, and with modern agents being capable of massive speedups[^3], there's no better time to think about the essentials and accidentals in the profession.

>%%
>```annotation-json
>{"created":"2026-11-07T19:40:29.215Z","text":"I think that this premise hits a bit differently in 2026 than it did in 1986.\n\nFirst: even though Brooks is framing \"Silver Bullet\" as an order-of-magnitude improvement, this isn't necessarily a binary, true/false \"anything less is useless\": simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.\n\nIn the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that's where the optimization question gets even more philosophical than Brooks puts it, here. I'm especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they're responsible for).","updated":"2026-11-10T14:54:19.905Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1007,"end":1149},{"type":"TextQuoteSelector","exact":"Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.","prefix":"l, as opposed to the essential? ","suffix":"Therefore it appears that the ti"},{"type":"PageSelector","index":0,"label":"1"}]}],"links":{"html":"[[private/content/notes/scratch/no-silver-bullet-1986#^9ozg40riczb]]"}}
>```
>%%
>*%%PREFIX%%l, as opposed to the essential?%%HIGHLIGHT%% ==Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.== %%POSTFIX%%Therefore it appears that the ti*
>%%LINK%%[[#^9ozg40riczb|show annotation]]
>%%COMMENT%%
>I think that this premise hits a bit differently in 2026 than it did in 1986.
>
>First: even though Brooks is framing "Silver Bullet" as an order-of-magnitude improvement, this isn't necessarily a binary, true/false "anything less is useless": simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.
>
>In the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that's where the optimization question gets even more philosophical than Brooks puts it, here. I'm especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they're responsible for).
>%%TAGS%%
>
^9ozg40riczb


>%%
>```annotation-json
>{"created":"2026-11-07T19:42:14.954Z","text":"I mean... [[public/content/notes/software-gardening.mdx|I can't *not* bring it up.]]","updated":"2026-11-10T14:45:40.331Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1502,"end":1531},{"type":"TextQuoteSelector","exact":"Growing software organically,","prefix":"tablishing software requirements. ","suffix":" adding more and more function t"},{"type":"PageSelector","index":0,"label":"1"}]}],"links":{"html":"[[private/content/notes/scratch/no-silver-bullet-1986#^vjg26uls6ae]]"}}
>```
>%%
>*%%PREFIX%%tablishing software requirements.%%HIGHLIGHT%% ==Growing software organically,== %%POSTFIX%%adding more and more function t*
>%%LINK%%[[#^vjg26uls6ae|show annotation]]
>%%COMMENT%%
>I mean... [[public/content/notes/software-gardening.mdx|I can't *not* bring it up.]]
>%%TAGS%%
>
^vjg26uls6ae


>%%
>```annotation-json
>{"created":"2026-11-07T19:45:52.475Z","text":"It's important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.\n\nI think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.","updated":"2026-11-10T15:18:11.856Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4605,"end":4696},{"type":"TextQuoteSelector","exact":"he transformation of computer manufacture from an assembly industry into a process industry.","prefix":"ed costs. These gains flow from t","suffix":"Second, to see what rate of prog"},{"type":"PageSelector","index":1,"label":"2"}]}],"links":{"html":"[[private/content/notes/scratch/no-silver-bullet-1986#^tkmanyd0vh]]"}}
>```
>%%
>*%%PREFIX%%ed costs. These gains flow from t%%HIGHLIGHT%% ==he transformation of computer manufacture from an assembly industry into a process industry.== %%POSTFIX%%Second, to see what rate of prog*
>%%LINK%%[[#^tkmanyd0vh|show annotation]]
>%%COMMENT%%
>It's important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.
>
>I think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.
>%%TAGS%%
>
^tkmanyd0vh


>%%
>```annotation-json
>{"created":"2026-11-07T19:46:40.788Z","text":"Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.","updated":"2026-11-10T15:19:30.218Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4824,"end":4997},{"type":"TextQuoteSelector","exact":"I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.","prefix":"ficulties. Following Aristotle, ","suffix":"The accidents I discuss in the n"},{"type":"PageSelector","index":1,"label":"2"}]}],"links":{"html":"[[private/content/notes/scratch/no-silver-bullet-1986#^vyepyaspik]]"}}
>```
>%%
>*%%PREFIX%%ficulties. Following Aristotle,%%HIGHLIGHT%% ==I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.== %%POSTFIX%%The accidents I discuss in the n*
>%%LINK%%[[#^vyepyaspik|show annotation]]
>%%COMMENT%%
>Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.
>%%TAGS%%
>
^vyepyaspik


>%%
>```annotation-json
>{"created":"2026-11-07T19:47:19.934Z","text":"This is a massive issue that I broach in both the [[public/content/dead-math.md|Gherkin post]], as well as touching on my own experience trying to resurrect \"dead\" software, as defined in [[public/content/annotations/programming-as-theory-building.md|Programming as Theory Building]].","updated":"2026-11-10T15:21:04.436Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5394,"end":5701},{"type":"TextQuoteSelector","exact":"I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.","prefix":"hly precise and richly detailed. ","suffix":""},{"type":"PageSelector","index":1,"label":"2"}]}],"links":{"html":"[[private/content/notes/scratch/no-silver-bullet-1986#^x4uisgky7tj]]"}}
>```
>%%
>*%%PREFIX%%hly precise and richly detailed.%%HIGHLIGHT%% ==I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.== %%POSTFIX%%*
>%%LINK%%[[#^x4uisgky7tj|show annotation]]
>%%COMMENT%%
>This is a massive issue that I broach in both the [[public/content/dead-math.md|Gherkin post]], as well as touching on my own experience trying to resurrect "dead" software, as defined in [[public/content/annotations/programming-as-theory-building.md|Programming as Theory Building]].
>%%TAGS%%
>
^x4uisgky7tj


>%%
>```annotation-json
>{"created":"2026-11-07T19:53:50.156Z","text":"Brooks gets into this later, but... yeah. That also came up in the background research for CASE programs during [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]. It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [[public/tags/projects/flowthru|Flowthru]], for example, lends itself well to a visualization, but that's only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get... horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It's effectively be an orthogonal axis to the DAG, adding an additional dimensionality.\n\nBrooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.","updated":"2026-11-10T21:26:25.550Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":6963,"end":7143},{"type":"TextQuoteSelector","exact":"The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.","prefix":"creases much more than linearly. ","suffix":" Mathematics and the physical sc"},{"type":"PageSelector","index":2,"label":"3"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^vqhlzf6jdks]]"}}
>```
>%%
>*%%PREFIX%%creases much more than linearly.%%HIGHLIGHT%% ==The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.== %%POSTFIX%%Mathematics and the physical sc*
>%%LINK%%[[#^vqhlzf6jdks|show annotation]]
>%%COMMENT%%
>Brooks gets into this later, but... yeah. That also came up in the background research for CASE programs during [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]. It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [[public/tags/projects/flowthru|Flowthru]], for example, lends itself well to a visualization, but that's only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get... horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It's effectively be an orthogonal axis to the DAG, adding an additional dimensionality.
>
>Brooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.
>%%TAGS%%
>
^vqhlzf6jdks


>%%
>```annotation-json
>{"created":"2026-11-07T19:59:49.692Z","text":"[[public/content/dead-math#Why Proofs?|This section on formal verification and proofs]] talks about this a bit. Even the Red Team's research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today's technology, be out of the realm of possibility.","updated":"2026-11-10T21:28:12.429Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":7801,"end":7959},{"type":"TextQuoteSelector","exact":"From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.","prefix":" cost overruns, schedule delays. ","suffix":" From the complexity of the func"},{"type":"PageSelector","index":2,"label":"3"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^pprm61om6t]]"}}
>```
>%%
>*%%PREFIX%%cost overruns, schedule delays.%%HIGHLIGHT%% ==From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.== %%POSTFIX%%From the complexity of the func*
>%%LINK%%[[#^pprm61om6t|show annotation]]
>%%COMMENT%%
>[[public/content/dead-math#Why Proofs?|This section on formal verification and proofs]] talks about this a bit. Even the Red Team's research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today's technology, be out of the realm of possibility.
>%%TAGS%%
>
^pprm61om6t


>%%
>```annotation-json
>{"created":"2026-11-07T20:03:08.322Z","text":"This is *exactly* what [[public/content/annotations/programming-as-theory-building#^7ppb5sf3ycw|Naur talks about]]. Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.\n\nThis is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don't fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.","updated":"2026-11-10T21:34:52.015Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":8513,"end":8613},{"type":"TextQuoteSelector","exact":"It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.","prefix":"and control all the loose ends. ","suffix":"Conformity. Software people are "},{"type":"PageSelector","index":2,"label":"3"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^f7geh76bbjl]]"}}
>```
>%%
>*%%PREFIX%%and control all the loose ends.%%HIGHLIGHT%% ==It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.== %%POSTFIX%%Conformity. Software people are*
>%%LINK%%[[#^f7geh76bbjl|show annotation]]
>%%COMMENT%%
>This is *exactly* what [[public/content/annotations/programming-as-theory-building#^7ppb5sf3ycw|Naur talks about]]. Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.
>
>This is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don't fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.
>%%TAGS%%
>
^f7geh76bbjl


>%%
>```annotation-json
>{"created":"2026-11-07T20:03:53.203Z","text":"I do feel this one deeply. As part of my [[public/tags/projects/dayjob|dayjob]], I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.","updated":"2026-11-10T21:36:26.044Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9029,"end":9185},{"type":"TextQuoteSelector","exact":"No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human","prefix":" is not capricious or arbitrary. ","suffix":""},{"type":"PageSelector","index":2,"label":"3"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^ulc2nm1bo4]]"}}
>```
>%%
>*%%PREFIX%%is not capricious or arbitrary.%%HIGHLIGHT%% ==No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human== %%POSTFIX%%*
>%%LINK%%[[#^ulc2nm1bo4|show annotation]]
>%%COMMENT%%
>I do feel this one deeply. As part of my [[public/tags/projects/dayjob|dayjob]], I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.
>%%TAGS%%
>
^ulc2nm1bo4


>%%
>```annotation-json
>{"created":"2026-11-07T20:05:36.052Z","text":"I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they'll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.\n\nConversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* -- that is to say, I can make decisions autonomously without much fear that I'll, say, lose business or alienate anyone.\n\nSoftware, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:\n\n- Z is for patches (small fixes that don't modify functionality\n- Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won't break any users' switching\n- X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.\n\nIt's not unusual to see early software go through many breaking changes while it's a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).","updated":"2026-11-10T21:52:38.256Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9493,"end":9800},{"type":"TextQuoteSelector","exact":"In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.","prefix":"rent people, rather than by God. ","suffix":"Changeability. The software enti"},{"type":"PageSelector","index":3,"label":"4"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^v9h1tk6pcnb]]"}}
>```
>%%
>*%%PREFIX%%rent people, rather than by God.%%HIGHLIGHT%% ==In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.== %%POSTFIX%%Changeability. The software enti*
>%%LINK%%[[#^v9h1tk6pcnb|show annotation]]
>%%COMMENT%%
>I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they'll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.
>
>Conversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* -- that is to say, I can make decisions autonomously without much fear that I'll, say, lose business or alienate anyone.
>
>Software, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:
>
>- Z is for patches (small fixes that don't modify functionality
>- Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won't break any users' switching
>- X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.
>
>It's not unusual to see early software go through many breaking changes while it's a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).
>%%TAGS%%
>
^v9h1tk6pcnb


>%%
>```annotation-json
>{"created":"2026-11-07T22:08:42.822Z","text":".","updated":"2026-11-07T22:08:42.822Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":12130,"end":12231},{"type":"TextQuoteSelector","exact":"we find it to constitute not one, but several, general directed graphs, superimposed one upon another.","prefix":"t to diagram software structure, ","suffix":" The several graphs may represen"},{"type":"PageSelector","index":3,"label":"4"}]}]}
>```
>%%
>*%%PREFIX%%t to diagram software structure,%%HIGHLIGHT%% ==we find it to constitute not one, but several, general directed graphs, superimposed one upon another.== %%POSTFIX%%The several graphs may represen*
>%%LINK%%[[#^732yguy522u|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^732yguy522u


>%%
>```annotation-json
>{"created":"2026-11-07T22:09:36.128Z","text":"[Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)","updated":"2026-11-13T15:44:07.672Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15479,"end":15601},{"type":"TextQuoteSelector","exact":"arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.","prefix":" going on in a complex system. 2 P","suffix":""},{"type":"PageSelector","index":4,"label":"5"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^hd9oddco1o7]]"}}
>```
>%%
>*%%PREFIX%%going on in a complex system. 2 P%%HIGHLIGHT%% ==arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.== %%POSTFIX%%*
>%%LINK%%[[#^hd9oddco1o7|show annotation]]
>%%COMMENT%%
>[Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)
>%%TAGS%%
>
^hd9oddco1o7


>%%
>```annotation-json
>{"created":"2026-11-07T22:10:18.916Z","text":"While this is definitely the case, I'd say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can't be effectively linted becomes harder to scale against than is offset by their ease of use.\n\nThis is specifically around non-prototyping. That's worth distinguishing.","updated":"2026-11-13T14:50:20.099Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":13331,"end":13671},{"type":"TextQuoteSelector","exact":"High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.","prefix":"trapolation of each such attack. ","suffix":"What does a high-level language "},{"type":"PageSelector","index":4,"label":"5"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^sasqm0mbvyd]]"}}
>```
>%%
>*%%PREFIX%%trapolation of each such attack.%%HIGHLIGHT%% ==High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.== %%POSTFIX%%What does a high-level language*
>%%LINK%%[[#^sasqm0mbvyd|show annotation]]
>%%COMMENT%%
>While this is definitely the case, I'd say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can't be effectively linted becomes harder to scale against than is offset by their ease of use.
>
>This is specifically around non-prototyping. That's worth distinguishing.
>%%TAGS%%
>
^sasqm0mbvyd


>%%
>```annotation-json
>{"created":"2026-11-07T22:11:16.771Z","text":"Ah, yeah -- this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall -- I haven't read the book since college) talks about the idea of \"good abstractions\" and \"bad abstractions\".\n\nIt can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the \"rules\" require carve-outs, which is a slippery slope towards having no rules at all.\n\nFrameworks also have the same... I won't call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it's necessary to understand that there truly is no \"silver bullet\" among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* -- but there truly is no \"everything\" framework.","updated":"2026-11-13T15:02:22.480Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14563,"end":14746},{"type":"TextQuoteSelector","exact":"Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.","prefix":"r to the sophistication of users. ","suffix":"Time-sharing. Most observers cre"},{"type":"PageSelector","index":4,"label":"5"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^57h8rfdym18]]"}}
>```
>%%
>*%%PREFIX%%r to the sophistication of users.%%HIGHLIGHT%% ==Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.== %%POSTFIX%%Time-sharing. Most observers cre*
>%%LINK%%[[#^57h8rfdym18|show annotation]]
>%%COMMENT%%
>Ah, yeah -- this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall -- I haven't read the book since college) talks about the idea of "good abstractions" and "bad abstractions".
>
>It can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the "rules" require carve-outs, which is a slippery slope towards having no rules at all.
>
>Frameworks also have the same... I won't call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it's necessary to understand that there truly is no "silver bullet" among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* -- but there truly is no "everything" framework.
>%%TAGS%%
>
^57h8rfdym18


>%%
>```annotation-json
>{"created":"2026-11-07T22:31:01.338Z","text":"The idea of shortening system response time is *so underrated* -- and far harder than Brooks makes it out to be. I talk about this a lot in both [[public/content/notes/software-gardening.mdx|Software Gardening]] and its precursor, [[public/content/notes/hostage-negotiations|Hostage Negotiations]]: rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.\n\nA lot of my attitude on immediate feedback was borne from my time doing [[public/content/articles/structured-streaming.md|data pipelines on Databricks/PySpark]]. That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.","updated":"2026-11-13T15:53:47.240Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15876,"end":16080},{"type":"TextQuoteSelector","exact":"The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.","prefix":"of time-sharing derive directly. ","suffix":"Unified programming environments"},{"type":"PageSelector","index":5,"label":"6"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^eicluc87x9t]]"}}
>```
>%%
>*%%PREFIX%%of time-sharing derive directly.%%HIGHLIGHT%% ==The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.== %%POSTFIX%%Unified programming environments*
>%%LINK%%[[#^eicluc87x9t|show annotation]]
>%%COMMENT%%
>The idea of shortening system response time is *so underrated* -- and far harder than Brooks makes it out to be. I talk about this a lot in both [[public/content/notes/software-gardening.mdx|Software Gardening]] and its precursor, [[public/content/notes/hostage-negotiations|Hostage Negotiations]]: rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.
>
>A lot of my attitude on immediate feedback was borne from my time doing [[public/content/articles/structured-streaming.md|data pipelines on Databricks/PySpark]]. That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.
>%%TAGS%%
>
^eicluc87x9t


>%%
>```annotation-json
>{"created":"2026-11-07T22:31:59.691Z","text":"Thinking about this in terms of 1986 versus 2026, batch programming feels more like a \"push\" in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)","updated":"2026-11-13T15:43:14.400Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15101,"end":15476},{"type":"TextQuoteSelector","exact":"The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.","prefix":"tain an overview of complexity. ","suffix":"2 Parnas, D.L., “Designing softw"},{"type":"PageSelector","index":4,"label":"5"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^bfauk520glo]]"}}
>```
>%%
>*%%PREFIX%%tain an overview of complexity.%%HIGHLIGHT%% ==The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.== %%POSTFIX%%2 Parnas, D.L., “Designing softw*
>%%LINK%%[[#^bfauk520glo|show annotation]]
>%%COMMENT%%
>Thinking about this in terms of 1986 versus 2026, batch programming feels more like a "push" in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)
>%%TAGS%%
>
^bfauk520glo


>%%
>```annotation-json
>{"created":"2026-11-07T22:32:40.645Z","text":"This bit of the paper feels *prescient* when you read it out of context, but it's so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn't pan out then, but here we are now.","updated":"2026-11-17T15:52:23.000Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21051,"end":21249},{"type":"TextQuoteSelector","exact":"Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4","prefix":"g a program product. I doubt it. ","suffix":" I do not. To see why, we must d"},{"type":"PageSelector","index":6,"label":"7"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^yfp6g5ihhb]]"}}
>```
>%%
>*%%PREFIX%%g a program product. I doubt it.%%HIGHLIGHT%% ==Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4== %%POSTFIX%%I do not. To see why, we must d*
>%%LINK%%[[#^yfp6g5ihhb|show annotation]]
>%%COMMENT%%
>This bit of the paper feels *prescient* when you read it out of context, but it's so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn't pan out then, but here we are now.
>%%TAGS%%
>
^yfp6g5ihhb


>%%
>```annotation-json
>{"created":"2026-11-07T22:33:03.124Z","text":"[Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)","updated":"2026-11-17T15:53:04.612Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22004,"end":22124},{"type":"TextQuoteSelector","exact":"Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).","prefix":"alif.: Benjamin Cummings, 1983. 4 ","suffix":""},{"type":"PageSelector","index":6,"label":"7"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^8kwbn6w8ess]]"}}
>```
>%%
>*%%PREFIX%%alif.: Benjamin Cummings, 1983. 4%%HIGHLIGHT%% ==Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).== %%POSTFIX%%*
>%%LINK%%[[#^8kwbn6w8ess|show annotation]]
>%%COMMENT%%
>[Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)
>%%TAGS%%
>
^8kwbn6w8ess


>%%
>```annotation-json
>{"created":"2026-11-09T17:04:41.771Z","text":"This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today's dollars).\n\nAs such, companies typically couldn't buy all that many computers. On top of that, early computers weren't multi-user: that is to say, you couldn't have multiple users \"logged in\", using the company's one computer, at once. That's what \"batch programming\" was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.\n\n(This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by \"time sharing\").\n\nDespite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of \"context switching\" -- having to interrupt your train of thought by multitasking (say, programming while also responding to pings).","updated":"2026-11-13T15:36:10.363Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14746,"end":14759},{"type":"TextQuoteSelector","exact":"Time-sharing.","prefix":"ely uses the esoteric constructs. ","suffix":" Most observers credit time-shar"},{"type":"PageSelector","index":4,"label":"5"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^m2tflg196ud]]"}}
>```
>%%
>*%%PREFIX%%ely uses the esoteric constructs.%%HIGHLIGHT%% ==Time-sharing.== %%POSTFIX%%Most observers credit time-shar*
>%%LINK%%[[#^m2tflg196ud|show annotation]]
>%%COMMENT%%
>This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today's dollars).
>
>As such, companies typically couldn't buy all that many computers. On top of that, early computers weren't multi-user: that is to say, you couldn't have multiple users "logged in", using the company's one computer, at once. That's what "batch programming" was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.
>
>(This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by "time sharing").
>
>Despite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of "context switching" -- having to interrupt your train of thought by multitasking (say, programming while also responding to pings).
>%%TAGS%%
>
^m2tflg196ud


>%%
>```annotation-json
>{"created":"2026-11-09T17:05:19.840Z","text":"I haven't got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.\n\n(To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).\n\nThe only thing I'd add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it's important to note that the vast majority of most powerful tools available to developers work against plaintext. There's no way, for example, to `grep` a Word document.\n\nA minor part of the reason I've [[public/content/dead-math.md|latched onto Gherkin]] is because it brings aspects of project management and ownership into plaintext. Once it's in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.","updated":"2026-11-13T16:16:33.678Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":16276,"end":16555},{"type":"TextQuoteSelector","exact":"They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.","prefix":"tivity by integral factors. Why? ","suffix":"This breakthrough in turn stimul"},{"type":"PageSelector","index":5,"label":"6"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^6w73od68aa3]]"}}
>```
>%%
>*%%PREFIX%%tivity by integral factors. Why?%%HIGHLIGHT%% ==They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.== %%POSTFIX%%This breakthrough in turn stimul*
>%%LINK%%[[#^6w73od68aa3|show annotation]]
>%%COMMENT%%
>I haven't got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.
>
>(To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).
>
>The only thing I'd add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it's important to note that the vast majority of most powerful tools available to developers work against plaintext. There's no way, for example, to `grep` a Word document.
>
>A minor part of the reason I've [[public/content/dead-math.md|latched onto Gherkin]] is because it brings aspects of project management and ownership into plaintext. Once it's in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.
>%%TAGS%%
>
^6w73od68aa3


>%%
>```annotation-json
>{"created":"2026-11-09T17:07:24.528Z","text":"Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.\n\nIn the same way I doubt that [[public/content/notes/pattern-languages-of-the-neighborhood|A Pattern Language]] could've been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.","updated":"2026-11-13T16:26:40.158Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19107,"end":19231},{"type":"TextQuoteSelector","exact":"Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.","prefix":" the cause of the improvements. ","suffix":"Object-oriented programming. Man"},{"type":"PageSelector","index":6,"label":"7"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^byc7wdtnz3o]]"}}
>```
>%%
>*%%PREFIX%%the cause of the improvements.%%HIGHLIGHT%% ==Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.== %%POSTFIX%%Object-oriented programming. Man*
>%%LINK%%[[#^byc7wdtnz3o|show annotation]]
>%%COMMENT%%
>Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.
>
>In the same way I doubt that [[public/content/notes/pattern-languages-of-the-neighborhood|A Pattern Language]] could've been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.
>%%TAGS%%
>
^byc7wdtnz3o


>%%
>```annotation-json
>{"created":"2026-11-09T17:07:46.934Z","text":"We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I've already cited to the practice, I'd refer to previous annotations on OOP's importance.","updated":"2026-11-13T16:28:48.336Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19231,"end":19405},{"type":"TextQuoteSelector","exact":"Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.","prefix":"odern software design techniques. ","suffix":" Mark Sherman of Dartmouth notes"},{"type":"PageSelector","index":6,"label":"7"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^ankq3ql47lk]]"}}
>```
>%%
>*%%PREFIX%%odern software design techniques.%%HIGHLIGHT%% ==Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.== %%POSTFIX%%Mark Sherman of Dartmouth notes*
>%%LINK%%[[#^ankq3ql47lk|show annotation]]
>%%COMMENT%%
>We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I've already cited to the practice, I'd refer to previous annotations on OOP's importance.
>%%TAGS%%
>
^ankq3ql47lk


>%%
>```annotation-json
>{"created":"2026-11-09T17:08:50.891Z","text":"I'd once again disagree with this, but it's nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.\n\nThis is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of \"cutting off fat\" versus \"cutting into muscle\". To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.","updated":"2026-11-17T14:39:55.654Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":20557,"end":20778},{"type":"TextQuoteSelector","exact":"Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that","prefix":"gher-order expression of design. ","suffix":". An order-of-magnitude gain can "},{"type":"PageSelector","index":6,"label":"7"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^n5q9tyhtdgg]]"}}
>```
>%%
>*%%PREFIX%%gher-order expression of design.%%HIGHLIGHT%% ==Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that== %%POSTFIX%%. An order-of-magnitude gain can*
>%%LINK%%[[#^n5q9tyhtdgg|show annotation]]
>%%COMMENT%%
>I'd once again disagree with this, but it's nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.
>
>This is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of "cutting off fat" versus "cutting into muscle". To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.
>%%TAGS%%
>
^n5q9tyhtdgg


>%%
>```annotation-json
>{"created":"2026-11-09T17:10:21.719Z","text":".","updated":"2026-11-09T17:10:21.719Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22649,"end":22816},{"type":"TextQuoteSelector","exact":"The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.","prefix":" completely with this critique. ","suffix":" I have a hard time seeing how i"},{"type":"PageSelector","index":7,"label":"8"}]}]}
>```
>%%
>*%%PREFIX%%completely with this critique.%%HIGHLIGHT%% ==The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.== %%POSTFIX%%I have a hard time seeing how i*
>%%LINK%%[[#^kuymwz1me2|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^kuymwz1me2


>%%
>```annotation-json
>{"created":"2026-11-09T17:11:30.693Z","text":".","updated":"2026-11-09T17:11:30.693Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":23484,"end":23813},{"type":"TextQuoteSelector","exact":"An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.","prefix":"ept, and what are the prospects? ","suffix":" The inference engines typically "},{"type":"PageSelector","index":7,"label":"8"}]}]}
>```
>%%
>*%%PREFIX%%ept, and what are the prospects?%%HIGHLIGHT%% ==An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.== %%POSTFIX%%The inference engines typically*
>%%LINK%%[[#^5moqmvedmzn|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^5moqmvedmzn


>%%
>```annotation-json
>{"created":"2026-11-09T17:11:45.407Z","text":".","updated":"2026-11-09T17:11:45.407Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":23897,"end":23938},{"type":"TextQuoteSelector","exact":"in addition to purely deterministic logic.","prefix":"or probabilistic data and rules ","suffix":"Such systems offer some clear ad"},{"type":"PageSelector","index":7,"label":"8"}]}]}
>```
>%%
>*%%PREFIX%%or probabilistic data and rules%%HIGHLIGHT%% ==in addition to purely deterministic logic.== %%POSTFIX%%Such systems offer some clear ad*
>%%LINK%%[[#^ficfpoqwdp8|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^ficfpoqwdp8


>%%
>```annotation-json
>{"created":"2026-11-09T17:13:09.107Z","text":". https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf","updated":"2026-11-09T17:13:09.107Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24530,"end":24725},{"type":"TextQuoteSelector","exact":"Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.","prefix":"lexity of the application itself. ","suffix":" I believe the most important ad"},{"type":"PageSelector","index":7,"label":"8"}]}]}
>```
>%%
>*%%PREFIX%%lexity of the application itself.%%HIGHLIGHT%% ==Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.== %%POSTFIX%%I believe the most important ad*
>%%LINK%%[[#^ivjyf74mo9k|show annotation]]
>%%COMMENT%%
>. https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf
>%%TAGS%%
>
^ivjyf74mo9k


>%%
>```annotation-json
>{"created":"2026-11-09T17:14:20.346Z","text":".","updated":"2026-11-09T17:14:20.346Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24063,"end":24168},{"type":"TextQuoteSelector","exact":"Inference engine technology is developed in an application-independent way, and then applied to many uses.","prefix":"olutions to the same problems: • • ","suffix":" One can justify much more effor"},{"type":"PageSelector","index":7,"label":"8"}]}]}
>```
>%%
>*%%PREFIX%%olutions to the same problems: • •%%HIGHLIGHT%% ==Inference engine technology is developed in an application-independent way, and then applied to many uses.== %%POSTFIX%%One can justify much more effor*
>%%LINK%%[[#^ncwm3eztdnk|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^ncwm3eztdnk


>%%
>```annotation-json
>{"created":"2026-11-09T17:14:42.756Z","text":".","updated":"2026-11-09T17:14:42.756Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24268,"end":24530},{"type":"TextQuoteSelector","exact":"The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.","prefix":"hat technology is well advanced. ","suffix":"Edward Feigenbaum says that the "},{"type":"PageSelector","index":7,"label":"8"}]}]}
>```
>%%
>*%%PREFIX%%hat technology is well advanced.%%HIGHLIGHT%% ==The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.== %%POSTFIX%%Edward Feigenbaum says that the*
>%%LINK%%[[#^g7ibzwd9qgt|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^g7ibzwd9qgt


>%%
>```annotation-json
>{"created":"2026-11-09T17:17:03.601Z","text":".","updated":"2026-11-09T17:17:03.601Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27236,"end":27306},{"type":"TextQuoteSelector","exact":"finding articulate, self-analytical experts who know why they do things","prefix":"d task of knowledge acquisition: ","suffix":"; and developing efficient techn"},{"type":"PageSelector","index":8,"label":"9"}]}]}
>```
>%%
>*%%PREFIX%%d task of knowledge acquisition:%%HIGHLIGHT%% ==finding articulate, self-analytical experts who know why they do things== %%POSTFIX%%; and developing efficient techn*
>%%LINK%%[[#^7ndmgqf1q0j|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^7ndmgqf1q0j


>%%
>```annotation-json
>{"created":"2026-11-09T17:17:14.951Z","text":".","updated":"2026-11-09T17:17:14.951Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":26662,"end":26718},{"type":"TextQuoteSelector","exact":"helping in lifelong maintenance and modification testing","prefix":" bring-up test cases, as well as ","suffix":". In the same way, we can postula"},{"type":"PageSelector","index":8,"label":"9"}]}]}
>```
>%%
>*%%PREFIX%%bring-up test cases, as well as%%HIGHLIGHT%% ==helping in lifelong maintenance and modification testing== %%POSTFIX%%. In the same way, we can postula*
>%%LINK%%[[#^6k5uzuuz5sv|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^6k5uzuuz5sv


>%%
>```annotation-json
>{"created":"2026-11-09T17:17:59.432Z","text":".","updated":"2026-11-09T17:17:59.432Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27485,"end":27900},{"type":"TextQuoteSelector","exact":"The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.","prefix":"pert system is to have an expert. ","suffix":"“Automatic” programming. For alm"},{"type":"PageSelector","index":8,"label":"9"}]}]}
>```
>%%
>*%%PREFIX%%pert system is to have an expert.%%HIGHLIGHT%% ==The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.== %%POSTFIX%%“Automatic” programming. For alm*
>%%LINK%%[[#^mj864yumg2m|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^mj864yumg2m


>%%
>```annotation-json
>{"created":"2026-11-09T17:18:26.339Z","text":".","updated":"2026-11-09T17:18:26.339Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27925,"end":27944},{"type":"TextQuoteSelector","exact":"For almost 40 years","prefix":"ortant. “Automatic” programming. ","suffix":", people have been anticipating "},{"type":"PageSelector","index":8,"label":"9"}]}]}
>```
>%%
>*%%PREFIX%%ortant. “Automatic” programming.%%HIGHLIGHT%% ==For almost 40 years== %%POSTFIX%%, people have been anticipating*
>%%LINK%%[[#^dtcc5xnitnn|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^dtcc5xnitnn


>%%
>```annotation-json
>{"created":"2026-11-09T17:19:05.692Z","text":".","updated":"2026-11-09T17:19:05.692Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28445,"end":28566},{"type":"TextQuoteSelector","exact":"He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.","prefix":"ly available to the programmer.8 ","suffix":"7 Mostow, op. cit. 8 Parnas, 1985"},{"type":"PageSelector","index":8,"label":"9"}]}]}
>```
>%%
>*%%PREFIX%%ly available to the programmer.8%%HIGHLIGHT%% ==He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.== %%POSTFIX%%7 Mostow, op. cit. 8 Parnas, 1985*
>%%LINK%%[[#^uo0il5xnmjc|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^uo0il5xnmjc


>%%
>```annotation-json
>{"created":"2026-11-09T17:19:16.915Z","text":".","updated":"2026-11-09T17:19:16.915Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28294,"end":28444},{"type":"TextQuoteSelector","exact":"n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.","prefix":"ot semantic content, asserting, I","suffix":"8 He argues, in essence, that in "},{"type":"PageSelector","index":8,"label":"9"}]}]}
>```
>%%
>*%%PREFIX%%ot semantic content, asserting, I%%HIGHLIGHT%% ==n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.== %%POSTFIX%%8 He argues, in essence, that in*
>%%LINK%%[[#^kc305035ym|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^kc305035ym


>%%
>```annotation-json
>{"created":"2026-11-09T17:21:05.656Z","text":".","updated":"2026-11-09T17:21:05.656Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30469,"end":30707},{"type":"TextQuoteSelector","exact":"In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.","prefix":"age for their proposed computer. ","suffix":"Second, the screens of today are"},{"type":"PageSelector","index":9,"label":"10"}]}]}
>```
>%%
>*%%PREFIX%%age for their proposed computer.%%HIGHLIGHT%% ==In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.== %%POSTFIX%%Second, the screens of today are*
>%%LINK%%[[#^5s993cluoig|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^5s993cluoig


>%%
>```annotation-json
>{"created":"2026-11-09T17:21:35.053Z","text":".","updated":"2026-11-09T17:21:35.053Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30195,"end":30306},{"type":"TextQuoteSelector","exact":"In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.","prefix":"I am persuaded that nothing will. ","suffix":"10 Indeed, it is best viewed as "},{"type":"PageSelector","index":9,"label":"10"}]}]}
>```
>%%
>*%%PREFIX%%I am persuaded that nothing will.%%HIGHLIGHT%% ==In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.== %%POSTFIX%%10 Indeed, it is best viewed as*
>%%LINK%%[[#^d97hq9ydw9c|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^d97hq9ydw9c


>%%
>```annotation-json
>{"created":"2026-11-09T17:22:20.909Z","text":".","updated":"2026-11-09T17:22:20.909Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30707,"end":30844},{"type":"TextQuoteSelector","exact":"Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.","prefix":"ting the programs they describe. ","suffix":" The so-called “desktop metaphor"},{"type":"PageSelector","index":9,"label":"10"}]}]}
>```
>%%
>*%%PREFIX%%ting the programs they describe.%%HIGHLIGHT%% ==Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.== %%POSTFIX%%The so-called “desktop metaphor*
>%%LINK%%[[#^h5pgqb65qp|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^h5pgqb65qp


>%%
>```annotation-json
>{"created":"2026-11-09T17:22:40.869Z","text":".","updated":"2026-11-09T17:22:40.869Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31185,"end":31330},{"type":"TextQuoteSelector","exact":"Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.","prefix":"dom access to a score of pages. ","suffix":" The hardware technology will ha"},{"type":"PageSelector","index":9,"label":"10"}]}]}
>```
>%%
>*%%PREFIX%%dom access to a score of pages.%%HIGHLIGHT%% ==Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.== %%POSTFIX%%The hardware technology will ha*
>%%LINK%%[[#^xhvbeuk4i8n|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^xhvbeuk4i8n


>%%
>```annotation-json
>{"created":"2026-11-09T17:23:04.978Z","text":".","updated":"2026-11-09T17:23:04.978Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31689,"end":31764},{"type":"TextQuoteSelector","exact":"we feel only one dimension of the intricately interlocked software elephant.","prefix":"l data structures, or whatever, ","suffix":" If we superimpose all the diagr"},{"type":"PageSelector","index":9,"label":"10"}]}]}
>```
>%%
>*%%PREFIX%%l data structures, or whatever,%%HIGHLIGHT%% ==we feel only one dimension of the intricately interlocked software elephant.== %%POSTFIX%%If we superimpose all the diagr*
>%%LINK%%[[#^1c5nprutkln|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^1c5nprutkln


>%%
>```annotation-json
>{"created":"2026-11-09T17:23:52.738Z","text":".","updated":"2026-11-09T17:23:52.738Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":32771,"end":33094},{"type":"TextQuoteSelector","exact":"I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.","prefix":"o implementing and testing them? ","suffix":"Program verification does not me"},{"type":"PageSelector","index":10,"label":"11"}]}]}
>```
>%%
>*%%PREFIX%%o implementing and testing them?%%HIGHLIGHT%% ==I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.== %%POSTFIX%%Program verification does not me*
>%%LINK%%[[#^u6tcgt70nrb|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^u6tcgt70nrb


>%%
>```annotation-json
>{"created":"2026-11-09T17:24:10.898Z","text":".","updated":"2026-11-09T17:24:10.898Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33182,"end":33307},{"type":"TextQuoteSelector","exact":"Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.","prefix":" There is no magic here, either. ","suffix":"More seriously, even perfect pro"},{"type":"PageSelector","index":10,"label":"11"}]}]}
>```
>%%
>*%%PREFIX%%There is no magic here, either.%%HIGHLIGHT%% ==Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.== %%POSTFIX%%More seriously, even perfect pro*
>%%LINK%%[[#^fscfpc13l9|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^fscfpc13l9


>%%
>```annotation-json
>{"created":"2026-11-09T17:24:37.405Z","text":".","updated":"2026-11-09T17:24:37.405Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33415,"end":33599},{"type":"TextQuoteSelector","exact":"The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.","prefix":"program meets its specification. ","suffix":"Environments and tools. How much"},{"type":"PageSelector","index":10,"label":"11"}]}]}
>```
>%%
>*%%PREFIX%%program meets its specification.%%HIGHLIGHT%% ==The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.== %%POSTFIX%%Environments and tools. How much*
>%%LINK%%[[#^rrk5d1x6wpg|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^rrk5d1x6wpg


>%%
>```annotation-json
>{"created":"2026-11-09T17:26:13.535Z","text":".","updated":"2026-11-09T17:26:13.535Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34108,"end":34388},{"type":"TextQuoteSelector","exact":"Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.","prefix":"rors and simple semantic errors. ","suffix":"Surely this work is worthwhile, "},{"type":"PageSelector","index":10,"label":"11"}]}]}
>```
>%%
>*%%PREFIX%%rors and simple semantic errors.%%HIGHLIGHT%% ==Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.== %%POSTFIX%%Surely this work is worthwhile,*
>%%LINK%%[[#^sknnl8ow6i|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^sknnl8ow6i


>%%
>```annotation-json
>{"created":"2026-11-09T17:26:56.266Z","text":".","updated":"2026-11-09T17:26:56.266Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34854,"end":35028},{"type":"TextQuoteSelector","exact":"Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.","prefix":"ly supported by today’s speeds. ","suffix":"More powerful workstations we su"},{"type":"PageSelector","index":10,"label":"11"}]}]}
>```
>%%
>*%%PREFIX%%ly supported by today’s speeds.%%HIGHLIGHT%% ==Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.== %%POSTFIX%%More powerful workstations we su*
>%%LINK%%[[#^u5nri1m37df|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^u5nri1m37df


>%%
>```annotation-json
>{"created":"2026-11-09T17:28:23.167Z","text":".","updated":"2026-11-09T17:28:23.167Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36066,"end":36174},{"type":"TextQuoteSelector","exact":"Buy versus build. The most radical possible solution for constructing software is not to construct it at all.","prefix":"some of these are very promising. ","suffix":"Every day this becomes easier, a"},{"type":"PageSelector","index":11,"label":"12"}]}]}
>```
>%%
>*%%PREFIX%%some of these are very promising.%%HIGHLIGHT%% ==Buy versus build. The most radical possible solution for constructing software is not to construct it at all.== %%POSTFIX%%Every day this becomes easier, a*
>%%LINK%%[[#^ywdgnn4xef|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^ywdgnn4xef


>%%
>```annotation-json
>{"created":"2026-11-09T17:29:18.921Z","text":".","updated":"2026-11-09T17:29:18.921Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35661,"end":35879},{"type":"TextQuoteSelector","exact":"If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.","prefix":"task = ∑ (Frequency) i x (Time) i ","suffix":"Hence we must consider those att"},{"type":"PageSelector","index":11,"label":"12"}]}]}
>```
>%%
>*%%PREFIX%%task = ∑ (Frequency) i x (Time) i%%HIGHLIGHT%% ==If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.== %%POSTFIX%%Hence we must consider those att*
>%%LINK%%[[#^qpqgplaxida|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^qpqgplaxida


>%%
>```annotation-json
>{"created":"2026-11-09T17:29:28.380Z","text":".","updated":"2026-11-09T17:29:28.380Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35908,"end":36020},{"type":"TextQuoteSelector","exact":"attacks that address the essence of the software problem, the formulation of these complex conceptual structures.","prefix":"ns. Hence we must consider those ","suffix":" Fortunately, some of these are v"},{"type":"PageSelector","index":11,"label":"12"}]}]}
>```
>%%
>*%%PREFIX%%ns. Hence we must consider those%%HIGHLIGHT%% ==attacks that address the essence of the software problem, the formulation of these complex conceptual structures.== %%POSTFIX%%Fortunately, some of these are v*
>%%LINK%%[[#^46ecwt2iwel|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^46ecwt2iwel


>%%
>```annotation-json
>{"created":"2026-11-09T17:30:05.442Z","text":".","updated":"2026-11-09T17:30:05.442Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36377,"end":36466},{"type":"TextQuoteSelector","exact":"he personal computer revolution has created not one, but m any, mass markets for software.","prefix":"red on production methodology, t","suffix":" Every newsstand carried monthly "},{"type":"PageSelector","index":11,"label":"12"}]}]}
>```
>%%
>*%%PREFIX%%red on production methodology, t%%HIGHLIGHT%% ==he personal computer revolution has created not one, but m any, mass markets for software.== %%POSTFIX%%Every newsstand carried monthly*
>%%LINK%%[[#^fh6d7a9q5mb|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^fh6d7a9q5mb


>%%
>```annotation-json
>{"created":"2026-11-09T17:31:42.594Z","text":".","updated":"2026-11-09T17:31:42.594Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36858,"end":36913},{"type":"TextQuoteSelector","exact":"Any such product is cheaper to buy than to build afresh","prefix":"ket place for individual modules. ","suffix":". Even at a cost of $100,000, a p"},{"type":"PageSelector","index":11,"label":"12"}]}]}
>```
>%%
>*%%PREFIX%%ket place for individual modules.%%HIGHLIGHT%% ==Any such product is cheaper to buy than to build afresh== %%POSTFIX%%. Even at a cost of $100,000, a p*
>%%LINK%%[[#^8jv1h13fwqn|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^8jv1h13fwqn


>%%
>```annotation-json
>{"created":"2026-11-09T17:33:14.699Z","text":"On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it's basically the cost of pushing a distributable up to a server, and the cost of you downloading it.\n\nNetflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It's very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.","updated":"2026-11-10T15:36:42.169Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37279,"end":37461},{"type":"TextQuoteSelector","exact":"The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.","prefix":"ntained than homegrown software. ","suffix":" Sharing that cost among even a "},{"type":"PageSelector","index":11,"label":"12"}]}],"links":{"html":"[[private/content/notes/scratch/no-silver-bullet-1986#^r48k3wopfxp]]"}}
>```
>%%
>*%%PREFIX%%ntained than homegrown software.%%HIGHLIGHT%% ==The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.== %%POSTFIX%%Sharing that cost among even a*
>%%LINK%%[[#^r48k3wopfxp|show annotation]]
>%%COMMENT%%
>On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it's basically the cost of pushing a distributable up to a server, and the cost of you downloading it.
>
>Netflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It's very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.
>%%TAGS%%
>
^r48k3wopfxp


>%%
>```annotation-json
>{"created":"2026-11-09T17:34:13.206Z","text":".","updated":"2026-11-09T17:34:13.206Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37953,"end":38127},{"type":"TextQuoteSelector","exact":"users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.","prefix":"s, study after study showed that ","suffix":" During the 1980s, we find such "},{"type":"PageSelector","index":11,"label":"12"}]}]}
>```
>%%
>*%%PREFIX%%s, study after study showed that%%HIGHLIGHT%% ==users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.== %%POSTFIX%%During the 1980s, we find such*
>%%LINK%%[[#^tic5hg7ofof|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^tic5hg7ofof


>%%
>```annotation-json
>{"created":"2026-11-10T13:09:12.688Z","text":".","updated":"2026-11-10T13:09:12.688Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":38576,"end":39112},{"type":"TextQuoteSelector","exact":"The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.","prefix":"cated than those of 20 years ago. ","suffix":"There are dramatic exceptions to"},{"type":"PageSelector","index":12,"label":"13"}]}]}
>```
>%%
>*%%PREFIX%%cated than those of 20 years ago.%%HIGHLIGHT%% ==The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.== %%POSTFIX%%There are dramatic exceptions to*
>%%LINK%%[[#^y1gz1ngkwvm|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^y1gz1ngkwvm


>%%
>```annotation-json
>{"created":"2026-11-10T13:09:47.965Z","text":".","updated":"2026-11-10T13:09:47.965Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":39672,"end":39926},{"type":"TextQuoteSelector","exact":"Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.","prefix":"routinely done with these tools. ","suffix":"I believe the single most powerf"},{"type":"PageSelector","index":12,"label":"13"}]}]}
>```
>%%
>*%%PREFIX%%routinely done with these tools.%%HIGHLIGHT%% ==Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.== %%POSTFIX%%I believe the single most powerf*
>%%LINK%%[[#^z8uqeaqsds|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^z8uqeaqsds


>%%
>```annotation-json
>{"created":"2026-11-10T13:09:54.490Z","text":".","updated":"2026-11-10T13:09:54.490Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40204,"end":40313},{"type":"TextQuoteSelector","exact":"The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.","prefix":"t programs, and turn them loose. ","suffix":"Requirements refinement and rapi"},{"type":"PageSelector","index":12,"label":"13"}]}]}
>```
>%%
>*%%PREFIX%%t programs, and turn them loose.%%HIGHLIGHT%% ==The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.== %%POSTFIX%%Requirements refinement and rapi*
>%%LINK%%[[#^zm63kpzvr2q|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^zm63kpzvr2q


>%%
>```annotation-json
>{"created":"2026-11-10T13:10:08.183Z","text":".","updated":"2026-11-10T13:10:08.183Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40313,"end":40449},{"type":"TextQuoteSelector","exact":"Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.","prefix":"ndreds of laboratory scientists. ","suffix":" No other part of the conceptual"},{"type":"PageSelector","index":12,"label":"13"}]}]}
>```
>%%
>*%%PREFIX%%ndreds of laboratory scientists.%%HIGHLIGHT%% ==Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.== %%POSTFIX%%No other part of the conceptual*
>%%LINK%%[[#^14gm56fc3zwd|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^14gm56fc3zwd


>%%
>```annotation-json
>{"created":"2026-11-10T13:10:43.052Z","text":".","updated":"2026-11-10T13:10:43.052Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40912,"end":40968},{"type":"TextQuoteSelector","exact":"For the truth is, the clients do not know what they want.","prefix":"nt of the product requirements. ","suffix":" They usually do not know what q"},{"type":"PageSelector","index":12,"label":"13"}]}]}
>```
>%%
>*%%PREFIX%%nt of the product requirements.%%HIGHLIGHT%% ==For the truth is, the clients do not know what they want.== %%POSTFIX%%They usually do not know what q*
>%%LINK%%[[#^spwoqgulnam|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^spwoqgulnam


>%%
>```annotation-json
>{"created":"2026-11-10T13:10:54.746Z","text":".","updated":"2026-11-10T13:10:54.746Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41113,"end":41244},{"type":"TextQuoteSelector","exact":"Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.","prefix":"e detail that must be specified. ","suffix":" Clients never want exactly that."},{"type":"PageSelector","index":12,"label":"13"}]}]}
>```
>%%
>*%%PREFIX%%e detail that must be specified.%%HIGHLIGHT%% ==Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.== %%POSTFIX%%Clients never want exactly that.*
>%%LINK%%[[#^eikgl68ua48|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^eikgl68ua48


>%%
>```annotation-json
>{"created":"2026-11-10T13:11:26.033Z","text":".","updated":"2026-11-10T13:11:26.033Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41561,"end":41860},{"type":"TextQuoteSelector","exact":"I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.","prefix":"s part of the system definition. ","suffix":""},{"type":"PageSelector","index":12,"label":"13"}]}]}
>```
>%%
>*%%PREFIX%%s part of the system definition.%%HIGHLIGHT%% ==I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.== %%POSTFIX%%*
>%%LINK%%[[#^k3d5e5ivcdq|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^k3d5e5ivcdq


>%%
>```annotation-json
>{"created":"2026-11-10T13:12:21.506Z","text":".","updated":"2026-11-10T13:12:21.506Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42610,"end":42749},{"type":"TextQuoteSelector","exact":"The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability","prefix":"lid inputs, abort cleanly, etc. ","suffix":"Much of present-day software acq"},{"type":"PageSelector","index":13,"label":"14"}]}]}
>```
>%%
>*%%PREFIX%%lid inputs, abort cleanly, etc.%%HIGHLIGHT%% ==The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability== %%POSTFIX%%Much of present-day software acq*
>%%LINK%%[[#^l6116faqbyh|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^l6116faqbyh


>%%
>```annotation-json
>{"created":"2026-11-10T13:13:07.455Z","text":"https://agilemanifesto.org/authors.html","updated":"2026-11-10T13:13:07.455Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42749,"end":43058},{"type":"TextQuoteSelector","exact":"Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.","prefix":" it for consistency and usability ","suffix":" Hence they cannot be fixed witho"},{"type":"PageSelector","index":13,"label":"14"}]}]}
>```
>%%
>*%%PREFIX%%it for consistency and usability%%HIGHLIGHT%% ==Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.== %%POSTFIX%%Hence they cannot be fixed witho*
>%%LINK%%[[#^ta0co6qjc6d|show annotation]]
>%%COMMENT%%
>https://agilemanifesto.org/authors.html
>%%TAGS%%
>
^ta0co6qjc6d


>%%
>```annotation-json
>{"created":"2026-11-10T13:13:35.689Z","text":".","updated":"2026-11-10T13:13:35.689Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43203,"end":43253},{"type":"TextQuoteSelector","exact":"Incremental development−grow, not build, software.","prefix":"tion of prototypes and products. ","suffix":" I still remember the jolt I fel"},{"type":"PageSelector","index":13,"label":"14"}]}]}
>```
>%%
>*%%PREFIX%%tion of prototypes and products.%%HIGHLIGHT%% ==Incremental development−grow, not build, software.== %%POSTFIX%%I still remember the jolt I fel*
>%%LINK%%[[#^ucs8dz59q1g|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^ucs8dz59q1g


>%%
>```annotation-json
>{"created":"2026-11-10T13:13:56.542Z","text":".","updated":"2026-11-10T13:13:56.542Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43687,"end":43736},{"type":"TextQuoteSelector","exact":"The building metaphor has outlived its usefulness","prefix":" of components, and scaffolding. ","suffix":". It is time to change again. If"},{"type":"PageSelector","index":13,"label":"14"}]}]}
>```
>%%
>*%%PREFIX%%of components, and scaffolding.%%HIGHLIGHT%% ==The building metaphor has outlived its usefulness== %%POSTFIX%%. It is time to change again. If*
>%%LINK%%[[#^l87arq847gq|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^l87arq847gq


>%%
>```annotation-json
>{"created":"2026-11-10T13:14:51.449Z","text":".","updated":"2026-11-10T13:14:51.449Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45231,"end":45384},{"type":"TextQuoteSelector","exact":"Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.","prefix":"out of what is already there. 11 ","suffix":""},{"type":"PageSelector","index":13,"label":"14"}]}]}
>```
>%%
>*%%PREFIX%%out of what is already there. 11%%HIGHLIGHT%% ==Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.== %%POSTFIX%%*
>%%LINK%%[[#^h6tmealho1b|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^h6tmealho1b


>%%
>```annotation-json
>{"created":"2026-11-10T13:15:41.748Z","text":".","updated":"2026-11-10T13:15:41.748Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43975,"end":44305},{"type":"TextQuoteSelector","exact":"Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.","prefix":"e a radically different approach. ","suffix":"So it must be with our software "},{"type":"PageSelector","index":13,"label":"14"}]}]}
>```
>%%
>*%%PREFIX%%e a radically different approach.%%HIGHLIGHT%% ==Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.== %%POSTFIX%%So it must be with our software*
>%%LINK%%[[#^z9rqoddbhek|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^z9rqoddbhek


>%%
>```annotation-json
>{"created":"2026-11-10T13:18:40.436Z","text":".","updated":"2026-11-10T13:18:40.436Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45466,"end":45566},{"type":"TextQuoteSelector","exact":"The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.","prefix":"n software engineering (1986) 15 ","suffix":" Efforts redouble when the first"},{"type":"PageSelector","index":14,"label":"15"}]}]}
>```
>%%
>*%%PREFIX%%n software engineering (1986) 15%%HIGHLIGHT%% ==The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.== %%POSTFIX%%Efforts redouble when the first*
>%%LINK%%[[#^pnvpwm0kfph|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^pnvpwm0kfph


>%%
>```annotation-json
>{"created":"2026-11-10T13:23:47.220Z","text":".","updated":"2026-11-10T13:23:47.220Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46138,"end":46236},{"type":"TextQuoteSelector","exact":"Programmers are among the most intelligent part of the population, so they can learn good practice.","prefix":"design practices can be taught. ","suffix":" Thus a major thrust in the Unit"},{"type":"PageSelector","index":14,"label":"15"}]}]}
>```
>%%
>*%%PREFIX%%design practices can be taught.%%HIGHLIGHT%% ==Programmers are among the most intelligent part of the population, so they can learn good practice.== %%POSTFIX%%Thus a major thrust in the Unit*
>%%LINK%%[[#^659tbk1url4|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^659tbk1url4


>%%
>```annotation-json
>{"created":"2026-11-10T13:25:47.548Z","text":".","updated":"2026-11-10T13:25:47.548Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":48605,"end":48988},{"type":"TextQuoteSelector","exact":"My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.","prefix":" products will ultimately depend. ","suffix":"How to grow great designers? Spa"},{"type":"PageSelector","index":15,"label":"16"}]}]}
>```
>%%
>*%%PREFIX%%products will ultimately depend.%%HIGHLIGHT%% ==My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.== %%POSTFIX%%How to grow great designers? Spa*
>%%LINK%%[[#^u3tbp9k9laq|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^u3tbp9k9laq


>%%
>```annotation-json
>{"created":"2026-11-10T13:26:47.607Z","text":".","updated":"2026-11-10T13:26:47.607Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49302,"end":49558},{"type":"TextQuoteSelector","exact":"Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.","prefix":", and keep a careful career file. ","suffix":"Provide opportunities for growin"},{"type":"PageSelector","index":15,"label":"16"}]}]}
>```
>%%
>*%%PREFIX%%, and keep a careful career file.%%HIGHLIGHT%% ==Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.== %%POSTFIX%%Provide opportunities for growin*
>%%LINK%%[[#^obag3lnbk6|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^obag3lnbk6


>%%
>```annotation-json
>{"created":"2026-11-10T13:27:00.026Z","text":".","updated":"2026-11-10T13:27:00.026Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49558,"end":49644},{"type":"TextQuoteSelector","exact":"Provide opportunities for growing designers to interact with and stimulate each other.","prefix":"technical leadership assignments. ","suffix":"■"},{"type":"PageSelector","index":15,"label":"16"}]}]}
>```
>%%
>*%%PREFIX%%technical leadership assignments.%%HIGHLIGHT%% ==Provide opportunities for growing designers to interact with and stimulate each other.== %%POSTFIX%%■*
>%%LINK%%[[#^839csn14pzu|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^839csn14pzu


>%%
>```annotation-json
>{"created":"2026-11-10T13:27:10.341Z","text":".","updated":"2026-11-10T13:27:10.341Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47979,"end":48089},{"type":"TextQuoteSelector","exact":"Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.","prefix":"ways to grow great designers. 12 ","suffix":""},{"type":"PageSelector","index":14,"label":"15"}]}]}
>```
>%%
>*%%PREFIX%%ways to grow great designers. 12%%HIGHLIGHT%% ==Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.== %%POSTFIX%%*
>%%LINK%%[[#^tx89o2dg9y|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^tx89o2dg9y


>%%
>```annotation-json
>{"created":"2026-11-10T13:27:34.536Z","text":".","updated":"2026-11-10T13:27:34.536Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46599,"end":46776},{"type":"TextQuoteSelector","exact":"Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.","prefix":"ext step upward in the same way. ","suffix":" Great designs come from great d"},{"type":"PageSelector","index":14,"label":"15"}]}]}
>```
>%%
>*%%PREFIX%%ext step upward in the same way.%%HIGHLIGHT%% ==Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.== %%POSTFIX%%Great designs come from great d*
>%%LINK%%[[#^oxueoddlujp|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^oxueoddlujp


>%%
>```annotation-json
>{"created":"2026-11-10T13:27:44.860Z","text":".","updated":"2026-11-10T13:27:44.860Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47176,"end":47256},{"type":"TextQuoteSelector","exact":"The differences between the great and the average approach an order of magnitude.","prefix":" and produced with less effort. ","suffix":"A little retrospection shows tha"},{"type":"PageSelector","index":14,"label":"15"}]}]}
>```
>%%
>*%%PREFIX%%and produced with less effort.%%HIGHLIGHT%% ==The differences between the great and the average approach an order of magnitude.== %%POSTFIX%%A little retrospection shows tha*
>%%LINK%%[[#^6jf16b2d9lw|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^6jf16b2d9lw


>%%
>```annotation-json
>{"created":"2026-11-10T13:30:35.458Z","text":".","updated":"2026-11-10T13:30:35.458Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28690,"end":28836},{"type":"TextQuoteSelector","exact":"Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.","prefix":"n software engineering (1986) 10 ","suffix":" Some systems for integrating dif"},{"type":"PageSelector","index":9,"label":"10"}]}]}
>```
>%%
>*%%PREFIX%%n software engineering (1986) 10%%HIGHLIGHT%% ==Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.== %%POSTFIX%%Some systems for integrating dif*
>%%LINK%%[[#^gydte98pz3n|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^gydte98pz3n


>%%
>```annotation-json
>{"created":"2026-11-10T13:30:54.879Z","text":".","updated":"2026-11-10T13:30:54.879Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":29055,"end":29355},{"type":"TextQuoteSelector","exact":"These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.","prefix":", and generated the programs. • • • • ","suffix":"It is hard to see how such techn"},{"type":"PageSelector","index":9,"label":"10"}]}]}
>```
>%%
>*%%PREFIX%%, and generated the programs. • • • •%%HIGHLIGHT%% ==These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.== %%POSTFIX%%It is hard to see how such techn*
>%%LINK%%[[#^ojjhhp38yqd|show annotation]]
>%%COMMENT%%
>.
>%%TAGS%%
>
^ojjhhp38yqd


>%%
>```annotation-json
>{"created":"2026-11-10T15:08:41.636Z","text":"I'm not certain about the range of 1986-1996, but I can at least safely say that we've safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I've seen ideas go from realization -> ideation -> implementation -> review -> release in a day's time.\n\nOf course, the claim I've seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).\n\nThe way I've put it, colloquially, is that in a situation where you're at a physical assembly line and a machine in the middle speeds up by 1000%, you're not looking at a 1000% increase in productivity across the assembly line. You're looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren't moving fast enough, and that the review process has [[public/content/notes/natural-language-cve.md|largely caught on fire]].","updated":"2026-11-10T15:08:41.636Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2665,"end":2738},{"type":"TextQuoteSelector","exact":"But, as we look to the horizon of a decade hence, we see no silver bullet","prefix":"ly as computer hardware costs do. ","suffix":". There is no single development,"},{"type":"PageSelector","index":1,"label":"2"}]}]}
>```
>%%
>*%%PREFIX%%ly as computer hardware costs do.%%HIGHLIGHT%% ==But, as we look to the horizon of a decade hence, we see no silver bullet== %%POSTFIX%%. There is no single development,*
>%%LINK%%[[#^sxlthsl8nr|show annotation]]
>%%COMMENT%%
>I'm not certain about the range of 1986-1996, but I can at least safely say that we've safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I've seen ideas go from realization -> ideation -> implementation -> review -> release in a day's time.
>
>Of course, the claim I've seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).
>
>The way I've put it, colloquially, is that in a situation where you're at a physical assembly line and a machine in the middle speeds up by 1000%, you're not looking at a 1000% increase in productivity across the assembly line. You're looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren't moving fast enough, and that the review process has [[public/content/notes/natural-language-cve.md|largely caught on fire]].
>%%TAGS%%
>
^sxlthsl8nr


>%%
>```annotation-json
>{"created":"2026-11-10T15:13:51.277Z","text":"This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It's not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones -- time developing features, versus time developing fixes -- is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it's the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.","updated":"2026-11-10T15:13:51.277Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2817,"end":2927},{"type":"TextQuoteSelector","exact":"which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.","prefix":"nology or management technique, ","suffix":" In this chapter we shall try to"},{"type":"PageSelector","index":1,"label":"2"}]}]}
>```
>%%
>*%%PREFIX%%nology or management technique,%%HIGHLIGHT%% ==which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.== %%POSTFIX%%In this chapter we shall try to*
>%%LINK%%[[#^5v8w05h0q8t|show annotation]]
>%%COMMENT%%
>This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It's not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones -- time developing features, versus time developing fixes -- is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it's the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.
>%%TAGS%%
>
^5v8w05h0q8t


>%%
>```annotation-json
>{"created":"2026-11-10T15:14:47.358Z","text":"I'll be ~~stealing~~ quoting \"Skepticism is not pessimism\" in my future apologetics around LLMs and agentic development.","updated":"2026-11-10T15:14:47.358Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":3065,"end":3261},{"type":"TextQuoteSelector","exact":"Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.","prefix":"perties of the bullets proposed. ","suffix":" A disciplined, consistent effor"},{"type":"PageSelector","index":1,"label":"2"}]}]}
>```
>%%
>*%%PREFIX%%perties of the bullets proposed.%%HIGHLIGHT%% ==Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.== %%POSTFIX%%A disciplined, consistent effor*
>%%LINK%%[[#^0vplvym3cbrg|show annotation]]
>%%COMMENT%%
>I'll be ~~stealing~~ quoting "Skepticism is not pessimism" in my future apologetics around LLMs and agentic development.
>%%TAGS%%
>
^0vplvym3cbrg


>%%
>```annotation-json
>{"created":"2026-11-10T15:21:52.536Z","text":"I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.\n\nTo make sure I'm not discounting the point, though, I do think that it's worth softening it to \"The essential part of software engineering is hard(er to optimize)\", which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I've found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [[public/content/notes/software-gardening.mdx#Feedforward & Feedback|rapid and determinstic feedback]].\n\nWhat I've found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for... too many reasons to get into, here, but fundamentally comes down to the constraint that \"write code faster\" and \"help humans understand code faster\" are two very, *very* different engineering problems.","updated":"2026-11-10T21:18:39.988Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5782,"end":5874},{"type":"TextQuoteSelector","exact":"If this is true, building software will always be hard. There is inherently no silver bullet.","prefix":"in software engineering (1986) 3 ","suffix":"Let us consider the inherent pro"},{"type":"PageSelector","index":2,"label":"3"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^kfxwncrsfe]]"}}
>```
>%%
>*%%PREFIX%%in software engineering (1986) 3%%HIGHLIGHT%% ==If this is true, building software will always be hard. There is inherently no silver bullet.== %%POSTFIX%%Let us consider the inherent pro*
>%%LINK%%[[#^kfxwncrsfe|show annotation]]
>%%COMMENT%%
>I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.
>
>To make sure I'm not discounting the point, though, I do think that it's worth softening it to "The essential part of software engineering is hard(er to optimize)", which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I've found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [[public/content/notes/software-gardening.mdx#Feedforward & Feedback|rapid and determinstic feedback]].
>
>What I've found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for... too many reasons to get into, here, but fundamentally comes down to the constraint that "write code faster" and "help humans understand code faster" are two very, *very* different engineering problems.
>%%TAGS%%
>
^kfxwncrsfe


>%%
>```annotation-json
>{"created":"2026-11-10T21:57:54.385Z","text":"Gah -- this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn't mean the work to keep them runnable has (or will ever) end.","updated":"2026-11-10T21:57:54.385Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":10658,"end":11227},{"type":"TextQuoteSelector","exact":"All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.","prefix":" dampen the whim of the changers. ","suffix":"In short, the software product i"},{"type":"PageSelector","index":3,"label":"4"}]}]}
>```
>%%
>*%%PREFIX%%dampen the whim of the changers.%%HIGHLIGHT%% ==All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.== %%POSTFIX%%In short, the software product i*
>%%LINK%%[[#^wwj4u960f7|show annotation]]
>%%COMMENT%%
>Gah -- this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn't mean the work to keep them runnable has (or will ever) end.
>%%TAGS%%
>
^wwj4u960f7


>%%
>```annotation-json
>{"created":"2026-11-13T14:41:40.886Z","text":"*Again* with the *absolutes* here, Brooks!\n\nI think \"unvisualizable\" concedes defeat before the fight has really started out. I'd once again summon up [[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces.md|boundary objects]]. My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.\n\nA [recent video about Britain's National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it's to get an immediate working knowledge of any issues worth addressing.\n\nI would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize -- not impossible. The analogy I'd pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some \"most significant\" visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:\n\n1. Steps and catalog configurations themselves;\n2. Storage mediums (S3, local system, etc.)\n\nUltimately, it's just making sure you understand what a developer's necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.","updated":"2026-11-13T14:41:40.886Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":11453,"end":11494},{"type":"TextQuoteSelector","exact":"Software is invisible and unvisualizable.","prefix":" software product. Invisibility. ","suffix":" Geometric abstractions are power"},{"type":"PageSelector","index":3,"label":"4"}]}]}
>```
>%%
>*%%PREFIX%%software product. Invisibility.%%HIGHLIGHT%% ==Software is invisible and unvisualizable.== %%POSTFIX%%Geometric abstractions are power*
>%%LINK%%[[#^ncf9kp5bnq|show annotation]]
>%%COMMENT%%
>*Again* with the *absolutes* here, Brooks!
>
>I think "unvisualizable" concedes defeat before the fight has really started out. I'd once again summon up [[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces.md|boundary objects]]. My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.
>
>A [recent video about Britain's National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it's to get an immediate working knowledge of any issues worth addressing.
>
>I would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize -- not impossible. The analogy I'd pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some "most significant" visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:
>
>1. Steps and catalog configurations themselves;
>2. Storage mediums (S3, local system, etc.)
>
>Ultimately, it's just making sure you understand what a developer's necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.
>%%TAGS%%
>
^ncf9kp5bnq


>%%
>```annotation-json
>{"created":"2026-11-13T15:13:22.608Z","text":"*In a world **before** Agile...*\n\nAll things considered, I'm glad to see management technique incorporated into an analysis of engineering optimization.","updated":"2026-11-13T15:13:22.608Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2771,"end":2815},{"type":"TextQuoteSelector","exact":"in either technology or management technique","prefix":" There is no single development, ","suffix":", which by itself promises even o"},{"type":"PageSelector","index":1,"label":"2"}]}]}
>```
>%%
>*%%PREFIX%%There is no single development,%%HIGHLIGHT%% ==in either technology or management technique== %%POSTFIX%%, which by itself promises even o*
>%%LINK%%[[#^kds1hgm51rl|show annotation]]
>%%COMMENT%%
>*In a world **before** Agile...*
>
>All things considered, I'm glad to see management technique incorporated into an analysis of engineering optimization.
>%%TAGS%%
>
^kds1hgm51rl


>%%
>```annotation-json
>{"created":"2026-11-13T17:35:31.514Z","text":"If I understand correctly, a distinguishing difference between these two systems would be something like an \"AI\" chess player (say, [Deep Blue](https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer))) that's written by humans, in code, to do more advanced tasks. The qualification Brooks has next (that this is a sliding scale) has largely slid off the edge, now that some of the most advanced behaviors are expressed through network weights rather than straight-up code: ","updated":"2026-11-13T17:44:58.106Z","document":{"title":"No Silver Bullet – Essence and Accident in Software Engineering","link":[{"href":"urn:x-pdf:4c3b2ffb168efc85024df33a5623b254"},{"href":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf"}],"documentFingerprint":"4c3b2ffb168efc85024df33a5623b254"},"uri":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","target":[{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21404,"end":21681},{"type":"TextQuoteSelector","exact":"Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.","prefix":"rified the terminological chaos: ","suffix":" In this approach human experts "},{"type":"PageSelector","index":6,"label":"7"}]}],"links":{"html":"[[public/content/no-silver-bullet-1986#^hfp5csllcv]]"}}
>```
>%%
>*%%PREFIX%%rified the terminological chaos:%%HIGHLIGHT%% ==Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.== %%POSTFIX%%In this approach human experts*
>%%LINK%%[[#^hfp5csllcv|show annotation]]
>%%COMMENT%%
>If I understand correctly, a distinguishing difference between these two systems would be something like an "AI" chess player (say, [Deep Blue](https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer))) that's written by humans, in code, to do more advanced tasks. The qualification Brooks has next (that this is a sliding scale) has largely slid off the edge, now that some of the most advanced behaviors are expressed through network weights rather than straight-up code: 
>%%TAGS%%
>
^hfp5csllcv









[^1]: Technically, [essential and accidental](https://en.wikipedia.org/wiki/Accident_(philosophy)) is Aristotle's territory, but I'm not certain Aristotle had many passionate opinions about the act of software development. From what I can tell, he also focused more on nouns (e.g. what is a chair, *really?*), while Brooks focuses more on the trade of software engineering itself.
[^2]: He actually does talk about generative AI and expert systems. These promises have been on the horizon for awhile now. I talk more about that in [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]
[^3]: I'm not claiming quality, here: just speed.