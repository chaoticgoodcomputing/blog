import { chromeAPI } from './chrome-api';
import settings from './settings';

/**
 * A request to the Hypothesis service, made by the sidebar through the background script
 * (`src/sidebar-api-relay.js`), and its response.
 *
 * The sidebar is a frame inside the page it annotates, so Firefox treats its requests as that
 * page's: from a public site, its Local Network Access protection blocks them from reaching a
 * service on the user's machine (the local settings' 127.0.0.1). The background script is in no
 * page, and reaches it.
 */
export type RelayRequest = {
  type: 'api-relay';
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

export type RelayResponse =
  | { ok: true; status: number; headers: Record<string, string>; body: string }
  | { ok: false; error: string };

/** Whether a URL is the service's, the only one the relay will request. */
function isServiceURL(url: string) {
  return [settings.apiUrl, settings.serviceUrl]
    .filter(Boolean)
    .some(base => url.startsWith(base));
}

export async function relay(request: RelayRequest): Promise<RelayResponse> {
  if (!isServiceURL(request.url)) {
    return { ok: false, error: `Not the service's: ${request.url}` };
  }
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    const headers: Record<string, string> = {};
    response.headers.forEach((value, name) => (headers[name] = value));
    return {
      ok: true,
      status: response.status,
      headers,
      body: await response.text(),
    };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/** Answers the sidebar's relayed requests: only from the extension's own pages. */
export function listenForRelayRequests() {
  const ownPages = chromeAPI.runtime.getURL('/');
  chromeAPI.runtime.onMessage.addListener(
    (message: RelayRequest, sender, sendResponse) => {
      if (message?.type !== 'api-relay') {
        return false;
      }
      if (sender.id !== chromeAPI.runtime.id || !sender.url?.startsWith(ownPages)) {
        sendResponse({ ok: false, error: 'Not from the extension' });
        return false;
      }
      relay(message).then(sendResponse);
      // The response comes later.
      return true;
    },
  );
}
