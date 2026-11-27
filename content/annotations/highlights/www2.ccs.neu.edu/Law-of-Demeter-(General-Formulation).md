# Law of Demeter (LOD)

> Annotations on Karl Lieberherr's "Law of Demeter"

- Page: https://blog.chaoticgood.computer/content/annotations/highlights/www2.ccs.neu.edu/Law-of-Demeter-(General-Formulation)
- Author: Spencer Elkington
- Published: 2026-11-06
- Updated: 2026-11-17
- Tags: engineering, reading/web, writing/fragments

---

From [www2.ccs.neu.edu](https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html)

## Annotations

[> [!quote] Quote
>
> A more general formulation of the Law of Demeter is: Each unit should have only limited knowledge about other units: only units "closely" related to the current unit. Or: Each unit should only talk to its friends; Don't talk to strangers.](https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html#:~:text=by%20Ian%20Holland.-,A%20more%20general%20formulation%20of,friends%3B%20Don't%20talk%20to%20strangers.,-In%20this%20general)

This a principle I’ve tried to stick through with Flowthru, which is made easy by connections between its primitives being closely tied to the DAG that they assemble: if you try coupling things together in terrible ways, the flows (which are all DAGs) become immediately nightmarish. “Ugly” DAGs have a somewhat pleasant aesthetic definition: if the visualization of a DAG is structurally fucked, then the DAG itself is probably *also* structurally fucked.

Coming from Pragmatic Programmer, it’s difficult not to think about this as a form of software rot (tip 3, software entropy): that by reaching for “but X should talk to Y!” too often, there’s a tendency to tangle.

I also think this hails back to [Software Gardening](https://blog.chaoticgood.computer/Software%20Gardening): the role of a stack engineer is to make it structurally difficult for a unit of the code to know too much outside its immediate domain, making the Law of Demeter an actual *law*, rather than a soft rule to be shortcutted past by an agent.

(The Pragmatic Programmer actually touches on that idea: its footnote on the Law of Demeter is “So it’s not really law. It’s more like The Jolly Good Idea of Demeter”. I believe we have more tools than ever to codify this: that’s part of why I enjoy writing linters that make use of .NET’s Roslyn, and do this a *lot* in Flowthru.)

Nov 06, 2026

[> [!quote] Quote
>
> A method should have limited knowledge of an object model. This view leads to aspect-oriented programming: we pull out the method and transitively all its auxiliary methods into a separate aspect. This works best if the separate aspect has limited knowledge about the object model.](https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html#:~:text=of%20Demeter%20as%3A-,A%20method%20should%20have%20limited,knowledge%20about%20the%20object%20model.,-The%20Law%20of)

I think this is something that I really had to noodle on when I first entered into the domain of ORMs, which enforce databases and objects in code to align. Over a lot of time working with EFCore, specifically, I’ve developed a repulsion towards having methods attached to objects that should, in an ideal setup, be purely data objects representing the rows of a table.

It also meshes well in my broken dev brain of thinking about things in terms of little machines on an assembly line, where the data (a product moving across the assembly line) and the actions done to that data ought to be separate things.

Nov 06, 2026

[> [!quote] Quote
>
> Professor Karl Lieberherr College of Computer and Information Science Science, Northeastern University Boston, MA 02115 lieber at ccs.neu.edu](https://www2.ccs.neu.edu/research/demeter/demeter-method/LawOfDemeter/general-formulation.html#:~:text=Demeter%20home%20page-,Professor%20Karl%20Lieberherr%20College%20of,MA%2002115%20lieber%20at%20ccs.neu.edu)

I’m not sure if this is a case of [frequency illusion](https://en.wikipedia.org/wiki/Frequency_illusion), but there is a part of me that is absolutely floored by how often random research paths eventually lead me back to “oh, *they* live in Boston, too?”

The last notable one: [Wayland](https://arstechnica.com/information-technology/2011/03/the-linux-graphics-stack-from-x-to-wayland/)

Nov 06, 2026
