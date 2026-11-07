# You can pry my dashes from my cold, dead hands

> A bit of self-reflection on dashes in my writing to decide if LLMs have rotted my brain, or if my brain was already beyond saving from the start.

- Page: https://blog.chaoticgood.computer/content/notes/dashes
- Author: Spencer Elkington
- Published: 2026-11-02
- Updated: 2026-11-03
- Tags: engineering/data, writing/notes

---

*I get it*.

The em-dash has been co-opted by LLMs. Survey ten people, and nine of them will say “if there’s an em-dash, there’s AI.”

They’re *wrong*, but I *get it*.

If there’s anybody to blame, it’s my mother. For years, she has worked as a [real-time captioner for deaf and hard-of-hearing students](https://www.realtimecartcaptioning.com/). Her specialty is PITA: [pain-in-the-ass](https://www.realtimecartcaptioning.com/past-work) classes across a lot of really tricky disciplines. The em-dash is an important tool in writing human speech, because it represents a *pause*. A pause to, perhaps:

1.  Qualify or clarify a piece of information
2.  Pause, think, and – if necessary – pivot.1
3.  Take a deep breath; or
4.  Be interrupted – perhaps, while you were taking that deep breath.

Those PITA classes she captions are *full* of those four cases, and so she has been writing more em-dashes than any other human being in the course of her decades of experience.

So: when you see me use em-dashes, just know that– it’s is a genetic thing. I will never escape that original sin.

I *would* still contend that the em-dash is a *perfectly valid piece of punctuation*, which is why it’s so aggravating that a) LLMs co-opted the emdash for a period of time; and b) even if they *all* stopped using it, it’d still live in perpetual infamy with other artifacts of early AI, like multiple fingers or [sneaky gay boomer Looney Tunes](https://bsky.app/profile/danlehner.bsky.social/post/3myhtqfytc22u).

I *am* willing to entertain that *maybe* – just *maybe* – I’m wrong about this. Perhaps I’m down bad with a case of [Claude-code Syndrome](https://blog.chaoticgood.computer/content/notes/hostage-negotiations) or have a need to embrace [apologisms on behalf of our robot overlords](https://blog.chaoticgood.computer/content/notes/software-gardening).

So: let’s check the tapes.

## From The Archives

Thankfully, I *do* have a pretty solid baseline of writing on this site over the course of the last ~4 years. While it’d be interesting to, say, crack open my old undergraduate Canvas account to really populate the back-catalog, what we have on-hand will suffice.

Even though it was written a couple years ago, I still hold true to this site’s [AI policy](https://blog.chaoticgood.computer/ai-policy): this is the space for *me* to be bad at writing, so all of the writing in the public portions (and most of the private portions) of this blog are, in fact, my own bad writing.

As of the date *you* are reading this, my blog has this volume of my own writing:

|     | Public | Private | All |
| --- | --- | --- | --- |
| Notes | 63  | 227 | 290 |
| Words | 68,678 | 103,001 | 171,679 |
| Sentences | 3,550 | 8,088 | 11,638 |
| Paragraphs | 1,883 | 5,131 | 7,014 |

For the purposes of this work, I’m considering anything with a publication date **before** my post about [GPTinglish](https://blog.chaoticgood.computer/content/articles/binglish) to be outside of LLM *influence*. As best I can remember, I wrote about GPTinglish when Bing first released… *whatever* their first agent was called, which was the first time that LLMs and chatbots really entered *the mainstream*2.

It’s my hope that we’ll have a solid before-and-after sample. My guarantee is that public notes are purely my own work, and that the vast majority (>95%) of *private* notes are also my own work. There are occasional portions where I use the private portions of my vault for experimenting with LLM use3), but I’ve done my best to filter out any of those for this data.

So, that’s the first part of this experiment: **I am considering anything after GPTinglish to be culturally tainted by mainstream use of LLMs.**

## What is a dash, *really?*

This is another question worth being clear about, since I haven’t been internally consistent throughout the last ~10 years of my writing, either. The general timeline is:

1.  Pre-GPTinglish, I typically used a single dash without realizing there was an actual difference between `-` and `—`. I know, I *know*: size *does* matter.
2.  Post-GPTinglish, but before em-dashes became A Thing™4, I set up a keyboard shortcut on my computer (`Opt+-`) as a shortcut for emdashes during my Keyboard Shortcut Guy phase of the [Season of Systems](https://blog.chaoticgood.computer/tags/horticulture/seasons/systems)
3.  In May of 2026, I got a new laptop. My Keyboard Shortcut Guy phase was over at that point (and em-dashes had gained their infamy), so I swapped `Opt+-` to be `--` instead of `—`. I do fold to peer pressure pretty quickly.

Another one you might see in this analysis is the *en-dash*, which is… smaller than an em-dash, but longer than a hyphen. The only time I’ve ever seen an en-dash in the wild is [Maggie Appleton’s recent post about Boundary Objects](https://maggieappleton.com/planning-agents)5. Somehow, one or two have snuck their way into my own blog. I can assure you: I don’t know how they got there. Those responsible have been sacked.

That aside: all that context is important to know, because “a dash” and “*which* dash” are two different questions.

As for when a dash *is* a dash, these are the rules:

1.  it has a space before it, after it, or both; and
2.  it’s in my own prose: not in a quote, code, or math.

The four kinds, then, that we’re going to see here:

| Dash | Character | Counts | Doesn’t count |
| --- | --- | --- | --- |
| Single hyphen | `-` | I came - and then I went. well-known word; super- and sub-sets |     |
| Double hyphen | `--` | I came – and then I went. | An arrow, `-->`; a rule, `---` |
| Em dash | `—` | I came — and then I went. | A word—with no spaces (this does not come up in the data) |
| En dash | `–` | I came – and then I went. | A range: 2018–2024 |

As far as spaces go: it is a dash if there is a space *after* the dash. I have recently gotten in the habit of trying to justify my sins by doing the more traditional form of dashes– where they occur immediately after the word they interrupt– but I do still have plenty of history giving them space (`--`) on both sides.

Let’s crack into the data.

## Sins per unit time

In the graph above, you’ll be able to see all of my private notes, stripped down to my own writing where applicable, and only in cases where there is >100 words to analyze. While I have a policy of [not publishing \*all\* of my notes](https://blog.chaoticgood.computer/tags/private), I figured that aggregate statistics would still be fine.

Remember: the goal, here, is to see if there are noticeable trends before and after GPTinglish. Admittedly, there is an uptick of dashes in the post-GPTinglish era! When I was originally compiling the data, there were some cases, like the [Dice Widget](https://blog.chaoticgood.computer/content/notes/scratch/dice-widget), that caused the data to look like it had extremely high outliars.

Even after filtering out those, though, we can see that the emdashes are not only higher, but they increased over that period. Even going back and reading the note about APL’s [Agricultural Valleys](https://blog.chaoticgood.computer/content/annotations/a-pattern-language/04-agricultural-valleys) pattern, I gotta say: that guy was being *pretty gratuitous* with the dashes. I’d understand how somebody could say it has a slightly GPT-ish aftertaste.

One interesting pattern, though, is that period of time after my laptop broke and I reverted back to `--` over true em-dashes. I think that there was something about facing even *having* a shortcut, with the hindsight of the bad reputation emdashes got, that did make me far more conscious of using them. While I would still contend that those four cases I state above *are* absolutely valid use of the mark, there is such a thing as over-seasoning.

## *Am* I the Baddie?

Ultimately, this blog is still meant to be a practice ground to become better at writing and communication. Even *if* the em dash is perfectly valid punctuation in a void, the cultural context does have some weight to it. From a recent post about LLM voice from Martin Fowler:

> [!quote] Quote
>
> Sometimes when I read a post, I get the growing feeling that I’m reading the output of an LLM. I can’t necessarily define why, although there are the common tells (it’s not the em-dashes, it’s the load-bearing tapestries). As I do this my desire to read on atrophies, sometimes to the point of revulsion
>
> – Martin Fowler, [*LLM Voice*](https://martinfowler.com/articles/practitioner-voice.html#TheCraftOfPractitionerVoice)

Another post on the other side of the coin by [Jim Highsmith](https://martinfowler.com/articles/practitioner-voice.html#TheCraftOfPractitionerVoice) talks about cases where using an LLM to communicate may be necessary, so it feels dangerous to dismiss something that has hints of generative assistance. Regardless: if something about my writing takes somebody away from the point *of* that writing, I probably should do it less.

## Sentences, paragraphs, and so on

This post is also groundwork for some other pieces I’m working on at the moment around writing structure and mechanical improvements. For the sake of exploration, I also have some of the some analysis by sentences and paragraph length:

Interestingly enough, I don’t actually see much of the same trend in these lengths. This is doubly surprising to me: first, because I’d have thought there would be *some* cultural artifact once LLMs became mainstream. Secondly, though, I’m surprised because I’ve actually been actively trying *not* to let my sentences and paragraphs run on as long.

Perhaps a more…

aggressive…

approach is in…

order?

* * *

The way these graphs are set up, they’ll continue to track along with future notes. I’d be interested in reviewing these in a year and seeing if any of the metrics have shifted around a bit in the “Future” era.

## Footnotes

1.  See what I did, there? ↩
    
2.  I am loosely classifying “the mainstream” as “my parents could’ve accidentally used it without realizing” ↩
    
3.  This isn’t a secret, either: I have notes about my experience with Obsidian Copilot in [Programming as Theory Building](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building)’s annotations ↩
    
4.  I think my first time acknowledging em dashes getting aped by LLMs was in the [Hostage Negotiations](https://blog.chaoticgood.computer/content/notes/hostage-negotiations) post, which was 8 months *after* GPTinglish ↩
    
5.  Perhaps I *should* start using en-dashes. it’d continue a long and fruitful journey of [following along Maggie’s work from afar](https://blog.chaoticgood.computer/content/notes/digital-gardening-with-quartz). ↩
