(() => {
  'use strict';

  /* -------- custom cursor: metallic reticle, tracks 1:1, no lag -------- */
  const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (supportsFinePointer) {
    document.body.classList.add('has-custom-cursor');
    const cursor = document.getElementById('cursor');

    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 3}px, 0)`;
      cursor.classList.add('is-ready');
    }, { passive: true });

    const hoverTargets = 'a, button, input, textarea, [role="button"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) cursor.classList.remove('is-hover');
    });
    document.addEventListener('mouseleave', () => { cursor.classList.remove('is-ready'); });
  }

  /* -------- hero photo: subtle 3D tilt toward the cursor -------- */
  const heroMedia = document.getElementById('heroMedia');
  const heroMediaImg = document.getElementById('heroMediaImg');

  if (heroMedia && heroMediaImg && supportsFinePointer) {
    let ticking = false;
    let lastX = 0.5, lastY = 0.5;

    const applyTilt = () => {
      const rotY = (lastX - 0.5) * 14;   // left/right cursor -> Y-axis rotation
      const rotX = (0.5 - lastY) * 8;    // up/down cursor -> X-axis rotation
      heroMediaImg.style.transform =
        `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.06)`;
      ticking = false;
    };

    heroMedia.addEventListener('mousemove', (e) => {
      const rect = heroMedia.getBoundingClientRect();
      lastX = (e.clientX - rect.left) / rect.width;
      lastY = (e.clientY - rect.top) / rect.height;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyTilt);
      }
    }, { passive: true });

    heroMedia.addEventListener('mouseleave', () => {
      heroMediaImg.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }

  /* -------- header state on scroll -------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* -------- preloader: page reveal is sequenced after this hides -------- */
  const preloader = document.getElementById('preloader');
  const MIN_PRELOAD_MS = 900;
  const startedAt = Date.now();

  const hidePreloader = () => {
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, MIN_PRELOAD_MS - elapsed);
    setTimeout(() => {
      preloader.classList.add('is-hidden');
      document.documentElement.classList.remove('is-loading');
      // the hero's own text/photo entrance only starts once the preloader
      // is out of the way, so the sequence reads as one continuous reveal
      document.querySelector('.hero').classList.add('is-in');
    }, wait);
  };

  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader);
  }

  /* -------- staggered entrance reveals -------- */
  const reveal = (el) => el.classList.add('is-in');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('section').forEach((section) => {
    if (section.classList.contains('hero')) return;
    observer.observe(section);
  });

  // collection cards stagger individually (already carry --d inline)
  document.querySelectorAll('.collection-card').forEach((card) => {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    cardObserver.observe(card);
  });

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
      ? `По модели «${modelName}». Перезвоним и\u00A0поможем с\u00A0оформлением.`
      : 'Перезвоним и\u00A0поможем подобрать модель — без\u00A0навязчивых звонков после.';
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

    // NOTE: no backend is wired up yet — this only simulates a successful
    // submission client-side. Wire this block to a real endpoint (e.g. your
    // CRM webhook or a form service) before going live.
    requestForm.hidden = true;
    requestSuccess.hidden = false;
  });
})();

