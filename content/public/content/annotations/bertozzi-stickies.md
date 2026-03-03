---
title: Design of a mucin-selective protease for targeted degradation of cancer-associated mucins
date: 2026-02-28
tags:
  - engineering/bio
  - engineering/data
  - engineering/languages/python
  - writing/annotations
annotation-target: https://www.nature.com/articles/s41587-023-01840-6.pdf
description: The rubber hits the road on ColabFold! I hope that's rubber I'm smelling — although it may be the computer. A replication attempt of a protein fold figure in K. Pedram et al (2023).
---


>%%
>```annotation-json
>{"text":"Y'all are about to see me do my best, again. This is a knock-on from the [[/annotations/protein-folding-for-fun|ColabFold annotations]] with a specific instance of ColabFold that somebody pointed me to. The same disclaimer applies — I'm not a computational biologist! This is due diligence, simply to make sure I'm understanding [ColabFold](https://github.com/YoshitakaMo/localcolabfold?tab=readme-ov-file) the best I can while using it.","target":[{"source":"https://www.nature.com/articles/s41587-023-01840-6.pdf","selector":[{"type":"TextPositionSelector","start":128,"end":217},{"type":"TextQuoteSelector","exact":"Design of a mucin-selective protease for targeted degradation of cancer-associated mucins","prefix":"0.1038/s41587-023-01840-6Article","suffix":"Kayvon Pedram    1,11,15, D. Jud"}]}],"created":"2026-02-28T19:52:48.838Z","updated":"2026-02-28T19:52:48.838Z","document":{"title":"Design of a mucin-selective protease for targeted degradation of cancer-associated mucins","link":[{"href":"urn:x-pdf:05688d5cb251214f88ff40cb330bdcef"},{"href":"https://www.nature.com/articles/s41587-023-01840-6.pdf"}],"documentFingerprint":"05688d5cb251214f88ff40cb330bdcef"},"uri":"https://www.nature.com/articles/s41587-023-01840-6.pdf"}
>```
>%%
>*%%PREFIX%%0.1038/s41587-023-01840-6Article%%HIGHLIGHT%% ==Design of a mucin-selective protease for targeted degradation of cancer-associated mucins== %%POSTFIX%%Kayvon Pedram    1,11,15, D. Jud*
>%%LINK%%[[#^ptnsd781qa|show annotation]]
>%%COMMENT%%
>Y'all are about to see me do my best, again. This is a knock-on from the [[/annotations/protein-folding-for-fun|ColabFold annotations]] with a specific instance of ColabFold that somebody pointed me to. The same disclaimer applies — I'm not a computational biologist! This is due diligence, simply to make sure I'm understanding [ColabFold](https://github.com/YoshitakaMo/localcolabfold?tab=readme-ov-file) the best I can while using it.
>%%TAGS%%
>
^ptnsd781qa


>%%
>```annotation-json
>{"text":"Some context — Dr. Bertozzi was one of the the [2022 Nobel Laureates in Chemistry](https://www.nobelprize.org/prizes/chemistry/2022/bertozzi/facts/) for her contributions to developing [click](https://en.wikipedia.org/wiki/Click_chemistry) and [bioorthogonal](https://en.wikipedia.org/wiki/Bioorthogonal_chemistry) chemistries.\n\n> [!UPDATE]\n> My partner did review my annotations on this paper, and the previous explanation of click chemistry comically missed the mark. \"Comically\" isn't a hyperbole — she literally laughed in my face.\n> \n> I've removed the original elaboration on click chemistry from the live site. Although this paper does have Bertozzi as the most senior author, it has nothing to do with click chemistry. Oops!","target":[{"source":"https://www.nature.com/articles/s41587-023-01840-6.pdf","selector":[{"type":"TextPositionSelector","start":622,"end":644},{"type":"TextQuoteSelector","exact":" Carolyn R. Bertozzi  ","prefix":"Weaver    4,9, Heinz Läubli2,3 &","suffix":"1,10  Targeted protein degrada"}]}],"created":"2026-02-28T19:55:01.027Z","updated":"2026-02-28T19:55:01.027Z","document":{"title":"Design of a mucin-selective protease for targeted degradation of cancer-associated mucins","link":[{"href":"urn:x-pdf:05688d5cb251214f88ff40cb330bdcef"},{"href":"https://www.nature.com/articles/s41587-023-01840-6.pdf"}],"documentFingerprint":"05688d5cb251214f88ff40cb330bdcef"},"uri":"https://www.nature.com/articles/s41587-023-01840-6.pdf"}
>```
>%%
>*%%PREFIX%%Weaver    4,9, Heinz Läubli2,3 &%%HIGHLIGHT%% ==Carolyn R. Bertozzi== %%POSTFIX%%1,10  Targeted protein degrada*
>%%LINK%%[[#^e48qxcfcrom|show annotation]]
>%%COMMENT%%
>Some context — Dr. Bertozzi was one of the the [2022 Nobel Laureates in Chemistry](https://www.nobelprize.org/prizes/chemistry/2022/bertozzi/facts/) for her contributions to developing [click](https://en.wikipedia.org/wiki/Click_chemistry) and [bioorthogonal](https://en.wikipedia.org/wiki/Bioorthogonal_chemistry) chemistries.
>
>> [!UPDATE]
>> My partner did review my annotations on this paper, and the previous explanation of click chemistry comically missed the mark. "Comically" isn't a hyperbole — she literally laughed in my face.
>> 
>> I've removed the original elaboration on click chemistry from the live site. Although this paper does have Bertozzi as the most senior author, it has nothing to do with click chemistry. Oops!
>%%TAGS%%
>
^e48qxcfcrom


>%%
>```annotation-json
>{"text":"This is where my interest piques, since I'd need to bug my partner for ELI5 explanations of any of the research up to this point.\n\nI'm here to know how exactly they used ColabFold for this particular problem domain. From the core ColabFold paper, there's quite a few [hyperparameters](https://en.wikipedia.org/wiki/Hyperparameter_(machine_learning)) that allow us to make sure the model best matches the environment it's seeking to emulate, as well as expose the relevant information for further study/replication/confirmation.\n\nIn a best-effort attempt to confirm this, I looked into the upstream paper referenced in the ColabFold method, where they are confirming the AlphaFold result with the [upstream Yu et al. paper](https://pubmed.ncbi.nlm.nih.gov/22483117/) investigating StcE specifically. The associated data for that paper references [3UJZ: Crystal Structure Of Enterohemorrhagic E. Coli Stce](https://www.ncbi.nlm.nih.gov/Structure/pdb/3UJZ), which — *I think* — is the experimentally-determined StcE structure. There's an [associated plaintext amino acid sequence](https://www.rcsb.org/fasta/entry/3UJZ/display) that we can pop into a `.fasta` file and feed to `localcolabfold` and... hopefully just get the same structure this paper got, but with the full ColabFold statistical report?\n\nComparing the outputs of our run versus this paper's run, then, we either **do**, or **don't** get the same structure:\n\n- If we **do** get the same structure, we can be fairly confident that this paper is also just using the default `localcolabfold` hyperparameters from their sample run, and have some comfort in continuing to use those hyperparameters in similar scenarios; or\n- If we **don't** get the same structure, we can assume they used different hyperparameters that aren't here, or in the supplementary materials, and we may need to reach out and ask what hyperparameters they used.\n\n---\n\nWell, it was audacious to expect a clear-cut answer here. After [using `localcolabfold` under sample hparams](https://github.com/chaoticgoodcomputing/chaoticgoodcomputing.github.io/blob/main/content/public/assets/3UJZ/README) to categorize the 3UJZ sequence, and coloring it to the same domain coloring map available at the [NIH 3UJZ source](https://www.ncbi.nlm.nih.gov/Structure/pdb/3UJZ), I'm getting... something vaguely similar. From the [Relaxed, Rank 1 PDB](content/public/assets/3UJZ/3UJZ_1_Chain_A_Metalloprotease_stcE_Escherichia_coli__83334__relaxed_rank_001_alphafold2_ptm_model_3_seed_000.pdb):\n\n![[/assets/Pasted image 20260228142647.png]]\n\nWe're about to get real fuzzy, here.\n\nThe Y shape demonstrated in the paper's results does seem to be present, although not *quite* as cleanly as the sample figure. Additionally, my assumption (with fingers crossed) was that the C and INS domains were in the 5 domains from the NIH source. I'm not sure this ended up being the case.\n\nAs a more quantitative source that we do have a hub-and-spoke with three offshoots, though, we can take a look at the error graph:\n\n![[/assets/Pasted image 20260228143701.png]]\n\nFrom my understanding on how to read this chart from the upstream [[/annotations/protein-folding-for-fun|ColabFold paper]] — specifically, the extended figure from the [bioarXiv pre-print](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf), areas that have low confidence per-model but high consensus *across* the models may correspond to generally flexible offshoots to the core rigid structure of the protein. If that's a correct understanding, those three uncertain regions would correspond to three offshoots, two of which are likely the C and INS domains mentioned.\n\nThe best conclusion I can take away, then, is that the ColabFold defaults are likely *good enough* for cursory glances, but would need to be better understood.\n\nMy secondary conclusion, though, is that AlphaFold is generally a precursory/investigatory garnish that can assist in an exploratory phase. We can see here that it was used for just a handful of figures, to visually highlight important information, but is (obviously) no substitute for experimental evidence. It's a pair of binoculars to look closer at where you're headed, not the thing that gets you there.","target":[{"source":"https://www.nature.com/articles/s41587-023-01840-6.pdf","selector":[{"type":"TextPositionSelector","start":25391,"end":25699},{"type":"TextQuoteSelector","exact":"Fig. 2 | Structure-guided engineering of StcE yields mutants of reduced activity, binding and size. a, Structure of StcE, as predicted by ColabFold (Methods)62, with the C domain (purple) and INS domain (blue) highlighted. The Zn2+ active site is depicted in orange, while mutated residues are shown in teal.","prefix":"cell death in both populations","suffix":"b, Digestion of IRDye 800CW-lab"}]}],"created":"2026-02-28T20:06:09.538Z","updated":"2026-02-28T20:06:09.538Z","document":{"title":"Design of a mucin-selective protease for targeted degradation of cancer-associated mucins","link":[{"href":"urn:x-pdf:05688d5cb251214f88ff40cb330bdcef"},{"href":"https://www.nature.com/articles/s41587-023-01840-6.pdf"}],"documentFingerprint":"05688d5cb251214f88ff40cb330bdcef"},"uri":"https://www.nature.com/articles/s41587-023-01840-6.pdf"}
>```
>%%
>*%%PREFIX%%cell death in both populations%%HIGHLIGHT%% ==Fig. 2 | Structure-guided engineering of StcE yields mutants of reduced activity, binding and size. a, Structure of StcE, as predicted by ColabFold (Methods)62, with the C domain (purple) and INS domain (blue) highlighted. The Zn2+ active site is depicted in orange, while mutated residues are shown in teal.== %%POSTFIX%%b, Digestion of IRDye 800CW-lab*
>%%LINK%%[[#^vhtmwrcrjds|show annotation]]
>%%COMMENT%%
>This is where my interest piques, since I'd need to bug my partner for ELI5 explanations of any of the research up to this point.
>
>I'm here to know how exactly they used ColabFold for this particular problem domain. From the core ColabFold paper, there's quite a few [hyperparameters](https://en.wikipedia.org/wiki/Hyperparameter_(machine_learning)) that allow us to make sure the model best matches the environment it's seeking to emulate, as well as expose the relevant information for further study/replication/confirmation.
>
>In a best-effort attempt to confirm this, I looked into the upstream paper referenced in the ColabFold method, where they are confirming the AlphaFold result with the [upstream Yu et al. paper](https://pubmed.ncbi.nlm.nih.gov/22483117/) investigating StcE specifically. The associated data for that paper references [3UJZ: Crystal Structure Of Enterohemorrhagic E. Coli Stce](https://www.ncbi.nlm.nih.gov/Structure/pdb/3UJZ), which — *I think* — is the experimentally-determined StcE structure. There's an [associated plaintext amino acid sequence](https://www.rcsb.org/fasta/entry/3UJZ/display) that we can pop into a `.fasta` file and feed to `localcolabfold` and... hopefully just get the same structure this paper got, but with the full ColabFold statistical report?
>
>Comparing the outputs of our run versus this paper's run, then, we either **do**, or **don't** get the same structure:
>
>- If we **do** get the same structure, we can be fairly confident that this paper is also just using the default `localcolabfold` hyperparameters from their sample run, and have some comfort in continuing to use those hyperparameters in similar scenarios; or
>- If we **don't** get the same structure, we can assume they used different hyperparameters that aren't here, or in the supplementary materials, and we may need to reach out and ask what hyperparameters they used.
>
>---
>
>Well, it was audacious to expect a clear-cut answer here. After [using `localcolabfold` under sample hparams](https://github.com/chaoticgoodcomputing/chaoticgoodcomputing.github.io/blob/main/content/public/assets/3UJZ/README) to categorize the 3UJZ sequence, and coloring it to the same domain coloring map available at the [NIH 3UJZ source](https://www.ncbi.nlm.nih.gov/Structure/pdb/3UJZ), I'm getting... something vaguely similar. From the [Relaxed, Rank 1 PDB](content/public/assets/3UJZ/3UJZ_1_Chain_A_Metalloprotease_stcE_Escherichia_coli__83334__relaxed_rank_001_alphafold2_ptm_model_3_seed_000.pdb):
>
>![[/assets/Pasted image 20260228142647.png]]
>
>We're about to get real fuzzy, here.
>
>The Y shape demonstrated in the paper's results does seem to be present, although not *quite* as cleanly as the sample figure. Additionally, my assumption (with fingers crossed) was that the C and INS domains were in the 5 domains from the NIH source. I'm not sure this ended up being the case.
>
>As a more quantitative source that we do have a hub-and-spoke with three offshoots, though, we can take a look at the error graph:
>
>![[/assets/Pasted image 20260228143701.png]]
>
>From my understanding on how to read this chart from the upstream [[/annotations/protein-folding-for-fun|ColabFold paper]] — specifically, the extended figure from the [bioarXiv pre-print](https://www.biorxiv.org/content/10.1101/2021.08.15.456425v1.full.pdf), areas that have low confidence per-model but high consensus *across* the models may correspond to generally flexible offshoots to the core rigid structure of the protein. If that's a correct understanding, those three uncertain regions would correspond to three offshoots, two of which are likely the C and INS domains mentioned.
>
>The best conclusion I can take away, then, is that the ColabFold defaults are likely *good enough* for cursory glances, but would need to be better understood.
>
>My secondary conclusion, though, is that AlphaFold is generally a precursory/investigatory garnish that can assist in an exploratory phase. We can see here that it was used for just a handful of figures, to visually highlight important information, but is (obviously) no substitute for experimental evidence. It's a pair of binoculars to look closer at where you're headed, not the thing that gets you there.
>%%TAGS%%
>
^vhtmwrcrjds





>%%
>```annotation-json
>{"created":"2026-03-03T07:18:31.971Z","text":"(This annotation has nothing to do with 4d — I'm just placing it here for its proximity to figure 4a)\n\nAfter reviewing this annotation set with my partner, she did point me in the right direction (read: she actually read the upstream paper and told me exactly what I was missing. *Nerd.*)\n\nFrom up upstream paper, they do highlight domains differently than the NIH structural source does — the NIH source also has a beginning sequence, called the signal sequence (SS), chopped off of it (we think):\n\n> [!QUOTE]\n>\n> ![[/assets/Pasted image 20260302215331.png]]\n>\n> — [Structural Insight into the Bacterial Mucinase StcE Essential to Adhesion and Immune Evasion during Enterohemorrhagic E. coli Infection](https://www.cell.com/action/showPdf?pii=S0969-2126(12)00095-0)\n\nShe was very nice, and reconstructed the amino acid sequence based on the StcE DNA sequence. What we found is that the upstream NIH source is weird. From the beginning of that sequence:\n\n> [!QUOTE]\n> GSH**MAS**ADNNSA...\n>\n> —[3UJZ/StcE, NCBI](https://www.ncbi.nlm.nih.gov/Structure/pdb/3UJZ)\n\nParaphrasing her, the \"important\" part of the sequence starts after the `MAS` sequence. I asked her why this is the case, and she gave me a very long, well-researched answer. When I asked her to dumb it down for me, she said it's \"because of the way proteins are.\" I'll take her word for it.\n\nFor our purposes, we can trust that everything before (and including) MAS is the signal sequence, which this paper cut off prior to the fold. While I *didn't* do that, the preceding `GSHMAS` sequence probably won't effect the fold very much. However, it does let us know that we need to do some offset math when highlighting the domains in the same way Yu et al. does. We know that the sample we folded only cut off 29 of the 35 SS-domain amino acids, so we need to offset all of the highlights by 29.\n\nDoing that math, then, the two subsequences we need to highlight are:\n\n- **INS Domain:** [121, 216]\n- **C Domain:** [775, 869]\n\nUsing these domain sets gives us a FAR clearer picture than we had, before:\n\n![[/assets/Pasted image 20260302235555.png]]\n\n![[/assets/Pasted image 20260302235321.png]]\n\n(the extra red highlight is the `GSHMAS` erroneous part of the sequence that we were un-offsetting for — given that it's in a tail offshoot, I'm not too concerned about it affecting the rest of the fold.)\n\nThe differences in angles between the three loose domains against the core rigid body is expected — those were the sources of uncertainty on the graph above, which is still correct. However, this is confirmation that the C and INS domains are correctly confined to the spokes of the protein. I think that the second, rotated figure also gives a strong confirmation — the shape is close enough that, if I was the type of person qualified to guesstimate, I'd be able to loosely point out where the mutated residues and Zn^2+ active sites were, in a pseudo-academic pin-the-Zn^2+-active-sites-on-the-protein-donkey kind of way.\n\nI feel *far* more settled than before that the fold they did here *were* using the default ColabFold hyperparameters. I do wish they posted their output `config.json`, as that'd settle any speculation on the matter. However, my partner tipped me off to two academic courtesies:\n\n1. When you have questions on a paper, it is standard to email the *last* (most senior) author on the paper. That's why Bertozzi's name is the only one in the authorship line with an email icon next to it.\n2. I should *not*, under *any circumstance*, cold-email 2022 Nobel Laureate Dr. Carolyn R. Bertozzi asking for a `config.json` from three years ago.\n\nThis likely closes out the replication investigation. The default hyperparameters can give close enough results that, given we're dealing with a statistical model, I'd be willing to thumb it and say we're close enough. However, this is *not* a lock on extended data from ColabFold — which, if I understand correctly, is how things like active sites can be investigated from ColabFold output. Perhaps this is where it ends, perhaps not. It is, however, as far as I'm going to dig into this particular set of annotations.","updated":"2026-03-03T07:18:31.971Z","document":{"title":"Design of a mucin-selective protease for targeted degradation of cancer-associated mucins","link":[{"href":"urn:x-pdf:05688d5cb251214f88ff40cb330bdcef"},{"href":"https://www.nature.com/articles/s41587-023-01840-6.pdf"}],"documentFingerprint":"05688d5cb251214f88ff40cb330bdcef"},"uri":"https://www.nature.com/articles/s41587-023-01840-6.pdf","target":[{"source":"https://www.nature.com/articles/s41587-023-01840-6.pdf","selector":[{"type":"TextPositionSelector","start":25887,"end":26190},{"type":"TextQuoteSelector","exact":"d, Setup for flow cytometry assays measuring cell-surface activity and binding of StcE and StcE mutants. e, Representative flow plots showing surface MUC1 levels of HeLa cells treated with StcE mutants at the indicated concentrations. For flow plots of all other StcE mutants, see Supplementary Fig. 1d.","prefix":"(n = 4 independent digestions). ","suffix":" f, EC50 values derived from qua"}]}]}
>```
>%%
>*%%PREFIX%%(n = 4 independent digestions).%%HIGHLIGHT%% ==d, Setup for flow cytometry assays measuring cell-surface activity and binding of StcE and StcE mutants. e, Representative flow plots showing surface MUC1 levels of HeLa cells treated with StcE mutants at the indicated concentrations. For flow plots of all other StcE mutants, see Supplementary Fig. 1d.== %%POSTFIX%%f, EC50 values derived from qua*
>%%LINK%%[[#^z2rvt8kocg|show annotation]]
>%%COMMENT%%
>(This annotation has nothing to do with 4d — I'm just placing it here for its proximity to figure 4a)
>
>After reviewing this annotation set with my partner, she did point me in the right direction (read: she actually read the upstream paper and told me exactly what I was missing. *Nerd.*)
>
>From up upstream paper, they do highlight domains differently than the NIH structural source does — the NIH source also has a beginning sequence, called the signal sequence (SS), chopped off of it (we think):
>
>> [!QUOTE]
>>
>> ![[/assets/Pasted image 20260302215331.png]]
>>
>> — [Structural Insight into the Bacterial Mucinase StcE Essential to Adhesion and Immune Evasion during Enterohemorrhagic E. coli Infection](https://www.cell.com/action/showPdf?pii=S0969-2126(12)00095-0)
>
>She was very nice, and reconstructed the amino acid sequence based on the StcE DNA sequence. What we found is that the upstream NIH source is weird. From the beginning of that sequence:
>
>> [!QUOTE]
>> GSH**MAS**ADNNSA...
>>
>> —[3UJZ/StcE, NCBI](https://www.ncbi.nlm.nih.gov/Structure/pdb/3UJZ)
>
>Paraphrasing her, the "important" part of the sequence starts after the `MAS` sequence. I asked her why this is the case, and she gave me a very long, well-researched answer. When I asked her to dumb it down for me, she said it's "because of the way proteins are." I'll take her word for it.
>
>For our purposes, we can trust that everything before (and including) MAS is the signal sequence, which this paper cut off prior to the fold. While I *didn't* do that, the preceding `GSHMAS` sequence probably won't effect the fold very much. However, it does let us know that we need to do some offset math when highlighting the domains in the same way Yu et al. does. We know that the sample we folded only cut off 29 of the 35 SS-domain amino acids, so we need to offset all of the highlights by 29.
>
>Doing that math, then, the two subsequences we need to highlight are:
>
>- **INS Domain:** [121, 216]
>- **C Domain:** [775, 869]
>
>Using these domain sets gives us a FAR clearer picture than we had, before:
>
>![[/assets/Pasted image 20260302235555.png]]
>
>![[/assets/Pasted image 20260302235321.png]]
>
>(the extra red highlight is the `GSHMAS` erroneous part of the sequence that we were un-offsetting for — given that it's in a tail offshoot, I'm not too concerned about it affecting the rest of the fold.)
>
>The differences in angles between the three loose domains against the core rigid body is expected — those were the sources of uncertainty on the graph above, which is still correct. However, this is confirmation that the C and INS domains are correctly confined to the spokes of the protein. I think that the second, rotated figure also gives a strong confirmation — the shape is close enough that, if I was the type of person qualified to guesstimate, I'd be able to loosely point out where the mutated residues and Zn^2+ active sites were, in a pseudo-academic pin-the-Zn^2+-active-sites-on-the-protein-donkey kind of way.
>
>I feel *far* more settled than before that the fold they did here *were* using the default ColabFold hyperparameters. I do wish they posted their output `config.json`, as that'd settle any speculation on the matter. However, my partner tipped me off to two academic courtesies:
>
>1. When you have questions on a paper, it is standard to email the *last* (most senior) author on the paper. That's why Bertozzi's name is the only one in the authorship line with an email icon next to it.
>2. I should *not*, under *any circumstance*, cold-email 2022 Nobel Laureate Dr. Carolyn R. Bertozzi asking for a `config.json` from three years ago.
>
>This likely closes out the replication investigation. The default hyperparameters can give close enough results that, given we're dealing with a statistical model, I'd be willing to thumb it and say we're close enough. However, this is *not* a lock on extended data from ColabFold — which, if I understand correctly, is how things like active sites can be investigated from ColabFold output. Perhaps this is where it ends, perhaps not. It is, however, as far as I'm going to dig into this particular set of annotations.
>%%TAGS%%
>
^z2rvt8kocg
