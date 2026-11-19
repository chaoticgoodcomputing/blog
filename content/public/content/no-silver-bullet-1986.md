---
title: "No Silver Bullet: Essence and Accident in Software Engineering"
date: 2026-11-06
updated: 2026-11-18
tags:
  - engineering
  - engineering/ai
  - economics/management
  - reading/papers
  - writing/notes
annotation-target: https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf
description: A set of annotations on the seminal computation and project management paper, No Silver Bullet, by Frederick Brooks (1986)
annotation-pages:
annotation-public: true
---
I recently got into a discussion about [computer-aided software engineering](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) with some folks, recently, for... [[public/tags/engineering/ai|reasons that should be obvious]].

For some context: Brooks is the author of [*The Mythical Man-Month*](https://en.wikipedia.org/wiki/The_Mythical_Man-Month), originally published in 1975, about engineering and project management. It's been awhile since reading it ("awhile" meaning 2022, at the recommendation of my manager at the time), but the book's core premise is that adding more engineering hours to a project doesn't necessarily make it complete faster: a combination of an irreducible core of work, with added management overhead in parallelization and coordination of work, may end up delaying it.

In this particular paper, written 9 years after *The Mythical Man-Month*, Brooks defines a framework for evaluating the potential lower bound for optimizations in software engineering. In particular, the key premise is that time spent software engineering (defined loosely as taking an idea and [[public/content/annotations/programming-as-theory-building.md|converting it into a runnable computer program]]) is spent in either two areas of work:[^1]

- **Accidental** work, which "attend its production, but are not inherent"; and
- **Essential** work, which is "inherent to the nature of the software"
  
In thinking about optimization, he categorizes a silver bullet as something that might decrease the amount of time it takes to complete a task by an order of magnitude (10x). His conclusion, looking on the horizon from 1986, was that there weren't any clear silver bullets.

Obviously, we have the benefit of hindsight. You might think that this post is solely about modern LLM and agentic development,[^2] but there's been a *lot* of ground to cover in the software optimization space since then. The first Mac and Windows machines were released in 1984 and 1985, respectively, just a couple years before the paper was written. IDEs and object-oriented programming were just barely entering the scene. Development by rapid iteration -- which he does actually touch on, if in spirit if not in name -- wasn't formalized into the modern Agile we're familiar with until 25 years later.

Writing with 40 years of hindsight, and with modern agents being capable of massive speedups[^3], there's no better time to think about the essentials and accidentals in the profession.

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5e07b64b-9265-4544-82d2-6f1fda0a6f2f","type":"Annotation","motivation":"commenting","body":{"id":"#^9ozg40riczb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1007,"end":1149},{"type":"TextQuoteSelector","exact":"Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.","prefix":"l, as opposed to the essential? ","suffix":"Therefore it appears that the ti"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:40:29.215Z","modified":"2026-11-10T14:54:19.905Z","hypothesis":{"id":"IOM7HuMIEfG5hDNQ29C69A","digest":"e06ae8fb3e602","page":{"id":"IQjt-uMIEfGxYeO2LgH2JA","digest":"1a44eddf95a3f3"}}}
> ```
> %%
> I think that this premise hits a bit differently in 2026 than it did in 1986.
>
> First: even though Brooks is framing "Silver Bullet" as an order-of-magnitude improvement, this isn't necessarily a binary, true/false "anything less is useless": simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.
>
> In the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that's where the optimization question gets even more philosophical than Brooks puts it, here. I'm especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they're responsible for).
^9ozg40riczb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9595dd47-9bfc-471a-bc3a-d8505b39402a","type":"Annotation","motivation":"commenting","body":{"id":"#^vjg26uls6ae","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1502,"end":1531},{"type":"TextQuoteSelector","exact":"Growing software organically,","prefix":"tablishing software requirements. ","suffix":" adding more and more function t"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:42:14.954Z","modified":"2026-11-10T14:45:40.331Z","hypothesis":{"id":"IS_E_OMIEfGjbd_x_Mabpw","digest":"11b5628662b59c","page":{"id":"IVc9euMIEfG9EacSKktCxQ","digest":"c7d949184652"}}}
> ```
> %%
> I mean... [[public/content/notes/software-gardening.mdx|I can't *not* bring it up.]]
^vjg26uls6ae


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8c76221b-77ad-4955-b84b-663adf9a2372","type":"Annotation","motivation":"commenting","body":{"id":"#^tkmanyd0vh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4605,"end":4696},{"type":"TextQuoteSelector","exact":"he transformation of computer manufacture from an assembly industry into a process industry.","prefix":"ed costs. These gains flow from t","suffix":"Second, to see what rate of prog"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:45:52.475Z","modified":"2026-11-10T15:18:11.856Z","hypothesis":{"id":"IXy09uMIEfG0xoPCslOIlQ","digest":"1f132691fac97a","page":{"id":"IZ7GSuMIEfGcWbvZx5j-SA","digest":"c77e5bf54ba51"}}}
> ```
> %%
> It's important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.
>
> I think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.
^tkmanyd0vh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4687d939-3394-4435-bed2-837709f917fe","type":"Annotation","motivation":"commenting","body":{"id":"#^vyepyaspik","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4824,"end":4997},{"type":"TextQuoteSelector","exact":"I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.","prefix":"ficulties. Following Aristotle, ","suffix":"The accidents I discuss in the n"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:46:40.788Z","modified":"2026-11-10T15:19:30.218Z","hypothesis":{"id":"IcLDQuMIEfG5oBdrz4938A","digest":"54c9dc5735185","page":{"id":"IecMSOMIEfGYfMu0wGEfvA","digest":"11c8c2b060ba28"}}}
> ```
> %%
> Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.
^vyepyaspik


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4d69f8b6-dea0-43f4-b681-7cdf20b1f5c3","type":"Annotation","motivation":"commenting","body":{"id":"#^x4uisgky7tj","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5394,"end":5701},{"type":"TextQuoteSelector","exact":"I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.","prefix":"hly precise and richly detailed. ","suffix":""},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:47:19.934Z","modified":"2026-11-10T15:21:04.436Z","hypothesis":{"id":"Ig0M9OMIEfGLdMcyzioqWg","digest":"1909dbf0d7f3f6","page":{"id":"IjsPguMIEfGxmCuctBzG7w","digest":"e33e79814f639"}}}
> ```
> %%
> This is a massive issue that I broach in both the [[public/content/dead-math.md|Gherkin post]], as well as touching on my own experience trying to resurrect "dead" software, as defined in [[public/content/annotations/programming-as-theory-building.md|Programming as Theory Building]].
^x4uisgky7tj


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:86485653-2229-4361-906f-d5c781d08617","type":"Annotation","motivation":"commenting","body":{"id":"#^vqhlzf6jdks","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":6963,"end":7143},{"type":"TextQuoteSelector","exact":"The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.","prefix":"creases much more than linearly. ","suffix":" Mathematics and the physical sc"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:53:50.156Z","modified":"2026-11-10T21:26:25.550Z","hypothesis":{"id":"ImdFtuMIEfGXQc88Fdx6gA","digest":"eff963cef1a1","page":{"id":"Ios1ouMIEfGBousZskzbLg","digest":"a50fc0e6f582d"}}}
> ```
> %%
> Brooks gets into this later, but... yeah. That also came up in the background research for CASE programs during [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]. It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [[public/tags/projects/flowthru|Flowthru]], for example, lends itself well to a visualization, but that's only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get... horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It's effectively be an orthogonal axis to the DAG, adding an additional dimensionality.
>
> Brooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.
^vqhlzf6jdks


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7a9e9ec1-7273-4fa6-bca9-c174b90d6009","type":"Annotation","motivation":"commenting","body":{"id":"#^pprm61om6t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":7801,"end":7959},{"type":"TextQuoteSelector","exact":"From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.","prefix":" cost overruns, schedule delays. ","suffix":" From the complexity of the func"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:59:49.692Z","modified":"2026-11-10T21:28:12.429Z","hypothesis":{"id":"IqnA-OMIEfGw6PemW7n4mA","digest":"1bde86204412d","page":{"id":"ItGQLuMIEfGcWisf563brQ","digest":"1fd7d34a3b706c"}}}
> ```
> %%
> [[public/content/dead-math#Why Proofs?|This section on formal verification and proofs]] talks about this a bit. Even the Red Team's research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today's technology, be out of the realm of possibility.
^pprm61om6t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ecff3bf-adc9-437a-a6c6-ba36d1ae4472","type":"Annotation","motivation":"commenting","body":{"id":"#^f7geh76bbjl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":8513,"end":8613},{"type":"TextQuoteSelector","exact":"It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.","prefix":"and control all the loose ends. ","suffix":"Conformity. Software people are "},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:08.322Z","modified":"2026-11-10T21:34:52.015Z","hypothesis":{"id":"IveySuMIEfGZcjdANwtALQ","digest":"60cb4f12370f6","page":{"id":"Ix9EhuMIEfGjbkfqGsMZtA","digest":"1f37007ddad640"}}}
> ```
> %%
> This is *exactly* what [[public/content/annotations/programming-as-theory-building#^7ppb5sf3ycw|Naur talks about]]. Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.
>
> This is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don't fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.
^f7geh76bbjl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b910316c-2896-484d-a3ad-83793f911e24","type":"Annotation","motivation":"commenting","body":{"id":"#^ulc2nm1bo4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9029,"end":9185},{"type":"TextQuoteSelector","exact":"No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human","prefix":" is not capricious or arbitrary. ","suffix":""},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:53.203Z","modified":"2026-11-10T21:36:26.044Z","hypothesis":{"id":"I0iVDOMIEfGu4PuwQJXcaw","digest":"4bbdb89952a6b","page":{"id":"I2wS3uMIEfGYffsW2vRj3g","digest":"13ba44a2589e6"}}}
> ```
> %%
> I do feel this one deeply. As part of my [[public/tags/projects/dayjob|dayjob]], I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.
^ulc2nm1bo4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:847428ca-9bdc-4ebf-85eb-d0e867be13c2","type":"Annotation","motivation":"commenting","body":{"id":"#^v9h1tk6pcnb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9493,"end":9800},{"type":"TextQuoteSelector","exact":"In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.","prefix":"rent people, rather than by God. ","suffix":"Changeability. The software enti"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T20:05:36.052Z","modified":"2026-11-10T21:52:38.256Z","hypothesis":{"id":"I5Hg1uMIEfGCJ6M7dN__Tg","digest":"1998b34feb897a","page":{"id":"I7pjsuMIEfGEscewQr91yw","digest":"19f459e66bdcfa"}}}
> ```
> %%
> I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they'll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.
>
> Conversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* -- that is to say, I can make decisions autonomously without much fear that I'll, say, lose business or alienate anyone.
>
> Software, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:
>
> - Z is for patches (small fixes that don't modify functionality
> - Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won't break any users' switching
> - X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.
>
> It's not unusual to see early software go through many breaking changes while it's a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).
^v9h1tk6pcnb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f7a2e78f-2e1f-45a2-8eb8-e479ad97fd1f","type":"Annotation","motivation":"commenting","body":{"id":"#^732yguy522u","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":12130,"end":12231},{"type":"TextQuoteSelector","exact":"we find it to constitute not one, but several, general directed graphs, superimposed one upon another.","prefix":"t to diagram software structure, ","suffix":" The several graphs may represen"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T22:08:42.822Z","modified":"2026-11-07T22:08:42.822Z","hypothesis":{"id":"I95_VOMIEfGTWbvFXgqH2w","digest":"70e7513539eb5","page":{"id":"JAGVDOMIEfGUaWM5JX-9Pw","digest":"1f196e293350ab"}}}
> ```
> %%
> .
^732yguy522u


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7c70a2dd-121a-4181-b1f1-cf690b8972c8","type":"Annotation","motivation":"commenting","body":{"id":"#^hd9oddco1o7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15479,"end":15601},{"type":"TextQuoteSelector","exact":"arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.","prefix":" going on in a complex system. 2 P","suffix":""},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:09:36.128Z","modified":"2026-11-13T15:44:07.672Z","hypothesis":{"id":"JCT4duMIEfGG7AcmzZZdzg","digest":"1591d0a88d19cc","page":{"id":"JEqp4OMIEfGfJpMSxP8s2Q","digest":"13acaaed8726da"}}}
> ```
> %%
> [Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)
^hd9oddco1o7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1fcbe46a-9374-48c7-b7e2-af2277b7188e","type":"Annotation","motivation":"commenting","body":{"id":"#^sasqm0mbvyd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":13331,"end":13671},{"type":"TextQuoteSelector","exact":"High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.","prefix":"trapolation of each such attack. ","suffix":"What does a high-level language "},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:10:18.916Z","modified":"2026-11-13T14:50:20.099Z","hypothesis":{"id":"JG9W5uMIEfGG7Z_p6ndYiQ","digest":"179a2e5b43810a","page":{"id":"JJB6puMIEfGxmvfX_3VpNg","digest":"66c1637e3ae1a"}}}
> ```
> %%
> While this is definitely the case, I'd say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can't be effectively linted becomes harder to scale against than is offset by their ease of use.
>
> This is specifically around non-prototyping. That's worth distinguishing.
^sasqm0mbvyd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6d4682fb-d70b-4906-9e20-6bc55a832c74","type":"Annotation","motivation":"commenting","body":{"id":"#^57h8rfdym18","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14563,"end":14746},{"type":"TextQuoteSelector","exact":"Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.","prefix":"r to the sophistication of users. ","suffix":"Time-sharing. Most observers cre"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:11:16.771Z","modified":"2026-11-13T15:02:22.480Z","hypothesis":{"id":"JLUjpuMIEfGIzfMB96oLxw","digest":"18c99405d1a196","page":{"id":"JNmUXOMIEfG0B8uY4r_pkQ","digest":"1cbbefb0b3d67b"}}}
> ```
> %%
> Ah, yeah -- this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall -- I haven't read the book since college) talks about the idea of "good abstractions" and "bad abstractions".
>
> It can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the "rules" require carve-outs, which is a slippery slope towards having no rules at all.
>
> Frameworks also have the same... I won't call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it's necessary to understand that there truly is no "silver bullet" among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* -- but there truly is no "everything" framework.
^57h8rfdym18


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3f255411-7368-4881-b687-277d9cd7a940","type":"Annotation","motivation":"commenting","body":{"id":"#^eicluc87x9t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15876,"end":16080},{"type":"TextQuoteSelector","exact":"The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.","prefix":"of time-sharing derive directly. ","suffix":"Unified programming environments"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-07T22:31:01.338Z","modified":"2026-11-13T15:53:47.240Z","hypothesis":{"id":"JP9Y9OMIEfG0CCMG-uQG7w","digest":"551adb0d64b35","page":{"id":"JSDanOMIEfGyHB8dFcWs2A","digest":"1442971edadcca"}}}
> ```
> %%
> The idea of shortening system response time is *so underrated* -- and far harder than Brooks makes it out to be. I talk about this a lot in both [[public/content/notes/software-gardening.mdx|Software Gardening]] and its precursor, [[public/content/notes/hostage-negotiations|Hostage Negotiations]]: rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.
>
> A lot of my attitude on immediate feedback was borne from my time doing [[public/content/articles/structured-streaming.md|data pipelines on Databricks/PySpark]]. That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.
^eicluc87x9t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:82d926aa-2f7d-4c4b-b3ba-5f600e9938c1","type":"Annotation","motivation":"commenting","body":{"id":"#^bfauk520glo","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15101,"end":15476},{"type":"TextQuoteSelector","exact":"The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.","prefix":"tain an overview of complexity. ","suffix":"2 Parnas, D.L., “Designing softw"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:31:59.691Z","modified":"2026-11-13T15:43:14.400Z","hypothesis":{"id":"JUtLBuMIEfGpTO-I9Pr0uA","digest":"1f5a83a3897bec","page":{"id":"JXF_auMIEfGcWwt2azEenQ","digest":"10134aee429612"}}}
> ```
> %%
> Thinking about this in terms of 1986 versus 2026, batch programming feels more like a "push" in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)
^bfauk520glo


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0a5a63da-439e-41f3-9790-8cc03a8c4d6c","type":"Annotation","motivation":"commenting","body":{"id":"#^yfp6g5ihhb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21051,"end":21249},{"type":"TextQuoteSelector","exact":"Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4","prefix":"g a program product. I doubt it. ","suffix":" I do not. To see why, we must d"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:32:40.645Z","modified":"2026-11-17T15:52:23.000Z","hypothesis":{"id":"JZemQOMIEfGeGpMcJ9we_A","digest":"22a35418305cc","page":{"id":"JcE_HuMIEfGtWgNTypQy_g","digest":"317f8d90d0120"}}}
> ```
> %%
> This bit of the paper feels *prescient* when you read it out of context, but it's so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn't pan out then, but here we are now.
^yfp6g5ihhb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b3d43a2e-ab25-405d-a932-ed1c2a033fd8","type":"Annotation","motivation":"commenting","body":{"id":"#^8kwbn6w8ess","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22004,"end":22124},{"type":"TextQuoteSelector","exact":"Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).","prefix":"alif.: Benjamin Cummings, 1983. 4 ","suffix":""},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:33:03.124Z","modified":"2026-11-17T15:53:04.612Z","hypothesis":{"id":"JfZftOMIEfGa8I9uZb9LKA","digest":"1d7ed97f8e55f2","page":{"id":"Jh1FDOMIEfGzg3enDn6fkQ","digest":"14c336fb54d959"}}}
> ```
> %%
> [Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)
^8kwbn6w8ess


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:234b7bdf-0b07-4270-a94f-a7b060bd9cb6","type":"Annotation","motivation":"commenting","body":{"id":"#^m2tflg196ud","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14746,"end":14759},{"type":"TextQuoteSelector","exact":"Time-sharing.","prefix":"ely uses the esoteric constructs. ","suffix":" Most observers credit time-shar"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-09T17:04:41.771Z","modified":"2026-11-13T15:36:10.363Z","hypothesis":{"id":"JkPxZuMIEfGpTd8AJlcCSA","digest":"d6374bdc69bed","page":{"id":"JmhSGOMIEfGUamsAzpoy3w","digest":"6ea99da08e6ca"}}}
> ```
> %%
> This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today's dollars).
>
> As such, companies typically couldn't buy all that many computers. On top of that, early computers weren't multi-user: that is to say, you couldn't have multiple users "logged in", using the company's one computer, at once. That's what "batch programming" was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.
>
> (This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by "time sharing").
>
> Despite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of "context switching" -- having to interrupt your train of thought by multitasking (say, programming while also responding to pings).
^m2tflg196ud


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:eb1aa5af-1a36-414f-840c-99d86c8a3ba4","type":"Annotation","motivation":"commenting","body":{"id":"#^6w73od68aa3","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":16276,"end":16555},{"type":"TextQuoteSelector","exact":"They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.","prefix":"tivity by integral factors. Why? ","suffix":"This breakthrough in turn stimul"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-09T17:05:19.840Z","modified":"2026-11-13T16:16:33.678Z","hypothesis":{"id":"Jo9FCOMIEfGBo99rfinuzQ","digest":"130fe605812091","page":{"id":"JrX19OMIEfGY_itOoHRxyQ","digest":"487dcc4e5eac4"}}}
> ```
> %%
> I haven't got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.
>
> (To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).
>
> The only thing I'd add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it's important to note that the vast majority of most powerful tools available to developers work against plaintext. There's no way, for example, to `grep` a Word document.
>
> A minor part of the reason I've [[public/content/dead-math.md|latched onto Gherkin]] is because it brings aspects of project management and ownership into plaintext. Once it's in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.
^6w73od68aa3


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:61f123e4-d7b2-4dc0-aa45-087b6bc1f556","type":"Annotation","motivation":"commenting","body":{"id":"#^byc7wdtnz3o","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19107,"end":19231},{"type":"TextQuoteSelector","exact":"Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.","prefix":" the cause of the improvements. ","suffix":"Object-oriented programming. Man"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:24.528Z","modified":"2026-11-13T16:26:40.158Z","hypothesis":{"id":"Jt7zFOMIEfGxYoMLbxu9mA","digest":"c6efaa18be53a","page":{"id":"JwVX8uMIEfGUa9-uQEaG9Q","digest":"fbdd30c1b47a2"}}}
> ```
> %%
> Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.
>
> In the same way I doubt that [[public/content/notes/pattern-languages-of-the-neighborhood|A Pattern Language]] could've been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.
^byc7wdtnz3o


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7b97e683-9106-4b7d-87fd-c0065b37ee25","type":"Annotation","motivation":"commenting","body":{"id":"#^ankq3ql47lk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19231,"end":19405},{"type":"TextQuoteSelector","exact":"Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.","prefix":"odern software design techniques. ","suffix":" Mark Sherman of Dartmouth notes"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:46.934Z","modified":"2026-11-13T16:28:48.336Z","hypothesis":{"id":"Jy9qOOMIEfG9mU-igHsNnw","digest":"c05ed5616ec7","page":{"id":"J1dFvOMIEfGxY7f2-H9_mg","digest":"588ddeb7875b2"}}}
> ```
> %%
> We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I've already cited to the practice, I'd refer to previous annotations on OOP's importance.
^ankq3ql47lk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:c2320176-e5d6-46c5-9cd2-e379a5fc910a","type":"Annotation","motivation":"commenting","body":{"id":"#^n5q9tyhtdgg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":20557,"end":20778},{"type":"TextQuoteSelector","exact":"Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that","prefix":"gher-order expression of design. ","suffix":". An order-of-magnitude gain can "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:08:50.891Z","modified":"2026-11-17T14:39:55.654Z","hypothesis":{"id":"J3wi2OMIEfGLNdv9EQ19Pw","digest":"122a993b13f78d","page":{"id":"J6PEquMIEfGXlstTZ-Y6Vw","digest":"14a98954cec3dd"}}}
> ```
> %%
> I'd once again disagree with this, but it's nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.
>
> This is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of "cutting off fat" versus "cutting into muscle". To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.
^n5q9tyhtdgg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:18e57bab-231a-4f16-a5b6-aec2fc1c0105","type":"Annotation","motivation":"commenting","body":{"id":"#^kuymwz1me2","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22649,"end":22816},{"type":"TextQuoteSelector","exact":"The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.","prefix":" completely with this critique. ","suffix":" I have a hard time seeing how i"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:10:21.719Z","modified":"2026-11-17T22:23:03.184Z","hypothesis":{"id":"J9bXjOMIEfGqZg_xpyz3MQ","digest":"1cc0fed4c110af","page":{"id":"J_u4cuMIEfGmkFdwc8xDig","digest":"2fe524aab9839"}}}
> ```
> %%
> Another thing that definitely [didn't age as well](https://en.wikipedia.org/wiki/Transformer_(deep_learning)).
>
> A really good book on how the history of this approach flipped from "expert-designed expert systems" to "throw as much data as humanly possible to train on" is [*The Worlds I See*](https://www.amazon.com/Worlds-See-Curiosity-Exploration-Discovery/dp/1250897939) by [Dr. Fei-Fei Li](https://en.wikipedia.org/wiki/Fei-Fei_Li), who famously put together the [ImageNet](https://en.wikipedia.org/wiki/ImageNet) dataset. It was the performance of [AlexNet](https://en.wikipedia.org/wiki/AlexNet) on the ImageNet competition that kinda kicked off this whole deep-learning, neural-networking, [transformers-are-all-you-need](https://arxiv.org/pdf/1706.03762) era of computing.
^kuymwz1me2


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:882d3841-9285-4e1a-aba0-05b8afd9c006","type":"Annotation","motivation":"commenting","body":{"id":"#^5moqmvedmzn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":23484,"end":23813},{"type":"TextQuoteSelector","exact":"An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.","prefix":"ept, and what are the prospects? ","suffix":" The inference engines typically "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:11:30.693Z","modified":"2026-11-17T22:58:01.062Z","hypothesis":{"id":"KCRkyuMIEfGdHXtw-5F1Bg","digest":"2eec4f3591441","page":{"id":"KFBgouMIEfGCKG_1PVLpUQ","digest":"f6f08e13507b6"}}}
> ```
> %%
> I may end up re-reading the section(s) of Dr. Li's book regarding expert systems, because this is... vaguely reminiscent of the inference mechanism of LLMs, but not quite. Infamously, LLMs can struggle with justifying decisions only after-the-fact, not preserving prior reasoning sessions in future context for the sake of not cluttering up the context.
>
> I would be curious if there *is* any mechanism used by popular harnesses, by which LLMs can directly reference prior reasoning rounds as though they're data rather than conversational context. That doesn't seem like a particularly novel idea, so if it *hasn't* been done, so if it hasn't, I wonder if that's related to a general understanding that [judging LLMs based on their train-of-thought is a dangerous practice](https://cdn.openai.com/pdf/34f2ada6-870f-4c26-9790-fd8def56387f/CoT_Monitoring.pdf) (with a fantastic [explainer video](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) to boot).
^5moqmvedmzn



> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ed9f3060-9a8a-4f3a-88d3-369cff38e9fe","type":"Annotation","motivation":"commenting","body":{"id":"#^ivjyf74mo9k","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24530,"end":24725},{"type":"TextQuoteSelector","exact":"Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.","prefix":"lexity of the application itself. ","suffix":" I believe the most important ad"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:13:09.107Z","modified":"2026-11-17T23:01:50.654Z","hypothesis":{"id":"KHhJFOMIEfGsjQdbcr813A","digest":"2d816b1830792","page":{"id":"KJ8QvOMIEfG2thdhoDkhMw","digest":"9098bdb7a0f9"}}}
> ```
> %%
> In trying to find the correct reference for this citation, I believe I've found the correct Feigenbaum reference: [Knowledge Engineering: The Applied Side of Artificial Intelligence](https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf) (1980)
>
> This is also uncanny, considering the later recognition that certain deep learning techniques absolutely thrive with more and more data added to them.
^ivjyf74mo9k


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f1c09573-6c20-4f86-95b2-546dbbe45740","type":"Annotation","motivation":"commenting","body":{"id":"#^ncwm3eztdnk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24063,"end":24168},{"type":"TextQuoteSelector","exact":"Inference engine technology is developed in an application-independent way, and then applied to many uses.","prefix":"olutions to the same problems: • • ","suffix":" One can justify much more effor"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:20.346Z","modified":"2026-11-09T17:14:20.346Z","hypothesis":{"id":"KMIplOMIEfGMlwsJ2KjR_g","digest":"d5bc6d4c49b9d","page":{"id":"KPSL-uMIEfGxZC9st0s8bA","digest":"79abbe0daa88e"}}}
> ```
> %%
> .
^ncwm3eztdnk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0dfcb236-3820-4f20-bb49-a2b32663fd8a","type":"Annotation","motivation":"commenting","body":{"id":"#^g7ibzwd9qgt","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24268,"end":24530},{"type":"TextQuoteSelector","exact":"The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.","prefix":"hat technology is well advanced. ","suffix":"Edward Feigenbaum says that the "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:42.756Z","modified":"2026-11-09T17:14:42.756Z","hypothesis":{"id":"KR1I9uMIEfGzhIds8_dsEw","digest":"1e46c6699465fe","page":{"id":"KUYjFuMIEfGJj8fXIfT1tg","digest":"1a380ab8d5ff94"}}}
> ```
> %%
> .
^g7ibzwd9qgt


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:75d191ab-463b-4c0f-8948-ac0fd09a99ce","type":"Annotation","motivation":"commenting","body":{"id":"#^7ndmgqf1q0j","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27236,"end":27306},{"type":"TextQuoteSelector","exact":"finding articulate, self-analytical experts who know why they do things","prefix":"d task of knowledge acquisition: ","suffix":"; and developing efficient techn"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:03.601Z","modified":"2026-11-09T17:17:03.601Z","hypothesis":{"id":"KW5bVuMIEfGgsQPh4MoAfw","digest":"1fe8b66ae9d84b","page":{"id":"KaIxYOMIEfGZc-vLmc_bxw","digest":"15c464c92ce0d2"}}}
> ```
> %%
> .
^7ndmgqf1q0j


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:17283a8d-6906-4672-ab64-e961b71715cf","type":"Annotation","motivation":"commenting","body":{"id":"#^6k5uzuuz5sv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":26662,"end":26718},{"type":"TextQuoteSelector","exact":"helping in lifelong maintenance and modification testing","prefix":" bring-up test cases, as well as ","suffix":". In the same way, we can postula"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:14.951Z","modified":"2026-11-09T17:17:14.951Z","hypothesis":{"id":"Kcx86uMIEfGjbxsn6hIQKw","digest":"24b085433f85b","page":{"id":"Kfc3buMIEfG9mrM6h3HBIQ","digest":"13f785135e3784"}}}
> ```
> %%
> .
^6k5uzuuz5sv


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:291a0078-2264-4c2b-a03b-98de1e94aa93","type":"Annotation","motivation":"commenting","body":{"id":"#^mj864yumg2m","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27485,"end":27900},{"type":"TextQuoteSelector","exact":"The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.","prefix":"pert system is to have an expert. ","suffix":"“Automatic” programming. For alm"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:59.432Z","modified":"2026-11-09T17:17:59.432Z","hypothesis":{"id":"KhtkcuMIEfGYfttVl3WL9Q","digest":"bb41eafd18430","page":{"id":"KkKapuMIEfG8JwMtrr3h0A","digest":"d2a3807d3a37c"}}}
> ```
> %%
> .
^mj864yumg2m


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ecd17a28-ec80-4edc-a1e6-f1591ccb67eb","type":"Annotation","motivation":"commenting","body":{"id":"#^dtcc5xnitnn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27925,"end":27944},{"type":"TextQuoteSelector","exact":"For almost 40 years","prefix":"ortant. “Automatic” programming. ","suffix":", people have been anticipating "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:18:26.339Z","modified":"2026-11-09T17:18:26.339Z","hypothesis":{"id":"KmYepOMIEfGw6cNNVIgo7Q","digest":"42b5aadc8d8f4","page":{"id":"KoxasOMIEfGqZ7vGRt4Q9Q","digest":"1df167149d6f63"}}}
> ```
> %%
> .
^dtcc5xnitnn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d342ac9e-1f65-4dbb-8348-7eb0f1583899","type":"Annotation","motivation":"commenting","body":{"id":"#^uo0il5xnmjc","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28445,"end":28566},{"type":"TextQuoteSelector","exact":"He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.","prefix":"ly available to the programmer.8 ","suffix":"7 Mostow, op. cit. 8 Parnas, 1985"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:05.692Z","modified":"2026-11-09T17:19:05.692Z","hypothesis":{"id":"KrSIguMIEfG5hlPX7E-dGw","digest":"e5c770081e669","page":{"id":"KuQ9ZuMIEfGJIJsa8zP9qg","digest":"ae3fa245e6f94"}}}
> ```
> %%
> .
^uo0il5xnmjc


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4c9cd456-e0dd-4164-804d-1334f3faee82","type":"Annotation","motivation":"commenting","body":{"id":"#^kc305035ym","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28294,"end":28444},{"type":"TextQuoteSelector","exact":"n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.","prefix":"ot semantic content, asserting, I","suffix":"8 He argues, in essence, that in "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:16.915Z","modified":"2026-11-09T17:19:16.915Z","hypothesis":{"id":"Kwnt9OMIEfGdw9uVqs6Emw","digest":"12730762a8a357","page":{"id":"KzDjKOMIEfGuXvfuievQ9A","digest":"1271647e8c7356"}}}
> ```
> %%
> .
^kc305035ym


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6225a18b-f7db-42e4-9f2e-6cc3ead88ad6","type":"Annotation","motivation":"commenting","body":{"id":"#^5s993cluoig","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30469,"end":30707},{"type":"TextQuoteSelector","exact":"In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.","prefix":"age for their proposed computer. ","suffix":"Second, the screens of today are"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:05.656Z","modified":"2026-11-09T17:21:05.656Z","hypothesis":{"id":"K1hfrOMIEfGzhWNttKrkAA","digest":"1a71e89b5b36b7","page":{"id":"K3-aaOMIEfGuX_OJ7sm9Lw","digest":"103fb951adf03a"}}}
> ```
> %%
> .
^5s993cluoig


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7fd04683-32ad-46d1-b267-5454e18a31a6","type":"Annotation","motivation":"commenting","body":{"id":"#^d97hq9ydw9c","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30195,"end":30306},{"type":"TextQuoteSelector","exact":"In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.","prefix":"I am persuaded that nothing will. ","suffix":"10 Indeed, it is best viewed as "},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:35.053Z","modified":"2026-11-09T17:21:35.053Z","hypothesis":{"id":"K6IFHOMIEfGw7y8BZy7ubg","digest":"1ba55e2be83cd0","page":{"id":"K8o4DOMIEfGYXc9Z7ncjsw","digest":"9a5ab67447e98"}}}
> ```
> %%
> .
^d97hq9ydw9c


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d3c7cb2f-a6fa-40f3-911b-e44cc1939ddc","type":"Annotation","motivation":"commenting","body":{"id":"#^h5pgqb65qp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30707,"end":30844},{"type":"TextQuoteSelector","exact":"Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.","prefix":"ting the programs they describe. ","suffix":" The so-called “desktop metaphor"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:20.909Z","modified":"2026-11-09T17:22:20.909Z","hypothesis":{"id":"K-62MuMIEfG9m9fFY0Xfiw","digest":"7afba75dfc394","page":{"id":"LB30TOMIEfGEemfEj3jc3g","digest":"1aa981ff5d8ae1"}}}
> ```
> %%
> .
^h5pgqb65qp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bee19112-967e-484a-9103-73c467686702","type":"Annotation","motivation":"commenting","body":{"id":"#^xhvbeuk4i8n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31185,"end":31330},{"type":"TextQuoteSelector","exact":"Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.","prefix":"dom access to a score of pages. ","suffix":" The hardware technology will ha"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:40.869Z","modified":"2026-11-09T17:22:40.869Z","hypothesis":{"id":"LEbCZOMIEfG9nF_kkxKlvA","digest":"c447642b67307","page":{"id":"LG2aTOMIEfGa8he9HtVE9w","digest":"d524a01c10232"}}}
> ```
> %%
> .
^xhvbeuk4i8n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:089a9a54-a99c-4a3c-9193-aba42a91c987","type":"Annotation","motivation":"commenting","body":{"id":"#^1c5nprutkln","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31689,"end":31764},{"type":"TextQuoteSelector","exact":"we feel only one dimension of the intricately interlocked software elephant.","prefix":"l data structures, or whatever, ","suffix":" If we superimpose all the diagr"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:23:04.978Z","modified":"2026-11-09T17:23:04.978Z","hypothesis":{"id":"LJvfEOMIEfG9pf-fdgm_sw","digest":"1cd0139e4c20ac","page":{"id":"LL9vAuMIEfG9Fdum9TGGtA","digest":"c01a7483504cd"}}}
> ```
> %%
> .
^1c5nprutkln


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0c450070-9a2d-4903-81b2-2ca1328f4186","type":"Annotation","motivation":"commenting","body":{"id":"#^u6tcgt70nrb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":32771,"end":33094},{"type":"TextQuoteSelector","exact":"I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.","prefix":"o implementing and testing them? ","suffix":"Program verification does not me"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:23:52.738Z","modified":"2026-11-09T17:23:52.738Z","hypothesis":{"id":"LOXeqOMIEfG4OmPpDqOW7Q","digest":"17f13ce8d98e9a","page":{"id":"LQwrWOMIEfGEe6O4hEq0dA","digest":"71a7d1e0695a9"}}}
> ```
> %%
> .
^u6tcgt70nrb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5b5057f6-6744-4c40-ae17-1a41e1bfbc35","type":"Annotation","motivation":"commenting","body":{"id":"#^fscfpc13l9","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33182,"end":33307},{"type":"TextQuoteSelector","exact":"Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.","prefix":" There is no magic here, either. ","suffix":"More seriously, even perfect pro"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:10.898Z","modified":"2026-11-09T17:24:10.898Z","hypothesis":{"id":"LTmsIuMIEfGTWl9OlhD7YQ","digest":"978c93dc80f01","page":{"id":"LV22suMIEfG0STdkTjY3kQ","digest":"11ed7ebce42344"}}}
> ```
> %%
> .
^fscfpc13l9


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1faa853b-a3a1-4f33-9e04-157741942330","type":"Annotation","motivation":"commenting","body":{"id":"#^rrk5d1x6wpg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33415,"end":33599},{"type":"TextQuoteSelector","exact":"The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.","prefix":"program meets its specification. ","suffix":"Environments and tools. How much"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:37.405Z","modified":"2026-11-09T17:24:37.405Z","hypothesis":{"id":"LYR0AOMIEfGTW2cf3zy-2g","digest":"69850b4bee69f","page":{"id":"LaQ7buMIEfGNzGusSQO3-g","digest":"7ada56acf96e8"}}}
> ```
> %%
> .
^rrk5d1x6wpg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5461e192-2399-4286-8ca7-40924730b637","type":"Annotation","motivation":"commenting","body":{"id":"#^sknnl8ow6i","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34108,"end":34388},{"type":"TextQuoteSelector","exact":"Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.","prefix":"rors and simple semantic errors. ","suffix":"Surely this work is worthwhile, "},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:13.535Z","modified":"2026-11-09T17:26:13.535Z","hypothesis":{"id":"LdTrdOMIEfGsh_eIdBPxtw","digest":"132ba6349144b3","page":{"id":"LficSuMIEfGXQn920Knq8w","digest":"1c3e7bd67965b0"}}}
> ```
> %%
> .
^sknnl8ow6i


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:a9713bcc-7585-419e-b77d-1570a8eabce5","type":"Annotation","motivation":"commenting","body":{"id":"#^u5nri1m37df","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34854,"end":35028},{"type":"TextQuoteSelector","exact":"Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.","prefix":"ly supported by today’s speeds. ","suffix":"More powerful workstations we su"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:56.266Z","modified":"2026-11-09T17:26:56.266Z","hypothesis":{"id":"Lh8eLuMIEfGsjm806PaKyQ","digest":"d5bf8ff3965ba","page":{"id":"LkivtOMIEfG3jfuGfUu7wg","digest":"1a368f5f328d54"}}}
> ```
> %%
> .
^u5nri1m37df


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b0695f58-7058-4708-8405-0a624690e9f7","type":"Annotation","motivation":"commenting","body":{"id":"#^ywdgnn4xef","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36066,"end":36174},{"type":"TextQuoteSelector","exact":"Buy versus build. The most radical possible solution for constructing software is not to construct it at all.","prefix":"some of these are very promising. ","suffix":"Every day this becomes easier, a"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:28:23.167Z","modified":"2026-11-09T17:28:23.167Z","hypothesis":{"id":"LoFdoOMIEfGGM3NX7uSFAg","digest":"241bbcb0d8e80","page":{"id":"LqO0wuMIEfGYXgMp5jj-iw","digest":"deeef8d56a839"}}}
> ```
> %%
> .
^ywdgnn4xef


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4be450d5-a1d5-4161-a894-c4cd1b8d40c8","type":"Annotation","motivation":"commenting","body":{"id":"#^qpqgplaxida","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35661,"end":35879},{"type":"TextQuoteSelector","exact":"If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.","prefix":"task = ∑ (Frequency) i x (Time) i ","suffix":"Hence we must consider those att"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:18.921Z","modified":"2026-11-09T17:29:18.921Z","hypothesis":{"id":"LseuQOMIEfGjcEciOkaqoQ","digest":"8ec2165b2d8e3","page":{"id":"LvTF7OMIEfG9ElOo7Fohzg","digest":"69d1e1b0283ae"}}}
> ```
> %%
> .
^qpqgplaxida


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:85b9a27a-8a42-4f48-8686-4a70d5a75465","type":"Annotation","motivation":"commenting","body":{"id":"#^46ecwt2iwel","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35908,"end":36020},{"type":"TextQuoteSelector","exact":"attacks that address the essence of the software problem, the formulation of these complex conceptual structures.","prefix":"ns. Hence we must consider those ","suffix":" Fortunately, some of these are v"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:28.380Z","modified":"2026-11-09T17:29:28.380Z","hypothesis":{"id":"Lx9bQOMIEfGZdBeAGwjnpw","digest":"9ac8179a756ff","page":{"id":"L0e1IuMIEfGGNHeciEGkNQ","digest":"855bdb9c4443a"}}}
> ```
> %%
> .
^46ecwt2iwel


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44e54adc-74c5-437d-a971-b0cd79fcd03a","type":"Annotation","motivation":"commenting","body":{"id":"#^fh6d7a9q5mb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36377,"end":36466},{"type":"TextQuoteSelector","exact":"he personal computer revolution has created not one, but m any, mass markets for software.","prefix":"red on production methodology, t","suffix":" Every newsstand carried monthly "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:30:05.442Z","modified":"2026-11-09T17:30:05.442Z","hypothesis":{"id":"L2kpZOMIEfGFsps9sYW7qQ","digest":"1eb1122a256852","page":{"id":"L499COMIEfGmkSP6QLd16g","digest":"142c68960b3fdc"}}}
> ```
> %%
> .
^fh6d7a9q5mb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:192ce430-c602-438a-a1a1-604cc509643b","type":"Annotation","motivation":"commenting","body":{"id":"#^8jv1h13fwqn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36858,"end":36913},{"type":"TextQuoteSelector","exact":"Any such product is cheaper to buy than to build afresh","prefix":"ket place for individual modules. ","suffix":". Even at a cost of $100,000, a p"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:31:42.594Z","modified":"2026-11-09T17:31:42.594Z","hypothesis":{"id":"L7Q7wOMIEfGIzsvOZh59Ew","digest":"a27f16998634","page":{"id":"L9t9FuMIEfGmkmPHxslzzg","digest":"175c701c37c20b"}}}
> ```
> %%
> .
^8jv1h13fwqn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e630617a-a237-4c6d-8f4d-f774127d141b","type":"Annotation","motivation":"commenting","body":{"id":"#^r48k3wopfxp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37279,"end":37461},{"type":"TextQuoteSelector","exact":"The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.","prefix":"ntained than homegrown software. ","suffix":" Sharing that cost among even a "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:33:14.699Z","modified":"2026-11-10T15:36:42.169Z","hypothesis":{"id":"MAOG7uMIEfGktztLHUOO5A","digest":"1a8cfd0cce1a13","page":{"id":"MCmLMuMIEfGw8KvI1noejw","digest":"1c2963f47039be"}}}
> ```
> %%
> On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it's basically the cost of pushing a distributable up to a server, and the cost of you downloading it.
>
> Netflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It's very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.
^r48k3wopfxp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:966aeb51-dea1-44dc-aea1-b0aed3360482","type":"Annotation","motivation":"commenting","body":{"id":"#^tic5hg7ofof","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37953,"end":38127},{"type":"TextQuoteSelector","exact":"users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.","prefix":"s, study after study showed that ","suffix":" During the 1980s, we find such "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:34:13.206Z","modified":"2026-11-09T17:34:13.206Z","hypothesis":{"id":"MFJAwuMIEfGUbQtha4hY_w","digest":"1e9504f6aa912","page":{"id":"MIJVHuMIEfGMmMfpfwEg3A","digest":"1508c1c9e882d0"}}}
> ```
> %%
> .
^tic5hg7ofof


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44fd7e54-9599-4253-8284-1411356d656f","type":"Annotation","motivation":"commenting","body":{"id":"#^y1gz1ngkwvm","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":38576,"end":39112},{"type":"TextQuoteSelector","exact":"The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.","prefix":"cated than those of 20 years ago. ","suffix":"There are dramatic exceptions to"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:12.688Z","modified":"2026-11-10T13:09:12.688Z","hypothesis":{"id":"MK4InuMIEfGqaNsxYtsxtg","digest":"84f795f22393e","page":{"id":"MNTZpuMIEfGJkDdee8pCzg","digest":"11962f1c29e821"}}}
> ```
> %%
> .
^y1gz1ngkwvm


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:24df9bb7-b2ae-426b-a407-c973e704610f","type":"Annotation","motivation":"commenting","body":{"id":"#^z8uqeaqsds","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":39672,"end":39926},{"type":"TextQuoteSelector","exact":"Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.","prefix":"routinely done with these tools. ","suffix":"I believe the single most powerf"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:47.965Z","modified":"2026-11-10T13:09:47.965Z","hypothesis":{"id":"MPqG7OMIEfGm5af4e0mXiQ","digest":"19ec26c91f9c52","page":{"id":"MR72YuMIEfGg4iMQXrKD6g","digest":"1a5fb81882c45f"}}}
> ```
> %%
> .
^z8uqeaqsds


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bfd257bc-26f1-436f-a280-f794f789179d","type":"Annotation","motivation":"commenting","body":{"id":"#^zm63kpzvr2q","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40204,"end":40313},{"type":"TextQuoteSelector","exact":"The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.","prefix":"t programs, and turn them loose. ","suffix":"Requirements refinement and rapi"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:54.490Z","modified":"2026-11-10T13:09:54.490Z","hypothesis":{"id":"MVED5uMIEfGEfD-WXearjg","digest":"132463c125d64b","page":{"id":"MX5K4OMIEfG5h3tWkxIeog","digest":"e6a61e42e72a4"}}}
> ```
> %%
> .
^zm63kpzvr2q


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:590bd3a0-1dd1-4b3a-9323-542ba0ee6a30","type":"Annotation","motivation":"commenting","body":{"id":"#^14gm56fc3zwd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40313,"end":40449},{"type":"TextQuoteSelector","exact":"Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.","prefix":"ndreds of laboratory scientists. ","suffix":" No other part of the conceptual"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:08.183Z","modified":"2026-11-10T13:10:08.183Z","hypothesis":{"id":"MaQFjOMIEfGsjy8lY5UKlg","digest":"1e66a71976bdb0","page":{"id":"McowVOMIEfG1qXdi8os54A","digest":"697300dcfb19b"}}}
> ```
> %%
> .
^14gm56fc3zwd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49b68af2-7d89-4885-80f2-77290bb19a93","type":"Annotation","motivation":"commenting","body":{"id":"#^spwoqgulnam","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40912,"end":40968},{"type":"TextQuoteSelector","exact":"For the truth is, the clients do not know what they want.","prefix":"nt of the product requirements. ","suffix":" They usually do not know what q"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:43.052Z","modified":"2026-11-10T13:10:43.052Z","hypothesis":{"id":"MfHu5uMIEfGHzecwzshU8Q","digest":"15d0860d883702","page":{"id":"Mhr-HOMIEfGxmytpTlTmuA","digest":"c850d23d14dd2"}}}
> ```
> %%
> .
^spwoqgulnam


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e5263b5a-92e4-4549-8748-4c0fb87c98a0","type":"Annotation","motivation":"commenting","body":{"id":"#^eikgl68ua48","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41113,"end":41244},{"type":"TextQuoteSelector","exact":"Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.","prefix":"e detail that must be specified. ","suffix":" Clients never want exactly that."},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:54.746Z","modified":"2026-11-10T13:10:54.746Z","hypothesis":{"id":"MkD2EuMIEfGK6v-_HizKTw","digest":"ebde8e9ad894b","page":{"id":"MmYcnuMIEfGF84ev_N9K9Q","digest":"19c9422849470b"}}}
> ```
> %%
> .
^eikgl68ua48


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:720b9302-bf82-4450-be48-6c58ed41d5cb","type":"Annotation","motivation":"commenting","body":{"id":"#^k3d5e5ivcdq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41561,"end":41860},{"type":"TextQuoteSelector","exact":"I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.","prefix":"s part of the system definition. ","suffix":""},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:11:26.033Z","modified":"2026-11-10T13:11:26.033Z","hypothesis":{"id":"Mo3AquMIEfGtfZcRUO4qeQ","digest":"1c32622a511f9f","page":{"id":"MraexuMIEfGMmaPlagzqLQ","digest":"15d69834a30230"}}}
> ```
> %%
> .
^k3d5e5ivcdq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7e32bc36-484d-406a-90ce-077f70e46cae","type":"Annotation","motivation":"commenting","body":{"id":"#^l6116faqbyh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42610,"end":42749},{"type":"TextQuoteSelector","exact":"The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability","prefix":"lid inputs, abort cleanly, etc. ","suffix":"Much of present-day software acq"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:12:21.506Z","modified":"2026-11-10T13:12:21.506Z","hypothesis":{"id":"MtzLRuMIEfGgBNvwavDA-g","digest":"5a93491e2b005","page":{"id":"MwT3dOMIEfGw8Q9l9v7-Vw","digest":"c62c1d4b1567a"}}}
> ```
> %%
> .
^l6116faqbyh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:956229ae-3fab-47c5-9eee-f7340c5c160e","type":"Annotation","motivation":"commenting","body":{"id":"#^ta0co6qjc6d","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42749,"end":43058},{"type":"TextQuoteSelector","exact":"Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.","prefix":" it for consistency and usability ","suffix":" Hence they cannot be fixed witho"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:07.455Z","modified":"2026-11-10T13:13:07.455Z","hypothesis":{"id":"MyxRouMIEfGSxmvoPu-uEA","digest":"d1781b9191ea0","page":{"id":"M1LGrOMIEfGYf-v8zKa5fA","digest":"6b8f361c0c64e"}}}
> ```
> %%
> https://agilemanifesto.org/authors.html
^ta0co6qjc6d


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:829e4639-2b70-42a3-a3f5-4d8a7a93dabc","type":"Annotation","motivation":"commenting","body":{"id":"#^ucs8dz59q1g","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43203,"end":43253},{"type":"TextQuoteSelector","exact":"Incremental development−grow, not build, software.","prefix":"tion of prototypes and products. ","suffix":" I still remember the jolt I fel"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:35.689Z","modified":"2026-11-10T13:13:35.689Z","hypothesis":{"id":"M3lyPuMIEfGHzhcCNR1INw","digest":"b1d465f6ddf33","page":{"id":"M50OdOMIEfGKJBP6hwUTrw","digest":"16575b9d52a08f"}}}
> ```
> %%
> .
^ucs8dz59q1g


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:13b76122-3ec3-4638-a9d0-e71479a9035f","type":"Annotation","motivation":"commenting","body":{"id":"#^l87arq847gq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43687,"end":43736},{"type":"TextQuoteSelector","exact":"The building metaphor has outlived its usefulness","prefix":" of components, and scaffolding. ","suffix":". It is time to change again. If"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:56.542Z","modified":"2026-11-10T13:13:56.542Z","hypothesis":{"id":"M8vi7uMIEfGi3AtWoeQbZQ","digest":"8502220aaac54","page":{"id":"M_LLAuMIEfGi3R-jJ8vRuA","digest":"17419263b592f9"}}}
> ```
> %%
> .
^l87arq847gq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1217c77d-0f0e-47c2-9b5d-62a816b49cdb","type":"Annotation","motivation":"commenting","body":{"id":"#^h6tmealho1b","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45231,"end":45384},{"type":"TextQuoteSelector","exact":"Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.","prefix":"out of what is already there. 11 ","suffix":""},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:14:51.449Z","modified":"2026-11-10T13:14:51.449Z","hypothesis":{"id":"NBCt1OMIEfG9Ft8p67eH9Q","digest":"8bb8435a97e83","page":{"id":"NDaQvOMIEfG17WcSBQD-eQ","digest":"1795dcc81c3671"}}}
> ```
> %%
> .
^h6tmealho1b


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:dfe83f3c-f17a-433c-905b-ac71bc76cc3d","type":"Annotation","motivation":"commenting","body":{"id":"#^z9rqoddbhek","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43975,"end":44305},{"type":"TextQuoteSelector","exact":"Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.","prefix":"e a radically different approach. ","suffix":"So it must be with our software "},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:15:41.748Z","modified":"2026-11-10T13:15:41.748Z","hypothesis":{"id":"NF5xQOMIEfG17re6zxxJ6Q","digest":"1d1256a7adabdb","page":{"id":"NIQLEuMIEfGw6fPlxVNScQ","digest":"f9face9dfae2c"}}}
> ```
> %%
> .
^z9rqoddbhek


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e478d6d1-db04-46a3-8486-05bffe991284","type":"Annotation","motivation":"commenting","body":{"id":"#^pnvpwm0kfph","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45466,"end":45566},{"type":"TextQuoteSelector","exact":"The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.","prefix":"n software engineering (1986) 15 ","suffix":" Efforts redouble when the first"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:18:40.436Z","modified":"2026-11-10T13:18:40.436Z","hypothesis":{"id":"NKru2uMIEfGY_7MVxLdcYg","digest":"a6cf8545d0aa9","page":{"id":"NNuKwuMIEfGw6julec65SA","digest":"3958aa68fbfa9"}}}
> ```
> %%
> .
^pnvpwm0kfph


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d187d320-560c-415b-b436-b8a9d487c47e","type":"Annotation","motivation":"commenting","body":{"id":"#^659tbk1url4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46138,"end":46236},{"type":"TextQuoteSelector","exact":"Programmers are among the most intelligent part of the population, so they can learn good practice.","prefix":"design practices can be taught. ","suffix":" Thus a major thrust in the Unit"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:23:47.220Z","modified":"2026-11-10T13:23:47.220Z","hypothesis":{"id":"NP8f3OMIEfG4OyelvkoqCg","digest":"1893893acd674f","page":{"id":"NSXrHOMIEfG5op-1s5Iz5g","digest":"f2193c2550624"}}}
> ```
> %%
> .
^659tbk1url4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d9034a33-272e-4b29-8d81-db598afffe94","type":"Annotation","motivation":"commenting","body":{"id":"#^u3tbp9k9laq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":48605,"end":48988},{"type":"TextQuoteSelector","exact":"My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.","prefix":" products will ultimately depend. ","suffix":"How to grow great designers? Spa"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:25:47.548Z","modified":"2026-11-10T13:25:47.548Z","hypothesis":{"id":"NUsP5uMIEfGgst8dSbvsUg","digest":"d9e17c75b1c54","page":{"id":"NXsPKuMIEfGGNs_hV-fhdQ","digest":"8abfaa3a478b9"}}}
> ```
> %%
> .
^u3tbp9k9laq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:92804baf-20f0-4947-882d-669d28a9c06f","type":"Annotation","motivation":"commenting","body":{"id":"#^obag3lnbk6","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49302,"end":49558},{"type":"TextQuoteSelector","exact":"Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.","prefix":", and keep a careful career file. ","suffix":"Provide opportunities for growin"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:26:47.607Z","modified":"2026-11-10T13:26:47.607Z","hypothesis":{"id":"NaCisuMIEfGjcePd3iu96g","digest":"116b42ffa16700","page":{"id":"NceshuMIEfG1qi8HI04hEw","digest":"1b614f6cef95fa"}}}
> ```
> %%
> .
^obag3lnbk6


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:439ba5df-3e0a-436c-902e-791e4184ffc9","type":"Annotation","motivation":"commenting","body":{"id":"#^839csn14pzu","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49558,"end":49644},{"type":"TextQuoteSelector","exact":"Provide opportunities for growing designers to interact with and stimulate each other.","prefix":"technical leadership assignments. ","suffix":"■"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:27:00.026Z","modified":"2026-11-10T13:27:00.026Z","hypothesis":{"id":"NezrLOMIEfGLdudjJMMU-A","digest":"13ac4ca679b61","page":{"id":"NhRRqOMIEfG2t98dXS7qRA","digest":"a92acc40ecf9c"}}}
> ```
> %%
> .
^839csn14pzu


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:fb08ed63-8f32-46c1-bdbe-314279d84d66","type":"Annotation","motivation":"commenting","body":{"id":"#^tx89o2dg9y","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47979,"end":48089},{"type":"TextQuoteSelector","exact":"Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.","prefix":"ways to grow great designers. 12 ","suffix":""},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:10.341Z","modified":"2026-11-10T13:27:10.341Z","hypothesis":{"id":"NjvAsuMIEfGFZL-f3KFsLg","digest":"67cdf9fba0d26","page":{"id":"Nl9X8uMIEfGkuRMeA67IXg","digest":"17a42bc42046bb"}}}
> ```
> %%
> .
^tx89o2dg9y


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49a481c6-a08f-47ad-ae46-b74410638fb4","type":"Annotation","motivation":"commenting","body":{"id":"#^oxueoddlujp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46599,"end":46776},{"type":"TextQuoteSelector","exact":"Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.","prefix":"ext step upward in the same way. ","suffix":" Great designs come from great d"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:34.536Z","modified":"2026-11-10T13:27:34.536Z","hypothesis":{"id":"NonmPuMIEfGw8udu6nSNIg","digest":"132a3dc00d6ad","page":{"id":"Nr1iNOMIEfG-IRM3rwBJWQ","digest":"19e0fac0123961"}}}
> ```
> %%
> .
^oxueoddlujp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:59f2f1bc-c6b0-4383-947a-b451ed933f54","type":"Annotation","motivation":"commenting","body":{"id":"#^6jf16b2d9lw","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47176,"end":47256},{"type":"TextQuoteSelector","exact":"The differences between the great and the average approach an order of magnitude.","prefix":" and produced with less effort. ","suffix":"A little retrospection shows tha"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:44.860Z","modified":"2026-11-10T13:27:44.860Z","hypothesis":{"id":"NuLONOMIEfGUbu-Om3MSZA","digest":"54605121a2a74","page":{"id":"NwnJ2uMIEfG1er8Dnn97FA","digest":"d373eaaa9ac4e"}}}
> ```
> %%
> .
^6jf16b2d9lw


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bca28b90-fea2-4a10-ae1e-e40f2956827f","type":"Annotation","motivation":"commenting","body":{"id":"#^gydte98pz3n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28690,"end":28836},{"type":"TextQuoteSelector","exact":"Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.","prefix":"n software engineering (1986) 10 ","suffix":" Some systems for integrating dif"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:35.458Z","modified":"2026-11-10T13:30:35.458Z","hypothesis":{"id":"Ny8sSOMIEfGPYiNSF36bag","digest":"1a9271572e90d0","page":{"id":"N1TU3uMIEfGg45ts49iYbQ","digest":"1d24d4bc50a1b9"}}}
> ```
> %%
> .
^gydte98pz3n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:329038c3-6835-42bd-b960-d5e175b213d9","type":"Annotation","motivation":"commenting","body":{"id":"#^ojjhhp38yqd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":29055,"end":29355},{"type":"TextQuoteSelector","exact":"These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.","prefix":", and generated the programs. • • • • ","suffix":"It is hard to see how such techn"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:54.879Z","modified":"2026-11-10T13:30:54.879Z","hypothesis":{"id":"N3pjtuMIEfGGN7MtuRthaQ","digest":"5ed4a63cc900f","page":{"id":"N50EmOMIEfGPYwe5kD2erg","digest":"4284ba620cb8e"}}}
> ```
> %%
> .
^ojjhhp38yqd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e60fcb9b-590c-4d15-990c-9734084c6aaa","type":"Annotation","motivation":"commenting","body":{"id":"#^sxlthsl8nr","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2665,"end":2738},{"type":"TextQuoteSelector","exact":"But, as we look to the horizon of a decade hence, we see no silver bullet","prefix":"ly as computer hardware costs do. ","suffix":". There is no single development,"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:08:41.636Z","modified":"2026-11-10T15:08:41.636Z","hypothesis":{"id":"N70TWuMIEfGIhLNSKAkYTg","digest":"1098d608d91b8f","page":{"id":"N-akBOMIEfGBpKMcG8m2ew","digest":"14811057ea12c7"}}}
> ```
> %%
> I'm not certain about the range of 1986-1996, but I can at least safely say that we've safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I've seen ideas go from realization -> ideation -> implementation -> review -> release in a day's time.
>
> Of course, the claim I've seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).
>
> The way I've put it, colloquially, is that in a situation where you're at a physical assembly line and a machine in the middle speeds up by 1000%, you're not looking at a 1000% increase in productivity across the assembly line. You're looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren't moving fast enough, and that the review process has [[public/content/notes/natural-language-cve.md|largely caught on fire]].
^sxlthsl8nr


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8db4a429-d71b-4e14-9845-3d137e927183","type":"Annotation","motivation":"commenting","body":{"id":"#^5v8w05h0q8t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2817,"end":2927},{"type":"TextQuoteSelector","exact":"which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.","prefix":"nology or management technique, ","suffix":" In this chapter we shall try to"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:13:51.277Z","modified":"2026-11-10T15:13:51.277Z","hypothesis":{"id":"OAlFGOMIEfGNzVuYUhyF1A","digest":"37d4e256d89bb","page":{"id":"ODAKmuMIEfG5iO_Jxt803g","digest":"1fbdba366655f9"}}}
> ```
> %%
> This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It's not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones -- time developing features, versus time developing fixes -- is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it's the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.
^5v8w05h0q8t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ff929a1-15ed-4ded-baa1-6359aaf4fbee","type":"Annotation","motivation":"commenting","body":{"id":"#^0vplvym3cbrg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":3065,"end":3261},{"type":"TextQuoteSelector","exact":"Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.","prefix":"perties of the bullets proposed. ","suffix":" A disciplined, consistent effor"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:14:47.358Z","modified":"2026-11-10T15:14:47.358Z","hypothesis":{"id":"OFYGUOMIEfG4PM_CkK_Hpw","digest":"b2c5d40d92e78","page":{"id":"OHj5JuMIEfGTaH_rFFov3w","digest":"1651519a6244d8"}}}
> ```
> %%
> I'll be ~~stealing~~ quoting "Skepticism is not pessimism" in my future apologetics around LLMs and agentic development.
^0vplvym3cbrg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:da59915a-d94b-4c44-87be-1a322812a2e8","type":"Annotation","motivation":"commenting","body":{"id":"#^kfxwncrsfe","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5782,"end":5874},{"type":"TextQuoteSelector","exact":"If this is true, building software will always be hard. There is inherently no silver bullet.","prefix":"in software engineering (1986) 3 ","suffix":"Let us consider the inherent pro"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-10T15:21:52.536Z","modified":"2026-11-10T21:18:39.988Z","hypothesis":{"id":"OJrsIOMIEfGRVQMJ8G42mA","digest":"e074e3dc92da3","page":{"id":"OMiLJuMIEfGgBdNBglIU6w","digest":"17eec8356c007b"}}}
> ```
> %%
> I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.
>
> To make sure I'm not discounting the point, though, I do think that it's worth softening it to "The essential part of software engineering is hard(er to optimize)", which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I've found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [[public/content/notes/software-gardening.mdx#Feedforward & Feedback|rapid and determinstic feedback]].
>
> What I've found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for... too many reasons to get into, here, but fundamentally comes down to the constraint that "write code faster" and "help humans understand code faster" are two very, *very* different engineering problems.
^kfxwncrsfe


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1b1ac91c-97bc-44f1-9c1b-a18711c4b653","type":"Annotation","motivation":"commenting","body":{"id":"#^wwj4u960f7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":10658,"end":11227},{"type":"TextQuoteSelector","exact":"All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.","prefix":" dampen the whim of the changers. ","suffix":"In short, the software product i"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-10T21:57:54.385Z","modified":"2026-11-10T21:57:54.385Z","hypothesis":{"id":"OPCWKuMIEfGpor9kU279TA","digest":"401a1a515230d","page":{"id":"OR-0vuMIEfG9psN8uBAZ-g","digest":"c6d9ee87ef4cc"}}}
> ```
> %%
> Gah -- this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn't mean the work to keep them runnable has (or will ever) end.
^wwj4u960f7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:2bf0a10d-edc3-44ad-8243-25a01a0cc974","type":"Annotation","motivation":"commenting","body":{"id":"#^ncf9kp5bnq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":11453,"end":11494},{"type":"TextQuoteSelector","exact":"Software is invisible and unvisualizable.","prefix":" software product. Invisibility. ","suffix":" Geometric abstractions are power"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-13T14:41:40.886Z","modified":"2026-11-13T14:41:40.886Z","hypothesis":{"id":"OVAkFOMIEfGvalvYRDd1hw","digest":"187859de677fdc","page":{"id":"OXaO4uMIEfGBpcPXIqjvDQ","digest":"1c78e43176e59d"}}}
> ```
> %%
> *Again* with the *absolutes* here, Brooks!
>
> I think "unvisualizable" concedes defeat before the fight has really started out. I'd once again summon up [[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces.md|boundary objects]]. My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.
>
> A [recent video about Britain's National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it's to get an immediate working knowledge of any issues worth addressing.
>
> I would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize -- not impossible. The analogy I'd pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some "most significant" visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:
>
> 1. Steps and catalog configurations themselves;
> 2. Storage mediums (S3, local system, etc.)
>
> Ultimately, it's just making sure you understand what a developer's necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.
^ncf9kp5bnq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7eea6caa-5a39-4be0-b2d3-d2c86073880e","type":"Annotation","motivation":"commenting","body":{"id":"#^kds1hgm51rl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2771,"end":2815},{"type":"TextQuoteSelector","exact":"in either technology or management technique","prefix":" There is no single development, ","suffix":", which by itself promises even o"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-13T15:13:22.608Z","modified":"2026-11-13T15:13:22.608Z","hypothesis":{"id":"OZt9LuMIEfGLNp8xKC58pQ","digest":"2bab68bf8c8da","page":{"id":"Ob2J-uMIEfGF9It4kTg4Hg","digest":"2545d525cecc0"}}}
> ```
> %%
> *In a world **before** Agile...*
>
> All things considered, I'm glad to see management technique incorporated into an analysis of engineering optimization.
^kds1hgm51rl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0251a4b2-83e8-47ed-a8e4-342288bc141b","type":"Annotation","motivation":"commenting","body":{"id":"#^hfp5csllcv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21404,"end":21681},{"type":"TextQuoteSelector","exact":"Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.","prefix":"rified the terminological chaos: ","suffix":" In this approach human experts "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-13T17:35:31.514Z","modified":"2026-11-13T17:44:58.106Z","hypothesis":{"id":"OeJKzuMIEfGKJRt6GJzoow","digest":"c80f34b5082a7","page":{"id":"OhtU4OMIEfGd5EPnmlkBfg","digest":"5b08d90d5bcb5"}}}
> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5e07b64b-9265-4544-82d2-6f1fda0a6f2f","type":"Annotation","motivation":"commenting","body":{"id":"#^9ozg40riczb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1007,"end":1149},{"type":"TextQuoteSelector","exact":"Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.","prefix":"l, as opposed to the essential? ","suffix":"Therefore it appears that the ti"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:40:29.215Z","modified":"2026-11-10T14:54:19.905Z","hypothesis":{"id":"dfU4uuMHEfGzeSuRQzQhuA","digest":"e06ae8fb3e602","page":{"id":"di6wcuMHEfGMkZs_V5gkeg","digest":"1a44eddf95a3f3"}}}
> ```
> %%
> I think that this premise hits a bit differently in 2026 than it did in 1986.
>
> First: even though Brooks is framing "Silver Bullet" as an order-of-magnitude improvement, this isn't necessarily a binary, true/false "anything less is useless": simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.
>
> In the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that's where the optimization question gets even more philosophical than Brooks puts it, here. I'm especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they're responsible for).
^9ozg40riczb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9595dd47-9bfc-471a-bc3a-d8505b39402a","type":"Annotation","motivation":"commenting","body":{"id":"#^vjg26uls6ae","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1502,"end":1531},{"type":"TextQuoteSelector","exact":"Growing software organically,","prefix":"tablishing software requirements. ","suffix":" adding more and more function t"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:42:14.954Z","modified":"2026-11-10T14:45:40.331Z","hypothesis":{"id":"dlOJTOMHEfGXPMvW6A-bRQ","digest":"11b5628662b59c","page":{"id":"dndDUOMHEfGseY91rTKJ6g","digest":"c7d949184652"}}}
> ```
> %%
> I mean... [[public/content/notes/software-gardening.mdx|I can't *not* bring it up.]]
^vjg26uls6ae


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8c76221b-77ad-4955-b84b-663adf9a2372","type":"Annotation","motivation":"commenting","body":{"id":"#^tkmanyd0vh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4605,"end":4696},{"type":"TextQuoteSelector","exact":"he transformation of computer manufacture from an assembly industry into a process industry.","prefix":"ed costs. These gains flow from t","suffix":"Second, to see what rate of prog"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:45:52.475Z","modified":"2026-11-10T15:18:11.856Z","hypothesis":{"id":"dprX1OMHEfGS2wNWEGQ8jQ","digest":"1f132691fac97a","page":{"id":"dss4wOMHEfGg2lsZWkT9GA","digest":"c77e5bf54ba51"}}}
> ```
> %%
> It's important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.
>
> I think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.
^tkmanyd0vh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4687d939-3394-4435-bed2-837709f917fe","type":"Annotation","motivation":"commenting","body":{"id":"#^vyepyaspik","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4824,"end":4997},{"type":"TextQuoteSelector","exact":"I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.","prefix":"ficulties. Following Aristotle, ","suffix":"The accidents I discuss in the n"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:46:40.788Z","modified":"2026-11-10T15:19:30.218Z","hypothesis":{"id":"dvlpIOMHEfGtUXtP0jb7mw","digest":"54c9dc5735185","page":{"id":"dx1mGOMHEfGwM4O6H3Qs7A","digest":"11c8c2b060ba28"}}}
> ```
> %%
> Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.
^vyepyaspik


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4d69f8b6-dea0-43f4-b681-7cdf20b1f5c3","type":"Annotation","motivation":"commenting","body":{"id":"#^x4uisgky7tj","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5394,"end":5701},{"type":"TextQuoteSelector","exact":"I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.","prefix":"hly precise and richly detailed. ","suffix":""},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:47:19.934Z","modified":"2026-11-10T15:21:04.436Z","hypothesis":{"id":"d0HIbuMHEfGwH-9ZSpLT0Q","digest":"1909dbf0d7f3f6","page":{"id":"d3QckuMHEfGu0qeZXOxQEA","digest":"e33e79814f639"}}}
> ```
> %%
> This is a massive issue that I broach in both the [[public/content/dead-math.md|Gherkin post]], as well as touching on my own experience trying to resurrect "dead" software, as defined in [[public/content/annotations/programming-as-theory-building.md|Programming as Theory Building]].
^x4uisgky7tj


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:86485653-2229-4361-906f-d5c781d08617","type":"Annotation","motivation":"commenting","body":{"id":"#^vqhlzf6jdks","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":6963,"end":7143},{"type":"TextQuoteSelector","exact":"The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.","prefix":"creases much more than linearly. ","suffix":" Mathematics and the physical sc"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:53:50.156Z","modified":"2026-11-10T21:26:25.550Z","hypothesis":{"id":"d5lzyuMHEfGTmE_kqsvdHw","digest":"eff963cef1a1","page":{"id":"d8FfSOMHEfGk5Rs6BMHZvA","digest":"a50fc0e6f582d"}}}
> ```
> %%
> Brooks gets into this later, but... yeah. That also came up in the background research for CASE programs during [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]. It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [[public/tags/projects/flowthru|Flowthru]], for example, lends itself well to a visualization, but that's only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get... horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It's effectively be an orthogonal axis to the DAG, adding an additional dimensionality.
>
> Brooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.
^vqhlzf6jdks


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7a9e9ec1-7273-4fa6-bca9-c174b90d6009","type":"Annotation","motivation":"commenting","body":{"id":"#^pprm61om6t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":7801,"end":7959},{"type":"TextQuoteSelector","exact":"From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.","prefix":" cost overruns, schedule delays. ","suffix":" From the complexity of the func"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:59:49.692Z","modified":"2026-11-10T21:28:12.429Z","hypothesis":{"id":"d-x16OMHEfGF7It1TaDzOQ","digest":"1bde86204412d","page":{"id":"eA5tpuMHEfGBmIvAu_BxWw","digest":"1fd7d34a3b706c"}}}
> ```
> %%
> [[public/content/dead-math#Why Proofs?|This section on formal verification and proofs]] talks about this a bit. Even the Red Team's research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today's technology, be out of the realm of possibility.
^pprm61om6t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ecff3bf-adc9-437a-a6c6-ba36d1ae4472","type":"Annotation","motivation":"commenting","body":{"id":"#^f7geh76bbjl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":8513,"end":8613},{"type":"TextQuoteSelector","exact":"It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.","prefix":"and control all the loose ends. ","suffix":"Conformity. Software people are "},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:08.322Z","modified":"2026-11-10T21:34:52.015Z","hypothesis":{"id":"eDMikOMHEfG2rFsgqCYzYw","digest":"60cb4f12370f6","page":{"id":"eFfyAOMHEfGIxAsC-aP_oA","digest":"1f37007ddad640"}}}
> ```
> %%
> This is *exactly* what [[public/content/annotations/programming-as-theory-building#^7ppb5sf3ycw|Naur talks about]]. Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.
>
> This is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don't fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.
^f7geh76bbjl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b910316c-2896-484d-a3ad-83793f911e24","type":"Annotation","motivation":"commenting","body":{"id":"#^ulc2nm1bo4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9029,"end":9185},{"type":"TextQuoteSelector","exact":"No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human","prefix":" is not capricious or arbitrary. ","suffix":""},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:53.203Z","modified":"2026-11-10T21:36:26.044Z","hypothesis":{"id":"eHvP4OMHEfG8HP_uPeuNcA","digest":"4bbdb89952a6b","page":{"id":"eKJGyuMHEfGi1p9vGP8EsQ","digest":"13ba44a2589e6"}}}
> ```
> %%
> I do feel this one deeply. As part of my [[public/tags/projects/dayjob|dayjob]], I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.
^ulc2nm1bo4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:847428ca-9bdc-4ebf-85eb-d0e867be13c2","type":"Annotation","motivation":"commenting","body":{"id":"#^v9h1tk6pcnb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9493,"end":9800},{"type":"TextQuoteSelector","exact":"In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.","prefix":"rent people, rather than by God. ","suffix":"Changeability. The software enti"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T20:05:36.052Z","modified":"2026-11-10T21:52:38.256Z","hypothesis":{"id":"eMhWduMHEfGtUlPPG3GMgQ","digest":"1998b34feb897a","page":{"id":"eO-jtuMHEfGPB3-OaC7hfg","digest":"19f459e66bdcfa"}}}
> ```
> %%
> I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they'll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.
>
> Conversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* -- that is to say, I can make decisions autonomously without much fear that I'll, say, lose business or alienate anyone.
>
> Software, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:
>
> - Z is for patches (small fixes that don't modify functionality
> - Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won't break any users' switching
> - X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.
>
> It's not unusual to see early software go through many breaking changes while it's a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).
^v9h1tk6pcnb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f7a2e78f-2e1f-45a2-8eb8-e479ad97fd1f","type":"Annotation","motivation":"commenting","body":{"id":"#^732yguy522u","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":12130,"end":12231},{"type":"TextQuoteSelector","exact":"we find it to constitute not one, but several, general directed graphs, superimposed one upon another.","prefix":"t to diagram software structure, ","suffix":" The several graphs may represen"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T22:08:42.822Z","modified":"2026-11-07T22:08:42.822Z","hypothesis":{"id":"eRbZwuMHEfGZaN-aks9IkA","digest":"70e7513539eb5","page":{"id":"eUj3kOMHEfGmGN-VbE4Abg","digest":"1f196e293350ab"}}}
> ```
> %%
> .
^732yguy522u


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7c70a2dd-121a-4181-b1f1-cf690b8972c8","type":"Annotation","motivation":"commenting","body":{"id":"#^hd9oddco1o7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15479,"end":15601},{"type":"TextQuoteSelector","exact":"arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.","prefix":" going on in a complex system. 2 P","suffix":""},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:09:36.128Z","modified":"2026-11-13T15:44:07.672Z","hypothesis":{"id":"eW-NTOMHEfGu08vxZGAUrA","digest":"1591d0a88d19cc","page":{"id":"eZSBdOMHEfG3gx8Xpaus2g","digest":"13acaaed8726da"}}}
> ```
> %%
> [Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)
^hd9oddco1o7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1fcbe46a-9374-48c7-b7e2-af2277b7188e","type":"Annotation","motivation":"commenting","body":{"id":"#^sasqm0mbvyd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":13331,"end":13671},{"type":"TextQuoteSelector","exact":"High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.","prefix":"trapolation of each such attack. ","suffix":"What does a high-level language "},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:10:18.916Z","modified":"2026-11-13T14:50:20.099Z","hypothesis":{"id":"ecV-5uMHEfGm3NspqH_rjA","digest":"179a2e5b43810a","page":{"id":"eetKuOMHEfGEczv-mH2TlQ","digest":"66c1637e3ae1a"}}}
> ```
> %%
> While this is definitely the case, I'd say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can't be effectively linted becomes harder to scale against than is offset by their ease of use.
>
> This is specifically around non-prototyping. That's worth distinguishing.
^sasqm0mbvyd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6d4682fb-d70b-4906-9e20-6bc55a832c74","type":"Annotation","motivation":"commenting","body":{"id":"#^57h8rfdym18","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14563,"end":14746},{"type":"TextQuoteSelector","exact":"Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.","prefix":"r to the sophistication of users. ","suffix":"Time-sharing. Most observers cre"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:11:16.771Z","modified":"2026-11-13T15:02:22.480Z","hypothesis":{"id":"ehKuvuMHEfG6NrvhLGGtIQ","digest":"18c99405d1a196","page":{"id":"ejm-ZOMHEfGw4Ee5YqtX_Q","digest":"1cbbefb0b3d67b"}}}
> ```
> %%
> Ah, yeah -- this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall -- I haven't read the book since college) talks about the idea of "good abstractions" and "bad abstractions".
>
> It can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the "rules" require carve-outs, which is a slippery slope towards having no rules at all.
>
> Frameworks also have the same... I won't call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it's necessary to understand that there truly is no "silver bullet" among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* -- but there truly is no "everything" framework.
^57h8rfdym18


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3f255411-7368-4881-b687-277d9cd7a940","type":"Annotation","motivation":"commenting","body":{"id":"#^eicluc87x9t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15876,"end":16080},{"type":"TextQuoteSelector","exact":"The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.","prefix":"of time-sharing derive directly. ","suffix":"Unified programming environments"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-07T22:31:01.338Z","modified":"2026-11-13T15:53:47.240Z","hypothesis":{"id":"emTWxuMHEfGmioNMjJloIA","digest":"551adb0d64b35","page":{"id":"epMwtuMHEfGw5xPBWk15oA","digest":"1442971edadcca"}}}
> ```
> %%
> The idea of shortening system response time is *so underrated* -- and far harder than Brooks makes it out to be. I talk about this a lot in both [[public/content/notes/software-gardening.mdx|Software Gardening]] and its precursor, [[public/content/notes/hostage-negotiations|Hostage Negotiations]]: rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.
>
> A lot of my attitude on immediate feedback was borne from my time doing [[public/content/articles/structured-streaming.md|data pipelines on Databricks/PySpark]]. That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.
^eicluc87x9t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:82d926aa-2f7d-4c4b-b3ba-5f600e9938c1","type":"Annotation","motivation":"commenting","body":{"id":"#^bfauk520glo","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15101,"end":15476},{"type":"TextQuoteSelector","exact":"The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.","prefix":"tain an overview of complexity. ","suffix":"2 Parnas, D.L., “Designing softw"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:31:59.691Z","modified":"2026-11-13T15:43:14.400Z","hypothesis":{"id":"erf3XOMHEfG1nZOehH2BJw","digest":"1f5a83a3897bec","page":{"id":"etzfhuMHEfGcUN9I2lycQA","digest":"10134aee429612"}}}
> ```
> %%
> Thinking about this in terms of 1986 versus 2026, batch programming feels more like a "push" in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)
^bfauk520glo


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0a5a63da-439e-41f3-9790-8cc03a8c4d6c","type":"Annotation","motivation":"commenting","body":{"id":"#^yfp6g5ihhb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21051,"end":21249},{"type":"TextQuoteSelector","exact":"Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4","prefix":"g a program product. I doubt it. ","suffix":" I do not. To see why, we must d"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:32:40.645Z","modified":"2026-11-17T15:52:23.000Z","hypothesis":{"id":"ewNalOMHEfGJFfPAs_gW1Q","digest":"22a35418305cc","page":{"id":"eymFIOMHEfGTXANdEQYh9w","digest":"317f8d90d0120"}}}
> ```
> %%
> This bit of the paper feels *prescient* when you read it out of context, but it's so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn't pan out then, but here we are now.
^yfp6g5ihhb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b3d43a2e-ab25-405d-a932-ed1c2a033fd8","type":"Annotation","motivation":"commenting","body":{"id":"#^8kwbn6w8ess","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22004,"end":22124},{"type":"TextQuoteSelector","exact":"Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).","prefix":"alif.: Benjamin Cummings, 1983. 4 ","suffix":""},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:33:03.124Z","modified":"2026-11-17T15:53:04.612Z","hypothesis":{"id":"e1GTMOMHEfGGsIM_4xf_vg","digest":"1d7ed97f8e55f2","page":{"id":"e3uEauMHEfGLbssXNQtgOQ","digest":"14c336fb54d959"}}}
> ```
> %%
> [Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)
^8kwbn6w8ess


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:234b7bdf-0b07-4270-a94f-a7b060bd9cb6","type":"Annotation","motivation":"commenting","body":{"id":"#^m2tflg196ud","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14746,"end":14759},{"type":"TextQuoteSelector","exact":"Time-sharing.","prefix":"ely uses the esoteric constructs. ","suffix":" Most observers credit time-shar"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-09T17:04:41.771Z","modified":"2026-11-13T15:36:10.363Z","hypothesis":{"id":"e6q02OMHEfGyEjOLykukhA","digest":"d6374bdc69bed","page":{"id":"e9NJFuMHEfGTmdfAaqE0wg","digest":"6ea99da08e6ca"}}}
> ```
> %%
> This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today's dollars).
>
> As such, companies typically couldn't buy all that many computers. On top of that, early computers weren't multi-user: that is to say, you couldn't have multiple users "logged in", using the company's one computer, at once. That's what "batch programming" was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.
>
> (This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by "time sharing").
>
> Despite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of "context switching" -- having to interrupt your train of thought by multitasking (say, programming while also responding to pings).
^m2tflg196ud


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:eb1aa5af-1a36-414f-840c-99d86c8a3ba4","type":"Annotation","motivation":"commenting","body":{"id":"#^6w73od68aa3","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":16276,"end":16555},{"type":"TextQuoteSelector","exact":"They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.","prefix":"tivity by integral factors. Why? ","suffix":"This breakthrough in turn stimul"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-09T17:05:19.840Z","modified":"2026-11-13T16:16:33.678Z","hypothesis":{"id":"e_tOKuMHEfG9jEtTtGbvkQ","digest":"130fe605812091","page":{"id":"fCnhBOMHEfGfGyN1uVR0_g","digest":"487dcc4e5eac4"}}}
> ```
> %%
> I haven't got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.
>
> (To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).
>
> The only thing I'd add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it's important to note that the vast majority of most powerful tools available to developers work against plaintext. There's no way, for example, to `grep` a Word document.
>
> A minor part of the reason I've [[public/content/dead-math.md|latched onto Gherkin]] is because it brings aspects of project management and ownership into plaintext. Once it's in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.
^6w73od68aa3


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:61f123e4-d7b2-4dc0-aa45-087b6bc1f556","type":"Annotation","motivation":"commenting","body":{"id":"#^byc7wdtnz3o","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19107,"end":19231},{"type":"TextQuoteSelector","exact":"Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.","prefix":" the cause of the improvements. ","suffix":"Object-oriented programming. Man"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:24.528Z","modified":"2026-11-13T16:26:40.158Z","hypothesis":{"id":"fFChXuMHEfGzer9kv07Znw","digest":"c6efaa18be53a","page":{"id":"fHTvFOMHEfGYbXuBQvul3g","digest":"fbdd30c1b47a2"}}}
> ```
> %%
> Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.
>
> In the same way I doubt that [[public/content/notes/pattern-languages-of-the-neighborhood|A Pattern Language]] could've been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.
^byc7wdtnz3o


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7b97e683-9106-4b7d-87fd-c0065b37ee25","type":"Annotation","motivation":"commenting","body":{"id":"#^ankq3ql47lk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19231,"end":19405},{"type":"TextQuoteSelector","exact":"Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.","prefix":"odern software design techniques. ","suffix":" Mark Sherman of Dartmouth notes"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:46.934Z","modified":"2026-11-13T16:28:48.336Z","hypothesis":{"id":"fJZuUOMHEfGcUYNPQXYwhg","digest":"c05ed5616ec7","page":{"id":"fLZg3uMHEfGJhCOs3DdxHw","digest":"588ddeb7875b2"}}}
> ```
> %%
> We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I've already cited to the practice, I'd refer to previous annotations on OOP's importance.
^ankq3ql47lk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:c2320176-e5d6-46c5-9cd2-e379a5fc910a","type":"Annotation","motivation":"commenting","body":{"id":"#^n5q9tyhtdgg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":20557,"end":20778},{"type":"TextQuoteSelector","exact":"Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that","prefix":"gher-order expression of design. ","suffix":". An order-of-magnitude gain can "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:08:50.891Z","modified":"2026-11-17T14:39:55.654Z","hypothesis":{"id":"fN_ZUOMHEfGXjTMf-CzmIw","digest":"122a993b13f78d","page":{"id":"fQVEVuMHEfGPWH8YDtXbxg","digest":"14a98954cec3dd"}}}
> ```
> %%
> I'd once again disagree with this, but it's nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.
>
> This is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of "cutting off fat" versus "cutting into muscle". To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.
^n5q9tyhtdgg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:18e57bab-231a-4f16-a5b6-aec2fc1c0105","type":"Annotation","motivation":"commenting","body":{"id":"#^kuymwz1me2","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22649,"end":22816},{"type":"TextQuoteSelector","exact":"The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.","prefix":" completely with this critique. ","suffix":" I have a hard time seeing how i"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:10:21.719Z","modified":"2026-11-17T22:23:03.184Z","hypothesis":{"id":"fSwJYOMHEfGptpc9QbpLPA","digest":"1cc0fed4c110af","page":{"id":"fWHeguMHEfGxWuvntAKFNw","digest":"2fe524aab9839"}}}
> ```
> %%
> Another thing that definitely [didn't age as well](https://en.wikipedia.org/wiki/Transformer_(deep_learning)).
>
> A really good book on how the history of this approach flipped from "expert-designed expert systems" to "throw as much data as humanly possible to train on" is [*The Worlds I See*](https://www.amazon.com/Worlds-See-Curiosity-Exploration-Discovery/dp/1250897939) by [Dr. Fei-Fei Li](https://en.wikipedia.org/wiki/Fei-Fei_Li), who famously put together the [ImageNet](https://en.wikipedia.org/wiki/ImageNet) dataset. It was the performance of [AlexNet](https://en.wikipedia.org/wiki/AlexNet) on the ImageNet competition that kinda kicked off this whole deep-learning, neural-networking, [transformers-are-all-you-need](https://arxiv.org/pdf/1706.03762) era of computing.
^kuymwz1me2


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:882d3841-9285-4e1a-aba0-05b8afd9c006","type":"Annotation","motivation":"commenting","body":{"id":"#^5moqmvedmzn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":23484,"end":23813},{"type":"TextQuoteSelector","exact":"An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.","prefix":"ept, and what are the prospects? ","suffix":" The inference engines typically "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:11:30.693Z","modified":"2026-11-17T22:58:01.062Z","hypothesis":{"id":"fY9a9uMHEfGLKhN2odu1_g","digest":"2eec4f3591441","page":{"id":"fbMKZOMHEfGcUlML2NspkA","digest":"f6f08e13507b6"}}}
> ```
> %%
> I may end up re-reading the section(s) of Dr. Li's book regarding expert systems, because this is... vaguely reminiscent of the inference mechanism of LLMs, but not quite. Infamously, LLMs can struggle with justifying decisions only after-the-fact, not preserving prior reasoning sessions in future context for the sake of not cluttering up the context.
>
> I would be curious if there *is* any mechanism used by popular harnesses, by which LLMs can directly reference prior reasoning rounds as though they're data rather than conversational context. That doesn't seem like a particularly novel idea, so if it *hasn't* been done, so if it hasn't, I wonder if that's related to a general understanding that [judging LLMs based on their train-of-thought is a dangerous practice](https://cdn.openai.com/pdf/34f2ada6-870f-4c26-9790-fd8def56387f/CoT_Monitoring.pdf) (with a fantastic [explainer video](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) to boot).
^5moqmvedmzn



> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ed9f3060-9a8a-4f3a-88d3-369cff38e9fe","type":"Annotation","motivation":"commenting","body":{"id":"#^ivjyf74mo9k","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24530,"end":24725},{"type":"TextQuoteSelector","exact":"Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.","prefix":"lexity of the application itself. ","suffix":" I believe the most important ad"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:13:09.107Z","modified":"2026-11-17T23:01:50.654Z","hypothesis":{"id":"fdjZEOMHEfGpmZ-iA1N-fQ","digest":"2d816b1830792","page":{"id":"fg3SluMHEfGw6O9paihKMQ","digest":"9098bdb7a0f9"}}}
> ```
> %%
> In trying to find the correct reference for this citation, I believe I've found the correct Feigenbaum reference: [Knowledge Engineering: The Applied Side of Artificial Intelligence](https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf) (1980)
>
> This is also uncanny, considering the later recognition that certain deep learning techniques absolutely thrive with more and more data added to them.
^ivjyf74mo9k


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f1c09573-6c20-4f86-95b2-546dbbe45740","type":"Annotation","motivation":"commenting","body":{"id":"#^ncwm3eztdnk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24063,"end":24168},{"type":"TextQuoteSelector","exact":"Inference engine technology is developed in an application-independent way, and then applied to many uses.","prefix":"olutions to the same problems: • • ","suffix":" One can justify much more effor"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:20.346Z","modified":"2026-11-09T17:14:20.346Z","hypothesis":{"id":"fjFPtOMHEfGlD7uOD1Pu5g","digest":"d5bc6d4c49b9d","page":{"id":"flXDsuMHEfGK4cfdl7bjIA","digest":"79abbe0daa88e"}}}
> ```
> %%
> .
^ncwm3eztdnk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0dfcb236-3820-4f20-bb49-a2b32663fd8a","type":"Annotation","motivation":"commenting","body":{"id":"#^g7ibzwd9qgt","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24268,"end":24530},{"type":"TextQuoteSelector","exact":"The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.","prefix":"hat technology is well advanced. ","suffix":"Edward Feigenbaum says that the "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:42.756Z","modified":"2026-11-09T17:14:42.756Z","hypothesis":{"id":"fnusnuMHEfGu1Qchz0fJKA","digest":"1e46c6699465fe","page":{"id":"fqDATOMHEfGTTtso_bnTmw","digest":"1a380ab8d5ff94"}}}
> ```
> %%
> .
^g7ibzwd9qgt


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:75d191ab-463b-4c0f-8948-ac0fd09a99ce","type":"Annotation","motivation":"commenting","body":{"id":"#^7ndmgqf1q0j","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27236,"end":27306},{"type":"TextQuoteSelector","exact":"finding articulate, self-analytical experts who know why they do things","prefix":"d task of knowledge acquisition: ","suffix":"; and developing efficient techn"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:03.601Z","modified":"2026-11-09T17:17:03.601Z","hypothesis":{"id":"fsaw6uMHEfG_-C8ZbIongA","digest":"1fe8b66ae9d84b","page":{"id":"fvTo1OMHEfGYbr-vTcIpRw","digest":"15c464c92ce0d2"}}}
> ```
> %%
> .
^7ndmgqf1q0j


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:17283a8d-6906-4672-ab64-e961b71715cf","type":"Annotation","motivation":"commenting","body":{"id":"#^6k5uzuuz5sv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":26662,"end":26718},{"type":"TextQuoteSelector","exact":"helping in lifelong maintenance and modification testing","prefix":" bring-up test cases, as well as ","suffix":". In the same way, we can postula"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:14.951Z","modified":"2026-11-09T17:17:14.951Z","hypothesis":{"id":"fxgC2OMHEfGEqDdC-qLOVQ","digest":"24b085433f85b","page":{"id":"fz1ltOMHEfGsgs-S08H2nA","digest":"13f785135e3784"}}}
> ```
> %%
> .
^6k5uzuuz5sv


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:291a0078-2264-4c2b-a03b-98de1e94aa93","type":"Annotation","motivation":"commenting","body":{"id":"#^mj864yumg2m","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27485,"end":27900},{"type":"TextQuoteSelector","exact":"The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.","prefix":"pert system is to have an expert. ","suffix":"“Automatic” programming. For alm"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:59.432Z","modified":"2026-11-09T17:17:59.432Z","hypothesis":{"id":"f2NUhuMHEfGxWys6bZeJ3Q","digest":"bb41eafd18430","page":{"id":"f4lmxuMHEfGYbzvzCE3baw","digest":"d2a3807d3a37c"}}}
> ```
> %%
> .
^mj864yumg2m


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ecd17a28-ec80-4edc-a1e6-f1591ccb67eb","type":"Annotation","motivation":"commenting","body":{"id":"#^dtcc5xnitnn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27925,"end":27944},{"type":"TextQuoteSelector","exact":"For almost 40 years","prefix":"ortant. “Automatic” programming. ","suffix":", people have been anticipating "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:18:26.339Z","modified":"2026-11-09T17:18:26.339Z","hypothesis":{"id":"f6aCVuMHEfG0wFsmGvd_oA","digest":"42b5aadc8d8f4","page":{"id":"f8yI6OMHEfGYVgeGYRzqAw","digest":"1df167149d6f63"}}}
> ```
> %%
> .
^dtcc5xnitnn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d342ac9e-1f65-4dbb-8348-7eb0f1583899","type":"Annotation","motivation":"commenting","body":{"id":"#^uo0il5xnmjc","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28445,"end":28566},{"type":"TextQuoteSelector","exact":"He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.","prefix":"ly available to the programmer.8 ","suffix":"7 Mostow, op. cit. 8 Parnas, 1985"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:05.692Z","modified":"2026-11-09T17:19:05.692Z","hypothesis":{"id":"f_Gl2OMHEfGg2yMAq-jOJA","digest":"e5c770081e669","page":{"id":"gBjaVOMHEfGCHRdSrz055Q","digest":"ae3fa245e6f94"}}}
> ```
> %%
> .
^uo0il5xnmjc


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4c9cd456-e0dd-4164-804d-1334f3faee82","type":"Annotation","motivation":"commenting","body":{"id":"#^kc305035ym","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28294,"end":28444},{"type":"TextQuoteSelector","exact":"n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.","prefix":"ot semantic content, asserting, I","suffix":"8 He argues, in essence, that in "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:16.915Z","modified":"2026-11-09T17:19:16.915Z","hypothesis":{"id":"gD3uAuMHEfGHxc9IzeUi8Q","digest":"12730762a8a357","page":{"id":"gG2wVuMHEfGwNE_iMmA1GA","digest":"1271647e8c7356"}}}
> ```
> %%
> .
^kc305035ym


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6225a18b-f7db-42e4-9f2e-6cc3ead88ad6","type":"Annotation","motivation":"commenting","body":{"id":"#^5s993cluoig","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30469,"end":30707},{"type":"TextQuoteSelector","exact":"In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.","prefix":"age for their proposed computer. ","suffix":"Second, the screens of today are"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:05.656Z","modified":"2026-11-09T17:21:05.656Z","hypothesis":{"id":"gJDJpuMHEfGK4mdL0qd-pA","digest":"1a71e89b5b36b7","page":{"id":"gLsstOMHEfGw4r_LwDpKxQ","digest":"103fb951adf03a"}}}
> ```
> %%
> .
^5s993cluoig


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7fd04683-32ad-46d1-b267-5454e18a31a6","type":"Annotation","motivation":"commenting","body":{"id":"#^d97hq9ydw9c","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30195,"end":30306},{"type":"TextQuoteSelector","exact":"In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.","prefix":"I am persuaded that nothing will. ","suffix":"10 Indeed, it is best viewed as "},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:35.053Z","modified":"2026-11-09T17:21:35.053Z","hypothesis":{"id":"gN1a5uMHEfGg3AOtW0NaEg","digest":"1ba55e2be83cd0","page":{"id":"gP-qpuMHEfGm3T_9nV92Mw","digest":"9a5ab67447e98"}}}
> ```
> %%
> .
^d97hq9ydw9c


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d3c7cb2f-a6fa-40f3-911b-e44cc1939ddc","type":"Annotation","motivation":"commenting","body":{"id":"#^h5pgqb65qp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30707,"end":30844},{"type":"TextQuoteSelector","exact":"Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.","prefix":"ting the programs they describe. ","suffix":" The so-called “desktop metaphor"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:20.909Z","modified":"2026-11-09T17:22:20.909Z","hypothesis":{"id":"gSNgIuMHEfGqWsMie3VCug","digest":"7afba75dfc394","page":{"id":"gUWAlOMHEfGsejcT24H6bA","digest":"1aa981ff5d8ae1"}}}
> ```
> %%
> .
^h5pgqb65qp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bee19112-967e-484a-9103-73c467686702","type":"Annotation","motivation":"commenting","body":{"id":"#^xhvbeuk4i8n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31185,"end":31330},{"type":"TextQuoteSelector","exact":"Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.","prefix":"dom access to a score of pages. ","suffix":" The hardware technology will ha"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:40.869Z","modified":"2026-11-09T17:22:40.869Z","hypothesis":{"id":"gWrbCuMHEfG14k9FEhpUpQ","digest":"c447642b67307","page":{"id":"gZOyCuMHEfGY9BeBseM23w","digest":"d524a01c10232"}}}
> ```
> %%
> .
^xhvbeuk4i8n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:089a9a54-a99c-4a3c-9193-aba42a91c987","type":"Annotation","motivation":"commenting","body":{"id":"#^1c5nprutkln","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31689,"end":31764},{"type":"TextQuoteSelector","exact":"we feel only one dimension of the intricately interlocked software elephant.","prefix":"l data structures, or whatever, ","suffix":" If we superimpose all the diagr"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:23:04.978Z","modified":"2026-11-09T17:23:04.978Z","hypothesis":{"id":"gbjnHuMHEfGHxgvKh8x0mg","digest":"1cd0139e4c20ac","page":{"id":"gdxVMuMHEfG8FUOfd4azow","digest":"c01a7483504cd"}}}
> ```
> %%
> .
^1c5nprutkln


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0c450070-9a2d-4903-81b2-2ca1328f4186","type":"Annotation","motivation":"commenting","body":{"id":"#^u6tcgt70nrb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":32771,"end":33094},{"type":"TextQuoteSelector","exact":"I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.","prefix":"o implementing and testing them? ","suffix":"Program verification does not me"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:23:52.738Z","modified":"2026-11-09T17:23:52.738Z","hypothesis":{"id":"ggcUDOMHEfGRSfubrPJImw","digest":"17f13ce8d98e9a","page":{"id":"gi4BDOMHEfGHxz-0WNvgvw","digest":"71a7d1e0695a9"}}}
> ```
> %%
> .
^u6tcgt70nrb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5b5057f6-6744-4c40-ae17-1a41e1bfbc35","type":"Annotation","motivation":"commenting","body":{"id":"#^fscfpc13l9","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33182,"end":33307},{"type":"TextQuoteSelector","exact":"Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.","prefix":" There is no magic here, either. ","suffix":"More seriously, even perfect pro"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:10.898Z","modified":"2026-11-09T17:24:10.898Z","hypothesis":{"id":"glKD7OMHEfG14b85LuK0cg","digest":"978c93dc80f01","page":{"id":"gnacFOMHEfGw41-xP0pk8Q","digest":"11ed7ebce42344"}}}
> ```
> %%
> .
^fscfpc13l9


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1faa853b-a3a1-4f33-9e04-157741942330","type":"Annotation","motivation":"commenting","body":{"id":"#^rrk5d1x6wpg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33415,"end":33599},{"type":"TextQuoteSelector","exact":"The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.","prefix":"program meets its specification. ","suffix":"Environments and tools. How much"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:37.405Z","modified":"2026-11-09T17:24:37.405Z","hypothesis":{"id":"gqFRAuMHEfGwIAOs3YdmgQ","digest":"69850b4bee69f","page":{"id":"gsvZQOMHEfG9ndvKK0FRUg","digest":"7ada56acf96e8"}}}
> ```
> %%
> .
^rrk5d1x6wpg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5461e192-2399-4286-8ca7-40924730b637","type":"Annotation","motivation":"commenting","body":{"id":"#^sknnl8ow6i","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34108,"end":34388},{"type":"TextQuoteSelector","exact":"Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.","prefix":"rors and simple semantic errors. ","suffix":"Surely this work is worthwhile, "},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:13.535Z","modified":"2026-11-09T17:26:13.535Z","hypothesis":{"id":"gvJQyuMHEfG0P1dAUjcegQ","digest":"132ba6349144b3","page":{"id":"gx2tkuMHEfGze7ciPhoSpA","digest":"1c3e7bd67965b0"}}}
> ```
> %%
> .
^sknnl8ow6i


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:a9713bcc-7585-419e-b77d-1570a8eabce5","type":"Annotation","motivation":"commenting","body":{"id":"#^u5nri1m37df","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34854,"end":35028},{"type":"TextQuoteSelector","exact":"Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.","prefix":"ly supported by today’s speeds. ","suffix":"More powerful workstations we su"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:56.266Z","modified":"2026-11-09T17:26:56.266Z","hypothesis":{"id":"g029wOMHEfGSvtN_VgBrBQ","digest":"d5bf8ff3965ba","page":{"id":"g3PJeuMHEfGwIedcXJpZUQ","digest":"1a368f5f328d54"}}}
> ```
> %%
> .
^u5nri1m37df


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b0695f58-7058-4708-8405-0a624690e9f7","type":"Annotation","motivation":"commenting","body":{"id":"#^ywdgnn4xef","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36066,"end":36174},{"type":"TextQuoteSelector","exact":"Buy versus build. The most radical possible solution for constructing software is not to construct it at all.","prefix":"some of these are very promising. ","suffix":"Every day this becomes easier, a"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:28:23.167Z","modified":"2026-11-09T17:28:23.167Z","hypothesis":{"id":"g5dwvuMHEfG6N59MxFL2qg","digest":"241bbcb0d8e80","page":{"id":"g7tDfOMHEfGyFDNkSusuyw","digest":"deeef8d56a839"}}}
> ```
> %%
> .
^ywdgnn4xef


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4be450d5-a1d5-4161-a894-c4cd1b8d40c8","type":"Annotation","motivation":"commenting","body":{"id":"#^qpqgplaxida","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35661,"end":35879},{"type":"TextQuoteSelector","exact":"If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.","prefix":"task = ∑ (Frequency) i x (Time) i ","suffix":"Hence we must consider those att"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:18.921Z","modified":"2026-11-09T17:29:18.921Z","hypothesis":{"id":"g94fRuMHEfGJhSvId0Zxfg","digest":"8ec2165b2d8e3","page":{"id":"hAHg1OMHEfGPWecojaU6iQ","digest":"69d1e1b0283ae"}}}
> ```
> %%
> .
^qpqgplaxida


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:85b9a27a-8a42-4f48-8686-4a70d5a75465","type":"Annotation","motivation":"commenting","body":{"id":"#^46ecwt2iwel","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35908,"end":36020},{"type":"TextQuoteSelector","exact":"attacks that address the essence of the software problem, the formulation of these complex conceptual structures.","prefix":"ns. Hence we must consider those ","suffix":" Fortunately, some of these are v"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:28.380Z","modified":"2026-11-09T17:29:28.380Z","hypothesis":{"id":"hCiRSOMHEfGIxVuJAeJQZA","digest":"9ac8179a756ff","page":{"id":"hEsaTOMHEfGK4xfs6NIktQ","digest":"855bdb9c4443a"}}}
> ```
> %%
> .
^46ecwt2iwel


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44e54adc-74c5-437d-a971-b0cd79fcd03a","type":"Annotation","motivation":"commenting","body":{"id":"#^fh6d7a9q5mb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36377,"end":36466},{"type":"TextQuoteSelector","exact":"he personal computer revolution has created not one, but m any, mass markets for software.","prefix":"red on production methodology, t","suffix":" Every newsstand carried monthly "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:30:05.442Z","modified":"2026-11-09T17:30:05.442Z","hypothesis":{"id":"hG2EnOMHEfGu18sYBN-Q_A","digest":"1eb1122a256852","page":{"id":"hJSl6uMHEfGGJ1P5MSSfNA","digest":"142c68960b3fdc"}}}
> ```
> %%
> .
^fh6d7a9q5mb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:192ce430-c602-438a-a1a1-604cc509643b","type":"Annotation","motivation":"commenting","body":{"id":"#^8jv1h13fwqn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36858,"end":36913},{"type":"TextQuoteSelector","exact":"Any such product is cheaper to buy than to build afresh","prefix":"ket place for individual modules. ","suffix":". Even at a cost of $100,000, a p"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:31:42.594Z","modified":"2026-11-09T17:31:42.594Z","hypothesis":{"id":"hMRQkuMHEfGYcCNGSXRHVg","digest":"a27f16998634","page":{"id":"hOsPPuMHEfGwIgNWgylXDA","digest":"175c701c37c20b"}}}
> ```
> %%
> .
^8jv1h13fwqn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e630617a-a237-4c6d-8f4d-f774127d141b","type":"Annotation","motivation":"commenting","body":{"id":"#^r48k3wopfxp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37279,"end":37461},{"type":"TextQuoteSelector","exact":"The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.","prefix":"ntained than homegrown software. ","suffix":" Sharing that cost among even a "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:33:14.699Z","modified":"2026-11-10T15:36:42.169Z","hypothesis":{"id":"hREbKuMHEfGG4lPt1B1dfQ","digest":"1a8cfd0cce1a13","page":{"id":"hTTKZuMHEfGEqQ-13zPKfQ","digest":"1c2963f47039be"}}}
> ```
> %%
> On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it's basically the cost of pushing a distributable up to a server, and the cost of you downloading it.
>
> Netflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It's very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.
^r48k3wopfxp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:966aeb51-dea1-44dc-aea1-b0aed3360482","type":"Annotation","motivation":"commenting","body":{"id":"#^tic5hg7ofof","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37953,"end":38127},{"type":"TextQuoteSelector","exact":"users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.","prefix":"s, study after study showed that ","suffix":" During the 1980s, we find such "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:34:13.206Z","modified":"2026-11-09T17:34:13.206Z","hypothesis":{"id":"hVpcruMHEfGJFuNCX8Ennw","digest":"1e9504f6aa912","page":{"id":"hYIIbOMHEfGTXdNxx6M_sQ","digest":"1508c1c9e882d0"}}}
> ```
> %%
> .
^tic5hg7ofof


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44fd7e54-9599-4253-8284-1411356d656f","type":"Annotation","motivation":"commenting","body":{"id":"#^y1gz1ngkwvm","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":38576,"end":39112},{"type":"TextQuoteSelector","exact":"The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.","prefix":"cated than those of 20 years ago. ","suffix":"There are dramatic exceptions to"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:12.688Z","modified":"2026-11-10T13:09:12.688Z","hypothesis":{"id":"hbugGOMHEfGqWxMzAQ-zqQ","digest":"84f795f22393e","page":{"id":"he08SuMHEfGzfO-j7ffZ0Q","digest":"11962f1c29e821"}}}
> ```
> %%
> .
^y1gz1ngkwvm


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:24df9bb7-b2ae-426b-a407-c973e704610f","type":"Annotation","motivation":"commenting","body":{"id":"#^z8uqeaqsds","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":39672,"end":39926},{"type":"TextQuoteSelector","exact":"Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.","prefix":"routinely done with these tools. ","suffix":"I believe the single most powerf"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:47.965Z","modified":"2026-11-10T13:09:47.965Z","hypothesis":{"id":"hhKstOMHEfGTm3O258Xbbw","digest":"19ec26c91f9c52","page":{"id":"hjkiVOMHEfG2rfO7RLACAA","digest":"1a5fb81882c45f"}}}
> ```
> %%
> .
^z8uqeaqsds


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bfd257bc-26f1-436f-a280-f794f789179d","type":"Annotation","motivation":"commenting","body":{"id":"#^zm63kpzvr2q","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40204,"end":40313},{"type":"TextQuoteSelector","exact":"The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.","prefix":"t programs, and turn them loose. ","suffix":"Requirements refinement and rapi"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:54.490Z","modified":"2026-11-10T13:09:54.490Z","hypothesis":{"id":"hlmQIOMHEfGIxlufu6PVjA","digest":"132463c125d64b","page":{"id":"hnyfwOMHEfGTT4_oiigL6g","digest":"e6a61e42e72a4"}}}
> ```
> %%
> .
^zm63kpzvr2q


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:590bd3a0-1dd1-4b3a-9323-542ba0ee6a30","type":"Annotation","motivation":"commenting","body":{"id":"#^14gm56fc3zwd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40313,"end":40449},{"type":"TextQuoteSelector","exact":"Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.","prefix":"ndreds of laboratory scientists. ","suffix":" No other part of the conceptual"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:08.183Z","modified":"2026-11-10T13:10:08.183Z","hypothesis":{"id":"hqKotOMHEfGm3g--fqejEQ","digest":"1e66a71976bdb0","page":{"id":"hsdeIOMHEfG6OMMUbp7Vpw","digest":"697300dcfb19b"}}}
> ```
> %%
> .
^14gm56fc3zwd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49b68af2-7d89-4885-80f2-77290bb19a93","type":"Annotation","motivation":"commenting","body":{"id":"#^spwoqgulnam","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40912,"end":40968},{"type":"TextQuoteSelector","exact":"For the truth is, the clients do not know what they want.","prefix":"nt of the product requirements. ","suffix":" They usually do not know what q"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:43.052Z","modified":"2026-11-10T13:10:43.052Z","hypothesis":{"id":"hvWUKuMHEfG6ORcgvvHZaw","digest":"15d0860d883702","page":{"id":"hxlhNOMHEfGGsbuNretsJQ","digest":"c850d23d14dd2"}}}
> ```
> %%
> .
^spwoqgulnam


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e5263b5a-92e4-4549-8748-4c0fb87c98a0","type":"Annotation","motivation":"commenting","body":{"id":"#^eikgl68ua48","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41113,"end":41244},{"type":"TextQuoteSelector","exact":"Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.","prefix":"e detail that must be specified. ","suffix":" Clients never want exactly that."},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:54.746Z","modified":"2026-11-10T13:10:54.746Z","hypothesis":{"id":"hz6WwOMHEfGIx1NTyz4S4A","digest":"ebde8e9ad894b","page":{"id":"h2O4fuMHEfGRSqczHydMsA","digest":"19c9422849470b"}}}
> ```
> %%
> .
^eikgl68ua48


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:720b9302-bf82-4450-be48-6c58ed41d5cb","type":"Annotation","motivation":"commenting","body":{"id":"#^k3d5e5ivcdq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41561,"end":41860},{"type":"TextQuoteSelector","exact":"I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.","prefix":"s part of the system definition. ","suffix":""},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:11:26.033Z","modified":"2026-11-10T13:11:26.033Z","hypothesis":{"id":"h5KGwuMHEfG148dG8Kca7g","digest":"1c32622a511f9f","page":{"id":"h7pRrOMHEfGY9cPFmSjwug","digest":"15d69834a30230"}}}
> ```
> %%
> .
^k3d5e5ivcdq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7e32bc36-484d-406a-90ce-077f70e46cae","type":"Annotation","motivation":"commenting","body":{"id":"#^l6116faqbyh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42610,"end":42749},{"type":"TextQuoteSelector","exact":"The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability","prefix":"lid inputs, abort cleanly, etc. ","suffix":"Much of present-day software acq"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:12:21.506Z","modified":"2026-11-10T13:12:21.506Z","hypothesis":{"id":"h99Y0OMHEfGa52-iMtVuTg","digest":"5a93491e2b005","page":{"id":"iAdrpOMHEfG6OmO4Esl-Zw","digest":"c62c1d4b1567a"}}}
> ```
> %%
> .
^l6116faqbyh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:956229ae-3fab-47c5-9eee-f7340c5c160e","type":"Annotation","motivation":"commenting","body":{"id":"#^ta0co6qjc6d","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42749,"end":43058},{"type":"TextQuoteSelector","exact":"Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.","prefix":" it for consistency and usability ","suffix":" Hence they cannot be fixed witho"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:07.455Z","modified":"2026-11-10T13:13:07.455Z","hypothesis":{"id":"iDCs-OMHEfGzfd8ZPG5FXA","digest":"d1781b9191ea0","page":{"id":"iFWHWOMHEfGLLbNOfkrG0g","digest":"6b8f361c0c64e"}}}
> ```
> %%
> https://agilemanifesto.org/authors.html
^ta0co6qjc6d


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:829e4639-2b70-42a3-a3f5-4d8a7a93dabc","type":"Annotation","motivation":"commenting","body":{"id":"#^ucs8dz59q1g","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43203,"end":43253},{"type":"TextQuoteSelector","exact":"Incremental development−grow, not build, software.","prefix":"tion of prototypes and products. ","suffix":" I still remember the jolt I fel"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:35.689Z","modified":"2026-11-10T13:13:35.689Z","hypothesis":{"id":"iHpq8OMHEfG1nieb_YuyVw","digest":"b1d465f6ddf33","page":{"id":"iKC7dOMHEfGdF9Nx75SLww","digest":"16575b9d52a08f"}}}
> ```
> %%
> .
^ucs8dz59q1g


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:13b76122-3ec3-4638-a9d0-e71479a9035f","type":"Annotation","motivation":"commenting","body":{"id":"#^l87arq847gq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43687,"end":43736},{"type":"TextQuoteSelector","exact":"The building metaphor has outlived its usefulness","prefix":" of components, and scaffolding. ","suffix":". It is time to change again. If"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:56.542Z","modified":"2026-11-10T13:13:56.542Z","hypothesis":{"id":"iMd2nOMHEfGlEfsrqKOyWA","digest":"8502220aaac54","page":{"id":"iO3jzOMHEfGIekuHbGDNYQ","digest":"17419263b592f9"}}}
> ```
> %%
> .
^l87arq847gq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1217c77d-0f0e-47c2-9b5d-62a816b49cdb","type":"Annotation","motivation":"commenting","body":{"id":"#^h6tmealho1b","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45231,"end":45384},{"type":"TextQuoteSelector","exact":"Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.","prefix":"out of what is already there. 11 ","suffix":""},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:14:51.449Z","modified":"2026-11-10T13:14:51.449Z","hypothesis":{"id":"iRCYcuMHEfG9ntP8gpb21g","digest":"8bb8435a97e83","page":{"id":"iTOkyuMHEfG5fK-AuCDNcg","digest":"1795dcc81c3671"}}}
> ```
> %%
> .
^h6tmealho1b


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:dfe83f3c-f17a-433c-905b-ac71bc76cc3d","type":"Annotation","motivation":"commenting","body":{"id":"#^z9rqoddbhek","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43975,"end":44305},{"type":"TextQuoteSelector","exact":"Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.","prefix":"e a radically different approach. ","suffix":"So it must be with our software "},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:15:41.748Z","modified":"2026-11-10T13:15:41.748Z","hypothesis":{"id":"iVX0iuMHEfGJhle_idpjuA","digest":"1d1256a7adabdb","page":{"id":"iXvp7OMHEfG0wU9qck5n8g","digest":"f9face9dfae2c"}}}
> ```
> %%
> .
^z9rqoddbhek


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e478d6d1-db04-46a3-8486-05bffe991284","type":"Annotation","motivation":"commenting","body":{"id":"#^pnvpwm0kfph","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45466,"end":45566},{"type":"TextQuoteSelector","exact":"The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.","prefix":"n software engineering (1986) 15 ","suffix":" Efforts redouble when the first"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:18:40.436Z","modified":"2026-11-10T13:18:40.436Z","hypothesis":{"id":"iZ_njuMHEfG9CVfLqQJJ6Q","digest":"a6cf8545d0aa9","page":{"id":"icfGAOMHEfGvYmclO4odbw","digest":"3958aa68fbfa9"}}}
> ```
> %%
> .
^pnvpwm0kfph


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d187d320-560c-415b-b436-b8a9d487c47e","type":"Annotation","motivation":"commenting","body":{"id":"#^659tbk1url4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46138,"end":46236},{"type":"TextQuoteSelector","exact":"Programmers are among the most intelligent part of the population, so they can learn good practice.","prefix":"design practices can be taught. ","suffix":" Thus a major thrust in the Unit"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:23:47.220Z","modified":"2026-11-10T13:23:47.220Z","hypothesis":{"id":"ifOhnuMHEfG5kedtJhiITw","digest":"1893893acd674f","page":{"id":"ihgj6OMHEfG_-RM6H8drHA","digest":"f2193c2550624"}}}
> ```
> %%
> .
^659tbk1url4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d9034a33-272e-4b29-8d81-db598afffe94","type":"Annotation","motivation":"commenting","body":{"id":"#^u3tbp9k9laq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":48605,"end":48988},{"type":"TextQuoteSelector","exact":"My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.","prefix":" products will ultimately depend. ","suffix":"How to grow great designers? Spa"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:25:47.548Z","modified":"2026-11-10T13:25:47.548Z","hypothesis":{"id":"ijoSUOMHEfGRS7s4ixIwyg","digest":"d9e17c75b1c54","page":{"id":"il9XDuMHEfGBmQ94az68RA","digest":"8abfaa3a478b9"}}}
> ```
> %%
> .
^u3tbp9k9laq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:92804baf-20f0-4947-882d-669d28a9c06f","type":"Annotation","motivation":"commenting","body":{"id":"#^obag3lnbk6","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49302,"end":49558},{"type":"TextQuoteSelector","exact":"Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.","prefix":", and keep a careful career file. ","suffix":"Provide opportunities for growin"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:26:47.607Z","modified":"2026-11-10T13:26:47.607Z","hypothesis":{"id":"ipAEiuMHEfGS3BM9uksecA","digest":"116b42ffa16700","page":{"id":"irfZkuMHEfG0QSPsHwFvSA","digest":"1b614f6cef95fa"}}}
> ```
> %%
> .
^obag3lnbk6


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:439ba5df-3e0a-436c-902e-791e4184ffc9","type":"Annotation","motivation":"commenting","body":{"id":"#^839csn14pzu","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49558,"end":49644},{"type":"TextQuoteSelector","exact":"Provide opportunities for growing designers to interact with and stimulate each other.","prefix":"technical leadership assignments. ","suffix":"■"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:27:00.026Z","modified":"2026-11-10T13:27:00.026Z","hypothesis":{"id":"iuE_2uMHEfG9CUv27yKlig","digest":"13ac4ca679b61","page":{"id":"iwscnOMHEfGd3bNdsNge_A","digest":"a92acc40ecf9c"}}}
> ```
> %%
> .
^839csn14pzu


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:fb08ed63-8f32-46c1-bdbe-314279d84d66","type":"Annotation","motivation":"commenting","body":{"id":"#^tx89o2dg9y","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47979,"end":48089},{"type":"TextQuoteSelector","exact":"Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.","prefix":"ways to grow great designers. 12 ","suffix":""},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:10.341Z","modified":"2026-11-10T13:27:10.341Z","hypothesis":{"id":"izmzaOMHEfGJh6tdX6qxKg","digest":"67cdf9fba0d26","page":{"id":"i16rKOMHEfGd3t90yw_iqA","digest":"17a42bc42046bb"}}}
> ```
> %%
> .
^tx89o2dg9y


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49a481c6-a08f-47ad-ae46-b74410638fb4","type":"Annotation","motivation":"commenting","body":{"id":"#^oxueoddlujp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46599,"end":46776},{"type":"TextQuoteSelector","exact":"Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.","prefix":"ext step upward in the same way. ","suffix":" Great designs come from great d"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:34.536Z","modified":"2026-11-10T13:27:34.536Z","hypothesis":{"id":"i4IM-OMHEfGG48sxvxVlCA","digest":"132a3dc00d6ad","page":{"id":"i7e5cOMHEfGYcdfMM60l3A","digest":"19e0fac0123961"}}}
> ```
> %%
> .
^oxueoddlujp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:59f2f1bc-c6b0-4383-947a-b451ed933f54","type":"Annotation","motivation":"commenting","body":{"id":"#^6jf16b2d9lw","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47176,"end":47256},{"type":"TextQuoteSelector","exact":"The differences between the great and the average approach an order of magnitude.","prefix":" and produced with less effort. ","suffix":"A little retrospection shows tha"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:44.860Z","modified":"2026-11-10T13:27:44.860Z","hypothesis":{"id":"i9rrUuMHEfGpQitc_JYv8w","digest":"54605121a2a74","page":{"id":"jANotuMHEfGw6b8gnFDn2g","digest":"d373eaaa9ac4e"}}}
> ```
> %%
> .
^6jf16b2d9lw


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bca28b90-fea2-4a10-ae1e-e40f2956827f","type":"Annotation","motivation":"commenting","body":{"id":"#^gydte98pz3n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28690,"end":28836},{"type":"TextQuoteSelector","exact":"Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.","prefix":"n software engineering (1986) 10 ","suffix":" Some systems for integrating dif"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:35.458Z","modified":"2026-11-10T13:30:35.458Z","hypothesis":{"id":"jCRCrOMHEfGxk3sQuzYmhQ","digest":"1a9271572e90d0","page":{"id":"jEnbFuMHEfGPWguE10tMpg","digest":"1d24d4bc50a1b9"}}}
> ```
> %%
> .
^gydte98pz3n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:329038c3-6835-42bd-b960-d5e175b213d9","type":"Annotation","motivation":"commenting","body":{"id":"#^ojjhhp38yqd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":29055,"end":29355},{"type":"TextQuoteSelector","exact":"These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.","prefix":", and generated the programs. • • • • ","suffix":"It is hard to see how such techn"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:54.879Z","modified":"2026-11-10T13:30:54.879Z","hypothesis":{"id":"jG_exOMHEfGCHjfb0NDeUA","digest":"5ed4a63cc900f","page":{"id":"jJbeeuMHEfGyFiOCbykzLQ","digest":"4284ba620cb8e"}}}
> ```
> %%
> .
^ojjhhp38yqd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e60fcb9b-590c-4d15-990c-9734084c6aaa","type":"Annotation","motivation":"commenting","body":{"id":"#^sxlthsl8nr","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2665,"end":2738},{"type":"TextQuoteSelector","exact":"But, as we look to the horizon of a decade hence, we see no silver bullet","prefix":"ly as computer hardware costs do. ","suffix":". There is no single development,"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:08:41.636Z","modified":"2026-11-10T15:08:41.636Z","hypothesis":{"id":"jLzoaOMHEfG6O4P882vhQA","digest":"1098d608d91b8f","page":{"id":"jPDwVOMHEfGBmh_WleMU-w","digest":"14811057ea12c7"}}}
> ```
> %%
> I'm not certain about the range of 1986-1996, but I can at least safely say that we've safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I've seen ideas go from realization -> ideation -> implementation -> review -> release in a day's time.
>
> Of course, the claim I've seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).
>
> The way I've put it, colloquially, is that in a situation where you're at a physical assembly line and a machine in the middle speeds up by 1000%, you're not looking at a 1000% increase in productivity across the assembly line. You're looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren't moving fast enough, and that the review process has [[public/content/notes/natural-language-cve.md|largely caught on fire]].
^sxlthsl8nr


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8db4a429-d71b-4e14-9845-3d137e927183","type":"Annotation","motivation":"commenting","body":{"id":"#^5v8w05h0q8t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2817,"end":2927},{"type":"TextQuoteSelector","exact":"which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.","prefix":"nology or management technique, ","suffix":" In this chapter we shall try to"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:13:51.277Z","modified":"2026-11-10T15:13:51.277Z","hypothesis":{"id":"jRfuhOMHEfG8Fxsdhiyrzw","digest":"37d4e256d89bb","page":{"id":"jUBoluMHEfGG5HM66uIFyA","digest":"1fbdba366655f9"}}}
> ```
> %%
> This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It's not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones -- time developing features, versus time developing fixes -- is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it's the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.
^5v8w05h0q8t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ff929a1-15ed-4ded-baa1-6359aaf4fbee","type":"Annotation","motivation":"commenting","body":{"id":"#^0vplvym3cbrg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":3065,"end":3261},{"type":"TextQuoteSelector","exact":"Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.","prefix":"perties of the bullets proposed. ","suffix":" A disciplined, consistent effor"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:14:47.358Z","modified":"2026-11-10T15:14:47.358Z","hypothesis":{"id":"jWX-5OMHEfGXjoPLeMJVpw","digest":"b2c5d40d92e78","page":{"id":"jZ2oiuMHEfGNwmcVzPGZ4g","digest":"1651519a6244d8"}}}
> ```
> %%
> I'll be ~~stealing~~ quoting "Skepticism is not pessimism" in my future apologetics around LLMs and agentic development.
^0vplvym3cbrg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:da59915a-d94b-4c44-87be-1a322812a2e8","type":"Annotation","motivation":"commenting","body":{"id":"#^kfxwncrsfe","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5782,"end":5874},{"type":"TextQuoteSelector","exact":"If this is true, building software will always be hard. There is inherently no silver bullet.","prefix":"in software engineering (1986) 3 ","suffix":"Let us consider the inherent pro"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-10T15:21:52.536Z","modified":"2026-11-10T21:18:39.988Z","hypothesis":{"id":"jcaapuMHEfGtUw_fOt4nqg","digest":"e074e3dc92da3","page":{"id":"jftGUuMHEfG1nw-jaKGRQQ","digest":"17eec8356c007b"}}}
> ```
> %%
> I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.
>
> To make sure I'm not discounting the point, though, I do think that it's worth softening it to "The essential part of software engineering is hard(er to optimize)", which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I've found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [[public/content/notes/software-gardening.mdx#Feedforward & Feedback|rapid and determinstic feedback]].
>
> What I've found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for... too many reasons to get into, here, but fundamentally comes down to the constraint that "write code faster" and "help humans understand code faster" are two very, *very* different engineering problems.
^kfxwncrsfe


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1b1ac91c-97bc-44f1-9c1b-a18711c4b653","type":"Annotation","motivation":"commenting","body":{"id":"#^wwj4u960f7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":10658,"end":11227},{"type":"TextQuoteSelector","exact":"All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.","prefix":" dampen the whim of the changers. ","suffix":"In short, the software product i"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-10T21:57:54.385Z","modified":"2026-11-10T21:57:54.385Z","hypothesis":{"id":"jiA9BOMHEfG4M4e4iu8c3A","digest":"401a1a515230d","page":{"id":"jkV1YOMHEfGvY8_4JTMSbg","digest":"c6d9ee87ef4cc"}}}
> ```
> %%
> Gah -- this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn't mean the work to keep them runnable has (or will ever) end.
^wwj4u960f7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:2bf0a10d-edc3-44ad-8243-25a01a0cc974","type":"Annotation","motivation":"commenting","body":{"id":"#^ncf9kp5bnq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":11453,"end":11494},{"type":"TextQuoteSelector","exact":"Software is invisible and unvisualizable.","prefix":" software product. Invisibility. ","suffix":" Geometric abstractions are power"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-13T14:41:40.886Z","modified":"2026-11-13T14:41:40.886Z","hypothesis":{"id":"jm7RlOMHEfG9jQvzBeYPzw","digest":"187859de677fdc","page":{"id":"jprBKOMHEfGz_LeK6DCDJg","digest":"1c78e43176e59d"}}}
> ```
> %%
> *Again* with the *absolutes* here, Brooks!
>
> I think "unvisualizable" concedes defeat before the fight has really started out. I'd once again summon up [[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces.md|boundary objects]]. My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.
>
> A [recent video about Britain's National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it's to get an immediate working knowledge of any issues worth addressing.
>
> I would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize -- not impossible. The analogy I'd pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some "most significant" visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:
>
> 1. Steps and catalog configurations themselves;
> 2. Storage mediums (S3, local system, etc.)
>
> Ultimately, it's just making sure you understand what a developer's necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.
^ncf9kp5bnq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7eea6caa-5a39-4be0-b2d3-d2c86073880e","type":"Annotation","motivation":"commenting","body":{"id":"#^kds1hgm51rl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2771,"end":2815},{"type":"TextQuoteSelector","exact":"in either technology or management technique","prefix":" There is no single development, ","suffix":", which by itself promises even o"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-13T15:13:22.608Z","modified":"2026-11-13T15:13:22.608Z","hypothesis":{"id":"jsWocOMHEfGNw__rbqIytQ","digest":"2bab68bf8c8da","page":{"id":"juypFuMHEfGSv4PUC6a1dQ","digest":"2545d525cecc0"}}}
> ```
> %%
> *In a world **before** Agile...*
>
> All things considered, I'm glad to see management technique incorporated into an analysis of engineering optimization.
^kds1hgm51rl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0251a4b2-83e8-47ed-a8e4-342288bc141b","type":"Annotation","motivation":"commenting","body":{"id":"#^hfp5csllcv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21404,"end":21681},{"type":"TextQuoteSelector","exact":"Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.","prefix":"rified the terminological chaos: ","suffix":" In this approach human experts "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-13T17:35:31.514Z","modified":"2026-11-13T17:44:58.106Z","hypothesis":{"id":"jxepIuMHEfGPW_dY1rsjWw","digest":"c80f34b5082a7","page":{"id":"jz6ICOMHEfGEdAMbYmctCA","digest":"5b08d90d5bcb5"}}}
> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5e07b64b-9265-4544-82d2-6f1fda0a6f2f","type":"Annotation","motivation":"commenting","body":{"id":"#^9ozg40riczb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1007,"end":1149},{"type":"TextQuoteSelector","exact":"Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.","prefix":"l, as opposed to the essential? ","suffix":"Therefore it appears that the ti"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:40:29.215Z","modified":"2026-11-10T14:54:19.905Z"}
> ```
> %%
> I think that this premise hits a bit differently in 2026 than it did in 1986.
>
> First: even though Brooks is framing "Silver Bullet" as an order-of-magnitude improvement, this isn't necessarily a binary, true/false "anything less is useless": simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.
>
> In the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that's where the optimization question gets even more philosophical than Brooks puts it, here. I'm especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they're responsible for).
^9ozg40riczb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9595dd47-9bfc-471a-bc3a-d8505b39402a","type":"Annotation","motivation":"commenting","body":{"id":"#^vjg26uls6ae","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1502,"end":1531},{"type":"TextQuoteSelector","exact":"Growing software organically,","prefix":"tablishing software requirements. ","suffix":" adding more and more function t"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:42:14.954Z","modified":"2026-11-10T14:45:40.331Z"}
> ```
> %%
> I mean... [[public/content/notes/software-gardening.mdx|I can't *not* bring it up.]]
^vjg26uls6ae


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8c76221b-77ad-4955-b84b-663adf9a2372","type":"Annotation","motivation":"commenting","body":{"id":"#^tkmanyd0vh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4605,"end":4696},{"type":"TextQuoteSelector","exact":"he transformation of computer manufacture from an assembly industry into a process industry.","prefix":"ed costs. These gains flow from t","suffix":"Second, to see what rate of prog"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:45:52.475Z","modified":"2026-11-10T15:18:11.856Z"}
> ```
> %%
> It's important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.
>
> I think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.
^tkmanyd0vh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4687d939-3394-4435-bed2-837709f917fe","type":"Annotation","motivation":"commenting","body":{"id":"#^vyepyaspik","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4824,"end":4997},{"type":"TextQuoteSelector","exact":"I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.","prefix":"ficulties. Following Aristotle, ","suffix":"The accidents I discuss in the n"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:46:40.788Z","modified":"2026-11-10T15:19:30.218Z"}
> ```
> %%
> Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.
^vyepyaspik


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4d69f8b6-dea0-43f4-b681-7cdf20b1f5c3","type":"Annotation","motivation":"commenting","body":{"id":"#^x4uisgky7tj","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5394,"end":5701},{"type":"TextQuoteSelector","exact":"I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.","prefix":"hly precise and richly detailed. ","suffix":""},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:47:19.934Z","modified":"2026-11-10T15:21:04.436Z"}
> ```
> %%
> This is a massive issue that I broach in both the [[public/content/dead-math.md|Gherkin post]], as well as touching on my own experience trying to resurrect "dead" software, as defined in [[public/content/annotations/programming-as-theory-building.md|Programming as Theory Building]].
^x4uisgky7tj


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:86485653-2229-4361-906f-d5c781d08617","type":"Annotation","motivation":"commenting","body":{"id":"#^vqhlzf6jdks","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":6963,"end":7143},{"type":"TextQuoteSelector","exact":"The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.","prefix":"creases much more than linearly. ","suffix":" Mathematics and the physical sc"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:53:50.156Z","modified":"2026-11-10T21:26:25.550Z"}
> ```
> %%
> Brooks gets into this later, but... yeah. That also came up in the background research for CASE programs during [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]. It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [[public/tags/projects/flowthru|Flowthru]], for example, lends itself well to a visualization, but that's only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get... horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It's effectively be an orthogonal axis to the DAG, adding an additional dimensionality.
>
> Brooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.
^vqhlzf6jdks


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7a9e9ec1-7273-4fa6-bca9-c174b90d6009","type":"Annotation","motivation":"commenting","body":{"id":"#^pprm61om6t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":7801,"end":7959},{"type":"TextQuoteSelector","exact":"From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.","prefix":" cost overruns, schedule delays. ","suffix":" From the complexity of the func"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:59:49.692Z","modified":"2026-11-10T21:28:12.429Z"}
> ```
> %%
> [[public/content/dead-math#Why Proofs?|This section on formal verification and proofs]] talks about this a bit. Even the Red Team's research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today's technology, be out of the realm of possibility.
^pprm61om6t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ecff3bf-adc9-437a-a6c6-ba36d1ae4472","type":"Annotation","motivation":"commenting","body":{"id":"#^f7geh76bbjl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":8513,"end":8613},{"type":"TextQuoteSelector","exact":"It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.","prefix":"and control all the loose ends. ","suffix":"Conformity. Software people are "},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:08.322Z","modified":"2026-11-10T21:34:52.015Z"}
> ```
> %%
> This is *exactly* what [[public/content/annotations/programming-as-theory-building#^7ppb5sf3ycw|Naur talks about]]. Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.
>
> This is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don't fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.
^f7geh76bbjl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b910316c-2896-484d-a3ad-83793f911e24","type":"Annotation","motivation":"commenting","body":{"id":"#^ulc2nm1bo4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9029,"end":9185},{"type":"TextQuoteSelector","exact":"No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human","prefix":" is not capricious or arbitrary. ","suffix":""},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:53.203Z","modified":"2026-11-10T21:36:26.044Z"}
> ```
> %%
> I do feel this one deeply. As part of my [[public/tags/projects/dayjob|dayjob]], I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.
^ulc2nm1bo4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:847428ca-9bdc-4ebf-85eb-d0e867be13c2","type":"Annotation","motivation":"commenting","body":{"id":"#^v9h1tk6pcnb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9493,"end":9800},{"type":"TextQuoteSelector","exact":"In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.","prefix":"rent people, rather than by God. ","suffix":"Changeability. The software enti"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T20:05:36.052Z","modified":"2026-11-10T21:52:38.256Z"}
> ```
> %%
> I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they'll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.
>
> Conversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* -- that is to say, I can make decisions autonomously without much fear that I'll, say, lose business or alienate anyone.
>
> Software, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:
>
> - Z is for patches (small fixes that don't modify functionality
> - Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won't break any users' switching
> - X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.
>
> It's not unusual to see early software go through many breaking changes while it's a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).
^v9h1tk6pcnb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f7a2e78f-2e1f-45a2-8eb8-e479ad97fd1f","type":"Annotation","motivation":"commenting","body":{"id":"#^732yguy522u","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":12130,"end":12231},{"type":"TextQuoteSelector","exact":"we find it to constitute not one, but several, general directed graphs, superimposed one upon another.","prefix":"t to diagram software structure, ","suffix":" The several graphs may represen"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T22:08:42.822Z","modified":"2026-11-07T22:08:42.822Z"}
> ```
> %%
> .
^732yguy522u


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7c70a2dd-121a-4181-b1f1-cf690b8972c8","type":"Annotation","motivation":"commenting","body":{"id":"#^hd9oddco1o7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15479,"end":15601},{"type":"TextQuoteSelector","exact":"arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.","prefix":" going on in a complex system. 2 P","suffix":""},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:09:36.128Z","modified":"2026-11-13T15:44:07.672Z"}
> ```
> %%
> [Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)
^hd9oddco1o7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1fcbe46a-9374-48c7-b7e2-af2277b7188e","type":"Annotation","motivation":"commenting","body":{"id":"#^sasqm0mbvyd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":13331,"end":13671},{"type":"TextQuoteSelector","exact":"High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.","prefix":"trapolation of each such attack. ","suffix":"What does a high-level language "},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:10:18.916Z","modified":"2026-11-13T14:50:20.099Z"}
> ```
> %%
> While this is definitely the case, I'd say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can't be effectively linted becomes harder to scale against than is offset by their ease of use.
>
> This is specifically around non-prototyping. That's worth distinguishing.
^sasqm0mbvyd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6d4682fb-d70b-4906-9e20-6bc55a832c74","type":"Annotation","motivation":"commenting","body":{"id":"#^57h8rfdym18","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14563,"end":14746},{"type":"TextQuoteSelector","exact":"Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.","prefix":"r to the sophistication of users. ","suffix":"Time-sharing. Most observers cre"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:11:16.771Z","modified":"2026-11-13T15:02:22.480Z"}
> ```
> %%
> Ah, yeah -- this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall -- I haven't read the book since college) talks about the idea of "good abstractions" and "bad abstractions".
>
> It can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the "rules" require carve-outs, which is a slippery slope towards having no rules at all.
>
> Frameworks also have the same... I won't call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it's necessary to understand that there truly is no "silver bullet" among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* -- but there truly is no "everything" framework.
^57h8rfdym18


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3f255411-7368-4881-b687-277d9cd7a940","type":"Annotation","motivation":"commenting","body":{"id":"#^eicluc87x9t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15876,"end":16080},{"type":"TextQuoteSelector","exact":"The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.","prefix":"of time-sharing derive directly. ","suffix":"Unified programming environments"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-07T22:31:01.338Z","modified":"2026-11-13T15:53:47.240Z"}
> ```
> %%
> The idea of shortening system response time is *so underrated* -- and far harder than Brooks makes it out to be. I talk about this a lot in both [[public/content/notes/software-gardening.mdx|Software Gardening]] and its precursor, [[public/content/notes/hostage-negotiations|Hostage Negotiations]]: rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.
>
> A lot of my attitude on immediate feedback was borne from my time doing [[public/content/articles/structured-streaming.md|data pipelines on Databricks/PySpark]]. That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.
^eicluc87x9t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:82d926aa-2f7d-4c4b-b3ba-5f600e9938c1","type":"Annotation","motivation":"commenting","body":{"id":"#^bfauk520glo","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15101,"end":15476},{"type":"TextQuoteSelector","exact":"The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.","prefix":"tain an overview of complexity. ","suffix":"2 Parnas, D.L., “Designing softw"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:31:59.691Z","modified":"2026-11-13T15:43:14.400Z"}
> ```
> %%
> Thinking about this in terms of 1986 versus 2026, batch programming feels more like a "push" in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)
^bfauk520glo


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0a5a63da-439e-41f3-9790-8cc03a8c4d6c","type":"Annotation","motivation":"commenting","body":{"id":"#^yfp6g5ihhb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21051,"end":21249},{"type":"TextQuoteSelector","exact":"Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4","prefix":"g a program product. I doubt it. ","suffix":" I do not. To see why, we must d"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:32:40.645Z","modified":"2026-11-17T15:52:23.000Z"}
> ```
> %%
> This bit of the paper feels *prescient* when you read it out of context, but it's so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn't pan out then, but here we are now.
^yfp6g5ihhb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b3d43a2e-ab25-405d-a932-ed1c2a033fd8","type":"Annotation","motivation":"commenting","body":{"id":"#^8kwbn6w8ess","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22004,"end":22124},{"type":"TextQuoteSelector","exact":"Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).","prefix":"alif.: Benjamin Cummings, 1983. 4 ","suffix":""},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:33:03.124Z","modified":"2026-11-17T15:53:04.612Z"}
> ```
> %%
> [Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)
^8kwbn6w8ess


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:234b7bdf-0b07-4270-a94f-a7b060bd9cb6","type":"Annotation","motivation":"commenting","body":{"id":"#^m2tflg196ud","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14746,"end":14759},{"type":"TextQuoteSelector","exact":"Time-sharing.","prefix":"ely uses the esoteric constructs. ","suffix":" Most observers credit time-shar"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-09T17:04:41.771Z","modified":"2026-11-13T15:36:10.363Z"}
> ```
> %%
> This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today's dollars).
>
> As such, companies typically couldn't buy all that many computers. On top of that, early computers weren't multi-user: that is to say, you couldn't have multiple users "logged in", using the company's one computer, at once. That's what "batch programming" was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.
>
> (This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by "time sharing").
>
> Despite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of "context switching" -- having to interrupt your train of thought by multitasking (say, programming while also responding to pings).
^m2tflg196ud


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:eb1aa5af-1a36-414f-840c-99d86c8a3ba4","type":"Annotation","motivation":"commenting","body":{"id":"#^6w73od68aa3","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":16276,"end":16555},{"type":"TextQuoteSelector","exact":"They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.","prefix":"tivity by integral factors. Why? ","suffix":"This breakthrough in turn stimul"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-09T17:05:19.840Z","modified":"2026-11-13T16:16:33.678Z"}
> ```
> %%
> I haven't got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.
>
> (To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).
>
> The only thing I'd add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it's important to note that the vast majority of most powerful tools available to developers work against plaintext. There's no way, for example, to `grep` a Word document.
>
> A minor part of the reason I've [[public/content/dead-math.md|latched onto Gherkin]] is because it brings aspects of project management and ownership into plaintext. Once it's in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.
^6w73od68aa3


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:61f123e4-d7b2-4dc0-aa45-087b6bc1f556","type":"Annotation","motivation":"commenting","body":{"id":"#^byc7wdtnz3o","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19107,"end":19231},{"type":"TextQuoteSelector","exact":"Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.","prefix":" the cause of the improvements. ","suffix":"Object-oriented programming. Man"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:24.528Z","modified":"2026-11-13T16:26:40.158Z"}
> ```
> %%
> Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.
>
> In the same way I doubt that [[public/content/notes/pattern-languages-of-the-neighborhood|A Pattern Language]] could've been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.
^byc7wdtnz3o


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7b97e683-9106-4b7d-87fd-c0065b37ee25","type":"Annotation","motivation":"commenting","body":{"id":"#^ankq3ql47lk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19231,"end":19405},{"type":"TextQuoteSelector","exact":"Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.","prefix":"odern software design techniques. ","suffix":" Mark Sherman of Dartmouth notes"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:46.934Z","modified":"2026-11-13T16:28:48.336Z"}
> ```
> %%
> We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I've already cited to the practice, I'd refer to previous annotations on OOP's importance.
^ankq3ql47lk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:c2320176-e5d6-46c5-9cd2-e379a5fc910a","type":"Annotation","motivation":"commenting","body":{"id":"#^n5q9tyhtdgg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":20557,"end":20778},{"type":"TextQuoteSelector","exact":"Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that","prefix":"gher-order expression of design. ","suffix":". An order-of-magnitude gain can "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:08:50.891Z","modified":"2026-11-17T14:39:55.654Z"}
> ```
> %%
> I'd once again disagree with this, but it's nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.
>
> This is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of "cutting off fat" versus "cutting into muscle". To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.
^n5q9tyhtdgg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:18e57bab-231a-4f16-a5b6-aec2fc1c0105","type":"Annotation","motivation":"commenting","body":{"id":"#^kuymwz1me2","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22649,"end":22816},{"type":"TextQuoteSelector","exact":"The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.","prefix":" completely with this critique. ","suffix":" I have a hard time seeing how i"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:10:21.719Z","modified":"2026-11-17T22:23:03.184Z"}
> ```
> %%
> Another thing that definitely [didn't age as well](https://en.wikipedia.org/wiki/Transformer_(deep_learning)).
>
> A really good book on how the history of this approach flipped from "expert-designed expert systems" to "throw as much data as humanly possible to train on" is [*The Worlds I See*](https://www.amazon.com/Worlds-See-Curiosity-Exploration-Discovery/dp/1250897939) by [Dr. Fei-Fei Li](https://en.wikipedia.org/wiki/Fei-Fei_Li), who famously put together the [ImageNet](https://en.wikipedia.org/wiki/ImageNet) dataset. It was the performance of [AlexNet](https://en.wikipedia.org/wiki/AlexNet) on the ImageNet competition that kinda kicked off this whole deep-learning, neural-networking, [transformers-are-all-you-need](https://arxiv.org/pdf/1706.03762) era of computing.
^kuymwz1me2


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:882d3841-9285-4e1a-aba0-05b8afd9c006","type":"Annotation","motivation":"commenting","body":{"id":"#^5moqmvedmzn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":23484,"end":23813},{"type":"TextQuoteSelector","exact":"An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.","prefix":"ept, and what are the prospects? ","suffix":" The inference engines typically "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:11:30.693Z","modified":"2026-11-17T22:58:01.062Z"}
> ```
> %%
> I may end up re-reading the section(s) of Dr. Li's book regarding expert systems, because this is... vaguely reminiscent of the inference mechanism of LLMs, but not quite. Infamously, LLMs can struggle with justifying decisions only after-the-fact, not preserving prior reasoning sessions in future context for the sake of not cluttering up the context.
>
> I would be curious if there *is* any mechanism used by popular harnesses, by which LLMs can directly reference prior reasoning rounds as though they're data rather than conversational context. That doesn't seem like a particularly novel idea, so if it *hasn't* been done, so if it hasn't, I wonder if that's related to a general understanding that [judging LLMs based on their train-of-thought is a dangerous practice](https://cdn.openai.com/pdf/34f2ada6-870f-4c26-9790-fd8def56387f/CoT_Monitoring.pdf) (with a fantastic [explainer video](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) to boot).
^5moqmvedmzn



> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ed9f3060-9a8a-4f3a-88d3-369cff38e9fe","type":"Annotation","motivation":"commenting","body":{"id":"#^ivjyf74mo9k","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24530,"end":24725},{"type":"TextQuoteSelector","exact":"Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.","prefix":"lexity of the application itself. ","suffix":" I believe the most important ad"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:13:09.107Z","modified":"2026-11-17T23:01:50.654Z"}
> ```
> %%
> In trying to find the correct reference for this citation, I believe I've found the correct Feigenbaum reference: [Knowledge Engineering: The Applied Side of Artificial Intelligence](https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf) (1980)
>
> This is also uncanny, considering the later recognition that certain deep learning techniques absolutely thrive with more and more data added to them.
^ivjyf74mo9k


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f1c09573-6c20-4f86-95b2-546dbbe45740","type":"Annotation","motivation":"commenting","body":{"id":"#^ncwm3eztdnk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24063,"end":24168},{"type":"TextQuoteSelector","exact":"Inference engine technology is developed in an application-independent way, and then applied to many uses.","prefix":"olutions to the same problems: • • ","suffix":" One can justify much more effor"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:20.346Z","modified":"2026-11-09T17:14:20.346Z"}
> ```
> %%
> .
^ncwm3eztdnk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0dfcb236-3820-4f20-bb49-a2b32663fd8a","type":"Annotation","motivation":"commenting","body":{"id":"#^g7ibzwd9qgt","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24268,"end":24530},{"type":"TextQuoteSelector","exact":"The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.","prefix":"hat technology is well advanced. ","suffix":"Edward Feigenbaum says that the "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:42.756Z","modified":"2026-11-09T17:14:42.756Z"}
> ```
> %%
> .
^g7ibzwd9qgt


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:75d191ab-463b-4c0f-8948-ac0fd09a99ce","type":"Annotation","motivation":"commenting","body":{"id":"#^7ndmgqf1q0j","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27236,"end":27306},{"type":"TextQuoteSelector","exact":"finding articulate, self-analytical experts who know why they do things","prefix":"d task of knowledge acquisition: ","suffix":"; and developing efficient techn"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:03.601Z","modified":"2026-11-09T17:17:03.601Z"}
> ```
> %%
> .
^7ndmgqf1q0j


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:17283a8d-6906-4672-ab64-e961b71715cf","type":"Annotation","motivation":"commenting","body":{"id":"#^6k5uzuuz5sv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":26662,"end":26718},{"type":"TextQuoteSelector","exact":"helping in lifelong maintenance and modification testing","prefix":" bring-up test cases, as well as ","suffix":". In the same way, we can postula"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:14.951Z","modified":"2026-11-09T17:17:14.951Z"}
> ```
> %%
> .
^6k5uzuuz5sv


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:291a0078-2264-4c2b-a03b-98de1e94aa93","type":"Annotation","motivation":"commenting","body":{"id":"#^mj864yumg2m","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27485,"end":27900},{"type":"TextQuoteSelector","exact":"The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.","prefix":"pert system is to have an expert. ","suffix":"“Automatic” programming. For alm"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:59.432Z","modified":"2026-11-09T17:17:59.432Z"}
> ```
> %%
> .
^mj864yumg2m


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ecd17a28-ec80-4edc-a1e6-f1591ccb67eb","type":"Annotation","motivation":"commenting","body":{"id":"#^dtcc5xnitnn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27925,"end":27944},{"type":"TextQuoteSelector","exact":"For almost 40 years","prefix":"ortant. “Automatic” programming. ","suffix":", people have been anticipating "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:18:26.339Z","modified":"2026-11-09T17:18:26.339Z"}
> ```
> %%
> .
^dtcc5xnitnn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d342ac9e-1f65-4dbb-8348-7eb0f1583899","type":"Annotation","motivation":"commenting","body":{"id":"#^uo0il5xnmjc","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28445,"end":28566},{"type":"TextQuoteSelector","exact":"He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.","prefix":"ly available to the programmer.8 ","suffix":"7 Mostow, op. cit. 8 Parnas, 1985"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:05.692Z","modified":"2026-11-09T17:19:05.692Z"}
> ```
> %%
> .
^uo0il5xnmjc


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4c9cd456-e0dd-4164-804d-1334f3faee82","type":"Annotation","motivation":"commenting","body":{"id":"#^kc305035ym","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28294,"end":28444},{"type":"TextQuoteSelector","exact":"n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.","prefix":"ot semantic content, asserting, I","suffix":"8 He argues, in essence, that in "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:16.915Z","modified":"2026-11-09T17:19:16.915Z"}
> ```
> %%
> .
^kc305035ym


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6225a18b-f7db-42e4-9f2e-6cc3ead88ad6","type":"Annotation","motivation":"commenting","body":{"id":"#^5s993cluoig","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30469,"end":30707},{"type":"TextQuoteSelector","exact":"In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.","prefix":"age for their proposed computer. ","suffix":"Second, the screens of today are"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:05.656Z","modified":"2026-11-09T17:21:05.656Z"}
> ```
> %%
> .
^5s993cluoig


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7fd04683-32ad-46d1-b267-5454e18a31a6","type":"Annotation","motivation":"commenting","body":{"id":"#^d97hq9ydw9c","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30195,"end":30306},{"type":"TextQuoteSelector","exact":"In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.","prefix":"I am persuaded that nothing will. ","suffix":"10 Indeed, it is best viewed as "},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:35.053Z","modified":"2026-11-09T17:21:35.053Z"}
> ```
> %%
> .
^d97hq9ydw9c


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d3c7cb2f-a6fa-40f3-911b-e44cc1939ddc","type":"Annotation","motivation":"commenting","body":{"id":"#^h5pgqb65qp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30707,"end":30844},{"type":"TextQuoteSelector","exact":"Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.","prefix":"ting the programs they describe. ","suffix":" The so-called “desktop metaphor"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:20.909Z","modified":"2026-11-09T17:22:20.909Z"}
> ```
> %%
> .
^h5pgqb65qp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bee19112-967e-484a-9103-73c467686702","type":"Annotation","motivation":"commenting","body":{"id":"#^xhvbeuk4i8n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31185,"end":31330},{"type":"TextQuoteSelector","exact":"Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.","prefix":"dom access to a score of pages. ","suffix":" The hardware technology will ha"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:40.869Z","modified":"2026-11-09T17:22:40.869Z"}
> ```
> %%
> .
^xhvbeuk4i8n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:089a9a54-a99c-4a3c-9193-aba42a91c987","type":"Annotation","motivation":"commenting","body":{"id":"#^1c5nprutkln","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31689,"end":31764},{"type":"TextQuoteSelector","exact":"we feel only one dimension of the intricately interlocked software elephant.","prefix":"l data structures, or whatever, ","suffix":" If we superimpose all the diagr"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:23:04.978Z","modified":"2026-11-09T17:23:04.978Z"}
> ```
> %%
> .
^1c5nprutkln


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0c450070-9a2d-4903-81b2-2ca1328f4186","type":"Annotation","motivation":"commenting","body":{"id":"#^u6tcgt70nrb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":32771,"end":33094},{"type":"TextQuoteSelector","exact":"I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.","prefix":"o implementing and testing them? ","suffix":"Program verification does not me"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:23:52.738Z","modified":"2026-11-09T17:23:52.738Z"}
> ```
> %%
> .
^u6tcgt70nrb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5b5057f6-6744-4c40-ae17-1a41e1bfbc35","type":"Annotation","motivation":"commenting","body":{"id":"#^fscfpc13l9","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33182,"end":33307},{"type":"TextQuoteSelector","exact":"Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.","prefix":" There is no magic here, either. ","suffix":"More seriously, even perfect pro"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:10.898Z","modified":"2026-11-09T17:24:10.898Z"}
> ```
> %%
> .
^fscfpc13l9


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1faa853b-a3a1-4f33-9e04-157741942330","type":"Annotation","motivation":"commenting","body":{"id":"#^rrk5d1x6wpg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33415,"end":33599},{"type":"TextQuoteSelector","exact":"The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.","prefix":"program meets its specification. ","suffix":"Environments and tools. How much"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:37.405Z","modified":"2026-11-09T17:24:37.405Z"}
> ```
> %%
> .
^rrk5d1x6wpg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5461e192-2399-4286-8ca7-40924730b637","type":"Annotation","motivation":"commenting","body":{"id":"#^sknnl8ow6i","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34108,"end":34388},{"type":"TextQuoteSelector","exact":"Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.","prefix":"rors and simple semantic errors. ","suffix":"Surely this work is worthwhile, "},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:13.535Z","modified":"2026-11-09T17:26:13.535Z"}
> ```
> %%
> .
^sknnl8ow6i


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:a9713bcc-7585-419e-b77d-1570a8eabce5","type":"Annotation","motivation":"commenting","body":{"id":"#^u5nri1m37df","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34854,"end":35028},{"type":"TextQuoteSelector","exact":"Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.","prefix":"ly supported by today’s speeds. ","suffix":"More powerful workstations we su"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:56.266Z","modified":"2026-11-09T17:26:56.266Z"}
> ```
> %%
> .
^u5nri1m37df


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b0695f58-7058-4708-8405-0a624690e9f7","type":"Annotation","motivation":"commenting","body":{"id":"#^ywdgnn4xef","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36066,"end":36174},{"type":"TextQuoteSelector","exact":"Buy versus build. The most radical possible solution for constructing software is not to construct it at all.","prefix":"some of these are very promising. ","suffix":"Every day this becomes easier, a"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:28:23.167Z","modified":"2026-11-09T17:28:23.167Z"}
> ```
> %%
> .
^ywdgnn4xef


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4be450d5-a1d5-4161-a894-c4cd1b8d40c8","type":"Annotation","motivation":"commenting","body":{"id":"#^qpqgplaxida","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35661,"end":35879},{"type":"TextQuoteSelector","exact":"If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.","prefix":"task = ∑ (Frequency) i x (Time) i ","suffix":"Hence we must consider those att"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:18.921Z","modified":"2026-11-09T17:29:18.921Z"}
> ```
> %%
> .
^qpqgplaxida


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:85b9a27a-8a42-4f48-8686-4a70d5a75465","type":"Annotation","motivation":"commenting","body":{"id":"#^46ecwt2iwel","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35908,"end":36020},{"type":"TextQuoteSelector","exact":"attacks that address the essence of the software problem, the formulation of these complex conceptual structures.","prefix":"ns. Hence we must consider those ","suffix":" Fortunately, some of these are v"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:28.380Z","modified":"2026-11-09T17:29:28.380Z"}
> ```
> %%
> .
^46ecwt2iwel


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44e54adc-74c5-437d-a971-b0cd79fcd03a","type":"Annotation","motivation":"commenting","body":{"id":"#^fh6d7a9q5mb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36377,"end":36466},{"type":"TextQuoteSelector","exact":"he personal computer revolution has created not one, but m any, mass markets for software.","prefix":"red on production methodology, t","suffix":" Every newsstand carried monthly "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:30:05.442Z","modified":"2026-11-09T17:30:05.442Z"}
> ```
> %%
> .
^fh6d7a9q5mb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:192ce430-c602-438a-a1a1-604cc509643b","type":"Annotation","motivation":"commenting","body":{"id":"#^8jv1h13fwqn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36858,"end":36913},{"type":"TextQuoteSelector","exact":"Any such product is cheaper to buy than to build afresh","prefix":"ket place for individual modules. ","suffix":". Even at a cost of $100,000, a p"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:31:42.594Z","modified":"2026-11-09T17:31:42.594Z"}
> ```
> %%
> .
^8jv1h13fwqn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e630617a-a237-4c6d-8f4d-f774127d141b","type":"Annotation","motivation":"commenting","body":{"id":"#^r48k3wopfxp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37279,"end":37461},{"type":"TextQuoteSelector","exact":"The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.","prefix":"ntained than homegrown software. ","suffix":" Sharing that cost among even a "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:33:14.699Z","modified":"2026-11-10T15:36:42.169Z"}
> ```
> %%
> On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it's basically the cost of pushing a distributable up to a server, and the cost of you downloading it.
>
> Netflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It's very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.
^r48k3wopfxp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:966aeb51-dea1-44dc-aea1-b0aed3360482","type":"Annotation","motivation":"commenting","body":{"id":"#^tic5hg7ofof","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37953,"end":38127},{"type":"TextQuoteSelector","exact":"users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.","prefix":"s, study after study showed that ","suffix":" During the 1980s, we find such "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:34:13.206Z","modified":"2026-11-09T17:34:13.206Z"}
> ```
> %%
> .
^tic5hg7ofof


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44fd7e54-9599-4253-8284-1411356d656f","type":"Annotation","motivation":"commenting","body":{"id":"#^y1gz1ngkwvm","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":38576,"end":39112},{"type":"TextQuoteSelector","exact":"The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.","prefix":"cated than those of 20 years ago. ","suffix":"There are dramatic exceptions to"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:12.688Z","modified":"2026-11-10T13:09:12.688Z"}
> ```
> %%
> .
^y1gz1ngkwvm


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:24df9bb7-b2ae-426b-a407-c973e704610f","type":"Annotation","motivation":"commenting","body":{"id":"#^z8uqeaqsds","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":39672,"end":39926},{"type":"TextQuoteSelector","exact":"Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.","prefix":"routinely done with these tools. ","suffix":"I believe the single most powerf"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:47.965Z","modified":"2026-11-10T13:09:47.965Z"}
> ```
> %%
> .
^z8uqeaqsds


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bfd257bc-26f1-436f-a280-f794f789179d","type":"Annotation","motivation":"commenting","body":{"id":"#^zm63kpzvr2q","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40204,"end":40313},{"type":"TextQuoteSelector","exact":"The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.","prefix":"t programs, and turn them loose. ","suffix":"Requirements refinement and rapi"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:54.490Z","modified":"2026-11-10T13:09:54.490Z"}
> ```
> %%
> .
^zm63kpzvr2q


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:590bd3a0-1dd1-4b3a-9323-542ba0ee6a30","type":"Annotation","motivation":"commenting","body":{"id":"#^14gm56fc3zwd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40313,"end":40449},{"type":"TextQuoteSelector","exact":"Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.","prefix":"ndreds of laboratory scientists. ","suffix":" No other part of the conceptual"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:08.183Z","modified":"2026-11-10T13:10:08.183Z"}
> ```
> %%
> .
^14gm56fc3zwd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49b68af2-7d89-4885-80f2-77290bb19a93","type":"Annotation","motivation":"commenting","body":{"id":"#^spwoqgulnam","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40912,"end":40968},{"type":"TextQuoteSelector","exact":"For the truth is, the clients do not know what they want.","prefix":"nt of the product requirements. ","suffix":" They usually do not know what q"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:43.052Z","modified":"2026-11-10T13:10:43.052Z"}
> ```
> %%
> .
^spwoqgulnam


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e5263b5a-92e4-4549-8748-4c0fb87c98a0","type":"Annotation","motivation":"commenting","body":{"id":"#^eikgl68ua48","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41113,"end":41244},{"type":"TextQuoteSelector","exact":"Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.","prefix":"e detail that must be specified. ","suffix":" Clients never want exactly that."},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:54.746Z","modified":"2026-11-10T13:10:54.746Z"}
> ```
> %%
> .
^eikgl68ua48


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:720b9302-bf82-4450-be48-6c58ed41d5cb","type":"Annotation","motivation":"commenting","body":{"id":"#^k3d5e5ivcdq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41561,"end":41860},{"type":"TextQuoteSelector","exact":"I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.","prefix":"s part of the system definition. ","suffix":""},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:11:26.033Z","modified":"2026-11-10T13:11:26.033Z"}
> ```
> %%
> .
^k3d5e5ivcdq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7e32bc36-484d-406a-90ce-077f70e46cae","type":"Annotation","motivation":"commenting","body":{"id":"#^l6116faqbyh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42610,"end":42749},{"type":"TextQuoteSelector","exact":"The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability","prefix":"lid inputs, abort cleanly, etc. ","suffix":"Much of present-day software acq"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:12:21.506Z","modified":"2026-11-10T13:12:21.506Z"}
> ```
> %%
> .
^l6116faqbyh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:956229ae-3fab-47c5-9eee-f7340c5c160e","type":"Annotation","motivation":"commenting","body":{"id":"#^ta0co6qjc6d","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42749,"end":43058},{"type":"TextQuoteSelector","exact":"Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.","prefix":" it for consistency and usability ","suffix":" Hence they cannot be fixed witho"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:07.455Z","modified":"2026-11-10T13:13:07.455Z"}
> ```
> %%
> https://agilemanifesto.org/authors.html
^ta0co6qjc6d


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:829e4639-2b70-42a3-a3f5-4d8a7a93dabc","type":"Annotation","motivation":"commenting","body":{"id":"#^ucs8dz59q1g","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43203,"end":43253},{"type":"TextQuoteSelector","exact":"Incremental development−grow, not build, software.","prefix":"tion of prototypes and products. ","suffix":" I still remember the jolt I fel"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:35.689Z","modified":"2026-11-10T13:13:35.689Z"}
> ```
> %%
> .
^ucs8dz59q1g


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:13b76122-3ec3-4638-a9d0-e71479a9035f","type":"Annotation","motivation":"commenting","body":{"id":"#^l87arq847gq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43687,"end":43736},{"type":"TextQuoteSelector","exact":"The building metaphor has outlived its usefulness","prefix":" of components, and scaffolding. ","suffix":". It is time to change again. If"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:56.542Z","modified":"2026-11-10T13:13:56.542Z"}
> ```
> %%
> .
^l87arq847gq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1217c77d-0f0e-47c2-9b5d-62a816b49cdb","type":"Annotation","motivation":"commenting","body":{"id":"#^h6tmealho1b","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45231,"end":45384},{"type":"TextQuoteSelector","exact":"Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.","prefix":"out of what is already there. 11 ","suffix":""},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:14:51.449Z","modified":"2026-11-10T13:14:51.449Z"}
> ```
> %%
> .
^h6tmealho1b


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:dfe83f3c-f17a-433c-905b-ac71bc76cc3d","type":"Annotation","motivation":"commenting","body":{"id":"#^z9rqoddbhek","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43975,"end":44305},{"type":"TextQuoteSelector","exact":"Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.","prefix":"e a radically different approach. ","suffix":"So it must be with our software "},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:15:41.748Z","modified":"2026-11-10T13:15:41.748Z"}
> ```
> %%
> .
^z9rqoddbhek


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e478d6d1-db04-46a3-8486-05bffe991284","type":"Annotation","motivation":"commenting","body":{"id":"#^pnvpwm0kfph","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45466,"end":45566},{"type":"TextQuoteSelector","exact":"The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.","prefix":"n software engineering (1986) 15 ","suffix":" Efforts redouble when the first"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:18:40.436Z","modified":"2026-11-10T13:18:40.436Z"}
> ```
> %%
> .
^pnvpwm0kfph


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d187d320-560c-415b-b436-b8a9d487c47e","type":"Annotation","motivation":"commenting","body":{"id":"#^659tbk1url4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46138,"end":46236},{"type":"TextQuoteSelector","exact":"Programmers are among the most intelligent part of the population, so they can learn good practice.","prefix":"design practices can be taught. ","suffix":" Thus a major thrust in the Unit"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:23:47.220Z","modified":"2026-11-10T13:23:47.220Z"}
> ```
> %%
> .
^659tbk1url4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d9034a33-272e-4b29-8d81-db598afffe94","type":"Annotation","motivation":"commenting","body":{"id":"#^u3tbp9k9laq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":48605,"end":48988},{"type":"TextQuoteSelector","exact":"My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.","prefix":" products will ultimately depend. ","suffix":"How to grow great designers? Spa"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:25:47.548Z","modified":"2026-11-10T13:25:47.548Z"}
> ```
> %%
> .
^u3tbp9k9laq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:92804baf-20f0-4947-882d-669d28a9c06f","type":"Annotation","motivation":"commenting","body":{"id":"#^obag3lnbk6","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49302,"end":49558},{"type":"TextQuoteSelector","exact":"Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.","prefix":", and keep a careful career file. ","suffix":"Provide opportunities for growin"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:26:47.607Z","modified":"2026-11-10T13:26:47.607Z"}
> ```
> %%
> .
^obag3lnbk6


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:439ba5df-3e0a-436c-902e-791e4184ffc9","type":"Annotation","motivation":"commenting","body":{"id":"#^839csn14pzu","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49558,"end":49644},{"type":"TextQuoteSelector","exact":"Provide opportunities for growing designers to interact with and stimulate each other.","prefix":"technical leadership assignments. ","suffix":"■"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:27:00.026Z","modified":"2026-11-10T13:27:00.026Z"}
> ```
> %%
> .
^839csn14pzu


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:fb08ed63-8f32-46c1-bdbe-314279d84d66","type":"Annotation","motivation":"commenting","body":{"id":"#^tx89o2dg9y","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47979,"end":48089},{"type":"TextQuoteSelector","exact":"Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.","prefix":"ways to grow great designers. 12 ","suffix":""},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:10.341Z","modified":"2026-11-10T13:27:10.341Z"}
> ```
> %%
> .
^tx89o2dg9y


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49a481c6-a08f-47ad-ae46-b74410638fb4","type":"Annotation","motivation":"commenting","body":{"id":"#^oxueoddlujp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46599,"end":46776},{"type":"TextQuoteSelector","exact":"Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.","prefix":"ext step upward in the same way. ","suffix":" Great designs come from great d"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:34.536Z","modified":"2026-11-10T13:27:34.536Z"}
> ```
> %%
> .
^oxueoddlujp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:59f2f1bc-c6b0-4383-947a-b451ed933f54","type":"Annotation","motivation":"commenting","body":{"id":"#^6jf16b2d9lw","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47176,"end":47256},{"type":"TextQuoteSelector","exact":"The differences between the great and the average approach an order of magnitude.","prefix":" and produced with less effort. ","suffix":"A little retrospection shows tha"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:44.860Z","modified":"2026-11-10T13:27:44.860Z"}
> ```
> %%
> .
^6jf16b2d9lw


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bca28b90-fea2-4a10-ae1e-e40f2956827f","type":"Annotation","motivation":"commenting","body":{"id":"#^gydte98pz3n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28690,"end":28836},{"type":"TextQuoteSelector","exact":"Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.","prefix":"n software engineering (1986) 10 ","suffix":" Some systems for integrating dif"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:35.458Z","modified":"2026-11-10T13:30:35.458Z"}
> ```
> %%
> .
^gydte98pz3n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:329038c3-6835-42bd-b960-d5e175b213d9","type":"Annotation","motivation":"commenting","body":{"id":"#^ojjhhp38yqd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":29055,"end":29355},{"type":"TextQuoteSelector","exact":"These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.","prefix":", and generated the programs. • • • • ","suffix":"It is hard to see how such techn"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:54.879Z","modified":"2026-11-10T13:30:54.879Z"}
> ```
> %%
> .
^ojjhhp38yqd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e60fcb9b-590c-4d15-990c-9734084c6aaa","type":"Annotation","motivation":"commenting","body":{"id":"#^sxlthsl8nr","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2665,"end":2738},{"type":"TextQuoteSelector","exact":"But, as we look to the horizon of a decade hence, we see no silver bullet","prefix":"ly as computer hardware costs do. ","suffix":". There is no single development,"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:08:41.636Z","modified":"2026-11-10T15:08:41.636Z"}
> ```
> %%
> I'm not certain about the range of 1986-1996, but I can at least safely say that we've safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I've seen ideas go from realization -> ideation -> implementation -> review -> release in a day's time.
>
> Of course, the claim I've seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).
>
> The way I've put it, colloquially, is that in a situation where you're at a physical assembly line and a machine in the middle speeds up by 1000%, you're not looking at a 1000% increase in productivity across the assembly line. You're looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren't moving fast enough, and that the review process has [[public/content/notes/natural-language-cve.md|largely caught on fire]].
^sxlthsl8nr


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8db4a429-d71b-4e14-9845-3d137e927183","type":"Annotation","motivation":"commenting","body":{"id":"#^5v8w05h0q8t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2817,"end":2927},{"type":"TextQuoteSelector","exact":"which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.","prefix":"nology or management technique, ","suffix":" In this chapter we shall try to"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:13:51.277Z","modified":"2026-11-10T15:13:51.277Z"}
> ```
> %%
> This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It's not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones -- time developing features, versus time developing fixes -- is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it's the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.
^5v8w05h0q8t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ff929a1-15ed-4ded-baa1-6359aaf4fbee","type":"Annotation","motivation":"commenting","body":{"id":"#^0vplvym3cbrg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":3065,"end":3261},{"type":"TextQuoteSelector","exact":"Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.","prefix":"perties of the bullets proposed. ","suffix":" A disciplined, consistent effor"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:14:47.358Z","modified":"2026-11-10T15:14:47.358Z"}
> ```
> %%
> I'll be ~~stealing~~ quoting "Skepticism is not pessimism" in my future apologetics around LLMs and agentic development.
^0vplvym3cbrg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:da59915a-d94b-4c44-87be-1a322812a2e8","type":"Annotation","motivation":"commenting","body":{"id":"#^kfxwncrsfe","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5782,"end":5874},{"type":"TextQuoteSelector","exact":"If this is true, building software will always be hard. There is inherently no silver bullet.","prefix":"in software engineering (1986) 3 ","suffix":"Let us consider the inherent pro"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-10T15:21:52.536Z","modified":"2026-11-10T21:18:39.988Z"}
> ```
> %%
> I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.
>
> To make sure I'm not discounting the point, though, I do think that it's worth softening it to "The essential part of software engineering is hard(er to optimize)", which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I've found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [[public/content/notes/software-gardening.mdx#Feedforward & Feedback|rapid and determinstic feedback]].
>
> What I've found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for... too many reasons to get into, here, but fundamentally comes down to the constraint that "write code faster" and "help humans understand code faster" are two very, *very* different engineering problems.
^kfxwncrsfe


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1b1ac91c-97bc-44f1-9c1b-a18711c4b653","type":"Annotation","motivation":"commenting","body":{"id":"#^wwj4u960f7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":10658,"end":11227},{"type":"TextQuoteSelector","exact":"All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.","prefix":" dampen the whim of the changers. ","suffix":"In short, the software product i"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-10T21:57:54.385Z","modified":"2026-11-10T21:57:54.385Z"}
> ```
> %%
> Gah -- this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn't mean the work to keep them runnable has (or will ever) end.
^wwj4u960f7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:2bf0a10d-edc3-44ad-8243-25a01a0cc974","type":"Annotation","motivation":"commenting","body":{"id":"#^ncf9kp5bnq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":11453,"end":11494},{"type":"TextQuoteSelector","exact":"Software is invisible and unvisualizable.","prefix":" software product. Invisibility. ","suffix":" Geometric abstractions are power"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-13T14:41:40.886Z","modified":"2026-11-13T14:41:40.886Z"}
> ```
> %%
> *Again* with the *absolutes* here, Brooks!
>
> I think "unvisualizable" concedes defeat before the fight has really started out. I'd once again summon up [[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces.md|boundary objects]]. My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.
>
> A [recent video about Britain's National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it's to get an immediate working knowledge of any issues worth addressing.
>
> I would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize -- not impossible. The analogy I'd pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some "most significant" visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:
>
> 1. Steps and catalog configurations themselves;
> 2. Storage mediums (S3, local system, etc.)
>
> Ultimately, it's just making sure you understand what a developer's necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.
^ncf9kp5bnq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7eea6caa-5a39-4be0-b2d3-d2c86073880e","type":"Annotation","motivation":"commenting","body":{"id":"#^kds1hgm51rl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2771,"end":2815},{"type":"TextQuoteSelector","exact":"in either technology or management technique","prefix":" There is no single development, ","suffix":", which by itself promises even o"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-13T15:13:22.608Z","modified":"2026-11-13T15:13:22.608Z"}
> ```
> %%
> *In a world **before** Agile...*
>
> All things considered, I'm glad to see management technique incorporated into an analysis of engineering optimization.
^kds1hgm51rl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0251a4b2-83e8-47ed-a8e4-342288bc141b","type":"Annotation","motivation":"commenting","body":{"id":"#^hfp5csllcv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21404,"end":21681},{"type":"TextQuoteSelector","exact":"Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.","prefix":"rified the terminological chaos: ","suffix":" In this approach human experts "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-13T17:35:31.514Z","modified":"2026-11-13T17:44:58.106Z"}
> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5e07b64b-9265-4544-82d2-6f1fda0a6f2f","type":"Annotation","motivation":"commenting","body":{"id":"#^9ozg40riczb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1007,"end":1149},{"type":"TextQuoteSelector","exact":"Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.","prefix":"l, as opposed to the essential? ","suffix":"Therefore it appears that the ti"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:40:29.215Z","modified":"2026-11-10T14:54:19.905Z"}
> ```
> %%
> I think that this premise hits a bit differently in 2026 than it did in 1986.
>
> First: even though Brooks is framing "Silver Bullet" as an order-of-magnitude improvement, this isn't necessarily a binary, true/false "anything less is useless": simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.
>
> In the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that's where the optimization question gets even more philosophical than Brooks puts it, here. I'm especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they're responsible for).
^9ozg40riczb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9595dd47-9bfc-471a-bc3a-d8505b39402a","type":"Annotation","motivation":"commenting","body":{"id":"#^vjg26uls6ae","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1502,"end":1531},{"type":"TextQuoteSelector","exact":"Growing software organically,","prefix":"tablishing software requirements. ","suffix":" adding more and more function t"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:42:14.954Z","modified":"2026-11-10T14:45:40.331Z"}
> ```
> %%
> I mean... [[public/content/notes/software-gardening.mdx|I can't *not* bring it up.]]
^vjg26uls6ae


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8c76221b-77ad-4955-b84b-663adf9a2372","type":"Annotation","motivation":"commenting","body":{"id":"#^tkmanyd0vh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4605,"end":4696},{"type":"TextQuoteSelector","exact":"he transformation of computer manufacture from an assembly industry into a process industry.","prefix":"ed costs. These gains flow from t","suffix":"Second, to see what rate of prog"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:45:52.475Z","modified":"2026-11-10T15:18:11.856Z"}
> ```
> %%
> It's important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.
>
> I think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.
^tkmanyd0vh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4687d939-3394-4435-bed2-837709f917fe","type":"Annotation","motivation":"commenting","body":{"id":"#^vyepyaspik","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4824,"end":4997},{"type":"TextQuoteSelector","exact":"I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.","prefix":"ficulties. Following Aristotle, ","suffix":"The accidents I discuss in the n"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:46:40.788Z","modified":"2026-11-10T15:19:30.218Z"}
> ```
> %%
> Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.
^vyepyaspik


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4d69f8b6-dea0-43f4-b681-7cdf20b1f5c3","type":"Annotation","motivation":"commenting","body":{"id":"#^x4uisgky7tj","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5394,"end":5701},{"type":"TextQuoteSelector","exact":"I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.","prefix":"hly precise and richly detailed. ","suffix":""},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:47:19.934Z","modified":"2026-11-10T15:21:04.436Z"}
> ```
> %%
> This is a massive issue that I broach in both the [[public/content/dead-math.md|Gherkin post]], as well as touching on my own experience trying to resurrect "dead" software, as defined in [[public/content/annotations/programming-as-theory-building.md|Programming as Theory Building]].
^x4uisgky7tj


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:86485653-2229-4361-906f-d5c781d08617","type":"Annotation","motivation":"commenting","body":{"id":"#^vqhlzf6jdks","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":6963,"end":7143},{"type":"TextQuoteSelector","exact":"The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.","prefix":"creases much more than linearly. ","suffix":" Mathematics and the physical sc"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:53:50.156Z","modified":"2026-11-10T21:26:25.550Z"}
> ```
> %%
> Brooks gets into this later, but... yeah. That also came up in the background research for CASE programs during [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]. It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [[public/tags/projects/flowthru|Flowthru]], for example, lends itself well to a visualization, but that's only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get... horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It's effectively be an orthogonal axis to the DAG, adding an additional dimensionality.
>
> Brooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.
^vqhlzf6jdks


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7a9e9ec1-7273-4fa6-bca9-c174b90d6009","type":"Annotation","motivation":"commenting","body":{"id":"#^pprm61om6t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":7801,"end":7959},{"type":"TextQuoteSelector","exact":"From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.","prefix":" cost overruns, schedule delays. ","suffix":" From the complexity of the func"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:59:49.692Z","modified":"2026-11-10T21:28:12.429Z"}
> ```
> %%
> [[public/content/dead-math#Why Proofs?|This section on formal verification and proofs]] talks about this a bit. Even the Red Team's research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today's technology, be out of the realm of possibility.
^pprm61om6t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ecff3bf-adc9-437a-a6c6-ba36d1ae4472","type":"Annotation","motivation":"commenting","body":{"id":"#^f7geh76bbjl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":8513,"end":8613},{"type":"TextQuoteSelector","exact":"It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.","prefix":"and control all the loose ends. ","suffix":"Conformity. Software people are "},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:08.322Z","modified":"2026-11-10T21:34:52.015Z"}
> ```
> %%
> This is *exactly* what [[public/content/annotations/programming-as-theory-building#^7ppb5sf3ycw|Naur talks about]]. Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.
>
> This is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don't fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.
^f7geh76bbjl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b910316c-2896-484d-a3ad-83793f911e24","type":"Annotation","motivation":"commenting","body":{"id":"#^ulc2nm1bo4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9029,"end":9185},{"type":"TextQuoteSelector","exact":"No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human","prefix":" is not capricious or arbitrary. ","suffix":""},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:53.203Z","modified":"2026-11-10T21:36:26.044Z"}
> ```
> %%
> I do feel this one deeply. As part of my [[public/tags/projects/dayjob|dayjob]], I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.
^ulc2nm1bo4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:847428ca-9bdc-4ebf-85eb-d0e867be13c2","type":"Annotation","motivation":"commenting","body":{"id":"#^v9h1tk6pcnb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9493,"end":9800},{"type":"TextQuoteSelector","exact":"In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.","prefix":"rent people, rather than by God. ","suffix":"Changeability. The software enti"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T20:05:36.052Z","modified":"2026-11-10T21:52:38.256Z"}
> ```
> %%
> I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they'll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.
>
> Conversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* -- that is to say, I can make decisions autonomously without much fear that I'll, say, lose business or alienate anyone.
>
> Software, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:
>
> - Z is for patches (small fixes that don't modify functionality
> - Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won't break any users' switching
> - X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.
>
> It's not unusual to see early software go through many breaking changes while it's a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).
^v9h1tk6pcnb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f7a2e78f-2e1f-45a2-8eb8-e479ad97fd1f","type":"Annotation","motivation":"commenting","body":{"id":"#^732yguy522u","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":12130,"end":12231},{"type":"TextQuoteSelector","exact":"we find it to constitute not one, but several, general directed graphs, superimposed one upon another.","prefix":"t to diagram software structure, ","suffix":" The several graphs may represen"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T22:08:42.822Z","modified":"2026-11-07T22:08:42.822Z"}
> ```
> %%
> .
^732yguy522u


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7c70a2dd-121a-4181-b1f1-cf690b8972c8","type":"Annotation","motivation":"commenting","body":{"id":"#^hd9oddco1o7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15479,"end":15601},{"type":"TextQuoteSelector","exact":"arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.","prefix":" going on in a complex system. 2 P","suffix":""},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:09:36.128Z","modified":"2026-11-13T15:44:07.672Z"}
> ```
> %%
> [Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)
^hd9oddco1o7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1fcbe46a-9374-48c7-b7e2-af2277b7188e","type":"Annotation","motivation":"commenting","body":{"id":"#^sasqm0mbvyd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":13331,"end":13671},{"type":"TextQuoteSelector","exact":"High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.","prefix":"trapolation of each such attack. ","suffix":"What does a high-level language "},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:10:18.916Z","modified":"2026-11-13T14:50:20.099Z"}
> ```
> %%
> While this is definitely the case, I'd say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can't be effectively linted becomes harder to scale against than is offset by their ease of use.
>
> This is specifically around non-prototyping. That's worth distinguishing.
^sasqm0mbvyd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6d4682fb-d70b-4906-9e20-6bc55a832c74","type":"Annotation","motivation":"commenting","body":{"id":"#^57h8rfdym18","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14563,"end":14746},{"type":"TextQuoteSelector","exact":"Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.","prefix":"r to the sophistication of users. ","suffix":"Time-sharing. Most observers cre"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:11:16.771Z","modified":"2026-11-13T15:02:22.480Z"}
> ```
> %%
> Ah, yeah -- this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall -- I haven't read the book since college) talks about the idea of "good abstractions" and "bad abstractions".
>
> It can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the "rules" require carve-outs, which is a slippery slope towards having no rules at all.
>
> Frameworks also have the same... I won't call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it's necessary to understand that there truly is no "silver bullet" among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* -- but there truly is no "everything" framework.
^57h8rfdym18


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3f255411-7368-4881-b687-277d9cd7a940","type":"Annotation","motivation":"commenting","body":{"id":"#^eicluc87x9t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15876,"end":16080},{"type":"TextQuoteSelector","exact":"The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.","prefix":"of time-sharing derive directly. ","suffix":"Unified programming environments"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-07T22:31:01.338Z","modified":"2026-11-13T15:53:47.240Z"}
> ```
> %%
> The idea of shortening system response time is *so underrated* -- and far harder than Brooks makes it out to be. I talk about this a lot in both [[public/content/notes/software-gardening.mdx|Software Gardening]] and its precursor, [[public/content/notes/hostage-negotiations|Hostage Negotiations]]: rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.
>
> A lot of my attitude on immediate feedback was borne from my time doing [[public/content/articles/structured-streaming.md|data pipelines on Databricks/PySpark]]. That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.
^eicluc87x9t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:82d926aa-2f7d-4c4b-b3ba-5f600e9938c1","type":"Annotation","motivation":"commenting","body":{"id":"#^bfauk520glo","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15101,"end":15476},{"type":"TextQuoteSelector","exact":"The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.","prefix":"tain an overview of complexity. ","suffix":"2 Parnas, D.L., “Designing softw"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:31:59.691Z","modified":"2026-11-13T15:43:14.400Z"}
> ```
> %%
> Thinking about this in terms of 1986 versus 2026, batch programming feels more like a "push" in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)
^bfauk520glo


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0a5a63da-439e-41f3-9790-8cc03a8c4d6c","type":"Annotation","motivation":"commenting","body":{"id":"#^yfp6g5ihhb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21051,"end":21249},{"type":"TextQuoteSelector","exact":"Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4","prefix":"g a program product. I doubt it. ","suffix":" I do not. To see why, we must d"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:32:40.645Z","modified":"2026-11-17T15:52:23.000Z"}
> ```
> %%
> This bit of the paper feels *prescient* when you read it out of context, but it's so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn't pan out then, but here we are now.
^yfp6g5ihhb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b3d43a2e-ab25-405d-a932-ed1c2a033fd8","type":"Annotation","motivation":"commenting","body":{"id":"#^8kwbn6w8ess","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22004,"end":22124},{"type":"TextQuoteSelector","exact":"Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).","prefix":"alif.: Benjamin Cummings, 1983. 4 ","suffix":""},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:33:03.124Z","modified":"2026-11-17T15:53:04.612Z"}
> ```
> %%
> [Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)
^8kwbn6w8ess


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:234b7bdf-0b07-4270-a94f-a7b060bd9cb6","type":"Annotation","motivation":"commenting","body":{"id":"#^m2tflg196ud","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14746,"end":14759},{"type":"TextQuoteSelector","exact":"Time-sharing.","prefix":"ely uses the esoteric constructs. ","suffix":" Most observers credit time-shar"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-09T17:04:41.771Z","modified":"2026-11-13T15:36:10.363Z"}
> ```
> %%
> This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today's dollars).
>
> As such, companies typically couldn't buy all that many computers. On top of that, early computers weren't multi-user: that is to say, you couldn't have multiple users "logged in", using the company's one computer, at once. That's what "batch programming" was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.
>
> (This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by "time sharing").
>
> Despite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of "context switching" -- having to interrupt your train of thought by multitasking (say, programming while also responding to pings).
^m2tflg196ud


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:eb1aa5af-1a36-414f-840c-99d86c8a3ba4","type":"Annotation","motivation":"commenting","body":{"id":"#^6w73od68aa3","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":16276,"end":16555},{"type":"TextQuoteSelector","exact":"They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.","prefix":"tivity by integral factors. Why? ","suffix":"This breakthrough in turn stimul"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-09T17:05:19.840Z","modified":"2026-11-13T16:16:33.678Z"}
> ```
> %%
> I haven't got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.
>
> (To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).
>
> The only thing I'd add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it's important to note that the vast majority of most powerful tools available to developers work against plaintext. There's no way, for example, to `grep` a Word document.
>
> A minor part of the reason I've [[public/content/dead-math.md|latched onto Gherkin]] is because it brings aspects of project management and ownership into plaintext. Once it's in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.
^6w73od68aa3


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:61f123e4-d7b2-4dc0-aa45-087b6bc1f556","type":"Annotation","motivation":"commenting","body":{"id":"#^byc7wdtnz3o","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19107,"end":19231},{"type":"TextQuoteSelector","exact":"Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.","prefix":" the cause of the improvements. ","suffix":"Object-oriented programming. Man"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:24.528Z","modified":"2026-11-13T16:26:40.158Z"}
> ```
> %%
> Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.
>
> In the same way I doubt that [[public/content/notes/pattern-languages-of-the-neighborhood|A Pattern Language]] could've been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.
^byc7wdtnz3o


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7b97e683-9106-4b7d-87fd-c0065b37ee25","type":"Annotation","motivation":"commenting","body":{"id":"#^ankq3ql47lk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19231,"end":19405},{"type":"TextQuoteSelector","exact":"Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.","prefix":"odern software design techniques. ","suffix":" Mark Sherman of Dartmouth notes"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:46.934Z","modified":"2026-11-13T16:28:48.336Z"}
> ```
> %%
> We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I've already cited to the practice, I'd refer to previous annotations on OOP's importance.
^ankq3ql47lk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:c2320176-e5d6-46c5-9cd2-e379a5fc910a","type":"Annotation","motivation":"commenting","body":{"id":"#^n5q9tyhtdgg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":20557,"end":20778},{"type":"TextQuoteSelector","exact":"Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that","prefix":"gher-order expression of design. ","suffix":". An order-of-magnitude gain can "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:08:50.891Z","modified":"2026-11-17T14:39:55.654Z"}
> ```
> %%
> I'd once again disagree with this, but it's nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.
>
> This is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of "cutting off fat" versus "cutting into muscle". To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.
^n5q9tyhtdgg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:18e57bab-231a-4f16-a5b6-aec2fc1c0105","type":"Annotation","motivation":"commenting","body":{"id":"#^kuymwz1me2","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22649,"end":22816},{"type":"TextQuoteSelector","exact":"The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.","prefix":" completely with this critique. ","suffix":" I have a hard time seeing how i"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:10:21.719Z","modified":"2026-11-17T22:23:03.184Z"}
> ```
> %%
> Another thing that definitely [didn't age as well](https://en.wikipedia.org/wiki/Transformer_(deep_learning)).
>
> A really good book on how the history of this approach flipped from "expert-designed expert systems" to "throw as much data as humanly possible to train on" is [*The Worlds I See*](https://www.amazon.com/Worlds-See-Curiosity-Exploration-Discovery/dp/1250897939) by [Dr. Fei-Fei Li](https://en.wikipedia.org/wiki/Fei-Fei_Li), who famously put together the [ImageNet](https://en.wikipedia.org/wiki/ImageNet) dataset. It was the performance of [AlexNet](https://en.wikipedia.org/wiki/AlexNet) on the ImageNet competition that kinda kicked off this whole deep-learning, neural-networking, [transformers-are-all-you-need](https://arxiv.org/pdf/1706.03762) era of computing.
^kuymwz1me2


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:882d3841-9285-4e1a-aba0-05b8afd9c006","type":"Annotation","motivation":"commenting","body":{"id":"#^5moqmvedmzn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":23484,"end":23813},{"type":"TextQuoteSelector","exact":"An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.","prefix":"ept, and what are the prospects? ","suffix":" The inference engines typically "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:11:30.693Z","modified":"2026-11-17T22:58:01.062Z"}
> ```
> %%
> I may end up re-reading the section(s) of Dr. Li's book regarding expert systems, because this is... vaguely reminiscent of the inference mechanism of LLMs, but not quite. Infamously, LLMs can struggle with justifying decisions only after-the-fact, not preserving prior reasoning sessions in future context for the sake of not cluttering up the context.
>
> I would be curious if there *is* any mechanism used by popular harnesses, by which LLMs can directly reference prior reasoning rounds as though they're data rather than conversational context. That doesn't seem like a particularly novel idea, so if it *hasn't* been done, so if it hasn't, I wonder if that's related to a general understanding that [judging LLMs based on their train-of-thought is a dangerous practice](https://cdn.openai.com/pdf/34f2ada6-870f-4c26-9790-fd8def56387f/CoT_Monitoring.pdf) (with a fantastic [explainer video](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) to boot).
^5moqmvedmzn



> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ed9f3060-9a8a-4f3a-88d3-369cff38e9fe","type":"Annotation","motivation":"commenting","body":{"id":"#^ivjyf74mo9k","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24530,"end":24725},{"type":"TextQuoteSelector","exact":"Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.","prefix":"lexity of the application itself. ","suffix":" I believe the most important ad"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:13:09.107Z","modified":"2026-11-17T23:01:50.654Z"}
> ```
> %%
> In trying to find the correct reference for this citation, I believe I've found the correct Feigenbaum reference: [Knowledge Engineering: The Applied Side of Artificial Intelligence](https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf) (1980)
>
> This is also uncanny, considering the later recognition that certain deep learning techniques absolutely thrive with more and more data added to them.
^ivjyf74mo9k


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f1c09573-6c20-4f86-95b2-546dbbe45740","type":"Annotation","motivation":"commenting","body":{"id":"#^ncwm3eztdnk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24063,"end":24168},{"type":"TextQuoteSelector","exact":"Inference engine technology is developed in an application-independent way, and then applied to many uses.","prefix":"olutions to the same problems: • • ","suffix":" One can justify much more effor"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:20.346Z","modified":"2026-11-09T17:14:20.346Z"}
> ```
> %%
> .
^ncwm3eztdnk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0dfcb236-3820-4f20-bb49-a2b32663fd8a","type":"Annotation","motivation":"commenting","body":{"id":"#^g7ibzwd9qgt","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24268,"end":24530},{"type":"TextQuoteSelector","exact":"The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.","prefix":"hat technology is well advanced. ","suffix":"Edward Feigenbaum says that the "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:42.756Z","modified":"2026-11-09T17:14:42.756Z"}
> ```
> %%
> .
^g7ibzwd9qgt


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:75d191ab-463b-4c0f-8948-ac0fd09a99ce","type":"Annotation","motivation":"commenting","body":{"id":"#^7ndmgqf1q0j","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27236,"end":27306},{"type":"TextQuoteSelector","exact":"finding articulate, self-analytical experts who know why they do things","prefix":"d task of knowledge acquisition: ","suffix":"; and developing efficient techn"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:03.601Z","modified":"2026-11-09T17:17:03.601Z"}
> ```
> %%
> .
^7ndmgqf1q0j


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:17283a8d-6906-4672-ab64-e961b71715cf","type":"Annotation","motivation":"commenting","body":{"id":"#^6k5uzuuz5sv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":26662,"end":26718},{"type":"TextQuoteSelector","exact":"helping in lifelong maintenance and modification testing","prefix":" bring-up test cases, as well as ","suffix":". In the same way, we can postula"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:14.951Z","modified":"2026-11-09T17:17:14.951Z"}
> ```
> %%
> .
^6k5uzuuz5sv


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:291a0078-2264-4c2b-a03b-98de1e94aa93","type":"Annotation","motivation":"commenting","body":{"id":"#^mj864yumg2m","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27485,"end":27900},{"type":"TextQuoteSelector","exact":"The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.","prefix":"pert system is to have an expert. ","suffix":"“Automatic” programming. For alm"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:59.432Z","modified":"2026-11-09T17:17:59.432Z"}
> ```
> %%
> .
^mj864yumg2m


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ecd17a28-ec80-4edc-a1e6-f1591ccb67eb","type":"Annotation","motivation":"commenting","body":{"id":"#^dtcc5xnitnn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27925,"end":27944},{"type":"TextQuoteSelector","exact":"For almost 40 years","prefix":"ortant. “Automatic” programming. ","suffix":", people have been anticipating "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:18:26.339Z","modified":"2026-11-09T17:18:26.339Z"}
> ```
> %%
> .
^dtcc5xnitnn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d342ac9e-1f65-4dbb-8348-7eb0f1583899","type":"Annotation","motivation":"commenting","body":{"id":"#^uo0il5xnmjc","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28445,"end":28566},{"type":"TextQuoteSelector","exact":"He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.","prefix":"ly available to the programmer.8 ","suffix":"7 Mostow, op. cit. 8 Parnas, 1985"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:05.692Z","modified":"2026-11-09T17:19:05.692Z"}
> ```
> %%
> .
^uo0il5xnmjc


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4c9cd456-e0dd-4164-804d-1334f3faee82","type":"Annotation","motivation":"commenting","body":{"id":"#^kc305035ym","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28294,"end":28444},{"type":"TextQuoteSelector","exact":"n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.","prefix":"ot semantic content, asserting, I","suffix":"8 He argues, in essence, that in "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:16.915Z","modified":"2026-11-09T17:19:16.915Z"}
> ```
> %%
> .
^kc305035ym


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6225a18b-f7db-42e4-9f2e-6cc3ead88ad6","type":"Annotation","motivation":"commenting","body":{"id":"#^5s993cluoig","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30469,"end":30707},{"type":"TextQuoteSelector","exact":"In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.","prefix":"age for their proposed computer. ","suffix":"Second, the screens of today are"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:05.656Z","modified":"2026-11-09T17:21:05.656Z"}
> ```
> %%
> .
^5s993cluoig


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7fd04683-32ad-46d1-b267-5454e18a31a6","type":"Annotation","motivation":"commenting","body":{"id":"#^d97hq9ydw9c","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30195,"end":30306},{"type":"TextQuoteSelector","exact":"In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.","prefix":"I am persuaded that nothing will. ","suffix":"10 Indeed, it is best viewed as "},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:35.053Z","modified":"2026-11-09T17:21:35.053Z"}
> ```
> %%
> .
^d97hq9ydw9c


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d3c7cb2f-a6fa-40f3-911b-e44cc1939ddc","type":"Annotation","motivation":"commenting","body":{"id":"#^h5pgqb65qp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30707,"end":30844},{"type":"TextQuoteSelector","exact":"Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.","prefix":"ting the programs they describe. ","suffix":" The so-called “desktop metaphor"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:20.909Z","modified":"2026-11-09T17:22:20.909Z"}
> ```
> %%
> .
^h5pgqb65qp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bee19112-967e-484a-9103-73c467686702","type":"Annotation","motivation":"commenting","body":{"id":"#^xhvbeuk4i8n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31185,"end":31330},{"type":"TextQuoteSelector","exact":"Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.","prefix":"dom access to a score of pages. ","suffix":" The hardware technology will ha"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:40.869Z","modified":"2026-11-09T17:22:40.869Z"}
> ```
> %%
> .
^xhvbeuk4i8n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:089a9a54-a99c-4a3c-9193-aba42a91c987","type":"Annotation","motivation":"commenting","body":{"id":"#^1c5nprutkln","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31689,"end":31764},{"type":"TextQuoteSelector","exact":"we feel only one dimension of the intricately interlocked software elephant.","prefix":"l data structures, or whatever, ","suffix":" If we superimpose all the diagr"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:23:04.978Z","modified":"2026-11-09T17:23:04.978Z"}
> ```
> %%
> .
^1c5nprutkln


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0c450070-9a2d-4903-81b2-2ca1328f4186","type":"Annotation","motivation":"commenting","body":{"id":"#^u6tcgt70nrb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":32771,"end":33094},{"type":"TextQuoteSelector","exact":"I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.","prefix":"o implementing and testing them? ","suffix":"Program verification does not me"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:23:52.738Z","modified":"2026-11-09T17:23:52.738Z"}
> ```
> %%
> .
^u6tcgt70nrb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5b5057f6-6744-4c40-ae17-1a41e1bfbc35","type":"Annotation","motivation":"commenting","body":{"id":"#^fscfpc13l9","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33182,"end":33307},{"type":"TextQuoteSelector","exact":"Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.","prefix":" There is no magic here, either. ","suffix":"More seriously, even perfect pro"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:10.898Z","modified":"2026-11-09T17:24:10.898Z"}
> ```
> %%
> .
^fscfpc13l9


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1faa853b-a3a1-4f33-9e04-157741942330","type":"Annotation","motivation":"commenting","body":{"id":"#^rrk5d1x6wpg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33415,"end":33599},{"type":"TextQuoteSelector","exact":"The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.","prefix":"program meets its specification. ","suffix":"Environments and tools. How much"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:37.405Z","modified":"2026-11-09T17:24:37.405Z"}
> ```
> %%
> .
^rrk5d1x6wpg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5461e192-2399-4286-8ca7-40924730b637","type":"Annotation","motivation":"commenting","body":{"id":"#^sknnl8ow6i","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34108,"end":34388},{"type":"TextQuoteSelector","exact":"Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.","prefix":"rors and simple semantic errors. ","suffix":"Surely this work is worthwhile, "},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:13.535Z","modified":"2026-11-09T17:26:13.535Z"}
> ```
> %%
> .
^sknnl8ow6i


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:a9713bcc-7585-419e-b77d-1570a8eabce5","type":"Annotation","motivation":"commenting","body":{"id":"#^u5nri1m37df","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34854,"end":35028},{"type":"TextQuoteSelector","exact":"Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.","prefix":"ly supported by today’s speeds. ","suffix":"More powerful workstations we su"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:56.266Z","modified":"2026-11-09T17:26:56.266Z"}
> ```
> %%
> .
^u5nri1m37df


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b0695f58-7058-4708-8405-0a624690e9f7","type":"Annotation","motivation":"commenting","body":{"id":"#^ywdgnn4xef","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36066,"end":36174},{"type":"TextQuoteSelector","exact":"Buy versus build. The most radical possible solution for constructing software is not to construct it at all.","prefix":"some of these are very promising. ","suffix":"Every day this becomes easier, a"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:28:23.167Z","modified":"2026-11-09T17:28:23.167Z"}
> ```
> %%
> .
^ywdgnn4xef


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4be450d5-a1d5-4161-a894-c4cd1b8d40c8","type":"Annotation","motivation":"commenting","body":{"id":"#^qpqgplaxida","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35661,"end":35879},{"type":"TextQuoteSelector","exact":"If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.","prefix":"task = ∑ (Frequency) i x (Time) i ","suffix":"Hence we must consider those att"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:18.921Z","modified":"2026-11-09T17:29:18.921Z"}
> ```
> %%
> .
^qpqgplaxida


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:85b9a27a-8a42-4f48-8686-4a70d5a75465","type":"Annotation","motivation":"commenting","body":{"id":"#^46ecwt2iwel","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35908,"end":36020},{"type":"TextQuoteSelector","exact":"attacks that address the essence of the software problem, the formulation of these complex conceptual structures.","prefix":"ns. Hence we must consider those ","suffix":" Fortunately, some of these are v"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:28.380Z","modified":"2026-11-09T17:29:28.380Z"}
> ```
> %%
> .
^46ecwt2iwel


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44e54adc-74c5-437d-a971-b0cd79fcd03a","type":"Annotation","motivation":"commenting","body":{"id":"#^fh6d7a9q5mb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36377,"end":36466},{"type":"TextQuoteSelector","exact":"he personal computer revolution has created not one, but m any, mass markets for software.","prefix":"red on production methodology, t","suffix":" Every newsstand carried monthly "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:30:05.442Z","modified":"2026-11-09T17:30:05.442Z"}
> ```
> %%
> .
^fh6d7a9q5mb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:192ce430-c602-438a-a1a1-604cc509643b","type":"Annotation","motivation":"commenting","body":{"id":"#^8jv1h13fwqn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36858,"end":36913},{"type":"TextQuoteSelector","exact":"Any such product is cheaper to buy than to build afresh","prefix":"ket place for individual modules. ","suffix":". Even at a cost of $100,000, a p"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:31:42.594Z","modified":"2026-11-09T17:31:42.594Z"}
> ```
> %%
> .
^8jv1h13fwqn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e630617a-a237-4c6d-8f4d-f774127d141b","type":"Annotation","motivation":"commenting","body":{"id":"#^r48k3wopfxp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37279,"end":37461},{"type":"TextQuoteSelector","exact":"The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.","prefix":"ntained than homegrown software. ","suffix":" Sharing that cost among even a "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:33:14.699Z","modified":"2026-11-10T15:36:42.169Z"}
> ```
> %%
> On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it's basically the cost of pushing a distributable up to a server, and the cost of you downloading it.
>
> Netflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It's very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.
^r48k3wopfxp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:966aeb51-dea1-44dc-aea1-b0aed3360482","type":"Annotation","motivation":"commenting","body":{"id":"#^tic5hg7ofof","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37953,"end":38127},{"type":"TextQuoteSelector","exact":"users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.","prefix":"s, study after study showed that ","suffix":" During the 1980s, we find such "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:34:13.206Z","modified":"2026-11-09T17:34:13.206Z"}
> ```
> %%
> .
^tic5hg7ofof


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44fd7e54-9599-4253-8284-1411356d656f","type":"Annotation","motivation":"commenting","body":{"id":"#^y1gz1ngkwvm","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":38576,"end":39112},{"type":"TextQuoteSelector","exact":"The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.","prefix":"cated than those of 20 years ago. ","suffix":"There are dramatic exceptions to"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:12.688Z","modified":"2026-11-10T13:09:12.688Z"}
> ```
> %%
> .
^y1gz1ngkwvm


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:24df9bb7-b2ae-426b-a407-c973e704610f","type":"Annotation","motivation":"commenting","body":{"id":"#^z8uqeaqsds","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":39672,"end":39926},{"type":"TextQuoteSelector","exact":"Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.","prefix":"routinely done with these tools. ","suffix":"I believe the single most powerf"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:47.965Z","modified":"2026-11-10T13:09:47.965Z"}
> ```
> %%
> .
^z8uqeaqsds


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bfd257bc-26f1-436f-a280-f794f789179d","type":"Annotation","motivation":"commenting","body":{"id":"#^zm63kpzvr2q","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40204,"end":40313},{"type":"TextQuoteSelector","exact":"The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.","prefix":"t programs, and turn them loose. ","suffix":"Requirements refinement and rapi"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:54.490Z","modified":"2026-11-10T13:09:54.490Z"}
> ```
> %%
> .
^zm63kpzvr2q


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:590bd3a0-1dd1-4b3a-9323-542ba0ee6a30","type":"Annotation","motivation":"commenting","body":{"id":"#^14gm56fc3zwd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40313,"end":40449},{"type":"TextQuoteSelector","exact":"Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.","prefix":"ndreds of laboratory scientists. ","suffix":" No other part of the conceptual"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:08.183Z","modified":"2026-11-10T13:10:08.183Z"}
> ```
> %%
> .
^14gm56fc3zwd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49b68af2-7d89-4885-80f2-77290bb19a93","type":"Annotation","motivation":"commenting","body":{"id":"#^spwoqgulnam","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40912,"end":40968},{"type":"TextQuoteSelector","exact":"For the truth is, the clients do not know what they want.","prefix":"nt of the product requirements. ","suffix":" They usually do not know what q"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:43.052Z","modified":"2026-11-10T13:10:43.052Z"}
> ```
> %%
> .
^spwoqgulnam


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e5263b5a-92e4-4549-8748-4c0fb87c98a0","type":"Annotation","motivation":"commenting","body":{"id":"#^eikgl68ua48","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41113,"end":41244},{"type":"TextQuoteSelector","exact":"Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.","prefix":"e detail that must be specified. ","suffix":" Clients never want exactly that."},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:54.746Z","modified":"2026-11-10T13:10:54.746Z"}
> ```
> %%
> .
^eikgl68ua48


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:720b9302-bf82-4450-be48-6c58ed41d5cb","type":"Annotation","motivation":"commenting","body":{"id":"#^k3d5e5ivcdq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41561,"end":41860},{"type":"TextQuoteSelector","exact":"I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.","prefix":"s part of the system definition. ","suffix":""},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:11:26.033Z","modified":"2026-11-10T13:11:26.033Z"}
> ```
> %%
> .
^k3d5e5ivcdq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7e32bc36-484d-406a-90ce-077f70e46cae","type":"Annotation","motivation":"commenting","body":{"id":"#^l6116faqbyh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42610,"end":42749},{"type":"TextQuoteSelector","exact":"The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability","prefix":"lid inputs, abort cleanly, etc. ","suffix":"Much of present-day software acq"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:12:21.506Z","modified":"2026-11-10T13:12:21.506Z"}
> ```
> %%
> .
^l6116faqbyh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:956229ae-3fab-47c5-9eee-f7340c5c160e","type":"Annotation","motivation":"commenting","body":{"id":"#^ta0co6qjc6d","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42749,"end":43058},{"type":"TextQuoteSelector","exact":"Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.","prefix":" it for consistency and usability ","suffix":" Hence they cannot be fixed witho"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:07.455Z","modified":"2026-11-10T13:13:07.455Z"}
> ```
> %%
> https://agilemanifesto.org/authors.html
^ta0co6qjc6d


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:829e4639-2b70-42a3-a3f5-4d8a7a93dabc","type":"Annotation","motivation":"commenting","body":{"id":"#^ucs8dz59q1g","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43203,"end":43253},{"type":"TextQuoteSelector","exact":"Incremental development−grow, not build, software.","prefix":"tion of prototypes and products. ","suffix":" I still remember the jolt I fel"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:35.689Z","modified":"2026-11-10T13:13:35.689Z"}
> ```
> %%
> .
^ucs8dz59q1g


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:13b76122-3ec3-4638-a9d0-e71479a9035f","type":"Annotation","motivation":"commenting","body":{"id":"#^l87arq847gq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43687,"end":43736},{"type":"TextQuoteSelector","exact":"The building metaphor has outlived its usefulness","prefix":" of components, and scaffolding. ","suffix":". It is time to change again. If"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:56.542Z","modified":"2026-11-10T13:13:56.542Z"}
> ```
> %%
> .
^l87arq847gq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1217c77d-0f0e-47c2-9b5d-62a816b49cdb","type":"Annotation","motivation":"commenting","body":{"id":"#^h6tmealho1b","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45231,"end":45384},{"type":"TextQuoteSelector","exact":"Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.","prefix":"out of what is already there. 11 ","suffix":""},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:14:51.449Z","modified":"2026-11-10T13:14:51.449Z"}
> ```
> %%
> .
^h6tmealho1b


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:dfe83f3c-f17a-433c-905b-ac71bc76cc3d","type":"Annotation","motivation":"commenting","body":{"id":"#^z9rqoddbhek","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43975,"end":44305},{"type":"TextQuoteSelector","exact":"Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.","prefix":"e a radically different approach. ","suffix":"So it must be with our software "},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:15:41.748Z","modified":"2026-11-10T13:15:41.748Z"}
> ```
> %%
> .
^z9rqoddbhek


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e478d6d1-db04-46a3-8486-05bffe991284","type":"Annotation","motivation":"commenting","body":{"id":"#^pnvpwm0kfph","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45466,"end":45566},{"type":"TextQuoteSelector","exact":"The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.","prefix":"n software engineering (1986) 15 ","suffix":" Efforts redouble when the first"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:18:40.436Z","modified":"2026-11-10T13:18:40.436Z"}
> ```
> %%
> .
^pnvpwm0kfph


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d187d320-560c-415b-b436-b8a9d487c47e","type":"Annotation","motivation":"commenting","body":{"id":"#^659tbk1url4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46138,"end":46236},{"type":"TextQuoteSelector","exact":"Programmers are among the most intelligent part of the population, so they can learn good practice.","prefix":"design practices can be taught. ","suffix":" Thus a major thrust in the Unit"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:23:47.220Z","modified":"2026-11-10T13:23:47.220Z"}
> ```
> %%
> .
^659tbk1url4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d9034a33-272e-4b29-8d81-db598afffe94","type":"Annotation","motivation":"commenting","body":{"id":"#^u3tbp9k9laq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":48605,"end":48988},{"type":"TextQuoteSelector","exact":"My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.","prefix":" products will ultimately depend. ","suffix":"How to grow great designers? Spa"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:25:47.548Z","modified":"2026-11-10T13:25:47.548Z"}
> ```
> %%
> .
^u3tbp9k9laq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:92804baf-20f0-4947-882d-669d28a9c06f","type":"Annotation","motivation":"commenting","body":{"id":"#^obag3lnbk6","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49302,"end":49558},{"type":"TextQuoteSelector","exact":"Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.","prefix":", and keep a careful career file. ","suffix":"Provide opportunities for growin"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:26:47.607Z","modified":"2026-11-10T13:26:47.607Z"}
> ```
> %%
> .
^obag3lnbk6


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:439ba5df-3e0a-436c-902e-791e4184ffc9","type":"Annotation","motivation":"commenting","body":{"id":"#^839csn14pzu","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49558,"end":49644},{"type":"TextQuoteSelector","exact":"Provide opportunities for growing designers to interact with and stimulate each other.","prefix":"technical leadership assignments. ","suffix":"■"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:27:00.026Z","modified":"2026-11-10T13:27:00.026Z"}
> ```
> %%
> .
^839csn14pzu


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:fb08ed63-8f32-46c1-bdbe-314279d84d66","type":"Annotation","motivation":"commenting","body":{"id":"#^tx89o2dg9y","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47979,"end":48089},{"type":"TextQuoteSelector","exact":"Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.","prefix":"ways to grow great designers. 12 ","suffix":""},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:10.341Z","modified":"2026-11-10T13:27:10.341Z"}
> ```
> %%
> .
^tx89o2dg9y


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49a481c6-a08f-47ad-ae46-b74410638fb4","type":"Annotation","motivation":"commenting","body":{"id":"#^oxueoddlujp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46599,"end":46776},{"type":"TextQuoteSelector","exact":"Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.","prefix":"ext step upward in the same way. ","suffix":" Great designs come from great d"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:34.536Z","modified":"2026-11-10T13:27:34.536Z"}
> ```
> %%
> .
^oxueoddlujp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:59f2f1bc-c6b0-4383-947a-b451ed933f54","type":"Annotation","motivation":"commenting","body":{"id":"#^6jf16b2d9lw","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47176,"end":47256},{"type":"TextQuoteSelector","exact":"The differences between the great and the average approach an order of magnitude.","prefix":" and produced with less effort. ","suffix":"A little retrospection shows tha"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:44.860Z","modified":"2026-11-10T13:27:44.860Z"}
> ```
> %%
> .
^6jf16b2d9lw


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bca28b90-fea2-4a10-ae1e-e40f2956827f","type":"Annotation","motivation":"commenting","body":{"id":"#^gydte98pz3n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28690,"end":28836},{"type":"TextQuoteSelector","exact":"Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.","prefix":"n software engineering (1986) 10 ","suffix":" Some systems for integrating dif"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:35.458Z","modified":"2026-11-10T13:30:35.458Z"}
> ```
> %%
> .
^gydte98pz3n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:329038c3-6835-42bd-b960-d5e175b213d9","type":"Annotation","motivation":"commenting","body":{"id":"#^ojjhhp38yqd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":29055,"end":29355},{"type":"TextQuoteSelector","exact":"These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.","prefix":", and generated the programs. • • • • ","suffix":"It is hard to see how such techn"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:54.879Z","modified":"2026-11-10T13:30:54.879Z"}
> ```
> %%
> .
^ojjhhp38yqd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e60fcb9b-590c-4d15-990c-9734084c6aaa","type":"Annotation","motivation":"commenting","body":{"id":"#^sxlthsl8nr","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2665,"end":2738},{"type":"TextQuoteSelector","exact":"But, as we look to the horizon of a decade hence, we see no silver bullet","prefix":"ly as computer hardware costs do. ","suffix":". There is no single development,"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:08:41.636Z","modified":"2026-11-10T15:08:41.636Z"}
> ```
> %%
> I'm not certain about the range of 1986-1996, but I can at least safely say that we've safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I've seen ideas go from realization -> ideation -> implementation -> review -> release in a day's time.
>
> Of course, the claim I've seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).
>
> The way I've put it, colloquially, is that in a situation where you're at a physical assembly line and a machine in the middle speeds up by 1000%, you're not looking at a 1000% increase in productivity across the assembly line. You're looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren't moving fast enough, and that the review process has [[public/content/notes/natural-language-cve.md|largely caught on fire]].
^sxlthsl8nr


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8db4a429-d71b-4e14-9845-3d137e927183","type":"Annotation","motivation":"commenting","body":{"id":"#^5v8w05h0q8t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2817,"end":2927},{"type":"TextQuoteSelector","exact":"which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.","prefix":"nology or management technique, ","suffix":" In this chapter we shall try to"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:13:51.277Z","modified":"2026-11-10T15:13:51.277Z"}
> ```
> %%
> This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It's not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones -- time developing features, versus time developing fixes -- is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it's the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.
^5v8w05h0q8t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ff929a1-15ed-4ded-baa1-6359aaf4fbee","type":"Annotation","motivation":"commenting","body":{"id":"#^0vplvym3cbrg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":3065,"end":3261},{"type":"TextQuoteSelector","exact":"Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.","prefix":"perties of the bullets proposed. ","suffix":" A disciplined, consistent effor"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:14:47.358Z","modified":"2026-11-10T15:14:47.358Z"}
> ```
> %%
> I'll be ~~stealing~~ quoting "Skepticism is not pessimism" in my future apologetics around LLMs and agentic development.
^0vplvym3cbrg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:da59915a-d94b-4c44-87be-1a322812a2e8","type":"Annotation","motivation":"commenting","body":{"id":"#^kfxwncrsfe","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5782,"end":5874},{"type":"TextQuoteSelector","exact":"If this is true, building software will always be hard. There is inherently no silver bullet.","prefix":"in software engineering (1986) 3 ","suffix":"Let us consider the inherent pro"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-10T15:21:52.536Z","modified":"2026-11-10T21:18:39.988Z"}
> ```
> %%
> I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.
>
> To make sure I'm not discounting the point, though, I do think that it's worth softening it to "The essential part of software engineering is hard(er to optimize)", which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I've found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [[public/content/notes/software-gardening.mdx#Feedforward & Feedback|rapid and determinstic feedback]].
>
> What I've found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for... too many reasons to get into, here, but fundamentally comes down to the constraint that "write code faster" and "help humans understand code faster" are two very, *very* different engineering problems.
^kfxwncrsfe


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1b1ac91c-97bc-44f1-9c1b-a18711c4b653","type":"Annotation","motivation":"commenting","body":{"id":"#^wwj4u960f7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":10658,"end":11227},{"type":"TextQuoteSelector","exact":"All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.","prefix":" dampen the whim of the changers. ","suffix":"In short, the software product i"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-10T21:57:54.385Z","modified":"2026-11-10T21:57:54.385Z"}
> ```
> %%
> Gah -- this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn't mean the work to keep them runnable has (or will ever) end.
^wwj4u960f7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:2bf0a10d-edc3-44ad-8243-25a01a0cc974","type":"Annotation","motivation":"commenting","body":{"id":"#^ncf9kp5bnq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":11453,"end":11494},{"type":"TextQuoteSelector","exact":"Software is invisible and unvisualizable.","prefix":" software product. Invisibility. ","suffix":" Geometric abstractions are power"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-13T14:41:40.886Z","modified":"2026-11-13T14:41:40.886Z"}
> ```
> %%
> *Again* with the *absolutes* here, Brooks!
>
> I think "unvisualizable" concedes defeat before the fight has really started out. I'd once again summon up [[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces.md|boundary objects]]. My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.
>
> A [recent video about Britain's National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it's to get an immediate working knowledge of any issues worth addressing.
>
> I would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize -- not impossible. The analogy I'd pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some "most significant" visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:
>
> 1. Steps and catalog configurations themselves;
> 2. Storage mediums (S3, local system, etc.)
>
> Ultimately, it's just making sure you understand what a developer's necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.
^ncf9kp5bnq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7eea6caa-5a39-4be0-b2d3-d2c86073880e","type":"Annotation","motivation":"commenting","body":{"id":"#^kds1hgm51rl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2771,"end":2815},{"type":"TextQuoteSelector","exact":"in either technology or management technique","prefix":" There is no single development, ","suffix":", which by itself promises even o"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-13T15:13:22.608Z","modified":"2026-11-13T15:13:22.608Z"}
> ```
> %%
> *In a world **before** Agile...*
>
> All things considered, I'm glad to see management technique incorporated into an analysis of engineering optimization.
^kds1hgm51rl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0251a4b2-83e8-47ed-a8e4-342288bc141b","type":"Annotation","motivation":"commenting","body":{"id":"#^hfp5csllcv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21404,"end":21681},{"type":"TextQuoteSelector","exact":"Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.","prefix":"rified the terminological chaos: ","suffix":" In this approach human experts "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-13T17:35:31.514Z","modified":"2026-11-13T17:44:58.106Z"}
> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5e07b64b-9265-4544-82d2-6f1fda0a6f2f","type":"Annotation","motivation":"commenting","body":{"id":"#^9ozg40riczb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1007,"end":1149},{"type":"TextQuoteSelector","exact":"Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.","prefix":"l, as opposed to the essential? ","suffix":"Therefore it appears that the ti"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:40:29.215Z","modified":"2026-11-10T14:54:19.905Z","hypothesis":{"id":"gE9LjuMCEfG_9mOam9Dk-Q","digest":"e06ae8fb3e602","page":{"id":"gIeXyOMCEfGtaK-RPRUTZg","digest":"1a44eddf95a3f3"}}}
> ```
> %%
> I think that this premise hits a bit differently in 2026 than it did in 1986.
>
> First: even though Brooks is framing "Silver Bullet" as an order-of-magnitude improvement, this isn't necessarily a binary, true/false "anything less is useless": simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.
>
> In the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that's where the optimization question gets even more philosophical than Brooks puts it, here. I'm especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they're responsible for).
^9ozg40riczb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9595dd47-9bfc-471a-bc3a-d8505b39402a","type":"Annotation","motivation":"commenting","body":{"id":"#^vjg26uls6ae","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":1502,"end":1531},{"type":"TextQuoteSelector","exact":"Growing software organically,","prefix":"tablishing software requirements. ","suffix":" adding more and more function t"},{"type":"PageSelector","index":0,"label":"1"}]},"created":"2026-11-07T19:42:14.954Z","modified":"2026-11-10T14:45:40.331Z","hypothesis":{"id":"gLR5WuMCEfGmxZt745Lqmg","digest":"11b5628662b59c","page":{"id":"gOD_yuMCEfGTNSMKs59MLA","digest":"c7d949184652"}}}
> ```
> %%
> I mean... [[public/content/notes/software-gardening.mdx|I can't *not* bring it up.]]
^vjg26uls6ae


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8c76221b-77ad-4955-b84b-663adf9a2372","type":"Annotation","motivation":"commenting","body":{"id":"#^tkmanyd0vh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4605,"end":4696},{"type":"TextQuoteSelector","exact":"he transformation of computer manufacture from an assembly industry into a process industry.","prefix":"ed costs. These gains flow from t","suffix":"Second, to see what rate of prog"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:45:52.475Z","modified":"2026-11-10T15:18:11.856Z","hypothesis":{"id":"gQMWvuMCEfG87su7q6cAzQ","digest":"1f132691fac97a","page":{"id":"gS6EXOMCEfGmxheNncOJSw","digest":"c77e5bf54ba51"}}}
> ```
> %%
> It's important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.
>
> I think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.
^tkmanyd0vh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4687d939-3394-4435-bed2-837709f917fe","type":"Annotation","motivation":"commenting","body":{"id":"#^vyepyaspik","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":4824,"end":4997},{"type":"TextQuoteSelector","exact":"I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.","prefix":"ficulties. Following Aristotle, ","suffix":"The accidents I discuss in the n"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:46:40.788Z","modified":"2026-11-10T15:19:30.218Z","hypothesis":{"id":"gVQF4uMCEfGIZTMLhbIa6Q","digest":"54c9dc5735185","page":{"id":"gXaRKuMCEfGTNsdI0B1vEg","digest":"11c8c2b060ba28"}}}
> ```
> %%
> Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.
^vyepyaspik


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4d69f8b6-dea0-43f4-b681-7cdf20b1f5c3","type":"Annotation","motivation":"commenting","body":{"id":"#^x4uisgky7tj","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5394,"end":5701},{"type":"TextQuoteSelector","exact":"I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.","prefix":"hly precise and richly detailed. ","suffix":""},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-07T19:47:19.934Z","modified":"2026-11-10T15:21:04.436Z","hypothesis":{"id":"gZiCEuMCEfGZV3Mdpbx2MA","digest":"1909dbf0d7f3f6","page":{"id":"gcsccuMCEfGGyDv-1PLybg","digest":"e33e79814f639"}}}
> ```
> %%
> This is a massive issue that I broach in both the [[public/content/dead-math.md|Gherkin post]], as well as touching on my own experience trying to resurrect "dead" software, as defined in [[public/content/annotations/programming-as-theory-building.md|Programming as Theory Building]].
^x4uisgky7tj


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:86485653-2229-4361-906f-d5c781d08617","type":"Annotation","motivation":"commenting","body":{"id":"#^vqhlzf6jdks","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":6963,"end":7143},{"type":"TextQuoteSelector","exact":"The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.","prefix":"creases much more than linearly. ","suffix":" Mathematics and the physical sc"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:53:50.156Z","modified":"2026-11-10T21:26:25.550Z","hypothesis":{"id":"gfsf7uMCEfGpmrerBjmXlg","digest":"eff963cef1a1","page":{"id":"gijI_uMCEfGYPVtAdnBPxQ","digest":"a50fc0e6f582d"}}}
> ```
> %%
> Brooks gets into this later, but... yeah. That also came up in the background research for CASE programs during [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]. It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [[public/tags/projects/flowthru|Flowthru]], for example, lends itself well to a visualization, but that's only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get... horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It's effectively be an orthogonal axis to the DAG, adding an additional dimensionality.
>
> Brooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.
^vqhlzf6jdks


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7a9e9ec1-7273-4fa6-bca9-c174b90d6009","type":"Annotation","motivation":"commenting","body":{"id":"#^pprm61om6t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":7801,"end":7959},{"type":"TextQuoteSelector","exact":"From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.","prefix":" cost overruns, schedule delays. ","suffix":" From the complexity of the func"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T19:59:49.692Z","modified":"2026-11-10T21:28:12.429Z","hypothesis":{"id":"gk9aeOMCEfGwB68MPVG0bw","digest":"1bde86204412d","page":{"id":"gnY4RuMCEfGmBRtMRnZz4g","digest":"1fd7d34a3b706c"}}}
> ```
> %%
> [[public/content/dead-math#Why Proofs?|This section on formal verification and proofs]] talks about this a bit. Even the Red Team's research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today's technology, be out of the realm of possibility.
^pprm61om6t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ecff3bf-adc9-437a-a6c6-ba36d1ae4472","type":"Annotation","motivation":"commenting","body":{"id":"#^f7geh76bbjl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":8513,"end":8613},{"type":"TextQuoteSelector","exact":"It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.","prefix":"and control all the loose ends. ","suffix":"Conformity. Software people are "},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:08.322Z","modified":"2026-11-10T21:34:52.015Z","hypothesis":{"id":"gpsZ1uMCEfGjVEMkxNCkJA","digest":"60cb4f12370f6","page":{"id":"gsbzTuMCEfGwCBPTiCct1g","digest":"1f37007ddad640"}}}
> ```
> %%
> This is *exactly* what [[public/content/annotations/programming-as-theory-building#^7ppb5sf3ycw|Naur talks about]]. Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.
>
> This is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don't fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.
^f7geh76bbjl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b910316c-2896-484d-a3ad-83793f911e24","type":"Annotation","motivation":"commenting","body":{"id":"#^ulc2nm1bo4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9029,"end":9185},{"type":"TextQuoteSelector","exact":"No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human","prefix":" is not capricious or arbitrary. ","suffix":""},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-07T20:03:53.203Z","modified":"2026-11-10T21:36:26.044Z","hypothesis":{"id":"gumzcOMCEfGLVAe9nuaHqA","digest":"4bbdb89952a6b","page":{"id":"gxT1duMCEfGXemvp4SbG8g","digest":"13ba44a2589e6"}}}
> ```
> %%
> I do feel this one deeply. As part of my [[public/tags/projects/dayjob|dayjob]], I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.
^ulc2nm1bo4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:847428ca-9bdc-4ebf-85eb-d0e867be13c2","type":"Annotation","motivation":"commenting","body":{"id":"#^v9h1tk6pcnb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":9493,"end":9800},{"type":"TextQuoteSelector","exact":"In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.","prefix":"rent people, rather than by God. ","suffix":"Changeability. The software enti"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T20:05:36.052Z","modified":"2026-11-10T21:52:38.256Z","hypothesis":{"id":"gzxf0OMCEfGY2fNKMtOllw","digest":"1998b34feb897a","page":{"id":"g2RU1uMCEfGEl9tcXnZUNQ","digest":"19f459e66bdcfa"}}}
> ```
> %%
> I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they'll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.
>
> Conversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* -- that is to say, I can make decisions autonomously without much fear that I'll, say, lose business or alienate anyone.
>
> Software, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:
>
> - Z is for patches (small fixes that don't modify functionality
> - Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won't break any users' switching
> - X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.
>
> It's not unusual to see early software go through many breaking changes while it's a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).
^v9h1tk6pcnb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f7a2e78f-2e1f-45a2-8eb8-e479ad97fd1f","type":"Annotation","motivation":"commenting","body":{"id":"#^732yguy522u","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":12130,"end":12231},{"type":"TextQuoteSelector","exact":"we find it to constitute not one, but several, general directed graphs, superimposed one upon another.","prefix":"t to diagram software structure, ","suffix":" The several graphs may represen"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-07T22:08:42.822Z","modified":"2026-11-07T22:08:42.822Z","hypothesis":{"id":"g4r5iOMCEfGCApOmyIcZ5g","digest":"70e7513539eb5","page":{"id":"g7Hi3OMCEfG9he9rxhocPg","digest":"1f196e293350ab"}}}
> ```
> %%
> .
^732yguy522u


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7c70a2dd-121a-4181-b1f1-cf690b8972c8","type":"Annotation","motivation":"commenting","body":{"id":"#^hd9oddco1o7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15479,"end":15601},{"type":"TextQuoteSelector","exact":"arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.","prefix":" going on in a complex system. 2 P","suffix":""},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:09:36.128Z","modified":"2026-11-13T15:44:07.672Z","hypothesis":{"id":"g-CK4uMCEfGNs-_E_AjpRw","digest":"1591d0a88d19cc","page":{"id":"hAbXfuMCEfGYXPdCZoE3pw","digest":"13acaaed8726da"}}}
> ```
> %%
> [Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)
^hd9oddco1o7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1fcbe46a-9374-48c7-b7e2-af2277b7188e","type":"Annotation","motivation":"commenting","body":{"id":"#^sasqm0mbvyd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":13331,"end":13671},{"type":"TextQuoteSelector","exact":"High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.","prefix":"trapolation of each such attack. ","suffix":"What does a high-level language "},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:10:18.916Z","modified":"2026-11-13T14:50:20.099Z","hypothesis":{"id":"hC3s9uMCEfGZWBcKnWWQOg","digest":"179a2e5b43810a","page":{"id":"hFZdCOMCEfGCAw8kixjivw","digest":"66c1637e3ae1a"}}}
> ```
> %%
> While this is definitely the case, I'd say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can't be effectively linted becomes harder to scale against than is offset by their ease of use.
>
> This is specifically around non-prototyping. That's worth distinguishing.
^sasqm0mbvyd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6d4682fb-d70b-4906-9e20-6bc55a832c74","type":"Annotation","motivation":"commenting","body":{"id":"#^57h8rfdym18","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14563,"end":14746},{"type":"TextQuoteSelector","exact":"Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.","prefix":"r to the sophistication of users. ","suffix":"Time-sharing. Most observers cre"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:11:16.771Z","modified":"2026-11-13T15:02:22.480Z","hypothesis":{"id":"hHsI7OMCEfG1X1_qpjXS7Q","digest":"18c99405d1a196","page":{"id":"hKisDOMCEfGGyS_H6f6v_g","digest":"1cbbefb0b3d67b"}}}
> ```
> %%
> Ah, yeah -- this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall -- I haven't read the book since college) talks about the idea of "good abstractions" and "bad abstractions".
>
> It can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the "rules" require carve-outs, which is a slippery slope towards having no rules at all.
>
> Frameworks also have the same... I won't call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it's necessary to understand that there truly is no "silver bullet" among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* -- but there truly is no "everything" framework.
^57h8rfdym18


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3f255411-7368-4881-b687-277d9cd7a940","type":"Annotation","motivation":"commenting","body":{"id":"#^eicluc87x9t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15876,"end":16080},{"type":"TextQuoteSelector","exact":"The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.","prefix":"of time-sharing derive directly. ","suffix":"Unified programming environments"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-07T22:31:01.338Z","modified":"2026-11-13T15:53:47.240Z","hypothesis":{"id":"hM79WOMCEfG0Hl-zbfSffQ","digest":"551adb0d64b35","page":{"id":"hQHAOuMCEfGwCbsKilOK6Q","digest":"1442971edadcca"}}}
> ```
> %%
> The idea of shortening system response time is *so underrated* -- and far harder than Brooks makes it out to be. I talk about this a lot in both [[public/content/notes/software-gardening.mdx|Software Gardening]] and its precursor, [[public/content/notes/hostage-negotiations|Hostage Negotiations]]: rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.
>
> A lot of my attitude on immediate feedback was borne from my time doing [[public/content/articles/structured-streaming.md|data pipelines on Databricks/PySpark]]. That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.
^eicluc87x9t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:82d926aa-2f7d-4c4b-b3ba-5f600e9938c1","type":"Annotation","motivation":"commenting","body":{"id":"#^bfauk520glo","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":15101,"end":15476},{"type":"TextQuoteSelector","exact":"The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.","prefix":"tain an overview of complexity. ","suffix":"2 Parnas, D.L., “Designing softw"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-07T22:31:59.691Z","modified":"2026-11-13T15:43:14.400Z","hypothesis":{"id":"hSdVrOMCEfG8BX_UW8_myA","digest":"1f5a83a3897bec","page":{"id":"hWfu-uMCEfGpm9fP1vr_UQ","digest":"10134aee429612"}}}
> ```
> %%
> Thinking about this in terms of 1986 versus 2026, batch programming feels more like a "push" in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)
^bfauk520glo


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0a5a63da-439e-41f3-9790-8cc03a8c4d6c","type":"Annotation","motivation":"commenting","body":{"id":"#^yfp6g5ihhb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21051,"end":21249},{"type":"TextQuoteSelector","exact":"Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4","prefix":"g a program product. I doubt it. ","suffix":" I do not. To see why, we must d"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:32:40.645Z","modified":"2026-11-17T15:52:23.000Z","hypothesis":{"id":"hZaCauMCEfG5YxvdJczB5Q","digest":"22a35418305cc","page":{"id":"hb2dFOMCEfG1y_sW04-vSA","digest":"317f8d90d0120"}}}
> ```
> %%
> This bit of the paper feels *prescient* when you read it out of context, but it's so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn't pan out then, but here we are now.
^yfp6g5ihhb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b3d43a2e-ab25-405d-a932-ed1c2a033fd8","type":"Annotation","motivation":"commenting","body":{"id":"#^8kwbn6w8ess","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22004,"end":22124},{"type":"TextQuoteSelector","exact":"Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).","prefix":"alif.: Benjamin Cummings, 1983. 4 ","suffix":""},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-07T22:33:03.124Z","modified":"2026-11-17T15:53:04.612Z","hypothesis":{"id":"heQDCuMCEfGPQ4cVO1uHFg","digest":"1d7ed97f8e55f2","page":{"id":"hhFVMOMCEfG-AWNQHfGyFw","digest":"14c336fb54d959"}}}
> ```
> %%
> [Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)
^8kwbn6w8ess


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:234b7bdf-0b07-4270-a94f-a7b060bd9cb6","type":"Annotation","motivation":"commenting","body":{"id":"#^m2tflg196ud","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":14746,"end":14759},{"type":"TextQuoteSelector","exact":"Time-sharing.","prefix":"ely uses the esoteric constructs. ","suffix":" Most observers credit time-shar"},{"type":"PageSelector","index":4,"label":"5"}]},"created":"2026-11-09T17:04:41.771Z","modified":"2026-11-13T15:36:10.363Z","hypothesis":{"id":"hjcMYuMCEfGFmOvdMl5BLQ","digest":"d6374bdc69bed","page":{"id":"hl5mQOMCEfGBiBcuHfHWuA","digest":"6ea99da08e6ca"}}}
> ```
> %%
> This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today's dollars).
>
> As such, companies typically couldn't buy all that many computers. On top of that, early computers weren't multi-user: that is to say, you couldn't have multiple users "logged in", using the company's one computer, at once. That's what "batch programming" was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.
>
> (This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by "time sharing").
>
> Despite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of "context switching" -- having to interrupt your train of thought by multitasking (say, programming while also responding to pings).
^m2tflg196ud


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:eb1aa5af-1a36-414f-840c-99d86c8a3ba4","type":"Annotation","motivation":"commenting","body":{"id":"#^6w73od68aa3","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":16276,"end":16555},{"type":"TextQuoteSelector","exact":"They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.","prefix":"tivity by integral factors. Why? ","suffix":"This breakthrough in turn stimul"},{"type":"PageSelector","index":5,"label":"6"}]},"created":"2026-11-09T17:05:19.840Z","modified":"2026-11-13T16:16:33.678Z","hypothesis":{"id":"ho2uoOMCEfG1kN_j-BZesA","digest":"130fe605812091","page":{"id":"hrZPpOMCEfG2mz_fVK0Qjg","digest":"487dcc4e5eac4"}}}
> ```
> %%
> I haven't got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.
>
> (To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).
>
> The only thing I'd add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it's important to note that the vast majority of most powerful tools available to developers work against plaintext. There's no way, for example, to `grep` a Word document.
>
> A minor part of the reason I've [[public/content/dead-math.md|latched onto Gherkin]] is because it brings aspects of project management and ownership into plaintext. Once it's in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.
^6w73od68aa3


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:61f123e4-d7b2-4dc0-aa45-087b6bc1f556","type":"Annotation","motivation":"commenting","body":{"id":"#^byc7wdtnz3o","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19107,"end":19231},{"type":"TextQuoteSelector","exact":"Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.","prefix":" the cause of the improvements. ","suffix":"Object-oriented programming. Man"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:24.528Z","modified":"2026-11-13T16:26:40.158Z","hypothesis":{"id":"ht09JuMCEfG6IU9OYIhCsQ","digest":"c6efaa18be53a","page":{"id":"hw7dmuMCEfGY2qNlUDwbFA","digest":"fbdd30c1b47a2"}}}
> ```
> %%
> Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.
>
> In the same way I doubt that [[public/content/notes/pattern-languages-of-the-neighborhood|A Pattern Language]] could've been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.
^byc7wdtnz3o


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7b97e683-9106-4b7d-87fd-c0065b37ee25","type":"Annotation","motivation":"commenting","body":{"id":"#^ankq3ql47lk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":19231,"end":19405},{"type":"TextQuoteSelector","exact":"Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.","prefix":"odern software design techniques. ","suffix":" Mark Sherman of Dartmouth notes"},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:07:46.934Z","modified":"2026-11-13T16:28:48.336Z","hypothesis":{"id":"hzjh-OMCEfGMfeuSrEK9vQ","digest":"c05ed5616ec7","page":{"id":"h2J0eOMCEfGpnBsdtgrQqQ","digest":"588ddeb7875b2"}}}
> ```
> %%
> We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I've already cited to the practice, I'd refer to previous annotations on OOP's importance.
^ankq3ql47lk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:c2320176-e5d6-46c5-9cd2-e379a5fc910a","type":"Annotation","motivation":"commenting","body":{"id":"#^n5q9tyhtdgg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":20557,"end":20778},{"type":"TextQuoteSelector","exact":"Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that","prefix":"gher-order expression of design. ","suffix":". An order-of-magnitude gain can "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-09T17:08:50.891Z","modified":"2026-11-17T14:39:55.654Z","hypothesis":{"id":"h4jGquMCEfGw0n90JelNQg","digest":"122a993b13f78d","page":{"id":"h7FjsuMCEfGNtIfXLxZYOA","digest":"14a98954cec3dd"}}}
> ```
> %%
> I'd once again disagree with this, but it's nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.
>
> This is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of "cutting off fat" versus "cutting into muscle". To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.
^n5q9tyhtdgg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:18e57bab-231a-4f16-a5b6-aec2fc1c0105","type":"Annotation","motivation":"commenting","body":{"id":"#^kuymwz1me2","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":22649,"end":22816},{"type":"TextQuoteSelector","exact":"The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.","prefix":" completely with this critique. ","suffix":" I have a hard time seeing how i"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:10:21.719Z","modified":"2026-11-17T22:23:03.184Z","hypothesis":{"id":"h97YdOMCEfG1zOs9n3UmrA","digest":"1cc0fed4c110af","page":{"id":"iAeLKuMCEfGscgOmek0b6A","digest":"2fe524aab9839"}}}
> ```
> %%
> Another thing that definitely [didn't age as well](https://en.wikipedia.org/wiki/Transformer_(deep_learning)).
>
> A really good book on how the history of this approach flipped from "expert-designed expert systems" to "throw as much data as humanly possible to train on" is [*The Worlds I See*](https://www.amazon.com/Worlds-See-Curiosity-Exploration-Discovery/dp/1250897939) by [Dr. Fei-Fei Li](https://en.wikipedia.org/wiki/Fei-Fei_Li), who famously put together the [ImageNet](https://en.wikipedia.org/wiki/ImageNet) dataset. It was the performance of [AlexNet](https://en.wikipedia.org/wiki/AlexNet) on the ImageNet competition that kinda kicked off this whole deep-learning, neural-networking, [transformers-are-all-you-need](https://arxiv.org/pdf/1706.03762) era of computing.
^kuymwz1me2


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:882d3841-9285-4e1a-aba0-05b8afd9c006","type":"Annotation","motivation":"commenting","body":{"id":"#^5moqmvedmzn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":23484,"end":23813},{"type":"TextQuoteSelector","exact":"An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.","prefix":"ept, and what are the prospects? ","suffix":" The inference engines typically "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:11:30.693Z","modified":"2026-11-17T22:58:01.062Z","hypothesis":{"id":"iDax1OMCEfG9d0thZPnN-w","digest":"2eec4f3591441","page":{"id":"iGNC-OMCEfG0H0NsXeduEg","digest":"f6f08e13507b6"}}}
> ```
> %%
> I may end up re-reading the section(s) of Dr. Li's book regarding expert systems, because this is... vaguely reminiscent of the inference mechanism of LLMs, but not quite. Infamously, LLMs can struggle with justifying decisions only after-the-fact, not preserving prior reasoning sessions in future context for the sake of not cluttering up the context.
>
> I would be curious if there *is* any mechanism used by popular harnesses, by which LLMs can directly reference prior reasoning rounds as though they're data rather than conversational context. That doesn't seem like a particularly novel idea, so if it *hasn't* been done, so if it hasn't, I wonder if that's related to a general understanding that [judging LLMs based on their train-of-thought is a dangerous practice](https://cdn.openai.com/pdf/34f2ada6-870f-4c26-9790-fd8def56387f/CoT_Monitoring.pdf) (with a fantastic [explainer video](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) to boot).
^5moqmvedmzn



> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ed9f3060-9a8a-4f3a-88d3-369cff38e9fe","type":"Annotation","motivation":"commenting","body":{"id":"#^ivjyf74mo9k","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24530,"end":24725},{"type":"TextQuoteSelector","exact":"Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.","prefix":"lexity of the application itself. ","suffix":" I believe the most important ad"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:13:09.107Z","modified":"2026-11-17T23:01:50.654Z","hypothesis":{"id":"iI0VVuMCEfG2nOdeS47uPQ","digest":"2d816b1830792","page":{"id":"iMMYDuMCEfG2dB_ZYz5iFg","digest":"9098bdb7a0f9"}}}
> ```
> %%
> In trying to find the correct reference for this citation, I believe I've found the correct Feigenbaum reference: [Knowledge Engineering: The Applied Side of Artificial Intelligence](https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf) (1980)
>
> This is also uncanny, considering the later recognition that certain deep learning techniques absolutely thrive with more and more data added to them.
^ivjyf74mo9k


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f1c09573-6c20-4f86-95b2-546dbbe45740","type":"Annotation","motivation":"commenting","body":{"id":"#^ncwm3eztdnk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24063,"end":24168},{"type":"TextQuoteSelector","exact":"Inference engine technology is developed in an application-independent way, and then applied to many uses.","prefix":"olutions to the same problems: • • ","suffix":" One can justify much more effor"},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:20.346Z","modified":"2026-11-09T17:14:20.346Z","hypothesis":{"id":"iOpYOOMCEfG0IIfG-5ODJw","digest":"d5bc6d4c49b9d","page":{"id":"iQ9rCuMCEfGY26eIwrr2Rw","digest":"79abbe0daa88e"}}}
> ```
> %%
> .
^ncwm3eztdnk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0dfcb236-3820-4f20-bb49-a2b32663fd8a","type":"Annotation","motivation":"commenting","body":{"id":"#^g7ibzwd9qgt","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":24268,"end":24530},{"type":"TextQuoteSelector","exact":"The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.","prefix":"hat technology is well advanced. ","suffix":"Edward Feigenbaum says that the "},{"type":"PageSelector","index":7,"label":"8"}]},"created":"2026-11-09T17:14:42.756Z","modified":"2026-11-09T17:14:42.756Z","hypothesis":{"id":"iTt-NOMCEfGSoosG-W-AhA","digest":"1e46c6699465fe","page":{"id":"iW-Q1OMCEfG888P19gNVWA","digest":"1a380ab8d5ff94"}}}
> ```
> %%
> .
^g7ibzwd9qgt


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:75d191ab-463b-4c0f-8948-ac0fd09a99ce","type":"Annotation","motivation":"commenting","body":{"id":"#^7ndmgqf1q0j","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27236,"end":27306},{"type":"TextQuoteSelector","exact":"finding articulate, self-analytical experts who know why they do things","prefix":"d task of knowledge acquisition: ","suffix":"; and developing efficient techn"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:03.601Z","modified":"2026-11-09T17:17:03.601Z","hypothesis":{"id":"iZdaQuMCEfGKzqMkwQhdog","digest":"1fe8b66ae9d84b","page":{"id":"ib_YquMCEfGpnW9ahqBePw","digest":"15c464c92ce0d2"}}}
> ```
> %%
> .
^7ndmgqf1q0j


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:17283a8d-6906-4672-ab64-e961b71715cf","type":"Annotation","motivation":"commenting","body":{"id":"#^6k5uzuuz5sv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":26662,"end":26718},{"type":"TextQuoteSelector","exact":"helping in lifelong maintenance and modification testing","prefix":" bring-up test cases, as well as ","suffix":". In the same way, we can postula"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:14.951Z","modified":"2026-11-09T17:17:14.951Z","hypothesis":{"id":"iehaWuMCEfGYXddrE6i6tA","digest":"24b085433f85b","page":{"id":"ig4oUuMCEfGCBKPLcC6Vnw","digest":"13f785135e3784"}}}
> ```
> %%
> .
^6k5uzuuz5sv


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:291a0078-2264-4c2b-a03b-98de1e94aa93","type":"Annotation","motivation":"commenting","body":{"id":"#^mj864yumg2m","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27485,"end":27900},{"type":"TextQuoteSelector","exact":"The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.","prefix":"pert system is to have an expert. ","suffix":"“Automatic” programming. For alm"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:17:59.432Z","modified":"2026-11-09T17:17:59.432Z","hypothesis":{"id":"ijfu-OMCEfGmeD_ANQcBVA","digest":"bb41eafd18430","page":{"id":"imYXQuMCEfG2nXfXtgitYA","digest":"d2a3807d3a37c"}}}
> ```
> %%
> .
^mj864yumg2m


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ecd17a28-ec80-4edc-a1e6-f1591ccb67eb","type":"Annotation","motivation":"commenting","body":{"id":"#^dtcc5xnitnn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":27925,"end":27944},{"type":"TextQuoteSelector","exact":"For almost 40 years","prefix":"ortant. “Automatic” programming. ","suffix":", people have been anticipating "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:18:26.339Z","modified":"2026-11-09T17:18:26.339Z","hypothesis":{"id":"iowR4OMCEfGdxBPzpPuF8w","digest":"42b5aadc8d8f4","page":{"id":"irV37OMCEfG8ACdq0ZnRrw","digest":"1df167149d6f63"}}}
> ```
> %%
> .
^dtcc5xnitnn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d342ac9e-1f65-4dbb-8348-7eb0f1583899","type":"Annotation","motivation":"commenting","body":{"id":"#^uo0il5xnmjc","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28445,"end":28566},{"type":"TextQuoteSelector","exact":"He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.","prefix":"ly available to the programmer.8 ","suffix":"7 Mostow, op. cit. 8 Parnas, 1985"},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:05.692Z","modified":"2026-11-09T17:19:05.692Z","hypothesis":{"id":"it1sDOMCEfGBibcyCyfahQ","digest":"e5c770081e669","page":{"id":"ivxSrOMCEfG2npt8mOXg-A","digest":"ae3fa245e6f94"}}}
> ```
> %%
> .
^uo0il5xnmjc


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4c9cd456-e0dd-4164-804d-1334f3faee82","type":"Annotation","motivation":"commenting","body":{"id":"#^kc305035ym","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28294,"end":28444},{"type":"TextQuoteSelector","exact":"n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.","prefix":"ot semantic content, asserting, I","suffix":"8 He argues, in essence, that in "},{"type":"PageSelector","index":8,"label":"9"}]},"created":"2026-11-09T17:19:16.915Z","modified":"2026-11-09T17:19:16.915Z","hypothesis":{"id":"ixwltOMCEfGcPUNlM1ms_Q","digest":"12730762a8a357","page":{"id":"i0f27uMCEfGZWdtwhcg8Ww","digest":"1271647e8c7356"}}}
> ```
> %%
> .
^kc305035ym


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6225a18b-f7db-42e4-9f2e-6cc3ead88ad6","type":"Annotation","motivation":"commenting","body":{"id":"#^5s993cluoig","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30469,"end":30707},{"type":"TextQuoteSelector","exact":"In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.","prefix":"age for their proposed computer. ","suffix":"Second, the screens of today are"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:05.656Z","modified":"2026-11-09T17:21:05.656Z","hypothesis":{"id":"i3PmRuMCEfG3aw_pbnxk2g","digest":"1a71e89b5b36b7","page":{"id":"i6EYHuMCEfGwy4uz_v2rDg","digest":"103fb951adf03a"}}}
> ```
> %%
> .
^5s993cluoig


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7fd04683-32ad-46d1-b267-5454e18a31a6","type":"Annotation","motivation":"commenting","body":{"id":"#^d97hq9ydw9c","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30195,"end":30306},{"type":"TextQuoteSelector","exact":"In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.","prefix":"I am persuaded that nothing will. ","suffix":"10 Indeed, it is best viewed as "},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:21:35.053Z","modified":"2026-11-09T17:21:35.053Z","hypothesis":{"id":"i8iWbuMCEfG0rOcNKbVI-A","digest":"1ba55e2be83cd0","page":{"id":"i--EGOMCEfGk1c8r32NslA","digest":"9a5ab67447e98"}}}
> ```
> %%
> .
^d97hq9ydw9c


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d3c7cb2f-a6fa-40f3-911b-e44cc1939ddc","type":"Annotation","motivation":"commenting","body":{"id":"#^h5pgqb65qp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":30707,"end":30844},{"type":"TextQuoteSelector","exact":"Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.","prefix":"ting the programs they describe. ","suffix":" The so-called “desktop metaphor"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:20.909Z","modified":"2026-11-09T17:22:20.909Z","hypothesis":{"id":"jB9aOuMCEfGEWzNlb3JEGA","digest":"7afba75dfc394","page":{"id":"jEvePuMCEfGdoscPbLLS9Q","digest":"1aa981ff5d8ae1"}}}
> ```
> %%
> .
^h5pgqb65qp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bee19112-967e-484a-9103-73c467686702","type":"Annotation","motivation":"commenting","body":{"id":"#^xhvbeuk4i8n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31185,"end":31330},{"type":"TextQuoteSelector","exact":"Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.","prefix":"dom access to a score of pages. ","suffix":" The hardware technology will ha"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:22:40.869Z","modified":"2026-11-09T17:22:40.869Z","hypothesis":{"id":"jHg0_OMCEfGpns8m0sqQ6g","digest":"c447642b67307","page":{"id":"jJ1zFuMCEfG1kSeFppidJg","digest":"d524a01c10232"}}}
> ```
> %%
> .
^xhvbeuk4i8n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:089a9a54-a99c-4a3c-9193-aba42a91c987","type":"Annotation","motivation":"commenting","body":{"id":"#^1c5nprutkln","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":31689,"end":31764},{"type":"TextQuoteSelector","exact":"we feel only one dimension of the intricately interlocked software elephant.","prefix":"l data structures, or whatever, ","suffix":" If we superimpose all the diagr"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-09T17:23:04.978Z","modified":"2026-11-09T17:23:04.978Z","hypothesis":{"id":"jMPt_OMCEfG8AROX6_kRPA","digest":"1cd0139e4c20ac","page":{"id":"jPiNoOMCEfGd-089NPcDwA","digest":"c01a7483504cd"}}}
> ```
> %%
> .
^1c5nprutkln


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0c450070-9a2d-4903-81b2-2ca1328f4186","type":"Annotation","motivation":"commenting","body":{"id":"#^u6tcgt70nrb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":32771,"end":33094},{"type":"TextQuoteSelector","exact":"I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.","prefix":"o implementing and testing them? ","suffix":"Program verification does not me"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:23:52.738Z","modified":"2026-11-09T17:23:52.738Z","hypothesis":{"id":"jR18jOMCEfGYXlev5qcNSA","digest":"17f13ce8d98e9a","page":{"id":"jUQwhOMCEfGgul8p8yQScQ","digest":"71a7d1e0695a9"}}}
> ```
> %%
> .
^u6tcgt70nrb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5b5057f6-6744-4c40-ae17-1a41e1bfbc35","type":"Annotation","motivation":"commenting","body":{"id":"#^fscfpc13l9","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33182,"end":33307},{"type":"TextQuoteSelector","exact":"Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.","prefix":" There is no magic here, either. ","suffix":"More seriously, even perfect pro"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:10.898Z","modified":"2026-11-09T17:24:10.898Z","hypothesis":{"id":"jXSG7uMCEfGO8UsEZ_5S6A","digest":"978c93dc80f01","page":{"id":"jaOI1uMCEfGXe8-AjtCneQ","digest":"11ed7ebce42344"}}}
> ```
> %%
> .
^fscfpc13l9


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1faa853b-a3a1-4f33-9e04-157741942330","type":"Annotation","motivation":"commenting","body":{"id":"#^rrk5d1x6wpg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":33415,"end":33599},{"type":"TextQuoteSelector","exact":"The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.","prefix":"program meets its specification. ","suffix":"Environments and tools. How much"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:24:37.405Z","modified":"2026-11-09T17:24:37.405Z","hypothesis":{"id":"jc0BUuMCEfG-AyOrcklskA","digest":"69850b4bee69f","page":{"id":"jfTtcOMCEfG2dVeW9OQhRQ","digest":"7ada56acf96e8"}}}
> ```
> %%
> .
^rrk5d1x6wpg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:5461e192-2399-4286-8ca7-40924730b637","type":"Annotation","motivation":"commenting","body":{"id":"#^sknnl8ow6i","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34108,"end":34388},{"type":"TextQuoteSelector","exact":"Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.","prefix":"rors and simple semantic errors. ","suffix":"Surely this work is worthwhile, "},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:13.535Z","modified":"2026-11-09T17:26:13.535Z","hypothesis":{"id":"jhwmkuMCEfGixUeHtb1k0Q","digest":"132ba6349144b3","page":{"id":"jkO0MuMCEfGGmPOeEuEEHA","digest":"1c3e7bd67965b0"}}}
> ```
> %%
> .
^sknnl8ow6i


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:a9713bcc-7585-419e-b77d-1570a8eabce5","type":"Annotation","motivation":"commenting","body":{"id":"#^u5nri1m37df","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":34854,"end":35028},{"type":"TextQuoteSelector","exact":"Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.","prefix":"ly supported by today’s speeds. ","suffix":"More powerful workstations we su"},{"type":"PageSelector","index":10,"label":"11"}]},"created":"2026-11-09T17:26:56.266Z","modified":"2026-11-09T17:26:56.266Z","hypothesis":{"id":"jm26XOMCEfGjVQ_1FQ8dkA","digest":"d5bf8ff3965ba","page":{"id":"jpywquMCEfG0rRsbSs5Jzg","digest":"1a368f5f328d54"}}}
> ```
> %%
> .
^u5nri1m37df


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:b0695f58-7058-4708-8405-0a624690e9f7","type":"Annotation","motivation":"commenting","body":{"id":"#^ywdgnn4xef","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36066,"end":36174},{"type":"TextQuoteSelector","exact":"Buy versus build. The most radical possible solution for constructing software is not to construct it at all.","prefix":"some of these are very promising. ","suffix":"Every day this becomes easier, a"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:28:23.167Z","modified":"2026-11-09T17:28:23.167Z","hypothesis":{"id":"js0IBOMCEfGklecrSXPumg","digest":"241bbcb0d8e80","page":{"id":"jvrw1OMCEfGcPtsH5hpMZA","digest":"deeef8d56a839"}}}
> ```
> %%
> .
^ywdgnn4xef


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:4be450d5-a1d5-4161-a894-c4cd1b8d40c8","type":"Annotation","motivation":"commenting","body":{"id":"#^qpqgplaxida","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35661,"end":35879},{"type":"TextQuoteSelector","exact":"If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.","prefix":"task = ∑ (Frequency) i x (Time) i ","suffix":"Hence we must consider those att"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:18.921Z","modified":"2026-11-09T17:29:18.921Z","hypothesis":{"id":"jx4LoOMCEfGHtBtQBlZvzA","digest":"8ec2165b2d8e3","page":{"id":"j0aYruMCEfGSxOe7Esj1tQ","digest":"69d1e1b0283ae"}}}
> ```
> %%
> .
^qpqgplaxida


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:85b9a27a-8a42-4f48-8686-4a70d5a75465","type":"Annotation","motivation":"commenting","body":{"id":"#^46ecwt2iwel","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":35908,"end":36020},{"type":"TextQuoteSelector","exact":"attacks that address the essence of the software problem, the formulation of these complex conceptual structures.","prefix":"ns. Hence we must consider those ","suffix":" Fortunately, some of these are v"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:29:28.380Z","modified":"2026-11-09T17:29:28.380Z","hypothesis":{"id":"j3ksiOMCEfGsc_OBMFSF7w","digest":"9ac8179a756ff","page":{"id":"j6iPquMCEfGgu5sn5QS36w","digest":"855bdb9c4443a"}}}
> ```
> %%
> .
^46ecwt2iwel


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44e54adc-74c5-437d-a971-b0cd79fcd03a","type":"Annotation","motivation":"commenting","body":{"id":"#^fh6d7a9q5mb","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36377,"end":36466},{"type":"TextQuoteSelector","exact":"he personal computer revolution has created not one, but m any, mass markets for software.","prefix":"red on production methodology, t","suffix":" Every newsstand carried monthly "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:30:05.442Z","modified":"2026-11-09T17:30:05.442Z","hypothesis":{"id":"j9WvJuMCEfGIZpNJ1ReLOw","digest":"1eb1122a256852","page":{"id":"j_rghOMCEfG5ZIuyrAunkg","digest":"142c68960b3fdc"}}}
> ```
> %%
> .
^fh6d7a9q5mb


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:192ce430-c602-438a-a1a1-604cc509643b","type":"Annotation","motivation":"commenting","body":{"id":"#^8jv1h13fwqn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":36858,"end":36913},{"type":"TextQuoteSelector","exact":"Any such product is cheaper to buy than to build afresh","prefix":"ket place for individual modules. ","suffix":". Even at a cost of $100,000, a p"},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:31:42.594Z","modified":"2026-11-09T17:31:42.594Z","hypothesis":{"id":"kCHyoOMCEfGw07NfZ-_nsQ","digest":"a27f16998634","page":{"id":"kFNtnuMCEfG9eHcXreJz6A","digest":"175c701c37c20b"}}}
> ```
> %%
> .
^8jv1h13fwqn


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e630617a-a237-4c6d-8f4d-f774127d141b","type":"Annotation","motivation":"commenting","body":{"id":"#^r48k3wopfxp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37279,"end":37461},{"type":"TextQuoteSelector","exact":"The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.","prefix":"ntained than homegrown software. ","suffix":" Sharing that cost among even a "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:33:14.699Z","modified":"2026-11-10T15:36:42.169Z","hypothesis":{"id":"kHul6OMCEfGcP5dDR4ADwQ","digest":"1a8cfd0cce1a13","page":{"id":"kLAiPOMCEfGcFD_b92TP6w","digest":"1c2963f47039be"}}}
> ```
> %%
> On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it's basically the cost of pushing a distributable up to a server, and the cost of you downloading it.
>
> Netflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It's very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.
^r48k3wopfxp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:966aeb51-dea1-44dc-aea1-b0aed3360482","type":"Annotation","motivation":"commenting","body":{"id":"#^tic5hg7ofof","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":37953,"end":38127},{"type":"TextQuoteSelector","exact":"users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.","prefix":"s, study after study showed that ","suffix":" During the 1980s, we find such "},{"type":"PageSelector","index":11,"label":"12"}]},"created":"2026-11-09T17:34:13.206Z","modified":"2026-11-09T17:34:13.206Z","hypothesis":{"id":"kNS9pOMCEfGGmcdPtjVrfw","digest":"1e9504f6aa912","page":{"id":"kPynBuMCEfG8B6OK8x7DVQ","digest":"1508c1c9e882d0"}}}
> ```
> %%
> .
^tic5hg7ofof


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:44fd7e54-9599-4253-8284-1411356d656f","type":"Annotation","motivation":"commenting","body":{"id":"#^y1gz1ngkwvm","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":38576,"end":39112},{"type":"TextQuoteSelector","exact":"The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.","prefix":"cated than those of 20 years ago. ","suffix":"There are dramatic exceptions to"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:12.688Z","modified":"2026-11-10T13:09:12.688Z","hypothesis":{"id":"kS5GgOMCEfGpf5_Nxvx7DA","digest":"84f795f22393e","page":{"id":"kVkURuMCEfGdo8PnDFgYuQ","digest":"11962f1c29e821"}}}
> ```
> %%
> .
^y1gz1ngkwvm


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:24df9bb7-b2ae-426b-a407-c973e704610f","type":"Annotation","motivation":"commenting","body":{"id":"#^z8uqeaqsds","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":39672,"end":39926},{"type":"TextQuoteSelector","exact":"Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.","prefix":"routinely done with these tools. ","suffix":"I believe the single most powerf"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:47.965Z","modified":"2026-11-10T13:09:47.965Z","hypothesis":{"id":"kX84BuMCEfGxe-Nhrha1YQ","digest":"19ec26c91f9c52","page":{"id":"kaYWdOMCEfGSxSsoPOfFLA","digest":"1a5fb81882c45f"}}}
> ```
> %%
> .
^z8uqeaqsds


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bfd257bc-26f1-436f-a280-f794f789179d","type":"Annotation","motivation":"commenting","body":{"id":"#^zm63kpzvr2q","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40204,"end":40313},{"type":"TextQuoteSelector","exact":"The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.","prefix":"t programs, and turn them loose. ","suffix":"Requirements refinement and rapi"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:09:54.490Z","modified":"2026-11-10T13:09:54.490Z","hypothesis":{"id":"kc7-kOMCEfGY3OfwfuYQMQ","digest":"132463c125d64b","page":{"id":"kfe-tuMCEfG3bEdNEBXMqQ","digest":"e6a61e42e72a4"}}}
> ```
> %%
> .
^zm63kpzvr2q


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:590bd3a0-1dd1-4b3a-9323-542ba0ee6a30","type":"Annotation","motivation":"commenting","body":{"id":"#^14gm56fc3zwd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40313,"end":40449},{"type":"TextQuoteSelector","exact":"Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.","prefix":"ndreds of laboratory scientists. ","suffix":" No other part of the conceptual"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:08.183Z","modified":"2026-11-10T13:10:08.183Z","hypothesis":{"id":"kifGYOMCEfGFmU9MFXK-aA","digest":"1e66a71976bdb0","page":{"id":"kkxrbuMCEfG_2itu_VNKvA","digest":"697300dcfb19b"}}}
> ```
> %%
> .
^14gm56fc3zwd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49b68af2-7d89-4885-80f2-77290bb19a93","type":"Annotation","motivation":"commenting","body":{"id":"#^spwoqgulnam","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":40912,"end":40968},{"type":"TextQuoteSelector","exact":"For the truth is, the clients do not know what they want.","prefix":"nt of the product requirements. ","suffix":" They usually do not know what q"},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:43.052Z","modified":"2026-11-10T13:10:43.052Z","hypothesis":{"id":"knNjuOMCEfGgkINBHIVnRA","digest":"15d0860d883702","page":{"id":"kp6T0OMCEfGFmu9zKt7YkA","digest":"c850d23d14dd2"}}}
> ```
> %%
> .
^spwoqgulnam


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e5263b5a-92e4-4549-8748-4c0fb87c98a0","type":"Annotation","motivation":"commenting","body":{"id":"#^eikgl68ua48","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41113,"end":41244},{"type":"TextQuoteSelector","exact":"Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.","prefix":"e detail that must be specified. ","suffix":" Clients never want exactly that."},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:10:54.746Z","modified":"2026-11-10T13:10:54.746Z","hypothesis":{"id":"ksfN6uMCEfGxfE_R2LAM_g","digest":"ebde8e9ad894b","page":{"id":"kvJqPOMCEfGk9ofcmJfOCw","digest":"19c9422849470b"}}}
> ```
> %%
> .
^eikgl68ua48


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:720b9302-bf82-4450-be48-6c58ed41d5cb","type":"Annotation","motivation":"commenting","body":{"id":"#^k3d5e5ivcdq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":41561,"end":41860},{"type":"TextQuoteSelector","exact":"I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.","prefix":"s part of the system definition. ","suffix":""},{"type":"PageSelector","index":12,"label":"13"}]},"created":"2026-11-10T13:11:26.033Z","modified":"2026-11-10T13:11:26.033Z","hypothesis":{"id":"kyNNRuMCEfGLV_voTvuD_A","digest":"1c32622a511f9f","page":{"id":"k0oKvOMCEfGpgCtbBehtbQ","digest":"15d69834a30230"}}}
> ```
> %%
> .
^k3d5e5ivcdq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7e32bc36-484d-406a-90ce-077f70e46cae","type":"Annotation","motivation":"commenting","body":{"id":"#^l6116faqbyh","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42610,"end":42749},{"type":"TextQuoteSelector","exact":"The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability","prefix":"lid inputs, abort cleanly, etc. ","suffix":"Much of present-day software acq"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:12:21.506Z","modified":"2026-11-10T13:12:21.506Z","hypothesis":{"id":"k3_4SOMCEfGF2sN9dBYX2A","digest":"5a93491e2b005","page":{"id":"k7HvkuMCEfGfCJelXtDwsw","digest":"c62c1d4b1567a"}}}
> ```
> %%
> .
^l6116faqbyh


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:956229ae-3fab-47c5-9eee-f7340c5c160e","type":"Annotation","motivation":"commenting","body":{"id":"#^ta0co6qjc6d","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":42749,"end":43058},{"type":"TextQuoteSelector","exact":"Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.","prefix":" it for consistency and usability ","suffix":" Hence they cannot be fixed witho"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:07.455Z","modified":"2026-11-10T13:13:07.455Z","hypothesis":{"id":"k9rfYOMCEfGzYTPsvjQ71Q","digest":"d1781b9191ea0","page":{"id":"lAFoJOMCEfGgvAMVieRlTg","digest":"6b8f361c0c64e"}}}
> ```
> %%
> https://agilemanifesto.org/authors.html
^ta0co6qjc6d


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:829e4639-2b70-42a3-a3f5-4d8a7a93dabc","type":"Annotation","motivation":"commenting","body":{"id":"#^ucs8dz59q1g","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43203,"end":43253},{"type":"TextQuoteSelector","exact":"Incremental development−grow, not build, software.","prefix":"tion of prototypes and products. ","suffix":" I still remember the jolt I fel"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:35.689Z","modified":"2026-11-10T13:13:35.689Z","hypothesis":{"id":"lFAL0uMCEfGO8ielqhxL6A","digest":"b1d465f6ddf33","page":{"id":"lHivGuMCEfGvThsjPwXuYg","digest":"16575b9d52a08f"}}}
> ```
> %%
> .
^ucs8dz59q1g


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:13b76122-3ec3-4638-a9d0-e71479a9035f","type":"Annotation","motivation":"commenting","body":{"id":"#^l87arq847gq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43687,"end":43736},{"type":"TextQuoteSelector","exact":"The building metaphor has outlived its usefulness","prefix":" of components, and scaffolding. ","suffix":". It is time to change again. If"},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:13:56.542Z","modified":"2026-11-10T13:13:56.542Z","hypothesis":{"id":"lKIPwuMCEfG9eUdUUHfTxA","digest":"8502220aaac54","page":{"id":"lM_JWOMCEfGZWv86rXzCzg","digest":"17419263b592f9"}}}
> ```
> %%
> .
^l87arq847gq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1217c77d-0f0e-47c2-9b5d-62a816b49cdb","type":"Annotation","motivation":"commenting","body":{"id":"#^h6tmealho1b","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45231,"end":45384},{"type":"TextQuoteSelector","exact":"Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.","prefix":"out of what is already there. 11 ","suffix":""},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:14:51.449Z","modified":"2026-11-10T13:14:51.449Z","hypothesis":{"id":"lPjaPOMCEfG9em_71_sj5Q","digest":"8bb8435a97e83","page":{"id":"lSalAuMCEfGjVqdAxrOXGA","digest":"1795dcc81c3671"}}}
> ```
> %%
> .
^h6tmealho1b


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:dfe83f3c-f17a-433c-905b-ac71bc76cc3d","type":"Annotation","motivation":"commenting","body":{"id":"#^z9rqoddbhek","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":43975,"end":44305},{"type":"TextQuoteSelector","exact":"Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.","prefix":"e a radically different approach. ","suffix":"So it must be with our software "},{"type":"PageSelector","index":13,"label":"14"}]},"created":"2026-11-10T13:15:41.748Z","modified":"2026-11-10T13:15:41.748Z","hypothesis":{"id":"lVHdqOMCEfGgvQ8pNCQyqA","digest":"1d1256a7adabdb","page":{"id":"lXwGMuMCEfGxSIPRmLuzFA","digest":"f9face9dfae2c"}}}
> ```
> %%
> .
^z9rqoddbhek


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e478d6d1-db04-46a3-8486-05bffe991284","type":"Annotation","motivation":"commenting","body":{"id":"#^pnvpwm0kfph","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":45466,"end":45566},{"type":"TextQuoteSelector","exact":"The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.","prefix":"n software engineering (1986) 15 ","suffix":" Efforts redouble when the first"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:18:40.436Z","modified":"2026-11-10T13:18:40.436Z","hypothesis":{"id":"lbDrhuMCEfGPRAPkVlQNSA","digest":"a6cf8545d0aa9","page":{"id":"ld7XsuMCEfGwFf-oLlRjXQ","digest":"3958aa68fbfa9"}}}
> ```
> %%
> .
^pnvpwm0kfph


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d187d320-560c-415b-b436-b8a9d487c47e","type":"Annotation","motivation":"commenting","body":{"id":"#^659tbk1url4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46138,"end":46236},{"type":"TextQuoteSelector","exact":"Programmers are among the most intelligent part of the population, so they can learn good practice.","prefix":"design practices can be taught. ","suffix":" Thus a major thrust in the Unit"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:23:47.220Z","modified":"2026-11-10T13:23:47.220Z","hypothesis":{"id":"lgh-KOMCEfG872-BmCAYIQ","digest":"1893893acd674f","page":{"id":"li43TuMCEfGk9x8qMGLROw","digest":"f2193c2550624"}}}
> ```
> %%
> .
^659tbk1url4


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d9034a33-272e-4b29-8d81-db598afffe94","type":"Annotation","motivation":"commenting","body":{"id":"#^u3tbp9k9laq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":48605,"end":48988},{"type":"TextQuoteSelector","exact":"My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.","prefix":" products will ultimately depend. ","suffix":"How to grow great designers? Spa"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:25:47.548Z","modified":"2026-11-10T13:25:47.548Z","hypothesis":{"id":"ll8fHOMCEfGMfmeH7DWObg","digest":"d9e17c75b1c54","page":{"id":"loiTxOMCEfGSxo9pxY_hOQ","digest":"8abfaa3a478b9"}}}
> ```
> %%
> .
^u3tbp9k9laq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:92804baf-20f0-4947-882d-669d28a9c06f","type":"Annotation","motivation":"commenting","body":{"id":"#^obag3lnbk6","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49302,"end":49558},{"type":"TextQuoteSelector","exact":"Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.","prefix":", and keep a careful career file. ","suffix":"Provide opportunities for growin"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:26:47.607Z","modified":"2026-11-10T13:26:47.607Z","hypothesis":{"id":"lq5d3uMCEfGGyhNkyH96pw","digest":"116b42ffa16700","page":{"id":"ltWviOMCEfG88LNb64ppnA","digest":"1b614f6cef95fa"}}}
> ```
> %%
> .
^obag3lnbk6


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:439ba5df-3e0a-436c-902e-791e4184ffc9","type":"Annotation","motivation":"commenting","body":{"id":"#^839csn14pzu","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":49558,"end":49644},{"type":"TextQuoteSelector","exact":"Provide opportunities for growing designers to interact with and stimulate each other.","prefix":"technical leadership assignments. ","suffix":"■"},{"type":"PageSelector","index":15,"label":"16"}]},"created":"2026-11-10T13:27:00.026Z","modified":"2026-11-10T13:27:00.026Z","hypothesis":{"id":"lv5xNOMCEfGEXUsAdx5H9w","digest":"13ac4ca679b61","page":{"id":"lyddTOMCEfGcFfMhBRRM6w","digest":"a92acc40ecf9c"}}}
> ```
> %%
> .
^839csn14pzu


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:fb08ed63-8f32-46c1-bdbe-314279d84d66","type":"Annotation","motivation":"commenting","body":{"id":"#^tx89o2dg9y","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47979,"end":48089},{"type":"TextQuoteSelector","exact":"Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.","prefix":"ways to grow great designers. 12 ","suffix":""},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:10.341Z","modified":"2026-11-10T13:27:10.341Z","hypothesis":{"id":"l08I4uMCEfGVoec4jckjAA","digest":"67cdf9fba0d26","page":{"id":"l3TinOMCEfGpJz9ayzLymA","digest":"17a42bc42046bb"}}}
> ```
> %%
> .
^tx89o2dg9y


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:49a481c6-a08f-47ad-ae46-b74410638fb4","type":"Annotation","motivation":"commenting","body":{"id":"#^oxueoddlujp","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":46599,"end":46776},{"type":"TextQuoteSelector","exact":"Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.","prefix":"ext step upward in the same way. ","suffix":" Great designs come from great d"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:34.536Z","modified":"2026-11-10T13:27:34.536Z","hypothesis":{"id":"l6ffYuMCEfGUUEs4zMR_AQ","digest":"132a3dc00d6ad","page":{"id":"l9An9uMCEfGk1tvOtW0SkQ","digest":"19e0fac0123961"}}}
> ```
> %%
> .
^oxueoddlujp


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:59f2f1bc-c6b0-4383-947a-b451ed933f54","type":"Annotation","motivation":"commenting","body":{"id":"#^6jf16b2d9lw","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":47176,"end":47256},{"type":"TextQuoteSelector","exact":"The differences between the great and the average approach an order of magnitude.","prefix":" and produced with less effort. ","suffix":"A little retrospection shows tha"},{"type":"PageSelector","index":14,"label":"15"}]},"created":"2026-11-10T13:27:44.860Z","modified":"2026-11-10T13:27:44.860Z","hypothesis":{"id":"l_bpaOMCEfGgvgdvlkTWwA","digest":"54605121a2a74","page":{"id":"mCBtJOMCEfGsZQMMQKjRwA","digest":"d373eaaa9ac4e"}}}
> ```
> %%
> .
^6jf16b2d9lw


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:bca28b90-fea2-4a10-ae1e-e40f2956827f","type":"Annotation","motivation":"commenting","body":{"id":"#^gydte98pz3n","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":28690,"end":28836},{"type":"TextQuoteSelector","exact":"Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.","prefix":"n software engineering (1986) 10 ","suffix":" Some systems for integrating dif"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:35.458Z","modified":"2026-11-10T13:30:35.458Z","hypothesis":{"id":"mFXGNuMCEfG1kgfePFkjGw","digest":"1a9271572e90d0","page":{"id":"mH5nWOMCEfGcFt8GtHOSTA","digest":"1d24d4bc50a1b9"}}}
> ```
> %%
> .
^gydte98pz3n


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:329038c3-6835-42bd-b960-d5e175b213d9","type":"Annotation","motivation":"commenting","body":{"id":"#^ojjhhp38yqd","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":29055,"end":29355},{"type":"TextQuoteSelector","exact":"These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.","prefix":", and generated the programs. • • • • ","suffix":"It is hard to see how such techn"},{"type":"PageSelector","index":9,"label":"10"}]},"created":"2026-11-10T13:30:54.879Z","modified":"2026-11-10T13:30:54.879Z","hypothesis":{"id":"mKrNIOMCEfG6IosyIQ9u3w","digest":"5ed4a63cc900f","page":{"id":"mNcCPOMCEfGd_L9Mu8_nfg","digest":"4284ba620cb8e"}}}
> ```
> %%
> .
^ojjhhp38yqd


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:e60fcb9b-590c-4d15-990c-9734084c6aaa","type":"Annotation","motivation":"commenting","body":{"id":"#^sxlthsl8nr","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2665,"end":2738},{"type":"TextQuoteSelector","exact":"But, as we look to the horizon of a decade hence, we see no silver bullet","prefix":"ly as computer hardware costs do. ","suffix":". There is no single development,"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:08:41.636Z","modified":"2026-11-10T15:08:41.636Z","hypothesis":{"id":"mQw2FOMCEfG2n4-53-WC1w","digest":"1098d608d91b8f","page":{"id":"mTL7HuMCEfGpn59DXvxiJA","digest":"14811057ea12c7"}}}
> ```
> %%
> I'm not certain about the range of 1986-1996, but I can at least safely say that we've safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I've seen ideas go from realization -> ideation -> implementation -> review -> release in a day's time.
>
> Of course, the claim I've seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).
>
> The way I've put it, colloquially, is that in a situation where you're at a physical assembly line and a machine in the middle speeds up by 1000%, you're not looking at a 1000% increase in productivity across the assembly line. You're looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren't moving fast enough, and that the review process has [[public/content/notes/natural-language-cve.md|largely caught on fire]].
^sxlthsl8nr


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8db4a429-d71b-4e14-9845-3d137e927183","type":"Annotation","motivation":"commenting","body":{"id":"#^5v8w05h0q8t","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2817,"end":2927},{"type":"TextQuoteSelector","exact":"which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.","prefix":"nology or management technique, ","suffix":" In this chapter we shall try to"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:13:51.277Z","modified":"2026-11-10T15:13:51.277Z","hypothesis":{"id":"mWsnFOMCEfGGm69cSf-OWg","digest":"37d4e256d89bb","page":{"id":"mZ71JuMCEfGXJ1OFu_Avlw","digest":"1fbdba366655f9"}}}
> ```
> %%
> This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It's not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones -- time developing features, versus time developing fixes -- is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it's the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.
^5v8w05h0q8t


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:8ff929a1-15ed-4ded-baa1-6359aaf4fbee","type":"Annotation","motivation":"commenting","body":{"id":"#^0vplvym3cbrg","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":3065,"end":3261},{"type":"TextQuoteSelector","exact":"Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.","prefix":"perties of the bullets proposed. ","suffix":" A disciplined, consistent effor"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-10T15:14:47.358Z","modified":"2026-11-10T15:14:47.358Z","hypothesis":{"id":"mcRP9uMCEfGf36N_EcMjAQ","digest":"b2c5d40d92e78","page":{"id":"me7OIOMCEfGYPnMgZRDP9Q","digest":"1651519a6244d8"}}}
> ```
> %%
> I'll be ~~stealing~~ quoting "Skepticism is not pessimism" in my future apologetics around LLMs and agentic development.
^0vplvym3cbrg


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:da59915a-d94b-4c44-87be-1a322812a2e8","type":"Annotation","motivation":"commenting","body":{"id":"#^kfxwncrsfe","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":5782,"end":5874},{"type":"TextQuoteSelector","exact":"If this is true, building software will always be hard. There is inherently no silver bullet.","prefix":"in software engineering (1986) 3 ","suffix":"Let us consider the inherent pro"},{"type":"PageSelector","index":2,"label":"3"}]},"created":"2026-11-10T15:21:52.536Z","modified":"2026-11-10T21:18:39.988Z","hypothesis":{"id":"mhimquMCEfGzYncgCwAKaw","digest":"e074e3dc92da3","page":{"id":"mkITCuMCEfG8ApcWJlwuQA","digest":"17eec8356c007b"}}}
> ```
> %%
> I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.
>
> To make sure I'm not discounting the point, though, I do think that it's worth softening it to "The essential part of software engineering is hard(er to optimize)", which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I've found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [[public/content/notes/software-gardening.mdx#Feedforward & Feedback|rapid and determinstic feedback]].
>
> What I've found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for... too many reasons to get into, here, but fundamentally comes down to the constraint that "write code faster" and "help humans understand code faster" are two very, *very* different engineering problems.
^kfxwncrsfe


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:1b1ac91c-97bc-44f1-9c1b-a18711c4b653","type":"Annotation","motivation":"commenting","body":{"id":"#^wwj4u960f7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":10658,"end":11227},{"type":"TextQuoteSelector","exact":"All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.","prefix":" dampen the whim of the changers. ","suffix":"In short, the software product i"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-10T21:57:54.385Z","modified":"2026-11-10T21:57:54.385Z","hypothesis":{"id":"mncvBOMCEfGsdSsl-TYPgg","digest":"401a1a515230d","page":{"id":"mrOcoOMCEfGdxbf6eUhQ5A","digest":"c6d9ee87ef4cc"}}}
> ```
> %%
> Gah -- this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn't mean the work to keep them runnable has (or will ever) end.
^wwj4u960f7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:2bf0a10d-edc3-44ad-8243-25a01a0cc974","type":"Annotation","motivation":"commenting","body":{"id":"#^ncf9kp5bnq","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":11453,"end":11494},{"type":"TextQuoteSelector","exact":"Software is invisible and unvisualizable.","prefix":" software product. Invisibility. ","suffix":" Geometric abstractions are power"},{"type":"PageSelector","index":3,"label":"4"}]},"created":"2026-11-13T14:41:40.886Z","modified":"2026-11-13T14:41:40.886Z","hypothesis":{"id":"mth2OOMCEfGYP3P5yud0jw","digest":"187859de677fdc","page":{"id":"mvmJXuMCEfGgv7MMhf_jHA","digest":"1c78e43176e59d"}}}
> ```
> %%
> *Again* with the *absolutes* here, Brooks!
>
> I think "unvisualizable" concedes defeat before the fight has really started out. I'd once again summon up [[public/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces.md|boundary objects]]. My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.
>
> A [recent video about Britain's National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it's to get an immediate working knowledge of any issues worth addressing.
>
> I would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize -- not impossible. The analogy I'd pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some "most significant" visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:
>
> 1. Steps and catalog configurations themselves;
> 2. Storage mediums (S3, local system, etc.)
>
> Ultimately, it's just making sure you understand what a developer's necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.
^ncf9kp5bnq


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:7eea6caa-5a39-4be0-b2d3-d2c86073880e","type":"Annotation","motivation":"commenting","body":{"id":"#^kds1hgm51rl","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":2771,"end":2815},{"type":"TextQuoteSelector","exact":"in either technology or management technique","prefix":" There is no single development, ","suffix":", which by itself promises even o"},{"type":"PageSelector","index":1,"label":"2"}]},"created":"2026-11-13T15:13:22.608Z","modified":"2026-11-13T15:13:22.608Z","hypothesis":{"id":"mzHLKuMCEfG-BL8QgCM3gg","digest":"2bab68bf8c8da","page":{"id":"m1lZsOMCEfGThyffLBZ6sw","digest":"2545d525cecc0"}}}
> ```
> %%
> *In a world **before** Agile...*
>
> All things considered, I'm glad to see management technique incorporated into an analysis of engineering optimization.
^kds1hgm51rl


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0251a4b2-83e8-47ed-a8e4-342288bc141b","type":"Annotation","motivation":"commenting","body":{"id":"#^hfp5csllcv","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf","selector":[{"type":"TextPositionSelector","start":21404,"end":21681},{"type":"TextQuoteSelector","exact":"Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.","prefix":"rified the terminological chaos: ","suffix":" In this approach human experts "},{"type":"PageSelector","index":6,"label":"7"}]},"created":"2026-11-13T17:35:31.514Z","modified":"2026-11-13T17:44:58.106Z","hypothesis":{"id":"m4r6xOMCEfGpoPftQYVBcg","digest":"c80f34b5082a7","page":{"id":"m7zEAOMCEfGmyB8cu6GKGw","digest":"5b08d90d5bcb5"}}}
> ```
> %%
> If I understand correctly, a distinguishing difference between these two systems would be something like an "AI" chess player (say, [Deep Blue](https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer))) that's written by humans, in code, to do more advanced tasks. The qualification Brooks has next (that this is a sliding scale) has largely slid off the edge, now that some of the most advanced behaviors are expressed through network weights rather than straight-up code: 
^hfp5csllcv









[^1]: Technically, [essential and accidental](https://en.wikipedia.org/wiki/Accident_(philosophy)) is Aristotle's territory, but I'm not certain Aristotle had many passionate opinions about the act of software development. From what I can tell, he also focused more on nouns (e.g. what is a chair, *really?*), while Brooks focuses more on the trade of software engineering itself.
[^2]: He actually does talk about generative AI and expert systems. These promises have been on the horizon for awhile now. I talk more about that in [[public/content/annotations/programming-as-theory-building|Programming as Theory Building]]
[^3]: I'm not claiming quality, here: just speed.
