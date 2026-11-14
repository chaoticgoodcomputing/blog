# Planning With Agents: Better can be Better

> Annotations on Maggie Appleton's 2026 talk about Boundary Objects

- Page: https://blog.chaoticgood.computer/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces
- Author: Spencer Elkington
- Published: 2026-11-06
- Updated: 2026-11-06
- Tags: engineering/ai, writing/annotations, writing/fragments

---

This post (along with a recent Hank Green video about [the Navier-Stokes equation](https://www.youtube.com/watch?v=LvvG21CpaS4&t=1599s)) is a major inspiration for both the [Math is Dead](https://blog.chaoticgood.computer/content/dead-math) post, and an upcoming sister post around (what ended up being defined, here, as) Boundary Objects.

Here are some of my notes around the post, as well as my experience using Chopin as a multiplayer harness.

From [Planning with Agents: Divided Worlds, Boundary Objects, and Thicker Interfaces](https://maggieappleton.com/planning-agents) on maggieappleton.com

## Annotations

[> [!quote] Quote
>
> When you or I start planning with an agent today, we’re in our CLI or desktop app of choice, alone, and we usually begin in some kind of plan mode or with the /grill-me skill enabled, and then proceed to answer 40 multiple-choice questions.](https://maggieappleton.com/planning-agents#:~:text=really%20not%20good.-,When%20you%20or%20I%20start,to%20answer%2040%20multiple%2Dchoice%20questions.,-We%20get%20tired)

It is *so important* to understand, conceptually, that `grill` is both a step forward in minimizing “hallucination” (which I’d define as just imprecise definition of a problem that folks truly misdiagnose at this point), but is far from a perfect solution.

Nov 06, 2026

[> [!quote] Quote
>
> Eventually, the agent stops asking questions and gives me a huge wall of Markdown to read. Then it asks: do you approve this plan, yes or no?There are some very obvious problems here. Especially in a CLI interface, I can’t edit the plan directly. The plan almost always has open questions in it, despite the grilling process, and I don’t have an interface for answering them.](https://maggieappleton.com/planning-agents#:~:text=of%20our%20knowledge.-,Eventually%2C%20the%20agent%20stops%20asking,an%20interface%20for%20answering%20them.,-I%20can%E2%80%99t%20pause)

As the person who introduced skills in general to my team/company, it is a very difficult thing to try and balance two truths:

1.  `/grill` is a better way to make sure agents have the information they need to successfully draw in the lines (feedforward); and
2.  It’s *very, very* imperfect.

It’s the subtlety that a solution can be better than nothing, but *far* from perfect.

Nov 06, 2026

[> [!quote] Quote
>
> A lot of why this is a difficult problem to solve boils down to humans and agents being very different kinds of beings, with very different worlds, that are only partially legible to one another.](https://maggieappleton.com/planning-agents#:~:text=and%20complex%20problem%2Dsolving.-,A%20lot%20of%20why%20this,partially%20legible%20to%20one%20another.,-Let%E2%80%99s%20go%20back)

The recent Navier-Stokes kerfuffle is a huge highlight of this: the fact that the proof is there, but that we don’t understand it, is exactly what [Hank Green](https://www.youtube.com/watch?v=LvvG21CpaS4) talks about in his recent video with Grant Sanderson (3blue1brown) about understanding and elegance: we (through agents) have proven something that we (as people) do not yet understand.

Nov 06, 2026

[> [!quote] Quote
>
> These kinds of rich, interactive plans are what I’m currently exploring in a project called Chopin . This is a multiplayer, real-time planning prototype that my coworker Krzysztof and I are making.It’s currently a very basic proof of concept and exploration space.](https://maggieappleton.com/planning-agents#:~:text=answering%20other%20questions.-,These%20kinds%20of%20rich%2C%20interactive,of%20concept%20and%20exploration%20space.,-You%20have%20your)

Pulling and using Chopin with my team was, genuinely, the most mind-blowing moment that lit up “multiplayer” in all of our minds. I talk about this a bit in Season of Stamps, but a lot of my time in the last two years has been spent talking to robots *alone*. I was having trouble deciding if the problem in that state of affairs was the “robots” part, or the “alone” part.

Getting to properly use a multiplayer harness pretty definitively answers: it’s the *alone* part.

While there’s little ticky-tack things about Chopin that I had trouble with (notably, having to cobble together a local-first model, without the need for API tokens), it was greatly illuminating.

In my mind, to be multiplayer, the architecture of these types of harnesses should truly leverage actual game development prior art. The one that rattles around my brain is the idea of a [Listen Server](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.5/manual/learn/listenserverhostarchitecture.html) architecture. The best example I can think of is Minecraft’s join-by-LAN feature. Whenever you play single-player Minecraft, you are *secretly* playing a multiplayer server by yourself.

I think that the future of harnesses *is* listen server architecture: multiplayer by default, even if you are alone.

Nov 06, 2026

[> [!quote] Quote
>
> It’s built with MDX.](https://maggieappleton.com/planning-agents#:~:text=of%20interactive%20visuals.-,It%E2%80%99s%20built%20with%20MDX.,-I%20didn%E2%80%99t%20touch)

You may’ve noticed this on my own blog, just in the general uptick of diagrams and graphs in the last ~12 months, but it is easier than ever to add interactivity to static pages. At this point, I think any multiplayer harness that *doesn’t* leverage MDX (over pure Markdown like an agent outputs in a TUI) is seriously, fundamentally lacking.

Nov 06, 2026
