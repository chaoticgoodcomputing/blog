// A widget whose stylesheet exercises the widget layer (quartz-mdx ADR-0002): its own nested layer,
// remote imports, and a rule that has to beat a more specific core rule. Static markup.
import "./cascade.css"

export function Cascade() {
  return (
    <div class="cascade">
      <p>
        <strong class="cascade__strong">Coloured by the widget, over core.</strong>
      </p>
      <p class="cascade__nested">Styled from the widget's own layer.</p>
      <p class="cascade__remote">Styled from a remote import.</p>
      <p class="cascade__anonymous">Styled over an anonymous-layer import.</p>
    </div>
  )
}
