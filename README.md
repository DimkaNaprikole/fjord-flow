# FJORD / FLOW — portable static preview

For the optional Afonya account/chat integration, see [SECURITY.md](SECURITY.md)
for the public Firebase key's required restrictions and backend-secret handling.

Publish the contents of this directory as a static site. It supports both a domain root and a project subdirectory such as `/fjord-flow/`; no hard-coded repository name is needed.

`demo-runtime.js` derives its base URL from its own script URL. Same-origin calls under `<base>/api/` are intercepted in the browser; static snapshots are loaded from `<base>/demo-data/`. Booking previews are in memory only. Accounts, public posts, payments and real bookings remain disabled. Map routes use saved sample routes or the existing external road services.

Use an HTTP server, not `file://`. For local testing, serve this directory at a root URL or serve its parent and open the directory URL with a trailing slash. GitHub Pages adds the trailing slash automatically for project sites.

Photo credits, source/licence links, YouTube embeds and creator attribution are retained. Third-party videos and routing services depend on external availability. No server, credentials, private databases or publisher-specific configuration are included.

## Optional on-site Google Places café search

`google-cafes.js` loads Maps JavaScript / Places only after an explicit search. It does not create Google Cloud resources or enable billing. The checked-in `google-places-config.json` is disabled with an empty key. Results and photo references are kept only in the current page memory. `places-info.html` links the feature's privacy notice and Google's terms.

Activation requires Google Cloud access, billing, Maps JavaScript API and Places API (New). Create a browser key restricted to these APIs and to the required HTTP referrers. For this checkout use `https://dimkanaprikole.github.io/*` and, for development, `http://127.0.0.1:8790/*` / `http://localhost:8790/*`. Do not restrict only to `/fjord-flow/`: browsers commonly omit paths on cross-origin referrers. Never publish an unrestricted server key. Configure service quotas before enabling public search; agree the spending limit with the account owner.

Set `enabled: true` and the restricted browser key only after setup, then verify a real search and photo load from both allowed origins. Current use of `Place.isOpen()` requires the documented `v=beta` channel. A missing/unknown schedule is never treated as confirmed open. The result distance is straight-line, not road distance. Requests are explicit and results are capped at 12; photo retrieval waits until the card is visible. Google Maps and photo author attributions must remain visible, and these Google results must not be plotted on the existing Leaflet map.

Official references: [setup](https://developers.google.com/maps/documentation/places/web-service/get-api-key), [key restrictions](https://developers.google.com/maps/api-security-best-practices), [Places reference](https://developers.google.com/maps/documentation/javascript/reference/place), [attributions](https://developers.google.com/maps/documentation/places/web-service/policies).
