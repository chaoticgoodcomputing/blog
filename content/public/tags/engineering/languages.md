---
title: "#languages"
---
I'm certainly not a person who has [[public/content/notes/strong-and-weak-opinions|strong opinions]] about programming languages. My personal and professional decision graph around language choice is:

```mermaid
flowchart TD
    A[What language<br/>are you most familiar with?] --> B{Will it get<br/>the job done?}
    B -->|Yes| C[Use that language.]
    B -->|No| D[Repeat.]
    D --> A
```

That said, I do break out languages according to the task:

| The Job                                                            | The Languages                                                                                                                                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[[public/tags/projects\|Application development]]**              | [[public/tags/engineering/languages/csharp\|.NET]] and [[public/tags/engineering/languages/typescript\|TypeScript]] (stack used for my [[public/tags/projects/dayjob\| day job]])                     |
| **[[public/tags/engineering/data\|Data science and engineering]]** | [[public/tags/engineering/languages/python\|Python]] and/or [[public/tags/engineering/languages/csharp\|.NET]] (via [[public/tags/projects/flowthru\|Flowthru]])                                      |
| **[[public/tags/projects/games\|Game development]]**               | [[public/tags/engineering/languages/typescript\|TypeScript]], [[public/tags/engineering/languages/csharp\|.NET]], and [[public/tags/engineering/languages/lua\|Lua]]                                  |
| **[[public/tags/engineering/frontend\|Web development]]**          | [[public/tags/engineering/languages/typescript\|TypeScript]] and/or [[public/tags/engineering/languages/csharp\|.NET]] (via [Blazor](https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor)) |

