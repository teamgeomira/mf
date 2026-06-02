// folder-manager.js - Versión adaptada para tu estructura jerárquica
// Agregar al final del <body> en index.html y viewer.html

(function() {
    // ==================== DETECTAR MODO ====================
    const isAdminMode = document.querySelector('#laddaUppBtn, .dropzone') !== null;
    
    if (isAdminMode) {
        initAdminFolderSystem();
    } else {
        initViewerFolderSystem();
    }
    
    // ==================== ADMIN MODE ====================
    async function initAdminFolderSystem() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAdminUI);
        } else {
            setupAdminUI();
        }
    }
    
    async function setupAdminUI() {
        // Esperar a que existan los elementos necesarios
        const foretagInput = document.getElementById('foretagValt');
        if (!foretagInput) {
            setTimeout(setupAdminUI, 500);
            return;
        }
        
        // Encontrar dónde insertar el panel de carpetas
        const befintligaKort = document.getElementById('befintligaFilerKort');
        if (!befintligaKort) return;
        
        // Crear panel de carpetas si no existe
        let folderPanel = document.getElementById('folderManagerPanel');
        if (!folderPanel) {
            folderPanel = document.createElement('div');
            folderPanel.id = 'folderManagerPanel';
            folderPanel.className = 'card';
            folderPanel.style.marginTop = '1.5rem';
            folderPanel.style.background = '#ffffff';
            folderPanel.style.border = '2px solid #e2edf5';
            folderPanel.innerHTML = `
                <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-folder-plus" style="color:#2c7cb6;"></i> 
                    📁 Hantera mappar inom denna kod
                    <span style="font-size: 0.7rem; background:#eef3fc; padding: 0.2rem 0.6rem; border-radius: 1rem; color:#2c7cb6;">Organisera filer</span>
                </h3>
                
                <div style="display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: flex-end;">
                    <div style="flex: 2; min-width: 200px;">
                        <label style="display: block; font-weight: 600; font-size: 0.75rem; margin-bottom: 0.3rem;">
                            <i class="fas fa-folder"></i> Ny mapp
                        </label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="newFolderName" placeholder="t.ex. Ritningar, Kontrakt, Bilder, PM" 
                                   style="flex: 1; padding: 0.6rem; border-radius: 0.8rem; border: 2px solid #cbdde9;">
                            <button id="createFolderBtn" class="btn-primary" style="padding: 0.6rem 1rem;">
                                <i class="fas fa-plus-circle"></i> Skapa mapp
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="foldersListContainer" style="margin-top: 1rem;">
                    <div style="text-align: center; padding: 1rem; color: #9bb3c9;">
                        <i class="fas fa-spinner fa-pulse"></i> Välj ett företag, projekt, leverantör, del och kod för att hantera mappar...
                    </div>
                </div>
            `;
            
            // Insertar después del card de archivos existentes
            befintligaKort.parentNode.insertBefore(folderPanel, befintligaKort.nextSibling);
        }
        
        // Escuchar cambios en los selectores
        const foretagValt = document.getElementById('foretagValt');
        const projektValt = document.getElementById('projektValt');
        const leverantorValt = document.getElementById('leverantorValt');
        const delValt = document.getElementById('delValt');
        const kodInput = document.getElementById('kodInput');
        
        const updateFolders = async () => {
            const foretag = foretagValt?.value;
            const projekt = projektValt?.value;
            const leverantor = leverantorValt?.value;
            const del = delValt?.value;
            const kod = kodInput?.value.trim().toUpperCase();
            
            if (foretag && projekt && leverantor && del && kod) {
                await loadFoldersForHierarchy(foretag, projekt, leverantor, del, kod);
            } else {
                const container = document.getElementById('foldersListContainer');
                if (container) {
                    container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #9bb3c9;"><i class="fas fa-info-circle"></i> Välj först ett företag, projekt, leverantör, del och kod</div>';
                }
            }
        };
        
        foretagValt?.addEventListener('change', updateFolders);
        projektValt?.addEventListener('change', updateFolders);
        leverantorValt?.addEventListener('change', updateFolders);
        delValt?.addEventListener('change', updateFolders);
        kodInput?.addEventListener('input', debounce(updateFolders, 500));
        
        // Botón crear mapp
        const createBtn = document.getElementById('createFolderBtn');
        const newFolderInput = document.getElementById('newFolderName');
        
        createBtn?.addEventListener('click', async () => {
            const foretag = foretagValt?.value;
            const projekt = projektValt?.value;
            const leverantor = leverantorValt?.value;
            const del = delValt?.value;
            const kod = kodInput?.value.trim().toUpperCase();
            const folderName = newFolderInput?.value.trim();
            
            if (!foretag || !projekt || !leverantor || !del || !kod) {
                showToastMsg('❌ Välj först företag, projekt, leverantör, del och kod', true);
                return;
            }
            if (!folderName) {
                showToastMsg('❌ Ange ett mappnamn', true);
                return;
            }
            
            const success = await createFolderInHierarchy(foretag, projekt, leverantor, del, kod, folderName);
            if (success) {
                newFolderInput.value = '';
                await loadFoldersForHierarchy(foretag, projekt, leverantor, del, kod);
            }
        });
        
        // Intentar cargar si ya hay valores
        await updateFolders();
        
        // Agregar botón de subida a mapp en el área de dropzone
        addFolderUploadButton();
    }
    
    async function loadFoldersForHierarchy(foretag, projekt, leverantor, del, kod) {
        if (!window.database) return;
        
        const path = getFolderStoragePath(foretag, projekt, leverantor, del, kod);
        const container = document.getElementById('foldersListContainer');
        if (!container) return;
        
        try {
            const snapshot = await window.database.ref(path).once('value');
            const folders = snapshot.val() || {};
            const folderNames = Object.keys(folders);
            
            if (folderNames.length === 0) {
                container.innerHTML = `
                    <div style="background: #fef3c7; padding: 1rem; border-radius: 1rem; text-align: center;">
                        <i class="fas fa-folder-open fa-2x" style="color:#e67e22;"></i>
                        <p style="margin-top: 0.5rem;">Inga mappar ännu för denna kod.</p>
                        <small>Skapa din första mapp med formuläret ovan</small>
                    </div>
                `;
                return;
            }
            
            let html = `<div style="display: flex; flex-direction: column; gap: 0.8rem;">`;
            for (const [folderId, folderData] of Object.entries(folders)) {
                const folderName = folderData.name || folderId;
                const fileCount = folderData.files ? Object.keys(folderData.files).length : 0;
                const createdAt = folderData.createdAt ? new Date(folderData.createdAt).toLocaleDateString('sv-SE') : '';
                
                html += `
                    <div style="background: #f8fafc; border-radius: 1rem; padding: 0.8rem; border: 1px solid #e2edf5;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                            <div>
                                <i class="fas fa-folder" style="color: #e67e22; font-size: 1.2rem;"></i>
                                <strong style="margin-left: 0.5rem;">📁 ${escapeHtml(folderName)}</strong>
                                <span style="font-size: 0.7rem; color: #6c8dab; margin-left: 0.5rem;">(${fileCount} filer)</span>
                                ${createdAt ? `<span style="font-size: 0.65rem; color: #9bb3c9; margin-left: 0.5rem;">skapad ${createdAt}</span>` : ''}
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-primary upload-to-folder-btn" data-folder="${escapeHtml(folderName)}" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
                                    <i class="fas fa-upload"></i> Ladda upp filer
                                </button>
                                <button class="btn-secondary delete-folder-btn" data-folder="${escapeHtml(folderName)}" style="padding: 0.3rem 0.8rem; font-size: 0.75rem; background: #fee2e2; color: #b91c2c;">
                                    <i class="fas fa-trash"></i> Ta bort mapp
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            html += `</div>`;
            container.innerHTML = html;
            
            // Event listeners
            document.querySelectorAll('.upload-to-folder-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const folderName = btn.dataset.folder;
                    uploadFilesToFolder(foretag, projekt, leverantor, del, kod, folderName);
                });
            });
            
            document.querySelectorAll('.delete-folder-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const folderName = btn.dataset.folder;
                    if (confirm(`Ta bort mappen "${folderName}" och alla filer i den?`)) {
                        await deleteFolderInHierarchy(foretag, projekt, leverantor, del, kod, folderName);
                        await loadFoldersForHierarchy(foretag, projekt, leverantor, del, kod);
                        showToastMsg(`🗑️ Mappen "${folderName}" borttagen`);
                    }
                });
            });
            
        } catch (error) {
            console.error('Fel vid laddning av mappar:', error);
            container.innerHTML = `<div style="color: #e74c3c; padding: 1rem;">❌ Kunde inte ladda mappar</div>`;
        }
    }
    
    async function createFolderInHierarchy(foretag, projekt, leverantor, del, kod, folderName) {
        const path = getFolderStoragePath(foretag, projekt, leverantor, del, kod);
        const folderId = sanitizeKey(folderName);
        
        try {
            const snapshot = await window.database.ref(`${path}/${folderId}`).once('value');
            if (snapshot.exists()) {
                showToastMsg(`❌ Mappen "${folderName}" finns redan`, true);
                return false;
            }
            
            await window.database.ref(`${path}/${folderId}`).set({
                name: folderName,
                createdAt: new Date().toISOString(),
                files: {}
            });
            
            showToastMsg(`✅ Mappen "${folderName}" skapades`);
            return true;
        } catch (error) {
            console.error(error);
            showToastMsg(`❌ Kunde inte skapa mapp`, true);
            return false;
        }
    }
    
    async function deleteFolderInHierarchy(foretag, projekt, leverantor, del, kod, folderName) {
        const path = getFolderStoragePath(foretag, projekt, leverantor, del, kod);
        const folderId = sanitizeKey(folderName);
        
        try {
            await window.database.ref(`${path}/${folderId}`).remove();
            return true;
        } catch (error) {
            console.error(error);
            showToastMsg(`❌ Kunde inte ta bort mapp`, true);
            return false;
        }
    }
    
    async function uploadFilesToFolder(foretag, projekt, leverantor, del, kod, folderName) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        
        fileInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            showToastMsg(`📤 Laddar upp ${files.length} fil(er) till mappen "${folderName}"...`);
            
            let successCount = 0;
            for (const file of files) {
                const success = await uploadFileToHierarchyFolder(file, foretag, projekt, leverantor, del, kod, folderName);
                if (success) successCount++;
            }
            
            showToastMsg(`✅ ${successCount} av ${files.length} filer uppladdade till "${folderName}"`);
            
            // Uppdatera visningen av mappar
            await loadFoldersForHierarchy(foretag, projekt, leverantor, del, kod);
            
            // Uppdatera även befintliga filer
            if (typeof laddaBefintligaFiler === 'function') {
                setTimeout(() => laddaBefintligaFiler(), 1000);
            }
        };
        
        fileInput.click();
    }
    
    async function uploadFileToHierarchyFolder(file, foretag, projekt, leverantor, del, kod, folderName) {
        // Använd Cloudinary för uppladdning
        const formData = new FormData();
        const timestamp = Date.now();
        const safeFilename = file.name.replace(/[^a-zA-Z0-9åäöÅÄÖ.\-]/g, '_');
        const folderPath = `underlag/${sanitizeKey(foretag)}/${sanitizeKey(projekt)}/${sanitizeKey(leverantor)}/${sanitizeKey(del)}/${sanitizeKey(kod)}/${sanitizeKey(folderName)}`;
        const publicId = `${folderPath}/${timestamp}_${safeFilename}`;
        
        formData.append('file', file);
        formData.append('upload_preset', 'team01');
        formData.append('public_id', publicId);
        formData.append('resource_type', 'auto');
        
        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/dc1zqri3o/auto/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
            
            const downloadUrl = data.secure_url + (data.secure_url.includes('?') ? '&fl_attachment' : '?fl_attachment');
            
            // Spara referensen i folder-strukturen
            const storagePath = getFolderStoragePath(foretag, projekt, leverantor, del, kod);
            const folderId = sanitizeKey(folderName);
            const fileId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            await window.database.ref(`${storagePath}/${folderId}/files/${fileId}`).set({
                filename: file.name,
                size: file.size,
                date: new Date().toISOString(),
                previewUrl: data.secure_url,
                downloadUrl: downloadUrl,
                folder: folderName,
                originalCode: kod
            });
            
            return true;
        } catch (error) {
            console.error('Upload error:', error);
            showToastMsg(`❌ Misslyckades: ${file.name}`, true);
            return false;
        }
    }
    
    function addFolderUploadButton() {
        const dropzone = document.querySelector('.dropzone');
        if (!dropzone || document.getElementById('folderUploadBtn')) return;
        
        const folderBtn = document.createElement('button');
        folderBtn.id = 'folderUploadBtn';
        folderBtn.type = 'button';
        folderBtn.className = 'btn-secondary';
        folderBtn.style.cssText = 'margin: 0.5rem; padding: 0.5rem 1rem; background: #e67e22; color: white;';
        folderBtn.innerHTML = '<i class="fas fa-folder-open"></i> 📁 Välj mapp (bevarar struktur)';
        
        const folderInput = document.createElement('input');
        folderInput.type = 'file';
        folderInput.id = 'folderStructureInput';
        folderInput.multiple = true;
        folderInput.webkitdirectory = true;
        folderInput.directory = true;
        folderInput.style.display = 'none';
        
        folderBtn.onclick = () => folderInput.click();
        
        folderInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            const foretag = document.getElementById('foretagValt')?.value;
            const projekt = document.getElementById('projektValt')?.value;
            const leverantor = document.getElementById('leverantorValt')?.value;
            const del = document.getElementById('delValt')?.value;
            const kod = document.getElementById('kodInput')?.value.trim().toUpperCase();
            
            if (!foretag || !projekt || !leverantor || !del || !kod) {
                showToastMsg('❌ Välj först företag, projekt, leverantör, del och kod', true);
                return;
            }
            
            // Extrahera mappnamn från första filens webkitRelativePath
            const firstFilePath = files[0].webkitRelativePath;
            const folderNameFromPath = firstFilePath.split('/')[0];
            
            if (folderNameFromPath) {
                // Fråga användaren om mappnamn
                const targetFolder = prompt(`Välj mapp att ladda upp till:\n\nMapp från dator: "${folderNameFromPath}"\n\nSkriv mappnamnet där filerna ska sparas (eller klicka OK för samma namn):`, folderNameFromPath);
                if (targetFolder !== null) {
                    const finalFolder = targetFolder.trim() || folderNameFromPath;
                    
                    // Skapa mappen först om den inte finns
                    await createFolderInHierarchy(foretag, projekt, leverantor, del, kod, finalFolder);
                    
                    let successCount = 0;
                    for (const file of files) {
                        const relativePath = file.webkitRelativePath;
                        const subPath = relativePath.split('/').slice(1).join('/'); // Mappstruktur inuti
                        const success = await uploadFileToHierarchyFolderWithPath(file, foretag, projekt, leverantor, del, kod, finalFolder, subPath);
                        if (success) successCount++;
                    }
                    
                    showToastMsg(`✅ ${successCount} av ${files.length} filer uppladdade till "${finalFolder}"`);
                    await loadFoldersForHierarchy(foretag, projekt, leverantor, del, kod);
                    if (typeof laddaBefintligaFiler === 'function') laddaBefintligaFiler();
                }
            }
            
            folderInput.value = '';
        });
        
        const existingBtns = dropzone.querySelectorAll('.btn-secondary');
        if (existingBtns.length > 0) {
            dropzone.insertBefore(folderBtn, existingBtns[0]);
        } else {
            const p = dropzone.querySelector('p');
            if (p) p.insertAdjacentElement('afterend', folderBtn);
            else dropzone.appendChild(folderBtn);
        }
        dropzone.appendChild(folderInput);
    }
    
    async function uploadFileToHierarchyFolderWithPath(file, foretag, projekt, leverantor, del, kod, folderName, subPath) {
        const formData = new FormData();
        const timestamp = Date.now();
        const safeFilename = file.name.replace(/[^a-zA-Z0-9åäöÅÄÖ.\-]/g, '_');
        const subFolder = subPath ? subPath.replace(/[^a-zA-Z0-9åäöÅÄÖ/\\-]/g, '_').substring(0, file.name.length > 0 ? file.name.length : 0) : '';
        const fullFolderPath = `underlag/${sanitizeKey(foretag)}/${sanitizeKey(projekt)}/${sanitizeKey(leverantor)}/${sanitizeKey(del)}/${sanitizeKey(kod)}/${sanitizeKey(folderName)}${subFolder ? '/' + subFolder : ''}`;
        const publicId = `${fullFolderPath}/${timestamp}_${safeFilename}`;
        
        formData.append('file', file);
        formData.append('upload_preset', 'team01');
        formData.append('public_id', publicId);
        formData.append('resource_type', 'auto');
        
        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/dc1zqri3o/auto/upload`, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error('Upload failed');
            
            const downloadUrl = data.secure_url + (data.secure_url.includes('?') ? '&fl_attachment' : '?fl_attachment');
            
            const storagePath = getFolderStoragePath(foretag, projekt, leverantor, del, kod);
            const folderId = sanitizeKey(folderName);
            const fileId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            await window.database.ref(`${storagePath}/${folderId}/files/${fileId}`).set({
                filename: file.name,
                size: file.size,
                date: new Date().toISOString(),
                previewUrl: data.secure_url,
                downloadUrl: downloadUrl,
                folder: folderName,
                subPath: subPath,
                originalCode: kod
            });
            
            return true;
        } catch (error) {
            console.error('Upload error:', error);
            return false;
        }
    }
    
    // ==================== VIEWER MODE ====================
    async function initViewerFolderSystem() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupViewerUI);
        } else {
            setupViewerUI();
        }
    }
    
    async function setupViewerUI() {
        // Extraer parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const foretag = urlParams.get('company');
        const projekt = urlParams.get('project');
        const leverantor = urlParams.get('supplier');
        const del = urlParams.get('part');
        const kod = urlParams.get('code');
        
        if (!foretag || !projekt || !leverantor || !del || !kod) return;
        
        const path = getFolderStoragePath(foretag, projekt, leverantor, del, kod);
        
        try {
            const snapshot = await window.database.ref(path).once('value');
            const folders = snapshot.val() || {};
            
            if (Object.keys(folders).length === 0) return;
            
            // Agregar selector de carpetas al viewer
            const header = document.querySelector('.card');
            if (header && !document.getElementById('viewerFolderSelect')) {
                const folderSelector = document.createElement('div');
                folderSelector.id = 'viewerFolderSelect';
                folderSelector.style.cssText = 'margin-top: 1rem; background: #f0f6fc; padding: 0.8rem; border-radius: 1rem;';
                folderSelector.innerHTML = `
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">
                        <i class="fas fa-folder-tree"></i> Filtrera efter mapp:
                    </label>
                    <select id="folderFilterViewer" style="width: 100%; padding: 0.6rem; border-radius: 0.8rem; border: 2px solid #cbdde9;">
                        <option value="all">📂 Alla filer</option>
                        ${Object.keys(folders).map(f => `<option value="${escapeHtml(folders[f].name || f)}">📁 ${escapeHtml(folders[f].name || f)}</option>`).join('')}
                    </select>
                `;
                header.appendChild(folderSelector);
                
                const filterSelect = document.getElementById('folderFilterViewer');
                filterSelect?.addEventListener('change', async (e) => {
                    const selectedFolder = e.target.value;
                    if (selectedFolder === 'all') {
                        location.reload();
                    } else {
                        await filterViewerByFolder(foretag, projekt, leverantor, del, kod, selectedFolder);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading folders in viewer:', error);
        }
    }
    
    async function filterViewerByFolder(foretag, projekt, leverantor, del, kod, folderName) {
        const path = getFolderStoragePath(foretag, projekt, leverantor, del, kod);
        const folderId = sanitizeKey(folderName);
        
        try {
            const snapshot = await window.database.ref(`${path}/${folderId}/files`).once('value');
            const files = snapshot.val() || {};
            const filesArray = Object.values(files);
            
            const contentDiv = document.getElementById('content');
            if (!contentDiv) return;
            
            if (filesArray.length === 0) {
                contentDiv.innerHTML = `<div class="no-files"><i class="fas fa-folder-open"></i><p>Inga filer i mappen "${escapeHtml(folderName)}"</p></div>`;
                return;
            }
            
            let html = '<div class="files-grid">';
            for (const file of filesArray) {
                const { ikon, farg } = getIconAndColor(file.filename);
                html += `
                    <div class="file-card">
                        <div class="file-icon" style="color:${farg};"><i class="fas ${ikon} fa-2x"></i></div>
                        <div class="file-name">${escapeHtml(file.filename)}</div>
                        <div class="file-meta">
                            <span><i class="fas fa-weight-hanging"></i> ${formatBytes(file.size)}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(file.date).toLocaleDateString('sv-SE')}</span>
                        </div>
                        <div class="file-actions">
                            <button class="btn btn-view" onclick="visaFilIModal('${file.previewUrl}', '${escapeHtml(file.filename)}')"><i class="fas fa-eye"></i> Visa</button>
                            <button class="btn btn-download" onclick="laddaNerFil('${file.downloadUrl}', '${escapeHtml(file.filename)}')"><i class="fas fa-download"></i> Ladda ner</button>
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            contentDiv.innerHTML = html;
            
            showToastMsg(`📁 Visar ${filesArray.length} fil(er) från mappen "${folderName}"`);
        } catch (error) {
            console.error(error);
        }
    }
    
    // ==================== FUNCIONES DE UTILIDAD ====================
    function getFolderStoragePath(foretag, projekt, leverantor, del, kod) {
        return `folder_structure/${sanitizeKey(foretag)}/${sanitizeKey(projekt)}/${sanitizeKey(leverantor)}/${sanitizeKey(del)}/${sanitizeKey(kod)}`;
    }
    
    function sanitizeKey(str) {
        if (!str) return '';
        return str.replace(/\./g, '-').replace(/[#$\[\]\/]/g, '_').replace(/\s+/g, '_');
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }
    
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function getIconAndColor(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            pdf: ['fa-file-pdf', '#e74c3c'], dwg: ['fa-draw-polygon', '#e67e22'],
            dxf: ['fa-draw-polygon', '#e67e22'], jpg: ['fa-file-image', '#3498db'],
            jpeg: ['fa-file-image', '#3498db'], png: ['fa-file-image', '#3498db'],
            mp4: ['fa-file-video', '#9b59b6'], zip: ['fa-file-archive', '#f39c12'],
            doc: ['fa-file-word', '#2980b9'], docx: ['fa-file-word', '#2980b9'],
            xls: ['fa-file-excel', '#27ae60'], xlsx: ['fa-file-excel', '#27ae60']
        };
        return map[ext] || ['fa-file', '#5a8eb0'];
    }
    
    function showToastMsg(msg, isError = false) {
        let toast = document.getElementById('folderManagerToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'folderManagerToast';
            toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#1a2f3e; color:white; padding:10px 24px; border-radius:40px; font-size:0.85rem; opacity:0; transition:opacity 0.2s; pointer-events:none; z-index:1002;';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.backgroundColor = isError ? '#b91c2c' : '#1a2f3e';
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 2500);
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
})();