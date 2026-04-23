<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ladda upp underlag - Koppla filer till kod</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(145deg, #eef3fc 0%, #e0e9f2 100%);
            padding: 2rem;
            color: #1b2f44;
            min-height: 100vh;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .header h1 {
            font-size: 2rem;
            background: linear-gradient(120deg, #0b4b6e, #1f7ea3);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }

        .card {
            background: white;
            border-radius: 1.5rem;
            padding: 2rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #2c5a74;
        }

        input[type="text"], input[type="file"] {
            width: 100%;
            padding: 0.8rem 1rem;
            border: 2px solid #cbdde9;
            border-radius: 1rem;
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            transition: 0.2s;
        }

        input[type="text"]:focus, input[type="file"]:focus {
            outline: none;
            border-color: #2c7cb6;
        }

        .dropzone {
            border: 2.5px dashed #8bb4d0;
            border-radius: 1.5rem;
            background: #fafdff;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            margin-top: 0.5rem;
        }

        .dropzone.drag-over {
            border-color: #1f7ea3;
            background: #e6f4fe;
        }

        .dropzone i {
            font-size: 3rem;
            color: #5a8eb0;
            margin-bottom: 0.5rem;
        }

        .file-list {
            margin-top: 1rem;
            max-height: 300px;
            overflow-y: auto;
        }

        .file-item {
            background: #f0f6fc;
            padding: 0.7rem 1rem;
            border-radius: 0.8rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .file-name {
            flex: 1;
            font-size: 0.85rem;
            word-break: break-all;
        }

        .file-size {
            font-size: 0.75rem;
            color: #6c8dab;
        }

        .remove-file {
            background: #fee2e2;
            border: none;
            padding: 0.3rem 0.7rem;
            border-radius: 2rem;
            cursor: pointer;
            color: #b91c2c;
            font-size: 0.7rem;
        }

        .btn-primary, .btn-secondary {
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 2rem;
            font-weight: 600;
            cursor: pointer;
            font-size: 1rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-primary {
            background: #2c7cb6;
            color: white;
        }

        .btn-primary:hover {
            background: #1f5a82;
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #2c3e50;
        }

        .btn-secondary:hover {
            background: #cbd5e1;
        }

        .progress-bar {
            background: #d9e5f0;
            border-radius: 20px;
            height: 8px;
            margin: 1rem 0;
            overflow: hidden;
        }

        .progress-fill {
            background: linear-gradient(90deg, #2c7cb6, #4ca0d0);
            width: 0%;
            height: 100%;
            transition: width 0.3s;
        }

        .result-link {
            background: #eef3fc;
            padding: 1rem;
            border-radius: 1rem;
            margin-top: 1rem;
            display: none;
        }

        .result-link a {
            color: #2c7cb6;
            word-break: break-all;
        }

        .code-badge {
            background: #e67e22;
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 2rem;
            font-family: monospace;
            font-size: 0.9rem;
            display: inline-block;
        }

        .existing-files {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2edf5;
        }

        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1a2f3e;
            color: white;
            padding: 10px 24px;
            border-radius: 40px;
            font-size: 0.85rem;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 1000;
        }

        @media (max-width: 768px) {
            body { padding: 1rem; }
            .card { padding: 1.5rem; }
            .file-item { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1><i class="fas fa-cloud-upload-alt"></i> Ladda upp underlag</h1>
        <p>Koppla filer till en kod och få en länk att dela</p>
    </div>

    <div class="card">
        <div class="form-group">
            <label><i class="fas fa-tag"></i> Kod (ex: CBB.32, BBB.111, BBC.182)</label>
            <input type="text" id="codeInput" placeholder="Ange kod..." autocomplete="off">
            <small style="color:#6c8dab; display:block; margin-top:0.3rem;">Exempel: CBB.32, BBB.111, BBC.182, CDB.24</small>
        </div>

        <div class="form-group">
            <label><i class="fas fa-file-alt"></i> Beskrivning (valfritt)</label>
            <input type="text" id="descriptionInput" placeholder="Vad innehåller dessa filer?">
        </div>

        <div class="form-group">
            <label><i class="fas fa-paperclip"></i> Välj filer</label>
            <div class="dropzone" id="dropzone">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Dra & släpp filer hit</p>
                <small>Alla format stöds: PDF, DWG, ZIP, JPG, PNG, MP4, DOCX, XLSX m.m.</small>
                <div class="btn-secondary" style="display: inline-block; margin-top: 10px; padding: 0.5rem 1rem;">
                    <i class="fas fa-folder-open"></i> Välj filer
                </div>
            </div>
            <input type="file" id="fileInput" multiple style="display:none">
        </div>

        <div id="fileListContainer" class="file-list"></div>

        <div class="progress-bar" id="progressBar" style="display: none;">
            <div class="progress-fill" id="progressFill"></div>
        </div>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
            <button id="uploadBtn" class="btn-primary"><i class="fas fa-upload"></i> Ladda upp filer</button>
            <button id="clearBtn" class="btn-secondary"><i class="fas fa-trash-alt"></i> Rensa alla</button>
        </div>

        <div id="resultContainer" class="result-link"></div>
    </div>

    <div class="card" id="existingFilesCard" style="display: none;">
        <h3><i class="fas fa-history"></i> Befintliga filer för denna kod</h3>
        <div id="existingFilesList"></div>
    </div>
</div>

<div id="toast" class="toast">✅ Klart</div>

<script>
    // Cloudinary konfiguration
    const CLOUD_NAME = "dc1zqri3o";
    const UPLOAD_PRESET = "ncc_nordic";
    const FOLDER = "underlag";
    const API_KEY = "725351489155421";
    const API_SECRET = "22W8BZheLQtKAw7LEayY1S60Ky4";

    // DOM elements
    const codeInput = document.getElementById('codeInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileListContainer = document.getElementById('fileListContainer');
    const uploadBtn = document.getElementById('uploadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const resultContainer = document.getElementById('resultContainer');
    const existingFilesCard = document.getElementById('existingFilesCard');
    const existingFilesList = document.getElementById('existingFilesList');
    const toast = document.getElementById('toast');

    let selectedFiles = [];

    function showToast(msg, isError = false) {
        toast.textContent = msg;
        toast.style.backgroundColor = isError ? "#b91c2c" : "#1a2f3e";
        toast.style.opacity = "1";
        setTimeout(() => toast.style.opacity = "0", 2500);
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function renderFileList() {
        if (selectedFiles.length === 0) {
            fileListContainer.innerHTML = '<div style="text-align:center; color:#9bb3c9; padding:1rem;"><i class="fas fa-inbox"></i> Inga filer valda</div>';
            return;
        }

        fileListContainer.innerHTML = selectedFiles.map((file, index) => `
            <div class="file-item">
                <i class="fas ${getFileIcon(file.name)}"></i>
                <span class="file-name">${escapeHtml(file.name)}</span>
                <span class="file-size">${formatSize(file.size)}</span>
                <button class="remove-file" data-index="${index}"><i class="fas fa-times"></i> Ta bort</button>
            </div>
        `).join('');

        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                selectedFiles.splice(index, 1);
                renderFileList();
            });
        });
    }

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'pdf') return 'fa-file-pdf';
        if (['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext)) return 'fa-file-image';
        if (['mp4','webm','mov','avi'].includes(ext)) return 'fa-file-video';
        if (['zip','rar','7z'].includes(ext)) return 'fa-file-archive';
        if (['dwg','dxf'].includes(ext)) return 'fa-draw-polygon';
        if (['doc','docx'].includes(ext)) return 'fa-file-word';
        if (['xls','xlsx','csv'].includes(ext)) return 'fa-file-excel';
        return 'fa-file';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }

    async function uploadFile(file, code) {
        const formData = new FormData();
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9åäöÅÄÖ.\-]/g, '_');
        const publicId = `${FOLDER}/${code}/${timestamp}_${safeName}`;
        
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', `${FOLDER}/${code}`);
        formData.append('public_id', publicId);
        formData.append('resource_type', 'auto');

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Uppladdning misslyckades');
            
            const downloadUrl = data.secure_url + (data.secure_url.includes('?') ? '&fl_attachment' : '?fl_attachment');
            return {
                success: true,
                publicId: data.public_id,
                filename: file.name,
                size: file.size,
                date: new Date().toISOString(),
                previewUrl: data.secure_url,
                downloadUrl: downloadUrl,
                code: code
            };
        } catch (err) {
            console.error(err);
            return { success: false, name: file.name, error: err.message };
        }
    }

    function saveToLocalStorage(code, files, description) {
        const stored = localStorage.getItem('cloudinary_underlag');
        let allData = stored ? JSON.parse(stored) : {};
        
        if (!allData[code]) {
            allData[code] = {
                description: description || '',
                files: [],
                createdAt: new Date().toISOString()
            };
        }
        
        allData[code].files = [...allData[code].files, ...files];
        allData[code].description = description || allData[code].description;
        allData[code].updatedAt = new Date().toISOString();
        
        localStorage.setItem('cloudinary_underlag', JSON.stringify(allData));
        return allData;
    }

    function loadExistingFiles(code) {
        const stored = localStorage.getItem('cloudinary_underlag');
        if (!stored) return null;
        
        const allData = JSON.parse(stored);
        return allData[code] || null;
    }

    function displayExistingFiles(code) {
        const data = loadExistingFiles(code);
        
        if (!data || data.files.length === 0) {
            existingFilesCard.style.display = 'none';
            return;
        }
        
        existingFilesCard.style.display = 'block';
        
        if (data.description) {
            existingFilesList.innerHTML = `<p><strong>Beskrivning:</strong> ${escapeHtml(data.description)}</p>`;
        } else {
            existingFilesList.innerHTML = '';
        }
        
        existingFilesList.innerHTML += `
            <div style="margin-top: 1rem;">
                ${data.files.map(file => `
                    <div class="file-item">
                        <i class="fas ${getFileIcon(file.filename)}"></i>
                        <span class="file-name">${escapeHtml(file.filename)}</span>
                        <span class="file-size">${formatSize(file.size)}</span>
                        <div class="file-actions" style="display: flex; gap: 0.3rem;">
                            <button class="btn-secondary" style="padding: 0.2rem 0.6rem; font-size:0.7rem;" onclick="window.open('${file.previewUrl}', '_blank')"><i class="fas fa-eye"></i> Visa</button>
                            <button class="btn-secondary" style="padding: 0.2rem 0.6rem; font-size:0.7rem;" onclick="window.open('${file.downloadUrl}', '_blank')"><i class="fas fa-download"></i> Ladda ner</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async function uploadFiles() {
        const code = codeInput.value.trim();
        
        if (!code) {
            showToast('Ange en kod (ex: CBB.32)', true);
            return;
        }
        
        if (selectedFiles.length === 0) {
            showToast('Välj minst en fil att ladda upp', true);
            return;
        }
        
        uploadBtn.disabled = true;
        progressBar.style.display = 'block';
        progressFill.style.width = '0%';
        
        let completed = 0;
        const total = selectedFiles.length;
        const uploadedFiles = [];
        
        for (let i = 0; i < selectedFiles.length; i++) {
            showToast(`Laddar upp ${i+1} av ${total}: ${selectedFiles[i].name}`);
            const result = await uploadFile(selectedFiles[i], code);
            
            if (result.success) {
                uploadedFiles.push(result);
                showToast(`✅ ${result.filename} uppladdad`);
            } else {
                showToast(`❌ Misslyckades: ${result.name}`, true);
            }
            
            completed++;
            progressFill.style.width = `${(completed/total)*100}%`;
        }
        
        // Spara till localStorage
        const description = descriptionInput.value.trim();
        saveToLocalStorage(code, uploadedFiles, description);
        
        // Skapa länk
        const viewerUrl = `viewer.html?code=${encodeURIComponent(code)}`;
        const fullUrl = `${window.location.origin}${window.location.pathname.replace('upload.html', 'viewer.html')}?code=${encodeURIComponent(code)}`;
        
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `
            <h4><i class="fas fa-link"></i> Länk för att visa underlag</h4>
            <p>${uploadedFiles.length} fil(er) uppladdade för kod <strong class="code-badge">${escapeHtml(code)}</strong></p>
            <input type="text" id="linkInput" value="${fullUrl}" readonly style="width:100%; padding:0.5rem; border-radius:0.5rem; border:1px solid #cbdde9; margin:0.5rem 0;">
            <button id="copyLinkBtn" class="btn-secondary"><i class="fas fa-copy"></i> Kopiera länk</button>
            <a href="${viewerUrl}" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-block; margin-left:0.5rem;"><i class="fas fa-external-link-alt"></i> Öppna visare</a>
        `;
        
        document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
            const linkInput = document.getElementById('linkInput');
            linkInput.select();
            document.execCommand('copy');
            showToast('📋 Länk kopierad till urklipp!');
        });
        
        // Visa befintliga filer
        displayExistingFiles(code);
        
        // Rensa filvalet
        selectedFiles = [];
        renderFileList();
        
        uploadBtn.disabled = false;
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
        }, 1000);
    }

    function clearAll() {
        selectedFiles = [];
        renderFileList();
        fileInput.value = '';
        showToast('Rensat');
    }

    // Event listeners
    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
    });
    
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        selectedFiles.push(...files);
        renderFileList();
    });
    
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        selectedFiles.push(...files);
        renderFileList();
        fileInput.value = '';
    });
    
    uploadBtn.addEventListener('click', uploadFiles);
    clearBtn.addEventListener('click', clearAll);
    
    codeInput.addEventListener('input', (e) => {
        const code = e.target.value.trim();
        if (code) {
            displayExistingFiles(code);
        } else {
            existingFilesCard.style.display = 'none';
        }
    });
    
    // Initiera
    renderFileList();
</script>
</body>
</html>
