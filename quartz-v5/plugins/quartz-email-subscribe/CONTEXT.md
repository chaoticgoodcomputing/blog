# quartz-email-subscribe

`@chaoticgoodcomputing/quartz-email-subscribe`, manifest name `cgc-email-subscribe`, loaded by package name (#89, #94): the Quartz 5 plugin that renders a newsletter subscribe box: v4's `EmailSubscribe`, kept on
[#42](https://github.com/chaoticgoodcomputing/blog/issues/42) and homed on
[#44](https://github.com/chaoticgoodcomputing/blog/issues/44). Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Subscribe box**:
What this plugin renders: a heading, and a panel holding a line of text and the subscribe form.
_Avoid_: widget (reserved for what an MDX page imports, in `cgc-mdx`), newsletter form, signup

**Newsletter**:
The Buttondown newsletter a reader subscribes to, named by the `buttondownUsername` option. Always
the site's own: the plugin has no default, so a site that forgets to set it fails to build rather
than signing readers up to someone else's.
_Avoid_: mailing list, list

**Endpoint**:
Buttondown's embed-subscribe URL for the newsletter, which the form posts the reader's address to.
The browser submits it as a plain form, with no script of ours.
_Avoid_: API, action URL
