---
title: Annotations on a chapter of meetings
date: 2026-03-29
annotation-target: "https://example.com/papers/On%20Meetings.pdf"
annotation-pages: 2
---

The second page alone: its mirror is cut down to it. The first annotation is on the first page,
which this note does not show.

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000101","type":"Annotation","motivation":"commenting","body":{"id":"#^promise","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://example.com/papers/On%20Meetings.pdf","selector":[{"type":"TextPositionSelector","start":110,"end":198},{"type":"TextQuoteSelector","exact":"A meeting is a promise that the people in it will leave knowing more than they came with.","prefix":"with a goodreason.","suffix":"When that promise"}]},"created":"2026-03-28T10:00:00.000Z","modified":"2026-03-28T10:00:00.000Z"}
> ```
> %%
> The whole essay hangs on this sentence. A meeting is judged by what its people know when they leave, not by whether it ran to time.
>
> Everything after it is a way of keeping the promise.
^promise


> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:00000000-0000-4000-8000-000000000102","type":"Annotation","motivation":"commenting","body":[{"id":"#^cancel","type":"Text","format":"text/markdown","purpose":"commenting"},{"type":"TextualBody","value":"rules","purpose":"tagging"}],"target":{"source":"https://example.com/papers/On%20Meetings.pdf","selector":[{"type":"TextPositionSelector","start":723,"end":773},{"type":"TextQuoteSelector","exact":"Cancel any meeting that has no question to answer.","prefix":"what they were for.","suffix":"The second rule"}]},"created":"2026-03-28T10:05:00.000Z","modified":"2026-03-28T10:05:00.000Z"}
> ```
> %%
> The rule I would put on every calendar invitation, in the place where the agenda never is.
>
> A standing meeting is the hardest to cancel, and the one that most often has no question left to answer: it outlives the question it was made for by months.
^cancel


Read on its own, the second page is a list of rules with the reasons left out.
