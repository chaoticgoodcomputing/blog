---
title: The Over/Unders of Over- and Under-Engineering
date: 2024-02-25
updated: 2024-02-25
tags:
  - engineering
  - goblin-slaying
  - notes
draft: false
---

> > > > ~~Premature optimization~~ **Over-engineering** is the root of all evil
> > > -- [~~Donald Knuth~~](https://en.wikipedia.org/wiki/Donald_Knuth)
> > -- [~~Sir Tony Hoare~~](https://ubiquity.acm.org/article.cfm?id=1513451)
> -- Me, just now

I think that over-engineering is the single greatest contributor to starting projects and never finishing them.

> Let's define **follow-through rate** as the ratio of projects started to projects *released*. Not "completed", since [[digital-gardening-with-quartz#The cost of perfection is infinite.|that's an irrational way to think about projects.]]

Looking back at periods of my life, I feel like my follow-through rate on projects was highest when I was 12 years old. At that point, my "projects" were:

- My grades in high school
- Writing shitty programs on my TI-84
- [[over-under-engineering#Robloxaville|Writing small games on Roblox]]

13 years is long enough ago that, for the sake of simple math, my follow-through rate was 100%. Gee, what a reliable kid I was!

I can name 4 periods of my life where the amount I learned about engineering grew at a more-rapid-than-usual pace:

1. **2016**: I began studying computer science in my undergraduate
2. **2018**: In trying to build up my resume, I started taking writing open-source and release-able projects more seriously
3. **2020**: I got my first full-time job as a data analyst/software engineer writing data pipelines in [[python|Python]] and [[structured-streaming|Spark]]
4. **2023**: I got my second full-time job writing general software in [[csharp]], with incredibly smart capital-E Engineers™ that were also incredibly good mentors

While it feels great to know more, learning has caused me a fundamental issue: **it's easier to be bad at something on accident than on purpose.**

I've increasingly noticed myself trying to apply the things I've learned to new projects, causing a whole lot of up-front work to get a project started. Putting yourself in a prison of making the "best" choices at the very start of the project is incredibly demotivating and absolutely *tanks* the odds that a project started will someday be a project finished. Ironically, it's future-proofing for a future that doesn't happen.

Let's say, hypothetically, that my project follow-through rate started at 100% and dropped by a third following each learning period. After 4 learning periods, that would leave me at...

$$(1.00 - 0.30)^5 = 0.16$$

*Yeesh*. 16% follow-through rate sounds rough, but when I look at a recent history of what I've accomplished versus what I've wanted to accomplish, the number seems somewhat reasonable.
