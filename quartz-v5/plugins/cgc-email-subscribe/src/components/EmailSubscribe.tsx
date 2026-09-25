import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "@quartz-community/types"

export interface EmailSubscribeOptions {
  /** The Buttondown newsletter's username: the form posts to its embed-subscribe endpoint. Required. */
  buttondownUsername: string
  /** The heading above the box. Defaults to "Newsletter"; `""` leaves the heading out. */
  title?: string
  /** The line inside the box, above the form. Defaults to "Weekly updates about any new notes!"; `""` leaves it out. */
  description?: string
}

// v4's defaults, less its username: a site that forgets its own would sign readers up to ours.
const defaults = {
  title: "Newsletter",
  description: "Weekly updates about any new notes!",
}

export default ((opts?: Partial<EmailSubscribeOptions>) => {
  // Options arrive as the site's config gives them: Quartz merges no defaults into a component's.
  const username = opts?.buttondownUsername?.trim()
  if (!username) {
    throw new Error(`cgc-email-subscribe: set the "buttondownUsername" option to your Buttondown newsletter's username`)
  }
  const { title, description } = { ...defaults, ...opts }
  const action = `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(username)}`

  const EmailSubscribe: QuartzComponent = ({ displayClass }: QuartzComponentProps) => (
    <div class={["cgc-email-subscribe", displayClass].filter(Boolean).join(" ")}>
      {title && <h3 class="cgc-email-subscribe__title">{title}</h3>}
      <div class="cgc-email-subscribe__panel">
        {description && <p class="cgc-email-subscribe__description">{description}</p>}
        <form class="cgc-email-subscribe__form" action={action} method="post">
          <input class="cgc-email-subscribe__input" type="email" name="email" placeholder="you@youmail.com" required />
          <input class="cgc-email-subscribe__submit" type="submit" value="Subscribe" />
        </form>
      </div>
    </div>
  )

  return EmailSubscribe
}) satisfies QuartzComponentConstructor<Partial<EmailSubscribeOptions>>
