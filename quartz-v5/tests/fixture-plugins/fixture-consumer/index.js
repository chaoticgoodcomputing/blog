// A consumer of cgc-styles, as every styled cgc-* package is one: its own CSS in its own sublayer of
// the family layer, `cgc.fixture-consumer`, from `externalResources()`. It renders nothing, so its
// one rule selects nothing on the page; what a spec reads is the layer, in the CSSOM.
export default function FixtureConsumer() {
  return {
    name: "FixtureConsumer",
    // The loader skips a transformer with no hook.
    htmlPlugins: () => [],
    externalResources: () => ({
      css: [{ content: "@layer cgc.fixture-consumer { .cgc-fixture-consumer { display: block; } }", inline: true }],
    }),
  }
}
