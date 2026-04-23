// ============================================
// GESTIÓN DE EMPRESAS Y PROYECTOS
// TODO EN FIREBASE REALTIME DATABASE
// ============================================

// Referencia a la base de datos (se inicializa en index.html)
let dbRef = null;
let currentUserId = "admin"; // Usuario fijo para este sistema

// Inicializar la referencia a Firebase
function initEmpresasProyectos(databaseRef) {
    dbRef = databaseRef;
}

// Obtener todas las empresas desde Firebase
async function getEmpresas() {
    if (!dbRef) return [];
    try {
        const snapshot = await dbRef.ref(`empresas/${currentUserId}`).once('value');
        const data = snapshot.val();
        return data ? Object.keys(data).sort() : [];
    } catch (error) {
        console.error('Fel vid hämtning av företag:', error);
        return [];
    }
}

// Obtener todos los proyectos desde Firebase
async function getProyectos(empresa) {
    if (!dbRef || !empresa) return [];
    try {
        const snapshot = await dbRef.ref(`empresas/${currentUserId}/${empresa}`).once('value');
        const proyectos = snapshot.val();
        return proyectos ? Object.values(proyectos).sort() : [];
    } catch (error) {
        console.error('Fel vid hämtning av projekt:', error);
        return [];
    }
}

// Obtener todos los proyectos (sin filtrar por empresa)
async function getAllProyectos() {
    if (!dbRef) return [];
    try {
        const empresas = await getEmpresas();
        const todosProyectos = [];
        for (const empresa of empresas) {
            const proyectos = await getProyectos(empresa);
            for (const proyecto of proyectos) {
                todosProyectos.push({ empresa, proyecto });
            }
        }
        return todosProyectos;
    } catch (error) {
        console.error('Fel vid hämtning av alla projekt:', error);
        return [];
    }
}

// Agregar nueva empresa
async function agregarEmpresa(empresa) {
    if (!empresa || empresa.trim() === "") return false;
    try {
        const empresaClean = empresa.trim();
        await dbRef.ref(`empresas/${currentUserId}/${empresaClean}`).set([]);
        console.log(`✅ Företag "${empresaClean}" tillagt`);
        return true;
    } catch (error) {
        console.error('Fel vid tillägg av företag:', error);
        return false;
    }
}

// Agregar proyecto a una empresa
async function agregarProyecto(empresa, proyecto) {
    if (!empresa || !proyecto || proyecto.trim() === "") return false;
    try {
        const empresaClean = empresa.trim();
        const proyectoClean = proyecto.trim();
        const snapshot = await dbRef.ref(`empresas/${currentUserId}/${empresaClean}`).once('value');
        const proyectos = snapshot.val() || [];
        if (proyectos.includes(proyectoClean)) return false;
        proyectos.push(proyectoClean);
        proyectos.sort();
        await dbRef.ref(`empresas/${currentUserId}/${empresaClean}`).set(proyectos);
        console.log(`✅ Projekt "${proyectoClean}" tillagt till ${empresaClean}`);
        return true;
    } catch (error) {
        console.error('Fel vid tillägg av projekt:', error);
        return false;
    }
}

// Editar nombre de empresa
async function editarEmpresa(oldName, newName) {
    if (!oldName || !newName || newName.trim() === "") return false;
    if (oldName === newName.trim()) return true;
    try {
        const newNameClean = newName.trim();
        const snapshot = await dbRef.ref(`empresas/${currentUserId}/${oldName}`).once('value');
        const proyectos = snapshot.val() || [];
        await dbRef.ref(`empresas/${currentUserId}/${newNameClean}`).set(proyectos);
        await dbRef.ref(`empresas/${currentUserId}/${oldName}`).remove();
        console.log(`✅ Företag "${oldName}" ändrat till "${newNameClean}"`);
        return true;
    } catch (error) {
        console.error('Fel vid redigering av företag:', error);
        return false;
    }
}

// Editar nombre de proyecto
async function editarProyecto(empresa, oldProyecto, newProyecto) {
    if (!empresa || !oldProyecto || !newProyecto || newProyecto.trim() === "") return false;
    if (oldProyecto === newProyecto.trim()) return true;
    try {
        const empresaClean = empresa.trim();
        const newProyectoClean = newProyecto.trim();
        const snapshot = await dbRef.ref(`empresas/${currentUserId}/${empresaClean}`).once('value');
        const proyectos = snapshot.val() || [];
        const index = proyectos.indexOf(oldProyecto);
        if (index === -1) return false;
        if (proyectos.includes(newProyectoClean)) return false;
        proyectos[index] = newProyectoClean;
        proyectos.sort();
        await dbRef.ref(`empresas/${currentUserId}/${empresaClean}`).set(proyectos);
        console.log(`✅ Projekt "${oldProyecto}" ändrat till "${newProyectoClean}"`);
        return true;
    } catch (error) {
        console.error('Fel vid redigering av projekt:', error);
        return false;
    }
}

// Eliminar empresa
async function eliminarEmpresa(empresa) {
    if (!empresa) return false;
    try {
        await dbRef.ref(`empresas/${currentUserId}/${empresa}`).remove();
        console.log(`✅ Företag "${empresa}" borttaget`);
        return true;
    } catch (error) {
        console.error('Fel vid borttagning av företag:', error);
        return false;
    }
}

// Eliminar proyecto
async function eliminarProyecto(empresa, proyecto) {
    if (!empresa || !proyecto) return false;
    try {
        const empresaClean = empresa.trim();
        const snapshot = await dbRef.ref(`empresas/${currentUserId}/${empresaClean}`).once('value');
        const proyectos = snapshot.val() || [];
        const index = proyectos.indexOf(proyecto);
        if (index === -1) return false;
        proyectos.splice(index, 1);
        await dbRef.ref(`empresas/${currentUserId}/${empresaClean}`).set(proyectos);
        console.log(`✅ Projekt "${proyecto}" borttaget från ${empresaClean}`);
        return true;
    } catch (error) {
        console.error('Fel vid borttagning av projekt:', error);
        return false;
    }
}

// Filtrera företag (sökning)
async function filtrarEmpresas(searchTerm) {
    const empresas = await getEmpresas();
    if (!searchTerm) return empresas;
    return empresas.filter(emp => emp.toLowerCase().includes(searchTerm.toLowerCase()));
}

// Filtrera projekt (sökning)
async function filtrarProyectos(empresa, searchTerm) {
    const proyectos = await getProyectos(empresa);
    if (!searchTerm) return proyectos;
    return proyectos.filter(proj => proj.toLowerCase().includes(searchTerm.toLowerCase()));
}

// ========== MODAL FÖR HANTERING ==========
function mostrarModalGestion(onCloseCallback) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); display: flex; justify-content: center;
        align-items: center; z-index: 2000; backdrop-filter: blur(3px);
    `;
    
    const renderLista = async () => {
        const empresas = await getEmpresas();
        let html = `<div style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">`;
        
        for (const emp of empresas) {
            const proyectos = await getProyectos(emp);
            html += `
                <div style="margin-bottom: 1rem; border: 1px solid #e2edf5; border-radius: 0.8rem; padding: 0.8rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong><i class="fas fa-building"></i> ${escapeHtml(emp)}</strong>
                        <div>
                            <button class="edit-empresa-btn" data-emp="${escapeHtml(emp)}" style="background: #eef3fc; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; margin-right: 0.3rem;"><i class="fas fa-edit"></i></button>
                            <button class="delete-empresa-btn" data-emp="${escapeHtml(emp)}" style="background: #fee2e2; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; color: #b91c2c;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div style="margin-left: 1rem;">
                        <div style="font-size:0.8rem; color:#4a6f8f; margin-bottom: 0.3rem;">Projekt:</div>
                        <ul style="margin-left: 1.5rem;">
            `;
            for (const proj of proyectos) {
                html += `
                    <li style="margin-bottom: 0.3rem; display: flex; justify-content: space-between; align-items: center;">
                        <span>📁 ${escapeHtml(proj)}</span>
                        <div>
                            <button class="edit-proyecto-btn" data-emp="${escapeHtml(emp)}" data-proj="${escapeHtml(proj)}" style="background: #eef3fc; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                            <button class="delete-proyecto-btn" data-emp="${escapeHtml(emp)}" data-proj="${escapeHtml(proj)}" style="background: #fee2e2; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                        </div>
                    </li>
                `;
            }
            html += `
                        </ul>
                        <button class="add-proyecto-btn" data-emp="${escapeHtml(emp)}" style="margin-top: 0.5rem; background: #e2e8f0; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size:0.7rem;"><i class="fas fa-plus"></i> Lägg till projekt</button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        html += `<div style="display: flex; justify-content: space-between; gap: 1rem;">
                    <button id="addEmpresaModalBtn" style="background: #2c7cb6; color: white; border: none; padding: 0.6rem 1rem; border-radius: 2rem; flex:1;"><i class="fas fa-plus-circle"></i> Nytt företag</button>
                    <button id="closeModalBtn" style="background: #e2e8f0; border: none; padding: 0.6rem 1rem; border-radius: 2rem;">Stäng</button>
                </div>`;
        
        const contentDiv = modal.querySelector('.modal-content');
        if (contentDiv) contentDiv.innerHTML = html;
        
        // Bind events
        modal.querySelectorAll('.edit-empresa-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const oldName = btn.getAttribute('data-emp');
                const newName = prompt("Nytt företagsnamn:", oldName);
                if (newName && newName !== oldName) {
                    const success = await editarEmpresa(oldName, newName);
                    if (success) {
                        await renderLista();
                        if (onCloseCallback) onCloseCallback();
                    } else {
                        alert("Kunde inte ändra. Namnet kanske redan finns.");
                    }
                }
            });
        });
        
        modal.querySelectorAll('.delete-empresa-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const emp = btn.getAttribute('data-emp');
                if (confirm(`Ta bort företaget "${emp}" och alla dess projekt?`)) {
                    await eliminarEmpresa(emp);
                    await renderLista();
                    if (onCloseCallback) onCloseCallback();
                }
            });
        });
        
        modal.querySelectorAll('.edit-proyecto-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const emp = btn.getAttribute('data-emp');
                const oldProj = btn.getAttribute('data-proj');
                const newProj = prompt("Nytt projektnamn:", oldProj);
                if (newProj && newProj !== oldProj) {
                    const success = await editarProyecto(emp, oldProj, newProj);
                    if (success) {
                        await renderLista();
                        if (onCloseCallback) onCloseCallback();
                    } else {
                        alert("Kunde inte ändra. Projektet kanske redan finns.");
                    }
                }
            });
        });
        
        modal.querySelectorAll('.delete-proyecto-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const emp = btn.getAttribute('data-emp');
                const proj = btn.getAttribute('data-proj');
                if (confirm(`Ta bort projektet "${proj}" från ${emp}?`)) {
                    await eliminarProyecto(emp, proj);
                    await renderLista();
                    if (onCloseCallback) onCloseCallback();
                }
            });
        });
        
        modal.querySelectorAll('.add-proyecto-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const emp = btn.getAttribute('data-emp');
                const newProj = prompt("Nytt projektnamn:");
                if (newProj) {
                    const success = await agregarProyecto(emp, newProj);
                    if (success) {
                        await renderLista();
                        if (onCloseCallback) onCloseCallback();
                    } else {
                        alert("Kunde inte lägga till projekt. Det kanske redan finns.");
                    }
                }
            });
        });
        
        modal.querySelector('#addEmpresaModalBtn').addEventListener('click', async () => {
            const newEmp = prompt("Nytt företagsnamn:");
            if (newEmp) {
                const success = await agregarEmpresa(newEmp);
                if (success) {
                    await renderLista();
                    if (onCloseCallback) onCloseCallback();
                } else {
                    alert("Företaget finns redan eller ogiltigt namn.");
                }
            }
        });
        
        modal.querySelector('#closeModalBtn').addEventListener('click', () => {
            modal.remove();
            if (onCloseCallback) onCloseCallback();
        });
    };
    
    modal.innerHTML = `<div class="modal-content" style="background: white; border-radius: 1.5rem; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; padding: 1.5rem;"></div>`;
    document.body.appendChild(modal);
    renderLista();
}

// Helper för escaping
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}
