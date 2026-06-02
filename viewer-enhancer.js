// ============================================================================
// viewer-enhancer.js - Förbättrad visning av mappstruktur i viewer.html
// Lägg till i viewer.html efter folder-manager.js:
// <script src="viewer-enhancer.js"></script>
// ============================================================================

(function() {
    // Vänta tills DOM är redo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initViewerEnhancer);
    } else {
        initViewerEnhancer();
    }

    let aktuellVy = 'icon'; // icon, detail, list
    let sökTerm = '';
    let allFilesAndFolders = [];
    let currentHierarchy = { foretag: '', projekt: '', leverantor: '', del: '', kod: '' };

    function initViewerEnhancer() {
        // Vänta på att folder-manager.js har skapat mappträdet
        const observer = new MutationObserver(function(mutations, obs) {
            const treeContainer = document.getElementById('viewerFolderTree');
            if (treeContainer && treeContainer.innerHTML.length > 50) {
                obs.disconnect();
                console.log('🎯 viewer-enhancer: Mappträd hittat, initierar förbättringar');
                enhanceViewer();
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Timeout ifall trädet aldrig dyker upp
        setTimeout(() => {
            const treeContainer = document.getElementById('viewerFolderTree');
            if (treeContainer && !document.getElementById('viewerEnhancerToolbar')) {
                enhanceViewer();
            }
        }, 3000);
    }

    function enhanceViewer() {
        // Hämta hierarki från URL eller från sidan
        const urlParams = new URLSearchParams(window.location.search);
        currentHierarchy = {
            foretag: urlParams.get('company') || '',
            projekt: urlParams.get('project') || '',
            leverantor: urlParams.get('supplier') || '',
            del: urlParams.get('part') || '',
            kod: urlParams.get('code') || ''
        };
        
        // Om ingen hierarki finns i URL, försök hämta från sidans hierarkiDisplay
        if (!currentHierarchy.foretag) {
            const hierarchyDisplay = document.getElementById('hierarchyDisplay');
            if (hierarchyDisplay) {
                const text = hierarchyDisplay.innerText;
                const foretagMatch = text.match(/Företag:\s*([^\|]+)/);
                const projektMatch = text.match(/Projekt:\s*([^\|]+)/);
                const leverantorMatch = text.match(/Leverantör:\s*([^\|]+)/);
                const delMatch = text.match(/Del:\s*([^\|]+)/);
                const kodMatch = text.match(/Kod:\s*([^\|]+)/);
                if (foretagMatch) currentHierarchy.foretag = foretagMatch[1].trim();
                if (projektMatch) currentHierarchy.projekt = projektMatch[1].trim();
                if (leverantorMatch) currentHierarchy.leverantor = leverantorMatch[1].trim();
                if (delMatch) currentHierarchy.del = delMatch[1].trim();
                if (kodMatch) currentHierarchy.kod = kodMatch[1].trim();
            }
        }

        // Skapa verktygsfältet om det inte redan finns
        if (!document.getElementById('viewerEnhancerToolbar')) {
            createToolbar();
        }
        
        // Extrahera alla filer och mappar från mappträdet
        extractFilesAndFolders();
        
        // Applicera aktuell vy och sökning
        applyViewAndSearch();
        
        // Lägg till observer för att uppdatera när trädet ändras (t.ex. vid expandering)
        const treeContainer = document.getElementById('viewerFolderTree');
        if (treeContainer) {
            const expandObserver = new MutationObserver(function() {
                extractFilesAndFolders();
                applyViewAndSearch();
            });
            expandObserver.observe(treeContainer, { childList: true, subtree: true, attributes: true });
        }
    }

    function createToolbar() {
        const treeContainer = document.getElementById('viewerFolderTree');
        if (!treeContainer) return;
        
        // Skapa verktygsfält
        const toolbar = document.createElement('div');
        toolbar.id = 'viewerEnhancerToolbar';
        toolbar.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: #ffffff;
            border-radius: 1rem;
            border: 1px solid #e2edf5;
        `;
        
        // Sökfält
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = 'flex: 2; min-width: 200px;';
        searchContainer.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <div style="position: relative; flex: 1;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9bb3c9;"></i>
                    <input type="text" id="viewerSearchInput" placeholder="Sök efter filer eller mappar..." 
                           style="width: 100%; padding: 0.6rem 0.6rem 0.6rem 2.2rem; border: 2px solid #cbdde9; border-radius: 2rem; font-size: 0.85rem;">
                </div>
                <button id="clearSearchBtn" class="btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.8rem;">
                    <i class="fas fa-times"></i> Rensa
                </button>
            </div>
        `;
        
        // Vyväljare
        const viewContainer = document.createElement('div');
        viewContainer.style.cssText = 'display: flex; gap: 0.5rem; background: #f0f6fc; padding: 0.3rem; border-radius: 2rem;';
        viewContainer.innerHTML = `
            <button class="view-btn" data-view="icon" title="Ikonvy" style="padding: 0.4rem 1rem; border-radius: 2rem; border: none; cursor: pointer; background: #2c7cb6; color: white;">
                <i class="fas fa-th-large"></i> Ikoner
            </button>
            <button class="view-btn" data-view="detail" title="Detaljvy" style="padding: 0.4rem 1rem; border-radius: 2rem; border: none; cursor: pointer; background: #e2e8f0; color: #2c3e50;">
                <i class="fas fa-list"></i> Detaljer
            </button>
            <button class="view-btn" data-view="list" title="Listvy" style="padding: 0.4rem 1rem; border-radius: 2rem; border: none; cursor: pointer; background: #e2e8f0; color: #2c3e50;">
                <i class="fas fa-bars"></i> Lista
            </button>
        `;
        
        // Statistik
        const statsContainer = document.createElement('div');
        statsContainer.id = 'viewerStats';
        statsContainer.style.cssText = 'font-size: 0.75rem; color: #6c8dab; background: #f0f6fc; padding: 0.3rem 0.8rem; border-radius: 2rem;';
        statsContainer.innerHTML = '<i class="fas fa-info-circle"></i> <span id="fileCount">0</span> filer';
        
        toolbar.appendChild(searchContainer);
        toolbar.appendChild(viewContainer);
        toolbar.appendChild(statsContainer);
        
        // Infoga före mappträdet
        treeContainer.parentNode.insertBefore(toolbar, treeContainer);
        
        // Event listeners
        const searchInput = document.getElementById('viewerSearchInput');
        searchInput.addEventListener('input', (e) => {
            sökTerm = e.target.value.toLowerCase();
            applyViewAndSearch();
        });
        
        document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
            searchInput.value = '';
            sökTerm = '';
            applyViewAndSearch();
        });
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                aktuellVy = btn.dataset.view;
                updateViewButtons();
                applyViewAndSearch();
            });
        });
        
        // Lägg till CSS för vyerna
        addViewStyles();
    }
    
    function updateViewButtons() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            if (btn.dataset.view === aktuellVy) {
                btn.style.background = '#2c7cb6';
                btn.style.color = 'white';
            } else {
                btn.style.background = '#e2e8f0';
                btn.style.color = '#2c3e50';
            }
        });
    }
    
    function addViewStyles() {
        if (document.getElementById('viewerEnhancerStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'viewerEnhancerStyles';
        style.textContent = `
            /* Ikonvy - gallerivy */
            .view-icon .files-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 1rem;
            }
            
            .view-icon .file-card {
                text-align: center;
                padding: 1rem;
                transition: transform 0.2s;
            }
            
            .view-icon .file-card:hover {
                transform: translateY(-3px);
            }
            
            .view-icon .file-icon {
                font-size: 3rem;
                margin-bottom: 0.5rem;
            }
            
            .view-icon .file-meta {
                justify-content: center;
            }
            
            /* Detaljvy - tabelliknande */
            .view-detail .files-grid {
                display: block;
            }
            
            .view-detail .file-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                padding: 0.8rem;
                margin-bottom: 0.3rem;
                border-radius: 0.6rem;
            }
            
            .view-detail .file-icon {
                font-size: 1.4rem;
                margin-bottom: 0;
                min-width: 40px;
                text-align: center;
            }
            
            .view-detail .file-name {
                flex: 3;
                min-width: 150px;
                margin-bottom: 0;
            }
            
            .view-detail .file-meta {
                flex: 1;
                margin-bottom: 0;
                justify-content: flex-end;
            }
            
            .view-detail .file-actions {
                flex: 0;
            }
            
            /* Listvy - enkel rad */
            .view-list .files-grid {
                display: block;
            }
            
            .view-list .file-card {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                padding: 0.5rem 0.8rem;
                margin-bottom: 0.2rem;
                background: transparent;
                border: none;
                border-bottom: 1px solid #e2edf5;
                box-shadow: none;
            }
            
            .view-list .file-card:hover {
                background: #f0f6fc;
                transform: none;
            }
            
            .view-list .file-icon {
                font-size: 1.2rem;
                margin-bottom: 0;
                min-width: 30px;
            }
            
            .view-list .file-name {
                flex: 1;
                margin-bottom: 0;
                font-size: 0.85rem;
            }
            
            .view-list .file-meta {
                margin-bottom: 0;
                font-size: 0.7rem;
            }
            
            .view-list .file-actions {
                margin-left: auto;
            }
            
            /* Sökmarkering */
            .search-highlight {
                background-color: #fef3c7;
                border-radius: 0.2rem;
                padding: 0 0.2rem;
            }
            
            /* Mappheader i olika vyer */
            .folder-header {
                transition: background 0.2s;
            }
            
            .folder-header:hover {
                background: #e6f4fe !important;
            }
            
            /* Folder content animation */
            .folder-content {
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    function extractFilesAndFolders() {
        const treeContainer = document.getElementById('viewerFolderTree');
        if (!treeContainer) return;
        
        allFilesAndFolders = [];
        
        // Extrahera från rot (ingen mapp)
        const rootDiv = treeContainer.querySelector('div > div:first-child');
        if (rootDiv) {
            const rootTitle = rootDiv.querySelector('div[style*="font-weight: 600"]');
            if (rootTitle && rootTitle.innerText.includes('Rot')) {
                const fileItems = rootDiv.querySelectorAll('.file-item-in-tree, .file-card, div[style*="display: flex; justify-content: space-between"]');
                fileItems.forEach(item => {
                    if (item.querySelector('.fa-eye, .btn-view')) {
                        const nameEl = item.querySelector('span:first-child, .file-name');
                        const name = nameEl ? nameEl.innerText.trim() : '';
                        const icon = item.querySelector('i');
                        const iconClass = icon ? icon.className : '';
                        allFilesAndFolders.push({
                            type: 'file',
                            name: name,
                            element: item,
                            parent: 'root',
                            icon: iconClass
                        });
                    }
                });
            }
        }
        
        // Extrahera från mappar
        const folderItems = treeContainer.querySelectorAll('.folder-item');
        folderItems.forEach(folder => {
            const header = folder.querySelector('.folder-header');
            const folderNameSpan = header ? header.querySelector('strong') : null;
            const folderName = folderNameSpan ? folderNameSpan.innerText.replace('📁', '').trim() : '';
            
            allFilesAndFolders.push({
                type: 'folder',
                name: folderName,
                element: folder,
                parent: null,
                icon: 'fa-folder'
            });
            
            const contentDiv = folder.querySelector('div[id^="viewerFolder_"]');
            if (contentDiv) {
                const fileItems = contentDiv.querySelectorAll('.file-item-in-tree, div[style*="display: flex; justify-content: space-between"]');
                fileItems.forEach(item => {
                    if (item.querySelector('.fa-eye, .btn-view')) {
                        const nameEl = item.querySelector('span:first-child, .file-name');
                        const name = nameEl ? nameEl.innerText.trim() : '';
                        const icon = item.querySelector('i');
                        const iconClass = icon ? icon.className : '';
                        allFilesAndFolders.push({
                            type: 'file',
                            name: name,
                            element: item,
                            parent: folderName,
                            icon: iconClass
                        });
                    }
                });
            }
        });
    }
    
    function applyViewAndSearch() {
        const treeContainer = document.getElementById('viewerFolderTree');
        if (!treeContainer) return;
        
        // Byt vy-klass på container
        treeContainer.classList.remove('view-icon', 'view-detail', 'view-list');
        treeContainer.classList.add(`view-${aktuellVy}`);
        
        // Rensa sökmarkeringar och filter
        let synligaFiler = 0;
        let synligaMappar = 0;
        
        // För varje mapp och fil
        const folderItems = treeContainer.querySelectorAll('.folder-item');
        folderItems.forEach(folder => {
            const header = folder.querySelector('.folder-header');
            const folderNameSpan = header ? header.querySelector('strong') : null;
            const folderName = folderNameSpan ? folderNameSpan.innerText.replace('📁', '').trim() : '';
            
            // Kolla om mappen matchar sökning (om någon fil i mappen matchar)
            let folderHasMatch = false;
            let filesInFolder = [];
            
            const contentDiv = folder.querySelector('div[id^="viewerFolder_"]');
            if (contentDiv) {
                const fileItems = contentDiv.querySelectorAll('.file-item-in-tree, div[style*="display: flex; justify-content: space-between"]');
                fileItems.forEach(item => {
                    if (item.querySelector('.fa-eye, .btn-view')) {
                        const nameEl = item.querySelector('span:first-child, .file-name');
                        const fileName = nameEl ? nameEl.innerText.trim() : '';
                        const matches = !sökTerm || fileName.toLowerCase().includes(sökTerm);
                        filesInFolder.push({ item, matches, fileName });
                        if (matches) folderHasMatch = true;
                    }
                });
            }
            
            // Visa/dölj mapp baserat på om den har matchande filer eller mappnamn matchar
            const folderMatches = !sökTerm || folderName.toLowerCase().includes(sökTerm);
            const showFolder = !sökTerm || folderMatches || folderHasMatch;
            
            if (showFolder) {
                folder.style.display = '';
                synligaMappar++;
                
                // Markera mappnamn om det matchar
                if (folderNameSpan && sökTerm && folderName.toLowerCase().includes(sökTerm)) {
                    folderNameSpan.innerHTML = highlightText(folderName, sökTerm);
                } else if (folderNameSpan) {
                    folderNameSpan.innerHTML = folderName;
                }
                
                // Hantera filer i mappen
                filesInFolder.forEach(({ item, matches, fileName }) => {
                    if (!sökTerm || matches) {
                        item.style.display = '';
                        synligaFiler++;
                        // Markera filnamn
                        const nameEl = item.querySelector('span:first-child, .file-name');
                        if (nameEl && sökTerm && fileName.toLowerCase().includes(sökTerm)) {
                            nameEl.innerHTML = highlightText(fileName, sökTerm);
                        } else if (nameEl) {
                            nameEl.innerHTML = fileName;
                        }
                    } else {
                        item.style.display = 'none';
                    }
                });
            } else {
                folder.style.display = 'none';
            }
        });
        
        // Hantera rotfiler
        const rootDiv = treeContainer.querySelector('div > div:first-child');
        if (rootDiv) {
            const rootTitle = rootDiv.querySelector('div[style*="font-weight: 600"]');
            const fileContainer = rootDiv.querySelector('div[style*="margin-left: 1rem;"], div:last-child');
            if (fileContainer) {
                const fileItems = fileContainer.querySelectorAll('.file-item-in-tree, div[style*="display: flex; justify-content: space-between"]');
                let anyRootFileVisible = false;
                fileItems.forEach(item => {
                    if (item.querySelector('.fa-eye, .btn-view')) {
                        const nameEl = item.querySelector('span:first-child, .file-name');
                        const fileName = nameEl ? nameEl.innerText.trim() : '';
                        const matches = !sökTerm || fileName.toLowerCase().includes(sökTerm);
                        if (matches) {
                            item.style.display = '';
                            synligaFiler++;
                            anyRootFileVisible = true;
                            if (nameEl && sökTerm) {
                                nameEl.innerHTML = highlightText(fileName, sökTerm);
                            } else if (nameEl) {
                                nameEl.innerHTML = fileName;
                            }
                        } else {
                            item.style.display = 'none';
                        }
                    }
                });
                
                // Visa/dölj rotsektionen
                if (rootDiv) {
                    if (!sökTerm || anyRootFileVisible) {
                        rootDiv.style.display = '';
                    } else {
                        rootDiv.style.display = 'none';
                    }
                }
            }
        }
        
        // Uppdatera statistik
        const fileCountSpan = document.getElementById('fileCount');
        if (fileCountSpan) {
            fileCountSpan.textContent = synligaFiler;
        }
        
        // Visa meddelande om inga resultat
        let noResultsMsg = treeContainer.querySelector('.no-search-results');
        if (synligaFiler === 0 && synligaMappar === 0 && sökTerm) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-search-results';
                noResultsMsg.style.cssText = 'text-align: center; padding: 2rem; color: #999;';
                noResultsMsg.innerHTML = `<i class="fas fa-search fa-2x" style="margin-bottom: 0.5rem; display: block;"></i>Inga filer eller mappar matchar "${escapeHtml(sökTerm)}"`;
                treeContainer.appendChild(noResultsMsg);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }
    
    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }
    
})();