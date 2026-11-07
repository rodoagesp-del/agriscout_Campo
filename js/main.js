// =========================================================
// MAIN - Inicialización de la app y Service Worker
// =========================================================

// --- PWA SERVICE WORKER REGISTRATION (MODO OFFLINE) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado para modo offline.', reg))
            .catch(err => console.error('Error en Service Worker:', err));
    });
}

window.onload = async () => {
    // 1. Mostrar mapa e inicializar UI básica
    initMap();
    
    // 2. Forzar descarga de la nube antes de permitir el uso
    try {
        const response = await fetch(CLOUD_API_URL);
        if (!response.ok) throw new Error("Error en conexión");
        
        const cloudData = await response.json();
        if (cloudData && cloudData.zones && cloudData.categories) {
            appData = cloudData;
            saveData(); // Guardar copia local fresca
        }
    } catch (error) {
        console.error("Error al sincronizar al inicio:", error);
        alert("⚠️ Sin conexión a la nube. Se usarán los datos guardados en este dispositivo, pero asegúrate de tener internet antes de evaluar.");
        loadData(); // Cargar caché local si falla el internet
    } finally {
        // 3. Ocultar pantalla de bloqueo y renderizar
        document.getElementById('loadingOverlay').classList.add('opacity-0', 'pointer-events-none');
        renderTreeTypesLite(); // Función adaptada (ver paso 3)
    }
};