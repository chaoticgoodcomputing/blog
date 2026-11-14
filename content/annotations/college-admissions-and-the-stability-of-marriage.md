# Annotations: College Admissions and the Stability of Marriage

> A dive into the hottest algorithm of the 1960s: Gale-Shapley matchmaking. Who knew that the mysteries of the heart could be solved with a matrix?

- Page: https://blog.chaoticgood.computer/content/annotations/college-admissions-and-the-stability-of-marriage
- Author: Spencer Elkington
- Published: 2024-03-14
- Updated: 2026-11-02
- Tags: economics/markets, writing/annotations

---

This is a little test of something I’d like to do - keeping annotations of papers I’ve read on the CGC website, provided that they are open-access (which, unfortunately, is not always the case.)

This is being done with the [Obsidian Annotator](https://github.com/elias-sundqvist/obsidian-annotator) plugin. I have *absolutely no idea* how quartz is going to handle this, so… we’ll see! There’s a very real chance that this is going to end up being a substantially heavier lift on the frontend and design side than my feeble backend brain can handle. So, if you’re seeing this, feel free to pat me on the back for figuring it out (☞ﾟヮﾟ)☞

* * *

Without further ado! College Admissions and the Stability of Marriage was the second paper(ish) that I read related to market design and non-market environments that got me interested in the subject. The first, Dr. Kenneth Arrow’s [Social Choice and Individual Values](https://cowles.yale.edu/sites/default/files/2022-09/m12-2-all.pdf), was related more to voting systems - something that comes up every four years in America and then somewhat drifts into a hibernation until the next worthy national debate over the merits of first-past-the-post.

This one caught my attention, though, as it was the first technical analysis I’d seen of a topic that had some *weight* to it in my own life, and in the lives of others - partnership, romance, all the fun ones. If Arrow turned the handle on the door into this specific interest, it was Gale and Shapley that kicked it wide-open.

It was especially fun to present a summary of this paper in [Dr. Allison Stashko](https://blog.chaoticgood.computer/content/notes/stability-of-marriage#^635c68)’s Non-Market Environments course. I was proud to cap off the end of the term talking to my fellow early-20s undergraduates about something we could all understand at the deepest of levels: Being Horny™

Source document: [www.math.utoronto.ca](https://www.math.utoronto.ca/mccann/assignments/477/GaleShapley62.pdf)

## Annotations

> Is it ethical to accept the first without informing the second and then withdraw his acceptance if the second later admits hi

It’s interesting that [exploding offers](https://en.wikipedia.org/wiki/National_Resident_Matching_Program#:~:text=Students%20were%20being%20issued%20%22exploding%22%20offers%20that%20required%20them%20to%20make%20a%20decision%20about%20training%20before%20hanging%20up%20the%20telephone.) aren’t mentioned here - reading this for the first time in 3-4 years, I thought that it was mentioned at the top.

If it isn’t mentioned at all in this paper, then it was without a doubt Alvin Roth’s [Who Gets What — And Why?](https://www.amazon.com/Who-Gets-What-Why-Matchmaking/dp/0544291131) that introduced the concept to me.

Mar 14, 2024

> DEFINITION. An assignment of applicants to colleges will be called unstable if there are two applicants a and ,B who are assigned to colleges A and B, respectively, although ,3 prefers A to B and A prefers :

In the actual presentation, it was deeply difficult to re-word this in a way that didn’t sound like I was having another aneurysm. It reads *somewhat* well on paper, but sounds completely unhinged out loud.

Mar 14, 2024

> Example 1. The following is the "ranking matrix" of three men, a, ,3, and 7, and three women, A, B, and C.

Another difficulty was trying to reframe this specific style of diagram in such a way that a room full of people who’d been staring at game theory model grids for four years didn’t reflexively start eyeballing Nash equillibria

Mar 14, 2024

> THEOREM 2. Every applicant is at least as well off under the assignment given by the deferred acceptance procedure as he would be under any other stable assign- ment.

The idea of match optimality was the concept that launched me out of this paper and into a rabbit hole of reading more about matchmaking algorithms, and actually modeling this in Python to toy around with the concept.

If, as they assert, this will give the *assignees* their optimal outcome compared to *other* stable match configurations, that implies the existence of other stable match configurations.

Take a look at the assignment grid above — it’s a 2D grid representing *one* possible stable configuration. In that case, you could imagine that all possible configurations — stable or unstable — stacked on top of each other to form a 3D grid, or *lattice*, of match configurations. All of the possible 2D grids stacked like a big crystalline structure.

From that lattice, you can slide out all of the unstable configurations (because, obviously, they suck and don’t mean anything), leaving us with a **stable match lattice**.

The even more interesting thing is - now that you have that stable match lattice, what *exactly* is in it? That’s where this particular part gets super zesty - “Every applicant is **at least as well off \[…\] as he would be under any other stable assignment**”

Gale-Shapley’s stable match algorithm takes in two sets of people — in the case of this paper, men and women — which you can think of as the “assigner” and the “assignee”, the former of which makes the proposals and the latter who accepts or declines them. Think of it as a formula:

```
matches = gale_shapley(assigners, assignees)
```

**Gale-Shapley is a noncommutative operation that optimizes the outcome for the *assigners* set**.

Imagine you have a set of four men and four women, and you want to measure how “good” a matchmaking configuration is. You could imagine that the best-case scenario is that everybody ends up with their #1 choice, and the worst-case scenario is that everybody ends up with their #4 choice. We can use that as a baseline for measuring the “goodness” of the matchmaking.

Let’s say, in some given matchmaking pair, everybody gets their first choice — the best case. If you were to add up everybody’s result (1st place) and average it by the number of people (8 people) you’d get a value of `1`. On the flip side, for the worst-case, you’d get a value of `4` - ultimately being able to answer the question “*On average*, how well were people placed?”

Ultimately, if you take an analysis of the average placement of the assigner group (in this case, men), you’ll see that **the assigner group’s average in Gale-Shapley is the highest of all possible stable configurations**.

Ultimately, if you were to rank-order all possible stable matching sets on the matchmaking lattice on a spectrum of “Benefits Group A” to “Benefits Group B”, the outputs of `gale_shapley(A, B)` and `gale_shapley(B, A)` calculate the ends of the lattice.

This also implies a bit of a potential ethical issue. Depending on the context, there is an active decision made for “who gets better outcomes” by simply putting them into the algorithm first. Even within this paper, the marriage example itself generates the stable marriage output that provides men with the optimal output.

Ultimately, matchmaking is still something that interests me deeply, and I’m hoping that CGC (either the consulting side or development side) puts me in a position to keep working with these very interesting, *very* cool situations.

Mar 14, 2024
