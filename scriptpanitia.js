document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchStatus = document.getElementById('searchStatus');
    const toggleAllBtn = document.getElementById('toggleAllBtn');
    const collapsibleCards = document.querySelectorAll('.collapsible-card');
    const searchableItems = document.querySelectorAll('.searchable-item');

    let allCollapsed = false;

    // 1. Fitur Buka/Tutup (Accordion) per Kartu pada Tampilan Mobile
    document.querySelectorAll('.toggle-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.collapsible-card');
            if (card) {
                card.classList.toggle('collapsed');
            }
        });
    });

    // 2. Tombol Tutup / Buka Semua Seksi
    toggleAllBtn.addEventListener('click', () => {
        allCollapsed = !allCollapsed;
        collapsibleCards.forEach(card => {
            if (allCollapsed) {
                card.classList.add('collapsed');
            } else {
                card.classList.remove('collapsed');
            }
        });
        toggleAllBtn.textContent = allCollapsed ? 'Buka Semua Seksi' : 'Tutup Semua Seksi';
    });

    // 3. Fitur Pencarian Nama Panitia / Jabatan / Seksi
    function filterPanitia() {
        const query = searchInput.value.trim().toLowerCase();
        clearSearchBtn.hidden = query.length === 0;

        // Reset kondisi jika pencarian kosong
        if (!query) {
            searchableItems.forEach(el => {
                el.classList.remove('highlight-match', 'dimmed-item');
            });
            searchStatus.hidden = true;
            return;
        }

        // Otomatis buka semua kartu yang tertutup agar hasil pencarian terlihat
        collapsibleCards.forEach(card => card.classList.remove('collapsed'));
        allCollapsed = false;
        toggleAllBtn.textContent = 'Tutup Semua Seksi';

        let matchCount = 0;

        searchableItems.forEach(el => {
            const text = (el.textContent + ' ' + (el.dataset.search || '')).toLowerCase();
            if (text.includes(query)) {
                el.classList.add('highlight-match');
                el.classList.remove('dimmed-item');
                matchCount++;
            } else {
                el.classList.remove('highlight-match');
                el.classList.add('dimmed-item');
            }
        });

        searchStatus.hidden = false;
        if (matchCount > 0) {
            searchStatus.style.color = '#1e4d2b';
            searchStatus.textContent = `Ditemukan ${matchCount} hasil untuk "${searchInput.value.trim()}"`;
        } else {
            searchStatus.style.color = '#b92b27';
            searchStatus.textContent = `Tidak ditemukan nama/seksi yang cocok dengan "${searchInput.value.trim()}"`;
        }
    }

    searchInput.addEventListener('input', filterPanitia);

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterPanitia();
        searchInput.focus();
    });
});