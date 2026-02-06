---
copilot-command-context-menu-enabled: true
copilot-command-slash-enabled: true
copilot-command-context-menu-order: 1020
copilot-command-model-key: ""
copilot-command-last-used: 1770390601998
---
## Task

Read the contents of {activeNote}. Under the "### Tasks" section, there are markdown task lists:

- "Leftovers" are tasks remaining from previous days
- "Fresh" are tasks created today

This is the data for necessary tasks. Each will have two tags, denoted by `#`.

- The first tag on a task categorizes it into high and low priority. The two priorities are `#tasks/veg` (high priority) and `#tasks/fruit` (low priority).
- The second tag categorizes it into relevant projects:
  -  `#projects/dayjob` represents dayjob tasks
  - `#horticulture` represents personal life tasks
  - Other tags represent other projects

The task is to plan my day by filling in the Markdown quote block labelled `> [!ASSISTANT]`. It has subheaders for morning, afternoon, and evening blocks of time.

- Each subheader should be filled with two tasks.
- If it is a weekday (Mon-Fri), the morning and afternoon block should be day job tasks.
- If it is a weekend (Sat, Sun), the morning and afternoon block should NOT be day job tasks.
- The evening block should never be dayjob tasks.
- High priority tasks should always be preferred over low-priority tasks
- The creation date of the task should be used to break ties between tasks of the same priority. Date should be used to tiebreak in the following order:
    - "Fresh" tasks — tasks created that day — should be prioritized first.
    - "Leftover" tasks should be prioritized in ascending date, with later tasks being prioritized first.
- The mornings should lean towards tasks that seem easier.
- On Fridays, break priority to use any fruit task for the second Afternoon block task, regardless of project.

### Example

Given a list of tasks under "#### Leftovers":

```md
#### Leftovers

- [ ] #tasks/fruit #projects/site Write new blog post about cats [created:: 2026-01-20]
- [ ] #tasks/veg #projects/dayjob Fix ACME product render bug [created:: 2026-01-21]
- [ ] #tasks/fruit #projects/dayjob Create new internal tool presentation [created:: 2026-01-21]
- [ ] #tasks/veg #projects/dayjob Prepare ACME product demo [created:: 2026-01-21]
- [ ] #tasks/veg #horticulture Schedule DMV appointment [created:: 2026-01-24]
- [ ] #tasks/fruit #horticulture Reorganize office drawers [created:: 2026-01-24]
- [ ] #tasks/veg #horticulture Clean the house [created:: 2026-01-26]
```

A valid assistant block may look like:

```md
> [!ASSISTANT]
> 
> #### Morning Block
> 
> - Fix ACME product render bug
> - Prepare ACME product render bug
> 
> #### Afternoon Block
> 
> - Create new internal tool presentation
> - Schedule DMV appointment
> 
> #### Evening Block
> 
> - Clean the house
> - Write new blog post about cats
```

- Respond ONLY with the assistant block. Do NOT include any additional rationale for the decisions.
- Sometimes, the "Thoughts" subheader will be filled in. If that is the case, take those insights into account when weighing tasks