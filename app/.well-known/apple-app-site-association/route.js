import { APP_LINK_PATHS, APPLE_APP_ID } from '../../../lib/app-links';

export const dynamic = 'force-static';

/** iOS reads this file without redirects to decide which links open Fluxgo. */
export function GET() {
  const body = {
    applinks: {
      details: [
        {
          appIDs: [APPLE_APP_ID],
          components: APP_LINK_PATHS.map((path) => ({ '/': path }))
        }
      ]
    }
  };
  return Response.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
