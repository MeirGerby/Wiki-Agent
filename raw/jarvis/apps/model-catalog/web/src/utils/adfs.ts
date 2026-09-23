import type { AppUser } from '@jarvis/model-catalog-contract';

const loginServer = `/api/adfs`;
const CLOSED_POLL_INTERVAL_MS = 5000;

export const fetchADFSUser = (): Promise<AppUser> => {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', authMessageEventHandler);
      window.clearInterval(closedPollId);
    };

    const authMessageEventHandler = (e: MessageEvent) => {
      const data = e.data;

      if (!data || data.isSuccess === undefined) return;

      settled = true;
      cleanup();
      authWindow?.close();

      if (data.isSuccess && data.user) {
        const user: AppUser = {
          userId: data.user.id?.toLowerCase() || '',
          fullName:
            data.user.fullName ||
            `${data.user.firstName} ${data.user.lastName}`,
          displayName:
            data.user.displayName ||
            data.user.fullName ||
            `${data.user.firstName} ${data.user.lastName}`,
          hierarchy: data.user.hierarchy || '',
          email: data.user.email || '',
        };
        resolve(user);
      } else {
        reject(new Error('ADFS authentication failed'));
      }
    };

    const authWindow = window.open(
      loginServer,
      'chromeWindow',
      `height=${window.innerHeight * 0.5}, width=${window.innerWidth * 0.5},
               top=${window.innerHeight * 0.25}, left=${window.innerWidth * 0.25}`,
    );

    if (!authWindow) {
      reject(new Error('Failed to open ADFS login window'));
      return;
    }

    window.addEventListener('message', authMessageEventHandler);

    // The ADFS flow only ever settles via a postMessage from the popup. If the
    // user closes the popup (or it never completes) without sending one, the
    // promise used to hang forever, so retries after that point never counted
    // as a failure and no auth error was ever shown. Poll for the window
    // closing so this path always settles.
    const closedPollId = window.setInterval(() => {
      if (settled) {
        window.clearInterval(closedPollId);
        return;
      }

      if (authWindow.closed) {
        settled = true;
        cleanup();
        reject(
          new Error(
            'ADFS login window was closed before completing authentication',
          ),
        );
      }
    }, CLOSED_POLL_INTERVAL_MS);
  });
};
