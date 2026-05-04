// ============================================
// HANTERING AV FÖRETAG, PROJEKT, LEVERANTÖRER OCH DELAR
// ALL DATA LAGRAS I FIREBASE REALTIME DATABASE
// ============================================

let databasReferens = null;
let uppdateringsCallback = null;

// Rensar strängar så att de kan användas som Firebase-nycklar
function rensaNyckel(sträng) {
    if (!sträng) return '';
    return sträng
        .replace(/\./g, '-')
        .replace(/[#$\[\]\/]/g, '_')
        .replace(/\s+/g, '_');
}

// Initierar modulen med Firebase-databasreferens och callback
function initieraHierarki(databas, callback) {
    databasReferens = databas;
    uppdateringsCallback = callback;
    console.log("✅ Hierarkimodul initierad (Företag/Projekt/Leverantör/Del)");
}

// ========== FÖRETAG ==========
async function hamtaForetag() {
    if (!databasReferens) return [];
    try {
        const snapshot = await databasReferens.ref('foretag').once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data).map(företag => företag.namn).sort();
    } catch (fel) {
        console.error('Fel vid hämtning av företag:', fel);
        return [];
    }
}

async function laggTillForetag(foretag) {
    if (!foretag || foretag.trim() === "") return false;
    if (!databasReferens) return false;
    try {
        const namn = foretag.trim();
        const nyckel = rensaNyckel(namn);
        const finns = await databasReferens.ref(`foretag/${nyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${nyckel}`).set({
            namn: namn,
            projekt: {}
        });
        console.log(`✅ Företag "${namn}" har lagts till`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid tillägg av företag:', fel);
        return false;
    }
}

async function redigeraForetag(gammaltNamn, nyttNamn) {
    if (!gammaltNamn || !nyttNamn || nyttNamn.trim() === "") return false;
    if (gammaltNamn === nyttNamn.trim()) return true;
    if (!databasReferens) return false;
    try {
        const gammalNyckel = rensaNyckel(gammaltNamn);
        const nyNyckel = rensaNyckel(nyttNamn.trim());
        const data = (await databasReferens.ref(`foretag/${gammalNyckel}`).once('value')).val();
        if (!data) return false;
        await databasReferens.ref(`foretag/${nyNyckel}`).set({
            namn: nyttNamn.trim(),
            projekt: data.projekt || {}
        });
        await databasReferens.ref(`foretag/${gammalNyckel}`).remove();
        console.log(`✅ Företag "${gammaltNamn}" har bytt namn till "${nyttNamn.trim()}"`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid redigering av företag:', fel);
        return false;
    }
}

async function taBortForetag(foretag) {
    if (!foretag) return false;
    if (!databasReferens) return false;
    try {
        const nyckel = rensaNyckel(foretag);
        await databasReferens.ref(`foretag/${nyckel}`).remove();
        console.log(`✅ Företag "${foretag}" har tagits bort`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid borttagning av företag:', fel);
        return false;
    }
}

async function filtreraForetag(sokterm) {
    const foretag = await hamtaForetag();
    if (!sokterm) return foretag;
    return foretag.filter(f => f.toLowerCase().includes(sokterm.toLowerCase()));
}

// ========== PROJEKT ==========
async function hamtaProjekt(foretag) {
    if (!foretag) return [];
    if (!databasReferens) return [];
    try {
        const nyckel = rensaNyckel(foretag);
        const snapshot = await databasReferens.ref(`foretag/${nyckel}/projekt`).once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data).map(projekt => projekt.namn).sort();
    } catch (fel) {
        console.error('Fel vid hämtning av projekt:', fel);
        return [];
    }
}

async function laggTillProjekt(foretag, projekt) {
    if (!foretag || !projekt || projekt.trim() === "") return false;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNamn = projekt.trim();
        const projektNyckel = rensaNyckel(projektNamn);
        const finns = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}`).set({ namn: projektNamn, leverantörer: {} });
        console.log(`✅ Projekt "${projektNamn}" har lagts till under ${foretag}`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid tillägg av projekt:', fel);
        return false;
    }
}

async function redigeraProjekt(foretag, gammaltProjekt, nyttProjekt) {
    if (!foretag || !gammaltProjekt || !nyttProjekt || nyttProjekt.trim() === "") return false;
    if (gammaltProjekt === nyttProjekt.trim()) return true;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const gammalNyckel = rensaNyckel(gammaltProjekt);
        const nyNyckel = rensaNyckel(nyttProjekt.trim());
        const projektData = (await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${gammalNyckel}`).once('value')).val();
        if (!projektData) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${nyNyckel}`).set({
            namn: nyttProjekt.trim(),
            leverantörer: projektData.leverantörer || {}
        });
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${gammalNyckel}`).remove();
        console.log(`✅ Projekt "${gammaltProjekt}" har bytt namn till "${nyttProjekt.trim()}"`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid redigering av projekt:', fel);
        return false;
    }
}

async function taBortProjekt(foretag, projekt) {
    if (!foretag || !projekt) return false;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}`).remove();
        console.log(`✅ Projekt "${projekt}" har tagits bort från ${foretag}`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid borttagning av projekt:', fel);
        return false;
    }
}

// ========== LEVERANTÖR ==========
async function hamtaLeverantörer(foretag, projekt) {
    if (!foretag || !projekt) return [];
    if (!databasReferens) return [];
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const snapshot = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer`).once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data).map(l => l.namn).sort();
    } catch (fel) {
        console.error('Fel vid hämtning av leverantörer:', fel);
        return [];
    }
}

async function laggTillLeverantör(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor || leverantor.trim() === "") return false;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const leverantorNamn = leverantor.trim();
        const leverantorNyckel = rensaNyckel(leverantorNamn);
        const finns = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}`).set({ namn: leverantorNamn, delar: {} });
        console.log(`✅ Leverantör "${leverantorNamn}" har lagts till under ${foretag}/${projekt}`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid tillägg av leverantör:', fel);
        return false;
    }
}

async function redigeraLeverantör(foretag, projekt, gammalLeverantor, nyLeverantor) {
    if (!foretag || !projekt || !gammalLeverantor || !nyLeverantor || nyLeverantor.trim() === "") return false;
    if (gammalLeverantor === nyLeverantor.trim()) return true;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const gammalNyckel = rensaNyckel(gammalLeverantor);
        const nyNyckel = rensaNyckel(nyLeverantor.trim());
        const leverantorData = (await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${gammalNyckel}`).once('value')).val();
        if (!leverantorData) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${nyNyckel}`).set({
            namn: nyLeverantor.trim(),
            delar: leverantorData.delar || {}
        });
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${gammalNyckel}`).remove();
        console.log(`✅ Leverantör "${gammalLeverantor}" har bytt namn till "${nyLeverantor.trim()}"`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid redigering av leverantör:', fel);
        return false;
    }
}

async function taBortLeverantör(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return false;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const leverantorNyckel = rensaNyckel(leverantor);
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}`).remove();
        console.log(`✅ Leverantör "${leverantor}" har tagits bort från ${foretag}/${projekt}`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid borttagning av leverantör:', fel);
        return false;
    }
}

// ========== DEL ==========
async function hamtaDelar(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return [];
    if (!databasReferens) return [];
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const leverantorNyckel = rensaNyckel(leverantor);
        const snapshot = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}/delar`).once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data).map(d => d.namn).sort();
    } catch (fel) {
        console.error('Fel vid hämtning av delar:', fel);
        return [];
    }
}

async function laggTillDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del || del.trim() === "") return false;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const leverantorNyckel = rensaNyckel(leverantor);
        const delNamn = del.trim();
        const delNyckel = rensaNyckel(delNamn);
        const finns = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}/delar/${delNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}/delar/${delNyckel}`).set({ namn: delNamn });
        console.log(`✅ Del "${delNamn}" har lagts till under ${foretag}/${projekt}/${leverantor}`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid tillägg av del:', fel);
        return false;
    }
}

async function redigeraDel(foretag, projekt, leverantor, gammalDel, nyDel) {
    if (!foretag || !projekt || !leverantor || !gammalDel || !nyDel || nyDel.trim() === "") return false;
    if (gammalDel === nyDel.trim()) return true;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const leverantorNyckel = rensaNyckel(leverantor);
        const gammalNyckel = rensaNyckel(gammalDel);
        const nyNyckel = rensaNyckel(nyDel.trim());
        const delData = (await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}/delar/${gammalNyckel}`).once('value')).val();
        if (!delData) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}/delar/${nyNyckel}`).set({ namn: nyDel.trim() });
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}/delar/${gammalNyckel}`).remove();
        console.log(`✅ Del "${gammalDel}" har bytt namn till "${nyDel.trim()}"`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid redigering av del:', fel);
        return false;
    }
}

async function taBortDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del) return false;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNyckel = rensaNyckel(projekt);
        const leverantorNyckel = rensaNyckel(leverantor);
        const delNyckel = rensaNyckel(del);
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}/leverantörer/${leverantorNyckel}/delar/${delNyckel}`).remove();
        console.log(`✅ Del "${del}" har tagits bort från ${foretag}/${projekt}/${leverantor}`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid borttagning av del:', fel);
        return false;
    }
}

// ========== MODALT FÖNSTER FÖR HANTERING ==========
function visaModalHantering(efterStangningCallback) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); display: flex; justify-content: center;
        align-items: center; z-index: 2000; backdrop-filter: blur(3px);
    `;
    
    const renderaLista = async () => {
        const foretag = await hamtaForetag();
        let html = `<div style="max-height: 500px; overflow-y: auto; margin-bottom: 1rem;">`;
        if (foretag.length === 0) {
            html += `<div style="text-align:center; padding:2rem; color:#999;">Inga företag har lagts till än.</div>`;
        }
        for (const f of foretag) {
            const projekt = await hamtaProjekt(f);
            html += `
                <div style="margin-bottom: 1.5rem; border: 1px solid #e2edf5; border-radius: 0.8rem; padding: 0.8rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong><i class="fas fa-building"></i> ${escapeHtml(f)}</strong>
                        <div>
                            <button class="redigera-foretag" data-foretag="${escapeHtml(f)}" style="background: #eef3fc; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; margin-right: 0.3rem;"><i class="fas fa-edit"></i></button>
                            <button class="taBort-foretag" data-foretag="${escapeHtml(f)}" style="background: #fee2e2; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; color: #b91c2c;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div style="margin-left: 1rem; margin-top: 0.5rem;">
                        <div style="font-size:0.8rem; color:#4a6f8f;">Projekt:</div>
                        <ul style="margin-left: 1.5rem;">`;
            if (projekt.length === 0) {
                html += `<li style="color:#999;">Inga projekt</li>`;
            } else {
                for (const p of projekt) {
                    const leverantorer = await hamtaLeverantörer(f, p);
                    html += `
                        <li style="margin-bottom: 0.8rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span><i class="fas fa-project-diagram"></i> <strong>${escapeHtml(p)}</strong></span>
                                <div>
                                    <button class="redigera-projekt" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background: #eef3fc; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                    <button class="taBort-projekt" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background: #fee2e2; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <div style="margin-left: 1.5rem; margin-top: 0.3rem;">
                                <div style="font-size:0.75rem; color:#4a6f8f;">Leverantörer:</div>
                                <ul style="margin-left: 1rem;">`;
                    if (leverantorer.length === 0) {
                        html += `<li style="color:#999;">Inga leverantörer</li>`;
                    } else {
                        for (const l of leverantorer) {
                            const delar = await hamtaDelar(f, p, l);
                            html += `
                                <li style="margin-bottom: 0.5rem;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span><i class="fas fa-truck"></i> ${escapeHtml(l)}</span>
                                        <div>
                                            <button class="redigera-leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" style="background: #eef3fc; border: none; padding: 0.1rem 0.4rem; border-radius: 1rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                            <button class="taBort-leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" style="background: #fee2e2; border: none; padding: 0.1rem 0.4rem; border-radius: 1rem; font-size:0.7rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <div style="margin-left: 1.5rem;">
                                        <div style="font-size:0.7rem; color:#4a6f8f;">Delar:</div>
                                        <ul style="margin-left: 1rem;">`;
                            if (delar.length === 0) {
                                html += `<li style="color:#999;">Inga delar</li>`;
                            } else {
                                for (const d of delar) {
                                    html += `
                                        <li style="display: flex; justify-content: space-between;">
                                            <span><i class="fas fa-puzzle-piece"></i> ${escapeHtml(d)}</span>
                                            <div>
                                                <button class="redigera-del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" style="background: #eef3fc; border: none; padding: 0.1rem 0.4rem; border-radius: 1rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                                <button class="taBort-del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" data-del="${escapeHtml(d)}" style="background: #fee2e2; border: none; padding: 0.1rem 0.4rem; border-radius: 1rem; font-size:0.7rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                                            </div>
                                        </li>`;
                                }
                            }
                            html += `</ul>
                                        <button class="laggTill-del" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" data-leverantor="${escapeHtml(l)}" style="background: #e2e8f0; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem; margin-top:0.2rem;"><i class="fas fa-plus"></i> Lägg till del</button>
                                    </div>
                                </li>`;
                        }
                    }
                    html += `</ul>
                                <button class="laggTill-leverantor" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background: #e2e8f0; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size:0.7rem; margin-top:0.3rem;"><i class="fas fa-plus"></i> Lägg till leverantör</button>
                            </div>
                        </li>`;
                }
            }
            html += `</ul>
                    <button class="laggTill-projekt" data-foretag="${escapeHtml(f)}" style="background: #e2e8f0; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size:0.7rem; margin-top:0.5rem;"><i class="fas fa-plus"></i> Lägg till projekt</button>
                </div>
            </div>`;
        }
        html += `</div>
            <div style="display: flex; justify-content: space-between; gap: 1rem;">
                <button id="nyttForetagBtn" style="background: #2c7cb6; color: white; border: none; padding: 0.6rem 1rem; border-radius: 2rem;"><i class="fas fa-plus-circle"></i> Nytt företag</button>
                <button id="stangModalBtn" style="background: #e2e8f0; border: none; padding: 0.6rem 1rem; border-radius: 2rem;">Stäng</button>
            </div>`;
        
        const innehall = modal.querySelector('.modal-innehall');
        if (innehall) innehall.innerHTML = html;
        
        // Händelsehanterare
        modal.querySelectorAll('.redigera-foretag').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const gammalt = knapp.dataset.foretag;
                const nytt = prompt("Nytt företagsnamn:", gammalt);
                if (nytt && nytt !== gammalt) {
                    const ok = await redigeraForetag(gammalt, nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Kunde inte ändra. Namnet kanske redan finns.");
                }
            });
        });
        modal.querySelectorAll('.taBort-foretag').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const foretag = knapp.dataset.foretag;
                if (confirm(`Ta bort företaget "${foretag}" och alla dess projekt, leverantörer och delar?`)) {
                    await taBortForetag(foretag);
                    await renderaLista();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-projekt').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const foretag = knapp.dataset.foretag;
                const nytt = prompt("Nytt projektnamn:");
                if (nytt) {
                    const ok = await laggTillProjekt(foretag, nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Kunde inte lägga till projekt. Det kanske redan finns.");
                }
            });
        });
        modal.querySelectorAll('.redigera-projekt').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                const nytt = prompt("Nytt projektnamn:", p);
                if (nytt && nytt !== p) {
                    const ok = await redigeraProjekt(f, p, nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Kunde inte ändra projekt.");
                }
            });
        });
        modal.querySelectorAll('.taBort-projekt').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                if (confirm(`Ta bort projektet "${p}"?`)) {
                    await taBortProjekt(f, p);
                    await renderaLista();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-leverantor').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                const nytt = prompt("Ny leverantör:");
                if (nytt) {
                    const ok = await laggTillLeverantör(f, p, nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Kunde inte lägga till leverantör.");
                }
            });
        });
        modal.querySelectorAll('.redigera-leverantor').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                const l = knapp.dataset.leverantor;
                const nytt = prompt("Nytt leverantörsnamn:", l);
                if (nytt && nytt !== l) {
                    const ok = await redigeraLeverantör(f, p, l, nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Kunde inte ändra leverantör.");
                }
            });
        });
        modal.querySelectorAll('.taBort-leverantor').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                const l = knapp.dataset.leverantor;
                if (confirm(`Ta bort leverantören "${l}"?`)) {
                    await taBortLeverantör(f, p, l);
                    await renderaLista();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-del').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                const l = knapp.dataset.leverantor;
                const nytt = prompt("Ny del:");
                if (nytt) {
                    const ok = await laggTillDel(f, p, l, nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Kunde inte lägga till del.");
                }
            });
        });
        modal.querySelectorAll('.redigera-del').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                const l = knapp.dataset.leverantor;
                const d = knapp.dataset.del;
                const nytt = prompt("Nytt delnamn:", d);
                if (nytt && nytt !== d) {
                    const ok = await redigeraDel(f, p, l, d, nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Kunde inte ändra del.");
                }
            });
        });
        modal.querySelectorAll('.taBort-del').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const f = knapp.dataset.foretag;
                const p = knapp.dataset.projekt;
                const l = knapp.dataset.leverantor;
                const d = knapp.dataset.del;
                if (confirm(`Ta bort delen "${d}"?`)) {
                    await taBortDel(f, p, l, d);
                    await renderaLista();
                    if (uppdateringsCallback) uppdateringsCallback();
                }
            });
        });
        const nyttForetagBtn = modal.querySelector('#nyttForetagBtn');
        if (nyttForetagBtn) {
            nyttForetagBtn.addEventListener('click', async () => {
                const nytt = prompt("Nytt företagsnamn:");
                if (nytt) {
                    const ok = await laggTillForetag(nytt);
                    if (ok) { await renderaLista(); if (uppdateringsCallback) uppdateringsCallback(); }
                    else alert("Företaget finns redan eller ogiltigt namn.");
                }
            });
        }
        const stangBtn = modal.querySelector('#stangModalBtn');
        if (stangBtn) {
            stangBtn.addEventListener('click', () => {
                modal.remove();
                if (efterStangningCallback) efterStangningCallback();
            });
        }
    };
    
    modal.innerHTML = '<div class="modal-innehall" style="background: white; border-radius: 1.5rem; width: 90%; max-width: 800px; max-height: 85vh; overflow-y: auto; padding: 1.5rem;"></div>';
    document.body.appendChild(modal);
    renderaLista();
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