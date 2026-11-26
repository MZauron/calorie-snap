// From MZauron/playdate src/platform/security-headers.ts @ eeb9dd8
// The headers every response carries: `next.config.ts` sets them on every path. Pure.
// Nothing of ours is meant to be shown inside another site's frame. No page uses the camera through the browser API
// (getUserMedia): the photo comes from the file input (`capture="environment"`), which opens the phone's own camera and is not
// governed by `camera=()`. A live in-page camera (NEXT.md "Later") would have to change this to `camera=(self)`.

export type Header = { key: string; value: string };

/** HSTS only in production: a browser that saw it on localhost would refuse plain http there for a year. */
export function securityHeaders(production: boolean): Header[] {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
  ];
}
