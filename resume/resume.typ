#import "templates/resume.template.typ": *

#let HIDE_ADDITIONAL_ENTRIES = true

#show: resume.with(
  author: "Spencer Elkington",
  location: "Salt Lake City, UT",
  contacts: (
    [#link("https://blog.chaoticgood.computer")[Website]],
    [#link("https://github.com/spelkington")[GitHub]],
    [#link(
      "mailto:spelkington@gmail.com?subject=Regarding\%20a\%20potential\%20business\%20opportunity&body=Hi,\%20Spencer!",
    )[Email]],
    [#link("https://linkedin.com/in/spelkington")[LinkedIn]],
  ),
)

= Education
#edu(
  institution: "University of Utah",
  date: "Aug 2022",
  gpa: "",
  location: "Salt Lake City, UT",
  degrees: (
    ("Bachelors of Science", "Quantitative Analysis of Markets & Organizations"),
    ("Emphasis", "Business Economics, Matchmaking, Non-Market Environments"),
    ("Minor", "Computer Science"),
  ),
)

// = Skills
#skills((
  (
    "Expertise",
    (
      link("https://blog.chaoticgood.computer/tags/engineering")[Application Eng.],
      link("https://blog.chaoticgood.computer/tags/engineering/ai")[Agentic Systems],
      link("https://blog.chaoticgood.computer/tags/economics")[Economics],
      link("https://blog.chaoticgood.computer/tags/engineering/data")[Data Eng.],
      link("https://blog.chaoticgood.computer/tags/engineering/devops")[CI/CD],
      // [Consulting],
      // [Cost Control],
      // [Cloud Infrastructure],
      // [Data Consulting],
      // [Data Visualization],
      // [Education],
      // [Financial Analysis],
      // [Game Development],
      // [Professional Development],
      // [Recruiting],
      // [Software Development],
      // [Teaching],
      // [Technical Presentation],
      // [Technical Recruiting],
    ),
  ),
  (
    "Software",
    (
      [Github Actions],
      [NX],
      // [Terraform],
      [ASP.NET],
      [Apache Spark],
      [AWS (ECS/EC2, RDS)],
    ),
  ),
  (
    "Languages",
    (
      link("https://blog.chaoticgood.computer/tags/engineering/languages")[C\#],
      link("https://blog.chaoticgood.computer/tags/engineering/languages")[TypeScript],
      link("https://blog.chaoticgood.computer/tags/engineering/languages")[Python],
      // [SQL],
      // [Shell/Bash],
      // [Lua],
    ),
  ),
))

= Experience

#exp(
  role: link("https://constituentvoice.com/")[Developer Experience & Backend Software Engineer],
  project: link("https://constituentvoice.com/")[Constituent Voice],
  date: "March 2024 - Present",
  location: "Remote",
  summary: "Creating software & applications to connect voters to their representatives",
  details: [
    - Roll out LLM agent tooling in developer and deployment workflows for autonomous ticket resolution
    - Develop testing & CI/CD frameworks to minimize regression risk in *ASP.NET* and *React Native* apps
    - Orchestrate codebase consolidatifully on via *NX* to de-silo dev teams and inroduce end-to-end testing
  ],
)

#exp(
  role: link("https://constituentvoice.com/")[Backend Software Engineer],
  project: link("https://constituentvoice.com/")[Constituent Voice],
  date: "Jan 2023 - March 2024",
  details: [
    - Create *Terraform/AWS* deployment systems, reducing new AWS application spin-up times by >90%
    - Port legacy microservices to *ASP.NET/EFCore* to boost capacity of Congressional scheduling services
    - Lead & manage creation of unified *GitHub Projects* scheduling system to de-silo development work
  ],
)

#exp(
  role: link(
    "https://www.linkedin.com/posts/m-science-llc_how-m-science-uses-databricks-structured-activity-6953752015013363713-EOTN/",
  )[Software Engineer, DataOps],
  project: link("https://mscience.com")[M Science],
  date: "June 2022 - Feb 2023",
  // summary: "Generating higher investment alpha with alternative data-driven market insights",
  // location: "Remote",
  details: [
    - Lead implementation of *Spark/AWS* optimizations, resulting in \$1M+ annual compute cost reductions
    - Constructed optimized and durable ETL processes for #link("https://mscience.com/blogs")[cornerstone TMT/games reporting and analytics]
    - Planned & constructed unified DataOps & statistics libraries to streamline financial research operations
    // - Construct DataOps CI/CD pipelines for end-to-end *Python/SQL* ETL dev lifecycles
    // - Build & present *Tableau* dashboards for pipeline performance analytics & business cost insights
    // - Investigate & implement *AWS/Spark* Spark optimizations to reduce ETL job costs by as much as 90%
    // - Create infrastructure profiling frameworks to assess AWS compute cost inefficiency & design solutions
    // - Recruit & train new Analysts, Engineers & Project Managers to grow site engineering team by ~85%
    // - Write & document training material to refine analyst skills in pipeline development & technical stack
    // - Develop fast & scalable *Python/Spark* ETL pipelines for large-scale economic data sources
    // - Fine-tune parameters for mission-critical economic data categorization pipelines
    // - Build & present *Tableau* dashboards to convey health of pipeline KPI metrics
  ],
)

#hide(
  HIDE_ADDITIONAL_ENTRIES,
  exp(
    role: link("https://wasatchglobal.com/")[Quant Research Intern],
    project: link("https://wasatchglobal.com/")[Wasatch Global Investors, \$31B AUM],
    date: "Jan 2020 - May 2021",
    // summary: "Management & curation of high-performance & long-focus investment portfolios",
    // location: "Salt Lake City, UT",
    details: [
      - Researched portfolio allocation models to fine-tune strategies across themed investment portfolios
      - Developed *Python/SQL* pipeline infrastructure to automate and backtest financial data analyses
      - Designed *Tableau* dashboards to monitor portfolio health & risk throughout pandemic markets
    ],
  ),
)

#hide(
  HIDE_ADDITIONAL_ENTRIES,
  exp(
    role: link("https://slateci.io")[Networking Research Intern],
    project: link("https://slateci.io")[UofU Center for High-Performance Computing],
    date: "Mar 2019 - Jan 2020",
    summary: "Research & development of next-gen network & distributed computing technologies",
    location: "Salt Lake City, UT",
    details: [
      - Developed a *Kubernetes/Docker* platform to simplify at-scale distributed scientific app deployments
      - Constructed & wrote project documentation site in *React.js* to polish appearance for NSF grants
      - Researched the use of *Foreman* build/deploy systems to remotely structure new server cluster pools
    ],
  ),
)

#hide(
  HIDE_ADDITIONAL_ENTRIES,
  exp(
    role: link("https://www.mathnasium.com/math-centers/bountiful/")[Center Director & Math Teacher],
    project: link("https://www.mathnasium.com/math-centers/bountiful/")[Mathnasium],
    date: "Apr 2018 - Dec 2018",
    summary: "Inspiring new generations to enjoy & understand the world of mathematics",
    location: "Salt Lake City, UT",
    details: [
      - Directed the strategy and operations of an all-ages math tutoring center with 80+ enrolled students
      - Led a team of a 12+ math instructors & worked to develop instructors' presentation & teaching skills
      - Analyzed student assessment and progression data to curate & teach individualized learning plans
      - Taught K-12 core and supplemental curriculum to students across varying skill levels and backgrounds
      - Developed creative and intuitive teaching methods to cover a range of students learning methods
    ],
  ),
)

#hide(
  HIDE_ADDITIONAL_ENTRIES,
  exp(
    role: link("https://www.cs.utah.edu/~dejohnso/GREAT/")[Programming Instructor],
    project: link("https://www.cs.utah.edu/~dejohnso/GREAT/")[University of Utah],
    date: "May 2019 - July 2018",
    summary: "Introducing students to beginner & advanced programming concepts",
    location: "Salt Lake City, UT",
    details: [
      - Collaborated with a small team to design and teach a two-month computer programming curriculum
      - Implemented data structures/algorithms, such as recursive sorts and Voronoi partitioning, in *Scratch*
    ],
  ),
)

= Projects

#exp(
  role: link(
    "https://blog.chaoticgood.computer/tags/projects/flowthru",
  )[Flowthru: Type-Safe ETL Framework for .NET],
  project: link(
    "https://blog.chaoticgood.computing",
  )[CGC],
  date: "Oct 2025 - Present",
  details: [
    - Architected a data engineering framework for compile-time, type-safe ETL pipelines in *C\#/.NET*
    - Exercised API surface-first design philosophy for intuitive developer onboarding & reliable agentic usage
    - Designed *NUnit* extended testing capability for code coverage from end-to-end, real-world pipeline cases
  ],
)

#exp(
  role: link(
    "https://blog.chaoticgood.computer/tags/projects/games/magic-atlas",
  )[MagicAtlas: Analytics, APIs, and Query Languages for MTG],
  project: link(
    "https://blog.chaoticgood.computing",
  )[CGC],
  date: "Oct 2025 - Present",
  details: [
    - Designed an analytics suite for rules and card analysis of Magic: The Gathering rules and game data
    - Created a custom *NUnit* #link("https://blog.chaoticgood.computer/content/notes/scratch/ratcheted-testing")[ratcheted testing framework] for scalable test case creation
  ],
)

#hide(
  HIDE_ADDITIONAL_ENTRIES,
  exp(
    role: link("https://blog.chaoticgood.computer/")[Founder & Lead Engineer],
    project: link("https://blog.chaoticgood.computer/")[Chaotic Good Computing],
    date: "May 2023 - Present",
    location: "SLC, UT | Remote",
    summary: "Consulting, development & education services focusing on digital economies & data",
    details: [
      - Consult on data security and consumer data privacy compliance best practices for small dev teams
      - Consult on best practices for analyzing, monitoring & maintaining complex digital economies
      - Lead a team of two engineers and two asset designers on creating #link("https://create.roblox.com/")[Roblox] experiences in *TypeScript*
      - Provide professional development opportunities for early-career and student developers
    ],
  ),
)

#exp(
  role: link(
    "https://databricks.com/blog/2022/07/14/using-spark-structured-streaming-to-scale-your-analytics.html",
  )[Using Spark Structured Streaming to Scale Your Analytics],
  project: link(
    "https://databricks.com/blog/2022/07/14/using-spark-structured-streaming-to-scale-your-analytics.html",
  )[Databricks],
  date: "June 2022",
  details: [
    - Guest-authored engineering blog post about *Spark* Streaming-based ETL process cost optimizations
    - Design introductory tutorials and reference for both business- and developer-focused audiences
  ],
)

#exp(
  role: link(
    "https://github.com/UtahTriangle/pointypal#pointypal-zoom-school-done-better",
  )[PointyPal: A Better Campus During Quarantine],
  project: link("https://github.com/UtahTriangle/pointypal#pointypal-zoom-school-done-better")[Triangle Engineering],
  date: "Aug 2020 - Dec 2021",
  details: [
    - Built a class management wrapper for Discord to assist students with online learning during COVID-19
    - Created and moderated a 600-student online campus, opening source for deployment across 4 universities
    - Conducted A/B testing to polish user experiences, resulting in peak growth rates of 100 users/mo
  ],
)

#hide(
  HIDE_ADDITIONAL_ENTRIES,
  exp(
    role: link(
      "https://www.linkedin.com/feed/update/urn:li:activity:6603722406240628736/",
    )[MISI: Musical Instrument Semantic Interface],
    project: link("https://www.linkedin.com/feed/update/urn:li:activity:6603722406240628736/")[Triangle Engineering],
    date: "Aug 2018 - Nov 2020",
    details: [
      - Created *C++* and *Python* systems for real-time music data analysis and visualizations
      - Designed real-time semantic musical mood categorization of music based on chord progression analyses
      - Created a novel implementation of low-latency beat signal detection via circular buffers in *C++*
    ],
  ),
)

#hide(
  HIDE_ADDITIONAL_ENTRIES,
  exp(
    role: link("https://devpost.com/software/beethoven-t9ud86")[Beethoven: Remote Audio Transcription],
    project: link("https://devpost.com/software/beethoven-t9ud86")[HackTheU 2019, 2nd Place out of 30 teams],
    date: "Aug 2019",
    details: [
      - Designed a closed captioning and audio transcription service for deaf and hard-of-hearing students
      - Built a peer-to-peer text & audio streaming *TypeScript* application stack using *Node.js & React*
    ],
  ),
)
