import { ExternalSource } from "./quartz/plugins/external/types"

const sources: ExternalSource[] = [
  {
    name: "flowthru",
    source: {
      path: "docs/reference/external/flowthru/repo/docs",
      exclude: ["CONTRIBUTING.md", "README.md"],
    },
    baseUrl: "https://flowthru.chaoticgood.computer",
    frontmatter: {
      addTags: ["projects/flowthru"],
      fallbackDescription:
        "Documentation for Flowthru, a .NET data-pipeline framework that catches flow errors at compile time.",
    },
  },
]

export default sources
