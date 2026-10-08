import { ANDROID_CERT_FINGERPRINTS, ANDROID_PACKAGE } from '../../../lib/app-links';

export const dynamic = 'force-static';

/** Android reads this file to verify that Fluxgo may open fluxgo.in links. */
export function GET() {
  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: ANDROID_CERT_FINGERPRINTS
      }
    }
  ];
  return Response.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
