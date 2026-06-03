// ============================================
// HANTERING AV FÖRETAG, PROJEKT, LEVERANTÖR, DEL, KOD
// FULLSKÄRMSMODAL MED EXPANDERBART TRÄD
// FUNGERAR LOKALT OCH PÅ SERVER
// ============================================

let databasReferens = null;
let uppdateringsCallback = null;

function rensaNyckel(str) {
    if (!str) return '';
    return str.replace(/\./g, '-').replace(/[#$\[\]\/]/g, '_').replace(/\s+/g, '_');
}

function initieraHierarki(databas, callback) {
    databasReferens = databas;
    uppdateringsCallback = callback;
    console.log("✅ Hierarkimodul initierad (Företag/Projekt/Leverantör/Del/Kod)");
}

// ========== FÖRETAG ==========
async function hamtaForetag() {
    if (!databasReferens) return [];
    try {
        const snap = await databasReferens.ref('foretag').once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(f => f.namn).sort();
    } catch(e) {
        console.error("Fel vid hämtning av företag:", e);
        return [];
    }
}

async function laggTillForetag(foretag) {
    if (!foretag?.trim()) return false;
    const namn = foretag.trim();
    const nyckel = rensaNyckel(namn);
    try {
        const finns = await databasReferens.ref(`foretag/${nyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${nyckel}`).set({ namn, projekt: {} });
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function redigeraForetag(gammalt, nytt) {
    if (!gammalt || !nytt?.trim()) return false;
    if (gammalt === nytt.trim()) return true;
    const gammalNyckel = rensaNyckel(gammalt);
    const nyNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await databasReferens.ref(`foretag/${gammalNyckel}`).once('value')).val();
        if (!data) return false;
        await databasReferens.ref(`foretag/${nyNyckel}`).set({ namn: nytt.trim(), projekt: data.projekt || {} });
        await databasReferens.ref(`foretag/${gammalNyckel}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function taBortForetag(foretag) {
    if (!foretag) return false;
    try {
        await databasReferens.ref(`foretag/${rensaNyckel(foretag)}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function filtreraForetag(sok) {
    const alla = await hamtaForetag();
    if (!sok) return alla;
    return alla.filter(f => f.toLowerCase().includes(sok.toLowerCase()));
}

// ========== PROJEKT ==========
async function hamtaProjekt(foretag) {
    if (!foretag) return [];
    try {
        const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt`).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(p => p.namn).sort();
    } catch(e) { return []; }
}

async function laggTillProjekt(foretag, projekt) {
    if (!foretag || !projekt?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNamn = projekt.trim();
    const pNyckel = rensaNyckel(pNamn);
    try {
        const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}`).set({ namn: pNamn, leverantörer: {} });
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function redigeraProjekt(foretag, gammalt, nytt) {
    if (!foretag || !gammalt || !nytt?.trim()) return false;
    if (gammalt === nytt.trim()) return true;
    const fNyckel = rensaNyckel(foretag);
    const gNyckel = rensaNyckel(gammalt);
    const nNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${gNyckel}`).once('value')).val();
        if (!data) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${nNyckel}`).set({ namn: nytt.trim(), leverantörer: data.leverantörer || {} });
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${gNyckel}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function taBortProjekt(foretag, projekt) {
    if (!foretag || !projekt) return false;
    try {
        await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

// ========== LEVERANTÖR ==========
async function hamtaLeverantörer(foretag, projekt) {
    if (!foretag || !projekt) return [];
    try {
        const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer`).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(l => l.namn).sort();
    } catch(e) { return []; }
}

async function laggTillLeverantör(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNamn = leverantor.trim();
    const lNyckel = rensaNyckel(lNamn);
    try {
        const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}`).set({ namn: lNamn, delar: {} });
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function redigeraLeverantör(foretag, projekt, gammal, nytt) {
    if (!foretag || !projekt || !gammal || !nytt?.trim()) return false;
    if (gammal === nytt.trim()) return true;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${gNyckel}`).once('value')).val();
        if (!data) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${nNyckel}`).set({ namn: nytt.trim(), delar: data.delar || {} });
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${gNyckel}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function taBortLeverantör(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return false;
    try {
        await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

// ========== DEL ==========
async function hamtaDelar(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return [];
    try {
        const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar`).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(d => d.namn).sort();
    } catch(e) { return []; }
}

async function laggTillDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNamn = del.trim();
    const dNyckel = rensaNyckel(dNamn);
    try {
        const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}`).set({ namn: dNamn, koder: {} });
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function redigeraDel(foretag, projekt, leverantor, gammal, nytt) {
    if (!foretag || !projekt || !leverantor || !gammal || !nytt?.trim()) return false;
    if (gammal === nytt.trim()) return true;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${gNyckel}`).once('value')).val();
        if (!data) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${nNyckel}`).set({ namn: nytt.trim(), koder: data.koder || {} });
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${gNyckel}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function taBortDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del) return false;
    try {
        await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar/${rensaNyckel(del)}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

// ========== KOD ==========
async function hamtaKoder(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del) return [];
    try {
        const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar/${rensaNyckel(del)}/koder`).once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(k => k.namn).sort();
    } catch(e) { return []; }
}

async function laggTillKod(foretag, projekt, leverantor, del, kod) {
    if (!foretag || !projekt || !leverantor || !del || !kod?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNyckel = rensaNyckel(del);
    const kNamn = kod.trim().toUpperCase();
    const kNyckel = rensaNyckel(kNamn);
    try {
        const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${kNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${kNyckel}`).set({ namn: kNamn });
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function redigeraKod(foretag, projekt, leverantor, del, gammal, nytt) {
    if (!foretag || !projekt || !leverantor || !del || !gammal || !nytt?.trim()) return false;
    if (gammal === nytt.trim().toUpperCase()) return true;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNyckel = rensaNyckel(del);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim().toUpperCase());
    try {
        const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${gNyckel}`).once('value')).val();
        if (!data) return false;
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${nNyckel}`).set({ namn: nytt.trim().toUpperCase() });
        await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${gNyckel}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

async function taBortKod(foretag, projekt, leverantor, del, kod) {
    if (!foretag || !projekt || !leverantor || !del || !kod) return false;
    try {
        await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar/${rensaNyckel(del)}/koder/${rensaNyckel(kod)}`).remove();
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch(e) { return false; }
}

// ========== MODALT FÖNSTER MED EXPANDERBART TRÄD ==========
function visaModalHantering(efterStangningCallback) {
    // Modal-overlay (fullskärm)
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); display: flex; justify-content: center;
        align-items: center; z-index: 10000; backdrop-filter: blur(4px);
    `;

    // Modal-innehåll (nästan fullskärm)
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; border-radius: 1.5rem; width: 95%; max-width: 1400px;
        height: 90%; display: flex; flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        overflow: hidden;
    `;

    // Rubrikrad
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        padding: 1rem 1.5rem; border-bottom: 2px solid #e2edf5;
        display: flex; justify-content: space-between; align-items: center;
        background: #f8fafc;
    `;
    headerDiv.innerHTML = `
        <h2 style="margin:0; font-size:1.5rem;"><i class="fas fa-database"></i> Hantera hierarki</h2>
        <button id="stangFullModalBtn" class="btn-secondary" style="padding:0.5rem 1.2rem;"><i class="fas fa-times"></i> Stäng</button>
    `;

    // Scrollbart träd-område
    const treeContainer = document.createElement('div');
    treeContainer.id = 'hierarchyTreeContainer';
    treeContainer.style.cssText = `
        flex: 1; overflow-y: auto; padding: 1.5rem;
        background: #ffffff;
    `;

    modalContent.appendChild(headerDiv);
    modalContent.appendChild(treeContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Ladda och rendera trädet (async function)
    async function laddaOchRenderaTräd() {
        treeContainer.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-pulse"></i> Laddar hierarki...</div>';
        
        const foretagLista = await hamtaForetag();
        let html = `<div class="hierarchy-tree" style="font-size:0.95rem;">`;

        for (const f of foretagLista) {
            const projektLista = await hamtaProjekt(f);
            html += `
                <div class="tree-node company-node" data-foretag="${escapeHtml(f)}" style="margin-bottom:1rem; border-left:3px solid #2c7cb6; padding-left:0.5rem;">
                    <div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.3rem 0;">
                        <i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>
                        <i class="fas fa-building" style="color:#2c7cb6; width:20px;"></i>
                        <strong style="flex:1;">${escapeHtml(f)}</strong>
                        <span style="display:flex; gap:0.3rem;">
                            <button class="btn-edit btn-sm" data-type="company" data-name="${escapeHtml(f)}" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete btn-sm" data-type="company" data-name="${escapeHtml(f)}" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-trash"></i></button>
                            <button class="btn-add btn-sm" data-type="project" data-parent="${escapeHtml(f)}" title="Lägg till projekt" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-plus"></i> Projekt</button>
                        </span>
                    </div>
                    <div class="tree-children" style="display: none; margin-left: 2rem;">
            `;
            for (const p of projektLista) {
                const leverantörLista = await hamtaLeverantörer(f, p);
                html += `
                    <div class="tree-node project-node" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="margin-bottom:0.8rem; border-left:2px solid #e67e22; padding-left:0.5rem;">
                        <div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.2rem 0;">
                            <i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>
                            <i class="fas fa-project-diagram" style="color:#e67e22; width:20px;"></i>
                            <strong style="flex:1;">${escapeHtml(p)}</strong>
                            <span style="display:flex; gap:0.3rem;">
                                <button class="btn-edit btn-sm" data-type="project" data-foretag="${escapeHtml(f)}" data-name="${escapeHtml(p)}" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                <button class="btn-delete btn-sm" data-type="project" data-foretag="${escapeHtml(f)}" data-name="${escapeHtml(p)}" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-trash"></i></button>
                                <button class="btn-add btn-sm" data-type="leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" title="Lägg till leverantör" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-plus"></i> Leverantör</button>
                            </span>
                        </div>
                        <div class="tree-children" style="display: none; margin-left: 1.5rem;">
                `;
                for (const l of leverantörLista) {
                    const delLista = await hamtaDelar(f, p, l);
                    html += `
                        <div class="tree-node leverantor-node" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" style="margin-bottom:0.8rem; border-left:2px solid #16a085; padding-left:0.5rem;">
                            <div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.2rem 0;">
                                <i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>
                                <i class="fas fa-truck" style="color:#16a085; width:20px;"></i>
                                <strong style="flex:1;">${escapeHtml(l)}</strong>
                                <span style="display:flex; gap:0.3rem;">
                                    <button class="btn-edit btn-sm" data-type="leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-name="${escapeHtml(l)}" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                    <button class="btn-delete btn-sm" data-type="leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-name="${escapeHtml(l)}" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-trash"></i></button>
                                    <button class="btn-add btn-sm" data-type="del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" title="Lägg till del" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-plus"></i> Del</button>
                                </span>
                            </div>
                            <div class="tree-children" style="display: none; margin-left: 1.5rem;">
                    `;
                    for (const d of delLista) {
                        const kodLista = await hamtaKoder(f, p, l, d);
                        html += `
                            <div class="tree-node del-node" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" style="margin-bottom:0.8rem; border-left:2px solid #8e44ad; padding-left:0.5rem;">
                                <div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.2rem 0;">
                                    <i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>
                                    <i class="fas fa-puzzle-piece" style="color:#8e44ad; width:20px;"></i>
                                    <strong style="flex:1;">${escapeHtml(d)}</strong>
                                    <span style="display:flex; gap:0.3rem;">
                                        <button class="btn-edit btn-sm" data-type="del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-name="${escapeHtml(d)}" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                        <button class="btn-delete btn-sm" data-type="del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-name="${escapeHtml(d)}" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-trash"></i></button>
                                        <button class="btn-add btn-sm" data-type="kod" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" title="Lägg till kod" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-plus"></i> Kod</button>
                                    </span>
                                </div>
                                <div class="tree-children" style="display: none; margin-left: 1.5rem;">
                        `;
                        for (const k of kodLista) {
                            html += `
                                <div class="tree-node kod-node" style="margin-bottom:0.3rem;">
                                    <div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; padding:0.1rem 0;">
                                        <i class="fas fa-tag" style="color:#e67e22; width:20px; margin-left:20px;"></i>
                                        <span style="flex:1;">${escapeHtml(k)}</span>
                                        <span style="display:flex; gap:0.3rem;">
                                            <button class="btn-edit btn-sm" data-type="kod" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" data-name="${escapeHtml(k)}" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                            <button class="btn-delete btn-sm" data-type="kod" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" data-name="${escapeHtml(k)}" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem;"><i class="fas fa-trash"></i></button>
                                        </span>
                                    </div>
                                </div>
                            `;
                        }
                        html += `</div></div>`;
                    }
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            html += `</div></div>`;
        }
        html += `</div>
            <div style="margin-top: 1rem; padding: 0.8rem; background: #f0f6fc; border-radius: 1rem; text-align: center;">
                <button id="nyttForetagFullBtn" class="btn-success" style="padding:0.5rem 1rem;"><i class="fas fa-plus-circle"></i> Nytt företag</button>
            </div>
        `;
        treeContainer.innerHTML = html;

        // Koppla expandera/komprimera (använd onclick istället för addEventListener för att undvika problem)
        const headers = document.querySelectorAll('#hierarchyTreeContainer .tree-header');
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const toggleIcon = header.querySelector('.toggle-icon');
            const childrenDiv = header.parentElement?.querySelector('.tree-children');
            if (toggleIcon && childrenDiv) {
                header.style.cursor = 'pointer';
                header.onclick = function(e) {
                    if (e.target.closest('button')) return;
                    const isVisible = childrenDiv.style.display !== 'none';
                    childrenDiv.style.display = isVisible ? 'none' : 'block';
                    if (toggleIcon) {
                        if (isVisible) {
                            toggleIcon.classList.remove('fa-chevron-down');
                            toggleIcon.classList.add('fa-chevron-right');
                        } else {
                            toggleIcon.classList.remove('fa-chevron-right');
                            toggleIcon.classList.add('fa-chevron-down');
                        }
                    }
                };
            }
        }

        // Koppla knappfunktioner
        attachButtonHandlers();
    }

    async function attachButtonHandlers() {
        // Redigera
        const editBtns = document.querySelectorAll('#hierarchyTreeContainer .btn-edit');
        for (let i = 0; i < editBtns.length; i++) {
            const btn = editBtns[i];
            btn.onclick = async function(e) {
                e.stopPropagation();
                const type = this.dataset.type;
                const foretag = this.dataset.foretag;
                const projekt = this.dataset.projekt;
                const leverantor = this.dataset.leverantor;
                const del = this.dataset.del;
                const currentName = this.dataset.name;
                let newName = prompt(`Ange nytt namn för ${type}:`, currentName);
                if (!newName || newName === currentName) return;
                let success = false;
                if (type === 'company') success = await redigeraForetag(currentName, newName);
                else if (type === 'project') success = await redigeraProjekt(foretag, currentName, newName);
                else if (type === 'leverantor') success = await redigeraLeverantör(foretag, projekt, currentName, newName);
                else if (type === 'del') success = await redigeraDel(foretag, projekt, leverantor, currentName, newName);
                else if (type === 'kod') success = await redigeraKod(foretag, projekt, leverantor, del, currentName, newName);
                if (success) {
                    await laddaOchRenderaTräd();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte ändra. Namnet finns redan eller ogiltigt.");
            };
        }

        // Ta bort
        const deleteBtns = document.querySelectorAll('#hierarchyTreeContainer .btn-delete');
        for (let i = 0; i < deleteBtns.length; i++) {
            const btn = deleteBtns[i];
            btn.onclick = async function(e) {
                e.stopPropagation();
                const type = this.dataset.type;
                const foretag = this.dataset.foretag;
                const projekt = this.dataset.projekt;
                const leverantor = this.dataset.leverantor;
                const del = this.dataset.del;
                const name = this.dataset.name;
                if (!confirm(`Ta bort ${type} "${name}" och allt under det?`)) return;
                let success = false;
                if (type === 'company') success = await taBortForetag(name);
                else if (type === 'project') success = await taBortProjekt(foretag, name);
                else if (type === 'leverantor') success = await taBortLeverantör(foretag, projekt, name);
                else if (type === 'del') success = await taBortDel(foretag, projekt, leverantor, name);
                else if (type === 'kod') success = await taBortKod(foretag, projekt, leverantor, del, name);
                if (success) {
                    await laddaOchRenderaTräd();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            };
        }

        // Lägg till
        const addBtns = document.querySelectorAll('#hierarchyTreeContainer .btn-add');
        for (let i = 0; i < addBtns.length; i++) {
            const btn = addBtns[i];
            btn.onclick = async function(e) {
                e.stopPropagation();
                const type = this.dataset.type;
                const foretag = this.dataset.foretag;
                const projekt = this.dataset.projekt;
                const leverantor = this.dataset.leverantor;
                const del = this.dataset.del;
                let newName = prompt(`Ange nytt ${type}-namn:`);
                if (!newName) return;
                let success = false;
                if (type === 'project') success = await laggTillProjekt(foretag, newName);
                else if (type === 'leverantor') success = await laggTillLeverantör(foretag, projekt, newName);
                else if (type === 'del') success = await laggTillDel(foretag, projekt, leverantor, newName);
                else if (type === 'kod') success = await laggTillKod(foretag, projekt, leverantor, del, newName);
                if (success) {
                    await laddaOchRenderaTräd();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte lägga till. Finns redan eller ogiltigt.");
            };
        }
    }

    // Nytt företag
    const nyttForetagBtn = document.getElementById('nyttForetagFullBtn');
    if (nyttForetagBtn) {
        nyttForetagBtn.onclick = async function() {
            const newName = prompt("Ange nytt företagsnamn:");
            if (newName && await laggTillForetag(newName)) {
                await laddaOchRenderaTräd();
                if (uppdateringsCallback) uppdateringsCallback();
            } else alert("Kunde inte lägga till företag.");
        };
    }

    // Stäng-knapp
    const stangBtn = document.getElementById('stangFullModalBtn');
    if (stangBtn) {
        stangBtn.onclick = function() {
            modal.remove();
            if (efterStangningCallback) efterStangningCallback();
        };
    }

    // Ladda trädet
    laddaOchRenderaTräd();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
