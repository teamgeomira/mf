// ============================================
// HANTERING AV FÖRETAG OCH PROJEKT
// ALL DATA LAGRAS I FIREBASE REALTIME DATABASE
// ============================================

let databasReferens = null;
let uppdateringsCallback = null;

// Rensar strängar så att de kan användas som Firebase-nycklar
// Firebase tillåter inte: . # $ [ ] / samt blanksteg
function rensaNyckel(sträng) {
    if (!sträng) return '';
    return sträng
        .replace(/\./g, '-')
        .replace(/[#$\[\]\/]/g, '_')
        .replace(/\s+/g, '_');
}

// Initierar modulen med Firebase-databasreferens och callback
function initieraForetagProjekt(databas, callback) {
    databasReferens = databas;
    uppdateringsCallback = callback;
    console.log("✅ Företags- och projektmodul initierad");
}

// Hämtar alla företag (returnerar en lista med företagsnamn)
async function hamtaForetag() {
    if (!databasReferens) return [];
    try {
        const snapshot = await databasReferens.ref('foretag').once('value');
        const data = snapshot.val();
        if (!data) return [];
        // Returnerar företagens ursprungliga namn sorterade i bokstavsordning
        return Object.values(data).map(företag => företag.namn).sort();
    } catch (fel) {
        console.error('Fel vid hämtning av företag:', fel);
        return [];
    }
}

// Hämtar alla projekt för ett specifikt företag (returnerar lista med projektnamn)
async function hamtaProjekt(foretag) {
    if (!databasReferens || !foretag) return [];
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

// Lägger till ett nytt företag
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

// Lägger till ett nytt projekt under ett företag
async function laggTillProjekt(foretag, projekt) {
    if (!foretag || !projekt || projekt.trim() === "") return false;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const projektNamn = projekt.trim();
        const projektNyckel = rensaNyckel(projektNamn);
        const finns = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}`).once('value');
        if (finns.exists()) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${projektNyckel}`).set({ namn: projektNamn });
        console.log(`✅ Projekt "${projektNamn}" har lagts till under ${foretag}`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid tillägg av projekt:', fel);
        return false;
    }
}

// Ändrar namn på ett företag
async function redigeraForetag(gammaltNamn, nyttNamn) {
    if (!gammaltNamn || !nyttNamn || nyttNamn.trim() === "") return false;
    if (gammaltNamn === nyttNamn.trim()) return true;
    if (!databasReferens) return false;
    try {
        const gammalNyckel = rensaNyckel(gammaltNamn);
        const nyNyckel = rensaNyckel(nyttNamn.trim());
        const dataSnapshot = await databasReferens.ref(`foretag/${gammalNyckel}`).once('value');
        const data = dataSnapshot.val();
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

// Ändrar namn på ett projekt
async function redigeraProjekt(foretag, gammaltProjekt, nyttProjekt) {
    if (!foretag || !gammaltProjekt || !nyttProjekt || nyttProjekt.trim() === "") return false;
    if (gammaltProjekt === nyttProjekt.trim()) return true;
    if (!databasReferens) return false;
    try {
        const foretagsNyckel = rensaNyckel(foretag);
        const gammalNyckel = rensaNyckel(gammaltProjekt);
        const nyNyckel = rensaNyckel(nyttProjekt.trim());
        const gammaltSnapshot = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${gammalNyckel}`).once('value');
        if (!gammaltSnapshot.exists()) return false;
        const nyttSnapshot = await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${nyNyckel}`).once('value');
        if (nyttSnapshot.exists()) return false;
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${nyNyckel}`).set({ namn: nyttProjekt.trim() });
        await databasReferens.ref(`foretag/${foretagsNyckel}/projekt/${gammalNyckel}`).remove();
        console.log(`✅ Projekt "${gammaltProjekt}" har bytt namn till "${nyttProjekt.trim()}"`);
        if (uppdateringsCallback) await uppdateringsCallback();
        return true;
    } catch (fel) {
        console.error('Fel vid redigering av projekt:', fel);
        return false;
    }
}

// Tar bort ett företag och alla dess projekt
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

// Tar bort ett projekt från ett företag
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

// Filtrerar företag baserat på sökterm (används i rullgardinsmeny)
async function filtreraForetag(sokterm) {
    const foretag = await hamtaForetag();
    if (!sokterm) return foretag;
    return foretag.filter(f => f.toLowerCase().includes(sokterm.toLowerCase()));
}

// Filtrerar projekt baserat på sökterm (används i rullgardinsmeny)
async function filtreraProjekt(foretag, sokterm) {
    const projekt = await hamtaProjekt(foretag);
    if (!sokterm) return projekt;
    return projekt.filter(p => p.toLowerCase().includes(sokterm.toLowerCase()));
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
        let html = `<div style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">`;
        if (foretag.length === 0) {
            html += `<div style="text-align:center; padding:2rem; color:#999;">Inga företag har lagts till än.</div>`;
        }
        for (const f of foretag) {
            const projekt = await hamtaProjekt(f);
            html += `
                <div style="margin-bottom: 1rem; border: 1px solid #e2edf5; border-radius: 0.8rem; padding: 0.8rem;">
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
                    html += `
                        <li style="margin-bottom: 0.3rem; display: flex; justify-content: space-between;">
                            <span>📁 ${escapeHtml(p)}</span>
                            <div>
                                <button class="redigera-projekt" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background: #eef3fc; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem;"><i class="fas fa-edit"></i></button>
                                <button class="taBort-projekt" data-foretag="${escapeHtml(f)}" data-projekt="${escapeHtml(p)}" style="background: #fee2e2; border: none; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size:0.7rem; color:#b91c2c;"><i class="fas fa-trash"></i></button>
                            </div>
                        </li>`;
                }
            }
            html += `</ul><button class="laggTill-projekt" data-foretag="${escapeHtml(f)}" style="margin-top: 0.5rem; background: #e2e8f0; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size:0.7rem;"><i class="fas fa-plus"></i> Lägg till projekt</button>
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
                    if (ok) { await renderaLista(); if (efterStangningCallback) efterStangningCallback(); }
                    else alert("Kunde inte ändra. Namnet kanske redan finns.");
                }
            });
        });
        modal.querySelectorAll('.taBort-foretag').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const foretag = knapp.dataset.foretag;
                if (confirm(`Ta bort företaget "${foretag}" och alla dess projekt?`)) {
                    await taBortForetag(foretag);
                    await renderaLista();
                    if (efterStangningCallback) efterStangningCallback();
                }
            });
        });
        modal.querySelectorAll('.redigera-projekt').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const foretag = knapp.dataset.foretag;
                const gammalt = knapp.dataset.projekt;
                const nytt = prompt("Nytt projektnamn:", gammalt);
                if (nytt && nytt !== gammalt) {
                    const ok = await redigeraProjekt(foretag, gammalt, nytt);
                    if (ok) { await renderaLista(); if (efterStangningCallback) efterStangningCallback(); }
                    else alert("Kunde inte ändra. Projektet kanske redan finns.");
                }
            });
        });
        modal.querySelectorAll('.taBort-projekt').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const foretag = knapp.dataset.foretag;
                const projekt = knapp.dataset.projekt;
                if (confirm(`Ta bort projektet "${projekt}" från ${foretag}?`)) {
                    await taBortProjekt(foretag, projekt);
                    await renderaLista();
                    if (efterStangningCallback) efterStangningCallback();
                }
            });
        });
        modal.querySelectorAll('.laggTill-projekt').forEach(knapp => {
            knapp.addEventListener('click', async () => {
                const foretag = knapp.dataset.foretag;
                const nytt = prompt("Nytt projektnamn:");
                if (nytt) {
                    const ok = await laggTillProjekt(foretag, nytt);
                    if (ok) { await renderaLista(); if (efterStangningCallback) efterStangningCallback(); }
                    else alert("Kunde inte lägga till projekt. Det kanske redan finns.");
                }
            });
        });
        const nyttForetagBtn = modal.querySelector('#nyttForetagBtn');
        if (nyttForetagBtn) {
            nyttForetagBtn.addEventListener('click', async () => {
                const nytt = prompt("Nytt företagsnamn:");
                if (nytt) {
                    const ok = await laggTillForetag(nytt);
                    if (ok) { await renderaLista(); if (efterStangningCallback) efterStangningCallback(); }
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
    
    modal.innerHTML = '<div class="modal-innehall" style="background: white; border-radius: 1.5rem; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; padding: 1.5rem;"></div>';
    document.body.appendChild(modal);
    renderaLista();
}

// Hjälpfunktion för att undvika HTML-kod i utskrifter
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
