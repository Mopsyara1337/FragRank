// Shared navigation only. Page content does not depend on this script.
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');

if (header && menuButton && navigation) {
  const mobileViewport = window.matchMedia('(max-width: 800px)');

  function closeMenu(returnFocus = false) {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
      closeMenu(true);
    }
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeMenu();
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  mobileViewport.addEventListener('change', () => {
    const focusedLinkWillHide = mobileViewport.matches && navigation.contains(document.activeElement);
    closeMenu(focusedLinkWillHide);
  });

  // Enable the collapsed layout only after its controls are ready.
  menuButton.hidden = false;
  header.classList.add('menu-ready');
}
