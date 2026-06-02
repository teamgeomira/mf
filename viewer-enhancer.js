// ============================================================================
// viewer-enhancer.js - Full fungerande vyhantering för mappstruktur
// För användning med viewer.html och folder-manager.js
// ============================================================================

(function() {
    'use strict';
    
    console.log('🚀 viewer-enhancer: Laddas...');
    
    let aktuellVy = localStorage.getItem('viewerPreferredView') || 'icon';
    let sökTerm = '';
    let försök = 0;
    const MAX_FÖRSÖK = 20;
    
    // Huvudfunktion - väntar på att folder-manager.js skapat trädet
    function init() {
        const checkInterval = setInterval(() => {
            const treeContainer = document.getElementById('viewerFolderTree');
            const contentDiv = document.getElementById('content');
            
            // Kontrollera om mappträdet finns OCH har blivit ifyllt
            if (treeContainer && (treeContainer.children.length > 0 || contentDiv?.children.length > 0)) {
                console.log('✅ viewer-enhancer: Mappträd hittat, initierar...');
                clearInterval(checkInterval);
                setupCompleteEnhancer();
            }
            
            försök++;
            if (försök >= MAX_FÖRSÖK) {
                console.log('⚠️ viewer-enhancer: Max försök, initierar ändå...');
                clearInterval(checkInterval);
                setupCompleteEnhancer();
            }
        }, 500);
    }
    
    function setupCompleteEnhancer() {
        // Skapa verktygsfältet
        createEnhancedToolbar();
        
        // Applicera vy på ALLA filer (inklusive i mappar)
        applyViewToAllFiles(aktuellVy);
        
        // Lägg till CSS
        addCompleteStyles();
        
        // Uppdatera statistik
        updateStatistics();
        
        // Observera förändringar i DOM (när användaren expanderar mappar)
        observeDOMChanges();
        
        console.log('✅ viewer-enhancer: Klar! Aktuell vy:', aktuellVy);
    }
    
    function createEnhancedToolbar() {
        // Hitta var verktygsfältet ska placeras
        const treeContainer = document.getElementById('viewerFolderTree');
        if (!treeContainer) return;
        
        // Ta bort gammalt verktygsfält om det finns
        const oldToolbar = document.getElementById('enhancedViewerToolbar');
        if (oldToolbar) oldToolbar.remove();
        
        // Skapa nytt verktygsfält
        const toolbar = document.createElement('div');
        toolbar.id = 'enhancedViewerToolbar';
        toolbar.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 1rem 1.25rem;
            background: white;
            border-radius: 1rem;
            border: 1px solid #e2edf5;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        `;
        
        // Söksektion
        toolbar.innerHTML = `
            <div style="flex: 2; min-width: 200px;">
                <div style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                    <input type="text" id="enhancedSearchInput" placeholder="Sök efter filer..." 
                           style="width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem; border: 2px solid #e2edf5; border-radius: 2rem; font-size: 0.85rem; outline: none; transition: border 0.2s;">
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.25rem; border-radius: 2rem;">
                <button class="enhanced-view-btn" data-view="icon" title="Ikonvy" style="padding: 0.5rem 1.2rem; border-radius: 1.5rem; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
                    <i class="fas fa-th-large"></i> <span>Ikoner</span>
                </button>
                <button class="enhanced-view-btn" data-view="detail" title="Detaljvy" style="padding: 0.5rem 1.2rem; border-radius: 1.5rem; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
                    <i class="fas fa-list"></i> <span>Detaljer</span>
                </button>
                <button class="enhanced-view-btn" data-view="list" title="Listvy" style="padding: 0.5rem 1.2rem; border-radius: 1.5rem; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
                    <i class="fas fa-bars"></i> <span>Lista</span>
                </button>
            </div>
            <div id="enhancedStats" style="display: flex; gap: 1rem; align-items: center; font-size: 0.8rem;">
                <span style="background: #eef2ff; padding: 0.3rem 0.8rem; border-radius: 2rem; color: #2c7cb6;">
                    <i class="fas fa-folder"></i> <span id="folderCount">0</span> mappar
                </span>
                <span style="background: #eef2ff; padding: 0.3rem 0.8rem; border-radius: 2rem; color: #10b981;">
                    <i class="fas fa-file"></i> <span id="fileCount">0</span> filer
                </span>
            </div>
        `;
        
        // Infoga före mappträdet
        treeContainer.parentNode.insertBefore(toolbar, treeContainer);
        
        // Sökfunktion
        const searchInput = document.getElementById('enhancedSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                sökTerm = e.target.value.toLowerCase();
                performSearch();
            });
            
            // Fokus-effekt
            searchInput.addEventListener('focus', function() {
                this.style.borderColor = '#2c7cb6';
            });
            searchInput.addEventListener('blur', function() {
                this.style.borderColor = '#e2edf5';
            });
        }
        
        // Vy-knappar
        document.querySelectorAll('.enhanced-view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const vy = this.dataset.view;
                aktuellVy = vy;
                localStorage.setItem('viewerPreferredView', vy);
                applyViewToAllFiles(vy);
                
                // Uppdatera knapparnas utseende
                document.querySelectorAll('.enhanced-view-btn').forEach(b => {
                    if (b.dataset.view === vy) {
                        b.style.background = '#2c7cb6';
                        b.style.color = 'white';
                    } else {
                        b.style.background = 'transparent';
                        b.style.color = '#475569';
                    }
                });
            });
            
            // Sätt initialt utseende
            if (btn.dataset.view === aktuellVy) {
                btn.style.background = '#2c7cb6';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = '#475569';
            }
        });
    }
    
    function applyViewToAllFiles(vy) {
        // Hitta alla filkort - både i roten och inuti mappar
        const allFileCards = document.querySelectorAll('.file-card, [class*="file-card"]');
        
        console.log(`🎨 Applicerar vy "${vy}" på ${allFileCards.length} filer`);
        
        allFileCards.forEach(card => {
            // Ta bort alla vy-klasser
            card.classList.remove('vy-icon-mode', 'vy-detail-mode', 'vy-list-mode');
            card.classList.add(`vy-${vy}-mode`);
            
            // Applicera stil baserat på vy
            switch(vy) {
                case 'icon':
                    applyIconStyle(card);
                    break;
                case 'detail':
                    applyDetailStyle(card);
                    break;
                case 'list':
                    applyListStyle(card);
                    break;
            }
        });
        
        // Uppdatera grid-container för ikonvy
        const filesGrid = document.querySelector('.files-grid');
        if (filesGrid) {
            if (vy === 'icon') {
                filesGrid.style.display = 'grid';
                filesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
                filesGrid.style.gap = '1.5rem';
            } else {
                filesGrid.style.display = 'block';
            }
        }
        
        // Uppdatera mappheaders utseende
        updateFolderHeaders(vy);
    }
    
    function applyIconStyle(card) {
        card.style.textAlign = 'center';
        card.style.padding = '1rem';
        card.style.display = 'block';
        
        const icon = card.querySelector('.file-icon, [class*="file-icon"]');
        if (icon) {
            icon.style.fontSize = '3rem';
            icon.style.marginBottom = '0.5rem';
            icon.style.textAlign = 'center';
        }
        
        const name = card.querySelector('.file-name, [class*="file-name"]');
        if (name) {
            name.style.fontSize = '0.85rem';
            name.style.fontWeight = '500';
            name.style.marginBottom = '0.25rem';
            name.style.wordBreak = 'break-word';
        }
        
        const meta = card.querySelector('.file-meta, [class*="file-meta"]');
        if (meta) {
            meta.style.justifyContent = 'center';
            meta.style.fontSize = '0.7rem';
            meta.style.marginBottom = '0.5rem';
        }
        
        const actions = card.querySelector('.file-actions, [class*="file-actions"]');
        if (actions) {
            actions.style.justifyContent = 'center';
        }
    }
    
    function applyDetailStyle(card) {
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.flexWrap = 'wrap';
        card.style.gap = '0.5rem';
        card.style.padding = '0.75rem 1rem';
        card.style.textAlign = 'left';
        
        const icon = card.querySelector('.file-icon, [class*="file-icon"]');
        if (icon) {
            icon.style.fontSize = '1.5rem';
            icon.style.marginBottom = '0';
            icon.style.minWidth = '40px';
        }
        
        const name = card.querySelector('.file-name, [class*="file-name"]');
        if (name) {
            name.style.flex = '2';
            name.style.marginBottom = '0';
            name.style.fontSize = '0.85rem';
        }
        
        const meta = card.querySelector('.file-meta, [class*="file-meta"]');
        if (meta) {
            meta.style.display = 'flex';
            meta.style.gap = '1rem';
            meta.style.flex = '1';
            meta.style.marginBottom = '0';
            meta.style.justifyContent = 'flex-end';
        }
        
        const actions = card.querySelector('.file-actions, [class*="file-actions"]');
        if (actions) {
            actions.style.marginLeft = 'auto';
        }
    }
    
    function applyListStyle(card) {
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '0.75rem';
        card.style.padding = '0.4rem 0.8rem';
        card.style.marginBottom = '0.1rem';
        card.style.background = 'transparent';
        card.style.border = 'none';
        card.style.borderBottom = '1px solid #eef3fc';
        card.style.boxShadow = 'none';
        
        const icon = card.querySelector('.file-icon, [class*="file-icon"]');
        if (icon) {
            icon.style.fontSize = '1.1rem';
            icon.style.marginBottom = '0';
            icon.style.minWidth = '28px';
        }
        
        const name = card.querySelector('.file-name, [class*="file-name"]');
        if (name) {
            name.style.flex = '1';
            name.style.marginBottom = '0';
            name.style.fontSize = '0.85rem';
        }
        
        const meta = card.querySelector('.file-meta, [class*="file-meta"]');
        if (meta) {
            meta.style.fontSize = '0.7rem';
            meta.style.marginBottom = '0';
            meta.style.gap = '0.5rem';
        }
        
        const actions = card.querySelector('.file-actions, [class*="file-actions"]');
        if (actions) {
            actions.style.marginLeft = 'auto';
        }
    }
    
    function updateFolderHeaders(vy) {
        const folderHeaders = document.querySelectorAll('.folder-header');
        folderHeaders.forEach(header => {
            if (vy === 'icon') {
                header.style.padding = '0.75rem 1rem';
                header.style.fontSize = '1rem';
            } else if (vy === 'detail') {
                header.style.padding = '0.6rem 1rem';
                header.style.fontSize = '0.95rem';
            } else {
                header.style.padding = '0.4rem 0.8rem';
                header.style.fontSize = '0.9rem';
            }
        });
    }
    
    function performSearch() {
        if (!sökTerm) {
            // Visa alla filer
            document.querySelectorAll('.file-card, [class*="file-card"]').forEach(file => {
                file.style.display = '';
                // Återställ markering
                const nameEl = file.querySelector('.file-name, [class*="file-name"]');
                if (nameEl) nameEl.innerHTML = nameEl.innerText;
            });
            document.querySelectorAll('.folder-item').forEach(folder => {
                folder.style.display = '';
            });
            updateStatistics();
            return;
        }
        
        let synligaFiler = 0;
        
        // Filtrera filer
        document.querySelectorAll('.file-card, [class*="file-card"]').forEach(file => {
            const nameEl = file.querySelector('.file-name, [class*="file-name"]');
            const fileName = nameEl ? nameEl.innerText.toLowerCase() : '';
            
            if (fileName.includes(sökTerm)) {
                file.style.display = '';
                synligaFiler++;
                
                // Markera sökterm
                if (nameEl) {
                    const originalText = nameEl.innerText;
                    const regex = new RegExp(`(${escapeRegExp(sökTerm)})`, 'gi');
                    nameEl.innerHTML = originalText.replace(regex, '<span style="background-color: #fef3c7; padding: 0 2px; border-radius: 3px;">$1</span>');
                }
            } else {
                file.style.display = 'none';
                if (nameEl) nameEl.innerHTML = nameEl.innerText;
            }
        });
        
        // Hantera mappar - visa bara de som har synliga filer eller matchande namn
        document.querySelectorAll('.folder-item').forEach(folder => {
            const folderNameEl = folder.querySelector('.folder-header strong, .folder-header span:first-child');
            const folderName = folderNameEl ? folderNameEl.innerText.toLowerCase() : '';
            const hasVisibleFiles = folder.querySelectorAll('.file-card[style="display: block"], .file-card[style="display: flex"], .file-card:not([style*="display: none"])').length > 0;
            
            if (folderName.includes(sökTerm) || hasVisibleFiles) {
                folder.style.display = '';
            } else {
                folder.style.display = 'none';
            }
        });
        
        // Uppdatera statistik
        const fileCountSpan = document.getElementById('fileCount');
        if (fileCountSpan) fileCountSpan.textContent = synligaFiler;
    }
    
    function updateStatistics() {
        const totalFiles = document.querySelectorAll('.file-card, [class*="file-card"]').length;
        const totalFolders = document.querySelectorAll('.folder-item').length;
        
        const fileSpan = document.getElementById('fileCount');
        const folderSpan = document.getElementById('folderCount');
        
        if (fileSpan) fileSpan.textContent = totalFiles;
        if (folderSpan) folderSpan.textContent = totalFolders;
    }
    
    function observeDOMChanges() {
        // Observera när nya filkort läggs till (när användaren expanderar mappar)
        const observer = new MutationObserver(function(mutations) {
            let needsUpdate = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node.classList?.contains('file-card') || node.querySelector?.('.file-card'))) {
                            needsUpdate = true;
                        }
                    });
                }
            });
            
            if (needsUpdate) {
                // Applicera aktuell vy på nya filer
                setTimeout(() => {
                    applyViewToAllFiles(aktuellVy);
                    if (sökTerm) performSearch();
                    updateStatistics();
                }, 100);
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function addCompleteStyles() {
        if (document.getElementById('completeViewerStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'completeViewerStyles';
        style.textContent = `
            /* Ikonvy */
            .vy-icon-mode {
                transition: all 0.2s ease;
            }
            
            .vy-icon-mode:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
            }
            
            /* Detaljvy */
            .vy-detail-mode {
                transition: background 0.2s;
            }
            
            .vy-detail-mode:hover {
                background: #f8fafc;
            }
            
            /* Listvy */
            .vy-list-mode {
                transition: background 0.2s;
            }
            
            .vy-list-mode:hover {
                background: #f1f5f9;
            }
            
            /* Förbättrad mappheader */
            .folder-header {
                cursor: pointer;
                transition: background 0.2s;
                border-radius: 0.8rem;
            }
            
            .folder-header:hover {
                background: #f1f5f9 !important;
            }
            
            /* Animation för folder content */
            .folder-content {
                transition: all 0.2s ease;
            }
            
            /* Responsiv design */
            @media (max-width: 768px) {
                .files-grid {
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Starta allt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
