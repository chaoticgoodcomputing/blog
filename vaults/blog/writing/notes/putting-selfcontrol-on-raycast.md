---
title: Watering Down SelfControl into Self Restraint
date: 2024-02-28
updated: 2024-02-28
tags:
  - goblin-slaying
  - "#engineering"
  - mentoring/tutorials
  - notes
draft: false
---
> I talk a lot in this post. You may want to skip to [[putting-selfcontrol-on-raycast#The Useful Part|the useful part]].

So, during this recent period of [[rhythm|trying to break quite a few years of bad work habits]], I've been putting up little guardrails in my own life to keep myself on-track when I want to stay on-track. One issue I've run into - especially during a *particularly tumultuous US election year* - is a tendency to check the news.

And then, five minutes later, check the news again.

...and again

...and *again.*

I've rationalized it for awhile by saying "I work in politics - of *course* I should stay up to date!" However, that's a *lie* - my day job is *not* in politics. At best, It's working on software *adjacent* to people who are *adjacent* to politics.

To alleviate that for awhile, I had used a Chrome-specific app called StayFocused to block a pretty broad swath of websites, but ran into two issues:

1. StayFocused allows you to schedule blocks, but only for predetermined amounts of time, and only a single block per day. This was not quite as flexible as I was comfortable with - I do like to check the news, my email, or [Bluesky](https://bsky.app/profile/spencer.chaoticgood.computer) at lunch, or if I get off of work a bit earlier than expected.
2. I started using [[arc-review|Arc Browser]] with three different profiles - Personal, Work and CGC - and each one has its own Chrome plugins. Because of this, I'd have to configure/reconfigure/update the StayFocused installation in triplicate, which due to the way their app is set up is incredibly hard to do.
3. Their app kept hijacking my browser to notify me of updates, and I didn't see a readily-available way to do that. Ironically, this had the effect of absolutely shattering my focus.

I ended up uninstalling it and going with something a bit heavier-duty. [SelfControl](https://selfcontrolapp.com/) is an application for MacOS that blocks out apps across the entire operating system. I had also seen [Focus](https://heyfocus.com/) listed as a possible solution, but... *$49?* For effectively the same thing with a prettier interface? *yeesh.*

Ironically, though, SelfControl requires self control to use, which is [[the-quest-to-slay-the-goblin|exactly what got me in this situation to begin with]]. It is *incredibly* easy to "take a break" and then *just-a-couple-more-minutes* yourself out of any semblance of flow. As a nice surprise, though, [SelfControl comes with a CLI](https://github.com/SelfControlApp/selfcontrol/wiki/Running-SelfControl-from-the-Terminal), which means we can use it for some more advanced workflows! We can use this to do two things:

1. Schedule blocks of self-control for the future, e.g. "In 10 minutes, I will focus for 50 minutes"; and
2. Connect that behavior to [[raycast-review|Raycast]], which will help us lower the bar to starting Raycast (as, admittedly, having to swipe back to the main Mac desktop is a pain in the ass and puts it out-of-the-way)

## The Useful Part

I've added a couple of useful bash scripts to a [SelfControl Raycast Plugin](https://github.com/chaoticgoodcomputing/selfcontrol-raycast) for others to use. At some point, I'll look into the process for getting them added to the actual Raycast extension store. You can add these by cloning the repository and adding it in the Raycast settings as a "Script Directory."

![[Pasted image 20240229001915.png]]

**THAT BEING SAID:** I've used the term [[caveat-lector|caveat lector]] quite a bit to warn people that I'm just some guy. This goes doubly here! This is software that has literally only been tested, by me, a handful of times, that I made while (ironically) procrastinating [[2024-02-28#E-Block|other things I should be working on]]. *To say it isn't well-tested would be a dramatic understatement.* The creators of SelfControl [warn that it's a tool that, if misused, can have side effects](https://github.com/SelfControlApp/selfcontrol/wiki/FAQ#q-selfcontrols-timer-is-at-finishing-and-i-cant-access-my-websites-and-im-freaking-out). So to that end... what would the phrase even be?

![[Pasted image 20240228194431.png]]

Huh. I guess the Romans didn't do much file sharing.

*Caveat download!*
