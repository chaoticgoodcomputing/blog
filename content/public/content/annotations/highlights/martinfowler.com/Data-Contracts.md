---
title: "Data Contracts (Herror & Wider)"
date: 2026-11-18
updated: 2026-11-18
tags:
  - projects/flowthru
  - engineering/data
  - reading/web
  - writing/fragments
description: Thoughts on the Simon Herrer & Arif Wider post about ODCS, *Data Contracts*
annotation-target: "https://martinfowler.com/articles/data-contracts.html"
annotation-target-type: web
annotation-public: true
---

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:9fc7bb68-fe14-4e3b-817e-e422cf8236f8","type":"Annotation","motivation":"commenting","body":{"id":"#^vhr70nu9a88","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/section[1]/p[1]/i[1]","startOffset":5,"endContainer":"/main[1]/section[1]/p[1]/i[1]","endOffset":268},{"type":"TextPositionSelector","start":1853,"end":2116},{"type":"TextQuoteSelector","exact":"Data contracts are a way to describe the contents and guarantees of\n    datasets. They apply practices from API design to data by treating them as\n    data-providing services - such as data products - whose interfaces we want\n    to define as clearly as possible.","prefix":"Code\n\n\n\n\n\nData Contracts\n\n\n\n    ","suffix":" This approach significantly inc"}]},"created":"2026-11-18T16:25:09.854Z","modified":"2026-11-18T16:25:09.854Z","hypothesis":{"id":"imLEzuNxEfGahLPgmfuo0Q","digest":"1ef7a344c4f9de"}}
> ```
> %%
> This is probably the writing on the wall that I need to polish & start advertising Flowthru, since it's exactly this process for .NET/C#.
>
> I was a bit shocked to find out that this *wasn't* something that already existed in .NET (despite its somewhat lackluster OSS community compared to, say, Rust/JS).
^vhr70nu9a88

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:38e5ffc7-f69e-4103-8e98-1d67b3fcad32","type":"Annotation","motivation":"commenting","body":{"id":"#^iyflayl9fp4","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/section[1]/div[1]/div[1]/div[1]/div[2]/p[1]","startOffset":284,"endContainer":"/main[1]/section[1]/div[1]/div[1]/div[1]/div[2]/p[1]/a[2]","endOffset":13},{"type":"TextPositionSelector","start":2713,"end":2889},{"type":"TextQuoteSelector","exact":"Simon is also a member of the technical steering committee for\n      the Open Data Contract Standard (ODCS) and the Open Data Product Standard\n      (ODPS) of the Bitol project","prefix":"ontract-first\n      approaches. ","suffix":" at the Linux\n      Foundation. "}]},"created":"2026-11-18T16:25:59.755Z","modified":"2026-11-18T16:25:59.755Z","hypothesis":{"id":"iow1AuNxEfGi6I8wTqWmGQ","digest":"1ebf11bbbc2865"}}
> ```
> %%
> I'll certainly be [stashing this away](https://bitol.io/) for later.
^iyflayl9fp4

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3beaad9a-d83c-4c12-b679-77c9a503b99d","type":"Annotation","motivation":"commenting","body":{"id":"#^1854utg1b3z","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[1]/section[1]/pre[1]","startOffset":0,"endContainer":"/main[1]/div[1]/section[1]/section[1]/pre[1]","endOffset":109},{"type":"TextPositionSelector","start":7690,"end":7799},{"type":"TextQuoteSelector","exact":"apiVersion: \"v3.2.0\"\nkind: \"DataContract\"\nid: \"customers\"\nname: \"Customers\"\nversion: \"1.0.0\"\nstatus: \"active\"","prefix":"rks\n        Technology Radar).\n\n","suffix":"\n\nschema:\n  - name: \"customers\"\n"}]},"created":"2026-11-18T16:27:55.498Z","modified":"2026-11-18T16:27:55.498Z","hypothesis":{"id":"itXSFuNxEfGhAxdxE0wcfw","digest":"efbe6a6aedb60"}}
> ```
> %%
> while I did physically bristle at the use of YAML (give me some strong types, baby!!), I am taking notes on the shape. I should take a closer look at the ODCS and see if there's any tweaks I could/should make to Flowthru's Catalog interfaces, since they've certainly thought of cases I haven't.
^1854utg1b3z

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:750e1c31-e977-4086-a6f9-d9583f082d00","type":"Annotation","motivation":"commenting","body":{"id":"#^7yslwixen88","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[1]/section[1]/p[2]","startOffset":76,"endContainer":"/main[1]/div[1]/section[1]/section[1]/p[2]","endOffset":106},{"type":"TextPositionSelector","start":8329,"end":8359},{"type":"TextQuoteSelector","exact":"the company's data marketplace","prefix":"y rendered as a page in\n        ","suffix":" rather than as raw YAML, Alex a"}]},"created":"2026-11-18T16:28:32.428Z","modified":"2026-11-18T16:28:32.428Z","hypothesis":{"id":"iwisaONxEfGbqYt-3hZgWA","digest":"1ff8c08c906ce"}}
> ```
> %%
> Ah! I got giddy at seeing this analogy.
^7yslwixen88

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:a695da5d-9d5d-427b-8cfe-c28908dbb863","type":"Annotation","motivation":"commenting","body":{"id":"#^xhme065au52","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[1]/section[1]/p[2]","startOffset":389,"endContainer":"/main[1]/div[1]/section[1]/section[1]/p[2]","endOffset":566},{"type":"TextPositionSelector","start":8642,"end":8819},{"type":"TextQuoteSelector","exact":"In ODCS, there are specific\n        elements to describe the quality of the data through quality rules as well\n        as service levels that specify runtime behavior over time.","prefix":"sistently contain correct data. ","suffix":" Here is how the\n        data co"}]},"created":"2026-11-18T16:29:12.400Z","modified":"2026-11-18T16:29:12.400Z","hypothesis":{"id":"iy21iuNxEfGD-ku6CBPCMg","digest":"185cd6a72fdb61"}}
> ```
> %%
> This is certainly a new/novel bit. I've talked with a few folks about how to go past "schema" and into more qualitative properties of Catalog entries, so they have my attention here.
^xhme065au52

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3fe1dfda-7d6a-4853-8ee3-962e2d3d4017","type":"Annotation","motivation":"commenting","body":{"id":"#^bslz7km20ki","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[1]/section[1]/pre[2]","startOffset":84,"endContainer":"/main[1]/div[1]/section[1]/section[1]/pre[2]","endOffset":490},{"type":"TextPositionSelector","start":8984,"end":9390},{"type":"TextQuoteSelector","exact":"quality:\n          - type: \"sql\"\n            description: \"Expect less than 1% empty name fields\"\n            query: |\n              SELECT AVG(\n                CASE\n                  WHEN customer_name IS NULL\n                    OR TRIM(customer_name) = ''\n                  THEN 1\n                  ELSE 0\n                END\n              )\n              FROM customers\n            mustBeLessThan: 0.01","prefix":"- name: \"customer_name\"\n        ","suffix":"\nslaProperties:\n  - property: \"f"}]},"created":"2026-11-18T16:29:37.394Z","modified":"2026-11-18T16:37:00.982Z","hypothesis":{"id":"i1OtYuNxEfGlB88Eyo7q0g","digest":"138236b6e4768c"}}
> ```
> %%
> Ooooooo.
>
> *Ooooooo!*
>
> This would be PERFECT for the pre-flight check system. I think this'd also be able to extend FUnit out to the Catalog system, which is something I hadn't considered until just now.
^bslz7km20ki

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:0eea5518-7c21-4bc3-acdf-c35a60c5b39f","type":"Annotation","motivation":"commenting","body":{"id":"#^kk3b9bpuqvs","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[1]/section[1]/pre[2]","startOffset":491,"endContainer":"/main[1]/div[1]/section[1]/section[1]/pre[2]","endOffset":658},{"type":"TextPositionSelector","start":9391,"end":9558},{"type":"TextQuoteSelector","exact":"slaProperties:\n  - property: \"freshness\"\n    value: 24\n    unit: \"hours\"\n    element: \"customers.last_updated_at\"\n    description: \"Within 24 hours of the last update\"","prefix":"           mustBeLessThan: 0.01\n","suffix":"\n\n\nSeeing these guarantees, Alex"}]},"created":"2026-11-18T16:38:05.841Z","modified":"2026-11-18T16:38:05.841Z","hypothesis":{"id":"i3qPIuNxEfG9pR9hWbZ3Aw","digest":"7c908b0252cef"}}
> ```
> %%
> Versioning is also an interesting concept. I didn't personally see a whole lot of dataset versioning during my time at M Science, but there were times where it felt like our primary product *was* breaking changes, which semver would have a lot to weigh into.
^kk3b9bpuqvs

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:c8d4cabb-a291-451a-8129-7476269eb3ed","type":"Annotation","motivation":"commenting","body":{"id":"#^xeuij4vrfr6","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[1]/section[2]/p[1]","startOffset":485,"endContainer":"/main[1]/div[1]/section[1]/section[2]/p[1]","endOffset":598},{"type":"TextPositionSelector","start":10546,"end":10659},{"type":"TextQuoteSelector","exact":"Data contracts break that loop by giving\n        agents the explicit metadata they would otherwise have to guess.","prefix":"   work with data on their own. ","suffix":"\n\nAn agent has the same question"}]},"created":"2026-11-18T16:39:20.655Z","modified":"2026-11-18T16:39:20.655Z","hypothesis":{"id":"i6Rt7ONxEfGF7m8J0m1hPQ","digest":"14bcf4f4dbe99e"}}
> ```
> %%
> There is a certain power to giving an agent access to, say, DuckDB in order to verify properties of data sets, even in a quick way, but there's no guarantee that they would do that (or do it correctly). Having the framework take over some of that responsibility would be a good move.
^xeuij4vrfr6

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:88d5b55f-5a72-4526-8725-f355dd9e9c84","type":"Annotation","motivation":"commenting","body":{"id":"#^zy4notxgbev","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[2]/ul[1]/li[3]/b[1]","startOffset":0,"endContainer":"/main[1]/div[1]/section[2]/ul[1]/li[3]","endOffset":228},{"type":"TextPositionSelector","start":13115,"end":13343},{"type":"TextQuoteSelector","exact":"Versioned. A data contract carries a version and evolves under a\n          clear scheme, so consumers can tell a harmless change from a breaking one,\n          and providers can phase new versions in and old ones out gracefully.","prefix":"ither pass or fail.\n          \n\n","suffix":" \n\nProvider-driven. It is publis"}]},"created":"2026-11-18T16:40:15.396Z","modified":"2026-11-18T16:40:15.396Z","hypothesis":{"id":"i807oONxEfGRaPtNQgd7Ag","digest":"529f9c7a8e6b"}}
> ```
> %%
> I'll have to take a closer look at how versioning is handled by ODCS/Bitol
^zy4notxgbev

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:cf9404c1-22b7-42f1-b6f0-4c5c1a86cb4f","type":"Annotation","motivation":"commenting","body":{"id":"#^p4j2uqi04pn","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[2]/section[1]/p[1]","startOffset":408,"endContainer":"/main[1]/div[1]/section[2]/section[1]/p[1]","endOffset":642},{"type":"TextPositionSelector","start":16087,"end":16321},{"type":"TextQuoteSelector","exact":"The specification of the Open Data Contract Standard is publicly\n          available on GitHub, where it has over 1000 stars. The standard comes with a JSON schema to help\n          validate YAML files in terms of standard compliance.","prefix":"f metadata standards.\n          ","suffix":"\n\n\nFigure 1: The sections of the"}]},"created":"2026-11-18T16:46:25.932Z","modified":"2026-11-18T16:46:25.932Z","hypothesis":{"id":"jAB5_ONxEfG3KY-eM3iZeA","digest":"1610f4b28ca9db"}}
> ```
> %%
> On a cursory glance, I think Flowthru's catalog system handles... *maybe* 40% of this, at a glance? It gets some of the fundamentals (catalog items *are* objects, with all that entails. I suppose they are technically versioned alongside the software? Schema is a gimme. Quality is... somewhat checked at preflight, although I can already see it can do *way* better.
>
> Ownership and (maybe?) support is *technically* handle-able via `CODEOWNERS`, but obviously not to the extent I'd prefer. Terms of use... is interesting, but not possibly applicable. SLA would go into Preflight. "Servers" is handled by the internal medium abstraction. Security is non-existent (gimme a break -- the framework is in beta. Not saying it's an *afterthought*, but... my plan *is* to think about it *after*, y'know?). AI context... probably also not applicable? Pricing is a likely non-factor, although interesting in light of recent discussions I've had both at work and during consulting.
>
> Extensibility is a wildcard that I dare not touch,.
^p4j2uqi04pn

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:3f1e5066-a2ca-4fb4-b190-0a85035ec39b","type":"Annotation","motivation":"commenting","body":{"id":"#^nlz5tlfv9y9","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[3]/section[1]/pre[1]","startOffset":0,"endContainer":"/main[1]/div[1]/section[3]/section[1]/pre[1]","endOffset":186},{"type":"TextPositionSelector","start":28405,"end":28591},{"type":"TextQuoteSelector","exact":"schema:\n  - name: \"customer_360\"\n    properties:\n      - name: \"cid\"\n        authoritativeDefinitions:\n          - type: \"semantics\"\n            url: \"https://example.com/ns/Customer.id\"","prefix":"nsumer knows how to join them\n\n\n","suffix":"\n\n\nThe core concept is to point "}]},"created":"2026-11-18T16:48:06.832Z","modified":"2026-11-18T16:48:06.832Z","hypothesis":{"id":"jDJ0IONxEfGzwSs64niapQ","digest":"a6598748c2f8f"}}
> ```
> %%
> Now *this* is spicy. I could see this being a very, *very* good use case for NewTypes, which I *technically* support, but could certainly support better.
^nlz5tlfv9y9

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:86b230a8-defd-4113-b0d2-d0d873255d86","type":"Annotation","motivation":"commenting","body":{"id":"#^88pebtbrq3h","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[3]/section[1]/p[2]","startOffset":279,"endContainer":"/main[1]/div[1]/section[3]/section[1]/p[2]","endOffset":500},{"type":"TextPositionSelector","start":28873,"end":29094},{"type":"TextQuoteSelector","exact":"The ontology itself\n        can be described using standards like RDF, OWL, or using the promising\n        ontology standard within the Apache Ossie\n        project, currently incubating at the Apache Software Foundation.","prefix":"RI or URL within that ontology. ","suffix":"\n\n\n\nData Products Build Upon Dat"}]},"created":"2026-11-18T16:48:38.374Z","modified":"2026-11-18T16:48:38.374Z","hypothesis":{"id":"jGAlCuNxEfGkS-PtJo2Mew","digest":"1e795e8b914482"}}
> ```
> %%
> Stashing away Ossie as well.
^88pebtbrq3h

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:01824141-6fe3-47f5-9aef-883c3c4f8ae7","type":"Annotation","motivation":"commenting","body":{"id":"#^jnu8xfy0xnj","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[4]/p[1]","startOffset":207,"endContainer":"/main[1]/div[1]/section[4]/p[1]","endOffset":235},{"type":"TextPositionSelector","start":36329,"end":36357},{"type":"TextQuoteSelector","exact":"keeping it next to the code,","prefix":" API: creating it deliberately, ","suffix":"\n        evolving it without bre"}]},"created":"2026-11-18T16:50:23.247Z","modified":"2026-11-18T16:50:31.677Z","hypothesis":{"id":"jIjwcONxEfGhH18oDbPusg","digest":"e169090059161"}}
> ```
> %%
> Ah, *mon ami* -- what if it *was* the code?
^jnu8xfy0xnj

> [!annotation]
> %%
> ```annotation
> {"@context":"http://www.w3.org/ns/anno.jsonld","id":"urn:uuid:ea249150-cf1f-49f8-9557-5e5bbf8d5942","type":"Annotation","motivation":"commenting","body":{"id":"#^h1kp5g05051","type":"Text","format":"text/markdown","purpose":"commenting"},"target":{"source":"https://martinfowler.com/articles/data-contracts.html","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[1]/section[4]/section[3]/h3[1]","startOffset":0,"endContainer":"/main[1]/div[1]/section[4]/section[3]/ul[1]/li[3]","endOffset":101},{"type":"TextPositionSelector","start":40462,"end":41005},{"type":"TextQuoteSelector","exact":"The Story of Versioning and Breaking Changes\n\nOne of the main goals of data contracts is to find breaking\n          changes before consumers are affected, and offer graceful\n          evolution processes. For that, data contracts follow the\n          SemVer versioning scheme.\n\n\nMajor Version Change: Breaking change such as removing a column or renaming\n            it\n\nMinor Version Change: Non-breaking change such as adding a new column\n\nPatch Version Change: Small change such as fixing a typo or updating the\n            support channels","prefix":"te server\n          entries.\n\n\n\n","suffix":"\n\n\nBreaking changes increase the"}]},"created":"2026-11-18T16:56:45.070Z","modified":"2026-11-18T16:56:45.070Z","hypothesis":{"id":"jL4NRuNxEfG0-iu5twNpWQ","digest":"bc4816417b718"}}
> ```
> %%
> I have... thoughts on this.
>
> In Flowthru, I've found that this is largely the easy part: if a column changes names, that's *obviously* going to break some stuff downstream. That's pretty much deterministically lintable, even without *running* a downstream pipeline.
>
> Data *qualities* (say: this column is normalized) is what gets tricky. They touch on this a bit above with the pre-flight checks, but that is a genuinely difficult thing to try and test. It's not a *breaking* change, but it *could* be.
>
> In the econometrics world, when a survey changes (say, the wording of a question changes), that's *kind of* a breaking change. Even if the literal, material properties of the *answer* haven't changed (it's still, say, a multiple choice), that's something that makes comparing before-and-after an apples-to-oranges comparison. I suppose the choice of when to tick up semver is ultimately the onus of the data owner, with an understanding of what "breaking" means to downstream consumers, but it definitely fuzzes the line a bit.
^h1kp5g05051
