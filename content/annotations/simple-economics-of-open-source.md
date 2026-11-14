# The Simple Economics of Open Source

> Why do we do what we do? "Egoboo." Exploring economic models of OSS contributions beyond altruism and ego.

- Page: https://blog.chaoticgood.computer/content/annotations/simple-economics-of-open-source
- Author: Spencer Elkington
- Published: 2024-03-17
- Updated: 2026-01-10
- Tags: economics/markets, engineering, writing/annotations

---

Source document: [www.nber.org](https://www.nber.org/system/files/working_papers/w7600/w7600.pdf)

## Annotations

> THE SIMPLE ECONOMICS OF OPEN SOURCE

I feel like I’ve been throwing out a lot of super speculative opinions on the economics of OSS lately - with a couple upcoming projects and opportunities, I want to make sure I understand some quantitative models for OSS contributions.

Mar 17, 2024

> International Data Corporation estimates that the open source program Linux has between seven to twenty-one million users worldwide, with a 200% annual growth rate.

well i’m sure this number is quite large 24 years later, huh?

Mar 17, 2024

> Many observers believe it represents a leading potential challenger to Microsoft Windows in this important market segment.

I actually don’t know… what did people use for servers before Linux? Not to betray my youthful age but I can’t even imagine what was going on before Linux became a de-facto standard for headless server runs.

Mar 17, 2024

> The “utility function” Linux hackers is maximizing is not classically economic, but is the intangible of their own ego satisfaction and reputation among other hackers. \[Parenthetical comment deleted\] Voluntary cultures that work this way are actually not uncommon; one other in which I have long participated is science fiction fandom, which unlike hackerdom explicitly recognizes “egoboo” (the enhancement of one’s reputation among other fans) \[Raymond, 1999b\].

“egoboo” is a new term. While I do think (going into this on a first read-through) there are economic benefits related to labor contributions to OSS, i definitely don’t disagree that there is some level of utility in ego that keeps things moving.

Mar 17, 2024

> ny explanation based on altruism1 only goes so far.

in general, “If everybody just \_\_\_\_\_” is a god-awful way to design markets.

Mar 17, 2024

> Reflecting the early stage of the field’s development, we do not seek to develop new theoretical frameworks or to statistically analyze large samples

Damn. I may have to find more recent papers, although I will finish reading this one through to the end.

Mar 17, 2024

> Unix operating system and the C language used for developing Unix applications, were originally developed at AT&T’s Bell Laboratories.

oops. I thought UNIX was a standard (\*NIX), not an OS in-and-of-itself.

Mar 17, 2024

> These cooperative software development projects were undertaken on a highly informal basis. Typically no effort to delineate property rights or to restrict reuse of the software were made. This informality proved to be problematic in the early 1980s, when AT&T began enforcing its (purported) intellectual property rights related to Unix.

Now *this* is ironic. given the inherently OSS nature of UNIX (with 24 years of hindsight) the fact that AT&T/Bell Labs tried to enforce a trademark on it is wild.

Mar 17, 2024

> In exchange for being able to use and modify the GNU software (as it was known), users had to agree to make the source code freely available (or at a nominal cost). As part of the General Public License (GPL, also known as “copylefting”), the user had to also agree not to impose licensing restrictions on others.

Yahaha! The first case of a “cascading” license agreement, where software using GNU had to also, in turn, be GNU.

Mar 17, 2024

> In some cases, passionate disputes over product design have led to the splintering of open source projects into different variants.

Two examples off the top of my head:

-   Dolphin, the open-source Gamecube/Wii emulator, and its’ Ishiiruka fork. IIRC, there’s a bit of sass between the original developers regarding the Ishiiruka fork. Not sure what the context is.
-   A recent (and spicy) one: the licensing changes around Terraform, spurring the creation of the OpenTofu fork.

Mar 17, 2024

> the apparently lesser emphasis on documentation

some things truly are evergreen.

Mar 17, 2024

> \[I\]n every release cycle Microsoft always listens to its most ignorant customers. This is the key to dumbing down each release cycle of software for further assaulting the non-personal computing population. Linux and OS/2 developers, on the other hand, tend to listen to their smartest customers... The good that Microsoft does in bringing computers to non-users is outdone by the curse that they bring on experienced users \[Nadeau, 1999\]

I can get on board with this. Windows development is notoriously a pain in the ass.

Mar 17, 2024

> concomitant

[a term worthy of a link.](https://en.wikipedia.org/wiki/Concomitant_(statistics))

Mar 17, 2024

> In 1999, the Apache Software Foundation was established to oversee the development and diffusion of the program

This is something else I’d like to look into — the structuring and continuity of OSS foundations.

Mar 17, 2024

> The delayed reward covers two distinct, although hard-to-distinguish, incentives. The career concern incentive refers to future job offers, shares in commercial open source-based companies,9

Certainly worthy of follow-up research.

Mar 17, 2024

> To have an “audience,” programmers will want to work on software projects that will attract a large number of other programmers.

Interesting to see the term “audience” made in the pre-influencer era.

Mar 17, 2024

> A fad can create a strong signaling incentive: researchers working in a popular area may be highly motivated to produce a high-quality work, since they can be confident that a large audience will examine their work.

possibly why i lowered the bar for the blog - i don’t have a clue if anybody actually reads it (☞ﾟヮﾟ)☞

Mar 17, 2024

> Customization and bug-fixing benefîts: The cost of contributing to an open source project is lower if the activity brings about a private benefit (bug fixing, customization) for the programmer and her firm. Note again that this factor of cost reduction is directly linked to the openness of the source code.

I hope this is elaborated on - I do think that this is the reason why companies will open-source previously private projects, as it opens up bug-fixes and improvements to a broader audience at the expense of (potentially) giving an edge to direct competitors.

Mar 17, 2024

> Better performance measurement: Outsiders can only observe inexactly the functionality and/or quality of individual elements of a typical commercially developed program, as they are unable to observe the proprietary source code. By way of contrast, in an open source project, the outsiders are able to see not only what the contribution of each individual was and whether that component “worked,” but also whether the task was hard, if the problem was addressed in a clever way, whether the code can be useful for other programming tasks in the future, and so forth

One of the things CS students are told *constantly* is “Contribute to OSS!” and this is the vast majority of the reason. If you don’t have the authority of having previously had an engineering position, OSS is a good way to show the results of your project.

While I seriously doubt that any interviewer will look beyond an initial use-case for an OSS project you’ve contributed to, it does add a signal of “They did contribute!” to the project.

Mar 17, 2024

> Economic theory would predict that the programmer's performance is more precisely measured in the former case.

This *is* crunchy! Because contributing to OSS is a self-decided move, it does make sense that the success is more indicative of single-agent performance rather than external factors.

Mar 17, 2024

> Greater fluidity: It may be argued that the labor market is more fluid in an open source environment. Programmers are likely to have less idiosyncratic, or firm-specific, human capital that limits shifting one’s efforts to a new program or work environment. (Since many elements of the source code are shared across open source projects, more of the knowledge they have accumulated can be transferred to the new environment)

Yes!!! never underestimate the power of building transferrable skills.

Mar 17, 2024

> By way of contrast, tasks aiming at helping the much-less-sophisticated end user—e.g., documentation, design of easy-to-use interfaces, technical support, and insuring backward compatibility—usually provide lower signaling incentives.14

Hmmmm… I don’t know if I’d agree with this. Referencing the previous annotation, I think people tend to sleep on proper documentation and polish. While I don’t think this’d be the case for “industry-standard” OSS (curl being a good example), I do think that (for an individual contributing to OSS with less authority, adoption, or audience) documentation is key.

If an interviewer or company isn’t familiar with your work, they at least need to be able to see at-a-glance what the value of a project is. Even experienced engineers wouldn’t give a shit about a random GitHub repository with no documentation, even if it contains big-brain ideas or world-changing software.

Mar 17, 2024

> Open Source Definition” \[Open Source Initiative, 1999\].

Follow-up needed — I’m interested to see if this has evolved at all, or at the very least to read & review.

Mar 17, 2024

> A successful open source project also requires a credible leader or leadership, and an organization consistent with the nature of the process.

Interesting - let’s talk about some ethos!

Mar 17, 2024

> (b) make sure that the overall project is divided into much smaller and well-defined tasks (“modules”) that individuals can tackle independently from other tasks,

My brain is screaming “VSA!”. Parallelization is as important — if not *more* important — in *planning* software development as it is in software development itself.

Mar 17, 2024

> being abandoned

oh, i hadn’t thought of this — part of the reason I try to bring collaborators in on CGC work is because having even a *small* team does wonders in keeping momentum.

I’d liken it to the idea of variance in multiple distributions. Combining two normal distributions — in this case, representing motivation and velocity — ultimately lowers the variance of the distribution.

Mar 17, 2024

> Another important determinant of project success appears to be the nature of its leadership. In some respects, the governance structures of open source projects are quite different. In a number of instances, such as Linux, there is an undisputed leader. While certain aspects are delegated to others, a strong centralization of authority characterizes these projects. In other cases, such as Apache, a committee will resolve the disputes by voting or a consensus process.

What?! They didn’t even mention Perl’s weird-ass “cycling leadership” that was mentioned at the top of the paper. I want to know more about that! It sounds whack as hell!

Mar 17, 2024

> For instance, on the Apache web site, it is explained how proposed changes to the program are reviewed by the program’s governing body, whose membership is largely based on contributions to the project. (Any significant change requires at least three “yes” votes—and no vetoes—by these key decision-makers.)

I wonder how this works now that Apache is no longer just “Apache,” but also an amalgamation of products (e.g Spark, Arrow (or whatever that underlying Database structure thing is called, etc.)

I also wonder… how does this contribute to private use of the software? I know that the person who made Apache Spark now (IIRC) works as the CTO at Databricks, who benefits *immensely* from continued development on Spark. Are there instances of people in these positions potentially using this voting/veto power to further their own private interests at the cost of the broader community — and, if so, was trust undermined?

Mar 17, 2024

> video game companies

Huh - this *is* something I’d never thought about. Video games are really weird, insofar as some of them do [roll credits](https://www.youtube.com/watch?v=X4NpBtAu79g) at the end of the game, not unlike movies or television shows.

Mar 17, 2024

> Another area in which software companies might try to emulate open source development is the promotion of widespread code sharing within the company. This may enable them to reduce code duplication and to broaden a programmer's audience.

See - I wonder if there are good, broad solutions to run software repositories for things like `pip`, `apt`, `npm`, etc, since that would be a *fantastic* thing to set up at companies for people to install things across the company.

One shortfall may be undermining the ease-of-use of just using the default, public software repositories.

Mar 17, 2024

> An internal Microsoft document on open source \[Valloppillil, 1998\] describes a number of pressures that limit the implementation of features of open source development within Microsoft.

Oh shit - this should *absolutely* be followed up on.

Mar 17, 2024

> the free-rider problem often discussed in the economics of innovation should apply here as well

finally! the free-rider problem!! This is the one I think about most when OSS contributions come up.

If you can use a piece of software *and* don’t have to incur the cost of contribution, why contribute?

Mar 17, 2024

> Subsidies by commercial companies for open source projects should remain limited unless the potential beneficiaries succeed in organizing a consortium (which will limit the free-riding problem).

…I need to look into this more. What exactly does the consortium provide that de-limits the amount of commercial contributions to a project?

Some level of coordination and more authority, perhaps?

Mar 17, 2024

> Companies can release existing proprietary code and create some governance structure for the resulting open source process.

Ah, yes! K8s, React, Material, etc etc etc!

Mar 17, 2024

> They can even (though probably less likely) encourage “ex nihilo” development of new pieces of open source software.

“Ex Nihilo” in this case meaning “Something for nothing.” This is somewhat the flipped case of free-riding, where the owner of the OSS expects contributions from others.

I’d imagine this use case would, in effect, undermine the authority of the company releasing proprietary software as OSS.

However, the interesting thing - what if the company simply “transfers ownership” over to an OSS consortium? I believe I’ve seen this one happen before, but examples are eluding me.

Mar 17, 2024

> This is similar to the strategy of giving away the razor (the released code) to sell more razor blades (the related consulting services that HP will provide).

Ah, yes, the Terraform to Terraform Cloud pipeline.

Mar 17, 2024

> Netscape’s 1998 decision to make “Mozilla,”

I had no idea Mozilla came from Netscape in this situation - and it’s funny to see that Mozilla *has* worked out pretty damn well. Does Netscape still retain some ownership over the modern Mozilla organization?

Mar 17, 2024

> It is also likely that Netscape did not adopt the right governance structure.

It’s so interesting to see this 2000 paper paint Mozilla as a failure. It’s worth a follow-up to see how Mozilla pulled out of what this paper paints as a nose-dive, death-spiral of irrelevance.

Mar 17, 2024

> In particular, a corporation may not be able to credibly commit to keeping all source code in the public domain and to adequately highlighting important contributions.

This is interesting - IIRC Google has an “internal build” of K8s running, meaning that an inferior (Google-contribution-wise) version was the OSS version.

I’d say the same thing about Databricks/Apache/Delta Lake, since I know that was the topic of some passion at one point.

Mar 17, 2024

> Collab.Net, a new venture funded by the venture capital group Benchmark Partners, will organize open source projects for corporations who wish to develop part of their software in this manner. Collab.net will receive fees for its online marketplace (SourceXchange, through which corporations will contact open source developers), for preparing contracts, for helping select and monitor developers, and for settling disputes.

Collab.net now redirects [here](https://integrations.digital.ai/), which is *quite* a pivot. That said, I feel I have seen SourceXchange out there - although I may be confusing it for StackExchange. It’s worth following up to see if there’s some relation, there.

Mar 17, 2024

> First, the open source project may be “hijacked” by a participant who builds a valuable module and then offers proprietary APIs to which application developers start writing.

Ah, the curl-to-Postman pipeline.

Mar 17, 2024

> Second, the coexistence of commercial activities may alter the programmers' incentives. To understand why it may be useful to make an analogy with academia (despite some differences between the academic research and open source development processes).

Something I have noticed is that people in OSS get *real heated* when the possibility of financial sponsorship comes up. I personally believe that it’s in the moral right to contribute financially to OSS — which is why I have contributions like that built into my budget — but I’ve seen people get real mad about that take.

Mar 17, 2024

> Second, the academic process may lose some of its integrity.

Okay — while I do get where they’re coming from, the fact alone that JSTOR was selling access to this paper for $40.00 when it was available elsewhere as a draft does make me giggle.

Tell me more about commercial interests polluting academic progress?

Mar 18, 2024

> While it is too early to tell, some of these same issues may appear in the open source world.

“Too early to tell” from a paper written in 2000 is a great signal to follow-up.

Mar 18, 2024

> But recent developments in computer science and programming languages (e.g., object-oriented programming)

teehee — “recent”

Mar 18, 2024

> a few individuals (or at most a few dozen) accounting for a disproportionate amount of the contributions, with most programmers making just one or two submissions.

This feels like something GitHub would have data on. Worth a follow-up

Mar 18, 2024

> At the same time, it is heartening to us how much of open source activities can be understood within existing economic frameworks, despite the presence of claims to the contrary.

Considering OSS has continued to grow, my gut instinct is that there *are* economically-incentivized reasons for contributions and that further research into… the further research, done in the last 24 years will yield some interesting new insights.

I’m glad I started here - doing research on this chronologically will, I think, be a very interesting project.

Mar 18, 2024
