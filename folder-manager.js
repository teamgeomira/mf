let databasReferens = null;
let uppdateringsCallback = null;

function sakerstallDatabas() {
    if (databasReferens) return databasReferens;
    try {
        if (typeof firebase !== 'undefined' && firebase.database) {
            databasReferens = firebase.database();
            console.log("⚠️ databasReferens var null – initierade från firebase direkt");
        }
    } catch (e) {
        console.error("Kunde inte initiera databas:", e);
    }
    return databasReferens;
}

function rensaNyckel(str) {
    if (!str) return '';
    return str.replace(/\./g, '-').replace(/[#$\[\]\/]/g, '_').replace(/\s+/g, '_');
}

function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#39;';
        return m;
    });
}

function initieraHierarki(databas, callback) {
    databasReferens = databas;
    uppdateringsCallback = callback;
    console.log("✅ Hierarkimodul initierad (Företag/Projekt/Leverantör/Del/Kod)");
}

function visaTextInmatning(meddelande, standardVarde) {
    return new Promise(function(resolve) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-dialog', 'true');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; justify-content: center;
            align-items: center; z-index: 99999; backdrop-filter: blur(2px);
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: white; border-radius: 1.2rem; padding: 1.5rem;
            min-width: 320px; max-width: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        `;

        const msg = document.createElement('div');
        msg.style.cssText = 'font-size: 1rem; font-weight: 600; color: #1b2f44; margin-bottom: 0.8rem;';
        msg.textContent = meddelande;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = standardVarde || '';
        input.style.cssText = `
            width: 100%; padding: 0.7rem 1rem; border: 2px solid #cbdde9;
            border-radius: 0.8rem; font-size: 1rem; font-family: inherit;
            outline: none; margin-bottom: 1rem; box-sizing: border-box;
        `;

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 0.5rem; justify-content: flex-end;';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Avbryt';
        cancelBtn.style.cssText = `
            padding: 0.6rem 1.2rem; border-radius: 2rem; border: none;
            background: #e2e8f0; color: #2c3e50; font-weight: 600;
            cursor: pointer; font-size: 0.9rem; font-family: inherit;
        `;

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `
            padding: 0.6rem 1.2rem; border-radius: 2rem; border: none;
            background: #2c7cb6; color: white; font-weight: 600;
            cursor: pointer; font-size: 0.9rem; font-family: inherit;
        `;

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(okBtn);
        box.appendChild(msg);
        box.appendChild(input);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        let klar = false;
        function stang(varde) {
            if (klar) return;
            klar = true;
            try { document.body.removeChild(overlay); } catch(e) {}
            document.removeEventListener('keydown', keyHandler);
            resolve(varde);
        }

        function keyHandler(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                stang(input.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                stang(null);
            }
        }

        okBtn.addEventListener('click', function() { stang(input.value); });
        cancelBtn.addEventListener('click', function() { stang(null); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) stang(null);
        });
        document.addEventListener('keydown', keyHandler);

        setTimeout(function() {
            input.focus();
            input.select();
        }, 50);
    });
}

function visaBekraftelse(meddelande) {
    return new Promise(function(resolve) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-dialog', 'true');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; justify-content: center;
            align-items: center; z-index: 99999; backdrop-filter: blur(2px);
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: white; border-radius: 1.2rem; padding: 1.5rem;
            min-width: 320px; max-width: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        `;

        const msg = document.createElement('div');
        msg.style.cssText = 'font-size: 1rem; color: #1b2f44; margin-bottom: 1.2rem; line-height: 1.5;';
        msg.textContent = meddelande;

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 0.5rem; justify-content: flex-end;';

        const noBtn = document.createElement('button');
        noBtn.type = 'button';
        noBtn.textContent = 'Avbryt';
        noBtn.style.cssText = `
            padding: 0.6rem 1.2rem; border-radius: 2rem; border: none;
            background: #e2e8f0; color: #2c3e50; font-weight: 600;
            cursor: pointer; font-size: 0.9rem; font-family: inherit;
        `;

        const yesBtn = document.createElement('button');
        yesBtn.type = 'button';
        yesBtn.textContent = 'Ja, ta bort';
        yesBtn.style.cssText = `
            padding: 0.6rem 1.2rem; border-radius: 2rem; border: none;
            background: #b91c2c; color: white; font-weight: 600;
            cursor: pointer; font-size: 0.9rem; font-family: inherit;
        `;

        btnRow.appendChild(noBtn);
        btnRow.appendChild(yesBtn);
        box.appendChild(msg);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        let klar = false;
        function stang(varde) {
            if (klar) return;
            klar = true;
            try { document.body.removeChild(overlay); } catch(e) {}
            document.removeEventListener('keydown', keyHandler);
            resolve(varde);
        }

        function keyHandler(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                stang(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                stang(false);
            }
        }

        yesBtn.addEventListener('click', function() { stang(true); });
        noBtn.addEventListener('click', function() { stang(false); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) stang(false);
        });
        document.addEventListener('keydown', keyHandler);

        setTimeout(function() { yesBtn.focus(); }, 50);
    });
}

function visaInfo(meddelande) {
    return new Promise(function(resolve) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-dialog', 'true');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; justify-content: center;
            align-items: center; z-index: 99999; backdrop-filter: blur(2px);
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: white; border-radius: 1.2rem; padding: 1.5rem;
            min-width: 320px; max-width: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        `;

        const msg = document.createElement('div');
        msg.style.cssText = 'font-size: 1rem; color: #1b2f44; margin-bottom: 1.2rem; line-height: 1.5;';
        msg.textContent = meddelande;

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; justify-content: flex-end;';

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `
            padding: 0.6rem 1.2rem; border-radius: 2rem; border: none;
            background: #2c7cb6; color: white; font-weight: 600;
            cursor: pointer; font-size: 0.9rem; font-family: inherit;
        `;

        btnRow.appendChild(okBtn);
        box.appendChild(msg);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        let klar = false;
        function stang() {
            if (klar) return;
            klar = true;
            try { document.body.removeChild(overlay); } catch(e) {}
            document.removeEventListener('keydown', keyHandler);
            resolve();
        }

        function keyHandler(e) {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                stang();
            }
        }

        okBtn.addEventListener('click', stang);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) stang();
        });
        document.addEventListener('keydown', keyHandler);

        setTimeout(function() { okBtn.focus(); }, 50);
    });
}

async function hamtaForetag() {
    const db = sakerstallDatabas();
    if (!db) return [];
    try {
        const snap = await db.ref('foretag').once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(function(f) { return f.namn; }).sort();
    } catch(e) {
        console.error("Fel vid hämtning av företag:", e);
        return [];
    }
}

async function laggTillForetag(foretag) {
    if (!foretag || !foretag.trim()) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    const namn = foretag.trim();
    const nyckel = rensaNyckel(namn);
    try {
        const finns = await db.ref('foretag/' + nyckel).once('value');
        if (finns.exists()) return false;
        await db.ref('foretag/' + nyckel).set({ namn: namn, projekt: {} });
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid tillägg av företag:", e);
        return false;
    }
}

async function redigeraForetag(gammalt, nytt) {
    if (!gammalt || !nytt || !nytt.trim()) return false;
    if (gammalt === nytt.trim()) return true;
    const db = sakerstallDatabas();
    if (!db) return false;
    const gammalNyckel = rensaNyckel(gammalt);
    const nyNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await db.ref('foretag/' + gammalNyckel).once('value')).val();
        if (!data) return false;
        await db.ref('foretag/' + nyNyckel).set({ namn: nytt.trim(), projekt: data.projekt || {} });
        await db.ref('foretag/' + gammalNyckel).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid redigering av företag:", e);
        return false;
    }
}

async function taBortForetag(foretag) {
    if (!foretag) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    try {
        await db.ref('foretag/' + rensaNyckel(foretag)).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid borttagning av företag:", e);
        return false;
    }
}

async function filtreraForetag(sok) {
    const alla = await hamtaForetag();
    if (!sok) return alla;
    return alla.filter(function(f) { return f.toLowerCase().indexOf(sok.toLowerCase()) !== -1; });
}

async function hamtaProjekt(foretag) {
    if (!foretag) return [];
    const db = sakerstallDatabas();
    if (!db) return [];
    try {
        const snap = await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt').once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(function(p) { return p.namn; }).sort();
    } catch(e) {
        console.error("Fel vid hämtning av projekt:", e);
        return [];
    }
}

async function laggTillProjekt(foretag, projekt) {
    if (!foretag || !projekt || !projekt.trim()) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNamn = projekt.trim();
    const pNyckel = rensaNyckel(pNamn);
    try {
        const finns = await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel).once('value');
        if (finns.exists()) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel).set({ namn: pNamn, leverantörer: {} });
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid tillägg av projekt:", e);
        return false;
    }
}

async function redigeraProjekt(foretag, gammalt, nytt) {
    if (!foretag || !gammalt || !nytt || !nytt.trim()) return false;
    if (gammalt === nytt.trim()) return true;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const gNyckel = rensaNyckel(gammalt);
    const nNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await db.ref('foretag/' + fNyckel + '/projekt/' + gNyckel).once('value')).val();
        if (!data) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + nNyckel).set({ namn: nytt.trim(), leverantörer: data.leverantörer || {} });
        await db.ref('foretag/' + fNyckel + '/projekt/' + gNyckel).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid redigering av projekt:", e);
        return false;
    }
}

async function taBortProjekt(foretag, projekt) {
    if (!foretag || !projekt) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    try {
        await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt/' + rensaNyckel(projekt)).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid borttagning av projekt:", e);
        return false;
    }
}

async function hamtaLeverantorer(foretag, projekt) {
    if (!foretag || !projekt) return [];
    const db = sakerstallDatabas();
    if (!db) return [];
    try {
        const snap = await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt/' + rensaNyckel(projekt) + '/leverantörer').once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(function(l) { return l.namn; }).sort();
    } catch(e) {
        console.error("Fel vid hämtning av leverantörer:", e);
        return [];
    }
}

async function laggTillLeverantor(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor || !leverantor.trim()) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNamn = leverantor.trim();
    const lNyckel = rensaNyckel(lNamn);
    try {
        const finns = await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel).once('value');
        if (finns.exists()) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel).set({ namn: lNamn, delar: {} });
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid tillägg av leverantör:", e);
        return false;
    }
}

async function redigeraLeverantor(foretag, projekt, gammal, nytt) {
    if (!foretag || !projekt || !gammal || !nytt || !nytt.trim()) return false;
    if (gammal === nytt.trim()) return true;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + gNyckel).once('value')).val();
        if (!data) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + nNyckel).set({ namn: nytt.trim(), delar: data.delar || {} });
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + gNyckel).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid redigering av leverantör:", e);
        return false;
    }
}

async function taBortLeverantor(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    try {
        await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt/' + rensaNyckel(projekt) + '/leverantörer/' + rensaNyckel(leverantor)).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid borttagning av leverantör:", e);
        return false;
    }
}

async function hamtaDelar(foretag, projekt, leverantor) {
    if (!foretag || !projekt || !leverantor) return [];
    const db = sakerstallDatabas();
    if (!db) return [];
    try {
        const snap = await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt/' + rensaNyckel(projekt) + '/leverantörer/' + rensaNyckel(leverantor) + '/delar').once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(function(d) { return d.namn; }).sort();
    } catch(e) {
        console.error("Fel vid hämtning av delar:", e);
        return [];
    }
}

async function laggTillDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del || !del.trim()) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNamn = del.trim();
    const dNyckel = rensaNyckel(dNamn);
    try {
        const finns = await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + dNyckel).once('value');
        if (finns.exists()) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + dNyckel).set({ namn: dNamn, koder: {} });
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid tillägg av del:", e);
        return false;
    }
}

async function redigeraDel(foretag, projekt, leverantor, gammal, nytt) {
    if (!foretag || !projekt || !leverantor || !gammal || !nytt || !nytt.trim()) return false;
    if (gammal === nytt.trim()) return true;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim());
    try {
        const data = (await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + gNyckel).once('value')).val();
        if (!data) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + nNyckel).set({ namn: nytt.trim(), koder: data.koder || {} });
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + gNyckel).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid redigering av del:", e);
        return false;
    }
}

async function taBortDel(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    try {
        await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt/' + rensaNyckel(projekt) + '/leverantörer/' + rensaNyckel(leverantor) + '/delar/' + rensaNyckel(del)).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid borttagning av del:", e);
        return false;
    }
}

async function hamtaKoder(foretag, projekt, leverantor, del) {
    if (!foretag || !projekt || !leverantor || !del) return [];
    const db = sakerstallDatabas();
    if (!db) return [];
    try {
        const snap = await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt/' + rensaNyckel(projekt) + '/leverantörer/' + rensaNyckel(leverantor) + '/delar/' + rensaNyckel(del) + '/koder').once('value');
        const data = snap.val();
        if (!data) return [];
        return Object.values(data).map(function(k) { return k.namn; }).sort();
    } catch(e) {
        console.error("Fel vid hämtning av koder:", e);
        return [];
    }
}

async function laggTillKod(foretag, projekt, leverantor, del, kod) {
    if (!foretag || !projekt || !leverantor || !del || !kod || !kod.trim()) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNyckel = rensaNyckel(del);
    const kNamn = kod.trim().toUpperCase();
    const kNyckel = rensaNyckel(kNamn);
    try {
        const finns = await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + dNyckel + '/koder/' + kNyckel).once('value');
        if (finns.exists()) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + dNyckel + '/koder/' + kNyckel).set({ namn: kNamn });
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid tillägg av kod:", e);
        return false;
    }
}

async function redigeraKod(foretag, projekt, leverantor, del, gammal, nytt) {
    if (!foretag || !projekt || !leverantor || !del || !gammal || !nytt || !nytt.trim()) return false;
    if (gammal === nytt.trim().toUpperCase()) return true;
    const db = sakerstallDatabas();
    if (!db) return false;
    const fNyckel = rensaNyckel(foretag);
    const pNyckel = rensaNyckel(projekt);
    const lNyckel = rensaNyckel(leverantor);
    const dNyckel = rensaNyckel(del);
    const gNyckel = rensaNyckel(gammal);
    const nNyckel = rensaNyckel(nytt.trim().toUpperCase());
    try {
        const data = (await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + dNyckel + '/koder/' + gNyckel).once('value')).val();
        if (!data) return false;
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + dNyckel + '/koder/' + nNyckel).set({ namn: nytt.trim().toUpperCase() });
        await db.ref('foretag/' + fNyckel + '/projekt/' + pNyckel + '/leverantörer/' + lNyckel + '/delar/' + dNyckel + '/koder/' + gNyckel).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid redigering av kod:", e);
        return false;
    }
}

async function taBortKod(foretag, projekt, leverantor, del, kod) {
    if (!foretag || !projekt || !leverantor || !del || !kod) return false;
    const db = sakerstallDatabas();
    if (!db) return false;
    try {
        await db.ref('foretag/' + rensaNyckel(foretag) + '/projekt/' + rensaNyckel(projekt) + '/leverantörer/' + rensaNyckel(leverantor) + '/delar/' + rensaNyckel(del) + '/koder/' + rensaNyckel(kod)).remove();
        if (uppdateringsCallback) {
            try { await uppdateringsCallback(); } catch(err) { console.error(err); }
        }
        return true;
    } catch(e) {
        console.error("Fel vid borttagning av kod:", e);
        return false;
    }
}

function visaModalHantering(efterStangningCallback) {
    const modal = document.createElement('div');
    modal.id = 'hierarchyModalOverlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 10000; backdrop-filter: blur(4px);';

    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; border-radius: 1.5rem; width: 95%; max-width: 1400px; height: 90%; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden;';

    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'padding: 1rem 1.5rem; border-bottom: 2px solid #e2edf5; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;';
    headerDiv.innerHTML = '<h2 style="margin:0; font-size:1.5rem;"><i class="fas fa-database"></i> Hantera hierarki</h2>';

    const stangBtn = document.createElement('button');
    stangBtn.id = 'stangFullModalBtn';
    stangBtn.type = 'button';
    stangBtn.className = 'btn-secondary';
    stangBtn.style.cssText = 'padding:0.5rem 1.2rem; cursor:pointer; border:none; background:#e2e8f0; color:#2c3e50; border-radius:2rem; font-weight:600;';
    stangBtn.innerHTML = '<i class="fas fa-times"></i> Stäng';
    headerDiv.appendChild(stangBtn);

    const treeContainer = document.createElement('div');
    treeContainer.id = 'hierarchyTreeContainer';
    treeContainer.style.cssText = 'flex: 1; overflow-y: auto; padding: 1.5rem; background: #ffffff;';

    modalContent.appendChild(headerDiv);
    modalContent.appendChild(treeContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    let stangModal = function() {
        try { document.body.removeChild(modal); } catch(e) {}
        if (efterStangningCallback) {
            try { efterStangningCallback(); } catch(err) { console.error(err); }
        }
    };

    stangBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        stangModal();
    });

    async function laddaOchRenderaTrad() {
        treeContainer.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-pulse"></i> Laddar hierarki...</div>';

        let foretagLista = [];
        try {
            foretagLista = await hamtaForetag();
        } catch (err) {
            console.error("Fel vid hamtaForetag:", err);
            foretagLista = [];
        }

        let html = '<div class="hierarchy-tree" style="font-size:0.95rem;">';

        if (foretagLista.length === 0) {
            html += '<div style="text-align:center; padding:2rem; color:#9bb3c9;"><i class="fas fa-info-circle" style="font-size:2rem; display:block; margin-bottom:0.5rem;"></i>Inga företag har lagts till än. Klicka på "Nytt företag" nedan för att skapa ett.</div>';
        }

        for (const f of foretagLista) {
            const projektLista = await hamtaProjekt(f);
            html += '<div class="tree-node company-node" data-foretag="' + escapeHtml(f) + '" style="margin-bottom:1rem; border-left:3px solid #2c7cb6; padding-left:0.5rem;">';
            html += '<div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.3rem 0;">';
            html += '<i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>';
            html += '<i class="fas fa-building" style="color:#2c7cb6; width:20px;"></i>';
            html += '<strong style="flex:1;">' + escapeHtml(f) + '</strong>';
            html += '<span style="display:flex; gap:0.3rem;">';
            html += '<button type="button" class="btn-edit btn-sm" data-type="company" data-name="' + escapeHtml(f) + '" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-edit"></i></button>';
            html += '<button type="button" class="btn-delete btn-sm" data-type="company" data-name="' + escapeHtml(f) + '" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-trash"></i></button>';
            html += '<button type="button" class="btn-add btn-sm" data-type="project" data-foretag="' + escapeHtml(f) + '" title="Lägg till projekt" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-plus"></i> Projekt</button>';
            html += '</span>';
            html += '</div>';
            html += '<div class="tree-children" style="display: none; margin-left: 2rem;">';

            for (const p of projektLista) {
                const leverantorLista = await hamtaLeverantorer(f, p);
                html += '<div class="tree-node project-node" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" style="margin-bottom:0.8rem; border-left:2px solid #e67e22; padding-left:0.5rem;">';
                html += '<div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.2rem 0;">';
                html += '<i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>';
                html += '<i class="fas fa-project-diagram" style="color:#e67e22; width:20px;"></i>';
                html += '<strong style="flex:1;">' + escapeHtml(p) + '</strong>';
                html += '<span style="display:flex; gap:0.3rem;">';
                html += '<button type="button" class="btn-edit btn-sm" data-type="project" data-foretag="' + escapeHtml(f) + '" data-name="' + escapeHtml(p) + '" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-edit"></i></button>';
                html += '<button type="button" class="btn-delete btn-sm" data-type="project" data-foretag="' + escapeHtml(f) + '" data-name="' + escapeHtml(p) + '" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-trash"></i></button>';
                html += '<button type="button" class="btn-add btn-sm" data-type="leverantor" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" title="Lägg till leverantör" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-plus"></i> Leverantör</button>';
                html += '</span>';
                html += '</div>';
                html += '<div class="tree-children" style="display: none; margin-left: 1.5rem;">';

                for (const l of leverantorLista) {
                    const delLista = await hamtaDelar(f, p, l);
                    html += '<div class="tree-node leverantor-node" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" style="margin-bottom:0.8rem; border-left:2px solid #16a085; padding-left:0.5rem;">';
                    html += '<div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.2rem 0;">';
                    html += '<i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>';
                    html += '<i class="fas fa-truck" style="color:#16a085; width:20px;"></i>';
                    html += '<strong style="flex:1;">' + escapeHtml(l) + '</strong>';
                    html += '<span style="display:flex; gap:0.3rem;">';
                    html += '<button type="button" class="btn-edit btn-sm" data-type="leverantor" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-name="' + escapeHtml(l) + '" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-edit"></i></button>';
                    html += '<button type="button" class="btn-delete btn-sm" data-type="leverantor" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-name="' + escapeHtml(l) + '" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-trash"></i></button>';
                    html += '<button type="button" class="btn-add btn-sm" data-type="del" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" title="Lägg till del" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-plus"></i> Del</button>';
                    html += '</span>';
                    html += '</div>';
                    html += '<div class="tree-children" style="display: none; margin-left: 1.5rem;">';

                    for (const d of delLista) {
                        const kodLista = await hamtaKoder(f, p, l, d);
                        html += '<div class="tree-node del-node" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" data-del="' + escapeHtml(d) + '" style="margin-bottom:0.8rem; border-left:2px solid #8e44ad; padding-left:0.5rem;">';
                        html += '<div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; cursor:pointer; padding:0.2rem 0;">';
                        html += '<i class="fas fa-chevron-right toggle-icon" style="width:16px;"></i>';
                        html += '<i class="fas fa-puzzle-piece" style="color:#8e44ad; width:20px;"></i>';
                        html += '<strong style="flex:1;">' + escapeHtml(d) + '</strong>';
                        html += '<span style="display:flex; gap:0.3rem;">';
                        html += '<button type="button" class="btn-edit btn-sm" data-type="del" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" data-name="' + escapeHtml(d) + '" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-edit"></i></button>';
                        html += '<button type="button" class="btn-delete btn-sm" data-type="del" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" data-name="' + escapeHtml(d) + '" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-trash"></i></button>';
                        html += '<button type="button" class="btn-add btn-sm" data-type="kod" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" data-del="' + escapeHtml(d) + '" title="Lägg till kod" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-plus"></i> Kod</button>';
                        html += '</span>';
                        html += '</div>';
                        html += '<div class="tree-children" style="display: none; margin-left: 1.5rem;">';

                        for (const k of kodLista) {
                            html += '<div class="tree-node kod-node" style="margin-bottom:0.3rem;">';
                            html += '<div class="tree-header" style="display:flex; align-items:center; gap:0.5rem; padding:0.1rem 0;">';
                            html += '<i class="fas fa-tag" style="color:#e67e22; width:20px; margin-left:20px;"></i>';
                            html += '<span style="flex:1;">' + escapeHtml(k) + '</span>';
                            html += '<span style="display:flex; gap:0.3rem;">';
                            html += '<button type="button" class="btn-edit btn-sm" data-type="kod" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" data-del="' + escapeHtml(d) + '" data-name="' + escapeHtml(k) + '" title="Redigera" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-edit"></i></button>';
                            html += '<button type="button" class="btn-delete btn-sm" data-type="kod" data-foretag="' + escapeHtml(f) + '" data-projekt="' + escapeHtml(p) + '" data-leverantor="' + escapeHtml(l) + '" data-del="' + escapeHtml(d) + '" data-name="' + escapeHtml(k) + '" title="Ta bort" style="padding:0.2rem 0.5rem; font-size:0.7rem; cursor:pointer;"><i class="fas fa-trash"></i></button>';
                            html += '</span>';
                            html += '</div>';
                            html += '</div>';
                        }
                        html += '</div></div>';
                    }
                    html += '</div></div>';
                }
                html += '</div></div>';
            }
            html += '</div></div>';
        }
        html += '</div>';
        html += '<div style="margin-top: 1rem; padding: 1rem; background: #f0f6fc; border-radius: 1rem; text-align: center;">';
        html += '<button id="nyttForetagFullBtn" type="button" class="btn-success" style="padding:0.7rem 1.5rem; cursor:pointer; font-size:1rem; border:none; background:#10b981; color:white; border-radius:2rem; font-weight:600;"><i class="fas fa-plus-circle"></i> Nytt företag</button>';
        html += '</div>';

        treeContainer.innerHTML = html;
    }

    treeContainer.addEventListener('click', async function(e) {
        const target = e.target;

        const nyttBtn = target.closest ? target.closest('#nyttForetagFullBtn') : null;
        if (nyttBtn) {
            e.preventDefault();
            e.stopPropagation();
            const newName = await visaTextInmatning('Ange nytt företagsnamn:', '');
            if (newName === null) return;
            if (!newName.trim()) return;
            const ok = await laggTillForetag(newName);
            if (ok) {
                await laddaOchRenderaTrad();
            } else {
                await visaInfo('Kunde inte lägga till företag. Det finns redan eller ogiltigt namn.');
            }
            return;
        }

        const editBtn = target.closest ? target.closest('.btn-edit') : null;
        if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            const type = editBtn.dataset.type;
            const foretag = editBtn.dataset.foretag;
            const projekt = editBtn.dataset.projekt;
            const leverantor = editBtn.dataset.leverantor;
            const del = editBtn.dataset.del;
            const currentName = editBtn.dataset.name;
            const newName = await visaTextInmatning('Ange nytt namn för ' + type + ':', currentName);
            if (newName === null || newName === currentName) return;
            if (!newName.trim()) return;
            let success = false;
            if (type === 'company') success = await redigeraForetag(currentName, newName);
            else if (type === 'project') success = await redigeraProjekt(foretag, currentName, newName);
            else if (type === 'leverantor') success = await redigeraLeverantor(foretag, projekt, currentName, newName);
            else if (type === 'del') success = await redigeraDel(foretag, projekt, leverantor, currentName, newName);
            else if (type === 'kod') success = await redigeraKod(foretag, projekt, leverantor, del, currentName, newName);
            if (success) {
                await laddaOchRenderaTrad();
            } else {
                await visaInfo('Kunde inte ändra. Namnet finns redan eller ogiltigt.');
            }
            return;
        }

        const deleteBtn = target.closest ? target.closest('.btn-delete') : null;
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const type = deleteBtn.dataset.type;
            const foretag = deleteBtn.dataset.foretag;
            const projekt = deleteBtn.dataset.projekt;
            const leverantor = deleteBtn.dataset.leverantor;
            const del = deleteBtn.dataset.del;
            const name = deleteBtn.dataset.name;
            const okDelete = await visaBekraftelse('Ta bort ' + type + ' "' + name + '" och allt under det?');
            if (!okDelete) return;
            let success = false;
            if (type === 'company') success = await taBortForetag(name);
            else if (type === 'project') success = await taBortProjekt(foretag, name);
            else if (type === 'leverantor') success = await taBortLeverantor(foretag, projekt, name);
            else if (type === 'del') success = await taBortDel(foretag, projekt, leverantor, name);
            else if (type === 'kod') success = await taBortKod(foretag, projekt, leverantor, del, name);
            if (success) {
                await laddaOchRenderaTrad();
            }
            return;
        }

        const addBtn = target.closest ? target.closest('.btn-add') : null;
        if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            const type = addBtn.dataset.type;
            const foretag = addBtn.dataset.foretag;
            const projekt = addBtn.dataset.projekt;
            const leverantor = addBtn.dataset.leverantor;
            const del = addBtn.dataset.del;
            const newName = await visaTextInmatning('Ange nytt ' + type + '-namn:', '');
            if (newName === null) return;
            if (!newName.trim()) return;
            let success = false;
            if (type === 'project') success = await laggTillProjekt(foretag, newName);
            else if (type === 'leverantor') success = await laggTillLeverantor(foretag, projekt, newName);
            else if (type === 'del') success = await laggTillDel(foretag, projekt, leverantor, newName);
            else if (type === 'kod') success = await laggTillKod(foretag, projekt, leverantor, del, newName);
            if (success) {
                await laddaOchRenderaTrad();
            } else {
                await visaInfo('Kunde inte lägga till. Finns redan eller ogiltigt.');
            }
            return;
        }

        const header = target.closest ? target.closest('.tree-header') : null;
        if (header) {
            const children = header.parentElement ? header.parentElement.querySelector('.tree-children') : null;
            if (children) {
                const isHidden = children.style.display === 'none';
                children.style.display = isHidden ? 'block' : 'none';
                const toggleIcon = header.querySelector('.toggle-icon');
                if (toggleIcon) {
                    if (isHidden) {
                        toggleIcon.classList.remove('fa-chevron-right');
                        toggleIcon.classList.add('fa-chevron-down');
                    } else {
                        toggleIcon.classList.remove('fa-chevron-down');
                        toggleIcon.classList.add('fa-chevron-right');
                    }
                }
            }
        }
    }, true);

    laddaOchRenderaTrad();
}