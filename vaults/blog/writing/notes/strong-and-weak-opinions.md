---
title: let opinion = null
date: 2024-03-05
updated: 2024-03-05
tags:
  - engineering
  - notes
  - economics/project-management
draft: false
---
> This note ended up having a lot of front-loaded context — feel free to skip to [[strong-and-weak-opinions#The Point|the point]]

## Opinionated Software

There's a term that floats around that *feels* new. It's not something that I'd ever seen in the science portions of my undergraduate. As I've entered into industry and more frequently both use and participate in the development of a broader range of software, there has been a *sharp* increase in frequency that I've seen this term:

> [Proper noun] is an opinionated [general noun]

What… does this mean? I'd never seen it in an academic slide deck before, but I can name a few high-profile instances of the label used. While it's usually surrounding frameworks, I've seen it used in other places as well:

- During C# related work — I have previously used [Wrapt](https://wrapt.dev/) as a [[csharp]] web API scaffolding tool, which [describes its default options as opinionated](https://wrapt.dev/docs/customizing-wrapt-projects#smart-defaults)
    - On wandering through the chain of opinions, Wrapt's opinions are, in turn, based on the Vertical Slice Architecture (VSA) opinions I'd first seen in [Jimmy Bogart's post on VSA](https://www.jimmybogard.com/vertical-slice-architecture/), a recommended must-read by my team at NWYC
- During [[roblox]]-related CGC work: [“Flamework is a highly opinionated game framework”](https://www.npmjs.com/package/@flamework/core)
    - Interestingly, this description has since been replaced to say (as of writing) “Flamework is an extensible game framework.” — thought I was going insane in trailing back after seeing that phrase there months ago and not finding it, but [[Pasted image 20240305234056.png|a stale Google Index reference]] shows that I'm not crazy (on this one, at least). I am curious about the onus behind the wording change, because I do actually believe that the new description better captures the intent of the Flamework package.
    - **UPDATE:** After [talking to the creator of the package](https://discord.com/channels/476080952636997633/498292664471388160/1215744361317404742), this change was made as the project evolved from a personal single-user project to a broadly-used staple of Roblox/TypeScript development. In particular, the [Modding API](https://fireboltofdeath.dev/docs/flamework/modding) is what spurred the description change, as it allows an end-user to yoink very nifty behavior like dependency injection and decorators and attach it to custom utilities.
- Stumbling on the [black](https://github.com/psf/black) python formatter while wrangling [[python|Python/Databricks]] codebases at M Science
    - This is probably the most severe(?) case of opinionated software I've ever seen — it is literally named after the Henry Ford quote regarding available paint jobs for the Model T: **“Any color the customer wants, as long as it's black”**
    - The black repository is also home to [one of my favorite GitHub Issues of all time](https://github.com/psf/black/issues/378), in which a senior staff engineer at Twitter requested the ability to configure 2-space tabs instead of 4-space tabs.
      
      The response to **one of the most influential tech companies to ever exist** requesting a (seemingly) minor change in order to adopt it as the standard code formatter for their **entire** Python codebase was a resounding: **“no.”**

Anybody who has ever seen highly-opinionated flame wars in the comments of Reddit threads, Stack Overflow posts, or — frankly — between *any work call between more than, say, **two** engineers in the same field,* opinions have the potential to run **very strong.**

(Want a real life example? Go ahead and pop [“is \<PROGRAMMING LANGUAGE A> better than \<PROGRAMMING LANGUAGE B\>?”](https://letmegooglethat.com/?q=is+%3CPROGRAMMING+LANGUAGE+A%3E+better+than+%3CPROGRAMMING+LANGUAGE+B%3E%3F) into your search engine. One of my **strong opinions** is that 99.9% of those conversations are bullshit, wasted time. Seeing them in the wild makes me want to close my laptop and walk into the ocean, my final thought before the air depletes from my lungs being that, at the very least, my decomposing body will contribute more back into The Universe than those people did by arguing complete fucking nonsense on the internet.)

When strong opinions collide, it can feel very much like watching an unstoppable force hit an immovable object. Especially when I was a data analyst on the way up to software engineering, I often found myself a junior (and rightfully silent) participant in *long-winded, fruitless, and ultimately destructive* conversations, in which two parties who hold **strong opinions** talk past each other for… 10 minutes… 20 minutes… *an hour*? with the call ultimately ending because one side or the other has to hop into a different call of the same flavor.

I think the way we can all occasionally approach having an opinion — or not having an opinion — is ultimately reductive, destructive. It slowly chisels away, bit by bit, hundreds of thousands of minutes, hours, and days of human life to the behest of our goals yet delight of the Reaper himself.

## The Point

I'm proposing, here, a way to:

a. **properly classify your opinions**; and 
b. **how to use those classifications to lead *legitimately constructive* conversations with others**

Lately, I've been trying to put my own opinions into one of two categories:

1. **Strong Opinions:** Opinions that I have built up over time and experience, **and** that I feel I have a compelling case for that clearly communicates the full scope of costs and benefits to the decisions that opinion leads me to propose
2. **Weak Opinions:** These are the ones that I have that are built on sub-par information, that I can't clearly communicate, or that are generally based on ✨ vibes 🌈

When contributing to a conversation or argument on a topic, I've been trying *really hard* to ask myself: "Is the opinion I'm about to state a strong opinion?"

Having a weak opinion on a topic doesn't necessarily mean it shouldn't be mentioned *at all*. It *does* mean that it's likely a point that, should somebody else have a stronger opinion, that opinion isn't a hill I should consider dying on.

That said, having a strong opinion *also* doesn't necessarily mean it's something I ought to be doubling (or, god forbid, *tripling* down on). Especially when in a conversation with more senior engineers — which, at the current stage of my career, is vastly more likely — a strong opinion is one in which I ought to present my best case, rationale, and analysis in the hopes of reaching consensus.

Even if my case for one of my strong opinions fails to reach a consensus — or even convince *anybody*, which does happen (sometimes a lot) (most of the time) — that isn't failure. Ultimately, as I've gotten further into my career and seen a broader range of opinions reach a broader range of success or shortcoming, my approach has ultimately fallen back to:

**[[the-best-side-of-the-road|The best side of the road to drive on is the side everybody else has agreed to drive on.]]**

No matter how strongly you might feel one way or another, never underestimate the power of consensus. Either way, the outcome of accepting consensus is positive:

1. Your opinion ended up being the way to go in hindsight, and you've gained experience to make a better case the next time it comes up; or
2. The consensus opinion goes perfectly fine, you achieve your goals, and have gained experience on which you can build new, better-informed opinions.

## A final open letter

I've noticed, in working with others, that the above classifications can somewhat freak people out — especially if they're used to working with Strong Opinion People™, because how quickly I'm willing to roll over on my weak(er) opinions has the potential to come across as misunderstanding or apathy.

As an open letter to people in the future that see me do this, I make you this promise: when I quickly fold on an opinion, it is far more likely that — in that moment — I feel there's more value in reaching a consensus and moving forward with *any* opinion than trying to force through a bad argument for a strong argument or a `null` argument for a weak one. At this point in my life, I am more interested in making progress than being right.