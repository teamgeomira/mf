// ============================================
// GESTION AV FÖRETAG OCH PROJEKT
// ALL DATA SPARAS I FIREBASE REALTIME DATABASE
// ============================================

// Referens till Firebase-databasen (initieras i index.html)
let db = null;
let onEmpresasChangedCallback = null;

// Initiera modulen med Firebase-databasreferens
function initEmpresasProyectos(databaseRef, callback) {
    db = databaseRef;
    onEmpresasChangedCallback = callback;
    console.log("✅ Företags- och projektmodul initierad med Firebase");
    console.log("📁 Databasreferens:", db ? "OK" : "NULL");
}

// Hämta alla företag från Firebase
async function getEmpresas() {
    if (!db) {
        console.error("Databasreferens saknas");
        return [];
    }
    try {
        const snapshot = await db.ref(`empresas`).once('value');
        const data = snapshot.val();
        console.log("📊 Data från Firebase (empresas):", data);
        if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            console.log("📊 Företag hittades:", keys);
            return keys.sort();
        }
        console.log("📊 Inga företag hittades i databasen");
        return [];
    } catch (error) {
        console.error('Fel vid hämtning av företag:', error);
        return [];
    }
}

// Hämta alla projekt för ett specifikt företag från Firebase
async function getProyectos(empresa) {
    if (!db || !empresa) {
        return [];
    }
    try {
        const snapshot = await db.ref(`empresas/${empresa}`).once('value');
        const proyectos = snapshot.val();
        console.log(`📊 Projekt för ${empresa}:`, proyectos);
        if (proyectos && Array.isArray(proyectos)) {
            return proyectos.sort();
        }
        return [];
    } catch (error) {
        console.error('Fel vid hämtning av projekt:', error);
        return [];
    }
}

// Hämta alla projekt från alla företag
async function getAllProyectos() {
    if (!db) {
        return [];
    }
    try {
        const empresas = await getEmpresas();
        const allaProjekt = [];
        for (let i = 0; i < empresas.length; i++) {
            const empresa = empresas[i];
            const projekt = await getProyectos(empresa);
            for (let j = 0; j < projekt.length; j++) {
                const proj = projekt[j];
                allaProjekt.push({ empresa: empresa, projekt: proj });
            }
        }
        return allaProjekt;
    } catch (error) {
        console.error('Fel vid hämtning av alla projekt:', error);
        return [];
    }
}

// Lägg till ett nytt företag i Firebase
async function agregarEmpresa(empresa) {
    if (!empresa || empresa.trim() === "") {
        console.log("❌ Ogiltigt företagsnamn");
        return false;
    }
    if (!db) {
        console.error("Databasreferens saknas i agregarEmpresa");
        return false;
    }
    try {
        const empresaClean = empresa.trim();
        // Kontrollera om företaget redan finns
        const existing = await db.ref(`empresas/${empresaClean}`).once('value');
        if (existing.exists()) {
            console.log(`⚠️ Företag "${empresaClean}" finns redan`);
            return false;
        }
        // Skapa företaget med en tom array för projekt
        await db.ref(`empresas/${empresaClean}`).set([]);
        console.log(`✅ Företag "${empresaClean}" har lagts till i Firebase`);
        
        // Uppdatera dropdowns om callback finns
        if (onEmpresasChangedCallback) {
            await onEmpresasChangedCallback();
        }
        return true;
    } catch (error) {
        console.error('Fel vid tillägg av företag:', error);
        return false;
    }
}

// Lägg till ett nytt projekt i Firebase
async function agregarProyecto(empresa, proyecto) {
    if (!empresa || !proyecto || proyecto.trim() === "") {
        console.log("❌ Ogiltigt projektnamn");
        return false;
    }
    if (!db) {
        console.error("Databasreferens saknas i agregarProyecto");
        return false;
    }
    try {
        const empresaClean = empresa.trim();
        const proyectoClean = proyecto.trim();
        const snapshot = await db.ref(`empresas/${empresaClean}`).once('value');
        let proyectos = snapshot.val() || [];
        
        if (!Array.isArray(proyectos)) {
            proyectos = [];
        }
        
        if (proyectos.includes(proyectoClean)) {
            console.log(`⚠️ Projekt "${proyectoClean}" finns redan under ${empresaClean}`);
            return false;
        }
        
        proyectos.push(proyectoClean);
        proyectos.sort();
        await db.ref(`empresas/${empresaClean}`).set(proyectos);
        console.log(`✅ Projekt "${proyectoClean}" har lagts till under ${empresaClean}`);
        
        if (onEmpresasChangedCallback) {
            await onEmpresasChangedCallback();
        }
        return true;
    } catch (error) {
        console.error('Fel vid tillägg av projekt:', error);
        return false;
    }
}

// Redigera namn på ett företag i Firebase
async function editarEmpresa(oldName, newName) {
    if (!oldName || !newName || newName.trim() === "") {
        return false;
    }
    if (oldName === newName.trim()) {
        return true;
    }
    if (!db) return false;
    try {
        const newNameClean = newName.trim();
        const snapshot = await db.ref(`empresas/${oldName}`).once('value');
        const proyectos = snapshot.val() || [];
        
        await db.ref(`empresas/${newNameClean}`).set(proyectos);
        await db.ref(`empresas/${oldName}`).remove();
        console.log(`✅ Företag "${oldName}" har bytt namn till "${newNameClean}"`);
        
        if (onEmpresasChangedCallback) {
            await onEmpresasChangedCallback();
        }
        return true;
    } catch (error) {
        console.error('Fel vid redigering av företag:', error);
        return false;
    }
}

// Redigera namn på ett projekt i Firebase
async function editarProyecto(empresa, oldProyecto, newProyecto) {
    if (!empresa || !oldProyecto || !newProyecto || newProyecto.trim() === "") {
        return false;
    }
    if (oldProyecto === newProyecto.trim()) {
        return true;
    }
    if (!db) return false;
    try {
        const empresaClean = empresa.trim();
        const newProyectoClean = newProyecto.trim();
        const snapshot = await db.ref(`empresas/${empresaClean}`).once('value');
        let proyectos = snapshot.val() || [];
        
        if (!Array.isArray(proyectos)) {
            proyectos = [];
        }
        
        const index = proyectos.indexOf(oldProyecto);
        if (index === -1) {
            return false;
        }
        if (proyectos.includes(newProyectoClean)) {
            return false;
        }
        
        proyectos[index] = newProyectoClean;
        proyectos.sort();
        await db.ref(`empresas/${empresaClean}`).set(proyectos);
        console.log(`✅ Projekt "${oldProyecto}" har bytt namn till "${newProyectoClean}"`);
        
        if (onEmpresasChangedCallback) {
            await onEmpresasChangedCallback();
        }
        return true;
    } catch (error) {
        console.error('Fel vid redigering av projekt:', error);
        return false;
    }
}

// Ta bort ett företag från Firebase
async function eliminarEmpresa(empresa) {
    if (!empresa) {
        return false;
    }
    if (!db) return false;
    try {
        await db.ref(`empresas/${empresa}`).remove();
        console.log(`✅ Företag "${empresa}" har tagits bort`);
        
        if (onEmpresasChangedCallback) {
            await onEmpresasChangedCallback();
        }
        return true;
    } catch (error) {
        console.error('Fel vid borttagning av företag:', error);
        return false;
    }
}

// Ta bort ett projekt från Firebase
async function eliminarProyecto(empresa, proyecto) {
    if (!empresa || !proyecto) {
        return false;
    }
    if (!db) return false;
    try {
        const empresaClean = empresa.trim();
        const snapshot = await db.ref(`empresas/${empresaClean}`).once('value');
        let proyectos = snapshot.val() || [];
        
        if (!Array.isArray(proyectos)) {
            proyectos = [];
        }
        
        const index = proyectos.indexOf(proyecto);
        if (index === -1) {
            return false;
        }
        
        proyectos.splice(index, 1);
        await db.ref(`empresas/${empresaClean}`).set(proyectos);
        console.log(`✅ Projekt "${proyecto}" har tagits bort från ${empresaClean}`);
        
        if (onEmpresasChangedCallback) {
            await onEmpresasChangedCallback();
        }
        return true;
    } catch (error) {
        console.error('Fel vid borttagning av projekt:', error);
        return false;
    }
}

// Filtrera företag baserat på sökterm
async function filtrarEmpresas(searchTerm) {
    const empresas = await getEmpresas();
    if (!searchTerm) {
        return empresas;
    }
    const filtered = [];
    for (let i = 0; i < empresas.length; i++) {
        const emp = empresas[i];
        if (emp.toLowerCase().includes(searchTerm.toLowerCase())) {
            filtered.push(emp);
        }
    }
    return filtered;
}

// Filtrera projekt baserat på sökterm
async function filtrarProyectos(empresa, searchTerm) {
    const proyectos = await getProyectos(empresa);
    if (!searchTerm) {
        return proyectos;
    }
    const filtered = [];
    for (let i = 0; i < proyectos.length; i++) {
        const proj = proyectos[i];
        if (proj.toLowerCase().includes(searchTerm.toLowerCase())) {
            filtered.push(proj);
        }
    }
    return filtered;
}

// ========== MODALT FÖNSTER FÖR HANTERING AV FÖRETAG OCH PROJEKT ==========
function mostrarModalGestion(onCloseCallback) {
    // Skapa modal-elementet
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        backdrop-filter: blur(3px);
    `;
    
    // Funktion för att rendera listan över företag och projekt
    const renderLista = async () => {
        const empresas = await getEmpresas();
        let html = `<div style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">`;
        
        if (empresas.length === 0) {
            html += `<div style="text-align:center; padding:2rem; color:#999;">Inga företag har lagts till än.</div>`;
        }
        
        for (let i = 0; i < empresas.length; i++) {
            const emp = empresas[i];
            const proyectos = await getProyectos(emp);
            html += `
                <div style="margin-bottom: 1rem; border: 1px solid #e2edf5; border-radius: 0.8rem; padding: 0.8rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong><i class="fas fa-building"></i> ${escapeHtml(emp)}</strong>
                        <div>
                            <button class="edit-empresa-btn" data-emp="${escapeHtml(emp)}" style="background: #eef3fc; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; margin-right: 0.3rem;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-empresa-btn" data-emp="${escapeHtml(emp)}" style="background: #fee2e2; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; color: #b91c2c;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div style="margin-left: 1rem;">
                        <div style="font-size:0.8rem; color:#4a6f8f; margin-bottom: 0.3rem;">Projekt:</div>
                        <ul style="margin-left: 1.5rem;">
            `;
            if (proyectos.length === 0) {
                html += `<li style="color:#999;">Inga projekt</li>`;
            } else {
                for (let j = 0; j < proyectos.length; j++) {
                    const proj = proyectos[j];
                    html += `
                        <li style="margin-bottom: 0.3rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>📁 ${escapeHtml(proj)}</span>
                            <div>
                                <button class="edit-proyecto-btn" data-emp="${escapeHtml(emp)}" data-proj="${escapeHtml(proj)}" style="background: #eef3fc; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-proyecto-btn" data-emp="${escapeHtml(emp)}" data-proj="${escapeHtml(proj)}" style="background: #fee2e2; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem; color:#b91c2c;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </li>
                    `;
                }
            }
            html += `
                        </ul>
                        <button class="add-proyecto-btn" data-emp="${escapeHtml(emp)}" style="margin-top: 0.5rem; background: #e2e8f0; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size:0.7rem;">
                            <i class="fas fa-plus"></i> Lägg till projekt
                        </button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        html += `<div style="display: flex; justify-content: space-between; gap: 1rem;">
                    <button id="addEmpresaModalBtn" style="background: #2c7cb6; color: white; border: none; padding: 0.6rem 1rem; border-radius: 2rem; flex:1;">
                        <i class="fas fa-plus-circle"></i> Nytt företag
                    </button>
                    <button id="closeModalBtn" style="background: #e2e8f0; border: none; padding: 0.6rem 1rem; border-radius: 2rem;">
                        Stäng
                    </button>
                </div>`;
        
        const contentDiv = modal.querySelector('.modal-content');
        if (contentDiv) {
            contentDiv.innerHTML = html;
        }
        
        // Bind events för edit-empresa knappar
        const editEmpresaBtns = modal.querySelectorAll('.edit-empresa-btn');
        for (let i = 0; i < editEmpresaBtns.length; i++) {
            const btn = editEmpresaBtns[i];
            btn.addEventListener('click', async function() {
                const oldName = btn.getAttribute('data-emp');
                const newName = prompt("Nytt företagsnamn:", oldName);
                if (newName && newName !== oldName) {
                    const success = await editarEmpresa(oldName, newName);
                    if (success) {
                        await renderLista();
                        if (onCloseCallback) {
                            onCloseCallback();
                        }
                    } else {
                        alert("Kunde inte ändra. Namnet kanske redan finns.");
                    }
                }
            });
        }
        
        // Bind events för delete-empresa knappar
        const deleteEmpresaBtns = modal.querySelectorAll('.delete-empresa-btn');
        for (let i = 0; i < deleteEmpresaBtns.length; i++) {
            const btn = deleteEmpresaBtns[i];
            btn.addEventListener('click', async function() {
                const emp = btn.getAttribute('data-emp');
                if (confirm('Ta bort företaget "' + emp + '" och alla dess projekt?')) {
                    await eliminarEmpresa(emp);
                    await renderLista();
                    if (onCloseCallback) {
                        onCloseCallback();
                    }
                }
            });
        }
        
        // Bind events för edit-proyecto knappar
        const editProyectoBtns = modal.querySelectorAll('.edit-proyecto-btn');
        for (let i = 0; i < editProyectoBtns.length; i++) {
            const btn = editProyectoBtns[i];
            btn.addEventListener('click', async function() {
                const emp = btn.getAttribute('data-emp');
                const oldProj = btn.getAttribute('data-proj');
                const newProj = prompt("Nytt projektnamn:", oldProj);
                if (newProj && newProj !== oldProj) {
                    const success = await editarProyecto(emp, oldProj, newProj);
                    if (success) {
                        await renderLista();
                        if (onCloseCallback) {
                            onCloseCallback();
                        }
                    } else {
                        alert("Kunde inte ändra. Projektet kanske redan finns.");
                    }
                }
            });
        }
        
        // Bind events för delete-proyecto knappar
        const deleteProyectoBtns = modal.querySelectorAll('.delete-proyecto-btn');
        for (let i = 0; i < deleteProyectoBtns.length; i++) {
            const btn = deleteProyectoBtns[i];
            btn.addEventListener('click', async function() {
                const emp = btn.getAttribute('data-emp');
                const proj = btn.getAttribute('data-proj');
                if (confirm('Ta bort projektet "' + proj + '" från ' + emp + '?')) {
                    await eliminarProyecto(emp, proj);
                    await renderLista();
                    if (onCloseCallback) {
                        onCloseCallback();
                    }
                }
            });
        }
        
        // Bind events för add-proyecto knappar
        const addProyectoBtns = modal.querySelectorAll('.add-proyecto-btn');
        for (let i = 0; i < addProyectoBtns.length; i++) {
            const btn = addProyectoBtns[i];
            btn.addEventListener('click', async function() {
                const emp = btn.getAttribute('data-emp');
                const newProj = prompt("Nytt projektnamn:");
                if (newProj) {
                    const success = await agregarProyecto(emp, newProj);
                    if (success) {
                        await renderLista();
                        if (onCloseCallback) {
                            onCloseCallback();
                        }
                    } else {
                        alert("Kunde inte lägga till projekt. Det kanske redan finns.");
                    }
                }
            });
        }
        
        // Bind events för add-empresa knapp
        const addEmpresaBtn = modal.querySelector('#addEmpresaModalBtn');
        if (addEmpresaBtn) {
            addEmpresaBtn.addEventListener('click', async function() {
                const newEmp = prompt("Nytt företagsnamn:");
                if (newEmp) {
                    const success = await agregarEmpresa(newEmp);
                    if (success) {
                        await renderLista();
                        if (onCloseCallback) {
                            onCloseCallback();
                        }
                    } else {
                        alert("Företaget finns redan eller ogiltigt namn.");
                    }
                }
            });
        }
        
        // Bind events för close knapp
        const closeBtn = modal.querySelector('#closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.remove();
                if (onCloseCallback) {
                    onCloseCallback();
                }
            });
        }
    };
    
    modal.innerHTML = '<div class="modal-content" style="background: white; border-radius: 1.5rem; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; padding: 1.5rem;"></div>';
    document.body.appendChild(modal);
    renderLista();
}

// Hjälpfunktion för att escapeta HTML-kod
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Funktion för att ladda om dropdowns (anropas från index.html vid behov)
async function reloadEmpresasDropdown() {
    if (onEmpresasChangedCallback) {
        await onEmpresasChangedCallback();
    }
}
