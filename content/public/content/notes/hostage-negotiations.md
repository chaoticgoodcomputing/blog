---
title: LLMs; or, How to Run Your Own Hostage Negotiation
description: |
  LLMs: Are we doomed to die, or born to garden?
  I'd like to make the case that AI is less like Terminator, and more like tomatoes.
date: 2026-01-10
tags:
  - engineering/ai
  - writing/articles
---
I remember watching CGPGrey's [Humans Need Not Apply](https://www.youtube.com/watch?v=7Pq-S557XQU) back in 2017, when I was a freshman in college. At the time, I knew I was going into *something* related to programming (my major bounced around a few times in the first couple years of my undergraduate). Around the same time, I participated in the 2016 University of Utah hackathon, [HackTheU](https://www.hacktheu.org/), in which two forms of machine learning were all the rage:

1. Self-driving cars and mechanical automation — there were quite a few panels on this subject, although I'm not entirely sure why. The odds that a gaggle of undergraduates would crack that code given 48 hours and an irresponsible amount of Red Bull; and
2. [Recommender systems](https://en.wikipedia.org/wiki/Recommender_system), which were fueling the general social media trend away from time-ordered feeds and towards systems that, today, we'd probably refer to as "For You" pages.

In hindsight, there was certainly a flavor of software engineering-elitism running rampant at the time. This was the era of [#learntocode](https://en.wikipedia.org/wiki/Learn_to_Code) as a response to jobs being lost to overseas factories and automated assembly lines, of "software engineer" being the fastest-growing and highest-paying profession many years running, and of a massive increase in computer science majors — myself included — being trained through growing undergrad programs. The thought that, perhaps, a high-expense field of pure-digital-output wouldn't be ripe for automation by — *shocker!* — digital automation, hadn't crossed many minds.

## A bot can do your job. Now what?

There's no shortage of fair criticism of LLM systems. These range from the conceptual (they're probabilistic, and confidently make mistakes that can be hard to confirm) to the practical (they use an enormous amount of electricity, they can be built off of stolen intellectual property — the list goes on, really). In my particular line of work, it can be hard to express any opinion about AI without feeling like I'm expressing support for a technology that is, itself, holding our careers hostage. So, putting aside how billionaire-apologist, ecologically-irresponsible, and class-unconscious this sounds:

**LLMs can be better at humans than writing code, and not learning how to use it as a software engineering tool is quickly becoming a nonstarter.**

There's a *lot* of qualifications I can make to that statement, because it depends on a lot of factors. I won't get into all of them, but the first qualification is that there's a **massive** emphasis on "writing code." I'm talking, *very specifically*, about the act of physically typing code into an editor. Especially with the adoption of agent tooling, such as [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/getting-started/intro) that allows for direct interaction with tools (like code editors themselves), it's not even a close contest.

So — are we boned?

I don't think so. The biggest friction I've had in justifying that take to other engineers is trying to separate out the act of physically writing code into an editor and *engineering* — the act of designing systems to process information that don't collapse under their own weight.

In trying to illustrate this distinction to people, I've cycled through a few different analogies:

1. There is a difference between designing a beautiful and functional building, and being the one to physically lay the bricks
2. A good book and a bad book are both written using the same language — the difference is that a good book is narratively engaging and structurally sound.
3. Tomatoes won't grow in a healthy way if you don't provide a trellis for them to grow around.

The through line in all of these is abstract structures versus concrete implementations. The value of a human being is to ensure that this strange, non-deterministic, text-generating machine is surrounded by structures and mechanisms that push it in the correct direction.

## Stronger Systems for Digital Gardens

The tomato plant/trellis is the analogy I've settled on the most — it reminds me of [[content/notes/digital-gardening-with-quartz|digital gardening]]. Human beings have figured out how to wrangle things we don't fully understand for thousands of years, and reading LLM research and model cards can start to feel more like a natural science like biology than something like an applied math paper. We can prod a taught model to check its behavior, but for folks outside of the research side, it falls on us to accept that something we don't fully understand can still be useful.

What we are responsible for, though, is making sure that this new addition to our lives is handled with care. It's on us to build systems for handling its use — there's a long history of intentionally, and irresponsibly, introducing [invasive species](https://www.invasivespeciesinfo.gov/subject/pathways) into our environments to solve one problem only to create a hundred more in its place. This is the distinction I make between engineering and the act of (\**vomit*\*) *vibecoding*.

2025 was the year AI agents really took hold, and I, like everybody else in this industry, have no shortage of stories about times where an agent completely missed the mark. The distinction I make, though, is that quite a few of them were my fault. Planting a prompt without having a strong system surrounding it to direct and validate the grown code always leads to issues down the road — but would that have been different if I grew that code myself? I likely would've made the same mistakes at a slower pace, save for a longer period of time to doubt my own decisions.

In working with agents, then, what systems can actually help? That's been the core of this [[tags/horticulture/seasons/systems/index|season of systems]] — working through what systems I can personally use, specifically for working with this tool, in this industry, to manage use of agent tools.

1. **Stronger Architecture:** It was surprising, in college, that concepts like [design patterns](https://refactoring.guru/design-patterns) weren't specifically taught as a core part of the software engineering discipline in my program. I get that recommending any system of thought can elicit a whole lot of what-aboutism, but every field has certain patterns that can be taught as a starting point. Knowing how meta-structures in information systems interact with one another is pretty much non-negotiable — if you don't go into a project with a strong sense of how the skeleton of the thing will look, it's all too easy to let yourself — or an agent — grow the project into a corner down the line.
2. **Adversarial Tests:** A massive upside of this industry compared to, say, the natural sciences, is that testing is incredibly easy. I can't think of a single information processing project where there isn't some way to benchmark if a change that you or an agent makes will make the project better or worse. We're getting to the point where a lack of comprehensive, deterministic, routine testing to review your work is non-negotiable. If you don't give the code some trellis to grow against, you shouldn't be shocked when a project becomes worse by the time you close out for the day.
   
   As an additional note — these tests should really be **deterministic**. I'm *highly* skeptical of any promise in the space of [agent-as-a-judge](https://duckduckgo.com/?q=agent-as-a-judge) or [agentic code reviews](https://learn.microsoft.com/en-us/training/modules/code-reviews-pull-requests-github-copilot/). Having one LLM review another LLMs work feels about as fantastical as a strange hermit selling you magic beans that will grow a stalk into the clouds to a land of golden eggs. All you're going to get is a load of rotten beans on the ground.

> [!UPDATE]
> Jan 22nd, 2026 — Anthropic has updated their guidance to state [exactly this](https://code.claude.com/docs/en/best-practices):
> 
> *"Include tests, screenshots, or expected outputs so Claude can check itself. This is the single highest-leverage thing you can do."*
> 
> I am still an advocate of taking it one step further, that these types of tests should be *deterministic*, not something where the agent is evaluating its own work. That's why I describe these as *adversarial* — they're systems that should not be lenient to the agent if it has done poor work.
   
3. **Atomic Tasks:** The thing that really seemed to catch the industry off guard is how, almost overnight, we became pseudo-managers of a fleet of agents writing code. Very little of a computer science education focuses on what many engineers find themselves doing far enough into their careers — managing other engineers. The skillset for engineering management is certainly a superset of the skillset of simply engineering. I've seen — and experienced, myself — a massive struggle around how to take a piece of software and delegate it out to dozens of smaller, discrete tasks. Many of the project management and delegation skills that an engineer may build up over a decade in the industry has quickly become a prerequisite to juggling multiple code generation sessions. It's a rapid adjustment to folks in my position who, despite not being "junior" engineers, are still more junior than, say, a seasoned principal engineer.
   
This is what I've been able to come up with after a hectic year of rapid changes and adjustment. I'm fortunate enough to be in a position where there isn't *too* much risk of, say, an Amazon-style engineering cull, but it's still a nervous time in a shaken field.
