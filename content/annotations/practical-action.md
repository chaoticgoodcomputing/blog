# Procedure & Practical Action

> Brief notes on the paper "Office Procedure as Practical Action", a 1983 XEROX study on modeling work as procedures.

- Page: https://blog.chaoticgood.computer/content/annotations/practical-action
- Author: Spencer Elkington
- Published: 2026-11-18
- Updated: 2026-11-22
- Tags: economics/management, engineering, reading/papers, writing/fragments

---

Source document: [www.ida.liu.se](https://www.ida.liu.se/~729G12/mtrl/suchman_1983.pdf)

## Annotations

> XEROX Palo Alto Research Center

Immediately flagging: I feel like XEROX was, at one point, punching *so far* above its weight in digital design. I’m super excited to see what they were cookin’ up in…

*1983?*

Whew – I always meant for [Programming as Theory Building](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building) and [No Silver Bullet](https://blog.chaoticgood.computer/content/no-silver-bullet-1986) to be the start of me reading towards the future, and here we are stepping slowly back towards the past.

Nov 19, 2026

> W h i l e a n a l y z i n g t h e office is e s s e n t i a l to s o f t w a r e d e s i g n p r o j e c t s , t h e o r g a n i z i n g f r a m e w o r k p r o v i d e d b y k n o w l e d g e - b a s e a n d i n f o r m a t i o n flow r e p r e s e n t a t i o n s c o n s t r a i n s t h e a n a l y s t ' s view.

I’m seeing two pull-ins to this basis:

1.  [PaTB](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building), in general, regarding the lossiness of intermediate representations; and
2.  [A note on NSB](https://blog.chaoticgood.computer/content/no-silver-bullet-1986#^ncf9kp5bnq) that talks about the PCA-ness of visualizations: that a system can be visualized on one “primary axis” that captures the most information about the system, but that a single visualization isn’t enough. in this case, knowledge-base and information flow representations constrain the more holistic view of the system.

My question (which is almost certainly going to be answered) is: what are the missing angles past the sane defaults you (or I!) might think of when given an organization or workflow and told: “conceptualize this!”

Nov 19, 2026

> The case suggests that the procedural structure of organizational activities is the product of the orderly work of the office, rather than the reflection of some enduring structure that stands behind that work \[1\]

Another pull-in would be the [self-organizing tendency](https://blog.chaoticgood.computer/content/annotations/valve-handbook#^bwbfzszneca) from the Valve Handbook.

Nov 19, 2026

> Scientific Management {1911)

Stashing [here](https://resources.saylor.org/wwwresources/archived/site/wp-content/uploads/2011/08/HIST363-7.1.3-Frederick-W-Taylor.pdf)

Nov 19, 2026

> separation of planning and execution

This is one that feels in tension in the modern age: I, myself, have used systems like the Pocock skillset for LLM agents, which does (generally) split up the difference between planning (`/grill`, `/to-spec`) and execution (`/to-issues` -> `/implement`), with the only “actionable” carve-out being `/prototype` during planning.

Even from the start of actual agentic tools (Cline was the first I used, even before picking up Claude Code in its research alpha) did clearly delineate between “plan” and “act” mode.

It seems like this paper will dispute this, which is in good (modern) company. Agile itself was a response to this style of work, favoring instead rapid and iterative work in response to constant feedback, and Pragmatic Programmer leans *heavily* in that direction as well. In LLM times, Appleton argued in her post on [Planning with Agents](https://blog.chaoticgood.computer/content/annotations/highlights/maggieappleton.com/Planning-with-Agents-Divided-Worlds,-Boundary-Objects,-and-Thicker-Interfaces#^ny92rr4q7ij) that this also is an inorganic way of splitting work.

Tying it back to lean production, which fundamentally opposes buffering: plans are the buffer of ideation work. By splitting a project into pure planning -> pure execution, you’re buffering the planning in an unhelpful way.

Nov 19, 2026

> For computer scientists doing office research, these troubles result from the stub- bornly ambiguous properties of office procedures when compared to the step-wise instructions of computer science.

I am actively trying to suppress the feeling of panic I get when I think about [my own experience with this](https://blog.chaoticgood.computer/tags/projects/dayjob).

Nov 19, 2026

> (an endless task)

> [!quote] Quote
>
> If the exercise of intelligence depended on following rules there would have to be rules about how to follow rules, and about how to follow the rules about following rules, etc. in an infinite regress, which is absurd.
>
> – Peter Naur, [Programming as Theory Building](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building#^gd5iff7guhu)

Nov 19, 2026

> The work of finding the meaning of organizational plans in actual cases is referred to as practical action.

This has the same smack to it as a line from the introduction of [Lean Software Development](https://blog.chaoticgood.computer/content/annotations/lean-software-development/00-prelude): that a change must be proven to work *operationally*.

If I’m understanding the definition, here, it’s that practical action is studying the structure of the work *in vivo*.

Nov 19, 2026

> n this paper the problems of procedural implementation and their solution are demonstrated in an example drawn from observation of an accounts payable auditing procedure.

If 12 year-old me knew that I’d someday be up at midnight reading a post-mortem of an AP procedure from 1983, he’d probably shoot me.

Nov 19, 2026

> The study began from the observation that specification of even the most routine clerical work as a schema of procedures is an unsolved problem in automated office systems design \[3\]

This isn’t meant to immediately discount this work, but I would make an immediate call to the [Buy versus Build](https://blog.chaoticgood.computer/content/no-silver-bullet-1986#^y1gz1ngkwvm) portion of No Silver Bullet, where they talk about how hardware was expensive enough that justifying bespoke software to come with it was easy in a raw cost comparison. Once computer hardware dropped in price, the cost of creating bespoke software became proportionally unconscionable – at which point adapting processes to fit into out-of-the-box software (just use Excel!) became the norm.

I won’t hold up my own reading thinking about the flipped economics that vibecoding has done to the cost of bespoke software creation, although it is worth a writeup *somewhere* – just not here, or now.

Nov 19, 2026

> practitioners of office work

“normies”

I jest, but couldn’t help it

Nov 19, 2026

> in the course of getting it done

See, this is something that I’ve come to understand is borderline indescribable. It’d be like trying to answer the question “how do you *know* you didn’t leave the oven on this morning?” None of us likely do some kind of verification ritual to ensure we haven’t (having to strict a ritual around that kind of thing is, quite literally, diagnosable): we just… *don’t do that.*

I have found that trying to dig too far *inside* of a process like the one being described feels like a losing game, and that defining the inputs and outputs at the boundaries (as in, the things that get physically handed off from one process to another) and then letting the internals sort themselves out without too much micromanagement.

I’ll be interested to know what the case study comes to.

Nov 19, 2026

> e. suggestive rather than exhaustive.

I’m going to get this printed on a shirt.

Nov 19, 2026

> 3.1 The Procedure

Even though they do *explicitly* warn against this above, I’m an irrepressible scamp with modern tools at my disposal. Here’s a flowchart of the procedure they outline below:

![Pasted image 20261119002846](https://blog.chaoticgood.computer/_astro/Pasted%20image%2020261119002846.-DItWCxI_ZBv3pm.webp)

![Pasted image 20261119002908](https://blog.chaoticgood.computer/_astro/Pasted%20image%2020261119002908.BO_eK6RD_L30Qu.webp)

*Blaspheme*, considering this paper seems to be going in the direction of “you can’t just make a flowchart!”, but I did want to make sure I at least understand the flow of what we’re doing here. In the [PCA analogy from NSB](https://blog.chaoticgood.computer/content/no-silver-bullet-1986#^ncf9kp5bnq): I want to make sure that there’s some kind of first principal visualization I have in my head before moving on.

Nov 19, 2026

> s a claim of payment overdue, a past due invoice is a formalized notice of trouble. If a past due invoice were taken at face value, payment could simply be issued without delay.

Reading through this, I’m actively trying to suppress the “engineer” part of my brain chanting “but, *what if…!*”

Here, we get to the first instance of “the flowchart doesn’t capture everything”. I think the best way I’d describe it is that, in clicking on the edge between nodes “Issue Invoice” and “Match Invoice”, there’s a missing validation step of “If the invoice received is a past-due invoice, check if it really is past due”.

The adage that comes to mind reading this is the ol’ “draw the rest of the fucking owl” meme: there are more detailed subgraphs that could be tacked onto the preliminary graph from above.

Nov 19, 2026

> Sequence 1 L255 \] R: There's another purchase order some- L256 I I mean there's another payment somewhere? L257 I K: Yea, there's got to be another. L258 \] R: There's another payment somewhere, L259 I now where is that? Is the question.

This is some riveting stuff, huh?

There’s something kind of refreshing that this conversation sounds like it could still be had nearly 50 years later. “Where is that?” is core to the human condition.

Nov 19, 2026

> Sequence 3 L333 K: L334 R: L335 K: L336 R: L337 K: L338 R: L339 K: L340 R: ~ - I u u u h . Hmm? Look at ((invoice for item 8)) missing page 2. Where do you get that at? Page 2. Page 2? It's a two page pur- two page, uh invoice? Oh no, oh no. {You're not gonna like this.} I know I'm not gonna like it. I already don't like it, L341 K: Okay, L342 R: I'm having to look at it, that's making me not like it.

I’m sitting awake at 1am, laughing my ass off at “I *already* don’t like it.”

Nov 19, 2026

> Standard procedures are formulated in the interest of w h a t things should come to, and not necessarily how t h e y should arrive there. It is the assembly of orderly records out of the practical contingencies of actual cases t h a t produces evidence of action in accordance with routine procedure.

Anybody who has ever responded to a security incident (which typically results in a report of what occurred, how it was resolved, and the potential scope of the damage) should recognize this in their guts. A security incident report is, quintessentially, the creation of an ordered record out of the most disordered, open-ended, panic-induced working session.

If you want a great example, this [post-mortem by monorepo coordination utility software NX](https://nx.dev/blog/nx-console-v18-95-0-postmortem) is possibly the most helpful, ordered document I’ve seen related to a security incident. As somebody who was watching the Shai-Halud attacks very carefully, it was a total shitshow of people realizing that things that they’d assumed were handled in a more sane and secure way (I’m looking at you, `gh`) were actually gaping security holes. The writeup itself is a very polished, carefully considered description of a massive dumpster fire.

Nov 19, 2026

> Alternatively, the designer can recognize the judgment required in the accomplishment of actions according to procedure. The goal in this case is to design a system whereby the actual work involved in carrying out procedures, specifically the ongoing inquiries of which it is comprised, is accomplished through the system itself. This is not to say that the work is taken over by the system; given the work's embeddedness in real world contingencies, full automation is neither possible nor desirable. Rather, the intent of the system is to facilitate the work demanded by the particulars of actual cases, and qualitatively enhance worker's methods of research and analysis. The goal of such a system is to serve as a tool for the work of accomplishing procedures, rather than a "black box" that accepts the product of that work as input, and requires that the work essentially be done in advance of its entry.

I have… many thoughts on this. “Draw the rest of the owl” does keep pinging around my skull in thinking about this particular paper. This philosophy *is* far more in line with traditional Agile: particularly around delayed decision-making (e.g. don’t make a decision until you have to, and try not to put yourself in the position where you need to decide something prematurely).

I think that the exhaustive approach they describe as Option 1 is both unhelpful, *and* is an easy rung to reach for (or, an easy oven to burn yourself on) when you come at this from an engineering frame of mind. I, myself, have been burnt by that one a *lot* in the last 18 months of working on the internal ACME program at [work](https://blog.chaoticgood.computer/tags/projects/dayjob).

Ultimately, this means understanding that a system cannot be entirely prescriptive – that human work can’t totally be boiled into deterministic steps. However, I do think that it values the structure of the closely-specified *deliverable* at points in the system: being able to say “X, Y, and Z are required before continuing. Figure out *some* way to get X, Y, and Z ready”.

Nov 19, 2026
