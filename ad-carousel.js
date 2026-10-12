// Featured Products Carousel (customer-side display only)
// Manufacturers do not upload ads directly. Verify admin curates content and contacts.

(function () {
  const STORAGE_KEY = 'verifyAdminFeaturedAds';
  const MAX_ADS = 20;
  const MIN_ROTATE_MS = 6000;
  const MAX_ROTATE_MS = 8000;
  const FALLBACK_ADS = (window.VerifyFeaturedAds && typeof window.VerifyFeaturedAds.getSampleAds === 'function')
    ? window.VerifyFeaturedAds.getSampleAds().map((item, index) => ({ ...item, id: item.id || `ad-${index + 1}` }))
    : [];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeAd(raw, index) {
    const contacts = raw && typeof raw.contacts === 'object' ? raw.contacts : {};
    return {
      id: raw.id || `featured-${index + 1}`,
      productName: raw.productName || `Featured Product ${index + 1}`,
      promoText: raw.promoText || 'Official featured product selected by Verify admin.',
      productImage: raw.productImage || '',
      manufacturerName: raw.manufacturerName || 'Official Manufacturer',
      manufacturerLogo: raw.manufacturerLogo || '',
      contacts: {
        website: contacts.website || '',
        whatsapp: contacts.whatsapp || '',
        email: contacts.email || '',
        facebook: contacts.facebook || '',
        instagram: contacts.instagram || ''
      }
    };
  }

  function getAdminAds() {
    const fallbackAds = FALLBACK_ADS.length ? FALLBACK_ADS : [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : fallbackAds;
      if (!Array.isArray(parsed) || !parsed.length) return fallbackAds.map(normalizeAd);
      return parsed.slice(0, MAX_ADS).map(normalizeAd);
    } catch (error) {
      console.warn('Unable to parse admin featured ads. Falling back to defaults.', error);
      return fallbackAds.map(normalizeAd);
    }
  }

  const Carousel = {
    ads: [],
    index: 0,
    timerId: null,
    isPaused: false,
    touchStartX: 0,
    touchMoveX: 0,
    isTouchDragging: false,
    dragDeltaPx: 0,
    animationFrame: null,
    viewport: null,
    track: null,
    dots: null,
    prevBtn: null,
    nextBtn: null,
    modal: null,
    modalSubtitle: null,
    modalChannels: null,

    init() {
      this.viewport = document.getElementById('featuredAdsViewport');
      this.track = document.getElementById('featuredAdsTrack');
      this.dots = document.getElementById('featuredAdsDots');
      this.prevBtn = document.getElementById('featuredAdsPrev');
      this.nextBtn = document.getElementById('featuredAdsNext');
      this.modal = document.getElementById('manufacturerContactModal');
      this.modalSubtitle = document.getElementById('manufacturerContactSubtitle');
      this.modalChannels = document.getElementById('manufacturerContactChannels');

      if (!this.viewport || !this.track || !this.dots || !this.prevBtn || !this.nextBtn) return;

      this.ads = getAdminAds().slice(0, MAX_ADS);
      this.render();
      this.bindEvents();
      this.bindResizeHandling();
      this.goTo(0, false);
      this.startAutoRotate();
    },

    render() {
      if (!this.ads.length) {
        this.track.innerHTML = '<article class="featured-ad-slide"><div class="featured-ad-card"><div class="featured-ad-card__media"><div class="featured-ad-card__empty">No featured ads are available right now.</div></div></div></article>';
        this.dots.innerHTML = '';
        this.prevBtn.style.display = 'none';
        this.nextBtn.style.display = 'none';
        return;
      }

      this.track.innerHTML = this.ads.map((ad, idx) => {
        const logoMarkup = ad.manufacturerLogo
          ? `<img class="featured-ad-card__logo" data-logo-src="${escapeHtml(ad.manufacturerLogo)}" alt="${escapeHtml(ad.manufacturerName)} logo" loading="lazy">`
          : `<span class="featured-ad-card__logo featured-ad-card__logo--fallback">${escapeHtml((ad.manufacturerName || 'M').slice(0, 1))}</span>`;

        return `
          <article class="featured-ad-slide" data-slide-index="${idx}">
            <div class="featured-ad-card">
              <div class="featured-ad-card__media">
                <img class="featured-ad-card__image" data-image-src="${escapeHtml(ad.productImage)}" alt="${escapeHtml(ad.productName)}" loading="lazy">
              </div>
              <div class="featured-ad-card__body">
                <span class="featured-ad-card__badge">Uses Verify</span>
                <h3 class="featured-ad-card__title">${escapeHtml(ad.productName)}</h3>
                <p class="featured-ad-card__text">${escapeHtml(ad.promoText)}</p>
                <div class="featured-ad-card__meta">
                  ${logoMarkup}
                  <span class="featured-ad-card__manufacturer">${escapeHtml(ad.manufacturerName)}</span>
                </div>
                <div class="featured-ad-card__code-block" data-ad-code="${escapeHtml(ad.id || `ad-${idx + 1}`)}">
                  <span class="featured-ad-card__code-label">Ad Code</span>
                  <div class="featured-ad-card__code-row">
                    <code class="featured-ad-card__code">${escapeHtml(ad.id || `ad-${idx + 1}`)}</code>
                    <button type="button" class="featured-ad-card__copy-btn" data-copy-code="${escapeHtml(ad.id || `ad-${idx + 1}`)}" aria-label="Copy ad code">Copy</button>
                  </div>
                </div>
                <button type="button" class="featured-ad-card__order" data-order-index="${idx}">Order from Manufacturer</button>
              </div>
            </div>
          </article>
        `;
      }).join('');

      this.dots.innerHTML = this.ads.map((_, idx) => (
        `<button type="button" class="featured-ads__dot" data-dot-index="${idx}" aria-label="Go to featured product ${idx + 1}"></button>`
      )).join('');
    },

    bindEvents() {
      this.prevBtn.addEventListener('click', () => {
        this.pauseTemporarily();
        this.goTo(this.index - 1);
      });

      this.nextBtn.addEventListener('click', () => {
        this.pauseTemporarily();
        this.goTo(this.index + 1);
      });

      this.dots.addEventListener('click', (event) => {
        const dot = event.target.closest('[data-dot-index]');
        if (!dot) return;
        this.pauseTemporarily();
        this.goTo(Number(dot.getAttribute('data-dot-index')));
      });

      this.track.addEventListener('click', (event) => {
        const orderBtn = event.target.closest('[data-order-index]');
        if (orderBtn) {
          const targetIndex = Number(orderBtn.getAttribute('data-order-index'));
          const ad = this.ads[targetIndex];
          if (!ad) return;
          this.openContactModal(ad);
          return;
        }

        const copyBtn = event.target.closest('[data-copy-code]');
        if (copyBtn) {
          event.preventDefault();
          const code = copyBtn.getAttribute('data-copy-code') || '';
          if (!code) return;
          this.copyAdCode(code, copyBtn);
        }
      });

      this.viewport.style.touchAction = 'pan-y';
      this.viewport.addEventListener('mouseenter', () => this.pauseAutoRotate());
      this.viewport.addEventListener('mouseleave', () => this.resumeAutoRotate());
      this.viewport.addEventListener('focusin', () => this.pauseAutoRotate());
      this.viewport.addEventListener('focusout', () => this.resumeAutoRotate());

      this.viewport.addEventListener('touchstart', (event) => {
        this.pauseAutoRotate();
        this.touchStartX = event.changedTouches[0]?.clientX || 0;
        this.touchMoveX = this.touchStartX;
        this.isTouchDragging = true;
        this.dragDeltaPx = 0;
        this.track.style.transition = 'none';
      }, { passive: true });

      this.viewport.addEventListener('touchmove', (event) => {
        if (!this.isTouchDragging) return;
        this.touchMoveX = event.changedTouches[0]?.clientX || this.touchMoveX;
        this.dragDeltaPx = this.touchMoveX - this.touchStartX;
        const width = this.viewport.clientWidth || 1;
        const dragPercent = (this.dragDeltaPx / width) * 100;

        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
        }

        this.animationFrame = requestAnimationFrame(() => {
          this.track.style.transform = `translate3d(calc(-${this.index * 100}% + ${dragPercent}%), 0, 0)`;
          this.animationFrame = null;
        });
      }, { passive: true });

      const finishTouch = () => {
        if (!this.isTouchDragging) return;
        const delta = this.dragDeltaPx;
        this.isTouchDragging = false;
        this.track.style.transition = '';

        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = null;
        }

        if (Math.abs(delta) > 44) {
          if (delta < 0) {
            this.goTo(this.index + 1);
          } else {
            this.goTo(this.index - 1);
          }
        } else {
          this.goTo(this.index);
        }
        this.resumeAutoRotate();
      };

      this.viewport.addEventListener('touchend', finishTouch, { passive: true });
      this.viewport.addEventListener('touchcancel', finishTouch, { passive: true });

      const closeBtn = document.getElementById('manufacturerContactClose');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeContactModal());

      if (this.modal) {
        this.modal.addEventListener('click', (event) => {
          if (event.target && event.target.hasAttribute('data-contact-close')) {
            this.closeContactModal();
          }
        });
      }

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.closeContactModal();
        }
      });
    },

    bindResizeHandling() {
      if (!this.viewport || !this.track) return;
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          this.goTo(this.index, false);
        });
        this.resizeObserver.observe(this.viewport);
      }

      window.addEventListener('resize', () => {
        this.goTo(this.index, false);
      });
    },

    goTo(nextIndex, animate = true) {
      if (!this.ads.length) return;
      const total = this.ads.length;
      this.index = ((nextIndex % total) + total) % total;

      this.track.style.transition = animate ? 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      this.track.style.transform = `translateX(-${this.index * 100}%)`;
      if (!animate) {
        requestAnimationFrame(() => {
          this.track.style.transition = '';
        });
      }

      this.updateDots();
      this.updateActiveSlideState();
      this.lazyLoadAround(this.index);
      this.scheduleNext();
    },

    updateActiveSlideState() {
      this.track.querySelectorAll('.featured-ad-slide').forEach((slide) => {
        const isActive = Number(slide.getAttribute('data-slide-index')) === this.index;
        slide.classList.toggle('is-active', isActive);
      });
    },

    updateDots() {
      this.dots.querySelectorAll('[data-dot-index]').forEach((dot) => {
        const isActive = Number(dot.getAttribute('data-dot-index')) === this.index;
        dot.classList.toggle('active', isActive);
      });
    },

    lazyLoadAround(centerIndex) {
      const total = this.ads.length;
      const required = new Set([
        centerIndex,
        (centerIndex + 1) % total,
        (centerIndex - 1 + total) % total
      ]);

      this.track.querySelectorAll('.featured-ad-slide').forEach((slide) => {
        const idx = Number(slide.getAttribute('data-slide-index'));
        if (!required.has(idx)) return;

        const image = slide.querySelector('.featured-ad-card__image[data-image-src]');
        if (image) {
          const src = image.getAttribute('data-image-src');
          if (src) image.src = src;
          image.removeAttribute('data-image-src');
        }

        const logo = slide.querySelector('.featured-ad-card__logo[data-logo-src]');
        if (logo) {
          const logoSrc = logo.getAttribute('data-logo-src');
          if (logoSrc) logo.src = logoSrc;
          logo.removeAttribute('data-logo-src');
        }
      });
    },

    pauseTemporarily() {
      this.pauseAutoRotate();
      window.setTimeout(() => this.resumeAutoRotate(), 3000);
    },

    pauseAutoRotate() {
      this.isPaused = true;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    },

    resumeAutoRotate() {
      this.isPaused = false;
      this.scheduleNext();
    },

    getNextDelay() {
      return Math.floor(Math.random() * (MAX_ROTATE_MS - MIN_ROTATE_MS + 1)) + MIN_ROTATE_MS;
    },

    scheduleNext() {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      if (this.isPaused || this.ads.length <= 1) return;

      this.timerId = window.setTimeout(() => {
        this.goTo(this.index + 1);
      }, this.getNextDelay());
    },

    startAutoRotate() {
      this.isPaused = false;
      this.scheduleNext();
    },

    normalizeContactLink(type, value) {
      const trimmed = String(value || '').trim();
      if (!trimmed) return '';

      if (type === 'email') return `mailto:${trimmed.replace(/^mailto:/i, '')}`;
      if (type === 'whatsapp') {
        const clean = trimmed.replace(/[^\d+]/g, '');
        return `https://wa.me/${clean.replace(/^\+/, '')}`;
      }
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    },

    copyAdCode(code, button) {
      if (!code) return;
      const originalText = button.textContent;
      navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied';
        button.classList.add('is-copied');
        window.setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('is-copied');
        }, 1400);
      }).catch(() => {
        button.textContent = 'Copy failed';
        button.classList.add('is-copied');
        window.setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('is-copied');
        }, 1400);
      });
    },

    openContactModal(ad) {
      if (!this.modal || !this.modalSubtitle || !this.modalChannels) return;

      const channelMap = [
        { key: 'website', label: 'Official Website', iconClass: 'fas fa-globe' },
        { key: 'whatsapp', label: 'WhatsApp', iconClass: 'fab fa-whatsapp' },
        { key: 'email', label: 'Email', iconClass: 'fas fa-envelope' },
        { key: 'facebook', label: 'Facebook', iconClass: 'fab fa-facebook-f' },
        { key: 'instagram', label: 'Instagram', iconClass: 'fab fa-instagram' }
      ];

      const items = channelMap
        .filter((channel) => ad.contacts && ad.contacts[channel.key])
        .map((channel) => {
          const href = this.normalizeContactLink(channel.key, ad.contacts[channel.key]);
          if (!href) return '';
          return `
            <a class="manufacturer-contact-modal__channel" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
              <i class="${channel.iconClass}"></i>
              <span>${escapeHtml(channel.label)}</span>
            </a>
          `;
        })
        .join('');

      this.modalSubtitle.textContent = `${ad.manufacturerName} official channels`;
      this.modalChannels.innerHTML = items || '<p class="manufacturer-contact-modal__empty">No official contact channels are currently listed for this ad.</p>';

      this.modal.classList.add('show');
      this.modal.setAttribute('aria-hidden', 'false');
    },

    closeContactModal() {
      if (!this.modal) return;
      this.modal.classList.remove('show');
      this.modal.setAttribute('aria-hidden', 'true');
    }
  };

  function initializeFeaturedAds() {
    Carousel.init();
  }

  if (document.getElementById('ads-placeholder') && document.getElementById('ads-placeholder').innerHTML.trim()) {
    initializeFeaturedAds();
  } else {
    document.addEventListener('ads-loaded', initializeFeaturedAds);
  }

  window.AdCarousel = Carousel;
})();
