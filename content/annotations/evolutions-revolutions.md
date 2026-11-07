# Evolution and Revolution as Organizations Grow

> Annotations for Greiner's 1972 paper "Evolution and Revolution as Organizations Grow", about the structural composition of organizations at different sizes and requirements.

- Page: https://blog.chaoticgood.computer/content/annotations/evolutions-revolutions
- Author: Spencer Elkington
- Published: 2026-01-28
- Updated: 2026-11-02
- Tags: economics/management, writing/annotations

---

I pulled up this paper because of how prevalent some of its terminology is among managers I’ve worked with. It’s always best to go back to the horse’s mouth, and — as far as I can tell — this is the original source of the terminology around phases of an organization’s growth; namely:

1.  Creativity Phase (founder)
2.  Direction Phase (startup)
3.  Delegation Phase (tiered management)
4.  Coordination Phase (centralizing new systems)
5.  Collaboration Phase (…fantasy land. more on this later).

I have often found myself working at small-ish companies (or, at the very least, smaller subsidiaries of much larger organizations), and a lot of these come up in engineering systems for project management and developer experience.

I’ve read this a few times before, and mulled over the concepts. I want to record them here and — perhaps — do another run through this document a few years down the road, as I experience more of companies through time, growth, and these phases.

Also, I’ve had this in my bookmarks for a year, now, and need to clean that sucker out.

Source document: [pantherspassionpolitics.com](https://pantherspassionpolitics.com/wp-content/uploads/2026/06/greiner-organisational-growth.pdf)

## Annotations

> A small research company chooses too complicated and formalized an organization structure for its young age and limited size. It flounders in rigidity and bureaucracy for several years and is finally acquired by a larger company.

Well, that was immediate. I can’t believe I missed this last time.

Back in college, I was the president of an \[public/content/notes/utah-office-consult\](engineering organization) that, for a very long time, suffered from the opposite problem — a lack of concrete structures meant that progress was lost often, particularly in the critical turnover period as students graduated out.

That presentation was one arm of trying to establish self-correcting systems. However, I also, admittedly, took it a bit too far. Establishing a new constitution, setting up systems for documentation, etc.

It was exactly this. The organization was too small to have that formalized a structure. Especially because of the lack of any long-term through-line in the form of alumni involvement, all of that fell apart… immediately, if I recall correctly.

What a flashback!

Jan 28, 2026

Thinking about this more — I’ve definitely done the same thing to some CGC work. Oops.

Jan 28, 2026

> Moreover, the inability of management to understand its organization development problems can result in a company becoming "frozen" in its present stage of evolution or, ultimately, in failure, regardless of market opportunities.

I’ve seen this flavor a few times, both in places I’ve worked and when chatting with friends and colleagues about their own situations.

This “frozen” is something that a colleague described perfectly in my mind awhile back. The halted progress caused the direction of the company to become “get acquired at all costs”, fully stifling any forward progress and leaving us in a state that my colleague called “benign negligence”.

No gripes with that — if that’s the game, that’s the game — but the young millennial in me, raised to find enjoyment and satisfaction in forward progress, found that situation absolutely unbearable.

Jan 28, 2026

> I have drawn from the legacies of European psychologists (their thesis being that individual behavior is determined primarily by previous events and experiences, not by what lies ahead).

I can already see this taking a far more qualitative tilt than I’d prefer. I know that this is the basis for actual organizational hierarchy design and research (yay, graph theory!) so I may need to queue up more modern citations of this paper that go in a more data-focused direction, for my own sanity.

Jan 28, 2026

> Strategy and Structure

I’d considered renaming the tag for this `economics/management`, but this citation will keep `economics/strategy` in circulation for awhile longer.

Jan 28, 2026

> largely because they developed in a time of explosive markets and technological advances.

Oooooo, baby — [we’re so back](https://blog.chaoticgood.computer/tags/engineering/ai)

Jan 28, 2026

> I have termed these turbulent times the periods of revolution because they typically exhibit a serious upheaval of management practices. Traditional management practices, which were appropriate for a smaller size and earlier time, are brought under scrutiny by frustrated top managers and disillusioned lower-level managers. During such periods of crisis, a number of companies fail--those unable to abandon past practices and effect major organization changes are likely either to fold or to level off in their growth rates.

This is a good crossover into the [current overturn of the software engineering industry with the introduction of AI agents](https://blog.chaoticgood.computer/tags/engineering/ai). I think something that has started to separate out engineers is management prowess —in the span of about 6 months, the job became “take a ticket and write some code” to “here’s a fleet of automated interns — delegate to them”. Engineering becomes a blend of theorycrafting — actually architecting systems effectively — as well as doing so in a way that can be parallelized across many code-writing agents. It’s a level of management prowess that engineers aren’t trained to do in core programs, which has really freaked some of us out.

Jan 28, 2026

> Companies therefore experience the irony of seeing a major solution in one time period become a major problem at a later date.

Yeesh. That’s Terraform in a nutshell.

Terraform was a fantastic way to transition from clickopsed deployment systems into Infrastructure as Code (IaC), but hot damn is it a tanker of a process. The irony is that transitioning from Terraform to AWS CDK is exactly this — trying to resolve something that was a solution a few years ago, but has become a massive PITA.

Jan 28, 2026

> For example, a company in a rapidly expanding market will have to add employees rapidly; hence, the need for new organization structures to accommodate large staff increases is accelerated. While evolutionary periods tend to be relatively short in fast-growing industries, much longer evolutionary periods occur in mature or slowly growing industries.

I saw this a lot in my time at [M Science](https://blog.chaoticgood.computer/resume). I was originally hired as an initial round of picks for a local field office for the company. They threw out a $10,000/head referral bonus (which is, by far, the most generous I’ve ever even *heard* of), so I took that chance. The team pretty quickly grew from 3 to… I think somewhere around 12? There was always a tension between working as a field office, versus a dozen individual people from different silos of the company that just happened to work in the same room.

Jan 28, 2026

> The principal implication of each phase is that management actions are narrowly prescribed if growth is to occur. For example, a company experiencing an autonomy crisis in Phase 2 cannot return to directive management for a solution--it must adopt a new style of delegation in order to move ahead.

I’m a bit curious about this. Growing is hard — I’ve seen companies try to move up to the next phase, something gets in the way of that revolution, and then it kinda just… goes back to the way it was, but incrementally worse. I think that’s where the concept of benign negligence comes from — a feeling of “well, we tried to grow, couldn’t, and so it’s time to sit here until somebody eats us.”

Jan 28, 2026

> Control of activities comes from immediate marketplace feedback: the management acts as the customers react.

Well, I’ve certainly seen this reactionary method in other companies past this one — I’ll reserve judgement, there. This is a general review, after all.

Jan 28, 2026

> Increased numbers of employees cannot be managed exclusively through informal communication; new employees are not motivated by an intense dedication to the product or organization

Now *this* one is zesty. Organizations are often in *some* kind of tree structure, and this is a great example of “trees are made of smaller subtrees.” You absolutely don’t need to be in an organization of this phase to be in a *team* of this phase. Especially on engineering teams — where people get the most joy out of the *engineering* of it all — I’ve seen a lot of cases where the most talented engineer is promoted up to a managerial position, and struggle with giving up the work they feel is most satisfying in favor of the work that is “the next step in their career.”

I’m absolutely *not* a military guy — I wouldn’t be able to get past boot camp, certainly — but I do think that they have a fantastic structure for actually delineating these. There’s specialist paths — progressing into becoming the best at a specific domain — and leadership paths — leading specialists into getting a task done.

I’ve seen over, and over, and over again, situations where this distinction isn’t made, and the most talented **specialist** is bubbled up through the leadership path. It’s not what they want — perhaps it’s not even what’s best — and it usually gives the illusion of solving a problem in the most literal “see, it’s an org tree now!” sense, without solving the actual scaling problem that prompted the promotion to begin with.

Jan 28, 2026

> Quite obviously, a strong manager is needed who has the necessary knowledge and skill to introduce new business techniques. But this is easier said than done. The founders often hate to step aside even though they are probably temperamentally unsuited to be managers.

This is precisely why politicians in office **always** have a chief of staff. There’s a separation of concerns — one is responsible for directing the ship, and the other is responsible for making sure there’s an apparatus that pushes the enterprise forward.

Jan 28, 2026

> A functional organization structure is introduced to separate manufacturing from marketing activities, and job assignments become more specialized

This is part of the reason I lament “full-stack developer” as a job title. If you’re a full-stack developer on a product team of more than, say, 3 people, you’re not a “full-stack developer” — you’re just being overworked.

Jan 28, 2026

> managing by exception

What’s funny about “managing by exception” is that it feels far more like Phase 1’s mention of reacting to customers. This does mesh with the Phase 1 -> Phase 2 -> Phase 3 corrections, though — 1->2 is “There’s too much work to not be actively managed, so incorporate stronger management” and 2->3 is almost a correction for the increased organizational subtrees, where the problem is “the entireprise is now too large to be micromanaged.”

Jan 28, 2026

> Autonomous field managers prefer to run their own shows without coordinating plans, money. technology, and manpower with the rest of the organization.

Oh, Christ — the *silos*

This is one that absolutely kills me inside. I’d like to think, of the few things I can naturally stick to, one of them is “try not to make the same mistake twice.” When teams get siloed, you effectively fracture any level of enterprise experience into these little islands that don’t talk to each other. It’s such an insidious inefficiency, and *so hard* to consolidate after-the-fact. That’s some write-a-book-about-it level cleanup.

This is one of the things I love, love, love about (the idea of) [Backstage](https://backstage.io/). It’s such a brilliant solution — a common pattern to document the holy hell out of a bunch of separate repositories (after all, you can only mono- your repo so hard). I think that this is one of the massive promises of LLM agents — being able to maintain these larger specifications without much developer overhead. Obviously, easier said than done, but that’s what a promise is.

Jan 28, 2026

> Decentralized units are merged into product groups.

Alright, M Science — I underestimated your game.

This pattern does bring into some clarity the separating off of the field office members into other, remote product teams. While I can’t say for certain if this was an intentional organizational design pattern or just a spur-of-the-moment decision, but I’ll give it more credit than I did previously. Admittedly, it was this *exact* move that *demonstrated* the siloing, bringing the more insidious inefficiencies to light because we were on different teams, but got to find common patterns in our work — usually over lunch.

Jan 28, 2026

> Certain technical functions, such as data processing, are centralized at headquarters, while daily operating decisions remain decentralized.

Ironically, most of the data scientists and engineers I know work remotely. Some of that is a general air of “…who gives a shit where you work? Just make the spreadsheets and you’ll be fine.”

Jan 28, 2026

> . . & the red tape crisis: But a lack of confidence gradually builds between line and staff, and between headquarters and the field. The proliferation of systems and programs begins to exceed its utility; a red-tape crisis is created.

See, I think this is where my own experience is starting to lapse. What I will say, though, is that I’ve heard of this from folks I know working at far larger companies.

The most relevant example is a friend who, at work, has a team above him responsible for IDE configurations. That’s something that never even crossed my mind until he brought it up — a team of people dedicated to taking a `.vscode` folder and forcibly applying it to **every developer’s IDE**.

That’s a level of red tape that I’d want to hang myself with.

(I should note — for security reasons, especially in the era of piping code up to cloud-based LLM agents, this obviously a boon for security reasons. However, it’d take a *lot* of getting used to.)

Jan 28, 2026

> task-group

I’ll need to look up if this is a technical term, or a more business-y “synergy”-type phrase.

Jan 28, 2026

> A matrix-type structure is frequently used to assemble the right teams for the appropriate problems.

Okay!! Now we’re getting into the graphs of it all. Unfortunately, no citation on this, which limits how far I can chase this concept down the rabbit hole.

Jan 28, 2026

> Conferences of key managers are held frequently to focus on major problem issues.

What’s pretty weird about my current team is that we’re about… 9 developers, supporting a massive hierarchy of hundreds of sales reps all across the country. They do have conferences where they get together — and every once in a blue moon, (most of) the tech team gets together and holes up in a small conference room for a week.

Jan 28, 2026

> the ? crisis: What will be the revolution in response to this stage of evolution?

This’ll be another thing I’ll need to trace up to modern management research.

If I had to take a stab at it, myself: I doubt that there’s not *many* phases outside of these. I think that organizations, as subgraphs of the org chart become clear, end up with many different spots in many different phases.

Where I think this may be different, though, is in the longitudinal data now available around company restructuring. I remember seeing this in the transitionary period out of COVID, and into LLMs — companies like Meta, Google, and others cutting out a lot of the management-level labor from their organizations in an effort to flatten the hierarchy.

This feels in direct contention with the concept from the top of the paper — that companies, in order to grow, go forward and never backward. Even thinking about it in these terms of “forward” and “backward” doesn’t feel apt. It’s more a reaction to new technology that shapes these types of things.

Jan 28, 2026

*Although…* While I don’t think this applies at *all* to corporate America, I do like this set of habit and reflective structures that they’ve brought up, here. I’ll keep an eye on that — it feels an awful lot like [horticulture.](https://blog.chaoticgood.computer/tags/horticulture)

Jan 28, 2026

> We may even see companies with dual organization structures: a "habit " structure for getting the daily work done, and a "reflective" structure for stimulating perspective and personal enrichment. Employees could then move back and forth between the two structures as their energies are dissipated and refueled.

Woof. Swing and a miss, there. Perhaps this was true in the era of FAANG software engineers and the levels of perks they got, but that’s *certainly* no longer the case.

Jan 28, 2026

> One European organization has implemented just such a structure. Five reflective groups have been established outside the regular structure for the purpose of continuously evaluating five task activities basic to the organization. They report directly to the managing director, although their reports are made public throughout the organization. Membership in each group includes all levels and functions, and employees are rotated through these groups on a six-month basis.

Hot damn, Greiner — you’ve gotta site your sources on these types of things.

Jan 28, 2026

> establishing a four-day workweek,

Okay — so this has been a pipe dream for awhile, now.

Jan 28, 2026

> To me this type of reaction is a useful test of the model's validity.

Okay — a vibes check. Not necessarily bad.

Jan 28, 2026

> Know where you are in the developmental sequence.

That’d be a fun exercise — a private note implementing this analysis on my current job.

Jan 28, 2026

> and its component parts are at different stages of development.

Aha! There it is — the component parts. *That’s* the subgraph fuckery I was hoping for.

Jan 29, 2026

> Managers often fail to realize that organizational solutions create problems for the future (i.e., a decision to delegate eventually causes a problem of control).

Okay, this is twisty. In my experience, I’ve seen an exact mirror image of this issue — organizational pattern changes are proposed, and then people look far enough into the future to say “well, this won’t scale!” Additionally, there’s somewhat a reflex to look at legacy (or existing) structures and see them in the same way folks might see legacy code — something opaque, where the system has grown temporally distant from the decisions made to *make* that system.

That’s something that I, myself, have been trying to be better about — not reflexively seeing something that has worked for a long time, but no longer works, as `= bad`.

A lot of that has been getting waterboarded by enough legacy code that it’s a matter of “just let sleeping dogs lie” but some of that is not rushing to judgement about the merits of a current system, or evaluating proposed systems in a way that strangles progress.

Jan 29, 2026

> CONCLUDING NOTE

I’ll hijack this header for my *own* concluding notes.

I like this paper. This is something I’ve tried my best to impart on engineers — the same design patterns that we use in our fields can also be applied to methods for organizing people.

I do want to read more diving into the quantitative graph-structure version of this analysis that I’ve seen across a few places. It harkens back to that aside about “matrix-structure”, which does have an actual technical definition.

I am curious if it’d be possible to create a graph parser for an org chart to identify things like bottlenecks, subgraphs, and potentially identify both the global and local graph phases on a technical level. I think that’d be a fun project — I’ll keep this note in mind for a future me.

Jan 29, 2026
