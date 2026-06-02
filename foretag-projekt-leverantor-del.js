// ============================================
// HANTERING AV FÖRETAG, PROJEKT, LEVERANTÖR, DEL, KOD
// ALL DATA LAGRAS I FIREBASE REALTIME DATABASE
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
    const snap = await databasReferens.ref('foretag').once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.values(data).map(f => f.namn).sort();
}

async function laggTillForetag(foretag) {
    if (!foretag?.trim()) return false;
    const namn = foretag.trim();
    const nyckel = rensaNyckel(namn);
    const finns = await databasReferens.ref(`foretag/${nyckel}`).once('value');
    if (finns.exists()) return false;
    await databasReferens.ref(`foretag/${nyckel}`).set({ namn, projekt: {} });
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function redigeraForetag(gammalt, nytt) {
    if (!gammalt || !nytt?.trim()) return false;
    if (gammalt === nytt.trim()) return true;
    const gammalNyckel = rensaNyckel(gammalt);
    const nyNyckel = rensaNyckel(nytt.trim());
    const data = (await databasReferens.ref(`foretag/${gammalNyckel}`).once('value')).val();
    if (!data) return false;
    await databasReferens.ref(`foretag/${nyNyckel}`).set({ namn: nytt.trim(), projekt: data.projekt || {} });
    await databasReferens.ref(`foretag/${gammalNyckel}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function taBortForetag(foretag) {
    if (!foretag) return false;
    await databasReferens.ref(`foretag/${rensaNyckel(foretag)}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function filtreraForetag(sok) {
    const alla = await hamtaForetag();
    if (!sok) return alla;
    return alla.filter(f => f.toLowerCase().includes(sok.toLowerCase()));
}

// ========== PROJEKT ==========
async function hamtaProjekt(foretag) {
    if (!foretag) return [];
    const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt`).once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.values(data).map(p => p.namn).sort();
}

async function laggTillProjekt(foretag, projekt) {
    if (!foretag || !projekt?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNamn = projekt.trim();
    const pNyckel = rensaNyckel(pNamn);
    const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}`).once('value');
    if (finns.exists()) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}`).set({ namn: pNamn, leverantörer: {} });
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function redigeraProjekt(foretag, gammalt, nytt) {
    if (!foretag || !gammalt || !nytt?.trim()) return false;
    if (gammalt === nytt.trim()) return true;
    const fNyckel = rensaNyckel(foretag);
    const gNyckel = rensaNyckel(gammalt);
    const nNyckel = rensaNyckel(nytt.trim());
    const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${gNyckel}`).once('value')).val();
    if (!data) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${nNyckel}`).set({ namn: nytt.trim(), leverantörer: data.leverantörer || {} });
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${gNyckel}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function taBortProjekt(foretag, projekt) {
    if (!foretag || !projekt) return false;
    await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

// ========== LEVERANTÖR ==========
async function hamtaLeverantörer(foretag, projekt) {
    if (!foretag || !projekt) return [];
    const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer`).once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.values(data).map(l => l.namn).sort();
}

async function laggTillLeverantör(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNamn = leverantor.trim();
    const lNyckel = rensaNyckel(lNamn);
    const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}`).once('value');
    if (finns.exists()) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}`).set({ namn: lNamn, delar: {} });
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function redigeraLeverantör(foretag, projekt, gammal, nytt) {
    if (!foretag || !projekt || !gammal || !nytt?.trim()) return false;
    if (gammal === nytt.trim()) return true;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim());
    const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${gNyckel}`).once('value')).val();
    if (!data) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${nNyckel}`).set({ namn: nytt.trim(), delar: data.delar || {} });
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${gNyckel}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function taBortLeverantör(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return false;
    await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

// ========== DEL ==========
async function hamtaDelar(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return [];
    const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar`).once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.values(data).map(d => d.namn).sort();
}

async function laggTillDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNamn = del.trim();
    const dNyckel = rensaNyckel(dNamn);
    const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}`).once('value');
    if (finns.exists()) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}`).set({ namn: dNamn, koder: {} });
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function redigeraDel(foretag, projekt, leverantor, gammal, nytt) {
    if (!foretag || !projekt || !leverantor || !gammal || !nytt?.trim()) return false;
    if (gammal === nytt.trim()) return true;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim());
    const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${gNyckel}`).once('value')).val();
    if (!data) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${nNyckel}`).set({ namn: nytt.trim(), koder: data.koder || {} });
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${gNyckel}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function taBortDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del) return false;
    await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar/${rensaNyckel(del)}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

// ========== KOD ==========
async function hamtaKoder(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del) return [];
    const snap = await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar/${rensaNyckel(del)}/koder`).once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.values(data).map(k => k.namn).sort();
}

async function laggTillKod(foretag, projekt, leverantor, del, kod) {
    if (!foretag || !projekt || !leverantor || !del || !kod?.trim()) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNyckel = rensaNyckel(del);
    const kNamn = kod.trim().toUpperCase();
    const kNyckel = rensaNyckel(kNamn);
    const finns = await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${kNyckel}`).once('value');
    if (finns.exists()) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${kNyckel}`).set({ namn: kNamn });
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
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
    const data = (await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${gNyckel}`).once('value')).val();
    if (!data) return false;
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${nNyckel}`).set({ namn: nytt.trim().toUpperCase() });
    await databasReferens.ref(`foretag/${fNyckel}/projekt/${pNyckel}/leverantörer/${lNyckel}/delar/${dNyckel}/koder/${gNyckel}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

async function taBortKod(foretag, projekt, leverantor, del, kod) {
    if (!foretag || !projekt || !leverantor || !del || !kod) return false;
    await databasReferens.ref(`foretag/${rensaNyckel(foretag)}/projekt/${rensaNyckel(projekt)}/leverantörer/${rensaNyckel(leverantor)}/delar/${rensaNyckel(del)}/koder/${rensaNyckel(kod)}`).remove();
    if (uppdateringsCallback) await uppdateringsCallback();
    return true;
}

// ========== MODALT FÖNSTER FÖR HANTERING (uppdaterat) ==========
function visaModalHantering(efterStangningCallback) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); display: flex; justify-content: center;
        align-items: center; z-index: 2000; backdrop-filter: blur(3px);
    `;

    const rendera = async () => {
        const foretagLista = await hamtaForetag();
        let html = `<div style="max-height: 500px; overflow-y: auto; margin-bottom: 1rem;">`;

        for (const f of foretagLista) {
            const projektLista = await hamtaProjekt(f);
            html += `
                <div style="margin-bottom: 1.5rem; border: 1px solid #e2edf5; border-radius: 0.8rem; padding: 0.8rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong><i class="fas fa-building"></i> ${escapeHtml(f)}</strong>
                        <div>
                            <button class="redigera-foretag" data-foretag="${escapeHtml(f)}" style="background:#eef3fc; border:none; padding:0.2rem 0.6rem; border-radius:1rem;"><i class="fas fa-edit"></i></button>
                            <button class="taBort-foretag" data-foretag="${escapeHtml(f)}" style="background:#fee2e2; border:none; padding:0.2rem 0.6rem; border-radius:1rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div style="margin-left:1rem;">
                        <div style="font-size:0.8rem; color:#4a6f8f;">Projekt:</div>
                        <ul style="margin-left:1.5rem;">`;
            if (projektLista.length === 0) html += `<li>Inga projekt</li>`;
            for (const p of projektLista) {
                const leverantörLista = await hamtaLeverantörer(f, p);
                html += `
                    <li style="margin-bottom:0.8rem;">
                        <div style="display:flex; justify-content:space-between;">
                            <span><i class="fas fa-project-diagram"></i> <strong>${escapeHtml(p)}</strong></span>
                            <div>
                                <button class="redigera-projekt" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background:#eef3fc; border:none; padding:0.1rem 0.5rem; border-radius:1rem;"><i class="fas fa-edit"></i></button>
                                <button class="taBort-projekt" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background:#fee2e2; border:none; padding:0.1rem 0.5rem; border-radius:1rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div style="margin-left:1.5rem;">
                            <div style="font-size:0.75rem;">Leverantörer:</div>
                            <ul style="margin-left:1rem;">`;
                if (leverantörLista.length === 0) html += `<li>Inga leverantörer</li>`;
                for (const l of leverantörLista) {
                    const delLista = await hamtaDelar(f, p, l);
                    html += `
                        <li>
                            <div style="display:flex; justify-content:space-between;">
                                <span><i class="fas fa-truck"></i> ${escapeHtml(l)}</span>
                                <div>
                                    <button class="redigera-leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" style="background:#eef3fc; border:none; padding:0.1rem 0.4rem; border-radius:1rem;"><i class="fas fa-edit"></i></button>
                                    <button class="taBort-leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" style="background:#fee2e2; border:none; padding:0.1rem 0.4rem; border-radius:1rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <div style="margin-left:1.5rem;">
                                <div style="font-size:0.75rem;">Delar:</div>
                                <ul style="margin-left:1rem;">`;
                    if (delLista.length === 0) html += `<li>Inga delar</li>`;
                    for (const d of delLista) {
                        const kodLista = await hamtaKoder(f, p, l, d);
                        html += `
                            <li>
                                <div style="display:flex; justify-content:space-between;">
                                    <span><i class="fas fa-puzzle-piece"></i> ${escapeHtml(d)}</span>
                                    <div>
                                        <button class="redigera-del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" style="background:#eef3fc; border:none; padding:0.1rem 0.4rem; border-radius:1rem;"><i class="fas fa-edit"></i></button>
                                        <button class="taBort-del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" style="background:#fee2e2; border:none; padding:0.1rem 0.4rem; border-radius:1rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                                <div style="margin-left:1.5rem;">
                                    <div style="font-size:0.75rem;">Koder:</div>
                                    <ul style="margin-left:1rem;">`;
                        if (kodLista.length === 0) html += `<li>Inga koder</li>`;
                        for (const k of kodLista) {
                            html += `
                                <li style="display:flex; justify-content:space-between;">
                                    <span><i class="fas fa-tag"></i> ${escapeHtml(k)}</span>
                                    <div>
                                        <button class="redigera-kod" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" data-kod="${escapeHtml(k)}" style="background:#eef3fc; border:none; padding:0.1rem 0.4rem; border-radius:1rem;"><i class="fas fa-edit"></i></button>
                                        <button class="taBort-kod" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" data-kod="${escapeHtml(k)}" style="background:#fee2e2; border:none; padding:0.1rem 0.4rem; border-radius:1rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                                    </div>
                                </li>`;
                        }
                        html += `</ul>
                                    <button class="laggTill-kod" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" style="background:#e2e8f0; border:none; padding:0.1rem 0.5rem; border-radius:1rem; margin-top:0.2rem;"><i class="fas fa-plus"></i> Lägg till kod</button>
                                </div>
                            </li>`;
                    }
                    html += `</ul>
                                <button class="laggTill-del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" style="background:#e2e8f0; border:none; padding:0.1rem 0.5rem; border-radius:1rem; margin-top:0.2rem;"><i class="fas fa-plus"></i> Lägg till del</button>
                            </div>
                        </li>`;
                }
                html += `</ul>
                            <button class="laggTill-leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background:#e2e8f0; border:none; padding:0.2rem 0.6rem; border-radius:1rem; margin-top:0.3rem;"><i class="fas fa-plus"></i> Lägg till leverantör</button>
                        </div>
                    </li>`;
            }
            html += `</ul>
                        <button class="laggTill-projekt" data-foretag="${escapeHtml(f)}" style="background:#e2e8f0; border:none; padding:0.2rem 0.6rem; border-radius:1rem; margin-top:0.5rem;"><i class="fas fa-plus"></i> Lägg till projekt</button>
                    </div>
                </div>`;
        }
        html += `</div>
            <div style="display: flex; justify-content: space-between;">
                <button id="nyttForetagBtn" style="background:#2c7cb6; color:white; border:none; padding:0.6rem 1rem; border-radius:2rem;"><i class="fas fa-plus-circle"></i> Nytt företag</button>
                <button id="stangModalBtn" style="background:#e2e8f0; border:none; padding:0.6rem 1rem; border-radius:2rem;">Stäng</button>
            </div>`;
        const innehall = modal.querySelector('.modal-innehall');
        if (innehall) innehall.innerHTML = html;

        // Händelsehanterare för alla nivåer
        modal.querySelectorAll('.redigera-foretag').forEach(btn => {
            btn.addEventListener('click', async () => {
                const gammalt = btn.dataset.foretag;
                const nytt = prompt("Nytt företagsnamn:", gammalt);
                if (nytt && nytt !== gammalt && await redigeraForetag(gammalt, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte ändra eller namn finns redan.");
            });
        });
        modal.querySelectorAll('.taBort-foretag').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm(`Ta bort företaget "${btn.dataset.foretag}" och allt under det?`)) {
                    await taBortForetag(btn.dataset.foretag);
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-projekt').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag;
                const nytt = prompt("Nytt projektnamn:");
                if (nytt && await laggTillProjekt(f, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte lägga till projekt.");
            });
        });
        modal.querySelectorAll('.redigera-projekt').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag, p = btn.dataset.projekt;
                const nytt = prompt("Nytt projektnamn:", p);
                if (nytt && nytt !== p && await redigeraProjekt(f, p, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte ändra projekt.");
            });
        });
        modal.querySelectorAll('.taBort-projekt').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm(`Ta bort projektet "${btn.dataset.projekt}"?`)) {
                    await taBortProjekt(btn.dataset.foretag, btn.dataset.projekt);
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-leverantor').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag, p = btn.dataset.projekt;
                const nytt = prompt("Ny leverantör:");
                if (nytt && await laggTillLeverantör(f, p, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte lägga till leverantör.");
            });
        });
        modal.querySelectorAll('.redigera-leverantor').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag, p = btn.dataset.projekt, l = btn.dataset.leverantor;
                const nytt = prompt("Nytt leverantörsnamn:", l);
                if (nytt && nytt !== l && await redigeraLeverantör(f, p, l, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte ändra leverantör.");
            });
        });
        modal.querySelectorAll('.taBort-leverantor').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm(`Ta bort leverantören "${btn.dataset.leverantor}"?`)) {
                    await taBortLeverantör(btn.dataset.foretag, btn.dataset.projekt, btn.dataset.leverantor);
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag, p = btn.dataset.projekt, l = btn.dataset.leverantor;
                const nytt = prompt("Ny del:");
                if (nytt && await laggTillDel(f, p, l, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte lägga till del.");
            });
        });
        modal.querySelectorAll('.redigera-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag, p = btn.dataset.projekt, l = btn.dataset.leverantor, d = btn.dataset.del;
                const nytt = prompt("Nytt delnamn:", d);
                if (nytt && nytt !== d && await redigeraDel(f, p, l, d, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte ändra del.");
            });
        });
        modal.querySelectorAll('.taBort-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm(`Ta bort delen "${btn.dataset.del}"?`)) {
                    await taBortDel(btn.dataset.foretag, btn.dataset.projekt, btn.dataset.leverantor, btn.dataset.del);
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-kod').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag, p = btn.dataset.projekt, l = btn.dataset.leverantor, d = btn.dataset.del;
                const nytt = prompt("Ny kod (t.ex. CBB.32):");
                if (nytt && await laggTillKod(f, p, l, d, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte lägga till kod.");
            });
        });
        modal.querySelectorAll('.redigera-kod').forEach(btn => {
            btn.addEventListener('click', async () => {
                const f = btn.dataset.foretag, p = btn.dataset.projekt, l = btn.dataset.leverantor, d = btn.dataset.del, k = btn.dataset.kod;
                const nytt = prompt("Ny kod:", k);
                if (nytt && nytt !== k && await redigeraKod(f, p, l, d, k, nytt)) {
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                } else alert("Kunde inte ändra kod.");
            });
        });
        modal.querySelectorAll('.taBort-kod').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm(`Ta bort koden "${btn.dataset.kod}"?`)) {
                    await taBortKod(btn.dataset.foretag, btn.dataset.projekt, btn.dataset.leverantor, btn.dataset.del, btn.dataset.kod);
                    await rendera();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        document.getElementById('nyttForetagBtn')?.addEventListener('click', async () => {
            const nytt = prompt("Nytt företagsnamn:");
            if (nytt && await laggTillForetag(nytt)) {
                await rendera();
                if (uppdateringsCallback) uppdateringsCallback();
            } else alert("Företaget finns redan eller ogiltigt.");
        });
        document.getElementById('stangModalBtn')?.addEventListener('click', () => {
            modal.remove();
            if (efterStangningCallback) efterStangningCallback();
        });
    };
    modal.innerHTML = '<div class="modal-innehall" style="background:white; border-radius:1.5rem; width:90%; max-width:800px; max-height:85vh; overflow-y:auto; padding:1.5rem;"></div>';
    document.body.appendChild(modal);
    rendera();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
