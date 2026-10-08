import { deviceKind, normalizeRideId } from '../../../../lib/app-links';
import { ANDROID_STORE_PUBLIC, APP_STORE_URL, IOS_APP_LINKS_LIVE, PLAY_STORE_URL, WEB_APP_URL } from '../../../(site)/_components/links';

/**
 * Target of the "Open in app" button. When the app is installed, the phone
 * opens Fluxgo before this runs. Otherwise send the visitor to the right store
 * or to the web app.
 */
export async function GET(request, { params }) {
  const { publicId } = await params;
  const id = normalizeRideId(publicId);
  const webTarget = id ? `${WEB_APP_URL}/trip/${id}` : WEB_APP_URL;
  const kind = deviceKind(request.headers.get('user-agent') ?? '');
  const target = kind === 'ios' && IOS_APP_LINKS_LIVE
    ? APP_STORE_URL
    : kind === 'android' && ANDROID_STORE_PUBLIC
      ? PLAY_STORE_URL
      : webTarget;
  return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store' } });
}
