---
title: Annotations on a chapter of meetings
date: 2026-03-29
annotation-target: "https://example.com/papers/On%20Meetings.pdf"
annotation-pages: 2
---

The second page alone: its mirror is cut down to it. The first annotation is on the first page,
which this note does not show.

>%%
>```annotation-json
>{"text":"The whole essa
>```
>%%
>*%%PREFIX%%with a goodreason.%%HIGHLIGHT%% ==A meeting is a promise that the people in it will leave knowing more than they came with.== %%POSTFIX%%When that promise*
>%%LINK%%[[#^promise|show annotation]]
>%%COMMENT%%
>The whole essay hangs on this sentence. A meeting is judged by what its people know when they leave, not by whether it ran to time.
>
>Everything after it is a way of keeping the promise.
>%%TAGS%%
>
^promise


>%%
>```annotation-json
>{"text":"The rule I would put on every calendar invitation, in the place where the agenda never is.\n\nA standing meeting is the hardest to cancel, and the one that most often has no question left to answer: it outlives the question it was made for by months.","target":[{"source":"https://example.com/papers/On%20Meetings.pdf","selector":[{"type":"TextPositionSelector","start":723,"end":773},{"type":"TextQuoteSelector","exact":"Cancel any meeting that has no question to answer.","prefix":"what they were for.","suffix":"The second rule"}]}],"created":"2026-03-28T10:05:00.000Z","updated":"2026-03-28T10:05:00.000Z","tags":["rules"]}
>```
>%%
>*%%PREFIX%%what they were for.%%HIGHLIGHT%% ==Cancel any meeting that has no question to answer.== %%POSTFIX%%The second rule*
>%%LINK%%[[#^cancel|show annotation]]
>%%COMMENT%%
>The rule I would put on every calendar invitation, in the place where the agenda never is.
>
>A standing meeting is the hardest to cancel, and the one that most often has no question left to answer: it outlives the question it was made for by months.
>%%TAGS%%
>#rules
^cancel
