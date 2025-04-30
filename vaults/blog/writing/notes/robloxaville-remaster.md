---
title: Thoughts on the bad 2017 Robloxaville Remaster
date: 2024-02-25
updated: 2024-02-25
tags:
  - games/roblox
  - engineering/lua
  - notes
draft: false
---
When I was in high school, [[robloxaville|I dabbled a bit in programming on Roblox]]. Due to some [[robloxaville#^4b7922|pretty glaring security concerns]], a project started over the summer of 2017 to remaster Robloxaville. I'll be the first to admit that [the remaster](https://www.roblox.com/games/272941/Robloxaville) is *substantially* less fun to play than the original. While part of this constraint was time - the original was made over the course of ~4 years, while the remaster was made in ~3 months - it's undeniable that the velocity of the original project was simply far higher because it was [[over-under-engineering|under-engineered]].

The original project was largely made by my mom, who studied programming during her physics-chemistry-geology triple(!!!) major in college, with some tangential work from me, who was a literal child. Not to sell short the sheer amount of work she put into the project, but between a lack of formal software engineering and the [[robloxaville#Back in the Saddle|pretty glaring shortcomings of the Roblox engine itself]] meant that, frankly, it would've been impossible to engineer any of it properly to begin with. By the time the summer of 2017 rolled around and the remaster started, two circumstances collided:

1. Platform developers were now being paid, which introduced a far higher bar on quality of work being done
2. I had just finished my first semester of a degree in computer science and learned tip-of-the-iceberg concepts of what constituted "good" software.

Despite happening 7 years ago as of the time of writing, I remember how *absolutely stressful* that summer was. I ~~spent~~ **wasted** a lot of time worried that the code I was writing wasn't engineered enough, and ended up designing a lot of bad and convoluted systems meant to save myself time in a future of development on that project that never came.

There exists a graveyard of projects [[digital-gardening-with-quartz|and posts]] between 2017 and today that have fallen victim of arbitrary bars for [[over-under-engineering|under-engineering]] that I've put on my own work.