---
title: Annotations on meetings
date: 2026-03-28
tags:
  - reading/docs
annotation-target: "https://example.com/papers/On%20Meetings.pdf"
---

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000004","type":"Annotation","motivation":"commenting","body":{"id":"#^promise","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://example.com/papers/On%20Meetings.pdf","selector":[{"type":"TextPositionSelector","start":110,"end":198},{"type":"TextQuoteSelector","exact":"A meeting is a promise that the people in it will leave knowing more than they came with.","prefix":"with a goodreason.","suffix":"When that promise"}]},"created":"2026-03-28T10:00:00.000Z","modified":"2026-03-28T10:00:00.000Z"}
> ```
> %%
> The whole essay hangs on this sentence. A meeting is judged by what its people know when they leave, not by whether it ran to time.
>
> Everything after it is a way of keeping the promise.
^promise


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000005","type":"Annotation","motivation":"commenting","body":[{"id":"#^cancel","type":"Text","format":"text/markdown","purpose":"commenting"},{"type":"TextualBody","value":"rules","purpose":"tagging"}],"target":{"source":"https://example.com/papers/On%20Meetings.pdf","selector":[{"type":"TextPositionSelector","start":723,"end":773},{"type":"TextQuoteSelector","exact":"Cancel any meeting that has no question to answer.","prefix":"what they were for.","suffix":"The second rule"}]},"created":"2026-03-28T10:05:00.000Z","modified":"2026-03-28T10:05:00.000Z"}
> ```
> %%
> The rule I would put on every calendar invitation, in the place where the agenda never is.
>
> A standing meeting is the hardest to cancel, and the one that most often has no question left to answer: it outlives the question it was made for by months.
^cancel


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000006","type":"Annotation","motivation":"replying","body":{"id":"#^reply","type":"Text","format":"text/markdown"},"target":"urn:uuid:00000000-0000-4000-8000-000000000005","created":"2026-03-28T10:20:00.000Z","modified":"2026-03-28T10:20:00.000Z"}
> ```
> %%
> A rule for the rule: a meeting called to find the question has one.
^reply


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000007","type":"Annotation","motivation":"commenting","body":[{"id":"#^minutes","type":"Text","format":"text/markdown","purpose":"commenting"},{"type":"TextualBody","value":"rules","purpose":"tagging"}],"target":{"source":"https://example.com/papers/On%20Meetings.pdf","selector":[{"type":"TextPositionSelector","start":942,"end":999},{"type":"TextQuoteSelector","exact":"Write down what was decided, and send it within the hour.","prefix":"who made it.","suffix":""}]},"created":"2026-03-28T10:10:00.000Z","modified":"2026-03-28T10:10:00.000Z"}
> ```
> %%
> Within the hour, because by the next morning the three ways of remembering it have already been told to other people.
>
> The notes need not be long. A list of what was decided, by whom, and what happens next is enough, and it is more than most meetings leave behind.
^minutes


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000008","type":"Annotation","motivation":"commenting","body":{"id":"#^draft","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://example.com/papers/On%20Meetings.pdf","selector":[{"type":"TextPositionSelector","start":2000,"end":2040},{"type":"TextQuoteSelector","exact":"Every agenda is a list of hopes, in no particular order.","prefix":"","suffix":""}]},"created":"2026-03-28T10:30:00.000Z","modified":"2026-03-28T10:30:00.000Z"}
> ```
> %%
> Quoted from an earlier draft, which the essay as published no longer has.
^draft
