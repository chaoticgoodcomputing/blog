---
title: "Before You Slabtop Your Laptop: A Brief Warning"
date: 2024-03-03
updated: 2024-03-03
tags:
  - projects/personal/homelab
  - notes/scratch
draft: false
---
I recently had [a misadventure](https://bsky.app/profile/spencer.chaoticgood.computer/post/3kljmrvqd2u2q) while trying to [**slabtop**](https://www.theverge.com/22965732/macbook-decapitation-slabtop-mod-mac-studio-event-rumor-keyboard-computer-diy) (remove the LCD panel of a laptop to use it as a server) an old Dell Alienware G2 15. I didn't see this piece of friendly advice while Googling around before making my attempt. I really wish I had - it would've saved me a lot of time, trouble, and a motherboard to boot (pun intended).

To contribute to the body of all knowledge, I hope you (*you*, the person googling "how to slabtop a laptop" *right now*) see this before you whip out the screwdriver and go to town on your old burner:

**Search ["\<YOUR LAPTOP MODEL\> LCD Panel POST Check Beeps"](https://gprivate.com/69t8y) before you attempt to slabtop your laptop!!**

Computers run without screens all the time - we call them *servers*, and they run *everything*, so the possibility of a laptop manufacturer literally not letting a computer complete POST check without an LCD panel wasn't even something that crossed my mind. However, if you google the above, you'll run into *lots of posts* of people who hear a handful of beeps when their LCD display is disconnected, signifying that the POST process didn't complete. *This will absolutely fuck you over if your laptop manufacturer is one of the **many** who have this check in place.*

While I believe it is *possible* to do this on a PC (not a Mac, where slabtopping has been documented extensively), I personally ended up frying the motherboard after about 5 hours of cutting away at the stupid fucking thing. If this helps even a single person, I will be immensely happy.