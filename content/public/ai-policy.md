---
title: AI Policy
description: |
  I may not have any control about how AI affects me, but I can at least make a policy for how I use it.
date: 2026-01-04
tags:
  - engineering/ai
  - horticulture/seasons/systems
  - writing/evergreen
---

Since we're now in the era of [[content/notes/hostage-negotiations|AI slop]], it feels necessary to have a general AI policy available for this site.

This site originated as part of a note-taking habit I formed for my [[tags/horticulture/seasons/rhythm/index|season of rhythm]]. I picked the habit back up as part of Rhythm's follow-up, [[tags/horticulture/seasons/systems/index|season of systems]]. As a software engineer, it's become clear to me that LLM systems will continue to be an essential part of the trade moving forward. That said, I want to keep this site a space where I can practice writing, and develop other personal and professional development skills.

So: here are the hard lines I'm drawing related to the use of AI on this site:

1. **AI/LLMs will never be used to generate content for these notes.** That's the hardest boundary — this is ***my*** space for thoughts and information, and the writing will reflect that.
2. **AI/LLMs will be used to assist in developing the source code for the site.** This site relies on a heavily-modified version of [Jacky Zhao's Quartz framework](https://quartz.jzhao.xyz/) to parse through my Obsidian vault. I've organized the code to make it easier to modify aspects that I care about the most, such as tag processing and the logic for the graph rendering. I can't emphasize enough that [[tags/engineering/frontend/index|building and designing sites]] really isn't my forté — I want my time on this site to be far more focused on its content, and spending my time fumbling through [long, inline JS scripts](https://github.com/jackyzha0/quartz/blob/v4/quartz/components/scripts/graph.inline.ts) distracts from that. 
3. **AI/LLMs may be used to assist in naming, and adding short metadata descriptions, to posts.** Despite how poor some of my writing is, I'd like to think that some of the information on this site could be useful to folks. However, even the most useful information is useless if nobody can actually *find* it. I may use AI to workshop accurate and efficient titles and descriptions — purely the pieces of data that you'd find when, say, searching online. That said, this will not go unmonitored: I will **always** be the final approval for post titles and descriptions.

As for AI **consumption** of the site:

1. I'm really not sure there's much I can do about AI scraping the site. I'm sure there's some things, but as far as the public portions of the site go, I'm not particularly against that information being read.
2. However — since restarting writing during the Season of Systems, I've decided to take certain portions of this site private. The two primary private collections are periodic notes, as well as initial drafts of notes. The metadata for these notes (titles, tags, forward- and backlinks) are preserved, but the actual contents of the notes are contained in a separate repository. These notes will all be labelled with the [[tags/private/index|private]] tag. I don't necessarily want them *publicly* available, but if one does seem interesting to you, please [[contact|contact me]] and — more likely than not — I'd be happy to chat about the original contents.
