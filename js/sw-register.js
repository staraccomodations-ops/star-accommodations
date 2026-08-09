// Register service worker for offline support and installability.
// Service workers are blocked entirely under file:// by browser security
// policy — this is expected when double-clicking index.html, not an error.
// Everything else in the app works normally either way.
if (location.protocol === 'file:') {
    console.info('Star Accommodations: running from a local file (file://). ' +
        'Offline caching and "Install as app" need the file to be served over ' +
        'http:// or https:// (e.g. host it, or run a local server) — everything ' +
        'else in the app works normally without this.');
} else if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').catch(function(err) {
            console.warn('Service worker registration failed:', err);
        });
    });
}
