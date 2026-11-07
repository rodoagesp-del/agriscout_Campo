// =========================================================
// EVALUATION - Checklist de campo y guardado de árboles
// =========================================================

function isPointInPolygon(point, vs) {
    if (!vs || vs.length < 3) return false;
    let x = point[0], y = point[1], inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1], xj = vs[j][0], yj = vs[j][1];
        if (((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
}

function startEvaluation() {
    if (!currentLocation) return showToast("Esperando señal GPS para ubicar el árbol...");

    const zone = appData.zones.find(z => isPointInPolygon([currentLocation.lat, currentLocation.lng], z.polygon));

    currentEvaluation = {
        id: 'eval_' + Date.now(),
        timestamp: new Date().toISOString(),
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        zoneId: zone ? zone.id : 'unknown',
        treeTypeId: null,
        data: {}
    };

    document.getElementById('evalStartScreen').classList.add('hidden');
    document.getElementById('evaluationForm').classList.remove('hidden');
    document.getElementById('evalZoneName').innerHTML = zone
        ? `<span class="text-emerald-600 font-black">${zone.name}</span>`
        : '<span class="text-red-500 font-bold">Fuera de los sectores</span>';

    // Renderizar variedades de árbol
    renderTreeTypesLite();

    renderEvaluationForm();
}

function renderEvaluationForm() {
    const container = document.getElementById('evalCategoriesContainer');
    container.innerHTML = '';
    appData.categories.forEach(cat => {
        let itemsHTML = cat.items.map(item => {
            const isQuantitative = item.type === 'cuantitativa';
            let inputField = '';

            if (isQuantitative) {
                inputField = `<label class="text-xs text-blue-800 font-bold mb-1 block uppercase">Ingrese Valor Numérico:</label>
                 <input type="number" step="0.01" class="w-full border border-blue-300 p-2 rounded font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. 15.5" oninput="setSeverity('${item.id}', this.value)">`;
            } else {
                const l1 = item.labels?.[1] || 'Nivel 1';
                const l2 = item.labels?.[2] || 'Nivel 2';
                const l3 = item.labels?.[3] || 'Nivel 3';
                const l4 = item.labels?.[4] || 'Nivel 4';

                inputField = `
                 <label class="text-xs text-emerald-800 font-bold mb-1 block uppercase">Intensidad (1 al 4):</label>
                 <select class="w-full border border-gray-300 p-2 rounded font-bold outline-none text-sm" onchange="setSeverity('${item.id}', this.value)">
                    <option value="1">1 - ${l1}</option>
                    <option value="2">2 - ${l2}</option>
                    <option value="3">3 - ${l3}</option>
                    <option value="4">4 - ${l4}</option>
                 </select>`;
            }

            return `
            <div class="p-3 border-b bg-white" id="eval_item_${item.id}">
                <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                    <span class="font-bold text-slate-700">${item.name}</span>
                    <div class="flex items-center bg-gray-100 rounded-lg p-1 border">
                        <button id="btn_ausencia_${item.id}" class="px-4 py-2 text-sm font-bold rounded bg-white shadow-sm text-slate-800 w-full" onclick="setPresence('${item.id}', false)">Ausencia (0)</button>
                        <button id="btn_presencia_${item.id}" class="px-4 py-2 text-sm font-bold rounded text-slate-500 hover:bg-gray-200 w-full" onclick="setPresence('${item.id}', true)">Presencia</button>
                    </div>
                </div>
                <div id="severity_container_${item.id}" class="hidden mt-2 ${isQuantitative ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-emerald-200'} p-3 rounded-lg border">
                    ${inputField}
                </div>
            </div>`;
        }).join('');
        container.innerHTML += `<div class="border rounded-lg shadow-sm mb-3"><div class="bg-emerald-700 px-3 py-2 font-bold text-white uppercase tracking-wider">${cat.name}</div>${itemsHTML}</div>`;
    });
}

function setPresence(itemId, isPresent) {
    if (!currentEvaluation.data[itemId]) currentEvaluation.data[itemId] = {};
    const bAus = document.getElementById(`btn_ausencia_${itemId}`),
          bPre = document.getElementById(`btn_presencia_${itemId}`);
    const sCont = document.getElementById(`severity_container_${itemId}`);
    if (isPresent) {
        bAus.className = "px-4 py-2 text-sm font-bold rounded text-slate-500 hover:bg-gray-200 w-full";
        bPre.className = "px-4 py-2 text-sm font-bold rounded bg-emerald-600 shadow-sm text-white w-full";
        sCont.classList.remove('hidden');
        currentEvaluation.data[itemId].presence = true;
        const inputEl = sCont.querySelector('select, input');
        currentEvaluation.data[itemId].severity = inputEl.value || null;
    } else {
        bPre.className = "px-4 py-2 text-sm font-bold rounded text-slate-500 hover:bg-gray-200 w-full";
        bAus.className = "px-4 py-2 text-sm font-bold rounded bg-white shadow-sm text-slate-800 w-full";
        sCont.classList.add('hidden');
        currentEvaluation.data[itemId].presence = false;
        currentEvaluation.data[itemId].severity = null;
    }
}

function setSeverity(itemId, level) {
    if (!currentEvaluation.data[itemId]) currentEvaluation.data[itemId] = { presence: true };
    currentEvaluation.data[itemId].severity = level;
}

function cancelEvaluation() {
    currentEvaluation = null;
    document.getElementById('evalStartScreen').classList.remove('hidden');
    document.getElementById('evaluationForm').classList.add('hidden');
}

// Actualiza el sector manualmente en caso de que el GPS se haya quedado pegado
function updateCurrentSector() {
    if (!currentLocation || !currentEvaluation) return showToast("No hay señal GPS actual");
    
    const zone = appData.zones.find(z => isPointInPolygon([currentLocation.lat, currentLocation.lng], z.polygon));
    
    currentEvaluation.zoneId = zone ? zone.id : 'unknown';
    currentEvaluation.lat = currentLocation.lat;
    currentEvaluation.lng = currentLocation.lng;
    
    document.getElementById('evalZoneName').innerHTML = zone
        ? `<span class="text-emerald-600 font-black">${zone.name}</span>`
        : '<span class="text-red-500 font-bold">Fuera de los sectores</span>';
        
    showToast("📍 Sector actualizado con GPS reciente");
}

// Función que inyecta las variedades de árbol en el form (ya que borramos la pestaña config)
function renderTreeTypesLite() {
    const ttSelect = document.getElementById('evalTreeTypeSelect');
    if (!ttSelect) return;
    ttSelect.innerHTML = '<option value="">-- No especificado --</option>';
    if (appData.treeTypes && appData.treeTypes.length > 0) {
        appData.treeTypes.forEach(tt => {
            ttSelect.innerHTML += `<option value="${tt.id}">${tt.name}</option>`;
        });
    }
}

// ✅ NUEVO: Guardado Seguro (Fetch -> Push -> Upload)
async function safeSaveAndUpload() {
    const btnSave = document.getElementById('btnSaveEval');
    
    // Validar variedad
    if (appData.treeTypes && appData.treeTypes.length > 0) {
        currentEvaluation.treeTypeId = document.getElementById('evalTreeTypeSelect').value || null;
    }

    // Validar ítems vacíos con la misma lógica flexible que ya tenías
    let formIncompleto = false;
    appData.categories.forEach(cat => cat.items.forEach(item => {
        if (!currentEvaluation.data[item.id] || currentEvaluation.data[item.id].presence === undefined) formIncompleto = true;
    }));
    if (formIncompleto) {
        if (!confirm("⚠️ Tienes ítems sin marcar. Se registrarán como AUSENCIA (0).\n¿Deseas continuar?")) return;
        appData.categories.forEach(cat => cat.items.forEach(item => {
            if (!currentEvaluation.data[item.id] || currentEvaluation.data[item.id].presence === undefined) {
                currentEvaluation.data[item.id] = { presence: false, severity: null };
            }
        }));
    }

    // Bloquear botón para evitar dobles envíos
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Subiendo...';

    try {
        // PASO 1: Descargar silenciosamente la última data para no borrar lo de otros
        const res = await fetch(CLOUD_API_URL);
        if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && cloudData.evaluations) appData = cloudData;
        }

        // PASO 2: Sumar nuestra nueva evaluación a la data fresca
        appData.evaluations.push(currentEvaluation);
        saveData();

        // PASO 3: Subir la data combinada a la nube
        const pushRes = await fetch(CLOUD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(appData)
        });
        
        if (!pushRes.ok) throw new Error("Fallo al subir");
        
        showToast("✅ Muestra guardada y sincronizada en la nube");
        cancelEvaluation(); // Oculta el form y vuelve a la pantalla inicial
        
    } catch (error) {
        console.error("Error al guardar seguro:", error);
        alert("❌ Error de conexión al subir. La muestra se guardó en este dispositivo, pero debes subirla luego cuando tengas internet estable.");
        
        // Si falla el internet, al menos lo guardamos localmente
        if (!appData.evaluations.includes(currentEvaluation)) appData.evaluations.push(currentEvaluation);
        saveData();
        cancelEvaluation();
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fa-solid fa-cloud-arrow-up mr-2"></i> Guardar y Subir';
    }
}