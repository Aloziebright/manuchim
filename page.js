(function () {
  const applyMenuToggle = () => {
    const toggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const icon = toggle?.querySelector('i');

    if (!toggle || !navLinks) return;

    const setMenuState = (isOpen) => {
      navLinks.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
      }
    };

    toggle.addEventListener('click', () => {
      setMenuState(!navLinks.classList.contains('open'));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });
  };

  const applyFaqToggle = () => {
    document.querySelectorAll('.faq-item').forEach((item) => {
      const button = item.querySelector('.faq-question');
      if (!button) return;

      button.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach((entry) => entry.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  };

  const applyHamburgerToggle = () => {
    const button = document.querySelector('.hamburger-btn');
    const menu = document.querySelector('.hamburger-content');
    if (!button || !menu || button.dataset.menuBound === 'true') return;
    button.dataset.menuBound = 'true';

    const icon = button.querySelector('i');
    const setState = (isOpen) => {
      menu.classList.toggle('show', isOpen);
      button.classList.toggle('active', isOpen);
      button.setAttribute('aria-expanded', String(isOpen));
      if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
      }
    };

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      setState(!menu.classList.contains('show'));
    });

    document.addEventListener('click', (event) => {
      if (!button.contains(event.target) && !menu.contains(event.target)) {
        setState(false);
      }
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setState(false));
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyMenuToggle();
    applyFaqToggle();
    applyHamburgerToggle();
  });
})();
