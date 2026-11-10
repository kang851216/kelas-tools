/* KelasTools — anonymous page-view counter.
   No cookies, no identifiers, no personal data. A single fire-and-forget
   increment to a public counter API (abacus.jasoncameron.dev), one counter
   per day plus an all-time total. The desktop dashboard reads those counters.
   Failure is silent: if the request is blocked, the page is unaffected. */
(function () {
  try {
    // Don't count automated browsers or prerenders.
    if (navigator.webdriver) return;
    if (document.visibilityState === 'prerender') return;
    // Only the published site counts: local previews (http://127.0.0.1, file://)
    // were inflating the number and made it impossible to tell real visitors apart.
    if (location.hostname !== 'kang851216.github.io') return;

    var NS = 'kelas-tools-web3';
    var base = 'https://abacus.jasoncameron.dev/hit/' + NS + '/';
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var day = 'v-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

    var bump = function (key) {
      try {
        fetch(base + key, { mode: 'no-cors', cache: 'no-store', keepalive: true });
      } catch (e) { /* ignore */ }
    };
    bump(day);
    bump('all');

    // Which channel sent this visit? ?ref=wa / ?ref=qr / ?ref=fb ... once per tab.
    var ref = (location.search.match(/[?&]ref=([a-zA-Z0-9_-]{1,16})/) || [])[1];
    if (ref) {
      try {
        if (!sessionStorage.getItem('kt-ref')) {
          sessionStorage.setItem('kt-ref', ref);
          bump('ref-' + ref.toLowerCase());
        }
      } catch (e) { /* private mode */ }
    }
  } catch (e) { /* never break the page for a counter */ }
})();
