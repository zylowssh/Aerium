/**
 * Drag and Drop CSV Import
 * Handles drag-and-drop file uploads for CSV data import
 * Provides visual feedback and progress tracking
 */

(function() {
    'use strict';

    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-file-input');
    const browseBtn = document.getElementById('browse-csv-btn');
    const importBtn = document.getElementById('source-import-btn');
    const progressContainer = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status');

    if (!dropzone || !fileInput || !browseBtn || !importBtn) {
        console.warn('CSV drag-drop elements not found on this page');
        return;
    }

    // Show/hide dropzone when import source is selected
    importBtn.addEventListener('click', () => {
        dropzone.style.display = 'block';
    });

    // Hide dropzone when other sources are selected
    document.querySelectorAll('[data-source]').forEach(btn => {
        if (btn.dataset.source !== 'import') {
            btn.addEventListener('click', () => {
                dropzone.style.display = 'none';
            });
        }
    });

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropzone.style.borderColor = '#3498db';
        dropzone.style.background = 'rgba(52, 152, 219, 0.1)';
        dropzone.style.transform = 'scale(1.02)';
    }

    function unhighlight() {
        dropzone.style.borderColor = 'rgba(255,255,255,0.3)';
        dropzone.style.background = 'rgba(255,255,255,0.02)';
        dropzone.style.transform = 'scale(1)';
    }

    // Handle dropped files
    dropzone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            handleFiles(files);
        }
    }

    // Browse button click
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    // Dropzone click to browse
    dropzone.addEventListener('click', (e) => {
        if (e.target === dropzone || e.target.closest('#csv-dropzone')) {
            if (e.target !== browseBtn) {
                fileInput.click();
            }
        }
    });

    function handleFiles(files) {
        const file = files[0];

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            showError('Veuillez sélectionner un fichier CSV valide');
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showError('Le fichier est trop volumineux (max 50MB)');
            return;
        }

        uploadFile(file);
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Show progress
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        statusText.textContent = 'Téléchargement en cours...';
        statusText.style.color = '#3498db';

        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
                statusText.textContent = `Téléchargement: ${Math.round(percentComplete)}%`;
            }
        });

        // Upload complete
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    showSuccess(response);
                } catch (e) {
                    showError('Erreur lors du traitement de la réponse');
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    showError(error.error || 'Erreur lors du téléchargement');
                } catch (e) {
                    showError('Erreur lors du téléchargement');
                }
            }
        });

        // Upload error
        xhr.addEventListener('error', () => {
            showError('Erreur réseau lors du téléchargement');
        });

        // Send request
        xhr.open('POST', '/api/import/csv');
        xhr.send(formData);
    }

    function showSuccess(response) {
        progressBar.style.width = '100%';
        progressBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
        statusText.style.color = '#2ecc71';
        
        const imported = response.imported || 0;
        const skipped = response.skipped || 0;
        statusText.textContent = `✓ Importation réussie: ${imported} lignes importées${skipped > 0 ? `, ${skipped} ignorées` : ''}`;

        // Reset after 5 seconds
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.style.background = 'linear-gradient(90deg, #3498db, #2ecc71)';
            
            // Reload data if visualization is active
            if (typeof window.refreshCharts === 'function') {
                window.refreshCharts();
            }
        }, 5000);
    }

    function showError(message) {
        progressBar.style.width = '100%';
        progressBar.style.background = '#e74c3c';
        statusText.style.color = '#e74c3c';
        statusText.textContent = `✗ ${message}`;

        // Reset after 5 seconds
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.style.background = 'linear-gradient(90deg, #3498db, #2ecc71)';
        }, 5000);
    }

    console.log('CSV drag-and-drop initialized');
})();
