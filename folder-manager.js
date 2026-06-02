// ============================================================================
// folder-manager.js - Komplett mapp- och filhantering (svensk version)
// Används med index.html och viewer.html – ladda ENDAST en gång i slutet av <body>
// ============================================================================

(function() {
    // -------------------- LÄGE (admin eller visning) --------------------
    const isAdminMode = document.querySelector('.dropzone, #laddaUppBtn') !== null;

    // -------------------- HÄMTA FIREBASE-REFERENS --------------------
    function hamtaDatabas() {
        if (window.databas) return window.databas;
        if (window.database) return window.database;
        if (window.firebase && window.firebase.database) return window.firebase.database();
        return null;
    }

    function vantaPaFirebase(callback) {
        if (hamtaDatabas()) {
            callback(hamtaDatabas());
            return;
        }
        const intervall = setInterval(() => {
            const db = hamtaDatabas();
            if (db) {
                clearInterval(intervall);
                callback(db);
            }
        }, 200);
    }

    // -------------------- START BEROENDE PÅ LÄGE --------------------
    if (isAdminMode) {
        initAdminPanel();
    } else {
        initViewerPanel();
    }

    // =========================================================================
    // ========================= ADMINLÄGE (index.html) ========================
    // =========================================================================

    async function initAdminPanel() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAdminUI);
        } else {
            setupAdminUI();
        }
    }

    async function setupAdminUI() {
        const foretagHidden = document.getElementById('foretagValt');
        if (!foretagHidden) {
            setTimeout(setupAdminUI, 500);
            return;
        }

        vantaPaFirebase(async (db) => {
            const befintligaKort = document.getElementById('befintligaFilerKort');
            if (!befintligaKort) return;

            let mappPanel = document.getElementById('folderManagerPanel');
            if (!mappPanel) {
                mappPanel = document.createElement('div');
                mappPanel.id = 'folderManagerPanel';
                mappPanel.className = 'card';
                mappPanel.style.marginTop = '1.5rem';
                mappPanel.style.background = '#ffffff';
                mappPanel.style.border = '2px solid #e2edf5';
                mappPanel.style.borderRadius = '1.5rem';
                mappPanel.style.padding = '1.5rem';
                mappPanel.innerHTML = `
                    <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-folder-tree" style="color:#2c7cb6;"></i>
                        📁 Hantera mappar och filer
                        <span style="font-size: 0.7rem; background:#eef3fc; padding: 0.2rem 0.6rem; border-radius: 1rem; color:#2c7cb6;">Full struktur</span>
                    </h3>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; align-items: flex-end;">
                        <div style="flex: 2; min-width: 200px;">
                            <label style="display: block; font-weight: 600; font-size: 0.75rem; margin-bottom: 0.3rem;">
                                <i class="fas fa-folder-plus"></i> Skapa ny mapp
                            </label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="text" id="newFolderNameInput" placeholder="T.ex. Ritningar, Kontrakt, Bilder, Data" 
                                       style="flex: 1; padding: 0.6rem; border-radius: 0.8rem; border: 2px solid #cbdde9;">
                                <button id="createNewFolderBtn" class="btn-primary" style="padding: 0.6rem 1.2rem;">
                                    <i class="fas fa-plus-circle"></i> Skapa
                                </button>
                            </div>
                        </div>
                        <div>
                            <button id="refreshFolderTreeBtn" class="btn-secondary" style="padding: 0.6rem 1.2rem;">
                                <i class="fas fa-sync-alt"></i> Uppdatera träd
                            </button>
                        </div>
                    </div>
                    <div id="folderTreeContainer" style="max-height: 500px; overflow-y: auto; background: #fafdff; border-radius: 1rem; border: 1px solid #e2edf5; padding: 0.5rem;">
                        <div style="text-align: center; padding: 2rem; color: #9bb3c9;">
                            <i class="fas fa-info-circle"></i> Välj först företag, projekt, leverantör, del och kod för att hantera mappar
                        </div>
                    </div>
                `;
                befintligaKort.parentNode.insertBefore(mappPanel, befintligaKort.nextSibling);
            }

            // Uppdatera mappträdet
            const uppdateraTräd = async () => {
                const foretag = document.getElementById('foretagValt')?.value;
                const projekt = document.getElementById('projektValt')?.value;
                const leverantor = document.getElementById('leverantorValt')?.value;
                const del = document.getElementById('delValt')?.value;
                const kod = document.getElementById('kodValt')?.value;
                const container = document.getElementById('folderTreeContainer');
                if (!foretag || !projekt || !leverantor || !del || !kod) {
                    container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #9bb3c9;"><i class="fas fa-info-circle"></i> Välj först företag, projekt, leverantör, del och kod</div>`;
                    return;
                }
                await visaMappTrädAdmin(db, foretag, projekt, leverantor, del, kod);
            };

            // Skapa mapp
            document.getElementById('createNewFolderBtn')?.addEventListener('click', async () => {
                const foretag = document.getElementById('foretagValt')?.value;
                const projekt = document.getElementById('projektValt')?.value;
                const leverantor = document.getElementById('leverantorValt')?.value;
                const del = document.getElementById('delValt')?.value;
                const kod = document.getElementById('kodValt')?.value;
                const mappNamn = document.getElementById('newFolderNameInput')?.value.trim();
                if (!foretag || !projekt || !leverantor || !del || !kod) {
                    visaMeddelande('❌ Välj först hela hierarkin', true);
                    return;
                }
                if (!mappNamn) {
                    visaMeddelande('❌ Ange ett mappnamn', true);
                    return;
                }
                const ok = await skapaMappIDatabas(db, foretag, projekt, leverantor, del, kod, mappNamn);
                if (ok) {
                    document.getElementById('newFolderNameInput').value = '';
                    await uppdateraTräd();
                    if (typeof window.laddaBefintligaFiler === 'function') window.laddaBefintligaFiler();
                }
            });

            document.getElementById('refreshFolderTreeBtn')?.addEventListener('click', uppdateraTräd);
            document.getElementById('foretagValt')?.addEventListener('change', uppdateraTräd);
            document.getElementById('projektValt')?.addEventListener('change', uppdateraTräd);
            document.getElementById('leverantorValt')?.addEventListener('change', uppdateraTräd);
            document.getElementById('delValt')?.addEventListener('change', uppdateraTräd);
            document.getElementById('kodValt')?.addEventListener('change', uppdateraTräd);

            await uppdateraTräd();
            laggTillMappUppladdningsKnapp(db, uppdateraTräd);
        });
    }

    // Admin: visa expanderbart mappträd
    async function visaMappTrädAdmin(db, foretag, projekt, leverantor, del, kod) {
        const container = document.getElementById('folderTreeContainer');
        if (!container) return;

        const rotSökväg = `underlag/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}`;
        const mappSökväg = `folder_structure/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}`;

        try {
            const rotSnap = await db.ref(rotSökväg).once('value');
            const rotData = rotSnap.val() || {};
            const rotFiler = rotData.filer || {};

            const mappSnap = await db.ref(mappSökväg).once('value');
            const mappar = mappSnap.val() || {};

            let html = `<div style="margin-bottom: 1rem;">`;

            // Mappar
            if (Object.keys(mappar).length === 0) {
                html += `<div style="margin-top: 1rem; padding: 0.5rem; color: #999;"><i class="fas fa-folder-open"></i> Inga mappar har skapats än</div>`;
            } else {
                html += `<div style="margin-top: 1rem;"><strong><i class="fas fa-folder-tree"></i> Mappar</strong></div>`;
                for (const [mappId, mappData] of Object.entries(mappar)) {
                    const mappNamn = mappData.name || mappId;
                    const filerIMapp = mappData.files || {};
                    const antalFiler = Object.keys(filerIMapp).length;
                    const uniktId = `adminFolder_${mappId}_${Date.now()}_${Math.random()}`;

                    html += `
                        <div class="folder-item" style="margin: 0.5rem 0; border: 1px solid #e2edf5; border-radius: 0.8rem; background: #ffffff;">
                            <div class="folder-header" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.8rem; cursor: pointer; background: #f8fafc; border-radius: 0.8rem;" onclick="vaxlaMapp('${uniktId}')">
                                <div>
                                    <i class="fas fa-folder" style="color: #e67e22;"></i>
                                    <strong style="margin-left: 0.3rem;">📁 ${escapeHtml(mappNamn)}</strong>
                                    <span style="font-size: 0.7rem; color: #6c8dab; margin-left: 0.5rem;">(${antalFiler} filer)</span>
                                </div>
                                <div style="display: flex; gap: 0.3rem;">
                                    <button class="btn-primary ladda-upp-till-mapp" data-mapp="${escapeHtml(mappNamn)}" style="padding: 0.2rem 0.6rem; font-size: 0.7rem;"><i class="fas fa-upload"></i> Ladda upp</button>
                                    <button class="btn-danger ta-bort-mapp" data-mapp="${escapeHtml(mappNamn)}" data-mappid="${mappId}" style="padding: 0.2rem 0.6rem; font-size: 0.7rem;"><i class="fas fa-trash"></i> Ta bort</button>
                                </div>
                            </div>
                            <div id="${uniktId}" style="display: none; padding: 0.5rem 0.8rem; border-top: 1px solid #e2edf5;">
                    `;
                    if (Object.keys(filerIMapp).length === 0) {
                        html += `<div style="color: #999; padding: 0.5rem;"><i class="fas fa-info-circle"></i> Denna mapp är tom</div>`;
                    } else {
                        for (const [filId, fil] of Object.entries(filerIMapp)) {
                            html += visaFilRad(fil, filId, mappId, `${mappSökväg}/${mappId}/files`);
                        }
                    }
                    html += `</div></div>`;
                }
            }
            html += `</div>`;
            container.innerHTML = html;

            // Koppla händelser
            kopplaAdminHändelser(db, foretag, projekt, leverantor, del, kod, mappSökväg);

        } catch (fel) {
            console.error(fel);
            container.innerHTML = `<div style="color: #e74c3c; padding: 1rem;">❌ Kunde inte ladda mappar: ${fel.message}</div>`;
        }
    }

    function visaFilRad(fil, filId, mappId, sökväg) {
        const { ikon, färg } = hamtaFilIkonOchFärg(fil.filename);
        const storlek = formateraStorlek(fil.size);
        const datum = new Date(fil.date).toLocaleDateString('sv-SE');
        return `
            <div class="file-item-in-tree" style="display: flex; justify-content: space-between; align-items: center; background: #f0f6fc; margin: 0.3rem 0; padding: 0.4rem 0.6rem; border-radius: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <i class="fas ${ikon}" style="color: ${färg};"></i>
                    <span style="font-weight: 500;">${escapeHtml(fil.filename)}</span>
                    <span style="font-size: 0.7rem; color: #6c8dab;">${storlek}</span>
                    <span style="font-size: 0.7rem; color: #6c8dab;">${datum}</span>
                </div>
                <div style="display: flex; gap: 0.3rem;">
                    <button class="btn-secondary visa-fil" data-url="${fil.previewUrl}" data-name="${escapeHtml(fil.filename)}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"><i class="fas fa-eye"></i></button>
                    <button class="btn-secondary ladda-ner-fil" data-url="${fil.downloadUrl}" data-name="${escapeHtml(fil.filename)}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"><i class="fas fa-download"></i></button>
                    <button class="btn-danger ta-bort-fil" data-filid="${filId}" data-mappid="${mappId}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }

    function kopplaAdminHändelser(db, foretag, projekt, leverantor, del, kod, mappSökväg) {
        // Ladda upp till mapp
        document.querySelectorAll('.ladda-upp-till-mapp').forEach(knapp => {
            knapp.addEventListener('click', (e) => {
                e.stopPropagation();
                const mappNamn = knapp.dataset.mapp;
                laddaUppFilerTillMappDialog(db, foretag, projekt, leverantor, del, kod, mappNamn, () => {
                    visaMappTrädAdmin(db, foretag, projekt, leverantor, del, kod);
                    if (typeof window.laddaBefintligaFiler === 'function') window.laddaBefintligaFiler();
                });
            });
        });

        // Ta bort mapp
        document.querySelectorAll('.ta-bort-mapp').forEach(knapp => {
            knapp.addEventListener('click', async (e) => {
                e.stopPropagation();
                const mappNamn = knapp.dataset.mapp;
                const mappId = knapp.dataset.mappid;
                if (confirm(`Ta bort mappen "${mappNamn}" och alla dess filer permanent?`)) {
                    await db.ref(`${mappSökväg}/${mappId}`).remove();
                    visaMeddelande(`🗑️ Mappen "${mappNamn}" borttagen`);
                    await visaMappTrädAdmin(db, foretag, projekt, leverantor, del, kod);
                    if (typeof window.laddaBefintligaFiler === 'function') window.laddaBefintligaFiler();
                }
            });
        });

        // Visa fil
        document.querySelectorAll('.visa-fil').forEach(knapp => {
            knapp.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(knapp.dataset.url, '_blank');
            });
        });

        // Ladda ner fil
        document.querySelectorAll('.ladda-ner-fil').forEach(knapp => {
            knapp.addEventListener('click', (e) => {
                e.stopPropagation();
                laddaNerFil(knapp.dataset.url, knapp.dataset.name);
            });
        });

        // Ta bort fil
        document.querySelectorAll('.ta-bort-fil').forEach(knapp => {
            knapp.addEventListener('click', async (e) => {
                e.stopPropagation();
                const filId = knapp.dataset.filid;
                const mappId = knapp.dataset.mappid;
                if (confirm('Ta bort filen permanent?')) {
                    let sökväg;
                    if (mappId === 'root') {
                        sökväg = `underlag/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}/filer/${filId}`;
                    } else {
                        sökväg = `${mappSökväg}/${mappId}/files/${filId}`;
                    }
                    await db.ref(sökväg).remove();
                    visaMeddelande('✅ Fil borttagen');
                    await visaMappTrädAdmin(db, foretag, projekt, leverantor, del, kod);
                    if (typeof window.laddaBefintligaFiler === 'function') window.laddaBefintligaFiler();
                }
            });
        });
    }

    // Admin: dialog för att ladda upp filer till specifik mapp
    async function laddaUppFilerTillMappDialog(db, foretag, projekt, leverantor, del, kod, mappNamn, uppdateraCallback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = async (e) => {
            const filer = Array.from(e.target.files);
            if (filer.length === 0) return;
            visaMeddelande(`📤 Laddar upp ${filer.length} fil(er) till mappen "${mappNamn}"...`);
            let lyckade = 0;
            for (const fil of filer) {
                const ok = await laddaUppFilTillCloudinaryOchSpara(db, fil, foretag, projekt, leverantor, del, kod, mappNamn);
                if (ok) lyckade++;
            }
            visaMeddelande(`✅ ${lyckade} av ${filer.length} filer uppladdade till "${mappNamn}"`);
            if (uppdateraCallback) uppdateraCallback();
        };
        input.click();
    }

    async function laddaUppFilTillCloudinaryOchSpara(db, fil, foretag, projekt, leverantor, del, kod, mappNamn) {
        const formData = new FormData();
        const tidsstämpel = Date.now();
        const säkertNamn = fil.name.replace(/[^a-zA-Z0-9åäöÅÄÖ.\-]/g, '_');
        const cloudMapp = `underlag/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}/${rensaNyckel(mappNamn)}`;
        const publicId = `${cloudMapp}/${tidsstämpel}_${säkertNamn}`;
        formData.append('file', fil);
        formData.append('upload_preset', 'team01');
        formData.append('public_id', publicId);
        formData.append('resource_type', 'auto');

        try {
            const svar = await fetch(`https://api.cloudinary.com/v1_1/dc1zqri3o/auto/upload`, { method: 'POST', body: formData });
            const data = await svar.json();
            if (!svar.ok) throw new Error(data.error?.message || 'Cloudinary-fel');
            const nedladdningsUrl = data.secure_url + (data.secure_url.includes('?') ? '&fl_attachment' : '?fl_attachment');
            const mappLagring = `folder_structure/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}/${rensaNyckel(mappNamn)}/files`;
            const filId = `${Date.now()}_${fil.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            await db.ref(`${mappLagring}/${filId}`).set({
                filename: fil.name,
                size: fil.size,
                date: new Date().toISOString(),
                previewUrl: data.secure_url,
                downloadUrl: nedladdningsUrl,
                folder: mappNamn
            });
            return true;
        } catch (fel) {
            console.error(fel);
            visaMeddelande(`❌ Misslyckades med ${fil.name}: ${fel.message}`, true);
            return false;
        }
    }

    async function skapaMappIDatabas(db, foretag, projekt, leverantor, del, kod, mappNamn) {
        const sökväg = `folder_structure/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}`;
        const mappId = rensaNyckel(mappNamn);
        try {
            const finns = await db.ref(`${sökväg}/${mappId}`).once('value');
            if (finns.exists()) {
                visaMeddelande(`❌ Mappen "${mappNamn}" finns redan`, true);
                return false;
            }
            await db.ref(`${sökväg}/${mappId}`).set({
                name: mappNamn,
                createdAt: new Date().toISOString(),
                files: {}
            });
            visaMeddelande(`✅ Mappen "${mappNamn}" skapad`);
            return true;
        } catch (fel) {
            visaMeddelande(`❌ Kunde inte skapa mapp: ${fel.message}`, true);
            return false;
        }
    }

    function laggTillMappUppladdningsKnapp(db, uppdateraCallback) {
        const dropzone = document.querySelector('.dropzone');
        if (!dropzone || document.getElementById('fullFolderUploadBtn')) return;

        const knapp = document.createElement('button');
        knapp.id = 'fullFolderUploadBtn';
        knapp.type = 'button';
        knapp.className = 'btn-secondary';
        knapp.style.cssText = 'margin: 0.5rem; padding: 0.5rem 1rem; background: #e67e22; color: white; border-radius: 2rem; border: none; cursor: pointer;';
        knapp.innerHTML = '<i class="fas fa-folder-open"></i> 📁 Ladda upp hel mapp (bevarar struktur)';

        const mappInput = document.createElement('input');
        mappInput.type = 'file';
        mappInput.id = 'fullFolderInput';
        mappInput.multiple = true;
        mappInput.webkitdirectory = true;
        mappInput.directory = true;
        mappInput.style.display = 'none';

        knapp.onclick = () => mappInput.click();

        mappInput.addEventListener('change', async (e) => {
            const filer = Array.from(e.target.files);
            if (filer.length === 0) return;

            const foretag = document.getElementById('foretagValt')?.value;
            const projekt = document.getElementById('projektValt')?.value;
            const leverantor = document.getElementById('leverantorValt')?.value;
            const del = document.getElementById('delValt')?.value;
            const kod = document.getElementById('kodValt')?.value;

            if (!foretag || !projekt || !leverantor || !del || !kod) {
                visaMeddelande('❌ Välj först hierarkin (företag, projekt, leverantör, del, kod)', true);
                return;
            }

            const förstaSökväg = filer[0].webkitRelativePath;
            const rotMappNamn = förstaSökväg.split('/')[0];
            const målMapp = prompt(`Mapp från datorn: "${rotMappNamn}"\nAnge mappnamn i systemet:`, rotMappNamn);
            if (!målMapp) return;

            await skapaMappIDatabas(db, foretag, projekt, leverantor, del, kod, målMapp);
            let lyckade = 0;
            for (const fil of filer) {
                const ok = await laddaUppFilTillCloudinaryOchSpara(db, fil, foretag, projekt, leverantor, del, kod, målMapp);
                if (ok) lyckade++;
            }
            visaMeddelande(`✅ ${lyckade} av ${filer.length} filer uppladdade till "${målMapp}"`);
            if (uppdateraCallback) await uppdateraCallback();
            if (typeof window.laddaBefintligaFiler === 'function') window.laddaBefintligaFiler();
            mappInput.value = '';
        });

        const förstaBtn = dropzone.querySelector('.btn-secondary');
        if (förstaBtn) dropzone.insertBefore(knapp, förstaBtn);
        else dropzone.appendChild(knapp);
        dropzone.appendChild(mappInput);
    }

    // =========================================================================
    // ========================= VISNINGSLÄGE (viewer.html) ====================
    // =========================================================================

    async function initViewerPanel() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupViewerUI);
        } else {
            setupViewerUI();
        }
    }

    async function setupViewerUI() {
        vantaPaFirebase(async (db) => {
            const urlParams = new URLSearchParams(window.location.search);
            const foretag = urlParams.get('company');
            const projekt = urlParams.get('project');
            const leverantor = urlParams.get('supplier');
            const del = urlParams.get('part');
            const kod = urlParams.get('code');

            if (!foretag || !projekt || !leverantor || !del || !kod) {
                const innehåll = document.getElementById('content');
                if (innehåll) innehåll.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i><p>Ogiltig länk. Saknar företag, projekt, leverantör, del eller kod.</p></div>`;
                return;
            }

            const rotSökväg = `underlag/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}`;
            const mappSökväg = `folder_structure/${rensaNyckel(foretag)}/${rensaNyckel(projekt)}/${rensaNyckel(leverantor)}/${rensaNyckel(del)}/${rensaNyckel(kod)}`;

            try {
                const [rotSnap, mappSnap] = await Promise.all([
                    db.ref(rotSökväg).once('value'),
                    db.ref(mappSökväg).once('value')
                ]);
                const rotData = rotSnap.val() || {};
                const rotFiler = rotData.filer || {};
                const mappar = mappSnap.val() || {};

                let treeContainer = document.getElementById('viewerFolderTree');
                if (!treeContainer) {
                    const card = document.querySelector('.card');
                    if (card) {
                        const treeDiv = document.createElement('div');
                        treeDiv.id = 'viewerFolderTree';
                        treeDiv.style.cssText = 'margin-top: 1.5rem; background: #f8fafc; border-radius: 1rem; padding: 1rem; border: 1px solid #e2edf5;';
                        card.appendChild(treeDiv);
                        treeContainer = treeDiv;
                    } else {
                        return;
                    }
                }

                let html = `<div style="margin-bottom: 0.5rem;"><strong><i class="fas fa-folder-tree"></i> Mappstruktur</strong></div>`;

                // Mappar
                if (Object.keys(mappar).length > 0) {
                    for (const [mappId, mappData] of Object.entries(mappar)) {
                        const mappNamn = mappData.name || mappId;
                        const filerIMapp = mappData.files || {};
                        const antalFiler = Object.keys(filerIMapp).length;
                        const uniktId = `viewerFolder_${mappId}_${Date.now()}_${Math.random()}`;

                        html += `
                            <div style="margin-bottom: 0.8rem; border: 1px solid #e2edf5; border-radius: 0.8rem; background: #ffffff;">
                                <div class="folder-header" style="display: flex; align-items: center; padding: 0.5rem 0.8rem; cursor: pointer; background: #f0f6fc; border-radius: 0.8rem;" onclick="vaxlaMapp('${uniktId}')">
                                    <i class="fas fa-folder" style="color: #e67e22; margin-right: 0.5rem;"></i>
                                    <strong>📁 ${escapeHtml(mappNamn)}</strong>
                                    <span style="font-size: 0.7rem; color: #6c8dab; margin-left: 0.5rem;">(${antalFiler} filer)</span>
                                    <i class="fas fa-chevron-down" style="margin-left: auto;"></i>
                                </div>
                                <div id="${uniktId}" style="display: none; padding: 0.5rem 0.8rem; border-top: 1px solid #e2edf5;">
                        `;
                        if (Object.keys(filerIMapp).length === 0) {
                            html += `<div style="color: #999;">Inga filer i denna mapp</div>`;
                        } else {
                            for (const [filId, fil] of Object.entries(filerIMapp)) {
                                html += visaFilRadViewer(fil);
                            }
                        }
                        html += `</div></div>`;
                    }
                } else {
                    html += `<div style="color: #999;"><i class="fas fa-info-circle"></i> Inga mappar har skapats än.</div>`;
                }

                treeContainer.innerHTML = html;
            } catch (fel) {
                console.error(fel);
                const treeContainer = document.getElementById('viewerFolderTree');
                if (treeContainer) treeContainer.innerHTML = `<div style="color: #e74c3c;">❌ Kunde inte ladda mappstruktur: ${fel.message}</div>`;
            }
        });
    }

    function visaFilRadViewer(fil) {
        const { ikon, färg } = hamtaFilIkonOchFärg(fil.filename);
        const storlek = formateraStorlek(fil.size);
        const datum = new Date(fil.date).toLocaleDateString('sv-SE');
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f0f6fc; margin: 0.3rem 0; padding: 0.4rem 0.6rem; border-radius: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <i class="fas ${ikon}" style="color: ${färg};"></i>
                    <span>${escapeHtml(fil.filename)}</span>
                    <span style="font-size: 0.7rem; color: #6c8dab;">${storlek}</span>
                    <span style="font-size: 0.7rem; color: #6c8dab;">${datum}</span>
                </div>
                <div style="display: flex; gap: 0.3rem;">
                    <button class="btn-secondary" onclick="visaFilIModal('${fil.previewUrl}', '${escapeHtml(fil.filename)}')" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"><i class="fas fa-eye"></i> Visa</button>
                    <button class="btn-secondary" onclick="laddaNerFil('${fil.downloadUrl}', '${escapeHtml(fil.filename)}')" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"><i class="fas fa-download"></i> Ladda ner</button>
                </div>
            </div>
        `;
    }

    // ==================== GEMENSAMMA HJÄLPFUNKTIONER ====================

    window.vaxlaMapp = function(id) {
        const el = document.getElementById(id);
        if (el) {
            const isHidden = el.style.display === 'none' || el.style.display === '';
            el.style.display = isHidden ? 'block' : 'none';
            const header = el.previousElementSibling;
            if (header && header.classList.contains('folder-header')) {
                const icon = header.querySelector('.fa-chevron-down, .fa-chevron-right');
                if (icon) {
                    if (isHidden) {
                        icon.classList.remove('fa-chevron-right');
                        icon.classList.add('fa-chevron-down');
                    } else {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-right');
                    }
                }
            }
        }
    };

    async function laddaNerFil(url, namn) {
        try {
            visaMeddelande(`⬇️ Laddar ner ${namn}...`);
            const svar = await fetch(url);
            if (!svar.ok) throw new Error('Nedladdning misslyckades');
            const blob = await svar.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = namn;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            visaMeddelande(`✅ ${namn} nedladdad`);
        } catch (fel) {
            visaMeddelande(`❌ Kunde inte ladda ner ${namn}`, true);
        }
    }

    function rensaNyckel(str) {
        if (!str) return '';
        return str.replace(/\./g, '-').replace(/[#$\[\]\/]/g, '_').replace(/\s+/g, '_');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }

    function formateraStorlek(byte) {
        if (!byte) return '0 B';
        const enheter = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(byte) / Math.log(1024));
        return (byte / Math.pow(1024, i)).toFixed(2) + ' ' + enheter[i];
    }

    function hamtaFilIkonOchFärg(filnamn) {
        const ext = filnamn.split('.').pop().toLowerCase();
        const mappning = {
            pdf: ['fa-file-pdf', '#e74c3c'],
            doc: ['fa-file-word', '#2b579a'], docx: ['fa-file-word', '#2b579a'],
            xls: ['fa-file-excel', '#217346'], xlsx: ['fa-file-excel', '#217346'],
            ppt: ['fa-file-powerpoint', '#d35230'], pptx: ['fa-file-powerpoint', '#d35230'],
            txt: ['fa-file-alt', '#6c8dab'], rtf: ['fa-file-alt', '#6c8dab'],
            odt: ['fa-file-alt', '#6c8dab'], ods: ['fa-file-excel', '#217346'], odp: ['fa-file-powerpoint', '#d35230'],
            jpg: ['fa-file-image', '#3498db'], jpeg: ['fa-file-image', '#3498db'], png: ['fa-file-image', '#3498db'],
            gif: ['fa-file-image', '#3498db'], bmp: ['fa-file-image', '#3498db'], tiff: ['fa-file-image', '#3498db'],
            svg: ['fa-file-image', '#3498db'], webp: ['fa-file-image', '#3498db'], heic: ['fa-file-image', '#3498db'],
            mp4: ['fa-file-video', '#9b59b6'], mkv: ['fa-file-video', '#9b59b6'], avi: ['fa-file-video', '#9b59b6'],
            mov: ['fa-file-video', '#9b59b6'], wmv: ['fa-file-video', '#9b59b6'], webm: ['fa-file-video', '#9b59b6'],
            zip: ['fa-file-archive', '#f39c12'], rar: ['fa-file-archive', '#f39c12'], '7z': ['fa-file-archive', '#f39c12'],
            tar: ['fa-file-archive', '#f39c12'], gz: ['fa-file-archive', '#f39c12'],
            dwg: ['fa-draw-polygon', '#e67e22'], dxf: ['fa-draw-polygon', '#e67e22'], dgn: ['fa-draw-polygon', '#e67e22'],
            shp: ['fa-map-marker-alt', '#27ae60'], shx: ['fa-map-marker-alt', '#27ae60'], dbf: ['fa-table', '#2980b9'],
            prj: ['fa-code', '#2c3e50'], geojson: ['fa-globe', '#2c7cb6'], kml: ['fa-globe', '#2c7cb6'], kmz: ['fa-globe', '#2c7cb6'],
            ifc: ['fa-cube', '#8e44ad'], stl: ['fa-cube', '#8e44ad'], obj: ['fa-cube', '#8e44ad'], fbx: ['fa-cube', '#8e44ad'],
            las: ['fa-chart-line', '#16a085'], laz: ['fa-chart-line', '#16a085'],
            csv: ['fa-table', '#27ae60'], gdb: ['fa-database', '#2c7cb6'], mdb: ['fa-database', '#2c7cb6'], accdb: ['fa-database', '#2c7cb6'], sqlite: ['fa-database', '#2c7cb6'],
            exe: ['fa-cogs', '#7f8c8d'], msi: ['fa-cogs', '#7f8c8d'], bat: ['fa-terminal', '#2c3e50'], sh: ['fa-terminal', '#2c3e50'], ps1: ['fa-terminal', '#2c3e50'],
            html: ['fa-code', '#e34c26'], htm: ['fa-code', '#e34c26'], css: ['fa-css3', '#2965f1'], js: ['fa-js', '#f7df1e'], json: ['fa-code', '#6c8dab'], xml: ['fa-code', '#6c8dab'],
            mpp: ['fa-tasks', '#2c7cb6'], mpt: ['fa-tasks', '#2c7cb6'],
            msg: ['fa-envelope', '#2980b9'], eml: ['fa-envelope', '#2980b9'], vcf: ['fa-address-card', '#6c8dab']
        };
        return mappning[ext] || ['fa-file', '#5a8eb0'];
    }

    function visaMeddelande(msg, arFel = false) {
        let toast = document.getElementById('folderManagerToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'folderManagerToast';
            toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#1a2f3e; color:white; padding:10px 24px; border-radius:40px; font-size:0.85rem; opacity:0; transition:opacity 0.2s; pointer-events:none; z-index:1002;';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.backgroundColor = arFel ? '#b91c2c' : '#1a2f3e';
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 3000);
    }

    function debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    }

})();
