---
title: Writing Better Gherkin
date: 2026-11-06
updated: 2026-11-06
tags:
  - engineering/ai
  - writing/annotations
  - writing/fragments
description: A few notes on a very important, but hidden, part of the Cucumber and Gherkin documentation around Behavior Driven Development
annotation-pages:
annotation-target: https://cucumber.io/docs/bdd/better-gherkin/
annotation-target-type: web
---

I write a fair bit about Cucumber and Gherkin in [[public/content/dead-math|my post about spec-driven development]]: here are some specific portions about a pearl hidden in the Cucumber docs about how to write *good* Gherkin.

>%%
>```annotation-json
>{"created":"2026-11-06T06:48:32.951Z","text":"Gah! The fact that they have this page buried in \"Behaviour-Driven Development\" and not next to the Gherkin spec... 'tis frustrating. I've had a lot of discussions, recently, about the spec, and this is certainly the post I go back to the most.\n\nThat whole \"describe *what*, not *how*\" is such a hidden pearl. That distinction is important: I use Why/What/How as an evaluation framework a lot, and this syncs up perfectly.","updated":"2026-11-06T06:48:32.951Z","document":{"title":"Writing better Gherkin | Cucumber","link":[{"href":"https://cucumber.io/docs/bdd/better-gherkin/"},{"href":"https://cucumber.io/docs/bdd/better-gherkin/","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"image":["https://cucumber.io/img/logo.svg"],"locale":["en"],"title":["Writing better Gherkin | Cucumber"],"description":["There are several ways to make your Gherkin better."],"url":["https://cucumber.io/docs/bdd/better-gherkin/"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://cucumber.io/img/logo.svg"]},"favicon":"https://cucumber.io/img/logo.svg"},"uri":"https://cucumber.io/docs/bdd/better-gherkin/","target":[{"source":"https://cucumber.io/docs/bdd/better-gherkin/","selector":[{"type":"RangeSelector","startContainer":"/div[1]/div[2]/div[1]/div[1]/main[1]/div[1]/div[1]/div[1]/div[1]/article[1]/div[2]/p[2]","startOffset":0,"endContainer":"/div[1]/div[2]/div[1]/div[1]/main[1]/div[1]/div[1]/div[1]/div[1]/article[1]/div[2]/p[2]","endOffset":142},{"type":"TextPositionSelector","start":1010,"end":1152},{"type":"TextQuoteSelector","exact":"Your scenarios should describe the intended behaviour of the system, not the implementation.\nIn other words, it should describe what, not how.","prefix":"kin better.\nDescribe behaviour​\n","suffix":"\nFor example, for an authenticat"}]}]}
>```
>%%
>*%%PREFIX%%kin better.
>Describe behaviour​%%HIGHLIGHT%% ==Your scenarios should describe the intended behaviour of the system, not the implementation.
>In other words, it should describe what, not how.== %%POSTFIX%%For example, for an authenticat*
>%%LINK%%[[#^gs02kvcdkfj|show annotation]]
>%%COMMENT%%
>Gah! The fact that they have this page buried in "Behaviour-Driven Development" and not next to the Gherkin spec... 'tis frustrating. I've had a lot of discussions, recently, about the spec, and this is certainly the post I go back to the most.
>
>That whole "describe *what*, not *how*" is such a hidden pearl. That distinction is important: I use Why/What/How as an evaluation framework a lot, and this syncs up perfectly.
>%%TAGS%%
>
^gs02kvcdkfj


>%%
>```annotation-json
>{"created":"2026-11-06T06:52:19.642Z","text":"When working with agents, this is such a massive distinction. I find that, if you aren't careful, agents can over-specify tests, which causes the application to become too rigid.\n\nOne of my most recent (physical) scratch notes on The Pragmatic Programmer has been around specifications and test-driven development. In my longer post about Gherkin, I note that \"the prompt can be the test\", which *is* true. However, it does bring up a larger swirl of questions. In particular: when should a test be permanent? In doing TDD with agents, I find that agents can reliably write great tests to validate the work done *for that session*, but that some of those tests make the software inflexible.\n\nI've been thinking, then, about the concept of permanent versus scratch tests. Permanent tests *are* these types of \"what, now how\" tests: something that is orthogonal to the implementation. Then, scratch tests are for the agent *to* verify their specific implementation, and are meant to be scrapped at the end of the session.","updated":"2026-11-06T06:52:19.642Z","document":{"title":"Writing better Gherkin | Cucumber","link":[{"href":"https://cucumber.io/docs/bdd/better-gherkin/"},{"href":"https://cucumber.io/docs/bdd/better-gherkin/","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"image":["https://cucumber.io/img/logo.svg"],"locale":["en"],"title":["Writing better Gherkin | Cucumber"],"description":["There are several ways to make your Gherkin better."],"url":["https://cucumber.io/docs/bdd/better-gherkin/"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://cucumber.io/img/logo.svg"]},"favicon":"https://cucumber.io/img/logo.svg"},"uri":"https://cucumber.io/docs/bdd/better-gherkin/","target":[{"source":"https://cucumber.io/docs/bdd/better-gherkin/","selector":[{"type":"RangeSelector","startContainer":"/div[1]/div[2]/div[1]/div[1]/main[1]/div[1]/div[1]/div[1]/div[1]/article[1]/div[2]/p[5]","startOffset":1,"endContainer":"/div[1]/div[2]/div[1]/div[1]/main[1]/div[1]/div[1]/div[1]/div[1]/article[1]/div[2]/p[6]","endOffset":334},{"type":"TextPositionSelector","start":1438,"end":1990},{"type":"TextQuoteSelector","exact":"he first example, When \"Bob\" logs in, is a functional requirement. The second, much longer, example is a procedural reference.\nFunctional requirements are features, but procedures belong in the implementation details.\nThat way, when the implementation of a feature changes, you'll only need to change the process steps behind the scenes.\nThe behaviour does not have to change just because the implementation does.\nIn fact, a good question to ask yourself when writing a feature clause is: “Will this wording need to change if the implementation does?”.","prefix":" should see the \"welcome\" page \nT","suffix":"\nIf the answer is “Yes”, then yo"}]}]}
>```
>%%
>*%%PREFIX%%should see the "welcome" page 
>T%%HIGHLIGHT%% ==he first example, When "Bob" logs in, is a functional requirement. The second, much longer, example is a procedural reference.
>Functional requirements are features, but procedures belong in the implementation details.
>That way, when the implementation of a feature changes, you'll only need to change the process steps behind the scenes.
>The behaviour does not have to change just because the implementation does.
>In fact, a good question to ask yourself when writing a feature clause is: “Will this wording need to change if the implementation does?”.== %%POSTFIX%%If the answer is “Yes”, then yo*
>%%LINK%%[[#^q4oo151f75d|show annotation]]
>%%COMMENT%%
>When working with agents, this is such a massive distinction. I find that, if you aren't careful, agents can over-specify tests, which causes the application to become too rigid.
>
>One of my most recent (physical) scratch notes on The Pragmatic Programmer has been around specifications and test-driven development. In my longer post about Gherkin, I note that "the prompt can be the test", which *is* true. However, it does bring up a larger swirl of questions. In particular: when should a test be permanent? In doing TDD with agents, I find that agents can reliably write great tests to validate the work done *for that session*, but that some of those tests make the software inflexible.
>
>I've been thinking, then, about the concept of permanent versus scratch tests. Permanent tests *are* these types of "what, now how" tests: something that is orthogonal to the implementation. Then, scratch tests are for the agent *to* verify their specific implementation, and are meant to be scrapped at the end of the session.
>%%TAGS%%
>
^q4oo151f75d


>%%
>```annotation-json
>{"created":"2026-11-06T06:54:50.548Z","text":"\"Resilient\" is a great use, here.\n\nBeing a pretty early adopter to Matt Pocock Skills, I see the whole thing, abstracted, as an assembly line from idea -> pull request. \"each step communicates an idea\" enforces that: that Gherkin is a good way to express the shape of an idea (say, as the output of a `/grill`), but if not used with discipline, can bleed into, say, `/to-issues`). The line has to be drawn somewhere.","updated":"2026-11-06T06:54:50.548Z","document":{"title":"Writing better Gherkin | Cucumber","link":[{"href":"https://cucumber.io/docs/bdd/better-gherkin/"},{"href":"https://cucumber.io/docs/bdd/better-gherkin/","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"image":["https://cucumber.io/img/logo.svg"],"locale":["en"],"title":["Writing better Gherkin | Cucumber"],"description":["There are several ways to make your Gherkin better."],"url":["https://cucumber.io/docs/bdd/better-gherkin/"]},"highwire":{},"prism":{},"twitter":{"card":["summary_large_image"],"image":["https://cucumber.io/img/logo.svg"]},"favicon":"https://cucumber.io/img/logo.svg"},"uri":"https://cucumber.io/docs/bdd/better-gherkin/","target":[{"source":"https://cucumber.io/docs/bdd/better-gherkin/","selector":[{"type":"RangeSelector","startContainer":"/div[1]/div[2]/div[1]/div[1]/main[1]/div[1]/div[1]/div[1]/div[1]/article[1]/div[2]/p[13]","startOffset":0,"endContainer":"/div[1]/div[2]/div[1]/div[1]/main[1]/div[1]/div[1]/div[1]/div[1]/article[1]/div[2]/p[13]","endOffset":806},{"type":"TextPositionSelector","start":4712,"end":5518},{"type":"TextQuoteSelector","exact":"With a declarative style, each step communicates an idea, but the exact values aren't specified. The details of how the user interacts with the system, such as which specific articles are free or paid, and the subscription level of different test users, are specified in the step definitions (the automation code that interacts with the system). The subscription packages could change in the future. The business could change what content is available to subscribers on free and paid plans, without having to change this scenario and other scenarios that use the same step definitions. If another subscription level is added later, it's easy to add a scenario for that. By avoiding terms like “click a button” that suggest implementation, the scenario is more resilient to implementation details of the UI.","prefix":"Free article and a Paid article \n","suffix":" The intent of the scenario rema"}]}]}
>```
>%%
>*%%PREFIX%%Free article and a Paid article%%HIGHLIGHT%% ==With a declarative style, each step communicates an idea, but the exact values aren't specified. The details of how the user interacts with the system, such as which specific articles are free or paid, and the subscription level of different test users, are specified in the step definitions (the automation code that interacts with the system). The subscription packages could change in the future. The business could change what content is available to subscribers on free and paid plans, without having to change this scenario and other scenarios that use the same step definitions. If another subscription level is added later, it's easy to add a scenario for that. By avoiding terms like “click a button” that suggest implementation, the scenario is more resilient to implementation details of the UI.== %%POSTFIX%%The intent of the scenario rema*
>%%LINK%%[[#^fzsmt0abyxp|show annotation]]
>%%COMMENT%%
>"Resilient" is a great use, here.
>
>Being a pretty early adopter to Matt Pocock Skills, I see the whole thing, abstracted, as an assembly line from idea -> pull request. "each step communicates an idea" enforces that: that Gherkin is a good way to express the shape of an idea (say, as the output of a `/grill`), but if not used with discipline, can bleed into, say, `/to-issues`). The line has to be drawn somewhere.
>%%TAGS%%
>
^fzsmt0abyxp
