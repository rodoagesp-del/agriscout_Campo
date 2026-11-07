// =========================================================
// MAIN - Inicialización de la app y Service Worker
// =========================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado.', reg))
            .catch(err => console.error('Error en SW:', err));
    });
}

window.onload = async () => {
    // 1. Cargar local primero y armar mapa
    try {
        if (typeof loadData === 'function') loadData();
    } catch (e) {
        console.warn('No se pudo cargar la data local:', e);
    }

    try {
        if (typeof initMap === 'function') initMap();
    } catch (e) {
        console.warn('No se pudo inicializar el mapa:', e);
    }
    
    // 2. Sincronizar con la nube
    try {
        const response = await fetch(CLOUD_API_URL);
        if (!response.ok) throw new Error("Error HTTP");
        
        const cloudData = await response.json();
        if (cloudData && cloudData.zones && cloudData.categories) {
            appData = cloudData;
            if (typeof saveData === 'function') saveData();
        }
    } catch (error) {
        console.warn("Usando datos locales por falta de conexión.", error);
    } finally {
        // 3. Quitar pantalla de carga
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');

        // Render seguros (con guard interno)
        try { if (typeof renderTreeTypesLite === 'function') renderTreeTypesLite(); } catch (e) { console.warn(e); }
        try { if (typeof renderZonesOnMap === 'function') renderZonesOnMap(); } catch (e) { console.warn(e); }
        
        // ✅ Forzar recálculo del mapa tras ocultar el overlay
        setTimeout(() => {
            if (typeof map !== 'undefined' && map) {
                map.invalidateSize();
                if (typeof drawnItems !== 'undefined' && drawnItems.getLayers().length > 0) {
                    map.fitBounds(drawnItems.getBounds(), { padding: [20, 20] });
                }
            }
        }, 500);
    }
};