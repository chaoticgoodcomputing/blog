---
title: "Planning With Agents: Better can be Better"
date: 2026-11-06
updated: 2026-11-17
tags:
  - engineering/ai
  - writing/annotations
  - writing/fragments
description: Annotations on Maggie Appleton's 2026 talk about Boundary Objects
annotation-pages:
annotation-target: "https://maggieappleton.com/planning-agents"
annotation-target-type: web
annotation-public: true
---

This post (along with a recent Hank Green video about [the Navier-Stokes equation](https://www.youtube.com/watch?v=LvvG21CpaS4&t=1599s)) is a major inspiration for both the [[public/content/dead-math|Math is Dead]] post, and an upcoming sister post around (what ended up being defined, here, as) Boundary Objects.

Here are some of my notes around the post, as well as my experience using Chopin as a multiplayer harness.

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:001d94e9-971b-43ad-ae98-fa5da09e3965","type":"Annotation","motivation":"commenting","body":{"id":"#^vn343q2472","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[77]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[77]/p[2]","endOffset":234},{"type":"TextPositionSelector","start":12797,"end":13172},{"type":"TextQuoteSelector","exact":"Eventually, the agent stops asking questions and gives me a huge wall of Markdown to read. Then it asks: do you approve this plan, yes or no?There are some very obvious problems here. Especially in a CLI interface, I can’t edit the plan directly. The plan almost always has open questions in it, despite the grilling process, and I don’t have an interface for answering them.","prefix":"side the scope of our knowledge.","suffix":"I can’t pause on any of the ques"}]},"created":"2026-11-06T07:32:43.622Z","modified":"2026-11-06T07:32:43.622Z","hypothesis":{"id":"aPaKcOL8EfGEeactyV3JNg","digest":"1af7b285821d9f"}}
> ```
> %%
> As the person who introduced skills in general to my team/company, it is a very difficult thing to try and balance two truths:
>
> 1. `/grill` is a better way to make sure agents have the information they need to successfully draw in the lines (feedforward); and
> 2. It's *very, very* imperfect.
>
> It's the subtlety that a solution can be better than nothing, but *far* from perfect.
^vn343q2472


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:50cd5104-55b0-4f3c-b70b-e51d076bb083","type":"Annotation","motivation":"commenting","body":{"id":"#^30g5wi0j7gk","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[119]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[119]/p[2]","endOffset":67},{"type":"TextPositionSelector","start":30178,"end":30455},{"type":"TextQuoteSelector","exact":"These kinds of rich, interactive plans are what I’m currently exploring in a project called    Chopin    . This is a multiplayer, real-time planning prototype that my coworker    Krzysztof     and I are making.It’s currently a very basic proof of concept and exploration space.","prefix":"e I’m answering other questions.","suffix":"You have your coworkers and agen"}]},"created":"2026-11-06T16:07:30.553Z","modified":"2026-11-06T16:17:25.457Z","hypothesis":{"id":"aRulbOL8EfGv8ev73B721A","digest":"1d6c3280b02331"}}
> ```
> %%
> Pulling and using Chopin with my team was, genuinely, the most mind-blowing moment that lit up "multiplayer" in all of our minds. I talk about this a bit in Season of Stamps, but a lot of my time in the last two years has been spent talking to robots *alone*. I was having trouble deciding if the problem in that state of affairs was the "robots" part, or the "alone" part. 
>
> Getting to properly use a multiplayer harness pretty definitively answers: it's the *alone* part.
>
> While there's little ticky-tack things about Chopin that I had trouble with (notably, having to cobble together a local-first model, without the need for API tokens), it was greatly illuminating.
>
> In my mind, to be multiplayer, the architecture of these types of harnesses should truly leverage actual game development prior art. The one that rattles around my brain is the idea of a [Listen Server](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.5/manual/learn/listenserverhostarchitecture.html) architecture. The best example I can think of is Minecraft's join-by-LAN feature. Whenever you play single-player Minecraft, you are *secretly* playing a multiplayer server by yourself.
>
> I think that the future of harnesses *is* listen server architecture: multiplayer by default, even if you are alone.
^30g5wi0j7gk


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:a08f4fbb-2f91-4bc3-9dfe-90602888e60b","type":"Annotation","motivation":"commenting","body":{"id":"#^r5wgo27wz2q","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[120]/p[1]","startOffset":136,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[120]/p[1]","endOffset":156},{"type":"TextPositionSelector","start":30591,"end":30611},{"type":"TextQuoteSelector","exact":"It’s built with MDX.","prefix":"es lots of interactive visuals. ","suffix":"I didn’t touch on the social pie"}]},"created":"2026-11-06T16:18:43.826Z","modified":"2026-11-06T16:18:43.826Z","hypothesis":{"id":"aUCPEuL8EfGuHDvVdNC3cg","digest":"16bde5e822e576"}}
> ```
> %%
> You may've noticed this on my own blog, just in the general uptick of diagrams and graphs in the last ~12 months, but it is easier than ever to add interactivity to static pages. At this point, I think any multiplayer harness that *doesn't* leverage MDX (over pure Markdown like an agent outputs in a TUI) is seriously, fundamentally lacking.
^r5wgo27wz2q


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:6c7134b0-2db6-4cbb-a63c-eb1f615721e2","type":"Annotation","motivation":"commenting","body":{"id":"#^ny92rr4q7ij","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[75]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[75]/p[1]","endOffset":247},{"type":"TextPositionSelector","start":12233,"end":12480},{"type":"TextQuoteSelector","exact":"When you or I start planning with an agent today, we’re in our CLI or desktop app of choice, alone, and we usually begin in some kind of plan mode or with the    /grill-me     skill enabled, and then proceed to answer 40 multiple-choice questions.","prefix":"Right now, it’s really not good.","suffix":"We get tired somewhere around qu"}]},"created":"2026-11-06T16:57:13.236Z","modified":"2026-11-06T16:57:13.236Z","hypothesis":{"id":"aWbD-OL8EfGxKP-Dry6XoQ","digest":"eb09155e7017c"}}
> ```
> %%
> It is *so important* to understand, conceptually, that `grill` is both a step forward in minimizing "hallucination" (which I'd define as just imprecise definition of a problem that folks truly misdiagnose at this point), but is far from a perfect solution.
^ny92rr4q7ij


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:f37860ef-1d50-4637-bf7a-23a1f9e1935b","type":"Annotation","motivation":"commenting","body":{"id":"#^w92wlhbwoo7","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[83]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[83]/p[1]","endOffset":195},{"type":"TextPositionSelector","start":15338,"end":15533},{"type":"TextQuoteSelector","exact":"A lot of why this is a difficult problem to solve boils down to humans and agents being very different kinds of beings, with very different worlds, that are only partially legible to one another.","prefix":"ork and complex problem-solving.","suffix":"Let’s go back to Suchman’s resea"}]},"created":"2026-11-06T16:58:51.732Z","modified":"2026-11-06T16:58:51.732Z","hypothesis":{"id":"aZnJBuL8EfGHiuePNnC9OA","digest":"2eadef1080b"}}
> ```
> %%
> The recent Navier-Stokes kerfuffle is a huge highlight of this: the fact that the proof is there, but that we don't understand it, is exactly what [Hank Green](https://www.youtube.com/watch?v=LvvG21CpaS4) talks about in his recent video with Grant Sanderson (3blue1brown) about understanding and elegance: we (through agents) have proven something that we (as people) do not yet understand.
^w92wlhbwoo7


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:d0aad27f-e1ba-43e3-a91f-dc1461ec4446","type":"Annotation","motivation":"commenting","body":{"id":"#^jrghswp0gen","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://maggieappleton.com/planning-agents","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[96]/p[1]","startOffset":0,"endContainer":"/main[1]/div[1]/article[1]/div[1]/div[2]/div[96]/p[2]","endOffset":61},{"type":"TextPositionSelector","start":20756,"end":21052},{"type":"TextQuoteSelector","exact":"When the museum was being founded, it succeeded in bringing together lots of different social groups with different cultures, beliefs, training, and priorities to create it: biologists, trappers, funders, and university administrators.All able to effectively collaborate through boundary objects.","prefix":"useum of Vertebrate Zoology    .","suffix":"Specimens, labels, field notes, "}]},"created":"2026-11-10T21:40:23.964Z","modified":"2026-11-10T21:40:23.964Z","hypothesis":{"id":"acW9VOL8EfGc5WPWW6L3NQ","digest":"1f56ddf505a9e6"}}
> ```
> %%
> This is just... the most click-into-clarity moment for me, personally.
>
> I think the way that it frames the issue really does hail back to [[Programming as Theory Building]] and the World 1/2/3 setup. Effectively, there comes a point when something that sits conceptually in your head must be shared. That means that the idea must be transcribed into a physical medium and then consumed by another person. The way I see it, that physical medium *is* the boundary object: the boundary between an idea going out of my head, and into yours.
>
> Anybody who has been in a teaching role before knows that this is *way harder than it sounds*. It's a blend of art, and science, and design, and psychology, in a way that mixes together into a very strange alchemy. The result of that alchemy, done successfully,
^jrghswp0gen
