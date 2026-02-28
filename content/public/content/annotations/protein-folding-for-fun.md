---
title: An Annotated Guide to Hobbyist Protein Folding
date: 2026-02-25
tags:
  - engineering/bio
  - engineering/data
  - engineering/languages/python
  - projects/homelab
  - writing/annotations
annotation-target: https://www.nature.com/articles/s41592-022-01488-1.pdf
description: Amaze (or bore) your friends and family by picking up on a hot new hobby that's all the rage — protein folding! An annotated starter to the 2021 paper "ColabFold - Making protein folding accessible to all"
---


>%%
>```annotation-json
>{"text":"> [!NOTE]\n>\n> Some of these annotations may reference the [pre-print version of this paper](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf)\n\nWe'll be taking a minor detour from the usual riveting topics — [[content/annotations/programming-as-theory-building|the philosophy of computer programming]],  [[tags/writing/annotations/a-pattern-language|the graph theory behind urban design]], etc — to visit a new and exciting subject: folding proteins in the comfort of your own home!\n\nThe heaviest of disclaimers — I am ***absolutely not*** a computational biologist. The words \"proteins\" and \"sugars\" mean almost nothing to me, save for two adjectives that might describe a steak dinner and dessert. These annotations are part of a favor to a friend, who has found the need to set up and run [ColabFold](https://github.com/sokrypton/ColabFold) for some investigative digging into something she's working on.\n\nWhile I know next-to-nothing about biology, I know *just* enough about machine learning models to get a branch of the project, [localcolabfold](https://github.com/YoshitakaMo/localcolabfold?tab=readme-ov-file), running on my [[tags/projects/homelab|homelab server]] to generate an initial proof-of-concept.\n\nA good second step to using a new piece of software (after, of course, actually getting it to run) is to make sure you're using it right. While reading a single paper is no substitute for actual training, or a Ph.D. in computational biology, I'd like to at least be able to semi-accurately convey good practices for driving AlphaFold (as well as other related models), to make sure she gets the information she needs to carry out a thorough investigation.","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":0,"end":52},{"type":"TextQuoteSelector","exact":"ColabFold - Making protein folding accessible to all","prefix":"th50%75%100%125%150%200%300%400%","suffix":"Milot Mirdita,1, ∗Sergey Ovchinn"}]}],"created":"2026-02-26T06:44:35.236Z","updated":"2026-02-26T06:44:35.236Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}
>```
>%%
>*%%PREFIX%%th50%75%100%125%150%200%300%400%%%HIGHLIGHT%% ==ColabFold - Making protein folding accessible to all== %%POSTFIX%%Milot Mirdita,1, ∗Sergey Ovchinn*
>%%LINK%%[[#^6cjkwc9toov|show annotation]]
>%%COMMENT%%
>> [!NOTE]
>>
>> Some of these annotations may reference the [pre-print version of this paper](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf)
>
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
>{"text":"> [!NOTE]\n> this annotation is referencing an extended figure available in the [pre-print version](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf))\n\n\n> [!QUOTE]\n>\n> ![[/assets/Pasted Image 20260228121023.png]]\n> ![[/assets/Pasted Image 20260228121036.png]]\n>\n\nOh! Wait! Is this the flexibility setup?\n\nI'll need to confirm whether or not \"confidence\", here, means \"confidence in a correct result\" or \"confidence in the rigid result\". Realizing that the alignment error graphs from C are being back-applied to the structure predictions from B is, I think, actually what the flexibility setup might need. It makes intuitive sense that the... li'l tail on that sucker? would be the part that isn't part of the rigid structure of the protein, and so it could conceivably be at many different orientations off of the main protein body.","target":[{"source":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf","selector":[{"type":"TextPositionSelector","start":6367,"end":6524},{"type":"TextQuoteSelector","exact":"(C)To help researchers judge the predicted structure quality we visualize MSA depth and diversity and show the AlphaFold2confidence measures (pLDDT and PAE).","prefix":"lt) all five AlphaFold2 models.","suffix":"ing the profile generated by the"}]}],"created":"2026-02-27T16:15:13.753Z","updated":"2026-02-27T16:15:13.753Z","document":{"title":"ColabFold - Making protein folding accessible to all","link":[{"href":"urn:x-pdf:d2fa9c07d2c671e4e5250f9ba9cbe1c4"},{"href":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}],"documentFingerprint":"d2fa9c07d2c671e4e5250f9ba9cbe1c4"},"uri":"https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf"}
>```
>%%
>*%%PREFIX%%lt) all five AlphaFold2 models.%%HIGHLIGHT%% ==(C)To help researchers judge the predicted structure quality we visualize MSA depth and diversity and show the AlphaFold2confidence measures (pLDDT and PAE).== %%POSTFIX%%ing the profile generated by the*
>%%LINK%%[[#^yhwg0ov9idf|show annotation]]
>%%COMMENT%%
>> [!NOTE]
>> this annotation is referencing an extended figure available in the [pre-print version](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf))
>
>
>> [!QUOTE]
>>
>> ![[/assets/Pasted Image 20260228121023.png]]
>> ![[/assets/Pasted Image 20260228121036.png]]
>>
>
>Oh! Wait! Is this the flexibility setup?
>
>I'll need to confirm whether or not "confidence", here, means "confidence in a correct result" or "confidence in the rigid result". Realizing that the alignment error graphs from C are being back-applied to the structure predictions from B is, I think, actually what the flexibility setup might need. It makes intuitive sense that the... li'l tail on that sucker? would be the part that isn't part of the rigid structure of the protein, and so it could conceivably be at many different orientations off of the main protein body.
>%%TAGS%%
>
^yhwg0ov9idf



>%%
>```annotation-json
>{"created":"2026-02-28T19:22:12.491Z","text":"As an unqualified qualifier for context: [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold) is a machine learning model that is able to simulate how protein molecules curl up, or [fold](https://en.wikipedia.org/wiki/Protein_folding).\n\nThis is a notoriously hard problem to solve. Imagine one of those [magnetic bead toy sets](https://www.youtube.com/watch?v=9iNZmlUGzh4), where you can pull it apart to get a single-file chain of magnets. However, these magnets aren't all the exact same; instead, they all want to be at different angles, are different shapes, and have different magnetic fields. Your job is to take this random chain of magnets, toss it in the air, and figure out what shape it'll be before you catch it. That's a *simple* version of the protein folding problem.\n\nIn the spirit of friendly competition among nerds, the Critical Assessment of Structure Prediction ([CASP](https://en.wikipedia.org/wiki/CASP)) competition was established in 1994. The goal was simple — given a bunch of proteins whose folds have already been solved, who can use *only* computers to predict correct folds?\n\nThe CASP competition is basically an Olympic event for computational biologists, and has a massive impact on research for medical treatments and drug interactions. Experimentally determining folds for protein sequences is difficult work, so being able to even *vaguely estimate* protein folding would be a miracle.\n\nIn 2017, when I was a freshman computer science undergraduate, a (fairly young) professor said that he was hopeful, but not optimistic, that reliable computerized protein folding would be achieved in his lifetime — at that point, the best models were a far shot away from reliable, barely coming close to parity with experimental predictions.\n\nThen, in 2018 and 2020, AlphaFold absolutely swept the competition:\n\n> [!QUOTE]\n> \n> ![](https://www.researchgate.net/publication/376852829/figure/fig4/AS:11431281214608293@1703696537806/CASP-median-free-modelling-category-over-the-years-showing-the-best-model-GDT-score-7.png)\n> \n> —[Application of Artificial Intelligence in Biochemistry Research: A Review](https://www.researchgate.net/publication/376852829_Application_of_Artificial_Intelligence_in_Biochemistry_Research_A_Review)\n\nAnyway — I'll get on with it. AlphaFold (and its successors) are now open-source software, allowing anybody with a half-decent GPU to run it at home. The problem of protein folding still isn't *solved*, but the accuracy of modern models is still enough to be incredible for preliminary research, allowing researchers to find and follow promising investigative results. AlphaFold is probably a leading candidate for any list of 7 Wonders of the Modern World, and its creators [won the 2024 Nobel Prize in Chemistry](https://www.nobelprize.org/prizes/chemistry/2024/press-release/).","updated":"2026-02-28T19:22:12.491Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":1195,"end":1227},{"type":"TextQuoteSelector","exact":"  AlphaFold2  or  RoseTTAFold.  ","prefix":"ology  search  of  MMseqs2  with","suffix":"ColabFold’s  40−60-fold  faster "}]}]}
>```
>%%
>*%%PREFIX%%ology  search  of  MMseqs2  with%%HIGHLIGHT%% ==AlphaFold2  or  RoseTTAFold.== %%POSTFIX%%ColabFold’s  40−60-fold  faster*
>%%LINK%%[[#^5djih27xyla|show annotation]]
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
^5djih27xyla


>%%
>```annotation-json
>{"created":"2026-02-28T19:22:44.520Z","text":"I'll be honest — the [CASP website](https://predictioncenter.org/index.cgi) is... dense. I'm having trouble finding the CASP16 (2024) metrics, but it seems(?) like ColabFold actually did [come in first for the single-protein domain competition](https://predictioncenter.org/casp16/zscores_final.cgi). Congrats!\n\nMy understanding is that single-protein folding is now *nearly* solved, coming close to experimentally confirmed folding results. It seems that the next big thing is [predicting protein multimers](https://en.wikipedia.org/wiki/Protein_complex) — which, if I'm understanding right, is how multiple proteins fold together even if they're not chemically attached. Fret not! [CASP has a competition for that, too!](https://predictioncenter.org/casp16/zscores_multimer.cgi)\n\nWell — fret a little bit. The NIH under the Trump administration withheld funding for CASP17, scheduled for fall of this year. All part of the mission to make us great again?\n\nThankfully, [stopgap funding from close partners](https://www.statnews.com/2025/07/21/casp-new-funding-from-alphafold-developer-google-deepmind-after-nih-grant-runs-out/) seems to be keeping the competition afloat.","updated":"2026-02-28T19:22:44.520Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":2000,"end":2283},{"type":"TextQuoteSelector","exact":"lphaFold2  (ref.  1)  was  able  to  predict  the  3D  atomic  coordinates  of  folded  protein  structures  at  a  median  global  distance  test  total  score  (GDT_TS)  of  92.4%  in  the  latest  round  of  the  protein  folding  competition  by  the  international  community,  ","prefix":"s  for  end-to-end  training,  A","suffix":"CASP14  (Critical  Assessment  o"}]}]}
>```
>%%
>*%%PREFIX%%s  for  end-to-end  training,  A%%HIGHLIGHT%% ==lphaFold2  (ref.  1)  was  able  to  predict  the  3D  atomic  coordinates  of  folded  protein  structures  at  a  median  global  distance  test  total  score  (GDT_TS)  of  92.4%  in  the  latest  round  of  the  protein  folding  competition  by  the  international  community,== %%POSTFIX%%CASP14  (Critical  Assessment  o*
>%%LINK%%[[#^9txn6odty8|show annotation]]
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
^9txn6odty8


>%%
>```annotation-json
>{"created":"2026-02-28T19:24:01.448Z","text":"Ah, this is the good stuff — in the proof-of-concept, I wasn't quite sure what any of these visualizations represented. I did appreciate how pretty they were, though.","updated":"2026-02-28T19:24:01.448Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":13312,"end":13357},{"type":"TextQuoteSelector","exact":"Fig. 1 | Schematic diagram of ColabFold. a,b,","prefix":"el 1Model 2Model 3Model 4Model 5","suffix":" ColabFold has a web and a comma"}]}]}
>```
>%%
>*%%PREFIX%%el 1Model 2Model 3Model 4Model 5%%HIGHLIGHT%% ==Fig. 1 | Schematic diagram of ColabFold. a,b,== %%POSTFIX%%ColabFold has a web and a comma*
>%%LINK%%[[#^wbgdzlqm9dm|show annotation]]
>%%COMMENT%%
>Ah, this is the good stuff — in the proof-of-concept, I wasn't quite sure what any of these visualizations represented. I did appreciate how pretty they were, though.
>%%TAGS%%
>
^wbgdzlqm9dm


>%%
>```annotation-json
>{"created":"2026-02-28T19:24:51.289Z","text":"Okay — whoever coined \"amber force fields\" as an actual scientific parameter should get the Nobel Prize for Coolest Term.\n\nHowever, this does bring up precisely *why* I'm taking a look at this paper. As neat as machine learning models, they aren't plug-and-play. Transformer-based models are built on **weights** — the values of connections within the model itself. These are not directly customizable.\n\nHowever, that isn't to say these models *aren't* customizable. All models are. We call these customizations [hyperparameters](https://en.wikipedia.org/wiki/Hyperparameter_(machine_learning)), and they're effectively how somebody using the model can properly drive it.\n\nIn the context of the investigation I'm trying to assist, these are *very* important. This paragraph seems to go over them with a light touch, so more digging may be necessary. Their values aren't necessarily *opinion*, but they are part of the experimental design and should be both understood during the investigation, and published as part of any results.","updated":"2026-02-28T19:24:51.289Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":24010,"end":24028},{"type":"TextQuoteSelector","exact":"mber force fields2","prefix":"the predicted structures using a","suffix":"5, and prediction of complexes. "}]}]}
>```
>%%
>*%%PREFIX%%the predicted structures using a%%HIGHLIGHT%% ==mber force fields2== %%POSTFIX%%5, and prediction of complexes.*
>%%LINK%%[[#^x0t3kjpzd3a|show annotation]]
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
^x0t3kjpzd3a


>%%
>```annotation-json
>{"created":"2026-02-28T19:25:28.824Z","text":"I did see this parameter floating around — while I think there is some reason to adjust these, the values may be more limited by the available RAM on my workstation than hard scientific rationale.","updated":"2026-02-28T19:25:28.824Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":39829,"end":39895},{"type":"TextQuoteSelector","exact":"MSA to a maximum of 512 cluster centers and 1,024 extra sequences.","prefix":"l configuration, subsamples the ","suffix":" Changing the random seed can re"}]}]}
>```
>%%
>*%%PREFIX%%l configuration, subsamples the%%HIGHLIGHT%% ==MSA to a maximum of 512 cluster centers and 1,024 extra sequences.== %%POSTFIX%%Changing the random seed can re*
>%%LINK%%[[#^mpofvsz2q9n|show annotation]]
>%%COMMENT%%
>I did see this parameter floating around — while I think there is some reason to adjust these, the values may be more limited by the available RAM on my workstation than hard scientific rationale.
>%%TAGS%%
>
^mpofvsz2q9n


>%%
>```annotation-json
>{"created":"2026-02-28T19:27:28.388Z","text":"This is the tricky part about the `localcolabfold` library — it exposes these parameters for \"advanced users,\" which is why it's important to understand what's going on, here.","updated":"2026-02-28T19:27:28.388Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":24072,"end":24112},{"type":"TextQuoteSelector","exact":"AlphaFold2_advanced, for advanced users,","prefix":"ction of complexes. The second, ","suffix":" additionally supports MSA gener"}]}]}
>```
>%%
>*%%PREFIX%%ction of complexes. The second,%%HIGHLIGHT%% ==AlphaFold2_advanced, for advanced users,== %%POSTFIX%%additionally supports MSA gener*
>%%LINK%%[[#^uyv51i5giyh|show annotation]]
>%%COMMENT%%
>This is the tricky part about the `localcolabfold` library — it exposes these parameters for "advanced users," which is why it's important to understand what's going on, here.
>%%TAGS%%
>
^uyv51i5giyh


>%%
>```annotation-json
>{"created":"2026-02-28T19:27:52.074Z","text":"My homelab server is beefy, but not half-a-terabyte-of-RAM beefy.","updated":"2026-02-28T19:27:52.074Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":30475,"end":30568},{"type":"TextQuoteSelector","exact":"that both databases together would have required ~517 GB RAM for headers and sequences alone.","prefix":"databases BFD and MGnify, given ","suffix":"BFD is a clustered protein datab"}]}]}
>```
>%%
>*%%PREFIX%%databases BFD and MGnify, given%%HIGHLIGHT%% ==that both databases together would have required ~517 GB RAM for headers and sequences alone.== %%POSTFIX%%BFD is a clustered protein datab*
>%%LINK%%[[#^3l3gr9g5ulu|show annotation]]
>%%COMMENT%%
>My homelab server is beefy, but not half-a-terabyte-of-RAM beefy.
>%%TAGS%%
>
^3l3gr9g5ulu


>%%
>```annotation-json
>{"created":"2026-02-28T19:28:21.742Z","text":"After looking at the source code for `localcolabfold`, I was *thoroughly* impressed by how well-optimized it was. The onboarding was a bit tricky if somebody didn't have a real UNIX-y background, but onboarding is realistically the hardest part of any project, and the most impossible to test.","updated":"2026-02-28T19:28:21.742Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":37287,"end":37670},{"type":"TextQuoteSelector","exact":"his saves 7 min of compile time. When templates are enabled, model 1 is compiled and weights from model 2 are used, model 3 is compiled and weights from models 4 and 5 are used. This saves 5 min of compile time. If the user changes the sequence or settings without changing the length or number of sequences in the MSA, the compiled models are reused without triggering recompilation","prefix":" the configuration of model 5. T","suffix":".Avoid recompiling during batch "}]}]}
>```
>%%
>*%%PREFIX%%the configuration of model 5. T%%HIGHLIGHT%% ==his saves 7 min of compile time. When templates are enabled, model 1 is compiled and weights from model 2 are used, model 3 is compiled and weights from models 4 and 5 are used. This saves 5 min of compile time. If the user changes the sequence or settings without changing the length or number of sequences in the MSA, the compiled models are reused without triggering recompilation== %%POSTFIX%%.Avoid recompiling during batch*
>%%LINK%%[[#^ztz5rbwu1ho|show annotation]]
>%%COMMENT%%
>After looking at the source code for `localcolabfold`, I was *thoroughly* impressed by how well-optimized it was. The onboarding was a bit tricky if somebody didn't have a real UNIX-y background, but onboarding is realistically the hardest part of any project, and the most impossible to test.
>%%TAGS%%
>
^ztz5rbwu1ho


>%%
>```annotation-json
>{"created":"2026-02-28T19:28:57.502Z","text":"I don't *think* that this will come up, but I know that there's... something in here about a more complex/intensive run generating key-value pairs for additional analysis, especially in active areas of the folded protein — keeping an eye out for that, because it seems relevant.","updated":"2026-02-28T19:28:57.502Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":40419,"end":40734},{"type":"TextQuoteSelector","exact":"Custom MSAs. ColabFold enables researchers to upload their own MSAs. Any kind of alignment tool can be used to generate the MSA. The uploaded MSA can be provided in aligned FASTA, A3M, STOCKHOLM or Clustal format. We convert the respective MSA format into A3M format using the reformat.pl script from the HH-suite8.","prefix":"rts of the structure prediction.","suffix":"Lightweight 2D structure rendere"}]}]}
>```
>%%
>*%%PREFIX%%rts of the structure prediction.%%HIGHLIGHT%% ==Custom MSAs. ColabFold enables researchers to upload their own MSAs. Any kind of alignment tool can be used to generate the MSA. The uploaded MSA can be provided in aligned FASTA, A3M, STOCKHOLM or Clustal format. We convert the respective MSA format into A3M format using the reformat.pl script from the HH-suite8.== %%POSTFIX%%Lightweight 2D structure rendere*
>%%LINK%%[[#^v7a5scpm4cn|show annotation]]
>%%COMMENT%%
>I don't *think* that this will come up, but I know that there's... something in here about a more complex/intensive run generating key-value pairs for additional analysis, especially in active areas of the folded protein — keeping an eye out for that, because it seems relevant.
>%%TAGS%%
>
^v7a5scpm4cn


>%%
>```annotation-json
>{"created":"2026-02-28T19:29:23.826Z","text":"Ah, okay — so there *is* a short-circuit in place when the result has converged. This is a good one to get confirmation of, as there's quite a bit of iteration in the standard run — while a single run recycles, it also runs through multiple models (and, if you want to, multiple seeds on each model). This is the difference between *convergence* (one model seems to have honed in on a consistent result) and *consensus* (multiple models have returned similar final results).\n\nInterestingly, non-consensus is not a dealbreaker, and can actually be valuable information. Off the top of my head, a specific case of non-consensus as valuable data is to suss out which parts of the fold are flexible, and which are rigid. As I understand it, it's like how those floppy blow-up mannequins in car dealerships can flop around.","updated":"2026-02-28T19:29:23.826Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":38370,"end":38918},{"type":"TextQuoteSelector","exact":"Recycle count. AlphaFold2 improves the predicted protein structure by recycling (by default) three times, meaning that the prediction is fed multiple times through the model. We exposed the recycle count as a customizable parameter given that additional recycles can often improve a model (Supplementary Fig. 6) at the cost of a longer run time. We also implemented an option to specify a tolerance threshold to stop early. For some designed proteins without known homologous sequences, this helped to fold the final protein (Supplementary Fig. 5).","prefix":"rge speed-up for short proteins.","suffix":"Speed-up of predictions through "}]}]}
>```
>%%
>*%%PREFIX%%rge speed-up for short proteins.%%HIGHLIGHT%% ==Recycle count. AlphaFold2 improves the predicted protein structure by recycling (by default) three times, meaning that the prediction is fed multiple times through the model. We exposed the recycle count as a customizable parameter given that additional recycles can often improve a model (Supplementary Fig. 6) at the cost of a longer run time. We also implemented an option to specify a tolerance threshold to stop early. For some designed proteins without known homologous sequences, this helped to fold the final protein (Supplementary Fig. 5).== %%POSTFIX%%Speed-up of predictions through*
>%%LINK%%[[#^apw43gtzb2m|show annotation]]
>%%COMMENT%%
>Ah, okay — so there *is* a short-circuit in place when the result has converged. This is a good one to get confirmation of, as there's quite a bit of iteration in the standard run — while a single run recycles, it also runs through multiple models (and, if you want to, multiple seeds on each model). This is the difference between *convergence* (one model seems to have honed in on a consistent result) and *consensus* (multiple models have returned similar final results).
>
>Interestingly, non-consensus is not a dealbreaker, and can actually be valuable information. Off the top of my head, a specific case of non-consensus as valuable data is to suss out which parts of the fold are flexible, and which are rigid. As I understand it, it's like how those floppy blow-up mannequins in car dealerships can flop around.
>%%TAGS%%
>
^apw43gtzb2m


>%%
>```annotation-json
>{"created":"2026-02-28T19:41:12.861Z","text":"Okay — so there are material differences in the data. The shape is roughly the same, and the local run is *probably* good enough for preliminary investigation, but any more intense runs will probably require more than my 2x3060 could handle. The current homelab runs are a hair above \"just fuckin' around.\"","updated":"2026-02-28T19:41:12.861Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":19108,"end":19175},{"type":"TextQuoteSelector","exact":"Fig. 2 | Comparison of predictions for single chains and complexes.","prefix":"lphaFold2 reduced_dbs (sampled)d","suffix":" a, Structure prediction compari"}]}]}
>```
>%%
>*%%PREFIX%%lphaFold2 reduced_dbs (sampled)d%%HIGHLIGHT%% ==Fig. 2 | Comparison of predictions for single chains and complexes.== %%POSTFIX%%a, Structure prediction compari*
>%%LINK%%[[#^v5qkvdhmy9s|show annotation]]
>%%COMMENT%%
>Okay — so there are material differences in the data. The shape is roughly the same, and the local run is *probably* good enough for preliminary investigation, but any more intense runs will probably require more than my 2x3060 could handle. The current homelab runs are a hair above "just fuckin' around."
>%%TAGS%%
>
^v5qkvdhmy9s


>%%
>```annotation-json
>{"created":"2026-02-28T19:41:57.705Z","text":"You know — I'm usually used to papers like this floating GPUs like the Nvidia H100, which is about $35,000 retail. However, I'm pleasantly surprised by the cards they put forward, here: the V100 32GB seems to be around $700 right now, and the K40 is, like, $150.\n\nLooking a bit closer, my homelab machine may be a bit stronger than their base AlphaFold2. However, it did still barely break 60FPS on Borderlands 4, which is the real benchmark — right?\n\nAs a sanity check, the target they mention running on the stronger machine is [T1061](https://predictioncenter.org/casp14/target.cgi?id=65&view=all), from CASP14. At 949... residues? amino acids? I doubt anything we're up to would break that cap.","updated":"2026-02-28T19:41:57.705Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":43725,"end":44059},{"type":"TextQuoteSelector","exact":"All ColabFold and AlphaFold2 model inference run-time measurements were done on systems with 2 × 16 core Intel Gold 6242 CPUs with 192 GB RAM and 4x Nvidia Quadro RTX5000 GPUs. Only one GPU was used in each run.ColabFold-RoseTTAFold-BFD/MGnify and ColabFold-AlphaFold2-BFD/MGnify used the same MSAs, and run times are shown only once.","prefix":" HHblits to access one CPU core.","suffix":"AlphaFold-Colab was executed in "}]}]}
>```
>%%
>*%%PREFIX%%HHblits to access one CPU core.%%HIGHLIGHT%% ==All ColabFold and AlphaFold2 model inference run-time measurements were done on systems with 2 × 16 core Intel Gold 6242 CPUs with 192 GB RAM and 4x Nvidia Quadro RTX5000 GPUs. Only one GPU was used in each run.ColabFold-RoseTTAFold-BFD/MGnify and ColabFold-AlphaFold2-BFD/MGnify used the same MSAs, and run times are shown only once.== %%POSTFIX%%AlphaFold-Colab was executed in*
>%%LINK%%[[#^4mjy2nqoee9|show annotation]]
>%%COMMENT%%
>You know — I'm usually used to papers like this floating GPUs like the Nvidia H100, which is about $35,000 retail. However, I'm pleasantly surprised by the cards they put forward, here: the V100 32GB seems to be around $700 right now, and the K40 is, like, $150.
>
>Looking a bit closer, my homelab machine may be a bit stronger than their base AlphaFold2. However, it did still barely break 60FPS on Borderlands 4, which is the real benchmark — right?
>
>As a sanity check, the target they mention running on the stronger machine is [T1061](https://predictioncenter.org/casp14/target.cgi?id=65&view=all), from CASP14. At 949... residues? amino acids? I doubt anything we're up to would break that cap.
>%%TAGS%%
>
^4mjy2nqoee9


>%%
>```annotation-json
>{"created":"2026-02-28T19:42:21.854Z","text":"While I was hoping for a bit more information on how best to read the output graphs, and how best to tune the hyperparameters of the model to try and actually answer the investigatory questions, I think this was a good contextual primer for ColabFold, and a nice opportunity to gush about the nerds out there competing in the world's strangest, but possibly most beneficial, sport. Why curl when you can fold?","updated":"2026-02-28T19:42:21.854Z","document":{"title":"ColabFold: making protein folding accessible to all","link":[{"href":"urn:x-pdf:b0d95d316e03bf4cbca8a70942f0ab6a"},{"href":"https://www.nature.com/articles/s41592-022-01488-1.pdf"}],"documentFingerprint":"b0d95d316e03bf4cbca8a70942f0ab6a"},"uri":"https://www.nature.com/articles/s41592-022-01488-1.pdf","target":[{"source":"https://www.nature.com/articles/s41592-022-01488-1.pdf","selector":[{"type":"TextPositionSelector","start":50418,"end":50434},{"type":"TextQuoteSelector","exact":"acknowledgements","prefix":". PLoS  One 11, e0161879 (2016).","suffix":"The authors thank J. Söding for "}]}]}
>```
>%%
>*%%PREFIX%%. PLoS  One 11, e0161879 (2016).%%HIGHLIGHT%% ==acknowledgements== %%POSTFIX%%The authors thank J. Söding for*
>%%LINK%%[[#^axgjn9vorub|show annotation]]
>%%COMMENT%%
>While I was hoping for a bit more information on how best to read the output graphs, and how best to tune the hyperparameters of the model to try and actually answer the investigatory questions, I think this was a good contextual primer for ColabFold, and a nice opportunity to gush about the nerds out there competing in the world's strangest, but possibly most beneficial, sport. Why curl when you can fold?
>%%TAGS%%
>
^axgjn9vorub
