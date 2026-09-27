---
title: "Security Alert: Softlock and ACE via Natural Language Overload"
date: 2026-09-26
tags:
  - engineering
  - engineering/ai
description:
---
I think I've found a pretty large CVE that has gone without a formal report, despite absolutely saturating the field of software engineering. It's subtle and insidious, allowing a malicious or unknowing actor to either inject arbitrary code into a software project, or softlock it entirely.

It may be conventionally irresponsible to report on it here, rather than privately to the appropriate authorities, but I'm a bit stuck: the vulnerability is in the English language and the [Wernicke's Area](https://en.wikipedia.org/wiki/Wernicke%27s_area) of the brain of every human being alive, and I don't believe the designer of the human brain is registered as a [CVE Program Partner](https://www.cve.org/About/Process).

## Naked and Afraid

At the beating heart of modern collaborative software development is the **fork-and-pull model** for source code. For a piece of software developed via fork-and-pull -- the vast majority of software, at this point -- everything about developing the software is built around two people:

1. A **maintainer**, who is responsible for making sure that the software is capable of doing whatever it was built to do; and
2. A **contributor**, who wants to contribute some change to the software.

Fork-and-pull is the process by which these two people interact with each other. If you don't look too closely, it's actually a pretty simple process:

**TODO: INSERT FORK-AND-PULL DIAGRAM HERE**.

See that branch, there in the middle? That's the **pull request**. It's the singular point where a new contribution either makes it into the software, or bounces off into the void, never to see the light of `main`[^1].

The pull request is also the point where this **CVE**, or "Common Vulnerability or Exposure", exists. It goes without saying that this isn't an *actual* CVE in the technical sense. [Real CVEs](https://cve-explore.com/top/2026) are flaws in programs that compromise the security or stability of the program. What we're talking about here is a bit more abstract. The human element of pull requests is not some vulnerability or exposure in the *code*; it's a vulnerability or exposure in *how the code gets made.*

I'm six years into my career as a software engineer -- an elder statesman to any college student, but a literal infant to any veteran -- and have already had countless opportunities to be in both the maintainer *and* the contributor roles. Both of them can feel *vulnerable* and *exposed*; a CVE in a social dynamic:

- As a maintainer, your job is to improve the product: add/polish features, and fix bugs. In the *best* case scenario, a new pull request will do exactly what's advertised. In a bad scenario, it'll break something. In the *worst* case scenario, it could be [actual malware](https://nhimg.org/glossary/malicious-pull-request/). In a way, you have only a little to gain, and a *lot* to lose.
- As a contributor, your job -- perhaps voluntary in an open-source project, but your *actual job* as a software engineer -- is to write the changes that actually *carry* features and fixes. On a technical level, any denied pull request is work you've done not making it to the finish line. Getting a pull request denied in an open-source project can [feel embarrassing](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building#:~:text=The%20members%20of%20group%20A%20wereable%20to%20spot%20these%20cases%20instantly), but getting a pull request denied in a professional setting can feel like a reprimand.

Both parties are vulnerable and exposed. It's a real hairball: maintainers and contributors *need* each other to move a project forward, and yet their goals seem *diametrically opposed*. A pull request is a maintainer and a contributor both trying to defend their work.

If you can accept that the pull request is at the core of modern collaborative software engineering, then you must also accept that modern software engineering isn't *actually* writing code: it's maintainers and contributors, *arguing* about code, *all the time*.

## PRs as Persuasive Arguments

Once you start to see pull requests as *persuasive arguments*, so much of the patterns *around* pull requests start to become crystal clear. Arguing is time-consuming work! If we can reduce the amount of time it takes to argue about a pull request, we can have more time to... write more pull requests to argue about!

The first category of time savers are *linters* and *tests*: the set of automations that answer the question: *do we even need to argue about this?*.

If the code doesn't lint? *Fail it*.

If the program doesn't compile? Why argue about *is it good* when the thing doesn't even *run?* *Fail it*.

If the program doesn't pass a fast suite of tests? Believe it or not: *fail it*.

Automated testing is an *incredible* way for maintainers to lay out, plain and clear, what they'll even *bother* arguing about. As a contributor, passing tests is the *bare minimum* hurdle.

The second category is the humble *pull request template*. A pull request template is a maintainer's way of saying "You've gotta convince me, and here's the type of argument I find convincing". If you're a maintainer, what do you need to feel secure about a request? Do you need screenshots? Do you need a rundown of the proposed architecture? *Put it in the template*. And, if you're a contributor: you'd better be ready to follow that exact template. Don't freestyle it; they've given you half the answer key, all you've gotta do is fill it in.

These tools may be tried-and-true on many projects, but they don't address the most recent elephant to walk into the room: LLMs and Coding Agents. There's now a big, new question to try and answer, then:

## Can any LLM -- any *single* LLM -- shut the fuck up?

It truly is the question of the century, isn't it? Broadly and socially, this is [hardly a new question](https://www.youtube.com/watch?v=okq0hj1IMlo). The onset of LLMs and coding agents have taken that question and dialed it up, though. *Way* up.

Back in high school, I (and everybody else) ruled out me participating in pretty much every physical sport. My options remaining were either theater or debate, and as a stubborn pain-in-the-ass, I chose debate.

Something subtle about formal, competitive debate -- especially if you're used to things like televised political debates -- is that who wins a debate is far more technical than you'd think. While a televised debate listening in and deciding on *vibes* who you might vote for, the structure behind formal debate is, largely:

1. Each side will make some N amount of arguments about their viewpoint; then
2. Both sides will spend some time trying to poke holes in each of the other side's N amount of arguments; then
3. Both sides will spend some time patching any holes that got poked in each of their own N amount of arguments.

This is called the *flow* of the argument, and you end up with a chart that looks, all things considered, like a bit of a math problem: at the end of the debate, the winner is not "what side do I personally believe in"; it's "what side had the most arguments structurally standing by the end?"



As a bit of a *systemic shenanigan*, someone realized that this system has a flaw: given that there's a time limit, what if you tried to make *as many arguments as possible* -- so many that your opponent could barely understand all of them, nevermind *contest* all of them?

That's when spreading (**sp**eed **reading**) was born: talk so fast as to overwhelm the other side:

<iframe width="560" height="315" src="https://www.youtube.com/embed/LMO27PAHjrY?si=pNs_uearpXWhVG27" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

LLMs are, *by definition*, a machine that can generate a lot of text very quickly. Is that helpful in some contexts? Absolutely. I will *wholly* admit to using them for development. Where I've seen this run aground, though, is at the PR level, both in closed and open-source contribution levels. If pull requests are truly a persuasive argument, an LLM-generated massive pull request description is spreading: arguments made so quickly, and in such a bulk quantity, that the argument becomes untenable.

Anybody who has had the misfortune of debating somebody who spreads knows that there are, truly, two responses:

1. Pray that the judge hates spreading, misses what they're saying, and you get the W for being the only comprehensible team; or
2. Spread back to make sure you can fit all of the counterarguments you need into the time limit.

It's a Prisoners Dilemma, then: spread, or lose.

Likewise, when hit with large quantities of pull requests and massive descriptions, a maintainer can:

1. Use LLMs to review faster; or
2. 