// =========================================================
// UI - Navegación de pestañas y notificaciones
// =========================================================

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('text-emerald-600');
        b.classList.add('text-slate-400');
    });
    btnElement.classList.remove('text-slate-400');
    btnElement.classList.add('text-emerald-600');

    // ✅ El mapa ahora recalcula en 'eval'
    if (tabId === 'eval' && typeof map !== 'undefined' && map) {
        setTimeout(() => {
            map.invalidateSize();
            if (typeof drawnItems !== 'undefined' && drawnItems.getLayers().length > 0) {
                map.fitBounds(drawnItems.getBounds(), { padding: [20, 20] });
            }
        }, 100);
    }
    
    // ✅ Se quitó el llamado a la pestaña 'config'
    if (tabId === 'report') { 
        if (typeof updateReportZoneSelect === 'function') updateReportZoneSelect();
        if (typeof refreshCurrentReport === 'function') refreshCurrentReport();
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 3000);
}