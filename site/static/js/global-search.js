/**
 * Global Search Functionality
 * Provides instant search across pages, sensors, and content
 * Triggered by clicking search input or keyboard shortcuts (/ or Ctrl+K)
 */

(function() {
    'use strict';

    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;

    let searchTimeout = null;
    let resultsContainer = null;
    let currentResults = [];
    let selectedIndex = -1;

    // Create results dropdown
    function createResultsContainer() {
        if (resultsContainer) return resultsContainer;

        resultsContainer = document.createElement('div');
        resultsContainer.id = 'search-results-dropdown';
        resultsContainer.style.cssText = `
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            background: var(--background-color, #1a1a2e);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            display: none;
        `;

        searchInput.parentElement.appendChild(resultsContainer);
        searchInput.parentElement.style.position = 'relative';
        return resultsContainer;
    }

    // Render search results
    function renderResults(results) {
        currentResults = results;
        selectedIndex = -1;

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div style="padding:16px; text-align:center; color:#aaa;">
                    Aucun résultat trouvé
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }

        const categories = {
            page: '📄 Pages',
            sensor: '🎛️ Capteurs',
            help: '❓ Aide'
        };

        const grouped = {};
        results.forEach(result => {
            const cat = result.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(result);
        });

        let html = '';
        for (const [category, items] of Object.entries(grouped)) {
            html += `
                <div style="padding:8px 16px; font-size:0.75rem; font-weight:600; 
                            text-transform:uppercase; color:#888; 
                            border-bottom:1px solid rgba(255,255,255,0.1);">
                    ${categories[category] || category}
                </div>
            `;

            items.forEach((result, idx) => {
                const globalIdx = results.indexOf(result);
                html += `
                    <a href="${result.url}" 
                       class="search-result-item" 
                       data-index="${globalIdx}"
                       style="display:flex; align-items:center; gap:12px; 
                              padding:12px 16px; text-decoration:none; 
                              color:var(--text-color, #fff); 
                              border-bottom:1px solid rgba(255,255,255,0.05);
                              transition:background 0.2s;">
                        <span style="font-size:1.5rem;">${result.icon || '📄'}</span>
                        <div style="flex:1;">
                            <div style="font-weight:600;">${result.title}</div>
                            ${result.description ? `<div style="font-size:0.85rem; color:#aaa; margin-top:2px;">${result.description}</div>` : ''}
                        </div>
                    </a>
                `;
            });
        }

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';

        // Add click handlers
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                clearSelection();
                item.style.background = 'rgba(52, 152, 219, 0.2)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
        });
    }

    // Clear selection highlight
    function clearSelection() {
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.style.background = '';
        });
    }

    // Highlight selected item
    function highlightSelection() {
        clearSelection();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
            const item = resultsContainer.querySelector(`[data-index="${selectedIndex}"]`);
            if (item) {
                item.style.background = 'rgba(52, 152, 219, 0.3)';
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }

    // Perform search
    function performSearch(query) {
        if (!query || query.trim().length < 2) {
            if (resultsContainer) resultsContainer.style.display = 'none';
            return;
        }

        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                createResultsContainer();
                renderResults(data.results || []);
            })
            .catch(error => {
                console.error('Search error:', error);
            });
    }

    // Input event handler with debouncing
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (!resultsContainer || resultsContainer.style.display === 'none') {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                performSearch(searchInput.value);
            }
            return;
        }

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
                highlightSelection();
                break;

            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                highlightSelection();
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
                    window.location.href = currentResults[selectedIndex].url;
                } else if (currentResults.length > 0) {
                    window.location.href = currentResults[0].url;
                }
                break;

            case 'Escape':
                resultsContainer.style.display = 'none';
                searchInput.blur();
                break;
        }
    });

    // Focus event
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            performSearch(searchInput.value);
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (resultsContainer && 
            !searchInput.contains(e.target) && 
            !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });

    // Integration with keyboard shortcuts (if available)
    if (window.KeyboardShortcuts) {
        window.KeyboardShortcuts.onSearchActivated = () => {
            searchInput.focus();
            searchInput.select();
        };
    }

    console.log('Global search initialized');
})();
