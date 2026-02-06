import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/emailSubscribe.scss"
import { classNames } from "../util/lang"

interface Options {
  /** Buttondown username */
  buttondownUsername: string
  /** Title to display above the widget */
  title?: string
  /** Description text to show in the form */
  description?: string
}

const defaultOptions: Partial<Options> = {
  buttondownUsername: "chaoticgoodcomputing",
  title: "Newsletter",
  description: "Weekly updates about any new notes!",
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const EmailSubscribe: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "email-subscribe")}>
        {opts.title && <h3>{opts.title}</h3>}
        <div class="email-subscribe-container">
          {opts.description && <p>{opts.description}</p>}
          <form
            action={`https://buttondown.com/api/emails/embed-subscribe/${opts.buttondownUsername}`}
            method="post"
            class="embeddable-buttondown-form"
          >
            <input type="email" name="email" id="bd-email" placeholder="you@youmail.com" required />
            <input type="submit" value="Subscribe" />
          </form>
        </div>
      </div>
    )
  }

  EmailSubscribe.css = style
  return EmailSubscribe
}) satisfies QuartzComponentConstructor
