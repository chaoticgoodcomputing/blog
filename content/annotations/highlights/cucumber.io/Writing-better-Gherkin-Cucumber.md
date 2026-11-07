# Writing Better Gherkin

> A few notes on a very important, but hidden, part of the Cucumber and Gherkin documentation around Behavior Driven Development

- Page: https://blog.chaoticgood.computer/content/annotations/highlights/cucumber.io/Writing-better-Gherkin-Cucumber
- Author: Spencer Elkington
- Published: 2026-11-06
- Updated: 2026-11-06
- Tags: engineering/ai, writing/annotations, writing/fragments

---

I write a fair bit about Cucumber and Gherkin in [my post about spec-driven development](https://blog.chaoticgood.computer/content/dead-math): here are some specific portions about a pearl hidden in the Cucumber docs about how to write *good* Gherkin.

From [Writing better Gherkin | Cucumber](https://cucumber.io/docs/bdd/better-gherkin/) on cucumber.io

## Annotations

[> [!quote] Quote
>
> Your scenarios should describe the intended behaviour of the system, not the implementation. In other words, it should describe what, not how.](https://cucumber.io/docs/bdd/better-gherkin/#:~:text=better.%20Describe%20behaviour%E2%80%8B-,Your%20scenarios%20should%20describe%20the,should%20describe%20what%2C%20not%20how.,-For%20example%2C%20for)

Gah! The fact that they have this page buried in “Behaviour-Driven Development” and not next to the Gherkin spec… ’tis frustrating. I’ve had a lot of discussions, recently, about the spec, and this is certainly the post I go back to the most.

That whole “describe *what*, not *how*” is such a hidden pearl. That distinction is important: I use Why/What/How as an evaluation framework a lot, and this syncs up perfectly.

Nov 06, 2026

[> [!quote] Quote
>
> he first example, When "Bob" logs in, is a functional requirement. The second, much longer, example is a procedural reference. Functional requirements are features, but procedures belong in the implementation details. That way, when the implementation of a feature changes, you'll only need to change the process steps behind the scenes. The behaviour does not have to change just because the implementation does. In fact, a good question to ask yourself when writing a feature clause is: “Will this wording need to change if the implementation does?”.](https://cucumber.io/docs/bdd/better-gherkin/#:~:text=%22welcome%22%20page%20T-,he%20first%20example%2C%20When%20%22Bob%22,change%20if%20the%20implementation%20does%3F%E2%80%9D.,-If%20the%20answer)

When working with agents, this is such a massive distinction. I find that, if you aren’t careful, agents can over-specify tests, which causes the application to become too rigid.

One of my most recent (physical) scratch notes on The Pragmatic Programmer has been around specifications and test-driven development. In my longer post about Gherkin, I note that “the prompt can be the test”, which *is* true. However, it does bring up a larger swirl of questions. In particular: when should a test be permanent? In doing TDD with agents, I find that agents can reliably write great tests to validate the work done *for that session*, but that some of those tests make the software inflexible.

I’ve been thinking, then, about the concept of permanent versus scratch tests. Permanent tests *are* these types of “what, now how” tests: something that is orthogonal to the implementation. Then, scratch tests are for the agent *to* verify their specific implementation, and are meant to be scrapped at the end of the session.

Nov 06, 2026

[> [!quote] Quote
>
> With a declarative style, each step communicates an idea, but the exact values aren't specified. The details of how the user interacts with the system, such as which specific articles are free or paid, and the subscription level of different test users, are specified in the step definitions (the automation code that interacts with the system). The subscription packages could change in the future. The business could change what content is available to subscribers on free and paid plans, without having to change this scenario and other scenarios that use the same step definitions. If another subscription level is added later, it's easy to add a scenario for that. By avoiding terms like “click a button” that suggest implementation, the scenario is more resilient to implementation details of the UI.](https://cucumber.io/docs/bdd/better-gherkin/#:~:text=a%20Paid%20article-,With%20a%20declarative%20style%2C%20each,implementation%20details%20of%20the%20UI.,-The%20intent%20of)

“Resilient” is a great use, here.

Being a pretty early adopter to Matt Pocock Skills, I see the whole thing, abstracted, as an assembly line from idea -> pull request. “each step communicates an idea” enforces that: that Gherkin is a good way to express the shape of an idea (say, as the output of a `/grill`), but if not used with discipline, can bleed into, say, `/to-issues`). The line has to be drawn somewhere.

Nov 06, 2026
