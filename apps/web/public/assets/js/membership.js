/* Memberships & Packs — tabs.
 *
 * Loaded by BOTH copies of the home page: public/index.html (what is live) and
 * the dev page (EditorialLandingView). The listener is on the document, so it
 * works whether the section exists when this runs or is injected later, and a
 * second load does nothing.
 */
(function () {
  if (window.__mshipTabs) return;
  window.__mshipTabs = true;

  function select(tab, focus) {
    var list = tab.closest('[role="tablist"]');
    if (!list) return;
    var tabs = list.querySelectorAll('[role="tab"]');
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (!panel) continue;
      if (on) {
        panel.hidden = false;
        panel.classList.remove('is-in');
        void panel.offsetWidth; // restart the fade
        panel.classList.add('is-in');
      } else {
        panel.hidden = true;
      }
    }
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
      window.ScrollTrigger.refresh();
    }
    if (focus) tab.focus();
  }

  // Backward-compatible fallback in case legacy calls exist
  window.switchMembershipTab = function (tabName) {
    var tab = document.getElementById('mship-tab-' + tabName) ||
              document.querySelector('[aria-controls="mship-' + tabName + '"]');
    if (tab) select(tab, false);
  };

  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.mship__tab');
    if (tab) select(tab, false);
  });

  document.addEventListener('keydown', function (e) {
    var tab = e.target.closest && e.target.closest('.mship__tab');
    if (!tab) return;
    var tabs = Array.prototype.slice.call(tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
    var i = tabs.indexOf(tab);
    var next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (next) {
      e.preventDefault();
      select(next, true);
    }
  });
})();
