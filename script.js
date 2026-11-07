(() => {
  'use strict';

  /* -------- brief branded loading veil -------- */
  const preloader = document.getElementById('preloader');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (preloader && document.documentElement.classList.contains('is-loading')) {
    const loaderStartedAt = performance.now();
    const minimumLoaderTime = prefersReducedMotion ? 0 : 1280;
    let loaderReleaseRequested = false;
    const releasePreloader = () => {
      if (loaderReleaseRequested) return;
      loaderReleaseRequested = true;
      window.removeEventListener('load', releasePreloader);
      const remaining = Math.max(0, minimumLoaderTime - (performance.now() - loaderStartedAt));
      window.setTimeout(() => {
        preloader.classList.add('is-hidden');
        document.documentElement.classList.remove('is-loading');
      }, remaining);
    };

    if (document.readyState === 'complete') releasePreloader();
    else window.addEventListener('load', releasePreloader, { once: true });
    window.setTimeout(releasePreloader, 1950);
  }

  /* -------- header state on scroll -------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* -------- calm, progressive section entrances -------- */
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        if (element.matches('.section-transition')) {
          element.classList.add('is-in');
          observer.unobserve(element);
          return;
        }
        const delayValue = getComputedStyle(element).getPropertyValue('--d').trim();
        const parsedDelay = Number.parseFloat(delayValue) || 0;
        const delay = Math.min(parsedDelay, 280);

        element.classList.add('is-in');
        const headingLines = element.matches('.hd') ? [...element.querySelectorAll('.hd-inner')] : [];
        const targets = headingLines.length ? headingLines : [element];

        targets.forEach((target) => {
          const lineDelay = headingLines.length
            ? Math.min(Number.parseFloat(getComputedStyle(target).getPropertyValue('--hd')) || 0, 180)
            : delay;
          const isPhoto = target.matches('.photo');
          const restingOpacity = Number.parseFloat(getComputedStyle(target).opacity) || 1;
          const entrance = target.animate(isPhoto
            ? [
                { opacity: restingOpacity * 0.76, transform: 'scale(1.035)' },
                { opacity: restingOpacity, transform: 'scale(1)' },
              ]
            : [
                { opacity: 0.82, transform: 'translateY(12px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
          { duration: isPhoto ? 1320 : (headingLines.length ? 1040 : 920), delay: lineDelay, easing: 'cubic-bezier(.2, .72, .2, 1)', fill: 'both' });
          entrance.addEventListener('finish', () => entrance.cancel(), { once: true });
        });
        observer.unobserve(element);
      });
    }, { threshold: 0.02, rootMargin: '0px 0px 120px 0px' });

    document.querySelectorAll('.rise, .hd, .photo, .trust__lead, .collections__sub, .anatomy__lead, .anatomy__spec, .final-cta__action, .final-cta__reassure, .section-transition')
      .forEach((element) => revealObserver.observe(element));
  }

  /* -------- mobile menu -------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const mobileNavigation = window.matchMedia('(max-width: 900px)');

  const setMenuOpen = (isOpen, returnFocus = false) => {
    nav.classList.toggle('is-open', isOpen);
    nav.inert = mobileNavigation.matches && !isOpen;
    nav.setAttribute('aria-hidden', String(mobileNavigation.matches && !isOpen));
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) nav.querySelector('a')?.focus();
    else if (returnFocus) burger.focus();
  };

  setMenuOpen(false);
  mobileNavigation.addEventListener('change', (event) => {
    setMenuOpen(false);
    if (!event.matches) {
      nav.inert = false;
      nav.setAttribute('aria-hidden', 'false');
    }
  });

  burger.addEventListener('click', () => {
    setMenuOpen(!nav.classList.contains('is-open'));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });

  /* =========================================================
     MODALS — product detail + request form
     ========================================================= */
  const productModal = document.getElementById('productModal');
  const requestModal = document.getElementById('requestModal');
  const allModals = [productModal, requestModal];

  let lastFocused = null;

  const openModal = (modal) => {
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = (modal) => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    const anyOpen = allModals.some((m) => m.classList.contains('is-open'));
    if (!anyOpen) document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  const closeAllModals = () => allModals.forEach(closeModal);

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => {
      const modal = el.closest('.modal');
      if (modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenuOpen(false, true);
    }
    if (e.key === 'Escape') closeAllModals();
  });

  /* -- product modal: populate from card data-* attributes -- */
  const productImg = document.getElementById('productModalImg');
  const productName = document.getElementById('productModalName');
  const productDesc = document.getElementById('productModalDesc');
  const productMaterial = document.getElementById('productModalMaterial');
  const productMovement = document.getElementById('productModalMovement');
  const productDiameter = document.getElementById('productModalDiameter');
  const productWater = document.getElementById('productModalWater');
  const productPrice = document.getElementById('productModalPrice');

  let currentModelName = '';

  document.querySelectorAll('.collection-card').forEach((card) => {
    const trigger = card.querySelector('.collection-card__link');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const d = card.dataset;
      currentModelName = d.name || '';
      productImg.src = d.img || '';
      productImg.alt = d.name || '';
      productName.textContent = d.name || '';
      productDesc.textContent = d.desc || '';
      productMaterial.textContent = d.material || '';
      productMovement.textContent = d.movement || '';
      productDiameter.textContent = d.diameter || '';
      productWater.textContent = d.water || '';
      productPrice.textContent = d.price || '';
      openModal(productModal);
    });
  });

  /* -- request modal: open directly, or from product modal -- */
  const requestModelField = document.getElementById('requestModelField');
  const requestFormSub = document.getElementById('requestFormSub');
  const requestForm = document.getElementById('requestForm');
  const requestSuccess = document.getElementById('requestSuccess');

  const resetRequestModal = (modelName) => {
    requestForm.hidden = false;
    requestSuccess.hidden = true;
    requestForm.reset();
    document.querySelectorAll('.field.is-invalid').forEach((f) => f.classList.remove('is-invalid'));
    requestModelField.value = modelName || '';
    requestFormSub.textContent = modelName
      ? `Вы выбрали модель «${modelName}». Форма пока не подключена.`
      : 'Форма пока не подключена к приёму заявок.';
  };

  document.querySelectorAll('[data-open-request]').forEach((btn) => {
    btn.addEventListener('click', () => {
      resetRequestModal('');
      openModal(requestModal);
    });
  });

  document.querySelectorAll('[data-open-request-from-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal(productModal);
      resetRequestModal(currentModelName);
      openModal(requestModal);
    });
  });

  /* -- request form: lightweight client-side validation + success state -- */
  const phonePattern = /^[\d\s()+-]{7,}$/;

  requestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const nameField = document.getElementById('requestName');
    const nameWrap = nameField.closest('.field');
    if (!nameField.value.trim()) {
      nameWrap.classList.add('is-invalid');
      valid = false;
    } else {
      nameWrap.classList.remove('is-invalid');
    }

    const phoneField = document.getElementById('requestPhone');
    const phoneWrap = phoneField.closest('.field');
    if (!phonePattern.test(phoneField.value.trim())) {
      phoneWrap.classList.add('is-invalid');
      valid = false;
    } else {
      phoneWrap.classList.remove('is-invalid');
    }

    if (!valid) return;

    // No submission endpoint is configured. Keep the response explicit so
    // the interface never claims that a request was received.
    requestForm.hidden = true;
    requestSuccess.hidden = false;
  });
})();


