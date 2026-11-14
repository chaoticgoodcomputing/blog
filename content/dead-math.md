# Math is Dead, and Pickles are Small

> To understand why OpenAI completely upended the world of mathematics with its proof that Navier-Stokes is not smooth in three dimensions, you must first understand that cucumbers of any size can be properly pickled.

- Page: https://blog.chaoticgood.computer/content/dead-math
- Author: Spencer Elkington
- Published: 2026-10-26
- Updated: 2026-10-28
- Tags: engineering, engineering/ai, economics/management, writing/essays

---

On September 8th, 2026, OpenAI [announced](https://openai.com/index/navier-stokes-solution/) that a fleet of 10,000 AI agents, running GPT-6 Astra and an (as of now) unreleased model at a cost of millions of dollars, discovered [an analytical solution](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf) to a very specific question about the [Navier-Stokes equations](https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_equations). In the most advanced terms I can understand, this is the question:

> [!paraphrase] Paraphrase
>
> “To model how fluid moves in a system, we use a [set of equations](https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_equations) to approximate its behavior. The models are pretty good, but it’s possible that our approximation could give us funky results.
>
> Will it give us funky results?”
>
> – The Clay Mathematics Institute, [*The Millenium Prize Problems*](https://www.claymath.org/millennium-problems/) (2000)

OpenAI’s answer to this question– *also* in the most advanced terms I can understand, was:

> [!paraphrase] Paraphrase
>
> “Yes. It will give us funky results in very funky situations.”
>
> – OpenAI, [*Finite Time Blowup for Navier-Stokes*](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf) (2026)

Some friends of mine– both engineers who specialize in fluids, and who are Very Into™ this type of thing– have told me that this answer doesn’t really mean a whole lot. The world on the morning of September 9th was, *physically*, pretty much the same. They all woke up, went to their jobs (typically in aviation or defense), and continued using the same fluid dynamics simulations that they did the day before.

Planes did not fall from the sky. Missiles, presumably, still exploded. My shower turned on! Fluids seemed to behave as they always have.

Some *other* friends of mine– mathematicians who specialize in proofs and are also Very Into™ thi type of thing– their reaction was (paraphrasing again):

> [!paraphrase] Paraphrase
>
> “What the *fuck?*”
>
> – Mathematicians, *in general* (2026)

On the morning of September 9th, *everything* felt different. To many of them, it was like a seismic force had shaken the very foundations of the universe.

Were humans necessary for the pursuit of knowledge anymore?

Did they invest their youth in a dead art?

*Why would OpenAI do this?*

* * *

On the morning of September 9th, my coworkers and I discussed, at an *ironic* length, the nature of very small pickles.

## What I Learned About Pickles On September 9th, 2026

On [December 2nd, 2024](https://en.wikipedia.org/w/index.php?title=Pickled_cucumber&action=history&dir=prev&offset=20110105185946%7C406128872&limit=500#:~:text=15%3A18%2C%202%20December%202024), Wikipedia contributor [TrulyShruti](https://en.wikipedia.org/wiki/User:TrulyShruti) made the following modification to the Wikipedia page for [“Pickled cucumber”](https://en.wikipedia.org/wiki/Pickled_cucumber):

```diff
- Gherkins, or baby pickles, are small cucumbers, typically those 3 to
- 13 cm (1 to 5 in) in length, often with bumpy skin, which are typical-
- ly used for pickling.

+ Gherkins are small cucumbers, typically those 3 to 13 cm (1 to 5 in) in
+ length, often with bumpy skin, which are typically used for pickling.
```

(Most of the Wikipedia edits on gherkins tend to be focus on whether they are, or are not, “baby pickles”. For the sake of this essay, I will use [the definition as of September 9th, 2026](https://en.wikipedia.org/w/index.php?title=Pickled_cucumber&oldid=1371939008) and assume that they are not *baby* pickles– just *very small* ones.)

Gherkin is also a term used by the Behavior-Driven Development software testing library [Cucumber](https://cucumber.io/)1.

Anybody who has worked as a professional software developer knows, intimately, that nobody actually knows what they want. As discussed in Peter Naur’s 1985 essay [Programming as Theory Building](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building), a large part of building software is the process of taking an idea that exists in somebody’s head– perhaps yours, perhaps someone else’s– and then translating it into instructions for a computer to understand.

Unlike deciding whether or not Navier-Stokes has only smooth outputs in three-dimensional space, consistently describing an idea you have in your head *is* a truly unsolved problem.

## Pickle-Driven Development

In (good) software, a fair bit of effort is spent in writing *tests*. Tests are small, extra pieces of code that run *your* code and verify that it does what you want it to do. It’s a way to make sure that you don’t accidentally make bugs or change important things about what you’re building.

For example: if you wanted to make sure that the calendar app you’re building doesn’t try to give weird numbers for months, you might write something like:

```py
def is_month_a_valid_number(month):
  '''
  Asserts that the number for a month is between 1 (January)
  and 12 (December)
  '''
  assert((month >= 1) and (month <= 12))
```

Cucumber is a philosophy, and code library, for writing better tests. Let’s take a look at the kind of notes that a very well-organized project manager or product engineer might write during a meeting about what a product should be able to do2:

```txt
Feature: Guess the word  

  Scenario: Maker starts a game  
    When the Maker starts a game  
    Then the Maker waits for a Breaker to join  

  Scenario: Breaker joins a game  
    Given the Maker has started a game with the word "silky"  
    When the Breaker joins the Maker's game  
    Then the Breaker must guess a word with 5 characters
```

Those are some good, organized notes! They’ve got a solid use of indentation to group concepts that belong together, with each line clearly labelled. There’s a pattern to the structure, yet it’s simple enough that you could easily write this out while product owners hash out their visions for what the thing you’ll be building for the next six months should look like.

But alas; you’ve been tricked! These *aren’t* just notes! They’re *code!*

```feature
Feature: Guess the word  

  # The first example has two steps  
  Scenario: Maker starts a game  
    When the Maker starts a game  
    Then the Maker waits for a Breaker to join  

  # The second example has three steps  
  Scenario: Breaker joins a game  
    Given the Maker has started a game with the word "silky"  
    When the Breaker joins the Maker's game  
    Then the Breaker must guess a word with 5 characters
```

*That* is Cucumber’s [Gherkin](https://cucumber.io/docs/gherkin/reference) language. It’s a structured, yet *very* natural, way to write out tests. The hope with using something like Gherkin is that writing tests for software isn’t locked behind the ability to code. If you’re willing to follow a few [rules](https://cucumber.io/docs/gherkin/reference#keywords), just about anybody could read *or* write tests for your software.

Want to see just how easy it can be? Check out the [`gov.uk`](https://www.gov.uk/) website: it’s easily the best working example I found while researching Gherkin. Even if you’ve never read a lick of code before, you could probably pop into [their tests](https://github.com/alphagov/whitehall/tree/main/features) and understand *exactly* what their software does:

```feature
Feature: Administering Roles
  This feature allows the administration of the various different roles
  in the system
  
  Scenario: Adding a traffic commissioner role
    Given the organisation "Department for Transport" exists
    And a person called "Terence Traffic"
    When I add a new "Traffic commissioner" role named "Traffic
    Commissioner for Scotland" to the "Department for Transport"
    Then I should be able to appoint "Terence Traffic" to the new role
```

*Terence Traffic*.

God, they do it right at Whitehall.

* * *

Mastering the art of hearing an idea, writing it down, then showing it *back* to the person who had the idea to ask “Does this look right?” is pretty much a cheat code for software engineering. It makes *every* part of the job easier.

Once you get good at it, you’ll eventually be able to crank out a list of tests about the behavior of the thing you’re building, and describe a *very* clear picture of everything that’ll be needed to build it.

A collection of well-defined requirements, in many other fields, is called a *spec*, or *specification*.

Wouldn’t it be neat if we–

## Spec-Driven Development

Ope! Turns out that a set of Extreme Programming folks came up with this one in [*Agile Specification-Driven Development*](https://www.eecs.yorku.ca/~jonathan/publications/2004/xp2004.pdf) (Ostroff, Makalsky, Paige) back in 2004! Damn you, University of York! They must’ve been the ones to tip off Whitehall!

If you’ve heard spec-driven development (SDD) thrown around a lot recently, you may be shocked to know that it’s not a recent development. But why might a school of thought around defining software in strong-yet-readable natural language have had a comeback 22 years later?

Oh.

*Right.*

![panic-02-llm](https://blog.chaoticgood.computer/drawings/assets/doodles/panic-02-llm.light.svg)![panic-02-llm](https://blog.chaoticgood.computer/drawings/assets/doodles/panic-02-llm.dark.svg)

It doesn’t take too long to recognize how Gherkin may have a newfound value in the new era of [agentic software development](https://blog.chaoticgood.computer/content/notes/software-gardening). It has become common knowledge that agents work best in situations where their output is [deterministic and verifiable](https://blog.chaoticgood.computer/content/notes/hostage-negotiations), so there is something very elegant in the solution: what if the *prompt* and the *test* were the *exact same thing?*

However, a specification does not *have* to be easy to read or write: the only requirement is that it defines the shape of the thing being built. While *many* teams across the industry would benefit massively from something like Gherkin and Cucumber, if you shed the requirement of “broad readability”, you could go absolutely *bananas* with your specification.

“Bananas” would be a very good way to describe Anthropic’s Frontier Red Team’s recent blog post, [*LLMs are making formal software verification feasible at a much larger scale*](https://www.anthropic.com/research/formal-verification), where they write software specifications as mathematical conjectures– and then prove them.

## Why Proofs?

I highly recommend reading through the Frontier Red Team’s full blog post. If I were to distill it into the two most important visualizations, though, it’d be these:

First, their description of “fuzzing”:

/assets/anthropic\_fuzz.mp4

[Fuzzing](https://en.wikipedia.org/wiki/Fuzzing) is a very specific *type* of software test, where you bombard a piece of an application with a bunch of random inputs in the hope of crashing it. This visualization generalizes further than just fuzzing, though. *Any* type of declarative testing (where you are defining specific inputs and outputs, then checking for a pass or fail) can be visualized, mentally, with this model. You’re just testing specific branches of the application to see if it *generally* does what you’ve specified, but that’s not a *complete* description of the program.

You want a *full* test? There is no fuller test than a proof:

/assets/anthropic\_proof.mp4

The Frontier Red Team’s post was specifically about proofs for security: taking common pieces of software and generating proofs about vulnerabilities. It’s hard to appreciate the implications of what that means: a *proof* that a piece of software has *no* exploits.

I’ve seen a lot of discourse around a cybersecurity arms race: can defenders patch flaws faster than attackers can find them? The premise relies on a fuzz-description style of what software *is*: that it’s teams of people (or agents!) stabbing around in the dark.

That post, though, provides an alternative: a piece of software that is *provably* secure in certain conditions.

But *ope!* This *also* isn’t a new concept! This gem is a small part of the introduction, but absolutely rocked my world:

> [!quote] Quote
>
> “However, formal verification isn’t easy. Proofs can be many times larger than the original code, and writing them requires significant effort and a niche, highly specialized skill set. For instance, it took two person-years to implement the seL4 operating system kernel, but *20* person-years [to formally verify it](https://sel4.systems/Research/pdfs/comprehensive-formal-verification-os-microkernel.pdf). Accordingly, formal verification has been practical only in truly mission-critical applications, **such as [Airbus’s avionics code](https://www.astree.ens.fr/papers/astree_airbus_sas2007.pdf).**
>
> But LLMs are making it far easier.”
>
> – Anthropic Frontier Red Team, [*LLMs are making formal software verification feasible at a much larger scale*](https://www.anthropic.com/research/formal-verification) (2026)

I was already floored at the possibility that proofs of the properties of software was even *possible*, but to find out that it has been successfully done *for decades* absolutely floored me.

If we *can* do it, especially for things as important as cybersecurity or *keeping a plane’s autopilot from **crashing***, why don’t we?

From the Airbus paper:

> [!quote] Quote
>
> “Some theorem proving techniques have been successfully introduced to verify limited software subsets. However, to prove properties of complete real-size programs with these techniques does not seem to be within the reach of software engineers yet.”
>
> – Delmas & Souyris, [*Astrée: from Research to Industry*](https://www.astree.ens.fr/papers/astree_airbus_sas2007.pdf) (2007)

## Is math actually dead?

My call would be a definitive and emphatic “no.” I’m obviously not a mathematician, so I can’t speak to that feeling from within the occupation. I will, however, take a stab of this as an economist.

If we think about a post-Stokes world, I’d say that this is proof that the supply of “math”, in the abstract, has gone up thanks to AI agents. I don’t believe that this cheapens math: on the contrary, it may, in a [Jevon’s Paradox](https://en.wikipedia.org/wiki/Jevons_paradox) situation, become more in demand. As focus shifts onto the specification of programs, with mathematical definitions of those specifications being in demand for the world’s most important and load-bearing programs, I can hardly see a future where “mathematician” becomes among the most important occupations a person could hold.

## Footnotes

1.  For the life of me, I do not understand why software developers name things like this, or where they get it from. I will never forgive the Kubernetes team, either for the name itself, or for k8s as the abbreviation. ↩
    
2.  These examples are taken directly from the Cucumber docs, which are among some of the most helpful docs I have ever read. ↩
