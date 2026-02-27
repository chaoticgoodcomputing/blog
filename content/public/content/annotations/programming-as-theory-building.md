---
title: Agentic Programming as Theory Building
date: 2026-02-12
tags:
  - writing/highlights
  - engineering/ai
  - engineering
  - economics/strategy
  - writing/annotations
description: Do humans have a role in software development anymore? Absolutely — but we need to rethink what it means to program. An modern review of Peter Naur's 1985 essay "Programming as Theory Building"
annotation-target: https://pablo.rauzy.name/dev/naur1985programming.pdf
---



>%%
>```annotation-json
>{"text":"Ah — we all have a dumb moment like this, don't we?\n\nI did recently pitch a PR into [Obsidian Copilot](https://github.com/logancyang/obsidian-copilot/pull/2134) to fix a bug with local thinking models. It was a \"clever\" solution to what ultimately ended up to be a simple matter of ticking up a package dependency version. In hindsight, my solution wasn't *totally* out of line — there were other, similar solutions to the problem in the source code — and the maintainer was very polite in the declination. It's still a bit embarrassing, though. *Woof.*\n\nThis paper, I think, addresses the recent trend of [OSS projects being inundated with \"low-effort\" pull requests](https://theshamblog.com/an-ai-agent-published-a-hit-piece-on-me/). I feel like I've become a good enough developer to actually make material, worthwhile contributions to OSS projects, but this happens to coincide with an era of strain on maintainers that I would feel horrible contributing to with hard misses like the Copilot one.\n\nIn trying to set an internal benchmark of what a \"high-effort\" contribution would be, then, is to ask myself \"Do the changes I've made align with the apparent theory of the package I'm contributing to?\" For reasons apparent later about what \"theory\" even means, this is something that an LLM is poorly-suited to accomplish.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":4655,"end":4716},{"type":"TextQuoteSelector","exact":"The members of group A wereable to spot these cases instantly","prefix":"troyedits power and simplicity.","suffix":"and could propose sim-ple and e"}]}],"created":"2026-02-12T20:16:35.855Z","updated":"2026-02-12T20:16:35.855Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%troyedits power and simplicity.%%HIGHLIGHT%% ==The members of group A wereable to spot these cases instantly== %%POSTFIX%%and could propose sim-ple and e*
>%%LINK%%[[#^r65bn6ocic|show annotation]]
>%%COMMENT%%
>Ah — we all have a dumb moment like this, don't we?
>
>I did recently pitch a PR into [Obsidian Copilot](https://github.com/logancyang/obsidian-copilot/pull/2134) to fix a bug with local thinking models. It was a "clever" solution to what ultimately ended up to be a simple matter of ticking up a package dependency version. In hindsight, my solution wasn't *totally* out of line — there were other, similar solutions to the problem in the source code — and the maintainer was very polite in the declination. It's still a bit embarrassing, though. *Woof.*
>
>This paper, I think, addresses the recent trend of [OSS projects being inundated with "low-effort" pull requests](https://theshamblog.com/an-ai-agent-published-a-hit-piece-on-me/). I feel like I've become a good enough developer to actually make material, worthwhile contributions to OSS projects, but this happens to coincide with an era of strain on maintainers that I would feel horrible contributing to with hard misses like the Copilot one.
>
>In trying to set an internal benchmark of what a "high-effort" contribution would be, then, is to ask myself "Do the changes I've made align with the apparent theory of the package I'm contributing to?" For reasons apparent later about what "theory" even means, this is something that an LLM is poorly-suited to accomplish.
>%%TAGS%%
>
^r65bn6ocic


>%%
>```annotation-json
>{"text":"> [!QUOTE]\n> - **World 3 (the products of the\nhuman mind):**\n>   - (6) Works of Art and of Science (including\nTechnology);\n>   - (5) Human Language. Theories of Self and of Death\n> - **World 2 (the world of subjective experiences):**\n>   - (4) Consciousness of Self and of Death;\n>   - (3) Sentience (Animal Consciousness)\n> - **World 1 (the world of\nphysical objects)**:\n>   - (2) Living Organisms;\n>   - (1) The Heavier Elements; Liquids and Crystals;\n>   - (0) Hydrogen and Helium\n>\n> — [The Self and Its Brain](https://api.pageplace.de/preview/DT0400.9781135973544_A23812712/preview-9781135973544_A23812712.pdf) (1977)\n\nThis framework extends on Ryle's work. In reading through the rest of the paper, I feel it helpful to frame these in terms of [exploration-exploitation](https://en.wikipedia.org/wiki/Exploration%E2%80%93exploitation_dilemma) — the acts of learning information from the world around you to develop theories, and of using your theories to act on the world around you. I'll refer to these in the more appropriate terms \"learning\" and \"doing\":\n\n1. When **learning**, the physical world (World 1) is interpreted by your self (World 2) and used to form theories (World 3); and\n2. When **doing**, your theories (World 3) pass through your self (World 2) to be expressed physically (World 1).\n\nIt's important to understand that this process, as framed by Naur and his sources, is **lossy** — when something is learned (1→2→3) and then used to act (3→2→1), the resulting action won't be exactly like the original physical entity the information was learned from. It's like [fried JPEGs](https://en.wikipedia.org/wiki/Internet_meme#/media/File:Deep_fried_meme.jpg) — in feeding the original input through a lossy process and then re-outputting it, the result is materially-different than the original.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":7981,"end":8152},{"type":"TextQuoteSelector","exact":"It may be noted that Ryle’s notion of the-ory appears as an example of what K. Popper [10] callsunembodied World 3 objects and thus has a defensiblephilosophical standing.","prefix":", about the activity ofconcern.","suffix":"In the present section we shall"}]}],"created":"2026-02-12T20:36:04.435Z","updated":"2026-02-12T20:36:04.435Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%, about the activity ofconcern.%%HIGHLIGHT%% ==It may be noted that Ryle’s notion of the-ory appears as an example of what K. Popper [10] callsunembodied World 3 objects and thus has a defensiblephilosophical standing.== %%POSTFIX%%In the present section we shall*
>%%LINK%%[[#^xyqsakipfws|show annotation]]
>%%COMMENT%%
>> [!QUOTE]
>> - **World 3 (the products of the
>human mind):**
>>   - (6) Works of Art and of Science (including
>Technology);
>>   - (5) Human Language. Theories of Self and of Death
>> - **World 2 (the world of subjective experiences):**
>>   - (4) Consciousness of Self and of Death;
>>   - (3) Sentience (Animal Consciousness)
>> - **World 1 (the world of
>physical objects)**:
>>   - (2) Living Organisms;
>>   - (1) The Heavier Elements; Liquids and Crystals;
>>   - (0) Hydrogen and Helium
>>
>> — [The Self and Its Brain](https://api.pageplace.de/preview/DT0400.9781135973544_A23812712/preview-9781135973544_A23812712.pdf) (1977)
>
>This framework extends on Ryle's work. In reading through the rest of the paper, I feel it helpful to frame these in terms of [exploration-exploitation](https://en.wikipedia.org/wiki/Exploration%E2%80%93exploitation_dilemma) — the acts of learning information from the world around you to develop theories, and of using your theories to act on the world around you. I'll refer to these in the more appropriate terms "learning" and "doing":
>
>1. When **learning**, the physical world (World 1) is interpreted by your self (World 2) and used to form theories (World 3); and
>2. When **doing**, your theories (World 3) pass through your self (World 2) to be expressed physically (World 1).
>
>It's important to understand that this process, as framed by Naur and his sources, is **lossy** — when something is learned (1→2→3) and then used to act (3→2→1), the resulting action won't be exactly like the original physical entity the information was learned from. It's like [fried JPEGs](https://en.wikipedia.org/wiki/Internet_meme#/media/File:Deep_fried_meme.jpg) — in feeding the original input through a lossy process and then re-outputting it, the result is materially-different than the original.
>%%TAGS%%
>
^xyqsakipfws


>%%
>```annotation-json
>{"text":"This is going to rely heavily on the above World 1/2/3 framework. To use the Group A/B example, that there is no amount of source code or documentation that is sufficient to fully reconstruct a theory. That is to say, when Group A writes code and docs (3-A→2-A→1), and Group B reads the code (1→2-B→3-B), that there fundamentally will be some misalignment in the theories between Groups A and B — that `3-A ≠ 3-B`.\n\nWhen working with LLMs, we do actually have a good analog for the transition from physical space into theory: [[/content/annotations/llm-starter|embedding, attention, and context]].\n\nBack in the early days of LLM agent usage, I used to think that filling the context window with a shitload of documentation was king — after all, if the documentation (seemingly) fully describes the program, won't that lead to better code? The answer is \"absolutely not.\"\n\nNaur goes over this more in the bottom of the document, about actual practice, but I think that this idea — that the theory is something beyond the source code — meshes well with both my understanding of agents and my personal experiences in trying to \"resurrect\" projects from only the source code.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":12104,"end":12317},{"type":"TextQuoteSelector","exact":"basicissue is to show how the knowledge possessed by the pro-grammer by virtue of his or her having the theory neces-sarily, and in an essential manner, transcends that whichis recorded in the documented products.","prefix":"r the Theory Building View, the","suffix":"The answers tothis issue is tha"}]}],"created":"2026-02-12T21:06:34.659Z","updated":"2026-02-12T21:06:34.659Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%r the Theory Building View, the%%HIGHLIGHT%% ==basicissue is to show how the knowledge possessed by the pro-grammer by virtue of his or her having the theory neces-sarily, and in an essential manner, transcends that whichis recorded in the documented products.== %%POSTFIX%%The answers tothis issue is tha*
>%%LINK%%[[#^g8c0n3jpeuj|show annotation]]
>%%COMMENT%%
>This is going to rely heavily on the above World 1/2/3 framework. To use the Group A/B example, that there is no amount of source code or documentation that is sufficient to fully reconstruct a theory. That is to say, when Group A writes code and docs (3-A→2-A→1), and Group B reads the code (1→2-B→3-B), that there fundamentally will be some misalignment in the theories between Groups A and B — that `3-A ≠ 3-B`.
>
>When working with LLMs, we do actually have a good analog for the transition from physical space into theory: [[/content/annotations/llm-starter|embedding, attention, and context]].
>
>Back in the early days of LLM agent usage, I used to think that filling the context window with a shitload of documentation was king — after all, if the documentation (seemingly) fully describes the program, won't that lead to better code? The answer is "absolutely not."
>
>Naur goes over this more in the bottom of the document, about actual practice, but I think that this idea — that the theory is something beyond the source code — meshes well with both my understanding of agents and my personal experiences in trying to "resurrect" projects from only the source code.
>%%TAGS%%
>
^g8c0n3jpeuj


>%%
>```annotation-json
>{"text":"This certainly relates back to the Group A/B example from above, but to bring in some modern context — I think that this describes the (potentially inescapable problem) of LLM agent corrects. If you've worked with agents — especially in trying to increase their ability to make autonomous, asynchronous changes — you'll likely read this and have a flashback to the most recent time you had to intervene in an agents' work after it completely missed the mark.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":6832,"end":7102},{"type":"TextQuoteSelector","exact":"regularly encounter difficultiesthat upon consultation with the producer’s installationand fault finding programmer are traced to inadequateunderstanding of the existing documentation, but whichcan be cleared up easily by the installation and fault find-ing programmers.","prefix":"s usefrom the producer’s staff,","suffix":"The conclusion seems inescapable"}]}],"created":"2026-02-12T20:29:35.210Z","updated":"2026-02-12T20:29:35.210Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%s usefrom the producer’s staff,%%HIGHLIGHT%% ==regularly encounter difficultiesthat upon consultation with the producer’s installationand fault finding programmer are traced to inadequateunderstanding of the existing documentation, but whichcan be cleared up easily by the installation and fault find-ing programmers.== %%POSTFIX%%The conclusion seems inescapable*
>%%LINK%%[[#^8mgin1j88rh|show annotation]]
>%%COMMENT%%
>This certainly relates back to the Group A/B example from above, but to bring in some modern context — I think that this describes the (potentially inescapable problem) of LLM agent corrects. If you've worked with agents — especially in trying to increase their ability to make autonomous, asynchronous changes — you'll likely read this and have a flashback to the most recent time you had to intervene in an agents' work after it completely missed the mark.
>%%TAGS%%
>
^8mgin1j88rh


>%%
>```annotation-json
>{"text":"This reference to Gilbert Ryle's *The Concept of the Mind* is the first of many extensions out to the realm of philosophy in this paper. I read only excerpts to get an overview of what Naur is referencing, here, and the TL;DR is that there exists your mind, and your body. Here, we're loading the term \"theory\" to be referenced as something that is ultimately a product of the mind, but expressed by the physical actions of the body.\n\nThis will come into play a lot, later — especially in the later World 1/2/3 references through Popper's work. If you take nothing else from this, take this:\n\n**Theories are purely ideas, and the transition between theory and physical action is a lossy process.**","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":7604,"end":7749},{"type":"TextQuoteSelector","exact":"What will be considered here is the sugges-tion that the programmers’ knowledge properly shouldbe regarded as a theory, in the sense of Ryle [11]","prefix":"ize that knowledgemore closely.","suffix":". Verybriefly, a person who has"}]}],"created":"2026-02-12T20:31:36.632Z","updated":"2026-02-12T20:31:36.632Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ize that knowledgemore closely.%%HIGHLIGHT%% ==What will be considered here is the sugges-tion that the programmers’ knowledge properly shouldbe regarded as a theory, in the sense of Ryle [11]== %%POSTFIX%%. Verybriefly, a person who has*
>%%LINK%%[[#^lim2ljf2emn|show annotation]]
>%%COMMENT%%
>This reference to Gilbert Ryle's *The Concept of the Mind* is the first of many extensions out to the realm of philosophy in this paper. I read only excerpts to get an overview of what Naur is referencing, here, and the TL;DR is that there exists your mind, and your body. Here, we're loading the term "theory" to be referenced as something that is ultimately a product of the mind, but expressed by the physical actions of the body.
>
>This will come into play a lot, later — especially in the later World 1/2/3 references through Popper's work. If you take nothing else from this, take this:
>
>**Theories are purely ideas, and the transition between theory and physical action is a lossy process.**
>%%TAGS%%
>
^lim2ljf2emn


>%%
>```annotation-json
>{"text":"Stepping back from my hoity-toity high horse in the last annotation.\n\nGeneralizable patterns and theories are wildly satisfying. Seeing this in the wild makes my brain light up — a good example of this is the number of physicists that crop up in [[/content/annotations/a-pattern-language/02-the-distribution-of-towns|early economics research]].","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":10902,"end":11172},{"type":"TextQuoteSelector","exact":"A person having Newton’s theory of mechanicsmust thus understand how it applies to the motions ofpendulums and the planets, and must be able to recog-nize similar phenomena in the world, so as to be able toemploy the mathematically expressed rules of the theoryproperly.","prefix":"theory to other similaraspects.","suffix":"The dependence of a theory on a"}]}],"created":"2026-02-12T20:52:17.665Z","updated":"2026-02-12T20:52:17.665Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%theory to other similaraspects.%%HIGHLIGHT%% ==A person having Newton’s theory of mechanicsmust thus understand how it applies to the motions ofpendulums and the planets, and must be able to recog-nize similar phenomena in the world, so as to be able toemploy the mathematically expressed rules of the theoryproperly.== %%POSTFIX%%The dependence of a theory on a*
>%%LINK%%[[#^xftcs3ch7x|show annotation]]
>%%COMMENT%%
>Stepping back from my hoity-toity high horse in the last annotation.
>
>Generalizable patterns and theories are wildly satisfying. Seeing this in the wild makes my brain light up — a good example of this is the number of physicists that crop up in [[/content/annotations/a-pattern-language/02-the-distribution-of-towns|early economics research]].
>%%TAGS%%
>
^xftcs3ch7x


>%%
>```annotation-json
>{"text":"I think that this does help orient against theory drift, which ties *so much* into the point made earlier about how a software designed only to accommodate future features holds its value entirely *in* the future.\n\nThat type of software lacks having a solution that related to the affairs of the world — it lacks a solid problem to which it's solving. I've also seen this in the progression of software made, especially in young OSS projects finding their footing as well as industry projects where stakeholders *also* aren't totally certain what the direction will be.\n\nUltimately, there is a distinction between a theory that is generalizable (akin to the physics reference above) and a theory that lacks specificity.\n\nThis idea of \"a problem that lacks a solution\" is something that I've had on my mind for awhile. Often, when explaining concepts (especially in a developer experience capacity), I've ripped off Simon Sinek's idea of [The Golden Circle](https://youtu.be/fMOlfsR7SMQ?&t=122). While it does smack of a certain LinkedIn-core flavor at this point in time, the framework — Why->How->What — can be very helpful to organize thoughts on an issue, or to orient a project's purpose.\n\nYou can see some of that (in reverse order) in the explanation made in the [[/content/annotations/llm-starter|LLM starter presentation]]. While I obviously didn't fully think this at the time, the reverse ordering of the presentation does mesh with the World 1/3 framework from Popper [10] — going from the literal physicality of \"what makes up an LLM\", into \"How do they function\", before finally stopping (literally) at \"why are they important for our line of work.\" Stopping for discussion at the \"why\" portion was both a practical decision (the presentation had gotten longer than I'd liked) as well as being an opportune time to fully cut off for an open discussion. I'm glad I did — I feel like, at that point, I'd have been prescribing theory rather than allowing it to develop in the audience.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":12451,"end":12589},{"type":"TextQuoteSelector","exact":"1) The programmer having the theory of the programcan explain how the solution relates to the affairs of theworld that it helps to handle.","prefix":"at least three essential ar-eas:","suffix":"Such an explanation willhave to"}]}],"created":"2026-02-12T21:17:39.944Z","updated":"2026-02-12T21:17:39.944Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%at least three essential ar-eas:%%HIGHLIGHT%% ==1) The programmer having the theory of the programcan explain how the solution relates to the affairs of theworld that it helps to handle.== %%POSTFIX%%Such an explanation willhave to*
>%%LINK%%[[#^f9gfm3h8w2|show annotation]]
>%%COMMENT%%
>I think that this does help orient against theory drift, which ties *so much* into the point made earlier about how a software designed only to accommodate future features holds its value entirely *in* the future.
>
>That type of software lacks having a solution that related to the affairs of the world — it lacks a solid problem to which it's solving. I've also seen this in the progression of software made, especially in young OSS projects finding their footing as well as industry projects where stakeholders *also* aren't totally certain what the direction will be.
>
>Ultimately, there is a distinction between a theory that is generalizable (akin to the physics reference above) and a theory that lacks specificity.
>
>This idea of "a problem that lacks a solution" is something that I've had on my mind for awhile. Often, when explaining concepts (especially in a developer experience capacity), I've ripped off Simon Sinek's idea of [The Golden Circle](https://youtu.be/fMOlfsR7SMQ?&t=122). While it does smack of a certain LinkedIn-core flavor at this point in time, the framework — Why->How->What — can be very helpful to organize thoughts on an issue, or to orient a project's purpose.
>
>You can see some of that (in reverse order) in the explanation made in the [[/content/annotations/llm-starter|LLM starter presentation]]. While I obviously didn't fully think this at the time, the reverse ordering of the presentation does mesh with the World 1/3 framework from Popper [10] — going from the literal physicality of "what makes up an LLM", into "How do they function", before finally stopping (literally) at "why are they important for our line of work." Stopping for discussion at the "why" portion was both a practical decision (the presentation had gotten longer than I'd liked) as well as being an opportune time to fully cut off for an open discussion. I'm glad I did — I feel like, at that point, I'd have been prescribing theory rather than allowing it to develop in the audience.
>%%TAGS%%
>
^f9gfm3h8w2


>%%
>```annotation-json
>{"text":"Ah — yes!! We love ourselves a metaphor.\n\nIn day-to-day work — especially in agentic development — I feel that this is one of the most important parts about using a directive in talking in [[/content/notes/pattern-languages-of-the-neighborhood|design patterns]]. The analog is a massive lift in alignment — for example, the term \"factory pattern\" is a two-word phrase that describes so much more than could be feasibly typed out.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":12832,"end":13017},{"type":"TextQuoteSelector","exact":"Thusthe programmer must be able to explain, for each partof the program text and for each of its overall structuralcharacteristics, what aspect or activity of the world ismatched by it.","prefix":"o any additional documentation.","suffix":"Conversely, for any aspect or a"}]}],"created":"2026-02-12T21:18:10.024Z","updated":"2026-02-12T21:18:10.024Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%o any additional documentation.%%HIGHLIGHT%% ==Thusthe programmer must be able to explain, for each partof the program text and for each of its overall structuralcharacteristics, what aspect or activity of the world ismatched by it.== %%POSTFIX%%Conversely, for any aspect or a*
>%%LINK%%[[#^ntogw53xaq|show annotation]]
>%%COMMENT%%
>Ah — yes!! We love ourselves a metaphor.
>
>In day-to-day work — especially in agentic development — I feel that this is one of the most important parts about using a directive in talking in [[/content/notes/pattern-languages-of-the-neighborhood|design patterns]]. The analog is a massive lift in alignment — for example, the term "factory pattern" is a two-word phrase that describes so much more than could be feasibly typed out.
>%%TAGS%%
>
^ntogw53xaq


>%%
>```annotation-json
>{"text":"This is the first of many statements that serves as a nice dose of copium in my anxious soul. I won't get into the question of \"do LLMs actually understand anything like we do?\" (they probably don't, but the qualifications to have a solid answer fall far more on the researchers and philosophers in that space). However, *even if they do*, I think that this reserves a special space for the human-in-the-loop.\n\nSpecifically, it ties back to the argument I've had many times: as a programmer, *what is your job?* It's not to write code — if it was to simply write code, you really would be boned. However, it's our job, as human beings that can work with the computations that permeate our lives, to understand (and experience) problems in the world and translate that into physical, digital solutions *to* those problems. Fundamentally, LLMs can only receive a *description* of a problem (World 1). Even if they were conscious, they could not *experience* a problem (World 3) — and so are an ill-fit to run the whole loop autonomously.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":13295,"end":13471},{"type":"TextQuoteSelector","exact":"However, the decision that a part of theworld is relevant can only be made by someone who un-derstands the whole world. This understanding must becontributed by the programmer.","prefix":"being irrelevant inthe context.","suffix":"2) The programmer having the the"}]}],"created":"2026-02-12T21:18:56.671Z","updated":"2026-02-12T21:18:56.671Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%being irrelevant inthe context.%%HIGHLIGHT%% ==However, the decision that a part of theworld is relevant can only be made by someone who un-derstands the whole world. This understanding must becontributed by the programmer.== %%POSTFIX%%2) The programmer having the the*
>%%LINK%%[[#^2pb0ljc3xig|show annotation]]
>%%COMMENT%%
>This is the first of many statements that serves as a nice dose of copium in my anxious soul. I won't get into the question of "do LLMs actually understand anything like we do?" (they probably don't, but the qualifications to have a solid answer fall far more on the researchers and philosophers in that space). However, *even if they do*, I think that this reserves a special space for the human-in-the-loop.
>
>Specifically, it ties back to the argument I've had many times: as a programmer, *what is your job?* It's not to write code — if it was to simply write code, you really would be boned. However, it's our job, as human beings that can work with the computations that permeate our lives, to understand (and experience) problems in the world and translate that into physical, digital solutions *to* those problems. Fundamentally, LLMs can only receive a *description* of a problem (World 1). Even if they were conscious, they could not *experience* a problem (World 3) — and so are an ill-fit to run the whole loop autonomously.
>%%TAGS%%
>
^2pb0ljc3xig


>%%
>```annotation-json
>{"text":"This does touch on the idea of \"ceremony\" — code that is there simply because it is required, but does not support the actual solution being implemented. In thinking in terms of API surfaces and developer experience, minimizing ceremony is always a worthy ambition.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":13474,"end":13667},{"type":"TextQuoteSelector","exact":"The programmer having the theory of the programcan explain why each part of the program is what it is,in other words is able to support the actual program textwith a justification of some sort.","prefix":"ontributed by the programmer.2)","suffix":"The final basis of thejustifica"}]}],"created":"2026-02-12T21:19:22.875Z","updated":"2026-02-12T21:19:22.875Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ontributed by the programmer.2)%%HIGHLIGHT%% ==The programmer having the theory of the programcan explain why each part of the program is what it is,in other words is able to support the actual program textwith a justification of some sort.== %%POSTFIX%%The final basis of thejustifica*
>%%LINK%%[[#^qg0ephidsr|show annotation]]
>%%COMMENT%%
>This does touch on the idea of "ceremony" — code that is there simply because it is required, but does not support the actual solution being implemented. In thinking in terms of API surfaces and developer experience, minimizing ceremony is always a worthy ambition.
>%%TAGS%%
>
^qg0ephidsr


>%%
>```annotation-json
>{"text":"This, I believe, is one of the major shortfalls of purely \"vibecoded\" solutions. When you move out of the realm of Leetcode or Project Euler-style problems, the number of valid solutions to a given modification branch out exponentially — there are many ways that a modification to a project can be slapped on. This, I think, establishes the role of the human-in-the-loop in establishing a [[/content/notes/hostage-negotiations|solid trellis]], or top-level architecture, of a program from the start. Without a strong grasp of the problem, and how the solution will need to grow to adapt *to* changes in that problem, simply having 1,000 iterations of telling an LLM to \"change X\" or \"fix Y\" will yield, in the best case, the same results as telling a junior engineer the same thing — without the architectural understanding ahead-of-time, you'll end up with rotten tomatoes on the ground.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":14169,"end":14559},{"type":"TextQuoteSelector","exact":"3) The programmer having the theory of the programis able to respond constructively to any demand for amodification of the program so as to support the affairsof the world in a new manner. Designing how a modifi-cation is best incorporated into an established programdepends on the perception of the similarity of the newdemand with the operational facilities already built intothe program.","prefix":"heprogrammer’s direct knowledge.","suffix":"The kind of similarity that has"}]}],"created":"2026-02-12T21:21:23.716Z","updated":"2026-02-12T21:21:23.716Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%heprogrammer’s direct knowledge.%%HIGHLIGHT%% ==3) The programmer having the theory of the programis able to respond constructively to any demand for amodification of the program so as to support the affairsof the world in a new manner. Designing how a modifi-cation is best incorporated into an established programdepends on the perception of the similarity of the newdemand with the operational facilities already built intothe program.== %%POSTFIX%%The kind of similarity that has*
>%%LINK%%[[#^terhri4t7d|show annotation]]
>%%COMMENT%%
>This, I believe, is one of the major shortfalls of purely "vibecoded" solutions. When you move out of the realm of Leetcode or Project Euler-style problems, the number of valid solutions to a given modification branch out exponentially — there are many ways that a modification to a project can be slapped on. This, I think, establishes the role of the human-in-the-loop in establishing a [[/content/notes/hostage-negotiations|solid trellis]], or top-level architecture, of a program from the start. Without a strong grasp of the problem, and how the solution will need to grow to adapt *to* changes in that problem, simply having 1,000 iterations of telling an LLM to "change X" or "fix Y" will yield, in the best case, the same results as telling a junior engineer the same thing — without the architectural understanding ahead-of-time, you'll end up with rotten tomatoes on the ground.
>%%TAGS%%
>
^terhri4t7d


>%%
>```annotation-json
>{"text":"A strong, general theory of \"why does this software exist? what problem does it solve\" from the start of the project is the greatest defense against drifting out-of-scope. From the earlier point about \"software whose value is in the future\", this is where design patterns supporting plugin-based development is such a strong architectural decision if the theory may change substantially in the future, especially in the phase of development after an initial prototype is developed, but before major performance optimizations may need to occur — the period of time where flexibility is king.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":15745,"end":15912},{"type":"TextQuoteSelector","exact":"Also the very useof the program itself will inspire ideas for further usefulservices that the program ought to provide. Hence theneed for ways to handle modifications.","prefix":"answer to the problems at hand.","suffix":"The question of program modifica"}]}],"created":"2026-02-12T21:25:28.052Z","updated":"2026-02-12T21:25:28.052Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%answer to the problems at hand.%%HIGHLIGHT%% ==Also the very useof the program itself will inspire ideas for further usefulservices that the program ought to provide. Hence theneed for ways to handle modifications.== %%POSTFIX%%The question of program modifica*
>%%LINK%%[[#^b5ew1qtdxmg|show annotation]]
>%%COMMENT%%
>A strong, general theory of "why does this software exist? what problem does it solve" from the start of the project is the greatest defense against drifting out-of-scope. From the earlier point about "software whose value is in the future", this is where design patterns supporting plugin-based development is such a strong architectural decision if the theory may change substantially in the future, especially in the phase of development after an initial prototype is developed, but before major performance optimizations may need to occur — the period of time where flexibility is king.
>%%TAGS%%
>
^b5ew1qtdxmg


>%%
>```annotation-json
>{"text":"Oh — I am *absolutely* stealing this line.\n\nWhile LLMs have certainly advanced beyond \"it just generates text\", limitations on the architecture — context (World 1) and recall (World 2) — do limit how *far* it can go beyond pure text production.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":16905,"end":17077},{"type":"TextQuoteSelector","exact":"For this support to be valid itmust clearly be assumed that the dominating cost is oneof text manipulation. This would agree with a notion ofprogramming as text production.","prefix":"ediumallowing for easy editing.","suffix":"On the Theory Build-ing View th"}]}],"created":"2026-02-12T21:26:34.178Z","updated":"2026-02-12T21:26:34.178Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ediumallowing for easy editing.%%HIGHLIGHT%% ==For this support to be valid itmust clearly be assumed that the dominating cost is oneof text manipulation. This would agree with a notion ofprogramming as text production.== %%POSTFIX%%On the Theory Build-ing View th*
>%%LINK%%[[#^w7vtwl69dga|show annotation]]
>%%COMMENT%%
>Oh — I am *absolutely* stealing this line.
>
>While LLMs have certainly advanced beyond "it just generates text", limitations on the architecture — context (World 1) and recall (World 2) — do limit how *far* it can go beyond pure text production.
>%%TAGS%%
>
^w7vtwl69dga




>%%
>```annotation-json
>{"text":"Ah, here we are! A letter to the future, addressing the era of code slop.\n\nThis has to be *the number one piece of negative feedback* that I see from folks who are willing to use LLMs, but find that two problems occur in a cycle:\n\n1. The agent makes misaligned edits that drift the patterns in the code in some random direction; and then\n2. After awhile, the code itself no longer matches with the theory that the human-in-the-loop (HIL) expected.\n\nThe text will dive more into this when it talks about \"live\" and \"dead\" code — the \"decay\" signals this is comin' up.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":20103,"end":20289},{"type":"TextQuoteSelector","exact":"On the basis of the Theory Building View the decayof a program text as a result of modifications made byprogrammers without a proper grasp of the underlyingtheory becomes understandable.","prefix":"s an activityof theory building.","suffix":"As a matter of fact, ifviewed m"}]}],"created":"2026-02-12T21:37:26.103Z","updated":"2026-02-12T21:37:26.103Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%s an activityof theory building.%%HIGHLIGHT%% ==On the basis of the Theory Building View the decayof a program text as a result of modifications made byprogrammers without a proper grasp of the underlyingtheory becomes understandable.== %%POSTFIX%%As a matter of fact, ifviewed m*
>%%LINK%%[[#^noi1010z2oq|show annotation]]
>%%COMMENT%%
>Ah, here we are! A letter to the future, addressing the era of code slop.
>
>This has to be *the number one piece of negative feedback* that I see from folks who are willing to use LLMs, but find that two problems occur in a cycle:
>
>1. The agent makes misaligned edits that drift the patterns in the code in some random direction; and then
>2. After awhile, the code itself no longer matches with the theory that the human-in-the-loop (HIL) expected.
>
>The text will dive more into this when it talks about "live" and "dead" code — the "decay" signals this is comin' up.
>%%TAGS%%
>
^noi1010z2oq


>%%
>```annotation-json
>{"text":"This feels like a very succinct evaluation of prompt engineering. Trying to find the \"perfect\" prompt is a rabbit hole that is so easy to fall down, and the framing here — that it's a losing battle, trying to formulate a theory based on rules is a losing battle — is fantastic.\n\nWhile I think prompt engineering is a valid study, albeit one that feels more alchemical than scientific, it is another +1 for human-in-the-loop design.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":19115,"end":19390},{"type":"TextQuoteSelector","exact":"The point is that thekind of similarity that has to be recognized is accessibleto the human beings who possess the theory of the pro-gram, although entirely outside the reach of what canbe determined by rules, since even the criteria on whichto judge it cannot be formulated.","prefix":"priate insight becomes evident.","suffix":"From the insight intothe simila"}]}],"created":"2026-02-12T21:44:05.724Z","updated":"2026-02-12T21:44:05.724Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%priate insight becomes evident.%%HIGHLIGHT%% ==The point is that thekind of similarity that has to be recognized is accessibleto the human beings who possess the theory of the pro-gram, although entirely outside the reach of what canbe determined by rules, since even the criteria on whichto judge it cannot be formulated.== %%POSTFIX%%From the insight intothe simila*
>%%LINK%%[[#^hnhszxk4oo|show annotation]]
>%%COMMENT%%
>This feels like a very succinct evaluation of prompt engineering. Trying to find the "perfect" prompt is a rabbit hole that is so easy to fall down, and the framing here — that it's a losing battle, trying to formulate a theory based on rules is a losing battle — is fantastic.
>
>While I think prompt engineering is a valid study, albeit one that feels more alchemical than scientific, it is another +1 for human-in-the-loop design.
>%%TAGS%%
>
^hnhszxk4oo


>%%
>```annotation-json
>{"text":"Oddly, this does give *some* credence to the concept of agentic PR review. Not fully automated — *never* fully automated — but this does somewhat mesh with the idea of a secondary agent that is able to perform \"soft\" checks. Not that LLMs can reliably check whether code is valid — that's what [[/content/notes/hostage-negotiations|deterministic checks]] should be responsible for — but as a smoke test about \"does this incoming PR align with the patterns this software is built upon\".","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":21075,"end":21188},{"type":"TextQuoteSelector","exact":"For a program to retain its quality it is mandatory thateach modification is firmly grounded in the theory of it.","prefix":"r term viability of the program.","suffix":"Indeed, the very notion of quali"}]}],"created":"2026-02-12T22:02:11.710Z","updated":"2026-02-12T22:02:11.710Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%r term viability of the program.%%HIGHLIGHT%% ==For a program to retain its quality it is mandatory thateach modification is firmly grounded in the theory of it.== %%POSTFIX%%Indeed, the very notion of quali*
>%%LINK%%[[#^gk6lp6psly6|show annotation]]
>%%COMMENT%%
>Oddly, this does give *some* credence to the concept of agentic PR review. Not fully automated — *never* fully automated — but this does somewhat mesh with the idea of a secondary agent that is able to perform "soft" checks. Not that LLMs can reliably check whether code is valid — that's what [[/content/notes/hostage-negotiations|deterministic checks]] should be responsible for — but as a smoke test about "does this incoming PR align with the patterns this software is built upon".
>%%TAGS%%
>
^gk6lp6psly6


>%%
>```annotation-json
>{"text":"In asking myself \"can LLMs substitute for this?\", I believe the answer is \"no.\" There are many reasons for this, but the one worth bringing up here is about whether or not an LLM can hold a consistent theory, across many sessions, about a piece of software. The architectural limitations imposed by context is that, effectively, you get a \"new\" session each and every time a new context is brought up. Yes — there are approximations of this with long-term memory documents, rules docs, etc., but agentic sessions are, still, ephemeral.\n\nPutting it in human terms: every time you close a session and start a new one, you are effectively firing, then hiring, a new entity. While you can still work through handoff documents, the theory will naturally drift over time as new sessions are started up. Even if LLMs are capable of understanding theory via attention, this theory would still be constructed anew each time a session starts.\n\nHuman beings have, if nothing else, persistence. When I wake up every morning, I am a continuation of myself from the day before — the theories persisting between sessions, effectively. I don't need to fully reconstruct my theories and understanding of architecture every time I crack open my IDE. I can maintain a stable theory over time — and even providing LLMs the benefit of the doubt (that they are capable of theory in the same way a human being can be), they will still fall short until a single session can last more than, say, 20 minutes.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":21757,"end":21792},{"type":"TextQuoteSelector","exact":"inextricably bound to human beings.","prefix":"nceivably be ex-pressed, but is","suffix":"Itfollows that in describing th"}]}],"created":"2026-02-12T22:03:33.754Z","updated":"2026-02-12T22:03:33.754Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%nceivably be ex-pressed, but is%%HIGHLIGHT%% ==inextricably bound to human beings.== %%POSTFIX%%Itfollows that in describing th*
>%%LINK%%[[#^pkk0oxpz6d9|show annotation]]
>%%COMMENT%%
>In asking myself "can LLMs substitute for this?", I believe the answer is "no." There are many reasons for this, but the one worth bringing up here is about whether or not an LLM can hold a consistent theory, across many sessions, about a piece of software. The architectural limitations imposed by context is that, effectively, you get a "new" session each and every time a new context is brought up. Yes — there are approximations of this with long-term memory documents, rules docs, etc., but agentic sessions are, still, ephemeral.
>
>Putting it in human terms: every time you close a session and start a new one, you are effectively firing, then hiring, a new entity. While you can still work through handoff documents, the theory will naturally drift over time as new sessions are started up. Even if LLMs are capable of understanding theory via attention, this theory would still be constructed anew each time a session starts.
>
>Human beings have, if nothing else, persistence. When I wake up every morning, I am a continuation of myself from the day before — the theories persisting between sessions, effectively. I don't need to fully reconstruct my theories and understanding of architecture every time I crack open my IDE. I can maintain a stable theory over time — and even providing LLMs the benefit of the doubt (that they are capable of theory in the same way a human being can be), they will still fall short until a single session can last more than, say, 20 minutes.
>%%TAGS%%
>
^pkk0oxpz6d9


>%%
>```annotation-json
>{"text":"This is where it gets dicey, though — and where the current negotiations of agent-driven development lie. How much does a programmer team still retain control over all modifications?\n\nThis is something that seems to be a point of friction among engineers I've spoken to about this exact issue — LLMs can generate code faster than an engineer can review it, which can lead to rubber-stamping code (or kneejerk-denial of code, on the other side of the coin). When this occurs, that cycle from above — theoretical drift causing lost understanding, causing more theoretical drift — is acute.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":22198,"end":22358},{"type":"TextQuoteSelector","exact":"During the program life aprogrammer team possessing its theory remains in activecontrol of the program, and in particular retains controlover all modifications.","prefix":"and inthe team of programmers.","suffix":"The death of a program happensw"}]}],"created":"2026-02-12T22:04:58.824Z","updated":"2026-02-12T22:04:58.824Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%and inthe team of programmers.%%HIGHLIGHT%% ==During the program life aprogrammer team possessing its theory remains in activecontrol of the program, and in particular retains controlover all modifications.== %%POSTFIX%%The death of a program happensw*
>%%LINK%%[[#^35ad2o8jkq2|show annotation]]
>%%COMMENT%%
>This is where it gets dicey, though — and where the current negotiations of agent-driven development lie. How much does a programmer team still retain control over all modifications?
>
>This is something that seems to be a point of friction among engineers I've spoken to about this exact issue — LLMs can generate code faster than an engineer can review it, which can lead to rubber-stamping code (or kneejerk-denial of code, on the other side of the coin). When this occurs, that cycle from above — theoretical drift causing lost understanding, causing more theoretical drift — is acute.
>%%TAGS%%
>
^35ad2o8jkq2


>%%
>```annotation-json
>{"text":"Oh, this rings in my soul. For the last year, I've been caught in a project reviving a piece of software purely from source, trying to reassemble theory from pure source code. We'll call this project \"ACME\".\n\nThe person who wrote it has passed away — while I can ask the primary user questions about their use, it never feels like enough to capture the original theory. Taking a step back from my personal frustrations with this process, and reframing it through this lens, it feels as though I'm wandering around in the dark, trying to get a mental image of the original theory by feeling around — and often stubbing my toe — on aspects of the program that are \"not like the original.\"\n\nThis whole section will likely just be feelings of vindication, and will probably stray a bit from the agentic portion. An online PDF is, after all, cheaper than therapy.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":22602,"end":22745},{"type":"TextQuoteSelector","exact":"for modifications of the program cannot be intelligentlyanswered. Revival of a program is the rebuilding of itstheory by a new programmer team.","prefix":"th becomes visible when demands4","suffix":"The extended life of a program a"}]}],"created":"2026-02-12T22:06:29.655Z","updated":"2026-02-12T22:06:29.655Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%th becomes visible when demands4%%HIGHLIGHT%% ==for modifications of the program cannot be intelligentlyanswered. Revival of a program is the rebuilding of itstheory by a new programmer team.== %%POSTFIX%%The extended life of a program a*
>%%LINK%%[[#^7ppb5sf3ycw|show annotation]]
>%%COMMENT%%
>Oh, this rings in my soul. For the last year, I've been caught in a project reviving a piece of software purely from source, trying to reassemble theory from pure source code. We'll call this project "ACME".
>
>The person who wrote it has passed away — while I can ask the primary user questions about their use, it never feels like enough to capture the original theory. Taking a step back from my personal frustrations with this process, and reframing it through this lens, it feels as though I'm wandering around in the dark, trying to get a mental image of the original theory by feeling around — and often stubbing my toe — on aspects of the program that are "not like the original."
>
>This whole section will likely just be feelings of vindication, and will probably stray a bit from the agentic portion. An online PDF is, after all, cheaper than therapy.
>%%TAGS%%
>
^7ppb5sf3ycw


>%%
>```annotation-json
>{"text":"Okay — I lied!\n\nIn retrospect, this ACME project was pretty rough from the start — when I agreed to it, I definitely had a go-lucky \"Sure — how hard could it be?\" attitude.\n\nI'm the sole main engineer on the project — a modern revival of a 30-year-old program, that cannot be run on any computer except the original Windows device it was developed for. The original creator passed away a few years ago, and the original app is very much on borrowed time — with features breaking year-over-year.\n\nThe only thing that has made this endeavor even *feasible* — that a single developer could cover 30 years of work in langauges and technologies that reached end-of-life the year after I was born, with no documentation, and only the source code available as a reference — was the introduction of LLMs into the process. This is probably the reason I'm more bullish on agentic development than some of my peers — I've seen this thing make the unfeasible, feasible.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":22894,"end":23083},{"type":"TextQuoteSelector","exact":"For a newprogrammer to come to possess an existing theory of aprogram it is insufficient that he or she has the opportu-nity to become familiar with the program text and otherdocumentation.","prefix":"s of the theory of the program.","suffix":"What is required is that the ne"}]}],"created":"2026-02-12T22:10:24.748Z","updated":"2026-02-12T22:10:24.748Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%s of the theory of the program.%%HIGHLIGHT%% ==For a newprogrammer to come to possess an existing theory of aprogram it is insufficient that he or she has the opportu-nity to become familiar with the program text and otherdocumentation.== %%POSTFIX%%What is required is that the ne*
>%%LINK%%[[#^32unqiz795c|show annotation]]
>%%COMMENT%%
>Okay — I lied!
>
>In retrospect, this ACME project was pretty rough from the start — when I agreed to it, I definitely had a go-lucky "Sure — how hard could it be?" attitude.
>
>I'm the sole main engineer on the project — a modern revival of a 30-year-old program, that cannot be run on any computer except the original Windows device it was developed for. The original creator passed away a few years ago, and the original app is very much on borrowed time — with features breaking year-over-year.
>
>The only thing that has made this endeavor even *feasible* — that a single developer could cover 30 years of work in langauges and technologies that reached end-of-life the year after I was born, with no documentation, and only the source code available as a reference — was the introduction of LLMs into the process. This is probably the reason I'm more bullish on agentic development than some of my peers — I've seen this thing make the unfeasible, feasible.
>%%TAGS%%
>
^32unqiz795c



>%%
>```annotation-json
>{"text":"Yeah, this meshes. On ACME, it took me a *long* time to stop feeling like I was stepping on glass trying to reconstruct the original as-is. It's both unsatisfying as an engineer, as well as completely impractical, to reconstruct something 1:1.\n\nOne of my favorite engineering reads is the Dolphin team's [engineering blog](https://dolphin-emu.org/blog/), where they talk about building out the seminal emulator for games in the Gamecube and Wii era. The most striking thing is that an old technology — and yes, the Gamecube was released 25 years ago, so we can safely call it old — can invoke so many cutting-edge technologies in its replication.\n\nDoubtless, the theories of the Dolphin team are not aligned with those of the original Gamecube. Is this a mark against the project? Absolutely not. Trying to implement a 1:1 faithful recreation of those platforms would not only be destined to fail, but would also hobble innovations made possible in the last 25 years.\n\nI'd imagine it'd also be a very boring project, and the flare Dolphin has over the original platforms is no doubt what has drawn so much OSS contribution over the years.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":24165,"end":24345},{"type":"TextQuoteSelector","exact":"A very important consequence of the Theory BuildingView is that program revival, that is reestablishing thetheory of a program merely from the documentation, isstrictly impossible.","prefix":"atters dealt with by theprogram.","suffix":"Lest this consequence may seem"}]}],"created":"2026-02-12T22:16:22.079Z","updated":"2026-02-12T22:16:22.079Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%atters dealt with by theprogram.%%HIGHLIGHT%% ==A very important consequence of the Theory BuildingView is that program revival, that is reestablishing thetheory of a program merely from the documentation, isstrictly impossible.== %%POSTFIX%%Lest this consequence may seem*
>%%LINK%%[[#^3rjvtpr6g2a|show annotation]]
>%%COMMENT%%
>Yeah, this meshes. On ACME, it took me a *long* time to stop feeling like I was stepping on glass trying to reconstruct the original as-is. It's both unsatisfying as an engineer, as well as completely impractical, to reconstruct something 1:1.
>
>One of my favorite engineering reads is the Dolphin team's [engineering blog](https://dolphin-emu.org/blog/), where they talk about building out the seminal emulator for games in the Gamecube and Wii era. The most striking thing is that an old technology — and yes, the Gamecube was released 25 years ago, so we can safely call it old — can invoke so many cutting-edge technologies in its replication.
>
>Doubtless, the theories of the Dolphin team are not aligned with those of the original Gamecube. Is this a mark against the project? Absolutely not. Trying to implement a 1:1 faithful recreation of those platforms would not only be destined to fail, but would also hobble innovations made possible in the last 25 years.
>
>I'd imagine it'd also be a very boring project, and the flare Dolphin has over the original platforms is no doubt what has drawn so much OSS contribution over the years.
>%%TAGS%%
>
^3rjvtpr6g2a


>%%
>```annotation-json
>{"text":"This has been a hard one for me to stomach, and this particular passage is going to help me sleep at night. In previous jobs, I've been very close to the metric of \"I have made the company $X, and cost the company $Y, in the last year.\" While this thinking is realistically something that'd be learned in an entry-level business or economics course (\"Profit = Revenue - Cost\"), being close enough to those metrics to justify my own employment has been a nice net of solace to fall back on.\n\nOn ACME, this accounting is *wildly* uncertain. Seeing that the expense of full program revival is known — not widely enough to have saved me a year of anxiety, but known nonetheless — does provide some solace, and a good lesson to understand in the future.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":24642,"end":24966},{"type":"TextQuoteSelector","exact":"Even so the The-ory Building View suggests strongly that program revivalshould only be attempted in exceptional situations andwith full awareness that it is at best costly, and may leadto a revived theory that differs from the one originallyhad by the program authors and so may contain discrep-ancies with the program text.","prefix":"heory had by the original team.","suffix":"In preference to program revival"}]}],"created":"2026-02-15T20:25:12.296Z","updated":"2026-02-15T20:25:12.296Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%heory had by the original team.%%HIGHLIGHT%% ==Even so the The-ory Building View suggests strongly that program revivalshould only be attempted in exceptional situations andwith full awareness that it is at best costly, and may leadto a revived theory that differs from the one originallyhad by the program authors and so may contain discrep-ancies with the program text.== %%POSTFIX%%In preference to program revival*
>%%LINK%%[[#^kftotd5b0w|show annotation]]
>%%COMMENT%%
>This has been a hard one for me to stomach, and this particular passage is going to help me sleep at night. In previous jobs, I've been very close to the metric of "I have made the company $X, and cost the company $Y, in the last year." While this thinking is realistically something that'd be learned in an entry-level business or economics course ("Profit = Revenue - Cost"), being close enough to those metrics to justify my own employment has been a nice net of solace to fall back on.
>
>On ACME, this accounting is *wildly* uncertain. Seeing that the expense of full program revival is known — not widely enough to have saved me a year of anxiety, but known nonetheless — does provide some solace, and a good lesson to understand in the future.
>%%TAGS%%
>
^kftotd5b0w


>%%
>```annotation-json
>{"text":"Oh — *this* is a buried needle in the haystack. With no citations on this particular quote, I did some digging into the period between 1975 and 1985 that Naur could be referencing, here. I can think of two reasons why this went uncited:\n\n1. This quote could be referencing a broad swath of discussion around **formalized programming** — prescriptive methodologies around *how* programing should occur, such as:\n    1. [Computer-aided Software Engineering (CASE)](https://en.wikipedia.org/wiki/Computer-aided_software_engineering), where programming is done via diagram-based representations — picture Unreal Blueprints for all software; and\n    2. [Logic Programming](https://arxiv.org/pdf/0904.3036), as part of the Japanese Fifth Generation computers announced in 1981, which aimed to fully capture the state of the world in logical (code) terms via [knowledge representation theory](https://en.wikipedia.org/wiki/Knowledge_representation_and_reasoning)\n2. He didn't want to call out anybody in particular.\n\nMore broadly, this is a period of time where programming methodologies — object-oriented programming, waterfall, agile, etc. — were still in their very early years, and may've warranted a response.\n\nWith this context, this definitely does hail back to a time when lack of citation wasn't a source of prolific misinformation campaigns, but intentional subtext (i.e. \"you know who I'm talking about.\")","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":26096,"end":26154},{"type":"TextQuoteSelector","exact":"Recent years has seen much interest in programmingmethods.","prefix":"mbers.Method and Theory Building","suffix":"In the present section some com"}]}],"created":"2026-02-15T20:27:00.754Z","updated":"2026-02-15T20:27:00.754Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%mbers.Method and Theory Building%%HIGHLIGHT%% ==Recent years has seen much interest in programmingmethods.== %%POSTFIX%%In the present section some com*
>%%LINK%%[[#^s617386r66c|show annotation]]
>%%COMMENT%%
>Oh — *this* is a buried needle in the haystack. With no citations on this particular quote, I did some digging into the period between 1975 and 1985 that Naur could be referencing, here. I can think of two reasons why this went uncited:
>
>1. This quote could be referencing a broad swath of discussion around **formalized programming** — prescriptive methodologies around *how* programing should occur, such as:
>    1. [Computer-aided Software Engineering (CASE)](https://en.wikipedia.org/wiki/Computer-aided_software_engineering), where programming is done via diagram-based representations — picture Unreal Blueprints for all software; and
>    2. [Logic Programming](https://arxiv.org/pdf/0904.3036), as part of the Japanese Fifth Generation computers announced in 1981, which aimed to fully capture the state of the world in logical (code) terms via [knowledge representation theory](https://en.wikipedia.org/wiki/Knowledge_representation_and_reasoning)
>2. He didn't want to call out anybody in particular.
>
>More broadly, this is a period of time where programming methodologies — object-oriented programming, waterfall, agile, etc. — were still in their very early years, and may've warranted a response.
>
>With this context, this definitely does hail back to a time when lack of citation wasn't a source of prolific misinformation campaigns, but intentional subtext (i.e. "you know who I'm talking about.")
>%%TAGS%%
>
^s617386r66c


>%%
>```annotation-json
>{"text":"This hails back to the top of the paper — about a theory being something you can properly answer questions about. This is something that I saw far more in LLM research when \"thinking\" models were first introduced. Red-teaming research, specifically, was interested in how the bot's public respsonse would line up with its thinking response. In some cases, when prompted about the rationale behind a decision, the agent would come up with a response that does not line up with its original rationale.\n\nThe fact that thinking models (which constitute many of the more advanced models used at this point) will openly broadcast \"thinking\" tokens, without being able to reference those thinking tokens further back than a single response, is [a huge boon](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) for us (humans) in how they're researched. It also means that, fundamentally, there [is no continuity of theory between one response and the next](https://platform.claude.com/docs/en/build-with-claude/extended-thinking#the-context-window-with-extended-thinking-and-tool-use), and no way to maintain a consistent theory that could be argued long-term. This is, once again, architectural in nature — LLMs, with a limited context window, must sacrifice long-term preservation and retention of theory in order to increase performance on the task at hand.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":27179,"end":27328},{"type":"TextQuoteSelector","exact":"Rather, the person possessinga theory will be able to produce presentations of vari-ous sorts on the basis of it, in response to questions ordemands.","prefix":"partsand no inherent ordering.","suffix":"As to the use of particular kind"}]}],"created":"2026-02-15T20:28:12.851Z","updated":"2026-02-15T20:28:12.851Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%partsand no inherent ordering.%%HIGHLIGHT%% ==Rather, the person possessinga theory will be able to produce presentations of vari-ous sorts on the basis of it, in response to questions ordemands.== %%POSTFIX%%As to the use of particular kind*
>%%LINK%%[[#^4db7udpssjo|show annotation]]
>%%COMMENT%%
>This hails back to the top of the paper — about a theory being something you can properly answer questions about. This is something that I saw far more in LLM research when "thinking" models were first introduced. Red-teaming research, specifically, was interested in how the bot's public respsonse would line up with its thinking response. In some cases, when prompted about the rationale behind a decision, the agent would come up with a response that does not line up with its original rationale.
>
>The fact that thinking models (which constitute many of the more advanced models used at this point) will openly broadcast "thinking" tokens, without being able to reference those thinking tokens further back than a single response, is [a huge boon](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) for us (humans) in how they're researched. It also means that, fundamentally, there [is no continuity of theory between one response and the next](https://platform.claude.com/docs/en/build-with-claude/extended-thinking#the-context-window-with-extended-thinking-and-tool-use), and no way to maintain a consistent theory that could be argued long-term. This is, once again, architectural in nature — LLMs, with a limited context window, must sacrifice long-term preservation and retention of theory in order to increase performance on the task at hand.
>%%TAGS%%
>
^4db7udpssjo


>%%
>```annotation-json
>{"text":"While I originally thought this related back to my trellis model for agentic development, knowing the context in which Naur was writing this essay helps clarify what he's now arguing. This is a dispute, specifically, with the notion that there are prescriptive, one-size-fits-all solutions for how programs should be developed (e.g. the notion that programs themselves can be programmatically developed at all.)","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":28042,"end":28192},{"type":"TextQuoteSelector","exact":"The first argument is that software developmentshould be based on scientific manners, and so should em-ploy procedures similar to scientific methods. ","prefix":"ly used in software development.","suffix":"The flawof this argument is the"}]}],"created":"2026-02-15T20:31:22.292Z","updated":"2026-02-15T20:31:22.292Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ly used in software development.%%HIGHLIGHT%% ==The first argument is that software developmentshould be based on scientific manners, and so should em-ploy procedures similar to scientific methods.== %%POSTFIX%%The flawof this argument is the*
>%%LINK%%[[#^15gracklaya|show annotation]]
>%%COMMENT%%
>While I originally thought this related back to my trellis model for agentic development, knowing the context in which Naur was writing this essay helps clarify what he's now arguing. This is a dispute, specifically, with the notion that there are prescriptive, one-size-fits-all solutions for how programs should be developed (e.g. the notion that programs themselves can be programmatically developed at all.)
>%%TAGS%%
>
^15gracklaya


>%%
>```annotation-json
>{"text":"As a quick backlink, the two sources Naur references here are:\n\n1. George Pólya's [Mathematics and Plausible Reasoning](https://en.wikipedia.org/wiki/Mathematics_and_Plausible_Reasoning), which makes the case that intuition is an important tool in discovering proof; and\n2. George Pólya's [How to Solve It](https://en.wikipedia.org/wiki/How_to_Solve_It), which establishes a *very general* framework for mathematical problem solving, similar to the scientific method.\n\nWhile I'm not usually a fan of ripping directly from the Wikipedia article, my copy of the book hasn't yet arrived. So, from the wiki entry, we have a general process of:\n\n> [!QUOTE]\n> 1. First, you have to understand the problem.\n> 2. After understanding, make a plan.\n> 3. Carry out the plan.\n> 4. Look back on your work. How could it be better?\n\nI couldn't have written a better description of the current state of prompt engineering. While my own recollection would point at the \"Plan Mode/Act Mode\" differentiation as an artifact of [Cline's user interface](https://github.com/cline/cline), I doubt it came up with the idea — I'm uncertain if this was a direct recall of Polya's work, or a case of a mild rediscovery.\n\nHowever, this pattern of \"plan, then act\" does seem to be paralleled in many other interfaces, including Copilot and Claude Code.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":28637,"end":29107},{"type":"TextQuoteSelector","exact":"This conclusion is not contradicted by such work asthat of Polya [8, 9] on problem solving. This work takesits illustrations from the field of mathematics and leadsto insight which is also highly relevant to programming.However, it cannot be claimed to present a method onwhich to proceed. Rather, it is a collection of suggestionsaiming at stimulating the mental activity of the problemsolver, by pointing out different modes of work that maybe applied in any sequence.","prefix":"ractising scientist is mistaken.","suffix":"The second argument that may see"}]}],"created":"2026-02-15T20:32:33.931Z","updated":"2026-02-15T20:32:33.931Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ractising scientist is mistaken.%%HIGHLIGHT%% ==This conclusion is not contradicted by such work asthat of Polya [8, 9] on problem solving. This work takesits illustrations from the field of mathematics and leadsto insight which is also highly relevant to programming.However, it cannot be claimed to present a method onwhich to proceed. Rather, it is a collection of suggestionsaiming at stimulating the mental activity of the problemsolver, by pointing out different modes of work that maybe applied in any sequence.== %%POSTFIX%%The second argument that may see*
>%%LINK%%[[#^h548sriulg7|show annotation]]
>%%COMMENT%%
>As a quick backlink, the two sources Naur references here are:
>
>1. George Pólya's [Mathematics and Plausible Reasoning](https://en.wikipedia.org/wiki/Mathematics_and_Plausible_Reasoning), which makes the case that intuition is an important tool in discovering proof; and
>2. George Pólya's [How to Solve It](https://en.wikipedia.org/wiki/How_to_Solve_It), which establishes a *very general* framework for mathematical problem solving, similar to the scientific method.
>
>While I'm not usually a fan of ripping directly from the Wikipedia article, my copy of the book hasn't yet arrived. So, from the wiki entry, we have a general process of:
>
>> [!QUOTE]
>> 1. First, you have to understand the problem.
>> 2. After understanding, make a plan.
>> 3. Carry out the plan.
>> 4. Look back on your work. How could it be better?
>
>I couldn't have written a better description of the current state of prompt engineering. While my own recollection would point at the "Plan Mode/Act Mode" differentiation as an artifact of [Cline's user interface](https://github.com/cline/cline), I doubt it came up with the idea — I'm uncertain if this was a direct recall of Polya's work, or a case of a mild rediscovery.
>
>However, this pattern of "plan, then act" does seem to be paralleled in many other interfaces, including Copilot and Claude Code.
>%%TAGS%%
>
^h548sriulg7


>%%
>```annotation-json
>{"text":"This does feel like something that, in an agentic context, *could be* (and likely *is being*) studied. Especially in LLM research applications, there are *many* cases of patterns where two LLMs are given the same prompt (or, for testing consistency, two sessions of the same LLM are given the same prompt but with two different initial random seeds). Especially as we get into agent-to-agent coordination, which seems to be an [up-and-coming feature of some interfaces](https://code.claude.com/docs/en/agent-teams), I'd imagine we'll see more data in this space.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":29593,"end":29897},{"type":"TextQuoteSelector","exact":"The lack of such studies is explainable partlyby the high cost that would undoubtedly be incurred insuch investigations if the results were to be significant,partly by the problems of establishing in an operationalfashion the concepts underlying what is called methodsin the field of program development.","prefix":"Moher and Schneider,1982 [6]).","suffix":"Most published re-ports on such"}]}],"created":"2026-02-15T20:36:39.073Z","updated":"2026-02-15T20:36:39.073Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%Moher and Schneider,1982 [6]).%%HIGHLIGHT%% ==The lack of such studies is explainable partlyby the high cost that would undoubtedly be incurred insuch investigations if the results were to be significant,partly by the problems of establishing in an operationalfashion the concepts underlying what is called methodsin the field of program development.== %%POSTFIX%%Most published re-ports on such*
>%%LINK%%[[#^wut7cftes6|show annotation]]
>%%COMMENT%%
>This does feel like something that, in an agentic context, *could be* (and likely *is being*) studied. Especially in LLM research applications, there are *many* cases of patterns where two LLMs are given the same prompt (or, for testing consistency, two sessions of the same LLM are given the same prompt but with two different initial random seeds). Especially as we get into agent-to-agent coordination, which seems to be an [up-and-coming feature of some interfaces](https://code.claude.com/docs/en/agent-teams), I'd imagine we'll see more data in this space.
>%%TAGS%%
>
^wut7cftes6


>%%
>```annotation-json
>{"text":"As a double-check on this: AXE is referring to [the Ericsson AXE switching system](https://www.ericsson.com/en/about-us/history/products/the-switches/development-of-the-axe-system) developed for telecommunications in the early 1980s.\n\nWhen he quotes \"a philosophy of AXE\", he's talking about the AXE programming team's internal theory of the AXE product and program, which is referenced by Oskarsson but not researched any further than a concession that there was *some* theory the team was using in AXE's development.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":32516,"end":32538},{"type":"TextQuoteSelector","exact":"‘a philosophy of AXE’.","prefix":"ng block’ and in a reference to","suffix":"However, by the manner in which"}]}],"created":"2026-02-15T20:40:19.883Z","updated":"2026-02-15T20:40:19.883Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ng block’ and in a reference to%%HIGHLIGHT%% ==‘a philosophy of AXE’.== %%POSTFIX%%However, by the manner in which*
>%%LINK%%[[#^vu17682obv|show annotation]]
>%%COMMENT%%
>As a double-check on this: AXE is referring to [the Ericsson AXE switching system](https://www.ericsson.com/en/about-us/history/products/the-switches/development-of-the-axe-system) developed for telecommunications in the early 1980s.
>
>When he quotes "a philosophy of AXE", he's talking about the AXE programming team's internal theory of the AXE product and program, which is referenced by Oskarsson but not researched any further than a concession that there was *some* theory the team was using in AXE's development.
>%%TAGS%%
>
^vu17682obv


>%%
>```annotation-json
>{"text":"This does pose an interesting backbone to an argument I've had with folks in the past decade — at what point should a piece of software move from one person's theory, into a team of theories?\n\nI've seen *many* instances of cases where an idea gets workshopped to death in the idea and planning phases. In general, to avoid this death-by-a-thousand-opinions while an idea is still an idea, I try to get out a prototype as soon as possible — admittedly, LLM agents have pretty much *swept* the prototyping phase.\n\nThis does, then, get us to a point where the theory must be communicated to others, as very few pieces of software are successful by the effort of just a single individual. It feels like a delicate balance — getting an idea far enough that the central theory can be effectively communicated, and others onboarded, but not so early that the theory lacks specificity and is smothered by differing opinions.\n\nAn example that I'm comfortable with purely because it's open-source (and, seemingly, inactive) was [SLATE](https://github.com/slateci), a project I worked on in [[/tags/projects/college|my undergraduate]] at the University of Utah's [Center for High-Performance Computing](https://chpc.utah.edu/). This project had three primary investigators across three separate universities. Part of my job was to tune the website to describe the project. At times, this job felt like routinely cycling between three different descriptions, of three different theories, about what the project's purpose and direction were supposed to be.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":32016,"end":32348},{"type":"TextQuoteSelector","exact":"However, there is no suggestionwhatsoever that the implementation of the modificationsmight depend on the background of the 500 programmersemployed on the project, such as the length of time theyhave been working on it, and there is no indication ofthe manner in which the design decisions are distributedamong the 500 programmers. ","prefix":"to particu-lar program modules.","suffix":"Even so the significanceof an un"}]}],"created":"2026-02-15T20:40:41.927Z","updated":"2026-02-15T20:40:41.927Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%to particu-lar program modules.%%HIGHLIGHT%% ==However, there is no suggestionwhatsoever that the implementation of the modificationsmight depend on the background of the 500 programmersemployed on the project, such as the length of time theyhave been working on it, and there is no indication ofthe manner in which the design decisions are distributedamong the 500 programmers.== %%POSTFIX%%Even so the significanceof an un*
>%%LINK%%[[#^ysd8j13l99|show annotation]]
>%%COMMENT%%
>This does pose an interesting backbone to an argument I've had with folks in the past decade — at what point should a piece of software move from one person's theory, into a team of theories?
>
>I've seen *many* instances of cases where an idea gets workshopped to death in the idea and planning phases. In general, to avoid this death-by-a-thousand-opinions while an idea is still an idea, I try to get out a prototype as soon as possible — admittedly, LLM agents have pretty much *swept* the prototyping phase.
>
>This does, then, get us to a point where the theory must be communicated to others, as very few pieces of software are successful by the effort of just a single individual. It feels like a delicate balance — getting an idea far enough that the central theory can be effectively communicated, and others onboarded, but not so early that the theory lacks specificity and is smothered by differing opinions.
>
>An example that I'm comfortable with purely because it's open-source (and, seemingly, inactive) was [SLATE](https://github.com/slateci), a project I worked on in [[/tags/projects/college|my undergraduate]] at the University of Utah's [Center for High-Performance Computing](https://chpc.utah.edu/). This project had three primary investigators across three separate universities. Part of my job was to tune the website to describe the project. At times, this job felt like routinely cycling between three different descriptions, of three different theories, about what the project's purpose and direction were supposed to be.
>%%TAGS%%
>
^ysd8j13l99


>%%
>```annotation-json
>{"text":"This is, in my opinion, one of the liberating promises of agentic programming. These things *are* machines — albeit sophisticated ones. I don't think it's any secret that the role of a junior developer is effectively that of a line-worker on an assembly line: tickets come in, pull requests come out. I've worked as both a line-worker and a junior engineer, and I have to concede that there are some parts of the brain related to critical thinking that go into hibernation in that kind of work. Ultimately, I believe this to be the category of work most at-risk of broad automation via agents.\n\nThe hope — and we'll see if the economics support this — is that modern software engineering can be aided, not replaced, by agents. This may be high-minded aspiration on my part, but the hope would be that junior engineering positions can be elevated to some extent, allowing junior engineers to entire higher into the critical thinking hierarchy of the field and do work that looks closer, in practice, to the theorybuilding that a degree actually prepares you to do.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":32931,"end":33315},{"type":"TextQuoteSelector","exact":"Another related view is that human beingsperform best if they act like machines, by following rules,with a consequent stress on formal modes of expression,which make it possible to formulate certain arguments interms of rules of formal manipulation. Such views agreewell with the notion, seemingly common among personsworking with computers, that the human mind works likea computer. ","prefix":"which can be re-placed easily.","suffix":"At the level of industrial manag"}]}],"created":"2026-02-15T20:42:00.371Z","updated":"2026-02-15T20:42:00.371Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%which can be re-placed easily.%%HIGHLIGHT%% ==Another related view is that human beingsperform best if they act like machines, by following rules,with a consequent stress on formal modes of expression,which make it possible to formulate certain arguments interms of rules of formal manipulation. Such views agreewell with the notion, seemingly common among personsworking with computers, that the human mind works likea computer.== %%POSTFIX%%At the level of industrial manag*
>%%LINK%%[[#^7hw5znb50gx|show annotation]]
>%%COMMENT%%
>This is, in my opinion, one of the liberating promises of agentic programming. These things *are* machines — albeit sophisticated ones. I don't think it's any secret that the role of a junior developer is effectively that of a line-worker on an assembly line: tickets come in, pull requests come out. I've worked as both a line-worker and a junior engineer, and I have to concede that there are some parts of the brain related to critical thinking that go into hibernation in that kind of work. Ultimately, I believe this to be the category of work most at-risk of broad automation via agents.
>
>The hope — and we'll see if the economics support this — is that modern software engineering can be aided, not replaced, by agents. This may be high-minded aspiration on my part, but the hope would be that junior engineering positions can be elevated to some extent, allowing junior engineers to entire higher into the critical thinking hierarchy of the field and do work that looks closer, in practice, to the theorybuilding that a degree actually prepares you to do.
>%%TAGS%%
>
^7hw5znb50gx


>%%
>```annotation-json
>{"text":"Yes! I was asked recently how LLMs have changed the act of engineering, and this so clearly encapsulates a conjecture I've made — that agents very quickly turned the job of an engineer into one of programming prowess (how quickly can you complete a ticket) and turned it into a test of management prowess (how effectively can you manage a set of agents completing tickets), which seems to be a major point of occupational discomfort for many engineers.\n\nThis specific line is as potent in 2026 as it was in 1985 — a developer and manager of the activity in which the computer is a part. This is certainly in the top set of quotes that I'd share with somebody to promote reading this paper.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":33795,"end":33921},{"type":"TextQuoteSelector","exact":"nstead the programmer must be regardedas a responsible developer and manager of the activity inwhich the computer is a part. I","prefix":"n activity has to beabandoned. I","suffix":"n order to fill this positionhe"}]}],"created":"2026-02-15T20:42:40.674Z","updated":"2026-02-15T20:42:40.674Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%n activity has to beabandoned. I%%HIGHLIGHT%% ==nstead the programmer must be regardedas a responsible developer and manager of the activity inwhich the computer is a part. I== %%POSTFIX%%n order to fill this positionhe*
>%%LINK%%[[#^iow4ec8yt9|show annotation]]
>%%COMMENT%%
>Yes! I was asked recently how LLMs have changed the act of engineering, and this so clearly encapsulates a conjecture I've made — that agents very quickly turned the job of an engineer into one of programming prowess (how quickly can you complete a ticket) and turned it into a test of management prowess (how effectively can you manage a set of agents completing tickets), which seems to be a major point of occupational discomfort for many engineers.
>
>This specific line is as potent in 2026 as it was in 1985 — a developer and manager of the activity in which the computer is a part. This is certainly in the top set of quotes that I'd share with somebody to promote reading this paper.
>%%TAGS%%
>
^iow4ec8yt9



>%%
>```annotation-json
>{"text":"Peter Naur — you've just ascended to hero status. This is it! This is the point of it all! That forming theories is fundamentally a more important task than physically writing code *ever* was. That LLMs fundamentally struggle with theory formation and retention is precisely *why* there is still a role for us.\n\nIt has a tradeoff, though — if you are a human being in the software development game, it's an up-or-out period for each of us. The emphasis on two categories of roles in this industry feels more pronounced than ever:\n\n1. You are the one creating and communicating theories; or\n2. You are the one managing how those theories are passed through agents for fabrication\n\nThere is rapidly-diminishing role for those whose job is to turn tickets into pull requests through the act of physically writing code. I'll fully admit, about two years ago, that's what I *wanted* my job to be. Stock in that type of roll is dropping by the day, and it's time to figure out which of those specializations — developing theories, or managing their fabrication — best suits you. The alternative may be the door.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":34443,"end":34545},{"type":"TextQuoteSelector","exact":"the primary emphasis would have to turn in thedirection of furthering the understanding and talent for","prefix":"a processes, remain impor-tant,","suffix":"6theory formation. To what exten"}]}],"created":"2026-02-15T20:44:20.265Z","updated":"2026-02-15T20:44:20.265Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%a processes, remain impor-tant,%%HIGHLIGHT%% ==the primary emphasis would have to turn in thedirection of furthering the understanding and talent for== %%POSTFIX%%6theory formation. To what exten*
>%%LINK%%[[#^r3yederfnbg|show annotation]]
>%%COMMENT%%
>Peter Naur — you've just ascended to hero status. This is it! This is the point of it all! That forming theories is fundamentally a more important task than physically writing code *ever* was. That LLMs fundamentally struggle with theory formation and retention is precisely *why* there is still a role for us.
>
>It has a tradeoff, though — if you are a human being in the software development game, it's an up-or-out period for each of us. The emphasis on two categories of roles in this industry feels more pronounced than ever:
>
>1. You are the one creating and communicating theories; or
>2. You are the one managing how those theories are passed through agents for fabrication
>
>There is rapidly-diminishing role for those whose job is to turn tickets into pull requests through the act of physically writing code. I'll fully admit, about two years ago, that's what I *wanted* my job to be. Stock in that type of roll is dropping by the day, and it's time to figure out which of those specializations — developing theories, or managing their fabrication — best suits you. The alternative may be the door.
>%%TAGS%%
>
^r3yederfnbg



>%%
>```annotation-json
>{"text":"My understanding is that XP is a subset of Agile methodologies. While Cockburn seemed to be a major proponent of a similar-but-different system called Crystal at the time of his cosigning of the original Agile manifesto (which seems to have been followed up by [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)),, it makes sense to talk about XP here.\n\nThe only odd taste in my mouth is that Naur... well, he railed against methodologies pretty hard in the attached essay, so it feels odd to immediately segue into talking about how Naur's work *contributes* to a programming methodology.\n\nThe counterpoint is that Agile is general enough that it is not fully prescriptive. That is to say, it falls somewhere on the axis of abstract-to-concrete between Polya's wildly general problem solving framework, and something akin to, say, a full set of rules that Naur likened to line-workers' explicit directives. Structured output, but with freedom to adapt.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":37195,"end":37220},{"type":"TextQuoteSelector","exact":"Extreme Program-ming (XP)","prefix":"“metaphor building” activity in","suffix":", and the respective roles of ta"}]}],"created":"2026-02-15T20:52:36.980Z","updated":"2026-02-15T20:52:36.980Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%“metaphor building” activity in%%HIGHLIGHT%% ==Extreme Program-ming (XP)== %%POSTFIX%%, and the respective roles of ta*
>%%LINK%%[[#^4c1f4qwxlqo|show annotation]]
>%%COMMENT%%
>My understanding is that XP is a subset of Agile methodologies. While Cockburn seemed to be a major proponent of a similar-but-different system called Crystal at the time of his cosigning of the original Agile manifesto (which seems to have been followed up by [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)),, it makes sense to talk about XP here.
>
>The only odd taste in my mouth is that Naur... well, he railed against methodologies pretty hard in the attached essay, so it feels odd to immediately segue into talking about how Naur's work *contributes* to a programming methodology.
>
>The counterpoint is that Agile is general enough that it is not fully prescriptive. That is to say, it falls somewhere on the axis of abstract-to-concrete between Polya's wildly general problem solving framework, and something akin to, say, a full set of rules that Naur likened to line-workers' explicit directives. Structured output, but with freedom to adapt.
>%%TAGS%%
>
^4c1f4qwxlqo



>%%
>```annotation-json
>{"text":"In hindsight, I was *wildly* lucky to start my career in data analytics as engineering, as it drove this point home in a practical manner. Working with data, \"pipeline\" is the go-to analogy for... pretty much the whole thing, really. It demonstrates to newcomers exactly how these things work in a way that \"oh, it's [a DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph)\" might dive into abstraction too early.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":37470,"end":37684},{"type":"TextQuoteSelector","exact":"Examplesmight be, “This program really looks like an assemblyline, with things getting added to a chassis along theline,” or “This program really looks like a restaurant,with waiters and menus, cooks and cashiers.”","prefix":"ram to match a single metaphor.","suffix":"If the metaphor is good, the man"}]}],"created":"2026-02-15T20:55:24.610Z","updated":"2026-02-15T20:55:24.610Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ram to match a single metaphor.%%HIGHLIGHT%% ==Examplesmight be, “This program really looks like an assemblyline, with things getting added to a chassis along theline,” or “This program really looks like a restaurant,with waiters and menus, cooks and cashiers.”== %%POSTFIX%%If the metaphor is good, the man*
>%%LINK%%[[#^bh9spwun2ew|show annotation]]
>%%COMMENT%%
>In hindsight, I was *wildly* lucky to start my career in data analytics as engineering, as it drove this point home in a practical manner. Working with data, "pipeline" is the go-to analogy for... pretty much the whole thing, really. It demonstrates to newcomers exactly how these things work in a way that "oh, it's [a DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph)" might dive into abstraction too early.
>%%TAGS%%
>
^bh9spwun2ew



>%%
>```annotation-json
>{"text":"This becomes a technical problem in today's space — you have a limited amount of useful exploratory context in an agent's context window. What is the best way to make use of it? Too little, and there's not enough information to create a correct call. Too much, and you take up all the useful space and the need to summarize context will annihilate the useful information.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":39299,"end":39461},{"type":"TextQuoteSelector","exact":"This is enormously important. The purpose of thedocumentation is to jog memories in the reader, setup relevant pathways of thought about experiences andmetaphors.","prefix":"ad-equate theory of the program.","suffix":"This sort of documentation is mo"}]}],"created":"2026-02-15T20:57:40.650Z","updated":"2026-02-15T20:57:40.650Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%ad-equate theory of the program.%%HIGHLIGHT%% ==This is enormously important. The purpose of thedocumentation is to jog memories in the reader, setup relevant pathways of thought about experiences andmetaphors.== %%POSTFIX%%This sort of documentation is mo*
>%%LINK%%[[#^ppgfpuv8lgn|show annotation]]
>%%COMMENT%%
>This becomes a technical problem in today's space — you have a limited amount of useful exploratory context in an agent's context window. What is the best way to make use of it? Too little, and there's not enough information to create a correct call. Too much, and you take up all the useful space and the need to summarize context will annihilate the useful information.
>%%TAGS%%
>
^ppgfpuv8lgn


>%%
>```annotation-json
>{"text":"This certainly invokes a callback to [Diátaxis](https://diataxis.fr/), a general philosophy for technical writing. In particular, it places documentation styles into four categories: Tutorials, How-To, Explanation, and Reference.\n\nTo put this into Diataxis terms — this certainly seems to place weight on explanation, and potentially how-to, over tutorials and reference. I'm thinking, specifically, of the use of documentation for agentic purposes — tutorials are, obviously, critical for new users, regardless of human or bot status.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":39461,"end":39591},{"type":"TextQuoteSelector","exact":"This sort of documentation is more stable over the lifeof the program than just naming the pieces of the systemcurrently in place.","prefix":"about experiences andmetaphors.","suffix":"The designers are allowed to use"}]}],"created":"2026-02-15T20:57:53.555Z","updated":"2026-02-15T20:57:53.555Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%about experiences andmetaphors.%%HIGHLIGHT%% ==This sort of documentation is more stable over the lifeof the program than just naming the pieces of the systemcurrently in place.== %%POSTFIX%%The designers are allowed to use*
>%%LINK%%[[#^iqomeen61j|show annotation]]
>%%COMMENT%%
>This certainly invokes a callback to [Diátaxis](https://diataxis.fr/), a general philosophy for technical writing. In particular, it places documentation styles into four categories: Tutorials, How-To, Explanation, and Reference.
>
>To put this into Diataxis terms — this certainly seems to place weight on explanation, and potentially how-to, over tutorials and reference. I'm thinking, specifically, of the use of documentation for agentic purposes — tutorials are, obviously, critical for new users, regardless of human or bot status.
>%%TAGS%%
>
^iqomeen61j


>%%
>```annotation-json
>{"text":"Hot hell — what accounting software are they making, here?","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":39834,"end":39977},{"type":"TextQuoteSelector","exact":"implements a fractal compression al-gorithm, a second is like an accounting ledger, the userinterface follows the model-observer design pattern","prefix":"They mightsay that one section","suffix":", andso on.Experienced designers"}]}],"created":"2026-02-15T20:58:48.952Z","updated":"2026-02-15T20:58:48.952Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%They mightsay that one section%%HIGHLIGHT%% ==implements a fractal compression al-gorithm, a second is like an accounting ledger, the userinterface follows the model-observer design pattern== %%POSTFIX%%, andso on.Experienced designers*
>%%LINK%%[[#^w2gcwh74yro|show annotation]]
>%%COMMENT%%
>Hot hell — what accounting software are they making, here?
>%%TAGS%%
>
^w2gcwh74yro


>%%
>```annotation-json
>{"text":"This does feel like a nice, shorthand criteria for documentation. I've taken the approach of \"seed\" documentation — that is to say, when a project first begins, having a simple documentation seed with the metaphor. As the software grows, that's when higher stages of growth — drawings and purposes — come into play.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":39988,"end":40283},{"type":"TextQuoteSelector","exact":"Experienced designers often start their documenta-tion with just•The metaphors•Text describing the purpose of each major compo-nent•Drawings of the major interactions between the ma-jor componentsThese three items alone take the next team a longway to constructing a useful theory of the design.","prefix":"server design pattern, andso on.","suffix":"The source code itself serves to"}]}],"created":"2026-02-15T20:59:26.972Z","updated":"2026-02-15T20:59:26.972Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%server design pattern, andso on.%%HIGHLIGHT%% ==Experienced designers often start their documenta-tion with just•The metaphors•Text describing the purpose of each major compo-nent•Drawings of the major interactions between the ma-jor componentsThese three items alone take the next team a longway to constructing a useful theory of the design.== %%POSTFIX%%The source code itself serves to*
>%%LINK%%[[#^0oyz3jlryima|show annotation]]
>%%COMMENT%%
>This does feel like a nice, shorthand criteria for documentation. I've taken the approach of "seed" documentation — that is to say, when a project first begins, having a simple documentation seed with the metaphor. As the software grows, that's when higher stages of growth — drawings and purposes — come into play.
>%%TAGS%%
>
^0oyz3jlryima


>%%
>```annotation-json
>{"text":"This closes out on a nice note. Ultimately, what has been a struggle for both myself, and my peers, is that agents can output code too fast for a human being to read along with. It's been a drain on OSS projects, it's been a drain on private projects — it's a problem that our current tooling and faculties simply *cannot* keep up with.\n\nI'd like to believe that part of it is comprehensibility — the standards of clean code. I feel that LLMs are both the problem, and the potential solution. If a human needs to stay in the loop, then it is also on us to make sure we develop tooling to maintain theory, not just code.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":40446,"end":40591},{"type":"TextQuoteSelector","exact":"When people talk about “clean code,” a large partof what they are referring to is how easily the reader canbuild a coherent theory of the system.","prefix":"erson build a coherent the-ory.","suffix":"Documentation cannot—and so need"}]}],"created":"2026-02-15T21:00:07.983Z","updated":"2026-02-15T21:00:07.983Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%erson build a coherent the-ory.%%HIGHLIGHT%% ==When people talk about “clean code,” a large partof what they are referring to is how easily the reader canbuild a coherent theory of the system.== %%POSTFIX%%Documentation cannot—and so need*
>%%LINK%%[[#^nvs6ehy31o|show annotation]]
>%%COMMENT%%
>This closes out on a nice note. Ultimately, what has been a struggle for both myself, and my peers, is that agents can output code too fast for a human being to read along with. It's been a drain on OSS projects, it's been a drain on private projects — it's a problem that our current tooling and faculties simply *cannot* keep up with.
>
>I'd like to believe that part of it is comprehensibility — the standards of clean code. I feel that LLMs are both the problem, and the potential solution. If a human needs to stay in the loop, then it is also on us to make sure we develop tooling to maintain theory, not just code.
>%%TAGS%%
>
^nvs6ehy31o


>%%
>```annotation-json
>{"text":"If you ever need an endorsement of trying to chase citations all the way back to their sources, look no further! I recently read a post by [Steve Krouse,](https://bsky.app/profile/stevekrouse.com) [*Vibe code is legacy code*](https://blog.val.town/vibe-code), where it mentions the refrain:\n\n> [!QUOTE]\n> Programming is fundamentally theory building,\n\nThat one has been rattling around my brain for weeks, now. My industry is still in a massive shake-up brought on by [[/content/notes/hostage-negotiations|how good LLM agents have gotten at producing code]]. Needless to say, there are a *lot* of opinions on LLM usage. Trying to negotiate out my own relationship with the technology and overcome a growing pit in my stomach that represents the question \"Am I cooked?\" is something I'm actively working on.\n\nSteve Krouse's quote digs into this citation — a paper by [Peter Naur](https://en.wikipedia.org/wiki/Peter_Naur), who was influential in the earliest years of computer science as a forming discipline, and was married to [Christiane Floyd](https://en.wikipedia.org/wiki/Christiane_Floyd), who was heavily involved in the production of the first coding IDEs.\n\n(I did just attach his name to the term \"computer science\", but it *is* worth noting that he didn't like that term. He preferred — and coined — the term \"datalogy\", which [still sticks as the term for the discipline](https://www.researchgate.net/publication/220657031_Datalogy_-_The_Copenhagen_Tradition_of_Computer_Science) in his native Denmark.)\n\nLemme level with ya — this is going to get real heady, real fast. As background, Naur rejected the idea that computer science was itself a direct descendant from raw mathematics. This paper builds on that idea, and talks about the interface between actual programmatic processes/development and the human beings who create them. Many of the citations on this paper are philosophical essays and excerpts — one of them seeks to distinguish human thought from hydrogen atoms.\n\nStick around, though! If you share my anxiety about the role of humans in a world where LLMs have pretty much beaten us out in the act of writing code, this paper may be as cathartic for you as it has been for myself.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":0,"end":30},{"type":"TextQuoteSelector","exact":"Programming as Theory Building","prefix":"th50%75%100%125%150%200%300%400%","suffix":"Peter Naur1985Peter Naur’s class"}]}],"created":"2026-02-15T21:01:15.507Z","updated":"2026-02-15T21:01:15.507Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%th50%75%100%125%150%200%300%400%%%HIGHLIGHT%% ==Programming as Theory Building== %%POSTFIX%%Peter Naur1985Peter Naur’s class*
>%%LINK%%[[#^q2yc8bq3n7s|show annotation]]
>%%COMMENT%%
>If you ever need an endorsement of trying to chase citations all the way back to their sources, look no further! I recently read a post by [Steve Krouse,](https://bsky.app/profile/stevekrouse.com) [*Vibe code is legacy code*](https://blog.val.town/vibe-code), where it mentions the refrain:
>
>> [!QUOTE]
>> Programming is fundamentally theory building,
>
>That one has been rattling around my brain for weeks, now. My industry is still in a massive shake-up brought on by [[/content/notes/hostage-negotiations|how good LLM agents have gotten at producing code]]. Needless to say, there are a *lot* of opinions on LLM usage. Trying to negotiate out my own relationship with the technology and overcome a growing pit in my stomach that represents the question "Am I cooked?" is something I'm actively working on.
>
>Steve Krouse's quote digs into this citation — a paper by [Peter Naur](https://en.wikipedia.org/wiki/Peter_Naur), who was influential in the earliest years of computer science as a forming discipline, and was married to [Christiane Floyd](https://en.wikipedia.org/wiki/Christiane_Floyd), who was heavily involved in the production of the first coding IDEs.
>
>(I did just attach his name to the term "computer science", but it *is* worth noting that he didn't like that term. He preferred — and coined — the term "datalogy", which [still sticks as the term for the discipline](https://www.researchgate.net/publication/220657031_Datalogy_-_The_Copenhagen_Tradition_of_Computer_Science) in his native Denmark.)
>
>Lemme level with ya — this is going to get real heady, real fast. As background, Naur rejected the idea that computer science was itself a direct descendant from raw mathematics. This paper builds on that idea, and talks about the interface between actual programmatic processes/development and the human beings who create them. Many of the citations on this paper are philosophical essays and excerpts — one of them seeks to distinguish human thought from hydrogen atoms.
>
>Stick around, though! If you share my anxiety about the role of humans in a world where LLMs have pretty much beaten us out in the act of writing code, this paper may be as cathartic for you as it has been for myself.
>%%TAGS%%
>
^q2yc8bq3n7s


>%%
>```annotation-json
>{"text":"Among the engineers I've talked to, I feel that this distinction is precisely the thing that freaked them out. Imagine you're a software engineer in 2020, and you gauge your productivity in terms of \"Today, I made X pull requests with Y lines of code!\"\n\nNow, today, agentic systems are able to write code, *and* submit pull requests. You'd certainly feel at risk, wouldn't you?\n\nWhen I run into this form of anxiety, my go-to has been that our job is *not* writing code — it's architecting systems. I feel that this paper expresses a more mature and material backbone to that sentiment.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":713,"end":878},{"type":"TextQuoteSelector","exact":"This sugges-tion is in contrast to what appears to be a more commonnotion, that programming should be regarded as a pro-duction of a program and certain other texts.","prefix":"theory, of the matters at hand.","suffix":"Some of the background of the vi"}]}],"created":"2026-02-15T21:01:55.758Z","updated":"2026-02-15T21:01:55.758Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%theory, of the matters at hand.%%HIGHLIGHT%% ==This sugges-tion is in contrast to what appears to be a more commonnotion, that programming should be regarded as a pro-duction of a program and certain other texts.== %%POSTFIX%%Some of the background of the vi*
>%%LINK%%[[#^9f679skh0ql|show annotation]]
>%%COMMENT%%
>Among the engineers I've talked to, I feel that this distinction is precisely the thing that freaked them out. Imagine you're a software engineer in 2020, and you gauge your productivity in terms of "Today, I made X pull requests with Y lines of code!"
>
>Now, today, agentic systems are able to write code, *and* submit pull requests. You'd certainly feel at risk, wouldn't you?
>
>When I run into this form of anxiety, my go-to has been that our job is *not* writing code — it's architecting systems. I feel that this paper expresses a more mature and material backbone to that sentiment.
>%%TAGS%%
>
^9f679skh0ql



>%%
>```annotation-json
>{"text":"This is going to be a real Youth Moment™, but here we go:\n\nI did have to double-check when git was initially introduced ([April 7th, 2005](https://github.com/git/git/commit/e83c5163316f89bfbde7d9ab23ca2e25604af290#diff-2b7814d3fca2e99e56c51b6ff2aa313ea6e9da6424804240aa8ad891fdfe0900R2)) — about 20 years after this paper was published. I'm not sure if the idea of version control, pull requests, etc. preceded git, but we're definitely seeing some of this etiquette here.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":4124,"end":4274},{"type":"TextQuoteSelector","exact":"During thedesign phase group B made suggestions for the mannerin which the extensions should be accommodated andsubmitted them to group A for review. ","prefix":"e extensions M to the language.","suffix":"In several majorcases it turned"}]}],"created":"2026-02-15T21:07:14.342Z","updated":"2026-02-15T21:07:14.342Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%e extensions M to the language.%%HIGHLIGHT%% ==During thedesign phase group B made suggestions for the mannerin which the extensions should be accommodated andsubmitted them to group A for review.== %%POSTFIX%%In several majorcases it turned*
>%%LINK%%[[#^zvdtt8sxul|show annotation]]
>%%COMMENT%%
>This is going to be a real Youth Moment™, but here we go:
>
>I did have to double-check when git was initially introduced ([April 7th, 2005](https://github.com/git/git/commit/e83c5163316f89bfbde7d9ab23ca2e25604af290#diff-2b7814d3fca2e99e56c51b6ff2aa313ea6e9da6424804240aa8ad891fdfe0900R2)) — about 20 years after this paper was published. I'm not sure if the idea of version control, pull requests, etc. preceded git, but we're definitely seeing some of this etiquette here.
>%%TAGS%%
>
^zvdtt8sxul


>%%
>```annotation-json
>{"text":"This is where we see echos of the current misalignment problems with agents. If each agent has a slightly different theory, it becomes easy to drift over time. While I wouldn't call this an issue unique to agents — I've made my fair share of misaligned PRs, after all. What does change, though, is the rate at which drift occurs. If an agent can output 10x the code a human developer could in the same time window, I believe it could also produce 10x the amount of theoretical drift a human developer would.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":38518,"end":38575},{"type":"TextQuoteSelector","exact":"Each will necessarily develop herown theory as she goes. ","prefix":"and addingclasses as she goes.","suffix":"As each adds code, the the-ory t"}]}],"created":"2026-02-15T20:56:54.651Z","updated":"2026-02-15T20:56:54.651Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%and addingclasses as she goes.%%HIGHLIGHT%% ==Each will necessarily develop herown theory as she goes.== %%POSTFIX%%As each adds code, the the-ory t*
>%%LINK%%[[#^1k0fchxnfz7|show annotation]]
>%%COMMENT%%
>This is where we see echos of the current misalignment problems with agents. If each agent has a slightly different theory, it becomes easy to drift over time. While I wouldn't call this an issue unique to agents — I've made my fair share of misaligned PRs, after all. What does change, though, is the rate at which drift occurs. If an agent can output 10x the code a human developer could in the same time window, I believe it could also produce 10x the amount of theoretical drift a human developer would.
>%%TAGS%%
>
^1k0fchxnfz7


>%%
>```annotation-json
>{"created":"2026-02-15T22:23:58.885Z","text":"> [!QUOTE]\n> Whatever you are, be a good one.\n> \n> — [Mike Birbiglia](https://youtu.be/jQB_zhddfFg?&t=123), possibly Abraham Lincoln\n\nI won't name specific examples, but I think that we can all picture, in our minds, a software that did one thing remarkably well at some point, but was ultimately undermined by other pieces of functionality being tacked onto the site, diluting the vision of the original solution.","updated":"2026-02-15T22:23:58.885Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":5225,"end":5519},{"type":"TextQuoteSelector","exact":"Information obtained by a member of group A aboutthe compiler resulting from the further modification of itafter about 10 years made it clear that at that later stagethe original powerful structure was still visible, but madeentirely ineffective by amorphous additions of many dif-ferent kinds.","prefix":", without guidance from groupA. ","suffix":" Thus, again, the program text a"}]}]}
>```
>%%
>*%%PREFIX%%, without guidance from groupA.%%HIGHLIGHT%% ==Information obtained by a member of group A aboutthe compiler resulting from the further modification of itafter about 10 years made it clear that at that later stagethe original powerful structure was still visible, but madeentirely ineffective by amorphous additions of many dif-ferent kinds.== %%POSTFIX%%Thus, again, the program text a*
>%%LINK%%[[#^7bl4vgvqkbq|show annotation]]
>%%COMMENT%%
>> [!QUOTE]
>> Whatever you are, be a good one.
>> 
>> — [Mike Birbiglia](https://youtu.be/jQB_zhddfFg?&t=123), possibly Abraham Lincoln
>
>I won't name specific examples, but I think that we can all picture, in our minds, a software that did one thing remarkably well at some point, but was ultimately undermined by other pieces of functionality being tacked onto the site, diluting the vision of the original solution.
>%%TAGS%%
>
^7bl4vgvqkbq


>%%
>```annotation-json
>{"created":"2026-02-15T22:55:26.619Z","text":"Once LLMs can fish, we're *really* cooked.","updated":"2026-02-15T22:55:26.619Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":8545,"end":8651},{"type":"TextQuoteSelector","exact":"the ability to do certain things,such as to make and appreciate jokes, to talk grammat-ically, or to fish.","prefix":"rticularknowledge of facts, but ","suffix":" More particularly, the intellig"}]}]}
>```
>%%
>*%%PREFIX%%rticularknowledge of facts, but%%HIGHLIGHT%% ==the ability to do certain things,such as to make and appreciate jokes, to talk grammat-ically, or to fish.== %%POSTFIX%%More particularly, the intellig*
>%%LINK%%[[#^fclos0jlsh|show annotation]]
>%%COMMENT%%
>Once LLMs can fish, we're *really* cooked.
>%%TAGS%%
>
^fclos0jlsh


>%%
>```annotation-json
>{"created":"2026-02-15T22:56:33.928Z","text":"This certainly has modern echoes in prompt engineering — which can often [feel more like alchemy than actual engineering](https://bsky.app/profile/danabra.mov/post/3mea7nieur227).","updated":"2026-02-15T22:56:33.928Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":9218,"end":9431},{"type":"TextQuoteSelector","exact":"if the exercise of intelligencedepended on following rules there would have to be rulesabout how to follow rules, and about how to follow therules about following rules, etc. in an infinite regress,which is absurd","prefix":"donemore or less intelligently; ","suffix":".What characterizes intellectual"}]}]}
>```
>%%
>*%%PREFIX%%donemore or less intelligently;%%HIGHLIGHT%% ==if the exercise of intelligencedepended on following rules there would have to be rulesabout how to follow rules, and about how to follow therules about following rules, etc. in an infinite regress,which is absurd== %%POSTFIX%%.What characterizes intellectual*
>%%LINK%%[[#^gd5iff7guhu|show annotation]]
>%%COMMENT%%
>This certainly has modern echoes in prompt engineering — which can often [feel more like alchemy than actual engineering](https://bsky.app/profile/danabra.mov/post/3mea7nieur227).
>%%TAGS%%
>
^gd5iff7guhu


>%%
>```annotation-json
>{"text":"I recently judged a local high school debate tournament at the request of a friend of mine, and it was a real \"the kids are alright\" moment in my life. I competed in speech and debate at that age myself — at one point, I was able to chat with a few of the students whose round I judged earlier. Asking about how, if at all, the wider use of technology in rounds (and availability of LLMs in writing cases) is a part of their process, their general sentiment was wildly encouraging:\n\n> [!QUOTE]\n> AI can build something that looks like a strong case, but it's only a strong case if you can defend it.\n\nThat's a wildly succinct way to frame an inherent conflict in LLMs: depending on how you use them, you can either:\n\n1. Use them to research information to bolster theories you're developing; or\n2. Subsidize developing your own theory by offloading a harmful amount of critical thinking onto an LLM.\n\nThat's exactly the case for cases — eventually, you have to defend them.\n\n---\n\nI believe the same applies to the work of software development, and to theories in the philosophical abstract sense. I've begun to encounter instances, in all areas of my life, where somebody sends me an AI-generated reply to a concept. We're now at the point where people submit pull requests with Claude, or Copilot, as a co-author.\n\nI *despise* this. Not that Claude (or any other model) is used to assist development, but that the LLM itself is being listed as a co-author.\n\nThere's a level of responsibility and accountability that, I feel, can only come from a human being. The concept of a theory as a feature of consciousness — something an LLM architecturally lacks — seems to support this. I have no problem with anybody using agents to write code. I *do* have a problem with using it as a stand-in for personal responsibility. If you could not, without support from the LLM, justify the changes you are proposing, **you should not be proposing those changes.**\n\nThis is one of the many things in this essay that resonates with me the most, and helps provide a framework backing what I feel intuitively: that AI-generated code without human endorsement — without a *theory* to support it — is the definition of a low-effort contribution.","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":9573,"end":9900},{"type":"TextQuoteSelector","exact":"where theory is understoodas the knowledge a person must have in order not only todo certain things intelligently but also to explain them,to answer queries about them, to argue about them, andso forth. A person who has a theory is prepared to enterinto such activities; while building the theory the personis trying to get it.","prefix":"’sbuilding and having a theory,","suffix":"The notion of theory in the sens"}]}],"created":"2026-02-15T23:02:44.463Z","updated":"2026-02-15T23:02:44.463Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%’sbuilding and having a theory,%%HIGHLIGHT%% ==where theory is understoodas the knowledge a person must have in order not only todo certain things intelligently but also to explain them,to answer queries about them, to argue about them, andso forth. A person who has a theory is prepared to enterinto such activities; while building the theory the personis trying to get it.== %%POSTFIX%%The notion of theory in the sens*
>%%LINK%%[[#^fsn7yf99a7|show annotation]]
>%%COMMENT%%
>I recently judged a local high school debate tournament at the request of a friend of mine, and it was a real "the kids are alright" moment in my life. I competed in speech and debate at that age myself — at one point, I was able to chat with a few of the students whose round I judged earlier. Asking about how, if at all, the wider use of technology in rounds (and availability of LLMs in writing cases) is a part of their process, their general sentiment was wildly encouraging:
>
>> [!QUOTE]
>> AI can build something that looks like a strong case, but it's only a strong case if you can defend it.
>
>That's a wildly succinct way to frame an inherent conflict in LLMs: depending on how you use them, you can either:
>
>1. Use them to research information to bolster theories you're developing; or
>2. Subsidize developing your own theory by offloading a harmful amount of critical thinking onto an LLM.
>
>That's exactly the case for cases — eventually, you have to defend them.
>
>---
>
>I believe the same applies to the work of software development, and to theories in the philosophical abstract sense. I've begun to encounter instances, in all areas of my life, where somebody sends me an AI-generated reply to a concept. We're now at the point where people submit pull requests with Claude, or Copilot, as a co-author.
>
>I *despise* this. Not that Claude (or any other model) is used to assist development, but that the LLM itself is being listed as a co-author.
>
>There's a level of responsibility and accountability that, I feel, can only come from a human being. The concept of a theory as a feature of consciousness — something an LLM architecturally lacks — seems to support this. I have no problem with anybody using agents to write code. I *do* have a problem with using it as a stand-in for personal responsibility. If you could not, without support from the LLM, justify the changes you are proposing, **you should not be proposing those changes.**
>
>This is one of the many things in this essay that resonates with me the most, and helps provide a framework backing what I feel intuitively: that AI-generated code without human endorsement — without a *theory* to support it — is the definition of a low-effort contribution.
>%%TAGS%%
>
^fsn7yf99a7


>%%
>```annotation-json
>{"created":"2026-02-18T17:47:10.646Z","text":"Anybody who has worked in industry, and had vague requirements given to them, should feel this pain acutely — trying to design around some future, unknown requirements is a costly endeavor, even with LLM agents.\n\nIf anything, LLM agents make this an even a larger problem — in a world where stakeholders think \"Oh, we can just have an agent make the change!\", it puts the onus on the original architecture to accommodate some set of design patterns that put extensibility at the forefront — admittedly, a proposition that almost inherently undermines performance.","updated":"2026-02-18T17:47:10.646Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":17837,"end":18208},{"type":"TextQuoteSelector","exact":"However, flexibility can in general onlybe achieved at a substantial cost. Each item of it hasto be designed, including what circumstances it has tocover and by what kind of parameters it should be con-trolled. Then it has to be implemented, tested, and de-scribed. This cost is incurred in achieving a program fea-ture whose usefulness depends entirely on future events.","prefix":"be easily achievedis concerned. ","suffix":"It must be obvious that built–in"}]}]}
>```
>%%
>*%%PREFIX%%be easily achievedis concerned.%%HIGHLIGHT%% ==However, flexibility can in general onlybe achieved at a substantial cost. Each item of it hasto be designed, including what circumstances it has tocover and by what kind of parameters it should be con-trolled. Then it has to be implemented, tested, and de-scribed. This cost is incurred in achieving a program fea-ture whose usefulness depends entirely on future events.== %%POSTFIX%%It must be obvious that built–in*
>%%LINK%%[[#^onky4d79t5|show annotation]]
>%%COMMENT%%
>Anybody who has worked in industry, and had vague requirements given to them, should feel this pain acutely — trying to design around some future, unknown requirements is a costly endeavor, even with LLM agents.
>
>If anything, LLM agents make this an even a larger problem — in a world where stakeholders think "Oh, we can just have an agent make the change!", it puts the onus on the original architecture to accommodate some set of design patterns that put extensibility at the forefront — admittedly, a proposition that almost inherently undermines performance.
>%%TAGS%%
>
^onky4d79t5


>%%
>```annotation-json
>{"text":"It is important to note that this is the end of Naur's writing — I believe the authorship here has switched to [Alistair Cockburn](https://alistaircockburn.com/), who republished this essay as part of [*Agile Software Development: The Cooperative Game](https://gwern.net/doc/cs/algorithm/1985-naur.pdf), published in 2006.\n\nCockburn is one of the founding members of a coalition of software developers who originally coined Agile development in a [2001 manifesto](https://agilemanifesto.org/) (which, fun fact, was the result of a meeting in Snowbird, Utah!).","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":37077,"end":37103},{"type":"TextQuoteSelector","exact":"Applying “Theory Building”","prefix":"1949. Applying“Theory Building”","suffix":"Viewing programming as theory bu"}]}],"created":"2026-02-18T20:21:13.681Z","updated":"2026-02-18T20:21:13.681Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}
>```
>%%
>*%%PREFIX%%1949. Applying“Theory Building”%%HIGHLIGHT%% ==Applying “Theory Building”== %%POSTFIX%%Viewing programming as theory bu*
>%%LINK%%[[#^7335qhleqr7|show annotation]]
>%%COMMENT%%
>It is important to note that this is the end of Naur's writing — I believe the authorship here has switched to [Alistair Cockburn](https://alistaircockburn.com/), who republished this essay as part of [*Agile Software Development: The Cooperative Game](https://gwern.net/doc/cs/algorithm/1985-naur.pdf), published in 2006.
>
>Cockburn is one of the founding members of a coalition of software developers who originally coined Agile development in a [2001 manifesto](https://agilemanifesto.org/) (which, fun fact, was the result of a meeting in Snowbird, Utah!).
>%%TAGS%%
>
^7335qhleqr7


>%%
>```annotation-json
>{"created":"2026-02-18T20:58:06.305Z","text":"Here we are — this is a major crux of this paper, as it relates to modern agentic development. We're at a point where an agent can develop code faster than a human-in-the-loop could ever hope to understand it. By this definition, agentic code that gets rubber-stamped by the developer is dead-on-arrival.\n\nHow can we stop DOA code from being generated? It *has* to be in tooling — both in developing prompts, systems, and frameworks that help agents better conform to a theory, and for tooling that helps humans keep up with LLM generation in a way that theory doesn't drift into a deadzone over time.","updated":"2026-02-18T20:58:06.305Z","document":{"title":"Programming as Theory Building","link":[{"href":"urn:x-pdf:90bce12dc08df51c58c2476dee0c7107"},{"href":"https://pablo.rauzy.name/dev/naur1985programming.pdf"}],"documentFingerprint":"90bce12dc08df51c58c2476dee0c7107"},"uri":"https://pablo.rauzy.name/dev/naur1985programming.pdf","target":[{"source":"https://pablo.rauzy.name/dev/naur1985programming.pdf","selector":[{"type":"TextPositionSelector","start":22360,"end":22449},{"type":"TextQuoteSelector","exact":"he death of a program happenswhen the programmer team possessing its theory is dis-solved","prefix":"controlover all modifications. T","suffix":". A dead program may continue to"}]}]}
>```
>%%
>*%%PREFIX%%controlover all modifications. T%%HIGHLIGHT%% ==he death of a program happenswhen the programmer team possessing its theory is dis-solved== %%POSTFIX%%. A dead program may continue to*
>%%LINK%%[[#^teupzfur7oa|show annotation]]
>%%COMMENT%%
>Here we are — this is a major crux of this paper, as it relates to modern agentic development. We're at a point where an agent can develop code faster than a human-in-the-loop could ever hope to understand it. By this definition, agentic code that gets rubber-stamped by the developer is dead-on-arrival.
>
>How can we stop DOA code from being generated? It *has* to be in tooling — both in developing prompts, systems, and frameworks that help agents better conform to a theory, and for tooling that helps humans keep up with LLM generation in a way that theory doesn't drift into a deadzone over time.
>%%TAGS%%
>
^teupzfur7oa
