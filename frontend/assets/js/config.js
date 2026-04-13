window.GAYAGUARD_CONFIG = {
    API_ORIGIN: (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:'
    )
        ? 'http://localhost:5000'
        : 'https://gayaguard.onrender.com'
};
