---
title: An Annotated Guide to Hobbyist Protein Folding
date: 2026-02-25
tags:
  - engineering/bio
  - engineering/data
  - engineering/languages/python
  - projects/homelab
  - writing/annotations
annotation-target: https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf
description: Amaze (or bore) your friends and family by picking up on a hot new hobby that's all the rage — protein folding! An annotated starter to the 2021 paper "ColabFold - Making protein folding accessible to all"
---


>%%
>```annotation-json
>{"created":"2026-02-26T06:44:35.236Z","text":"We'll be taking a minor detour from the usual riveting topics — [[content/annotations/programming-as-theory-building|the philosophy of computer programming]],  [[tags/writing/annotations/a-pattern-language|the graph theory behind urban design]], etc — to visit a new and exciting subject: folding proteins in the comfort of your own home!\n\nThe heaviest of disclaimers — I am ***absolutely not*** a computational biologist. The words \"proteins\" and \"sugars\" mean almost nothing to me, save for two adjectives that might describe a steak dinner and dessert. These annotations are part of a favor to a friend, who has found the need to set up and run [ColabFold](https://github.com/sokrypton/ColabFold) for some investigative digging into something she's working on.\n\nWhile I know next-to-nothing about biology, I know *just* enough about machine learning models to get a branch of the project, [localcolabfold](https://github.com/YoshitakaMo/localcolabfold?tab=readme-ov-file), running on my [[tags/projects/homelab|homelab server]] to generate an initial proof-of-concept.\n\nA good second step to using a new piece of software (after, of course, actually getting it to run) is to make sure you're using it right. While reading a single paper is no substitute for actual training, or a Ph.D. in computational biology, I'd like to at least be able to semi-accurately convey good practices for driving AlphaFold (as well as other related models), to make sure she gets the information she needs to carry out a thorough investigation.","updated":"2026-02-26T06:44:35.236Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":0,"end":52},{"type":"TextQuoteSelector","exact":"ColabFold - Making protein folding accessible to all","prefix":"th50%75%100%125%150%200%300%400%","suffix":"Milot Mirdita,1, ∗Sergey Ovchinn"}]}]}
>```
>%%
>*%%PREFIX%%th50%75%100%125%150%200%300%400%%%HIGHLIGHT%% ==ColabFold - Making protein folding accessible to all== %%POSTFIX%%Milot Mirdita,1, ∗Sergey Ovchinn*
>%%LINK%%[[#^6cjkwc9toov|show annotation]]
>%%COMMENT%%
>We'll be taking a minor detour from the usual riveting topics — [[content/annotations/programming-as-theory-building|the philosophy of computer programming]],  [[tags/writing/annotations/a-pattern-language|the graph theory behind urban design]], etc — to visit a new and exciting subject: folding proteins in the comfort of your own home!
>
>The heaviest of disclaimers — I am ***absolutely not*** a computational biologist. The words "proteins" and "sugars" mean almost nothing to me, save for two adjectives that might describe a steak dinner and dessert. These annotations are part of a favor to a friend, who has found the need to set up and run [ColabFold](https://github.com/sokrypton/ColabFold) for some investigative digging into something she's working on.
>
>While I know next-to-nothing about biology, I know *just* enough about machine learning models to get a branch of the project, [localcolabfold](https://github.com/YoshitakaMo/localcolabfold?tab=readme-ov-file), running on my [[tags/projects/homelab|homelab server]] to generate an initial proof-of-concept.
>
>A good second step to using a new piece of software (after, of course, actually getting it to run) is to make sure you're using it right. While reading a single paper is no substitute for actual training, or a Ph.D. in computational biology, I'd like to at least be able to semi-accurately convey good practices for driving AlphaFold (as well as other related models), to make sure she gets the information she needs to carry out a thorough investigation.
>%%TAGS%%
>
^6cjkwc9toov


>%%
>```annotation-json
>{"text":"As an unqualified qualifier for context: [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold) is a machine learning model that is able to simulate how protein molecules curl up, or [fold](https://en.wikipedia.org/wiki/Protein_folding).\n\nThis is a notoriously hard problem to solve. Imagine one of those [magnetic bead toy sets](https://www.youtube.com/watch?v=9iNZmlUGzh4), where you can pull it apart to get a single-file chain of magnets. However, these magnets aren't all the exact same; instead, they all want to be at different angles, are different shapes, and have different magnetic fields. Your job is to take this random chain of magnets, toss it in the air, and figure out what shape it'll be before you catch it. That's a *simple* version of the protein folding problem.\n\nIn the spirit of friendly competition among nerds, the Critical Assessment of Structure Prediction ([CASP](https://en.wikipedia.org/wiki/CASP)) competition was established in 1994. The goal was simple — given a bunch of proteins whose folds have already been solved, who can use *only* computers to predict correct folds?\n\nThe CASP competition is basically an Olympic event for computational biologists, and has a massive impact on research for medical treatments and drug interactions. Experimentally determining folds for protein sequences is difficult work, so being able to even *vaguely estimate* protein folding would be a miracle.\n\nIn 2017, when I was a freshman computer science undergraduate, a (fairly young) professor said that he was hopeful, but not optimistic, that reliable computerized protein folding would be achieved in his lifetime — at that point, the best models were a far shot away from reliable, barely coming close to parity with experimental predictions.\n\nThen, in 2018 and 2020, AlphaFold absolutely swept the competition:\n\n> [!QUOTE]\n> \n> ![](https://www.researchgate.net/publication/376852829/figure/fig4/AS:11431281214608293@1703696537806/CASP-median-free-modelling-category-over-the-years-showing-the-best-model-GDT-score-7.png)\n> \n> —[Application of Artificial Intelligence in Biochemistry Research: A Review](https://www.researchgate.net/publication/376852829_Application_of_Artificial_Intelligence_in_Biochemistry_Research_A_Review)\n\nAnyway — I'll get on with it. AlphaFold (and its successors) are now open-source software, allowing anybody with a half-decent GPU to run it at home. The problem of protein folding still isn't *solved*, but the accuracy of modern models is still enough to be incredible for preliminary research, allowing researchers to find and follow promising investigative results. AlphaFold is probably a leading candidate for any list of 7 Wonders of the Modern World, and its creators [won the 2024 Nobel Prize in Chemistry](https://www.nobelprize.org/prizes/chemistry/2024/press-release/).","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":674,"end":685},{"type":"TextQuoteSelector","exact":"AlphaFold2 ","prefix":"ucture prediction is powered by","suffix":"and RoseTTAFold combined with a"}]}],"created":"2026-02-26T06:54:59.197Z","updated":"2026-02-26T06:54:59.197Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}
>```
>%%
>*%%PREFIX%%ucture prediction is powered by%%HIGHLIGHT%% ==AlphaFold2== %%POSTFIX%%and RoseTTAFold combined with a*
>%%LINK%%[[#^spg2dkqf87o|show annotation]]
>%%COMMENT%%
>As an unqualified qualifier for context: [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold) is a machine learning model that is able to simulate how protein molecules curl up, or [fold](https://en.wikipedia.org/wiki/Protein_folding).
>
>This is a notoriously hard problem to solve. Imagine one of those [magnetic bead toy sets](https://www.youtube.com/watch?v=9iNZmlUGzh4), where you can pull it apart to get a single-file chain of magnets. However, these magnets aren't all the exact same; instead, they all want to be at different angles, are different shapes, and have different magnetic fields. Your job is to take this random chain of magnets, toss it in the air, and figure out what shape it'll be before you catch it. That's a *simple* version of the protein folding problem.
>
>In the spirit of friendly competition among nerds, the Critical Assessment of Structure Prediction ([CASP](https://en.wikipedia.org/wiki/CASP)) competition was established in 1994. The goal was simple — given a bunch of proteins whose folds have already been solved, who can use *only* computers to predict correct folds?
>
>The CASP competition is basically an Olympic event for computational biologists, and has a massive impact on research for medical treatments and drug interactions. Experimentally determining folds for protein sequences is difficult work, so being able to even *vaguely estimate* protein folding would be a miracle.
>
>In 2017, when I was a freshman computer science undergraduate, a (fairly young) professor said that he was hopeful, but not optimistic, that reliable computerized protein folding would be achieved in his lifetime — at that point, the best models were a far shot away from reliable, barely coming close to parity with experimental predictions.
>
>Then, in 2018 and 2020, AlphaFold absolutely swept the competition:
>
>> [!QUOTE]
>> 
>> ![](https://www.researchgate.net/publication/376852829/figure/fig4/AS:11431281214608293@1703696537806/CASP-median-free-modelling-category-over-the-years-showing-the-best-model-GDT-score-7.png)
>> 
>> —[Application of Artificial Intelligence in Biochemistry Research: A Review](https://www.researchgate.net/publication/376852829_Application_of_Artificial_Intelligence_in_Biochemistry_Research_A_Review)
>
>Anyway — I'll get on with it. AlphaFold (and its successors) are now open-source software, allowing anybody with a half-decent GPU to run it at home. The problem of protein folding still isn't *solved*, but the accuracy of modern models is still enough to be incredible for preliminary research, allowing researchers to find and follow promising investigative results. AlphaFold is probably a leading candidate for any list of 7 Wonders of the Modern World, and its creators [won the 2024 Nobel Prize in Chemistry](https://www.nobelprize.org/prizes/chemistry/2024/press-release/).
>%%TAGS%%
>
^spg2dkqf87o


>%%
>```annotation-json
>{"created":"2026-02-26T07:48:36.776Z","text":"I'll be honest — the [CASP website](https://predictioncenter.org/index.cgi) is... dense. I'm having trouble finding the CASP16 (2024) metrics, but it seems(?) like ColabFold actually did [come in first for the single-protein domain competition](https://predictioncenter.org/casp16/zscores_final.cgi). Congrats!\n\nMy understanding is that single-protein folding is now *nearly* solved, coming close to experimentally confirmed folding results. It seems that the next big thing is [predicting protein multimers](https://en.wikipedia.org/wiki/Protein_complex) — which, if I'm understanding right, is how multiple proteins fold together even if they're not chemically attached. Fret not! [CASP has a competition for that, too!](https://predictioncenter.org/casp16/zscores_multimer.cgi)\n\nWell — fret a little bit. The NIH under the Trump administration withheld funding for CASP17, scheduled for fall of this year. All part of the mission to make us great again?\n\nThankfully, [stopgap funding from close partners](https://www.statnews.com/2025/07/21/casp-new-funding-from-alphafold-developer-google-deepmind-after-nih-grant-runs-out/) seems to be keeping the competition afloat.","updated":"2026-02-26T07:48:36.776Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":1638,"end":1791},{"type":"TextQuoteSelector","exact":"lphaFold2 [2] wasable to predict the 3D atomic coordinates of folded pro-tein structures at an median GDT-TS of 92.4% in thelatest CASP14 [3] competition","prefix":"tures for end-to-end training, A","suffix":". The accuracy of manyof the pre"}]}]}
>```
>%%
>*%%PREFIX%%tures for end-to-end training, A%%HIGHLIGHT%% ==lphaFold2 [2] wasable to predict the 3D atomic coordinates of folded pro-tein structures at an median GDT-TS of 92.4% in thelatest CASP14 [3] competition== %%POSTFIX%%. The accuracy of manyof the pre*
>%%LINK%%[[#^x9e8wvml8yi|show annotation]]
>%%COMMENT%%
>I'll be honest — the [CASP website](https://predictioncenter.org/index.cgi) is... dense. I'm having trouble finding the CASP16 (2024) metrics, but it seems(?) like ColabFold actually did [come in first for the single-protein domain competition](https://predictioncenter.org/casp16/zscores_final.cgi). Congrats!
>
>My understanding is that single-protein folding is now *nearly* solved, coming close to experimentally confirmed folding results. It seems that the next big thing is [predicting protein multimers](https://en.wikipedia.org/wiki/Protein_complex) — which, if I'm understanding right, is how multiple proteins fold together even if they're not chemically attached. Fret not! [CASP has a competition for that, too!](https://predictioncenter.org/casp16/zscores_multimer.cgi)
>
>Well — fret a little bit. The NIH under the Trump administration withheld funding for CASP17, scheduled for fall of this year. All part of the mission to make us great again?
>
>Thankfully, [stopgap funding from close partners](https://www.statnews.com/2025/07/21/casp-new-funding-from-alphafold-developer-google-deepmind-after-nih-grant-runs-out/) seems to be keeping the competition afloat.
>%%TAGS%%
>
^x9e8wvml8yi


>%%
>```annotation-json
>{"created":"2026-02-26T08:01:26.283Z","text":"Okay — whoever coined \"amber force fields\" as an actual scientific parameter should get the Nobel Prize for Coolest Term.\n\nHowever, this does bring up precisely *why* I'm taking a look at this paper. As neat as machine learning models, they aren't plug-and-play. Transformer-based models are built on **weights** — the values of connections within the model itself. These are not directly customizable.\n\nHowever, that isn't to say these models *aren't* customizable. All models are. We call these customizations [hyperparameters](https://en.wikipedia.org/wiki/Hyperparameter_(machine_learning)), and they're effectively how somebody using the model can properly drive it.\n\nIn the context of the investigation I'm trying to assist, these are *very* important. This paragraph seems to go over them with a light touch, so more digging may be necessary. Their values aren't necessarily *opinion*, but they are part of the experimental design and should be both understood during the investigation, and published as part of any results.","updated":"2026-02-26T08:01:26.283Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":4363,"end":4382},{"type":"TextQuoteSelector","exact":"amber force fields ","prefix":"g the predicted structuresusing ","suffix":"[14], and (5) monomer complexpre"}]}]}
>```
>%%
>*%%PREFIX%%g the predicted structuresusing%%HIGHLIGHT%% ==amber force fields== %%POSTFIX%%[14], and (5) monomer complexpre*
>%%LINK%%[[#^h0kgm30k1i|show annotation]]
>%%COMMENT%%
>Okay — whoever coined "amber force fields" as an actual scientific parameter should get the Nobel Prize for Coolest Term.
>
>However, this does bring up precisely *why* I'm taking a look at this paper. As neat as machine learning models, they aren't plug-and-play. Transformer-based models are built on **weights** — the values of connections within the model itself. These are not directly customizable.
>
>However, that isn't to say these models *aren't* customizable. All models are. We call these customizations [hyperparameters](https://en.wikipedia.org/wiki/Hyperparameter_(machine_learning)), and they're effectively how somebody using the model can properly drive it.
>
>In the context of the investigation I'm trying to assist, these are *very* important. This paragraph seems to go over them with a light touch, so more digging may be necessary. Their values aren't necessarily *opinion*, but they are part of the experimental design and should be both understood during the investigation, and published as part of any results.
>%%TAGS%%
>
^h0kgm30k1i


>%%
>```annotation-json
>{"created":"2026-02-26T08:06:59.503Z","text":"This is the tricky part about the `localcolabfold` library — it exposes these parameters for \"advanced users,\" which is why it's important to understand what's going on, here.","updated":"2026-02-26T08:06:59.503Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":4423,"end":4461},{"type":"TextQuoteSelector","exact":"AlphaFold2_advanced for advanced users","prefix":" (5) monomer complexprediction. ","suffix":"additionally supports (6) MSA ge"}]}]}
>```
>%%
>*%%PREFIX%%(5) monomer complexprediction.%%HIGHLIGHT%% ==AlphaFold2_advanced for advanced users== %%POSTFIX%%additionally supports (6) MSA ge*
>%%LINK%%[[#^qfnd4gtpy7d|show annotation]]
>%%COMMENT%%
>This is the tricky part about the `localcolabfold` library — it exposes these parameters for "advanced users," which is why it's important to understand what's going on, here.
>%%TAGS%%
>
^qfnd4gtpy7d


>%%
>```annotation-json
>{"created":"2026-02-26T08:09:44.563Z","text":"Ah, this is the good stuff — in the proof-of-concept, I wasn't quite sure what any of these visualizations represented. I did appreciate how pretty they were, though.","updated":"2026-02-26T08:09:44.563Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":5701,"end":5723},{"type":"TextQuoteSelector","exact":"C Result visualization","prefix":"el 1Model 2Model 3Model 4Model 5","suffix":"Predicted LDDT per positionSeque"}]}]}
>```
>%%
>*%%PREFIX%%el 1Model 2Model 3Model 4Model 5%%HIGHLIGHT%% ==C Result visualization== %%POSTFIX%%Predicted LDDT per positionSeque*
>%%LINK%%[[#^cauesgutyr5|show annotation]]
>%%COMMENT%%
>Ah, this is the good stuff — in the proof-of-concept, I wasn't quite sure what any of these visualizations represented. I did appreciate how pretty they were, though.
>%%TAGS%%
>
^cauesgutyr5


>%%
>```annotation-json
>{"created":"2026-02-26T08:10:32.155Z","text":"My homelab server is beefy, but not half-a-terabyte-of-RAM beefy.","updated":"2026-02-26T08:10:32.155Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":7531,"end":7619},{"type":"TextQuoteSelector","exact":"both databases togetherwould have required ∼517 GB RAM for headers and se-quences alone.","prefix":"taldatabases BFD and Mgnify, as ","suffix":"BFD is a clustered protein datab"}]}]}
>```
>%%
>*%%PREFIX%%taldatabases BFD and Mgnify, as%%HIGHLIGHT%% ==both databases togetherwould have required ∼517 GB RAM for headers and se-quences alone.== %%POSTFIX%%BFD is a clustered protein datab*
>%%LINK%%[[#^mo4iv208kir|show annotation]]
>%%COMMENT%%
>My homelab server is beefy, but not half-a-terabyte-of-RAM beefy.
>%%TAGS%%
>
^mo4iv208kir


>%%
>```annotation-json
>{"created":"2026-02-26T08:11:31.666Z","text":"I don't *think* that this will come up, but I know that there's... something in here about a more complex/intensive run generating key-value pairs for additional analysis, especially in active areas of the folded protein — keeping an eye out for that, because it seems relevant.","updated":"2026-02-26T08:11:31.666Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":10635,"end":10746},{"type":"TextQuoteSelector","exact":"ColabFold allows researcher to uploadtheir own MSAs. Any kind of alignment tool can be usedto generate the MSA.","prefix":"rch from our server.Custom MSAs ","suffix":" The uploaded MSA can be pro-vid"}]}]}
>```
>%%
>*%%PREFIX%%rch from our server.Custom MSAs%%HIGHLIGHT%% ==ColabFold allows researcher to uploadtheir own MSAs. Any kind of alignment tool can be usedto generate the MSA.== %%POSTFIX%%The uploaded MSA can be pro-vid*
>%%LINK%%[[#^9m2aby7aw4i|show annotation]]
>%%COMMENT%%
>I don't *think* that this will come up, but I know that there's... something in here about a more complex/intensive run generating key-value pairs for additional analysis, especially in active areas of the folded protein — keeping an eye out for that, because it seems relevant.
>%%TAGS%%
>
^9m2aby7aw4i


>%%
>```annotation-json
>{"created":"2026-02-26T08:13:02.729Z","text":"Okay — so there are material differences in the data. The shape is roughly the same, and the local run is *probably* good enough for preliminary investigation, but any more intense runs will probably require more than my 2x3060 could handle. The current homelab runs are a hair above \"just fuckin' around.\"","updated":"2026-02-26T08:13:02.729Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":12509,"end":12612},{"type":"TextQuoteSelector","exact":"Comparison of ColabFold to Deepmind Colab using predictions of 20 free-modeling (FM) targets of CASP14.","prefix":"abFold (MMseqs2)A BCFIG. 3. (A) ","suffix":" Eachtarget was evaluated for ea"}]}]}
>```
>%%
>*%%PREFIX%%abFold (MMseqs2)A BCFIG. 3. (A)%%HIGHLIGHT%% ==Comparison of ColabFold to Deepmind Colab using predictions of 20 free-modeling (FM) targets of CASP14.== %%POSTFIX%%Eachtarget was evaluated for ea*
>%%LINK%%[[#^pj4inabiv2|show annotation]]
>%%COMMENT%%
>Okay — so there are material differences in the data. The shape is roughly the same, and the local run is *probably* good enough for preliminary investigation, but any more intense runs will probably require more than my 2x3060 could handle. The current homelab runs are a hair above "just fuckin' around."
>%%TAGS%%
>
^pj4inabiv2


>%%
>```annotation-json
>{"created":"2026-02-26T08:14:49.911Z","text":"After looking at the source code for `localcolabfold`, I was *thoroughly* impressed by how well-optimized it was. The onboarding was a bit tricky if somebody didn't have a real UNIX-y background, but onboarding is realistically the hardest part of any project, and the most impossible to test.","updated":"2026-02-26T08:14:49.911Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":14036,"end":14071},{"type":"TextQuoteSelector","exact":"This saves 7 minutesof compile time","prefix":"g the configuration of model 5. ","suffix":". When templates are enabled, mo"}]}]}
>```
>%%
>*%%PREFIX%%g the configuration of model 5.%%HIGHLIGHT%% ==This saves 7 minutesof compile time== %%POSTFIX%%. When templates are enabled, mo*
>%%LINK%%[[#^jooicofv0lc|show annotation]]
>%%COMMENT%%
>After looking at the source code for `localcolabfold`, I was *thoroughly* impressed by how well-optimized it was. The onboarding was a bit tricky if somebody didn't have a real UNIX-y background, but onboarding is realistically the hardest part of any project, and the most impossible to test.
>%%TAGS%%
>
^jooicofv0lc


>%%
>```annotation-json
>{"created":"2026-02-26T08:16:07.618Z","text":"Ah, okay — so there *is* a short-circuit in place when the result has converged. This is a good one to get confirmation of, as there's quite a bit of iteration in the standard run — while a single run recycles, it also runs through multiple models (and, if you want to, multiple seeds on each model). This is the difference between *convergence* (one model seems to have honed in on a consistent result) and *consensus* (multiple models have returned similar final results).\n\nInterestingly, non-consensus is not a dealbreaker, and can actually be valuable information. Off the top of my head, a specific case of non-consensus as valuable data is to suss out which parts of the fold are flexible, and which are rigid. As I understand it, it's like how those floppy blow-up mannequins in car dealerships can flop around.","updated":"2026-02-26T08:16:07.618Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":14716,"end":14891},{"type":"TextQuoteSelector","exact":"We also implemented an option tospecify a tolerance threshold to stop early. For somedesigned proteins without known homologous sequences,this helped to fold the final protein","prefix":"at the costof a longer runtime. ","suffix":" (see Fig. 2D).Sampling of diver"}]}]}
>```
>%%
>*%%PREFIX%%at the costof a longer runtime.%%HIGHLIGHT%% ==We also implemented an option tospecify a tolerance threshold to stop early. For somedesigned proteins without known homologous sequences,this helped to fold the final protein== %%POSTFIX%%(see Fig. 2D).Sampling of diver*
>%%LINK%%[[#^loulumv9f5g|show annotation]]
>%%COMMENT%%
>Ah, okay — so there *is* a short-circuit in place when the result has converged. This is a good one to get confirmation of, as there's quite a bit of iteration in the standard run — while a single run recycles, it also runs through multiple models (and, if you want to, multiple seeds on each model). This is the difference between *convergence* (one model seems to have honed in on a consistent result) and *consensus* (multiple models have returned similar final results).
>
>Interestingly, non-consensus is not a dealbreaker, and can actually be valuable information. Off the top of my head, a specific case of non-consensus as valuable data is to suss out which parts of the fold are flexible, and which are rigid. As I understand it, it's like how those floppy blow-up mannequins in car dealerships can flop around.
>%%TAGS%%
>
^loulumv9f5g


>%%
>```annotation-json
>{"created":"2026-02-26T08:21:51.679Z","text":"You know — I'm usually used to papers like this floating GPUs like the Nvidia H100, which is about $35,000 retail. However, I'm pleasantly surprised by the cards they put forward, here: the V100 32GB seems to be around $700 right now, and the K40 is, like, $150.\n\nLooking a bit closer, my homelab machine may be a bit stronger than their base AlphaFold2. However, it did still barely break 60FPS on Borderlands 4, which is the real benchmark — right?\n\nAs a sanity check, the target they mention running on the stronger machine is [T1061](https://predictioncenter.org/casp14/target.cgi?id=65&view=all), from CASP14. At 949... residues? amino acids? I doubt anything we're up to would break that cap.","updated":"2026-02-26T08:21:51.679Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":17146,"end":17414},{"type":"TextQuoteSelector","exact":"The full AlphaFold2 pipeline ran onsystems with 2x12 core Intel E5-2650v4 CPUs with 128GB and a Nvidia K40 GPU, except for T1061, whichrequired more GPU RAM. This target ran on a systemwith 2x24 core Intel Gold 6252 CPUs with 384 GB RAMand a Nvidia Tesla V100/32G GPU.","prefix":"lab respectively.Measuring time ","suffix":" We extracted theruntimes for th"}]}]}
>```
>%%
>*%%PREFIX%%lab respectively.Measuring time%%HIGHLIGHT%% ==The full AlphaFold2 pipeline ran onsystems with 2x12 core Intel E5-2650v4 CPUs with 128GB and a Nvidia K40 GPU, except for T1061, whichrequired more GPU RAM. This target ran on a systemwith 2x24 core Intel Gold 6252 CPUs with 384 GB RAMand a Nvidia Tesla V100/32G GPU.== %%POSTFIX%%We extracted theruntimes for th*
>%%LINK%%[[#^3up61ka1l4s|show annotation]]
>%%COMMENT%%
>You know — I'm usually used to papers like this floating GPUs like the Nvidia H100, which is about $35,000 retail. However, I'm pleasantly surprised by the cards they put forward, here: the V100 32GB seems to be around $700 right now, and the K40 is, like, $150.
>
>Looking a bit closer, my homelab machine may be a bit stronger than their base AlphaFold2. However, it did still barely break 60FPS on Borderlands 4, which is the real benchmark — right?
>
>As a sanity check, the target they mention running on the stronger machine is [T1061](https://predictioncenter.org/casp14/target.cgi?id=65&view=all), from CASP14. At 949... residues? amino acids? I doubt anything we're up to would break that cap.
>%%TAGS%%
>
^3up61ka1l4s


>%%
>```annotation-json
>{"created":"2026-02-26T08:33:40.200Z","text":"While I was hoping for a bit more information on how best to read the output graphs, and how best to tune the hyperparameters of the model to try and actually answer the investigatory questions, I think this was a good contextual primer for ColabFold, and a nice opportunity to gush about the nerds out there competing in the world's strangest, but possibly most beneficial, sport. Why curl when you can fold?","updated":"2026-02-26T08:33:40.200Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":19227,"end":19408},{"type":"TextQuoteSelector","exact":"In summary, ColabFold makes high quality protein struc-ture prediction accessible and additionally provides novelfeatures to explore the full potential of AlphaFold2 andRoseTTAFold.","prefix":"structures when data is limited.","suffix":"ACKNOWLEDGMENTWe thank Lim Hoe f"}]}]}
>```
>%%
>*%%PREFIX%%structures when data is limited.%%HIGHLIGHT%% ==In summary, ColabFold makes high quality protein struc-ture prediction accessible and additionally provides novelfeatures to explore the full potential of AlphaFold2 andRoseTTAFold.== %%POSTFIX%%ACKNOWLEDGMENTWe thank Lim Hoe f*
>%%LINK%%[[#^hvifyz8nmmg|show annotation]]
>%%COMMENT%%
>While I was hoping for a bit more information on how best to read the output graphs, and how best to tune the hyperparameters of the model to try and actually answer the investigatory questions, I think this was a good contextual primer for ColabFold, and a nice opportunity to gush about the nerds out there competing in the world's strangest, but possibly most beneficial, sport. Why curl when you can fold?
>%%TAGS%%
>
^hvifyz8nmmg


>%%
>```annotation-json
>{"created":"2026-02-26T08:20:14.457Z","text":"I did see this parameter floating around — while I think there is some reason to adjust these, the values may be more limited by the available RAM on my workstation than hard scientific rationale.","updated":"2026-02-26T08:20:14.457Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":15097,"end":15165},{"type":"TextQuoteSelector","exact":"MSA to a maxi-mum of 512 cluster centers and 1024 “extra” sequences.","prefix":"l configuration, subsamples the ","suffix":"Changing the random seed can res"}]}]}
>```
>%%
>*%%PREFIX%%l configuration, subsamples the%%HIGHLIGHT%% ==MSA to a maxi-mum of 512 cluster centers and 1024 “extra” sequences.== %%POSTFIX%%Changing the random seed can res*
>%%LINK%%[[#^owl9qbszbyd|show annotation]]
>%%COMMENT%%
>I did see this parameter floating around — while I think there is some reason to adjust these, the values may be more limited by the available RAM on my workstation than hard scientific rationale.
>%%TAGS%%
>
^owl9qbszbyd
