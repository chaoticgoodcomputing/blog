---
title: "Kickoff: Season of Systems"
description: |
  I'm learning to live with the systems that stole my beloved em-dash.
  A season dedicated to negotiating how to live with the agentic models that have turned my career upside-down.
date: 2026-01-04
tags:
  - horticulture/seasons/systems
  - engineering/ai
  - projects/homelab
---
Letting the vault go stale for a year and a half feels less like falling off the wagon, and more like completely losing the wagon altogether.

## The Season of Systems

I remember, growing up, seeing my dad come home from work every day. Like clockwork, he'd always put his keys in the same place. It varied from house to house, but it's the most atomic example of a person with a system that I can think of: `At X, do Y`.

I'm still working out, in my own mind, how this season will differ from [[tags/horticulture/seasons/rhythm/index|rhythm]] — which has a [[content/notes/season-of-rhythm-in-review|review pending]], I'll get around to that sometime soon. The distinguishing factor in my mind, at the moment, is to review and restructure the way I operate, both personally and productively.

> [!UPDATE]
> I did wrap up the review for Season of Rhythm. In my mind, the differentiation between "rhythm" and "systems" is that rhythm has an aftertaste of raw discipline that, in hindsight, I don't agree with. Nothing from the Season of Rhythm that involved white-knuckling a new habit through sheer discipline panned out. The habits that had some backing system — my best example being [[content/notes/scratch/data-and-shortcuts|event-driven automations]] — were the ones that have stuck with me over time.

Since the last post ([[content/notes/periodic/daily/2024/04/2024-04-21|in April of last year]] — never has 16 months felt longer), a whole lot has changed. I think that I, along with a lot of people in my own (or similar) positions, have suffered a bit of whiplash with how quickly the systems that grew over the course of decades shifted under our feet.

### Agentic Models

Generative AI has come quite a long way from simple [[content/articles/binglish|chat interfaces]]. At that point, I think that folks (including myself) thought the primary shift would be what we, now, call AI slop. That's still absolutely the case, but I find myself at the center of where AI, specifically [AI agents](https://cloud.google.com/discover/what-are-ai-agents) seems to have found its most solid footing — [[tags/engineering/index|software engineering]] and white-collar work. As these systems become more competent, it's been a rapid rush to find what the human role in their use becomes.

My thoughts on this are... complicated, to say the least. There's a lot at play, but within specifically those spaces I do find that it's a net benefit.[^1] I've had this conversation with enough people at this point (family, friends, coworkers) that it's almost canned at this point:

1. First, the extent to which any person, myself included, utilizes this system is a constant negotiation with a lot of factors: how expensive the (good) models can be, how useful they actually are in a person's line of work (the ceiling is very high in software development, depending on how you use them), how willing somebody is to "feed the machine". These things have gotten really good, really fast (not sure what the current state of counting the `r`s in `strawberries` is), so not only does it need to be negotiated, but it needs to be *re*negotiated as the landscape changes, which has gotten pretty damn exhausting.
2. As the boundary of what work can be handed off to these systems shifts, my (or anybody else's) role in work also shifts. I feel that we're hitting a plateau on [the S-curve of capability for LLMs](https://www.youtube.com/watch?v=jPhJbKBuNnA). I emphasize the "capability" part of that statement — I'm talking about the raw capability of how good an answer an LLM could provide when afforded merely the ability to raw-dog a prompt. I feel that the focus has shifted into [tooling](https://modelcontextprotocol.io/docs/getting-started/intro) for additional context fetching and [orchestration systems](https://github.com/preset-io/agor) for multi- (or cross-)session systems.

Some of that is moot — the latent capabilities of LLMs (or whatever proceeds it) are completely out of my hands, and I have no internal locus of control over how those capabilities effect my job, my industry, the economy, the world, etc. What I *do* have control over, then, is:

1. Staying on top of best practices as they become available — [understanding how instructions can guide successful sessions](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct), staying on top of [available tooling](https://code.visualstudio.com/docs/copilot/customization/mcp-servers), or creating custom tooling when the need arises; and
2. Understanding how best to [[content/notes/hostage-negotiations|orchestrate agents]] in a way that doesn't produce shitty output. I've, personally, had quite a bit of success in this field. I feel that some of the backlash from developers about these systems is because it turns what used to be raw put-the-text-into-the-file engineering into an exercise of [[content/notes/qamo|management prowess]]. When somebody says "I tried to use AI and it created more bugs than it fixed", there's some tongue-biting involved in not responding "...did you not have regression testing in place?"

Across every sentiment I've seen in the last year, it's that a) any use of an agent to generate code is "vibecoding" and b) the term "vibecoding" being used at all. If you don't have strong systems to vet code output — regardless of whether that code was written by humans *or* agents — then yes, it *is* vibecoding.

*Vibecoding*, akin to how the [Triangle Shirtwaist Factory](https://en.wikipedia.org/wiki/Triangle_Shirtwaist_Factory_fire) was vibesewing.

### Other Systems

Alright — let's push all of that under the rug, then, and focus on other systems. A massive success during Season of Rhythm was [[content/notes/scratch/data-and-shortcuts|automations]], supported by much of the progress I made on my [[tags/projects/homelab/index|personal homelab]].

This cuts in a couple ways:

1. The systems I have in place for those automations bear a lot of the load of keeping my life from falling apart; and
2. Those systems are running on a bunch of random salvage servers that are absolutely *not* set up in a way that supports uptime or recoverability.
   
A good example — my partner and I moved to a new house in August of 2024. Obviously, mid-move, it's difficult to justify that setting up a bunch of servers is the highest priority — especially since none of them were resilient enough to be spun back up after a prolonged downtime.  Setting them back up had to wait until the free time afforded by the holidays that year, so for the period of time between August 2024 and December 2024, a lot of habits hit snags because of the lack of supporting infrastructure. The odds that our next move will end up being closer to cross-country means that I should anticipate a way longer downtime, and I want to make sure that those are set up properly this time.

There are other systems — like [[content/notes/digital-gardening-with-quartz|the published version of these Obsidian vaults]] and the call to [[ai-policy|the call to split it off between repositories using `git` modules]] for privacy reasons — that also require longer-term maintenance. The hope is to come up with resilient systems, so that I can grow these out in a way that doesn't suck up more and more of my time long-term. Part of the reason record-keeping for the Season of Rhythm [[content/notes/periodic/daily/2024/04/2024-04-21|fell off after just two months]] was because I both broke the public-facing portion, stopping the visibility of the routine, as well as over-complicating the daily habit with things like complicated and unmaintainable Obsidian Tasks workflows.

I've set up this rendition to both be on-its-face easier — [periodicals in the current format](https://github.com/chaoticgoodcomputing/chaoticgoodcomputing.github.io/blob/main/content/templates/daily.template.md#up-front) are no longer the hours-long task I made them out to be in 2024 — as well as [[content/notes/mdx-widgets-test.mdx|setting up Quartz in a way that's easier to customize]] without breaking. It's been an initial up-front effort to get everything set up this way, but my hope is that I can drive this entirely through Obsidian long-term, without needing to worry about regressions. A 90% ratio of time spent in `vault/` versus `quartz/` changes is a rule-of-thumb that I'd like to hit.

(I'm actively suppressing the urge to make a widget to calculate that ratio. Can't do it from Obsidian, which is absolutely the point)

## Endgame

Figuring out the end of Rhythm was fairly easy, since there was a 2-year gap between then and now. I had a couple seasons in between that are hardly worth mentioning — there was a season of health that did actually have material benefits, but fell off due to (shocker) a lack of systemic backing.

With a big move on the horizon, I'm reserving a changeover for whatever hits hardest, then. I don't think I'll ever *stop* making systems — this season is just an explicit focus to keep them up as the ground shifts from underneath me.


[^1]: my biggest knock against LLMs? My writing uses an abusive amount of [em-dashes](https://www.merriam-webster.com/grammar/em-dash-en-dash-how-to-use), a habit that I picked up in college because it seemed to be an acceptable way to phrase connected thoughts, asides, or parentheticals that would otherwise be critiqued for being run-on sentences. LLMs have, for some *fucking reason*, decided to [steal this habit out from under me](https://www.nytimes.com/2025/09/18/magazine/chatgpt-dash-hyphen-writing-communication.html), and now my writing looks *less* human, not more. I'm still not sure what to do about this.
