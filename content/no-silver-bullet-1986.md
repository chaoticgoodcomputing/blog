# Is AI a Silver Bullet?

> A set of annotations on the seminal computation and project management paper, No Silver Bullet, by Frederick Brooks (1986)

- Page: https://blog.chaoticgood.computer/content/no-silver-bullet-1986
- Author: Spencer Elkington
- Published: 2026-11-06
- Updated: 2026-11-22
- Tags: engineering, engineering/ai, economics/management, reading/papers, writing/notes

---

I recently got into a discussion about [computer-aided software engineering](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) with some folks, recently, for… [reasons that should be obvious](https://blog.chaoticgood.computer/tags/engineering/ai).

For some context: Brooks is the author of [*The Mythical Man-Month*](https://en.wikipedia.org/wiki/The_Mythical_Man-Month), originally published in 1975, about engineering and project management. It’s been awhile since reading it (“awhile” meaning 2022, at the recommendation of my manager at the time), but the book’s core premise is that adding more engineering hours to a project doesn’t necessarily make it complete faster: a combination of an irreducible core of work, with added management overhead in parallelization and coordination of work, may end up delaying it.

In this particular paper, written 9 years after *The Mythical Man-Month*, Brooks defines a framework for evaluating the potential lower bound for optimizations in software engineering. In particular, the key premise is that time spent software engineering (defined loosely as taking an idea and [converting it into a runnable computer program](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building)) is spent in either two areas of work:1

-   **Accidental** work, which “attend its production, but are not inherent”; and
-   **Essential** work, which is “inherent to the nature of the software”

In thinking about optimization, he categorizes a silver bullet as something that might decrease the amount of time it takes to complete a task by an order of magnitude (10x). His conclusion, looking on the horizon from 1986, was that there weren’t any clear silver bullets.

Obviously, we have the benefit of hindsight. You might think that this post is solely about modern LLM and agentic development,2 but there’s been a *lot* of ground to cover in the software optimization space since then. The first Mac and Windows machines were released in 1984 and 1985, respectively, just a couple years before the paper was written. IDEs and object-oriented programming were just barely entering the scene. Development by rapid iteration – which he does actually touch on, if in spirit if not in name – wasn’t formalized into the modern Agile we’re familiar with until 25 years later.

Writing with 40 years of hindsight, and with modern agents being capable of massive speedups3, there’s no better time to think about the essentials and accidentals in the profession.

Source document: [worrydream.com](https://worrydream.com/refs/Brooks_1986_-_No_Silver_Bullet.pdf)

## Annotations

> Unless it is more than 9/10 of all effort, shrinking all the accidental activities to zero time will not give an order of magnitude improvement.

I think that this premise hits a bit differently in 2026 than it did in 1986.

First: even though Brooks is framing “Silver Bullet” as an order-of-magnitude improvement, this isn’t necessarily a binary, true/false “anything less is useless”: simply that anything less than that falls out of the realm of a guaranteed payoff and falls into possibly-conditional territory.

In the modern era, though, when agents can do a fair bit of the Software Development Life Cycle (SDLC), I think that’s where the optimization question gets even more philosophical than Brooks puts it, here. I’m especially curious on the optimization of the essential, thinking about the idea of lossless optimization (the human-in-the-loop maintains a critical understanding of the systems being developed) versus lossy optimization (the human being loses some essential understanding of the systems that they’re responsible for).

Nov 07, 2026

> Growing software organically,

I mean… [I can’t \*not\* bring it up.](https://blog.chaoticgood.computer/content/notes/software-gardening)

Nov 07, 2026

> But, as we look to the horizon of a decade hence, we see no silver bullet

I’m not certain about the range of 1986-1996, but I can at least safely say that we’ve safely hit a couple orders of magnitude of improvement in the last 40 years, even *excluding* LLMs. Designer/developer Martin Keary, in [a recent video about the design and development](https://www.youtube.com/watch?v=8YXRcR5jJqY) of [Notefinder](https://notefinder.com/), mentions that the lead time for an idea entering production can be as low as a few hours. In certain contexts, I notice the same thing: it obviously depends on the urgency of the change, but in a best-case scenario professionally, I’ve seen ideas go from realization -> ideation -> implementation -> review -> release in a day’s time.

Of course, the claim I’ve seen is that agents are another order of magnitude, of which the claim is possibly less certain. While I do think that code implementation is *substantially* faster, speeding up one part of a process does not mean speeding up the whole process by the same degree. Engineer Michael Nygard writes about this in [*AI versus Throughput*](https://www.michaelnygard.com/blog/2026/05/ai-versus-throughput/).

The way I’ve put it, colloquially, is that in a situation where you’re at a physical assembly line and a machine in the middle speeds up by 1000%, you’re not looking at a 1000% increase in productivity across the assembly line. You’re looking at the machine before not moving fast enough, and the machine after catching on fire. In the SDLC, this means that design and ideation aren’t moving fast enough, and that the review process has [largely caught on fire](https://blog.chaoticgood.computer/content/notes/natural-language-cve).

Nov 10, 2026

> in either technology or management technique

*In a world **before** Agile…*

All things considered, I’m glad to see management technique incorporated into an analysis of engineering optimization.

Nov 13, 2026

> which by itself promises even one order of magnitude improvement in productivity, in reliability, in simplicity.

This is also an important addition to the footnote earlier, where I qualify that speed ≠ quality. Quality of software, alone, is a horribly tough thing to try and quantify, and an additionally hard thing to factor into something like deployment lead time. It’s not *un-benchmarkable*: known benchmarks like the [DX Core](https://getdx.com/dx-core-4/) do an advanced set of development KPIs, but one of the key ones – time developing features, versus time developing fixes – is easy enough to do a napkin-level guesstimate if your company uses something like [Conventional Commit standard](https://www.conventionalcommits.org/en/v1.0.0/) or comprehensible [semantic versioning](https://semver.org/). In those cases, it’s the ratio of `feature:` to `fix:`, `chore:`, `perf:`, etc.

Nov 10, 2026

> Skepticism is not pessimism, however. Although we see no startling breakthroughs, and indeed, believe such to be inconsistent with the nature of software, many encouraging innovations are under way.

I’ll be ~~stealing~~ quoting “Skepticism is not pessimism” in my future apologetics around LLMs and agentic development.

Nov 10, 2026

> he transformation of computer manufacture from an assembly industry into a process industry.

It’s important to recognize that Agile was certainly not the dawn of folks suddenly realizing that software development could be an assembly line: Agile was the formalization of a Toyota-style [lean manufacturing](https://www.amazon.com/Lean-Software-Development-Agile-Toolkit/dp/0321150783) approach to development.

I think the concession, here, is that software engineering is a fundamentally different kind of assembly line, compared to the one seen for computer hardware.

Nov 07, 2026

> I divide them into essence−the difficulties inherent in the nature of the software−and accidents−those difficulties that today attend its production but that are not inherent.

Here is that essential and accidental split. I sometimes have to qualify to folks that thinking deep about the act of software development tends to approach pretty closely to the philosophical realm, and here he is popping straight to Aristotle.

Nov 07, 2026

> I believe the hard part of building software to be the specification, design, and testing of this conceptual construct, not the labor of representing it and testing the fidelity of the representation. We still make syntax errors, to be sure; but they are fuzz compared to the conceptual errors in most systems.

This is a massive issue that I broach in both the [Gherkin post](https://blog.chaoticgood.computer/content/dead-math), as well as touching on my own experience trying to resurrect “dead” software, as defined in [Programming as Theory Building](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building).

Nov 07, 2026

> If this is true, building software will always be hard. There is inherently no silver bullet.

I have thoughts on this premise, with the baseline being that speaking in absolutes is an invitation to be wrong, eventually.

To make sure I’m not discounting the point, though, I do think that it’s worth softening it to “The essential part of software engineering is hard(er to optimize)”, which I *have* seen be the case, consistently. I have personally seen that happen with agents, where I’ve found that it is that it has become far easier to optimize away accidentals like syntax errors (given you are using a strategy that relies on [rapid and determinstic feedback](https://blog.chaoticgood.computer/content/notes/software-gardening#feedforward--feedback).

What I’ve found is tricky is speeding up the essentials, without necessarily automating humans out of understanding them. This is for… too many reasons to get into, here, but fundamentally comes down to the constraint that “write code faster” and “help humans understand code faster” are two very, *very* different engineering problems.

Nov 10, 2026

> The complexity of software is in essential property, not an accidental one. Hence descriptions of a software entity that abstract away its complexity often abstract away its essence.

Brooks gets into this later, but… yeah. That also came up in the background research for CASE programs during [Programming as Theory Building](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building). It is *remarkably difficult* to try and visualize programs *in general*. There are some exceptions: [Flowthru](https://blog.chaoticgood.computer/tags/projects/flowthru), for example, lends itself well to a visualization, but that’s only because it constrains its main axis to DAGs, which *are* fairly easy to visualize (unless they get… horrifying). However, there are axes within software that are harder to visualize: Flowthru, for example, has (or would have) a harder time visualizing, say, storage mediums on the main DAG. It’s effectively be an orthogonal axis to the DAG, adding an additional dimensionality.

Brooks also goes on to thoroughly roast flowcharts, specificailly, which I will both a) take brutal offense to and b) understand wholeheartedly.

Nov 07, 2026

> From the complexity comes the difficulty of enumerating, much less understanding, all the possible states of the program, and from that comes the unreliability.

[This section on formal verification and proofs](https://blog.chaoticgood.computer/content/dead-math#why-proofs) talks about this a bit. Even the Red Team’s research into LLMs for formal verification take large amounts of work to model even seemingly straightforward programs: the formal verification for large programs would still, even with today’s technology, be out of the realm of possibility.

Nov 07, 2026

> It creates the tremendous learning and understanding burden that makes personnel turnover a disaster.

This is *exactly* what [Naur talks about](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building#^7ppb5sf3ycw). Turnover, if only one human being has the understanding in their mind, is effectively the resurrection of a project in order to get it back up-to-speed.

This is *somewhat* faster using LLMs, but not entirely faster. This is, again, partially because LLMs alone don’t fundamentally speed up the velocity of *human* understanding: it just increases the speed at which [Boundary Objects](https://maggieappleton.com/planning-agents) can be created. However, large walls of text are not great learning objects, so I believe the optimization here (and for understanding, in in general) is a problem of how LLMs (and humans, for each other) can create better educational materials.

Nov 07, 2026

> No such faith comforts the software engineer. Much of the complexity he must master is arbitrary complexity, forced without rhyme or reason by the many human

I do feel this one deeply. As part of my [dayjob](https://blog.chaoticgood.computer/tags/projects/dayjob), I do a whole lot of address validation, consuming upstream sources of data, and dealing with the *very human institution* of government. It is *filled* with arbitrary structural decisions that both a) takes very long to understand, and can b) change on a whim.

Nov 07, 2026

> In many cases the software must confirm because it has most recently come to the scene. In others it must conform because it is perceived as the most conformable. But in all cases, much complexity comes from conformation to other interfaces; this cannot be simplified out by any redesign of the software alone.

I find myself trying to explain this to other engineers quite often, and my fallback explanation is always that there are *makers* and *takers* of policy. Typically, this is where size matters: if I use a very large upstream data project, and I am but a small fish among their many large-whale customers, I have to take whatever they’ll give me: I lack the authority or power to sway their decision-making. In that position, I am a *taker*.

Conversely, if I am the sole customer of a data project, or if I am creating something that is for myself and a small group of other folks, I can more freely be a *maker* – that is to say, I can make decisions autonomously without much fear that I’ll, say, lose business or alienate anyone.

Software, in general, has some of this baked into the semantic versioning aparatus (e.g. `vX.Y.Z` syntax), where:

-   Z is for patches (small fixes that don’t modify functionality
-   Y is for minor changes (new additive features, performance increases, whatever) that (ideally) won’t break any users’ switching
-   X is for major changes. That is to say: changes that would make a software upgrade not backwards-compatible with prior versions of the software.

It’s not unusual to see early software go through many breaking changes while it’s a maker (no downstream dependencies) rather than taker (has downstream dependencies that it must account for, at risk of losing them).

Nov 07, 2026

> All successful software gets changed. Two processes are at work. As a software product is found to be useful, people try it in new cases at the edge of, or beyond, the original domain. The pressures for extended function come chiefly from users who like the basic function and invent new uses for it. Second, successful software also survives beyond the normal life of the machine vehicle for which it is first written. If not new computers, then at least new disks, new displays, new printers come along; and the software must be conformed to its new vehicles of opportunity.

Gah – this is one that always trips people up when accounting for software. Software is not static: it must be maintained. Even as software becomes abandonware (it no longer receives any update), effort and labor still goes into keeping that software runnable *by future machines*. Take, for example, the [Dolphin Emulator](https://dolphin-emu.org/blog/) for Gamecube/Wii games. Sure, none of those games are getting updates anymore, but that doesn’t mean the work to keep them runnable has (or will ever) end.

Nov 10, 2026

> Software is invisible and unvisualizable.

*Again* with the *absolutes* here, Brooks!

I think “unvisualizable” concedes defeat before the fight has really started out. I’d once again summon up [boundary objects](https://blog.chaoticgood.computer/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces). My personal definition of a good boundary object (without rambling too far) is that a good boundary object is one that gives you the working knowledge you need to do a task.

A [recent video about Britain’s National Energy System Operator](https://www.youtube.com/watch?v=NBXu6Z9Fw_M) is a pretty cool example of visualizations of advanced systems. Ultimately, their main dashboard is not a visualization meant to give a full understanding of the energy grid: it’s to get an immediate working knowledge of any issues worth addressing.

I would accept the claim that software is of a high dimensionality, but that makes it *difficult* to visualize – not impossible. The analogy I’d pull up is [principal component analysis](https://en.wikipedia.org/wiki/Principal_component_analysis), or PCA. For a given system, there may be some “most significant” visualization, or boundary object, that portrays the most essential axis of the software. For Flowthru, that is the DAG. The next visualization might be the next most significant orthogonal projection. Thinking again about Flowthru, this would/could be:

1.  Steps and catalog configurations themselves;
2.  Storage mediums (S3, local system, etc.)

Ultimately, it’s just making sure you understand what a developer’s necessary working knowledge would be, and breaking it down into the necessary visualizations (or other exploratory tools) to drill down to that level (and *just* that level) in order to get that working knowledge.

Nov 13, 2026

> we find it to constitute not one, but several, general directed graphs, superimposed one upon another.

.

Nov 07, 2026

> High-level languages. Surely the most powerful stroke for software productivity, reliability, and simplicity has been the progressive use of high-level languages for programming. Most observers credit that development with at least a factor of five in productivity, and with concomitant gains in reliability, simplicity, and comprehensibility.

While this is definitely the case, I’d say that the boundary where this stops being helpful is dynamically-typed languages. That may be a broad stroke, but I think anything that can’t be effectively linted becomes harder to scale against than is offset by their ease of use.

This is specifically around non-prototyping. That’s worth distinguishing.

Nov 07, 2026

> Moreover, at some point the elaboration of a high-level language becomes a burden that increases, not reduces, the intellectual task of the user who rarely uses the esoteric constructs.

Ah, yeah – this also rings pretty true. This predates the publication of [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) in 1994, which (if I recall – I haven’t read the book since college) talks about the idea of “good abstractions” and “bad abstractions”.

It can absolutely be the case that you (or a language) abstract away too much control, such that either a) some of the conveniences are ignored in the way of being practical, or b) some of the “rules” require carve-outs, which is a slippery slope towards having no rules at all.

Frameworks also have the same… I won’t call it a *problem*, but the same *flavor*. This is not a knock against frameworks (Flowthru is a framework, and I happen to like it) but it’s necessary to understand that there truly is no “silver bullet” among frameworks: just tradeoffs. When the framework fits your use case, then it fits it *very well* – but there truly is no “everything” framework.

Nov 07, 2026

> Time-sharing.

This one is *slightly* dated, so [for context](https://en.wikipedia.org/wiki/Time-sharing): computer hardware used to be *far* more expensive than what it was today. Brooks quotes some figures later with computers being around $2 million ($22 million in 2026 dollars), and then decreasing to *just* $50,000 dollars (~$154,000 in today’s dollars).

As such, companies typically couldn’t buy all that many computers. On top of that, early computers weren’t multi-user: that is to say, you couldn’t have multiple users “logged in”, using the company’s one computer, at once. That’s what “batch programming” was: you had one or two shots a day to run your program, get the results, and then pass access to the next person scheduled to use the computer.

(This was a major perk of UNIX: it was a multi-tenant environment, such that multiple programs could run at once. *That* is what Brooks means by “time sharing”).

Despite being dated (somewhat, although the rise of the $22 million dollar GPU workstation is certainly back in 2026), I feel that this section still has a lot of value if you think of it in terms of “context switching” – having to interrupt your train of thought by multitasking (say, programming while also responding to pings).

Nov 09, 2026

> The slow turnaround of batch programming means that we inevitably forget the minutiae, if not the very thrust, of what we were thinking when we stopped programming and called for compilation and execution. This interruption of consciousness is costly in time, for we must refresh. The most serious effect may well be the decay of grasp of all that is going on in a complex system.

Thinking about this in terms of 1986 versus 2026, batch programming feels more like a “push” in many directions (getting pushed out of the machine your run and results are coming from) versus getting pulled in many directions (juggling LLM sessions, responding to pings)

Nov 07, 2026

> arnas, D.L., “Designing software for ease of extension and contraction,” IEEE Trans. on SE, 5, 2 (March, 1979), pp. 12-138.

[Stashing away for later](https://www.cs.drexel.edu/~yc349/CS680/Readings/Week2/Extension%20and%20Contraction.pdf)

Nov 07, 2026

> The principle effect is to shorten system response time. As it goes to zero, at some point it passes the human threshold of noticeability, about 100 milliseconds. Beyond that no benefits are to be expected.

The idea of shortening system response time is *so underrated* – and far harder than Brooks makes it out to be. I talk about this a lot in both [Software Gardening](https://blog.chaoticgood.computer/content/notes/software-gardening) and its precursor, [Hostage Negotiations](https://blog.chaoticgood.computer/content/notes/hostage-negotiations): rapid, *deterministic* test suites and immediate feedback is important all around, for humans *and* agents alike.

A lot of my attitude on immediate feedback was borne from my time doing [data pipelines on Databricks/PySpark](https://blog.chaoticgood.computer/content/articles/structured-streaming). That was a *particularly bad* case of the opposite: the lead time on running large pipelines (many hours) combined with using an interpreted language like Python meant feedback loops were sometimes measured in days.

Nov 07, 2026

> They attack the accidental difficulties of using programs together, by providing integrated libraries, unified file formats, and piles and filters. As a result, conceptual structures that in principle could always call, feed, and use one another can indeed easily do so in practice.

I haven’t got *too* much to say about this. This is likely the one that is the most dated, since we now live in a *world* of unified file formats and known libraries.

(To anchor this on the timeline: [the PDF format was invented six years after this paper was published](https://en.wikipedia.org/wiki/History_of_PDF)).

The only thing I’d add for the 2026 era is a focus on plaintext formats as a universal standard. When they talk about a unified workbench, it’s important to note that the vast majority of most powerful tools available to developers work against plaintext. There’s no way, for example, to `grep` a Word document.

A minor part of the reason I’ve [latched onto Gherkin](https://blog.chaoticgood.computer/content/dead-math) is because it brings aspects of project management and ownership into plaintext. Once it’s in plaintext, it can go *into* the repository. I feel the same way about documentation, (other) specifications, and even meeting notes: they ought to live in the place that work gets done.

Nov 09, 2026

> Ada’s greatest contribution will be that switching to it occasioned training programmers in modern software design techniques.

Despite most of this section being pretty dated, *this* is some good sauce. I do see some of the LinkedIn types saying that LLMs will eventually program ideas directly in assembly (wOOOOw), but I think that ignores why we use high-level languages in the first place: the opportunity to focus on high-level design.

In the same way I doubt that [A Pattern Language](https://blog.chaoticgood.computer/content/notes/pattern-languages-of-the-neighborhood) could’ve been written if the authors were focused on the exact placement of individual bricks, OOP design patterns would be impossible if there was a constant, ceaseless concern with every byte in memory.

Nov 09, 2026

> Object-oriented programming. Many students of the art hold out more hope for object- oriented programming than for any of the other technical fads of the day.3 I am among them.

We can safely say, with 40 years of hindsight, that this *certainly* stuck around. Considering how many references I’ve already cited to the practice, I’d refer to previous annotations on OOP’s importance.

Nov 09, 2026

> Nevertheless, such advances can do no more than to remove all the accidental difficulties from the expression of the design. The complexity of the design itself is essential; and such attacks make no change whatever in that

I’d once again disagree with this, but it’s nuanced (gross). To me, it comes down to how quickly a program can be understood: in that regard, the advances of pattern languages (in general, but famously applied to OOP) as well as frameworks does truly optimize, or speed up, understanding of the conceptual side of software development.

This is roughly the point in the paper, in my original read-through, where I started thinking about this in terms of “cutting off fat” versus “cutting into muscle”. To me, if somebody were to understand a piece of software in only its abstract pieces, without ever *seeing* a line of code, that would still constitute a real (but optimized) understanding of the process.

Nov 09, 2026

> Artificial intelligence. Many people expect advances in artificial intelligence to provide the revolutionary breakthrough that will give order-of-magnitude gains in software productivity and quality.4

This bit of the paper feels *prescient* when you read it out of context, but it’s so, *so* important to realize that none of the recent discussion around AI in software engineering is new. Part of the background on Programming as Theory Building was the context in which the paper was written. In the mid 1980s, this was at the beginning of [CASE](https://en.wikipedia.org/wiki/Computer-aided_software_engineering) and a lot of promises around the newest chip generation having certain capabilities around expert systems and rules-based programming. It didn’t pan out then, but here we are now.

Nov 07, 2026

> Two quite different definitions of AI are in common use today. AI-1: The use of computers to solve problems that previously could only be solved by applying human intelligence. AI-2: The use of a specific set of programming techniques knows as heuristic or rule-based programming.

If I understand correctly, a distinguishing difference between these two systems would be something like an “AI” chess player (say, [Deep Blue](https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer))) that’s written by humans, in code, to do more advanced tasks. The qualification Brooks has next (that this is a sliding scale) has largely slid off the edge, now that some of the most advanced behaviors are expressed through network weights rather than straight-up code:

Nov 13, 2026

> Mostow, J., ed., Special Issue on Artifical Intelligence and Software Engineering, IEEE Trans. on SE, 11, 11 (nov. 1985).

[Stashing away for later](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1701944)

Nov 07, 2026

> The techniques used for speech recognition seem to have little in common with those used for image recognition, and both are different from those used in expert systems.

Another thing that definitely [didn’t age as well](https://en.wikipedia.org/wiki/Transformer_(deep_learning)).

A really good book on how the history of this approach flipped from “expert-designed expert systems” to “throw as much data as humanly possible to train on” is [*The Worlds I See*](https://www.amazon.com/Worlds-See-Curiosity-Exploration-Discovery/dp/1250897939) by [Dr. Fei-Fei Li](https://en.wikipedia.org/wiki/Fei-Fei_Li), who famously put together the [ImageNet](https://en.wikipedia.org/wiki/ImageNet) dataset. It was the performance of [AlexNet](https://en.wikipedia.org/wiki/AlexNet) on the ImageNet competition that kinda kicked off this whole deep-learning, neural-networking, [transformers-are-all-you-need](https://arxiv.org/pdf/1706.03762) era of computing.

Nov 09, 2026

> An expert system is a program containing a generalized inference engine and a rule base, designed to take input data and assumptions and explore the logical consequences through the inferences derivable from the rule base, yielding conclusions and advice, and offering to explain its results by retracing its reasoning for the user.

I may end up re-reading the section(s) of Dr. Li’s book regarding expert systems, because this is… vaguely reminiscent of the inference mechanism of LLMs, but not quite. Infamously, LLMs can struggle with justifying decisions only after-the-fact, not preserving prior reasoning sessions in future context for the sake of not cluttering up the context.

I would be curious if there *is* any mechanism used by popular harnesses, by which LLMs can directly reference prior reasoning rounds as though they’re data rather than conversational context. That doesn’t seem like a particularly novel idea, so if it *hasn’t* been done, so if it hasn’t, I wonder if that’s related to a general understanding that [judging LLMs based on their train-of-thought is a dangerous practice](https://cdn.openai.com/pdf/34f2ada6-870f-4c26-9790-fd8def56387f/CoT_Monitoring.pdf) (with a fantastic [explainer video](https://www.youtube.com/watch?v=Xx4Tpsk_fnM) to boot).

Nov 09, 2026

> Inference engine technology is developed in an application-independent way, and then applied to many uses.

.

Nov 09, 2026

> The changeable parts of the application-peculiar materials are encoded in the rule base in a uniform fashion, and tools are provided for developing, changing, testing, and documenting the rule base. This regularizes much of the complexity of the application itself.

.

Nov 09, 2026

> Edward Feigenbaum says that the power of such systems does not come from ever- fancier inference mechanisms, but rather from ever-richer knowledge bases that reflect the real world more accurately.

In trying to find the correct reference for this citation, I believe I’ve found the correct Feigenbaum reference: [Knowledge Engineering: The Applied Side of Artificial Intelligence](https://stacks.stanford.edu/file/druid:qy055zd8682/qy055zd8682.pdf) (1980)

This is also uncanny, considering the later recognition that certain deep learning techniques absolutely thrive with more and more data added to them.

Nov 09, 2026

> helping in lifelong maintenance and modification testing

.

Nov 09, 2026

> finding articulate, self-analytical experts who know why they do things

.

Nov 09, 2026

> The most powerful contribution of expert systems will surely be to put at the service of the inexperienced programmer the experience and accumulated wisdom of the best programmers. This is no small contribution. The gap between the best software engineering practice and the average practice is very wide−perhaps wider than in any other engineering discipline. A tool that disseminates good practice would be important.

.

Nov 09, 2026

> For almost 40 years

.

Nov 09, 2026

> n short, automatic programming always has been a euphemism for programming with a higher-level language than was presently available to the programmer.

.

Nov 09, 2026

> He argues, in essence, that in most cases it is the solution method, not the problem, whose specification has to be given.

.

Nov 09, 2026

> Exceptions can be found. The technique of building generators is very powerful, and it is routinely used to good advantage in programs for sorting.

.

Nov 10, 2026

> These applications have very favorable properties: The problems are readily characterized by relatively few parameters. There are many known methods of solution to provide a library of alternatives. Extensive analysis has led to explicit rules for selecting solution techniques, given problem parameters.

.

Nov 10, 2026

> In the first place, as I have argued elsewhere, the flow chart is a very poor abstraction of software structure.

.

Nov 09, 2026

> In the pitiful, multipage, connection-boxed form to which the flow chart has today been elaborated, it has proved to be essentially useless as a design-tool programmers draw flow charts after, not before, writing the programs they describe.

.

Nov 09, 2026

> Second, the screens of today are too small, in pixels, to show both the scope and the resolution of any serious detailed software diagram.

.

Nov 09, 2026

> Moreover, when fits of creativity run strong, more than one programmer or writer has been known to abandon the desktop for the more spacious floor.

.

Nov 09, 2026

> we feel only one dimension of the intricately interlocked software elephant.

.

Nov 09, 2026

> I do not believe we will find the magic here. Program verification is a very powerful concept, and it will be very important for such things as secure operating system kernels. The technology does not promise, however, to save labor. Verifications are so much work that only a few substantial programs have ever been verified.

.

Nov 09, 2026

> Mathematical proofs also can be faulty. So whereas verification might reduce the program-testing load, it cannot eliminate it.

.

Nov 09, 2026

> The hardest part of the software task is arriving at a complete and consistent specification, and much of the essence of building a program is in fact the debugging of the specification.

.

Nov 09, 2026

> Perhaps the biggest gain yet to be realized in the programming environment is the use of integrated database systems to keep track of the myriads of details that must be recalled accurately by the individual programmer and kept current in a group of collaborators on a single system.

.

Nov 09, 2026

> Compiling could stand a boost, but a factor of 10 in machine speed would surely leave think-time the dominant activity in the programmer’s day. Indeed, it appears to be so now.

.

Nov 09, 2026

> If, as I believe, the conceptual components of the task are now taking most of the time, then no amount of activity on the task components that are merely the expression of the concepts can give large productivity gains.

.

Nov 09, 2026

> attacks that address the essence of the software problem, the formulation of these complex conceptual structures.

.

Nov 09, 2026

> Buy versus build. The most radical possible solution for constructing software is not to construct it at all.

.

Nov 09, 2026

> he personal computer revolution has created not one, but m any, mass markets for software.

.

Nov 09, 2026

> Any such product is cheaper to buy than to build afresh

.

Nov 09, 2026

> The development of the mass market is, I believe, the most profound long-run trend in software engineering. The cost of software has always been development cost, not replication cost.

On the economic front, that is a very important distinguishing quality between the manufacture of software versus the manufacture of other, physical goods. With software, the marginal cost of each unit you produce is effectively zero: it’s basically the cost of pushing a distributable up to a server, and the cost of you downloading it.

Netflix is always the example I use when describing this to somebody. How much do you think Netflix has to pay when a new subscriber joins the platform? It’s very low: effectively, the only thing they actually need to account for on their per-user cost is the computing resources to transcode video and send it to your device. If the whole world decided to have a Netflix subscription, the company would need to run more servers, but that small uptick in infrastructure cost would hardly stop the champagne from flowing at the shareholder party celebrating their absolute global dominance.

Nov 09, 2026

> users would not use off-the-shelf packages for payroll, inventory control, accounts receivable, etc. The requirements were too specialized, the case-to-case variation too high.

.

Nov 09, 2026

> The big change has been in the hardware/software cost ratio. The buyer of a $2- million machine in 1960 felt that he could afford $250,000 more for a customized payroll program, one that slipped easily and nondisruptively into the computer-hostile social environment. Buyers of $50,000 office machines today cannot conceivably afford customized payroll programs; so they adapt their payroll procedures to the packages available. Computers are now so commonplace, if not yet so beloved, that the adaptations are accepted as a matter of course.

.

Nov 10, 2026

> Many users now operate their own computers day in and day out on varied applications without ever writing a program. Indeed, many of these users cannot write new programs for their machines, but they are nevertheless adept at solving new problems with them.

.

Nov 10, 2026

> The same strategy, with simple programming capabilities, will also work for hundreds of laboratory scientists.

.

Nov 10, 2026

> Requirements refinement and rapid prototyping. The hardest single part of building a software system is deciding precisely what to build.

.

Nov 10, 2026

> For the truth is, the clients do not know what they want.

.

Nov 10, 2026

> Even the simple answer−”Make the new software system work like our old manual information-processing system” −is in fact too simple.

.

Nov 10, 2026

> I would go a step further and assert that it is really impossible for clients, even those working with software engineers, to specify completely, precisely, and correctly the exact requirements of a modern software product before having built and tried some versions of the product they are specifying.

.

Nov 10, 2026

> The purpose of the prototype is to make real the conceptual structure specified, so that the client can test it for consistency and usability

.

Nov 10, 2026

> Much of present-day software acquisition procedures rests upon the assumption that one can specify a satisfactory system in advance, get bids for its construction, have it built, and install it. I think this assumption is fundamentally wrong, and that many software acquisition problems spring from that fallacy.

[https://agilemanifesto.org/authors.html](https://agilemanifesto.org/authors.html)

Nov 10, 2026

> Incremental development−grow, not build, software.

.

Nov 10, 2026

> The building metaphor has outlived its usefulness

.

Nov 10, 2026

> Let us turn to nature and study complexity in living things, instead of just the dead works of man. Here we find constructs whose complexities thrill us with awe. The brain alone is intricate beyond mapping, powerful beyond imitation, rich in diversity, self- protecting, and self-renewing. The secret is that it is grown, not built.

.

Nov 10, 2026

> Mills, H. D., “Top-down programming in large systems,” Debugging Techniques in Large Systems, R. Rustin, ed., Englewood Cliffs, N.J., Prentice-Hall, 1971.

.

Nov 10, 2026

> The morale effects are startling. Enthusiasm jumps when there is a running system, even a simple one.

.

Nov 10, 2026

> Programmers are among the most intelligent part of the population, so they can learn good practice.

.

Nov 10, 2026

> Whereas the difference between poor conceptual designs and good ones may lie in the soundness of design method, the difference between good designs and great ones surely does not.

.

Nov 10, 2026

> The differences between the great and the average approach an order of magnitude.

.

Nov 10, 2026

> Boehm, B. W., “A spiral model of software development and enhancement,” Computer, 20, 5 (May, 1985), pp. 43-57.

.

Nov 10, 2026

> My first proposal is that each software organization must determine and proclaim that great designers are as important to its success as great managers are, and that they can be expected to be similarly nurtured and rewarded. Not only salary, but the perquisites of recognition−office size, furnishings, personal technical equipment, travel funds, staff support−must be fully equivalent.

.

Nov 10, 2026

> Devise and maintain a career development plan for each prospect, including carefully selected apprenticeships with top designers, episodes of advanced formal education, and short courses, all interspersed with solo design and technical leadership assignments.

.

Nov 10, 2026

> Provide opportunities for growing designers to interact with and stimulate each other.

.

Nov 10, 2026

## Footnotes

1.  Technically, [essential and accidental](https://en.wikipedia.org/wiki/Accident_(philosophy)) is Aristotle’s territory, but I’m not certain Aristotle had many passionate opinions about the act of software development. From what I can tell, he also focused more on nouns (e.g. what is a chair, *really?*), while Brooks focuses more on the trade of software engineering itself. ↩
    
2.  He actually does talk about generative AI and expert systems. These promises have been on the horizon for awhile now. I talk more about that in [Programming as Theory Building](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building) ↩
    
3.  I’m not claiming quality, here: just speed. ↩
