// Whether a string is a colour value (ADR-0003's colour-value amendment, #31): the family's one check,
// from our library, parsing with the host's lightningcss, the parser Quartz itself runs every
// stylesheet through. A value passes here exactly when Quartz's own CSS pipeline would read it as a
// colour.
import { transform } from "lightningcss"
import { colourValueCheck } from "@chaoticgoodcomputing/tags-core/colour-value"

export const isColourValue = colourValueCheck(transform)
