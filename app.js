(() => {
  const data = window.CDST_DATA || { pages: [], homeGallery: [] };
  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const pageBy = terms => data.pages.find(page =>
    terms.some(term => `${page.title} ${page.slug}`.toLowerCase().includes(term))
  );
  const revealSelector = '.quick-card, .info-card, .training-card, .feature-card, .specialty-card, .pathway-card, .industrial-card, .faculty-card, .trust-grid article, .project-topics article, .archive-item';
  let cardRevealObserver = null;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof window.IntersectionObserver === 'function') {
    cardRevealObserver = new window.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        card.classList.remove('card-reveal-pending');
        card.classList.add('card-intro');
        card.addEventListener('animationend', () => card.classList.remove('card-intro'), { once: true });
        cardRevealObserver.unobserve(card);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
  }

  function revealCards(root = document) {
    if (!cardRevealObserver) return;
    root.querySelectorAll(revealSelector).forEach(card => {
      if (card.dataset.revealQueued) return;
      card.dataset.revealQueued = 'true';
      card.style.setProperty('--intro-delay', `${Math.floor(Math.random() * 180)}ms`);
      card.classList.add('card-reveal-pending');
      cardRevealObserver.observe(card);
    });
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = byId('primary-nav');
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  mainNav.addEventListener('click', event => {
    if (event.target.closest('a')) {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    }
  });

  document.querySelectorAll('[data-request]').forEach(link => {
    link.addEventListener('click', () => {
      const requestDetails = byId('request-details');
      const topic = byId('request-topic');
      const wantedTopic = link.dataset.request;
      const option = Array.from(topic.options).find(item => item.value === wantedTopic || item.text === wantedTopic);
      if (option) topic.value = option.value;
      requestDetails.open = true;
    });
  });

  const archive = byId('archive-grid');
  const search = byId('archive-search');
  const count = byId('archive-count');
  const archiveDetail = byId('archive-detail');
  const detailTitle = byId('detail-title');
  const detailBody = byId('detail-body');
  const detailSource = byId('detail-source');

  function renderArchive(query = '') {
    const term = query.trim().toLowerCase();
    const pages = data.pages.filter(page =>
      `${page.title} ${page.type} ${page.text}`.toLowerCase().includes(term)
    );
    count.textContent = `${pages.length} ${pages.length === 1 ? 'ITEM' : 'ITEMS'}`;
    if (!pages.length) {
      archive.innerHTML = '<p class="archive-empty">No pages match your search.</p>';
      return;
    }
    archive.innerHTML = pages.map(page => `
      <button class="archive-item" type="button" data-open="${escapeHtml(page.slug)}">
        <span><small>${escapeHtml(page.type)}</small><b>${escapeHtml(page.title)}</b></span>
        <span aria-hidden="true">↗</span>
      </button>`).join('');
    revealCards(archive);
  }

  function openArchivePage(slug) {
    const page = data.pages.find(item => item.slug === slug);
    if (!page) return;
    detailTitle.textContent = page.title;
    detailBody.textContent = page.text || 'The export contains this page record, but no readable body text was included.';
    detailSource.href = page.link || 'https://cdst.co.in/';
    archiveDetail.hidden = false;
    archiveDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderArchive();
  search.addEventListener('input', event => renderArchive(event.target.value));
  archive.addEventListener('click', event => {
    const item = event.target.closest('[data-open]');
    if (item) openArchivePage(item.dataset.open);
  });
  byId('detail-close').addEventListener('click', () => {
    archiveDetail.hidden = true;
    byId('archive').scrollIntoView({ behavior: 'smooth' });
  });

  const gallery = byId('gallery-grid');
  const galleryPanel = document.querySelector('.gallery-panel');
  const galleryProgress = document.querySelector('.gallery-progress i');
  const galleryImages = [
    { src: 'assets/img/computer-training.webp', alt: 'Students working in a computer training lab' },
    { src: 'assets/img/student-team.webp', alt: 'CDST student team' },
    { src: 'assets/img/seminar-group.webp', alt: 'CDST seminar participants' },
    { src: 'assets/img/project-workshop.webp', alt: 'Students taking part in a project workshop' },
    { src: 'assets/img/classroom-session.webp', alt: 'CDST classroom training session' },
    { src: 'assets/img/training-event.webp', alt: 'CDST training event' },
    { src: 'assets/img/industrial-training-poster.webp', alt: 'CDST industrial training poster' }
  ];
  for (let index = galleryImages.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [galleryImages[index], galleryImages[swapIndex]] = [galleryImages[swapIndex], galleryImages[index]];
  }
  const galleryTiles = [];
  galleryImages.forEach((item, index) => {
    const tile = document.createElement('div');
    tile.className = 'gallery-tile';
    tile.setAttribute('role', 'group');
    tile.setAttribute('aria-roledescription', 'slide');
    tile.setAttribute('aria-label', `Image ${index + 1} of ${galleryImages.length}`);
    tile.style.setProperty('--tile-index', index);
    const image = document.createElement('img');
    image.loading = 'lazy';
    image.decoding = 'async';
    image.src = item.src;
    image.alt = item.alt;
    image.addEventListener('error', () => {
      image.remove();
      tile.classList.add('gallery-unavailable');
      const fallback = document.createElement('span');
      fallback.className = 'gallery-fallback';
      fallback.textContent = 'IMAGE UNAVAILABLE';
      tile.appendChild(fallback);
    }, { once: true });
    tile.append(image);
    gallery.appendChild(tile);
    galleryTiles.push(tile);
  });

  const galleryMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeGalleryIndex = 0;
  let galleryTimer = null;
  let galleryPointerPaused = false;
  let galleryFocusPaused = false;

  function showGalleryImage(index) {
    activeGalleryIndex = (index + galleryTiles.length) % galleryTiles.length;
    galleryTiles.forEach((tile, tileIndex) => {
      tile.classList.toggle('is-active', tileIndex === activeGalleryIndex);
      tile.setAttribute('aria-current', String(tileIndex === activeGalleryIndex));
    });
    const activeTile = galleryTiles[activeGalleryIndex];
    const nextScrollLeft = gallery.scrollLeft + activeTile.getBoundingClientRect().left - gallery.getBoundingClientRect().left;
    gallery.scrollTo({ left: nextScrollLeft, behavior: galleryMotionPreference.matches ? 'auto' : 'smooth' });
    galleryProgress.style.animation = 'none';
    void galleryProgress.offsetWidth;
    galleryProgress.style.animation = '';
  }

  function startGalleryAutoplay() {
    window.clearInterval(galleryTimer);
    galleryTimer = null;
    if (galleryMotionPreference.matches || galleryPointerPaused || galleryFocusPaused || document.hidden) {
      galleryPanel.classList.remove('is-playing');
      return;
    }
    galleryPanel.classList.add('is-playing');
    galleryTimer = window.setInterval(() => showGalleryImage(activeGalleryIndex + 1), 5000);
  }

  document.querySelector('[data-gallery-prev]').addEventListener('click', () => {
    showGalleryImage(activeGalleryIndex - 1);
    startGalleryAutoplay();
  });
  document.querySelector('[data-gallery-next]').addEventListener('click', () => {
    showGalleryImage(activeGalleryIndex + 1);
    startGalleryAutoplay();
  });
  galleryPanel.addEventListener('pointerenter', () => {
    galleryPointerPaused = true;
    startGalleryAutoplay();
  });
  galleryPanel.addEventListener('pointerleave', () => {
    galleryPointerPaused = false;
    startGalleryAutoplay();
  });
  galleryPanel.addEventListener('focusin', () => {
    galleryFocusPaused = true;
    startGalleryAutoplay();
  });
  galleryPanel.addEventListener('focusout', event => {
    if (!galleryPanel.contains(event.relatedTarget)) {
      galleryFocusPaused = false;
      startGalleryAutoplay();
    }
  });
  document.addEventListener('visibilitychange', startGalleryAutoplay);
  showGalleryImage(0);
  startGalleryAutoplay();

  const about = pageBy(['about-us', 'about']);
  if (about && about.text) {
    const description = document.querySelector('meta[name="description"]');
    description.content = `CDST Informatics Private Limited — ${about.text.replace(/\s+/g, ' ').trim().slice(0, 145)}`;
  }

  byId('current-year').textContent = new Date().getFullYear();
  revealCards();

  const requestForm = byId('request-form');
  const formStatus = byId('form-status');
  requestForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const formData = new FormData(requestForm);
    const name = String(formData.get('name')).trim();
    const email = String(formData.get('email')).trim();
    const topic = String(formData.get('topic')).trim();
    const message = String(formData.get('message')).trim();
    const subject = encodeURIComponent(`CDST enquiry: ${topic}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`);
    formStatus.textContent = 'Opening your email app with this enquiry. If it does not open, email info@cdst.co.in directly.';
    window.location.href = `mailto:info@cdst.co.in?subject=${subject}&body=${body}`;
  });
})();
