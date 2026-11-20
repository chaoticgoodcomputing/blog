# Data Contracts (Herror & Wider)

> Thoughts on the Simon Herrer & Arif Wider post about ODCS, *Data Contracts*

- Page: https://blog.chaoticgood.computer/content/annotations/highlights/martinfowler.com/Data-Contracts
- Author: Spencer Elkington
- Published: 2026-11-18
- Updated: 2026-11-18
- Tags: projects/flowthru, engineering/data, reading/web, writing/fragments

---

From [martinfowler.com](https://martinfowler.com/articles/data-contracts.html)

## Annotations

[> [!quote] Quote
>
> Data contracts are a way to describe the contents and guarantees of datasets. They apply practices from API design to data by treating them as data-providing services - such as data products - whose interfaces we want to define as clearly as possible.](https://martinfowler.com/articles/data-contracts.html#:~:text=Code%20Data%20Contracts-,Data%20contracts%20are%20a%20way,define%20as%20clearly%20as%20possible.,-This%20approach%20significantly)

This is probably the writing on the wall that I need to polish & start advertising Flowthru, since it’s exactly this process for .NET/C#.

I was a bit shocked to find out that this *wasn’t* something that already existed in .NET (despite its somewhat lackluster OSS community compared to, say, Rust/JS).

Nov 18, 2026

[> [!quote] Quote
>
> Simon is also a member of the technical steering committee for the Open Data Contract Standard (ODCS) and the Open Data Product Standard (ODPS) of the Bitol project](https://martinfowler.com/articles/data-contracts.html#:~:text=ontract%2Dfirst%20approaches.-,Simon%20is%20also%20a%20member,(ODPS)%20of%20the%20Bitol%20project,-at%20the%20Linux)

I’ll certainly be [stashing this away](https://bitol.io/) for later.

Nov 18, 2026

[> [!quote] Quote
>
> apiVersion: "v3.2.0" kind: "DataContract" id: "customers" name: "Customers" version: "1.0.0" status: "active"](https://martinfowler.com/articles/data-contracts.html#:~:text=rks%20Technology%20Radar).-,apiVersion%3A%20%22v3.2.0%22%20kind%3A%20%22DataContract%22%20id%3A,%22Customers%22%20version%3A%20%221.0.0%22%20status%3A%20%22active%22,-schema%3A%20%2D%20name%3A)

while I did physically bristle at the use of YAML (give me some strong types, baby!!), I am taking notes on the shape. I should take a closer look at the ODCS and see if there’s any tweaks I could/should make to Flowthru’s Catalog interfaces, since they’ve certainly thought of cases I haven’t.

Nov 18, 2026

[> [!quote] Quote
>
> the company's data marketplace](https://martinfowler.com/articles/data-contracts.html#:~:text=a%20page%20in-,the%20company's%20data%20marketplace,-rather%20than%20as)

Ah! I got giddy at seeing this analogy.

Nov 18, 2026

[> [!quote] Quote
>
> In ODCS, there are specific elements to describe the quality of the data through quality rules as well as service levels that specify runtime behavior over time.](https://martinfowler.com/articles/data-contracts.html#:~:text=contain%20correct%20data.-,In%20ODCS%2C%20there%20are%20specific,specify%20runtime%20behavior%20over%20time.,-Here%20is%20how)

This is certainly a new/novel bit. I’ve talked with a few folks about how to go past “schema” and into more qualitative properties of Catalog entries, so they have my attention here.

Nov 18, 2026

[> [!quote] Quote
>
> quality: - type: "sql" description: "Expect less than 1% empty name fields" query: | SELECT AVG( CASE WHEN customer\_name IS NULL OR TRIM(customer\_name) = '' THEN 1 ELSE 0 END ) FROM customers mustBeLessThan: 0.01](https://martinfowler.com/articles/data-contracts.html#:~:text=%2D%20name%3A%20%22customer_name%22-,quality%3A%20%2D%20type%3A%20%22sql%22%20description%3A,)%20FROM%20customers%20mustBeLessThan%3A%200.01,-slaProperties%3A%20%2D%20property%3A)

Ooooooo.

*Ooooooo!*

This would be PERFECT for the pre-flight check system. I think this’d also be able to extend FUnit out to the Catalog system, which is something I hadn’t considered until just now.

Nov 18, 2026

[> [!quote] Quote
>
> slaProperties: - property: "freshness" value: 24 unit: "hours" element: "customers.last\_updated\_at" description: "Within 24 hours of the last update"](https://martinfowler.com/articles/data-contracts.html#:~:text=mustBeLessThan%3A%200.01-,slaProperties%3A%20%2D%20property%3A%20%22freshness%22%20value%3A,hours%20of%20the%20last%20update%22,-Seeing%20these%20guarantees%2C)

Versioning is also an interesting concept. I didn’t personally see a whole lot of dataset versioning during my time at M Science, but there were times where it felt like our primary product *was* breaking changes, which semver would have a lot to weigh into.

Nov 18, 2026

[> [!quote] Quote
>
> Data contracts break that loop by giving agents the explicit metadata they would otherwise have to guess.](https://martinfowler.com/articles/data-contracts.html#:~:text=on%20their%20own.-,Data%20contracts%20break%20that%20loop,would%20otherwise%20have%20to%20guess.,-An%20agent%20has)

There is a certain power to giving an agent access to, say, DuckDB in order to verify properties of data sets, even in a quick way, but there’s no guarantee that they would do that (or do it correctly). Having the framework take over some of that responsibility would be a good move.

Nov 18, 2026

[> [!quote] Quote
>
> Versioned. A data contract carries a version and evolves under a clear scheme, so consumers can tell a harmless change from a breaking one, and providers can phase new versions in and old ones out gracefully.](https://martinfowler.com/articles/data-contracts.html#:~:text=pass%20or%20fail.-,Versioned.%20A%20data%20contract%20carries,and%20old%20ones%20out%20gracefully.,-Provider%2Ddriven.%20It%20is)

I’ll have to take a closer look at how versioning is handled by ODCS/Bitol

Nov 18, 2026

[> [!quote] Quote
>
> The specification of the Open Data Contract Standard is publicly available on GitHub, where it has over 1000 stars. The standard comes with a JSON schema to help validate YAML files in terms of standard compliance.](https://martinfowler.com/articles/data-contracts.html#:~:text=f%20metadata%20standards.-,The%20specification%20of%20the%20Open,in%20terms%20of%20standard%20compliance.,-Figure%201%3A%20The)

On a cursory glance, I think Flowthru’s catalog system handles… *maybe* 40% of this, at a glance? It gets some of the fundamentals (catalog items *are* objects, with all that entails. I suppose they are technically versioned alongside the software? Schema is a gimme. Quality is… somewhat checked at preflight, although I can already see it can do *way* better.

Ownership and (maybe?) support is *technically* handle-able via `CODEOWNERS`, but obviously not to the extent I’d prefer. Terms of use… is interesting, but not possibly applicable. SLA would go into Preflight. “Servers” is handled by the internal medium abstraction. Security is non-existent (gimme a break – the framework is in beta. Not saying it’s an *afterthought*, but… my plan *is* to think about it *after*, y’know?). AI context… probably also not applicable? Pricing is a likely non-factor, although interesting in light of recent discussions I’ve had both at work and during consulting.

Extensibility is a wildcard that I dare not touch,.

Nov 18, 2026

[> [!quote] Quote
>
> schema: - name: "customer\_360" properties: - name: "cid" authoritativeDefinitions: - type: "semantics" url: "https://example.com/ns/Customer.id"](https://martinfowler.com/articles/data-contracts.html#:~:text=to%20join%20them-,schema%3A%20%2D%20name%3A%20%22customer_360%22%20properties%3A,%2D%20type%3A%20%22semantics%22%20url%3A%20%22https%3A%2F%2Fexample.com%2Fns%2FCustomer.id%22,-The%20core%20concept)

Now *this* is spicy. I could see this being a very, *very* good use case for NewTypes, which I *technically* support, but could certainly support better.

Nov 18, 2026

[> [!quote] Quote
>
> The ontology itself can be described using standards like RDF, OWL, or using the promising ontology standard within the Apache Ossie project, currently incubating at the Apache Software Foundation.](https://martinfowler.com/articles/data-contracts.html#:~:text=within%20that%20ontology.-,The%20ontology%20itself%20can%20be,at%20the%20Apache%20Software%20Foundation.,-Data%20Products%20Build)

Stashing away Ossie as well.

Nov 18, 2026

[> [!quote] Quote
>
> keeping it next to the code,](https://martinfowler.com/articles/data-contracts.html#:~:text=creating%20it%20deliberately%2C-,keeping%20it%20next%20to%20the%20code%2C,-evolving%20it%20without)

Ah, *mon ami* – what if it *was* the code?

Nov 18, 2026

[> [!quote] Quote
>
> The Story of Versioning and Breaking Changes One of the main goals of data contracts is to find breaking changes before consumers are affected, and offer graceful evolution processes. For that, data contracts follow the SemVer versioning scheme. Major Version Change: Breaking change such as removing a column or renaming it Minor Version Change: Non-breaking change such as adding a new column Patch Version Change: Small change such as fixing a typo or updating the support channels](https://martinfowler.com/articles/data-contracts.html#:~:text=te%20server%20entries.-,The%20Story%20of%20Versioning%20and,or%20updating%20the%20support%20channels,-Breaking%20changes%20increase)

I have… thoughts on this.

In Flowthru, I’ve found that this is largely the easy part: if a column changes names, that’s *obviously* going to break some stuff downstream. That’s pretty much deterministically lintable, even without *running* a downstream pipeline.

Data *qualities* (say: this column is normalized) is what gets tricky. They touch on this a bit above with the pre-flight checks, but that is a genuinely difficult thing to try and test. It’s not a *breaking* change, but it *could* be.

In the econometrics world, when a survey changes (say, the wording of a question changes), that’s *kind of* a breaking change. Even if the literal, material properties of the *answer* haven’t changed (it’s still, say, a multiple choice), that’s something that makes comparing before-and-after an apples-to-oranges comparison. I suppose the choice of when to tick up semver is ultimately the onus of the data owner, with an understanding of what “breaking” means to downstream consumers, but it definitely fuzzes the line a bit.

Nov 18, 2026
