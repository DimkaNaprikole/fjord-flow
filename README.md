# FJORD / FLOW — portable static preview

Publish the contents of this directory as a static site. It supports both a domain root and a project subdirectory such as `/fjord-flow/`; no hard-coded repository name is needed.

`demo-runtime.js` derives its base URL from its own script URL. Same-origin calls under `<base>/api/` are intercepted in the browser; static snapshots are loaded from `<base>/demo-data/`. Booking previews are in memory only. Accounts, public posts, payments and real bookings remain disabled. Map routes use saved sample routes or the existing external road services.

Use an HTTP server, not `file://`. For local testing, serve this directory at a root URL or serve its parent and open the directory URL with a trailing slash. GitHub Pages adds the trailing slash automatically for project sites.

Photo credits, source/licence links, YouTube embeds and creator attribution are retained. Third-party videos and routing services depend on external availability. No server, credentials, private databases or publisher-specific configuration are included.
