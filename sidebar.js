/* ========================================
   🆕 SIDEBAR NAVIGATION LOGIC
   ======================================== */

(function() {
  // Références
  const sidebar = document.getElementById('app-sidebar');
  const sidebarLogo = document.getElementById('sidebar-logo');
  const mobileHandle = document.getElementById('sidebar-mobile-handle');
  const settingsBtn = document.getElementById('sidebar-settings-btn');
  const navItems = document.querySelectorAll('.sidebar-item[data-nav]');

  // Sync logo sidebar avec logo principal
  function syncSidebarLogo() {
    const mainLogo = document.getElementById('app-logo');
    if (mainLogo && mainLogo.src) {
      sidebarLogo.src = mainLogo.src;
      sidebarLogo.style.display = 'block';
    }
  }

  // Observer le logo principal
  const logoObserver = new MutationObserver(syncSidebarLogo);
  const mainLogo = document.getElementById('app-logo');
  if (mainLogo) {
    logoObserver.observe(mainLogo, { attributes: true, attributeFilter: ['src'] });
    syncSidebarLogo();
  }

  // Toggle sidebar mobile
  if (mobileHandle) {
    mobileHandle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }

  // Fermer sidebar mobile après navigation
  function closeMobileSidebar() {
    if (window.innerWidth <= 900) {
      sidebar.classList.remove('open');
    }
  }

  // Map navigation
  const navMap = {
    'home': 'home-root',
    'md': 'admin-root',
    'tournaments': 'tournaments-root',
    'americano': 'americano-root',
    'solonight': 'solonight-root',
    'ligue': 'ligue-root',
    'ligue-config': 'ligue-config-root'
  };

  // Navigation handler
  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-nav');
      const sectionId = navMap[target];

      if (!sectionId) return;

      // Hide all sections
      document.querySelectorAll('[id$="-root"]').forEach(function(section) {
        section.style.display = 'none';
      });

      // Show target section
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = 'block';

        // Update active state
        navItems.forEach(function(nav) {
          nav.classList.remove('active');
        });
        item.classList.add('active');

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile sidebar
        closeMobileSidebar();
      }
    });
  });

  // Settings button
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      // Hide all sections
      document.querySelectorAll('[id$="-root"]').forEach(function(section) {
        section.style.display = 'none';
      });

      // Show settings
      const settingsSection = document.getElementById('settings-root');
      if (settingsSection) {
        settingsSection.style.display = 'block';

        // Update active state
        navItems.forEach(function(nav) {
          nav.classList.remove('active');
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMobileSidebar();
      }
    });
  }

  // Sync avec les boutons existants
  const existingButtons = {
    'btn-home-md': 'md',
    'btn-home-tournaments': 'tournaments',
    'btn-home-ligue': 'ligue',
    'btn-back-home-from-md': 'home',
    'btn-back-home-from-tournaments': 'home',
    'btn-back-home-from-classic': 'home',
    'btn-back-home-from-ligue': 'home',
    'btn-ligue-config': 'ligue-config',
    'btn-home-americano': 'americano',
    'btn-americano-home': 'home'
  };

  Object.keys(existingButtons).forEach(function(btnId) {
    const btn = document.getElementById(btnId);
    const navTarget = existingButtons[btnId];

    if (btn && navTarget) {
      btn.addEventListener('click', function() {
        const targetNav = document.querySelector('.sidebar-item[data-nav="' + navTarget + '"]');
        if (targetNav) {
          navItems.forEach(function(nav) {
            nav.classList.remove('active');
          });
          targetNav.classList.add('active');
        }
      });
    }
  });

  // Init: set home as active
  const homeNav = document.querySelector('.sidebar-item[data-nav="home"]');
  if (homeNav) {
    homeNav.classList.add('active');
  }

  // ========================================
  // MENU DÉROULANT LIGUES ACTIVES
  // ========================================

  const liguesToggle = document.getElementById('sidebar-ligues-toggle');
  const liguesSubmenu = document.getElementById('sidebar-ligues-submenu');
  const liguesMain = document.getElementById('sidebar-ligues-main');

  // Charger les ligues actives depuis localStorage
  function loadActiveLigues() {
    try {
      var raw = localStorage.getItem('padel_ligues_v1');
      if (!raw) return [];
      var data = JSON.parse(raw);
      return data.activeLeagues || [];
    } catch (e) {
      return [];
    }
  }

  // Injecter les ligues dans le sous-menu
  function renderLiguesSubmenu() {
    var ligues = loadActiveLigues();

    if (!liguesSubmenu) return;

    liguesSubmenu.innerHTML = '';

    if (ligues.length === 0) {
      liguesSubmenu.innerHTML = '<div class="sidebar-submenu-item" style="opacity: 0.5; cursor: default;">Aucune ligue active</div>';
      return;
    }

    ligues.forEach(function(ligue) {
      var item = document.createElement('button');
      item.className = 'sidebar-submenu-item';
      item.dataset.ligueId = ligue.id;

      // Générer la pastille de niveau
      var levelBadge = '';
      if (ligue.level) {
        var levelText = '';
        var levelClass = '';

        if (ligue.level.toLowerCase().indexOf('ligue 1') >= 0 || ligue.level.toLowerCase().indexOf('niveau 1') >= 0) {
          levelText = 'N1';
          levelClass = 'level-n1';
        } else if (ligue.level.toLowerCase().indexOf('ligue 2') >= 0 || ligue.level.toLowerCase().indexOf('niveau 2') >= 0) {
          levelText = 'N2';
          levelClass = 'level-n2';
        } else if (ligue.level.toLowerCase().indexOf('ligue 3') >= 0 || ligue.level.toLowerCase().indexOf('niveau 3') >= 0) {
          levelText = 'N3';
          levelClass = 'level-n3';
        }

        if (levelText) {
          levelBadge = '<span class="sidebar-level-badge ' + levelClass + '">' + levelText + '</span>';
        }
      }

      item.innerHTML = '<span class="submenu-icon">📊</span><span class="submenu-label">' + (ligue.name || 'Ligue sans nom') + '</span>' + levelBadge;

      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Naviguer vers la page de gestion de cette ligue spécifique
        if (typeof window.showLigueManage === 'function') {
          window.showLigueManage(ligue.id);
        }

        closeMobileSidebar();
      });

      liguesSubmenu.appendChild(item);
    });
  }

  // Toggle du sous-menu
  if (liguesToggle && liguesSubmenu) {
    liguesToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      liguesToggle.classList.toggle('open');
      liguesSubmenu.classList.toggle('open');
    });
  }

  // Clic sur "Ligues actives" (texte) = page globale
  if (liguesMain) {
    liguesMain.addEventListener('click', function(e) {
      // Ne rien faire si on clique sur le toggle
      if (e.target.closest('.sidebar-submenu-toggle')) {
        return;
      }
    });
  }

  // Charger les ligues au démarrage
  renderLiguesSubmenu();

  // Recharger les ligues quand on revient sur la page
  window.addEventListener('focus', renderLiguesSubmenu);

  // Exposer pour recharger depuis l'extérieur si nécessaire
  window.reloadSidebarLigues = renderLiguesSubmenu;

  // ========================================
  // 🆕 TOGGLE SIDEBAR (COLLAPSE/EXPAND)
  // ========================================

  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const STORAGE_KEY = 'sidebar_open';

  // Charger l'état depuis localStorage
  function getSidebarState() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      // Par défaut, la sidebar est ouverte (true)
      return stored === null ? true : stored === 'true';
    } catch (e) {
      return true;
    }
  }

  // Sauvegarder l'état dans localStorage
  function setSidebarState(isOpen) {
    try {
      localStorage.setItem(STORAGE_KEY, isOpen.toString());
    } catch (e) {
      // noop
    }
  }

  // Appliquer l'état de la sidebar
  function applySidebarState(isOpen) {
    if (!sidebar) return;

    if (isOpen) {
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
    }
  }

  // Toggle la sidebar
  function toggleSidebar() {
    var isCurrentlyOpen = !sidebar.classList.contains('collapsed');
    var newState = !isCurrentlyOpen;

    applySidebarState(newState);
    setSidebarState(newState);
  }

  // L'état initial est déjà appliqué par le script inline anti-flash
  // Pas besoin de réappliquer, juste vérifier la cohérence
  var initialState = getSidebarState();

  // Écouter le clic sur le bouton toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  } else {
    console.warn('⚠️ Bouton toggle sidebar non trouvé');
  }

  // Debug : afficher l'état initial
  console.log('🔧 Sidebar - État initial:', initialState ? 'ouvert' : 'fermé');

  // Exposer pour utilisation externe si nécessaire
  window.toggleSidebar = toggleSidebar;
})();
