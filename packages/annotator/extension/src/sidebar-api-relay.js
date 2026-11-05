// Loaded by the sidebar's page (sidebar-app.html.mustache) before the client: sends the client's
// requests to the Hypothesis service through the background script (src/background/api-relay.ts),
// which can reach a service on the user's machine where a frame inside a public page can't.
// Requests elsewhere go out as before.

(() => {
  const config = JSON.parse(
    document.querySelector('script.js-hypothesis-config')?.textContent ?? '{}',
  );
  /** @type {string[]} */
  const bases = [config.apiUrl, config.serviceUrl].filter(Boolean);
  const networkFetch = window.fetch.bind(window);

  /**
   * A request body, as text: the client sends JSON strings, and forms as URLSearchParams.
   * @param {BodyInit | null | undefined} body
   */
  const bodyText = body =>
    body == null ? undefined : typeof body === 'string' ? body : String(body);

  /**
   * @param {RequestInfo | URL} input
   * @param {RequestInit} [init]
   */
  window.fetch = async function fetch(input, init = {}) {
    const request = input instanceof Request ? input : null;
    const url = request ? request.url : String(input);
    if (!bases.some(base => url.startsWith(base))) {
      return networkFetch(input, init);
    }
    /** @type {Record<string, string>} */
    const headers = {};
    new Headers(init.headers ?? request?.headers ?? {}).forEach(
      (value, name) => (headers[name] = value),
    );
    const answer = await chrome.runtime.sendMessage({
      type: 'api-relay',
      url,
      method: init.method ?? request?.method ?? 'GET',
      headers,
      body:
        (bodyText(init.body) ?? (request ? await request.text() : undefined)) ||
        undefined,
    });
    if (!answer?.ok) {
      throw new TypeError(`Failed to reach the service: ${answer?.error}`);
    }
    const empty = answer.status === 204 || answer.status === 304;
    return new Response(empty ? null : answer.body, {
      status: answer.status,
      headers: answer.headers,
    });
  };
})();
