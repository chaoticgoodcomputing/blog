import { listenForRelayRequests, relay, $imports } from '../../src/background/api-relay';

describe('background/api-relay', () => {
  const apiUrl = 'http://127.0.0.1:27183/api';
  let fakeChromeAPI;
  let fakeFetch;

  beforeEach(() => {
    fakeChromeAPI = {
      runtime: {
        id: 'extension-id',
        getURL: path => `moz-extension://uuid${path}`,
        onMessage: { addListener: sinon.stub() },
      },
    };
    $imports.$mock({
      './chrome-api': { chromeAPI: fakeChromeAPI },
      './settings': { default: { apiUrl, serviceUrl: 'http://127.0.0.1:27183/' } },
    });
    fakeFetch = sinon.stub(window, 'fetch').resolves(
      new Response('{"total":1}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    fakeFetch.restore();
    $imports.$restore();
  });

  describe('relay', () => {
    it("requests the service's URLs, and gives back the response", async () => {
      const response = await relay({
        type: 'api-relay',
        url: `${apiUrl}/search?uri=x`,
        method: 'POST',
        headers: { authorization: 'Bearer local' },
        body: '{}',
      });

      assert.calledWith(fakeFetch, `${apiUrl}/search?uri=x`, {
        method: 'POST',
        headers: { authorization: 'Bearer local' },
        body: '{}',
      });
      assert.deepEqual(response, {
        ok: true,
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: '{"total":1}',
      });
    });

    it('refuses any other URL', async () => {
      const response = await relay({
        type: 'api-relay',
        url: 'https://example.com/',
        method: 'GET',
        headers: {},
      });

      assert.notCalled(fakeFetch);
      assert.isFalse(response.ok);
    });

    it('gives back a failure when the service cannot be reached', async () => {
      fakeFetch.rejects(new TypeError('NetworkError'));

      const response = await relay({
        type: 'api-relay',
        url: `${apiUrl}/profile`,
        method: 'GET',
        headers: {},
      });

      assert.isFalse(response.ok);
    });
  });

  describe('listenForRelayRequests', () => {
    function listener() {
      listenForRelayRequests();
      return fakeChromeAPI.runtime.onMessage.addListener.args[0][0];
    }

    const request = { type: 'api-relay', url: `${apiUrl}/profile`, method: 'GET', headers: {} };

    it("answers the extension's own pages", async () => {
      let sendResponse;
      const answered = new Promise(resolve => (sendResponse = resolve));
      const sender = { id: 'extension-id', url: 'moz-extension://uuid/client/app.html' };

      assert.isTrue(listener()(request, sender, sendResponse));

      assert.deepInclude(await answered, { ok: true, status: 200 });
    });

    it('refuses anything else', () => {
      const sendResponse = sinon.stub();
      const sender = { id: 'extension-id', url: 'https://example.com/' };

      listener()(request, sender, sendResponse);

      assert.notCalled(fakeFetch);
      assert.calledWithMatch(sendResponse, { ok: false });
    });

    it('leaves other messages to other listeners', () => {
      const sendResponse = sinon.stub();

      assert.isFalse(listener()({ type: 'getConfigForTab' }, {}, sendResponse));
      assert.notCalled(sendResponse);
    });
  });
});
