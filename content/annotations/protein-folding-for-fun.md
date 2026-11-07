# An Annotated Guide to Hobbyist Protein Folding

> Amaze (or bore) your friends and family by picking up on a hot new hobby that's all the rage — protein folding! An annotated starter to the 2021 paper "ColabFold - Making protein folding accessible to all"

- Page: https://blog.chaoticgood.computer/content/annotations/protein-folding-for-fun
- Author: Spencer Elkington
- Published: 2026-02-25
- Updated: 2026-11-02
- Tags: engineering/bio, engineering/data, engineering/languages/python, projects/homelab, writing/annotations

---

> [!note] Note
>
> Some of these annotations may reference the [pre-print version of this paper](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf)

We’ll be taking a minor detour from the usual riveting topics — [the philosophy of computer programming](https://blog.chaoticgood.computer/content/annotations/programming-as-theory-building), [the graph theory behind urban design](https://blog.chaoticgood.computer/tags/projects/a-pattern-language), etc — to visit a new and exciting subject: folding proteins in the comfort of your own home!

The heaviest of disclaimers — I am ***absolutely not*** a computational biologist. The words “proteins” and “sugars” mean almost nothing to me, save for two adjectives that might describe a steak dinner and dessert. These annotations are part of a favor to a friend, who has found the need to set up and run [ColabFold](https://github.com/sokrypton/ColabFold) for some investigative digging into something she’s working on.

While I know next-to-nothing about biology, I know *just* enough about machine learning models to get a branch of the project, [localcolabfold](https://github.com/YoshitakaMo/localcolabfold?tab=readme-ov-file), running on my [homelab server](https://blog.chaoticgood.computer/tags/projects/homelab) to generate an initial proof-of-concept.

A good second step to using a new piece of software (after, of course, actually getting it to run) is to make sure you’re using it right. While reading a single paper is no substitute for actual training, or a Ph.D. in computational biology, I’d like to at least be able to semi-accurately convey good practices for driving AlphaFold (as well as other related models), to make sure she gets the information she needs to carry out a thorough investigation.

Source document: [www.nature.com](https://www.nature.com/articles/s41592-022-01488-1.pdf)

## Annotations

> AlphaFold2 or RoseTTAFold.

As an unqualified qualifier for context: [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold) is a machine learning model that is able to simulate how protein molecules curl up, or [fold](https://en.wikipedia.org/wiki/Protein_folding).

This is a notoriously hard problem to solve. Imagine one of those [magnetic bead toy sets](https://www.youtube.com/watch?v=9iNZmlUGzh4), where you can pull it apart to get a single-file chain of magnets. However, these magnets aren’t all the exact same; instead, they all want to be at different angles, are different shapes, and have different magnetic fields. Your job is to take this random chain of magnets, toss it in the air, and figure out what shape it’ll be before you catch it. That’s a *simple* version of the protein folding problem.

In the spirit of friendly competition among nerds, the Critical Assessment of Structure Prediction ([CASP](https://en.wikipedia.org/wiki/CASP)) competition was established in 1994. The goal was simple — given a bunch of proteins whose folds have already been solved, who can use *only* computers to predict correct folds?

The CASP competition is basically an Olympic event for computational biologists, and has a massive impact on research for medical treatments and drug interactions. Experimentally determining folds for protein sequences is difficult work, so being able to even *vaguely estimate* protein folding would be a miracle.

In 2017, when I was a freshman computer science undergraduate, a (fairly young) professor said that he was hopeful, but not optimistic, that reliable computerized protein folding would be achieved in his lifetime — at that point, the best models were a far shot away from reliable, barely coming close to parity with experimental predictions.

Then, in 2018 and 2020, AlphaFold absolutely swept the competition:

> [!quote] Quote
>
> ![](https://www.researchgate.net/publication/376852829/figure/fig4/AS:11431281214608293@1703696537806/CASP-median-free-modelling-category-over-the-years-showing-the-best-model-GDT-score-7.png)
>
> —[Application of Artificial Intelligence in Biochemistry Research: A Review](https://www.researchgate.net/publication/376852829_Application_of_Artificial_Intelligence_in_Biochemistry_Research_A_Review)

Anyway — I’ll get on with it. AlphaFold (and its successors) are now open-source software, allowing anybody with a half-decent GPU to run it at home. The problem of protein folding still isn’t *solved*, but the accuracy of modern models is still enough to be incredible for preliminary research, allowing researchers to find and follow promising investigative results. AlphaFold is probably a leading candidate for any list of 7 Wonders of the Modern World, and its creators [won the 2024 Nobel Prize in Chemistry](https://www.nobelprize.org/prizes/chemistry/2024/press-release/).

Feb 28, 2026

> lphaFold2 (ref. 1) was able to predict the 3D atomic coordinates of folded protein structures at a median global distance test total score (GDT\_TS) of 92.4% in the latest round of the protein folding competition by the international community,

I’ll be honest — the [CASP website](https://predictioncenter.org/index.cgi) is… dense. I’m having trouble finding the CASP16 (2024) metrics, but it seems(?) like ColabFold actually did [come in first for the single-protein domain competition](https://predictioncenter.org/casp16/zscores_final.cgi). Congrats!

My understanding is that single-protein folding is now *nearly* solved, coming close to experimentally confirmed folding results. It seems that the next big thing is [predicting protein multimers](https://en.wikipedia.org/wiki/Protein_complex) — which, if I’m understanding right, is how multiple proteins fold together even if they’re not chemically attached. Fret not! [CASP has a competition for that, too!](https://predictioncenter.org/casp16/zscores_multimer.cgi)

Well — fret a little bit. The NIH under the Trump administration withheld funding for CASP17, scheduled for fall of this year. All part of the mission to make us great again?

Thankfully, [stopgap funding from close partners](https://www.statnews.com/2025/07/21/casp-new-funding-from-alphafold-developer-google-deepmind-after-nih-grant-runs-out/) seems to be keeping the competition afloat.

Feb 28, 2026

> (C)To help researchers judge the predicted structure quality we visualize MSA depth and diversity and show the AlphaFold2confidence measures (pLDDT and PAE).

> [!note] Note
>
> this annotation is referencing an extended figure available in the [pre-print version](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf))

> [!quote] Quote
>
> ![Pasted image 20260228121023](https://blog.chaoticgood.computer/_astro/Pasted%20image%2020260228121023.B9wa0_BK_97F24.webp)
>
> ![Pasted image 20260228121036](https://blog.chaoticgood.computer/_astro/Pasted%20image%2020260228121036.qv6A0Iz__1EKIfi.webp)

Oh! Wait! Is this the flexibility setup?

I’ll need to confirm whether or not “confidence”, here, means “confidence in a correct result” or “confidence in the rigid result”. Realizing that the alignment error graphs from C are being back-applied to the structure predictions from B is, I think, actually what the flexibility setup might need. It makes intuitive sense that the… li’l tail on that sucker? would be the part that isn’t part of the rigid structure of the protein, and so it could conceivably be at many different orientations off of the main protein body.

Feb 27, 2026

> Fig. 1 | Schematic diagram of ColabFold. a,b,

Ah, this is the good stuff — in the proof-of-concept, I wasn’t quite sure what any of these visualizations represented. I did appreciate how pretty they were, though.

Feb 28, 2026

> Fig. 2 | Comparison of predictions for single chains and complexes.

Okay — so there are material differences in the data. The shape is roughly the same, and the local run is *probably* good enough for preliminary investigation, but any more intense runs will probably require more than my 2x3060 could handle. The current homelab runs are a hair above “just fuckin’ around.”

Feb 28, 2026

> mber force fields2

Okay — whoever coined “amber force fields” as an actual scientific parameter should get the Nobel Prize for Coolest Term.

However, this does bring up precisely *why* I’m taking a look at this paper. As neat as machine learning models, they aren’t plug-and-play. Transformer-based models are built on **weights** — the values of connections within the model itself. These are not directly customizable.

However, that isn’t to say these models *aren’t* customizable. All models are. We call these customizations [hyperparameters](https://en.wikipedia.org/wiki/Hyperparameter_(machine_learning)), and they’re effectively how somebody using the model can properly drive it.

In the context of the investigation I’m trying to assist, these are *very* important. This paragraph seems to go over them with a light touch, so more digging may be necessary. Their values aren’t necessarily *opinion*, but they are part of the experimental design and should be both understood during the investigation, and published as part of any results.

Feb 28, 2026

> AlphaFold2\_advanced, for advanced users,

This is the tricky part about the `localcolabfold` library — it exposes these parameters for “advanced users,” which is why it’s important to understand what’s going on, here.

Feb 28, 2026

> that both databases together would have required ~517 GB RAM for headers and sequences alone.

My homelab server is beefy, but not half-a-terabyte-of-RAM beefy.

Feb 28, 2026

> his saves 7 min of compile time. When templates are enabled, model 1 is compiled and weights from model 2 are used, model 3 is compiled and weights from models 4 and 5 are used. This saves 5 min of compile time. If the user changes the sequence or settings without changing the length or number of sequences in the MSA, the compiled models are reused without triggering recompilation

After looking at the source code for `localcolabfold`, I was *thoroughly* impressed by how well-optimized it was. The onboarding was a bit tricky if somebody didn’t have a real UNIX-y background, but onboarding is realistically the hardest part of any project, and the most impossible to test.

Feb 28, 2026

> Recycle count. AlphaFold2 improves the predicted protein structure by recycling (by default) three times, meaning that the prediction is fed multiple times through the model. We exposed the recycle count as a customizable parameter given that additional recycles can often improve a model (Supplementary Fig. 6) at the cost of a longer run time. We also implemented an option to specify a tolerance threshold to stop early. For some designed proteins without known homologous sequences, this helped to fold the final protein (Supplementary Fig. 5).

Ah, okay — so there *is* a short-circuit in place when the result has converged. This is a good one to get confirmation of, as there’s quite a bit of iteration in the standard run — while a single run recycles, it also runs through multiple models (and, if you want to, multiple seeds on each model). This is the difference between *convergence* (one model seems to have honed in on a consistent result) and *consensus* (multiple models have returned similar final results).

Interestingly, non-consensus is not a dealbreaker, and can actually be valuable information. Off the top of my head, a specific case of non-consensus as valuable data is to suss out which parts of the fold are flexible, and which are rigid. As I understand it, it’s like how those floppy blow-up mannequins in car dealerships can flop around.

Feb 28, 2026

> MSA to a maximum of 512 cluster centers and 1,024 extra sequences.

I did see this parameter floating around — while I think there is some reason to adjust these, the values may be more limited by the available RAM on my workstation than hard scientific rationale.

Feb 28, 2026

> Custom MSAs. ColabFold enables researchers to upload their own MSAs. Any kind of alignment tool can be used to generate the MSA. The uploaded MSA can be provided in aligned FASTA, A3M, STOCKHOLM or Clustal format. We convert the respective MSA format into A3M format using the reformat.pl script from the HH-suite8.

I don’t *think* that this will come up, but I know that there’s… something in here about a more complex/intensive run generating key-value pairs for additional analysis, especially in active areas of the folded protein — keeping an eye out for that, because it seems relevant.

Feb 28, 2026

> All ColabFold and AlphaFold2 model inference run-time measurements were done on systems with 2 × 16 core Intel Gold 6242 CPUs with 192 GB RAM and 4x Nvidia Quadro RTX5000 GPUs. Only one GPU was used in each run.ColabFold-RoseTTAFold-BFD/MGnify and ColabFold-AlphaFold2-BFD/MGnify used the same MSAs, and run times are shown only once.

You know — I’m usually used to papers like this floating GPUs like the Nvidia H100, which is about $35,000 retail. However, I’m pleasantly surprised by the cards they put forward, here: the V100 32GB seems to be around $700 right now, and the K40 is, like, $150.

Looking a bit closer, my homelab machine may be a bit stronger than their base AlphaFold2. However, it did still barely break 60FPS on Borderlands 4, which is the real benchmark — right?

As a sanity check, the target they mention running on the stronger machine is [T1061](https://predictioncenter.org/casp14/target.cgi?id=65&view=all), from CASP14. At 949… residues? amino acids? I doubt anything we’re up to would break that cap.

Feb 28, 2026

## Light Conclusions

While I was hoping for a bit more information on how best to read the output graphs, and how best to tune the hyperparameters of the model to try and actually answer the investigatory questions, I think this was a good contextual primer for ColabFold, and a nice opportunity to gush about the nerds out there competing in the world’s strangest, but possibly most beneficial, sport.

Why curl when you can fold?
