document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Function to switch active tab
  function activateTab(tabName) {
    tabButtons.forEach((btn) => {
      const isSelected = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    tabPanels.forEach((panel) => {
      const isTarget = panel.id === `panel-${tabName}`;
      panel.classList.toggle('hidden', !isTarget);
    });
  }

  // Automatic Date Logic:
  // Until 21 Dec 2026, default tab is "adven".
  // Starting 22 Dec 2026, default tab switches to "natal".
  const now = new Date();
  const switchToNatalDate = new Date(2026, 11, 22, 0, 0, 0);

  if (now >= switchToNatalDate) {
    activateTab('natal');
  } else {
    activateTab('adven');
  }

  // Manual tab click listeners
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.tab);
    });
  });

  // ================= COLLAPSE / EXPAND POSTER CONTAINERS =================
  const posterHeaders = document.querySelectorAll('.poster-header');

  posterHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const card = header.closest('.poster-card');
      const isOpen = card.classList.toggle('is-open');
      header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // ================= LIGHTBOX MODAL FOR IMAGES =================
  const posterImageWraps = document.querySelectorAll('.poster-img-wrap');
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  function openLightbox(imgSrc, imgAlt, captionText) {
    lightboxImg.src = imgSrc;
    lightboxImg.alt = imgAlt;
    lightboxCaption.textContent = captionText;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      lightboxImg.src = '';
    }, 300);
  }

  posterImageWraps.forEach((wrap) => {
    wrap.addEventListener('click', () => {
      const card = wrap.closest('.poster-card');
      const img = wrap.querySelector('img');
      const caption = card.dataset.caption || img.alt;
      openLightbox(img.src, img.alt, caption);
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });

  // Placeholder alert for links without final URLs yet
  document.querySelectorAll('a[data-placeholder="true"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      alert(`Halaman "${link.querySelector('.link-title').textContent}" akan segera tersedia.`);
    });
  });
});