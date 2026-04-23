// ============================================
// GESTIÓN DE EMPRESAS Y PROYECTOS v2
// ============================================

const STORAGE_KEY = "empresas_proyectos_v2";

// Datos por defecto
const defaultData = {
    "Geomira": ["Kaj8", "Hamnen", "Brobygge"],
    "NCC": ["Projekt A", "Projekt B"],
    "Skanska": ["Västra Staden", "Norra Länken"]
};

// Cargar datos desde localStorage
function loadEmpresasProyectos() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) {
            console.error("Fel vid laddning:", e);
            return { ...defaultData };
        }
    }
    return { ...defaultData };
}

// Guardar datos en localStorage
function saveEmpresasProyectos(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Obtener lista de empresas
function getEmpresas() {
    const data = loadEmpresasProyectos();
    return Object.keys(data).sort();
}

// Obtener proyectos para una empresa específica
function getProyectos(empresa) {
    const data = loadEmpresasProyectos();
    if (!data[empresa]) return [];
    return [...data[empresa]].sort();
}

// Agregar nueva empresa (con opción de proyectos iniciales)
function agregarEmpresa(empresa, proyectos = []) {
    if (!empresa || empresa.trim() === "") return false;
    const data = loadEmpresasProyectos();
    const empresaClean = empresa.trim();
    if (data[empresaClean]) return false; // ya existe
    data[empresaClean] = [...proyectos];
    saveEmpresasProyectos(data);
    return true;
}

// Agregar proyecto a una empresa
function agregarProyecto(empresa, proyecto) {
    if (!empresa || !proyecto || proyecto.trim() === "") return false;
    const data = loadEmpresasProyectos();
    if (!data[empresa]) return false;
    const proyectoClean = proyecto.trim();
    if (data[empresa].includes(proyectoClean)) return false;
    data[empresa].push(proyectoClean);
    data[empresa].sort();
    saveEmpresasProyectos(data);
    return true;
}

// Editar nombre de empresa
function editarEmpresa(oldName, newName) {
    if (!oldName || !newName || newName.trim() === "") return false;
    const data = loadEmpresasProyectos();
    if (!data[oldName]) return false;
    if (oldName === newName.trim()) return true; // sin cambios
    if (data[newName.trim()]) return false; // ya existe
    data[newName.trim()] = data[oldName];
    delete data[oldName];
    saveEmpresasProyectos(data);
    return true;
}

// Editar nombre de proyecto
function editarProyecto(empresa, oldProyecto, newProyecto) {
    if (!empresa || !oldProyecto || !newProyecto || newProyecto.trim() === "") return false;
    const data = loadEmpresasProyectos();
    if (!data[empresa]) return false;
    const index = data[empresa].indexOf(oldProyecto);
    if (index === -1) return false;
    if (oldProyecto === newProyecto.trim()) return true;
    if (data[empresa].includes(newProyecto.trim())) return false;
    data[empresa][index] = newProyecto.trim();
    data[empresa].sort();
    saveEmpresasProyectos(data);
    return true;
}

// Eliminar empresa
function eliminarEmpresa(empresa) {
    const data = loadEmpresasProyectos();
    if (!data[empresa]) return false;
    delete data[empresa];
    saveEmpresasProyectos(data);
    return true;
}

// Eliminar proyecto
function eliminarProyecto(empresa, proyecto) {
    const data = loadEmpresasProyectos();
    if (!data[empresa]) return false;
    const index = data[empresa].indexOf(proyecto);
    if (index === -1) return false;
    data[empresa].splice(index, 1);
    saveEmpresasProyectos(data);
    return true;
}

// Filtrar empresas (búsqueda)
function filtrarEmpresas(searchTerm) {
    const empresas = getEmpresas();
    if (!searchTerm) return empresas;
    return empresas.filter(emp => emp.toLowerCase().includes(searchTerm.toLowerCase()));
}

// Filtrar proyectos (búsqueda)
function filtrarProyectos(empresa, searchTerm) {
    const proyectos = getProyectos(empresa);
    if (!searchTerm) return proyectos;
    return proyectos.filter(proj => proj.toLowerCase().includes(searchTerm.toLowerCase()));
}

// ========== COMPONENTE DE GESTIÓN (MODAL) ==========
function mostrarModalGestion(callback) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); display: flex; justify-content: center;
        align-items: center; z-index: 2000; backdrop-filter: blur(3px);
    `;
    
    const datos = loadEmpresasProyectos();
    
    const renderLista = () => {
        const currentData = loadEmpresasProyectos();
        const empresas = Object.keys(currentData).sort();
        let html = `<div style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">`;
        for (const emp of empresas) {
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
            const proyectos = currentData[emp] || [];
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
        
        // Rebind events
        modal.querySelectorAll('.edit-empresa-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const oldName = btn.getAttribute('data-emp');
                const newName = prompt("Nytt företagsnamn:", oldName);
                if (newName && newName !== oldName) {
                    if (editarEmpresa(oldName, newName)) {
                        mostrarModalGestion(callback);
                    } else {
                        alert("Kunde inte ändra. Namnet kanske redan finns.");
                    }
                }
            });
        });
        
        modal.querySelectorAll('.delete-empresa-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emp = btn.getAttribute('data-emp');
                if (confirm(`Ta bort företaget "${emp}" och alla dess projekt?`)) {
                    eliminarEmpresa(emp);
                    mostrarModalGestion(callback);
                }
            });
        });
        
        modal.querySelectorAll('.edit-proyecto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emp = btn.getAttribute('data-emp');
                const oldProj = btn.getAttribute('data-proj');
                const newProj = prompt("Nytt projektnamn:", oldProj);
                if (newProj && newProj !== oldProj) {
                    if (editarProyecto(emp, oldProj, newProj)) {
                        mostrarModalGestion(callback);
                    } else {
                        alert("Kunde inte ändra. Projektet kanske redan finns.");
                    }
                }
            });
        });
        
        modal.querySelectorAll('.delete-proyecto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emp = btn.getAttribute('data-emp');
                const proj = btn.getAttribute('data-proj');
                if (confirm(`Ta bort projektet "${proj}" från ${emp}?`)) {
                    eliminarProyecto(emp, proj);
                    mostrarModalGestion(callback);
                }
            });
        });
        
        modal.querySelectorAll('.add-proyecto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emp = btn.getAttribute('data-emp');
                const newProj = prompt("Nytt projektnamn:");
                if (newProj) {
                    if (agregarProyecto(emp, newProj)) {
                        mostrarModalGestion(callback);
                    } else {
                        alert("Kunde inte lägga till projekt. Det kanske redan finns.");
                    }
                }
            });
        });
        
        modal.querySelector('#addEmpresaModalBtn').addEventListener('click', () => {
            const newEmp = prompt("Nytt företagsnamn:");
            if (newEmp) {
                if (agregarEmpresa(newEmp, [])) {
                    mostrarModalGestion(callback);
                } else {
                    alert("Företaget finns redan eller ogiltigt namn.");
                }
            }
        });
        
        modal.querySelector('#closeModalBtn').addEventListener('click', () => {
            modal.remove();
            if (callback) callback();
        });
    };
    
    modal.innerHTML = `<div class="modal-content" style="background: white; border-radius: 1.5rem; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; padding: 1.5rem;"></div>`;
    document.body.appendChild(modal);
    renderLista();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}