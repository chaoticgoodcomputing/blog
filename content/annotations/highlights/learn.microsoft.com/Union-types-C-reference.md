# Union types (C# reference)

> Some quick notes on the Union type addition in C# 15, and how I can use it to make Flowthru fail-fast(er)

- Page: https://blog.chaoticgood.computer/content/annotations/highlights/learn.microsoft.com/Union-types-C-reference
- Author: Spencer Elkington
- Published: 2026-11-06
- Updated: 2026-11-06
- Tags: projects/flowthru, engineering/languages/csharp, writing/annotations, writing/fragments

---

C# 15’s features were recently announced, and the one that immediately caught my eye was the Union types:

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

Stronger typing like this allows us to better leverage compile-time errors, which is super important in the stack engineering role of [software gardening](https://blog.chaoticgood.computer/content/notes/software-gardening). As a stack engineer, your job isn’t to write good code: it’s to make it hard for agents to write bad code.

From [Union types - C# reference](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union) on learn.microsoft.com

## Annotations

[> [!quote] Quote
>
> Declare a union when a value must be exactly one of a fixed set of types and you want the compiler to enforce that every possibility is handled. Common scenarios include: Result-or-error returns: A method returns either a success value or an error value, and the caller must handle both. A union like union Result(Success, Error) makes the set of outcomes explicit. Message or command dispatching: A system processes a closed set of message types. A union ensures new message types produce compile-time warnings at every switch that doesn't handle them yet. Replacing marker interfaces or abstract base classes: If you use an interface or abstract class solely to group types for pattern matching, a union gives you exhaustiveness checking without requiring inheritance or shared members.](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/union#:~:text=language%20version%20history.-,Declare%20a%20union%20when%20a,requiring%20inheritance%20or%20shared%20members.,-A%20union%20differs)

This is VERY exciting stuff. It took me a second to sit on how, exactly, this could be used: specifically in [Flowthru](https://blog.chaoticgood.computer/tags/projects/flowthru), and for other cases where I, in my role as a stack engineer for .NET layers of the stack, want to make it harder to write wrong code.

The immediate top of mind that I’ve got is the ability to enforce strong typing in Flowthru for `FlowthruService` callers when slicing flows.

The simple explanation is: in Flowthru, a Flow can be seen as a composite function of all of its steps. Let’s say a Flow has three steps:

1.  Step 1 takes in some raw data, and outputs Item A, of schema I\_A
2.  Step 2 takes in Item B, of schema I\_B
3.  Step 3 takes in Item A and Item B, and outputs Item C, of schema I\_C

By combining those three functions, the Flow is then a composite function that takes in the raw data and outputs Items A, B, and C. Trying to express that to the Flow caller in a way that preserves type safety (e.g. a breaking change of the Flow can result in design-type errors within the caller code) has eluded me. My instinct, though, is that a `union` could be used to express that a Flow will output many union objects that can then be safely `switch`ed through.

It’s… barely an idea, but an idea nonetheless. I know it’s worth exploring further, at the very least.

Nov 06, 2026
