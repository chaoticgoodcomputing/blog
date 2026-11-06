---
title: "Union types (C# reference)"
date: 2026-11-06
updated: 2026-11-06
tags:
  - projects/flowthru
  - engineering/languages/csharp
  - writing/annotations
  - writing/fragments
description: Some quick notes on the Union type addition in C# 15, and how I can use it to make Flowthru fail-fast(er)
annotation-pages:
annotation-target: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union
annotation-target-type: web
---

C# 15's features were recently announced, and the one that immediately caught my eye was the Union types:

```cs
public union Pet(Cat, Dog, Bird);
```

```cs
static void PatternMatching()
{
    Pet pet = new Dog("Rex", "Labrador");

    var name = pet switch
    {
        Dog d => d.Name,
        Cat c => c.Name,
        Bird b => b.Name,
    };
    Console.WriteLine(name); // output: Rex
}
```

Stronger typing like this allows us to better leverage compile-time errors, which is super important in the stack engineering role of [[public/content/notes/software-gardening.mdx|software gardening]]. As a stack engineer, your job isn't to write good code: it's to make it hard for agents to write bad code.

>%%
>```annotation-json
>{"created":"2026-11-06T06:34:56.905Z","text":"This is VERY exciting stuff. It took me a second to sit on how, exactly, this could be used: specifically in [[public/tags/projects/flowthru|Flowthru]], and for other cases where I, in my role as a stack engineer for .NET layers of the stack, want to make it harder to write wrong code.\n\nThe immediate top of mind that I've got is the ability to enforce strong typing in Flowthru for `FlowthruService` callers when slicing flows.\n\nThe simple explanation is: in Flowthru, a Flow can be seen as a composite function of all of its steps. Let's say a Flow has three steps:\n\n1. Step 1 takes in some raw data, and outputs Item A, of schema I_A\n2. Step 2 takes in Item B, of schema I_B\n3. Step 3 takes in Item A and Item B, and outputs Item C, of schema I_C\n\nBy combining those three functions, the Flow is then a composite function that takes in the raw data and outputs Items A, B, and C. Trying to express that to the Flow caller in a way that preserves type safety (e.g. a breaking change of the Flow can result in design-type errors within the caller code) has eluded me. My instinct, though, is that a `union` could be used to express that a Flow will output many union objects that can then be safely `switch`ed through.\n\nIt's... barely an idea, but an idea nonetheless. I know it's worth exploring further, at the very least.","updated":"2026-11-06T06:45:29.444Z","document":{"title":"Union types - C# reference","link":[{"href":"https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union"},{"href":"https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union","rel":"canonical","type":""}],"dc":{},"eprints":{},"facebook":{"type":["website"],"image:alt":["Union types - C# reference | Microsoft Learn"],"image":["https://learn.microsoft.com/dotnet/media/logo_csharp.png"],"title":["Union types - C# reference"],"url":["https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union"],"description":["Learn about union types in C#. Unions express values from a closed set of types with exhaustive pattern matching support."]},"highwire":{},"prism":{},"twitter":{"card":["summary"],"site":["@MicrosoftLearn"]}},"uri":"https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union","target":[{"source":"https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union","selector":[{"type":"RangeSelector","startContainer":"/main[1]/div[3]/div[1]/div[6]/p[5]","startOffset":0,"endContainer":"/main[1]/div[3]/div[1]/div[6]/ul[1]/li[3]","endOffset":230},{"type":"TextPositionSelector","start":6578,"end":7367},{"type":"TextQuoteSelector","exact":"Declare a union when a value must be exactly one of a fixed set of types and you want the compiler to enforce that every possibility is handled. Common scenarios include:\n\nResult-or-error returns: A method returns either a success value or an error value, and the caller must handle both. A union like union Result(Success, Error) makes the set of outcomes explicit.\nMessage or command dispatching: A system processes a closed set of message types. A union ensures new message types produce compile-time warnings at every switch that doesn't handle them yet.\nReplacing marker interfaces or abstract base classes: If you use an interface or abstract class solely to group types for pattern matching, a union gives you exhaustiveness checking without requiring inheritance or shared members.","prefix":"e C# language version history.\n\n","suffix":"\n\nA union differs from other typ"}]}]}
>```
>%%
>*%%PREFIX%%e C# language version history.%%HIGHLIGHT%% ==Declare a union when a value must be exactly one of a fixed set of types and you want the compiler to enforce that every possibility is handled. Common scenarios include:
>
>Result-or-error returns: A method returns either a success value or an error value, and the caller must handle both. A union like union Result(Success, Error) makes the set of outcomes explicit.
>Message or command dispatching: A system processes a closed set of message types. A union ensures new message types produce compile-time warnings at every switch that doesn't handle them yet.
>Replacing marker interfaces or abstract base classes: If you use an interface or abstract class solely to group types for pattern matching, a union gives you exhaustiveness checking without requiring inheritance or shared members.== %%POSTFIX%%A union differs from other typ*
>%%LINK%%[[#^knxn9xm6kka|show annotation]]
>%%COMMENT%%
>This is VERY exciting stuff. It took me a second to sit on how, exactly, this could be used: specifically in [[public/tags/projects/flowthru|Flowthru]], and for other cases where I, in my role as a stack engineer for .NET layers of the stack, want to make it harder to write wrong code.
>
>The immediate top of mind that I've got is the ability to enforce strong typing in Flowthru for `FlowthruService` callers when slicing flows.
>
>The simple explanation is: in Flowthru, a Flow can be seen as a composite function of all of its steps. Let's say a Flow has three steps:
>
>1. Step 1 takes in some raw data, and outputs Item A, of schema I_A
>2. Step 2 takes in Item B, of schema I_B
>3. Step 3 takes in Item A and Item B, and outputs Item C, of schema I_C
>
>By combining those three functions, the Flow is then a composite function that takes in the raw data and outputs Items A, B, and C. Trying to express that to the Flow caller in a way that preserves type safety (e.g. a breaking change of the Flow can result in design-type errors within the caller code) has eluded me. My instinct, though, is that a `union` could be used to express that a Flow will output many union objects that can then be safely `switch`ed through.
>
>It's... barely an idea, but an idea nonetheless. I know it's worth exploring further, at the very least.
>%%TAGS%%
>
^knxn9xm6kka
