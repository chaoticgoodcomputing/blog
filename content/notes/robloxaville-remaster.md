# In Review: The (bad) 2017 Robloxaville Remaster

> How over-engineering killed a 3-month remaster of an old ROBLOX game. Looking back at the depth of Dunning-Kruger, and how good code doesn't make a good game.

- Page: https://blog.chaoticgood.computer/content/notes/robloxaville-remaster
- Author: Spencer Elkington
- Published: 2024-02-25
- Updated: 2026-01-10
- Tags: projects/games/roblox, engineering/languages/lua, writing/notes

---

When I was in high school, [I dabbled a bit in programming on Roblox](https://blog.chaoticgood.computer/content/articles/robloxaville). Due to some [pretty glaring security concerns](https://blog.chaoticgood.computer/content/articles/robloxaville#), a project started over the summer of 2017 to remaster Robloxaville. I’ll be the first to admit that [the remaster](https://www.roblox.com/games/272941/Robloxaville) is *substantially* less fun to play than the original. While part of this constraint was time - the original was made over the course of ~4 years, while the remaster was made in ~3 months - it’s undeniable that the velocity of the original project was simply far higher because it was [under-engineered](https://blog.chaoticgood.computer/content/notes/over-under-engineering).

The original project was largely made by my mom, who studied programming during her physics-chemistry-geology triple(!!!) major in college, with some tangential work from me, who was a literal child. Not to sell short the sheer amount of work she put into the project, but between a lack of formal software engineering and the [pretty glaring shortcomings of the Roblox engine itself](https://blog.chaoticgood.computer/content/articles/robloxaville#back-in-the-saddle) meant that, frankly, it would’ve been impossible to engineer any of it properly to begin with. By the time the summer of 2017 rolled around and the remaster started, two circumstances collided:

1.  Platform developers were now being paid, which introduced a far higher bar on quality of work being done
2.  I had just finished my first semester of a degree in computer science and learned tip-of-the-iceberg concepts of what constituted “good” software.

Despite happening 7 years ago as of the time of writing, I remember how *absolutely stressful* that summer was. I ~~spent~~ **wasted** a lot of time worried that the code I was writing wasn’t engineered enough, and ended up designing a lot of bad and convoluted systems meant to save myself time in a future of development on that project that never came.

There exists a graveyard of projects [and posts](https://blog.chaoticgood.computer/content/notes/digital-gardening-with-quartz) between 2017 and today that have fallen victim of arbitrary bars for [under-engineering](https://blog.chaoticgood.computer/content/notes/over-under-engineering) that I’ve put on my own work.
