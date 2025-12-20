/**
 * SETTINGS.JS - Gestion de l'interface de paramètres
 * Interface à 5 onglets pour la configuration de l'application
 */

(function() {
  'use strict';

  // ========================================
  // CONFIGURATION & CONSTANTES
  // ========================================

  var STORAGE_KEYS = {
    club: 'club_settings',
    sponsors: 'sponsors_list',
    pong: 'pong_settings',
    exports: 'export_settings',
    activeTheme: 'active_theme',
    customThemes: 'custom_themes',
    editorState: 'theme_editor_state',
    activeTab: 'settings_active_tab'
  };

  var DEFAULT_SETTINGS = {
    club: {
      fullName: 'Padel Parc',
      shortName: 'Padel Parc',
      slogan: '',
      signatureColor: '#004b9b',
      logoDataUrl: null,
      address: '',
      phone: '',
      email: '',
      website: '',
      instagram: '',
      facebook: '',
      twitter: '',
      timezone: 'Europe/Paris',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      language: 'fr'
    },
    sponsors: [],
    pong: {
      sponsorName: '',
      logoUrl: '',
      aiName: 'CPU',
      useThemeColors: true,
      ballColor: '#e5e339',
      playerPaddleColor: '#004b9b',
      aiPaddleColor: '#4d81b9',
      backgroundColor: '#020617',
      showLeaderboard: true,
      enableSounds: true,
      difficulty: 'medium',
      qrSize: 'medium',
      qrPosition: 'bottom-right'
    },
    exports: {
      template: 'moderne',
      leagueBackgroundUrl: null,
      backgroundOpacity: 0.3,
      darkFilter: true,
      enableBranding: true,
      brandingLogoUrl: null,
      footerText: 'Padel Parc',
      showQrCode: false,
      qrPosition: 'bottom-right',
      formats: {png: true, pdf: false, jpeg: false},
      quality: 150
    }
  };

  // ========================================
  // ÉTAT & RÉFÉRENCES DOM
  // ========================================

  var state = {
    activeTab: 'club',
    unsavedChanges: false,
    themesLibrary: null,
    currentSettings: {
      club: null,
      sponsors: null,
      pong: null,
      exports: null
    }
  };

  var refs = {
    tabs: {},
    panels: {},
    forms: {}
  };

  // ========================================
  // UTILITAIRES
  // ========================================

  function loadFromStorage(key, defaultValue) {
    try {
      var stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error('Erreur chargement storage:', e);
      return defaultValue;
    }
  }

  function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Erreur sauvegarde storage:', e);
      return false;
    }
  }

  function showNotification(message, type) {
    // TODO: Implémenter système de notification
    console.log('[' + type + '] ' + message);
  }

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // ========================================
  // NAVIGATION ENTRE ONGLETS
  // ========================================

  function initTabs() {
    var tabButtons = document.querySelectorAll('.settings-tab');
    var panels = document.querySelectorAll('.settings-panel');

    // Références
    tabButtons.forEach(function(btn) {
      var panelId = btn.getAttribute('data-panel');
      refs.tabs[panelId] = btn;
      refs.panels[panelId] = document.getElementById('panel-' + panelId);
    });

    // Event listeners
    tabButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var panelId = this.getAttribute('data-panel');
        switchTab(panelId);
      });
    });

    // Restaurer onglet actif ou utiliser hash URL
    var hash = window.location.hash.replace('#settings/', '');
    var savedTab = sessionStorage.getItem(STORAGE_KEYS.activeTab);
    var initialTab = hash || savedTab || 'club';

    switchTab(initialTab);

    // Gérer changements de hash
    window.addEventListener('hashchange', function() {
      var newHash = window.location.hash.replace('#settings/', '');
      if (newHash && refs.panels[newHash]) {
        switchTab(newHash);
      }
    });
  }

  function switchTab(tabId) {
    if (!refs.panels[tabId]) return;

    // Désactiver tous les onglets
    Object.keys(refs.tabs).forEach(function(key) {
      refs.tabs[key].classList.remove('active');
      refs.panels[key].classList.remove('active');
    });

    // Activer l'onglet sélectionné
    refs.tabs[tabId].classList.add('active');
    refs.panels[tabId].classList.add('active');

    // Sauvegarder état
    state.activeTab = tabId;
    sessionStorage.setItem(STORAGE_KEYS.activeTab, tabId);

    // Mettre à jour hash URL
    if (window.location.hash !== '#settings/' + tabId) {
      history.replaceState(null, null, '#settings/' + tabId);
    }
  }

  // ========================================
  // ONGLET CLUB
  // ========================================

  function initClubTab() {
    var panel = refs.panels.club;
    if (!panel) return;

    // Charger paramètres
    state.currentSettings.club = loadFromStorage(
      STORAGE_KEYS.club,
      DEFAULT_SETTINGS.club
    );

    // Références aux champs
    refs.forms.club = {
      fullName: panel.querySelector('#club-full-name'),
      shortName: panel.querySelector('#club-short-name'),
      slogan: panel.querySelector('#club-slogan'),
      signatureColor: panel.querySelector('#club-signature-color'),
      signatureColorValue: panel.querySelector('#club-signature-color-value'),
      logoUpload: panel.querySelector('#club-logo-upload'),
      logoPreview: panel.querySelector('#club-logo-preview'),
      address: panel.querySelector('#club-address'),
      phone: panel.querySelector('#club-phone'),
      email: panel.querySelector('#club-email'),
      website: panel.querySelector('#club-website'),
      instagram: panel.querySelector('#club-instagram'),
      facebook: panel.querySelector('#club-facebook'),
      twitter: panel.querySelector('#club-twitter'),
      timezone: panel.querySelector('#club-timezone'),
      currency: panel.querySelector('#club-currency'),
      dateFormat: panel.querySelector('#club-date-format'),
      language: panel.querySelector('#club-language'),
      saveBtn: panel.querySelector('#save-club-settings')
    };

    // Peupler les champs
    populateClubFields();

    // Color picker
    if (refs.forms.club.signatureColor) {
      refs.forms.club.signatureColor.addEventListener('input', function() {
        if (refs.forms.club.signatureColorValue) {
          refs.forms.club.signatureColorValue.textContent = this.value.toUpperCase();
        }
        markUnsaved();
      });
    }

    // Upload logo
    if (refs.forms.club.logoUpload) {
      refs.forms.club.logoUpload.addEventListener('change', function(e) {
        handleFileUpload(e, function(dataUrl) {
          state.currentSettings.club.logoDataUrl = dataUrl;
          if (refs.forms.club.logoPreview) {
            refs.forms.club.logoPreview.src = dataUrl;
            refs.forms.club.logoPreview.style.display = 'block';
          }
          markUnsaved();
        });
      });
    }

    // Sauvegarder
    if (refs.forms.club.saveBtn) {
      refs.forms.club.saveBtn.addEventListener('click', saveClubSettings);
    }

    // Auto-save sur changements
    Object.keys(refs.forms.club).forEach(function(key) {
      var field = refs.forms.club[key];
      if (field && field.tagName && (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA')) {
        field.addEventListener('input', debounce(markUnsaved, 300));
      }
    });
  }

  function populateClubFields() {
    var data = state.currentSettings.club;
    var form = refs.forms.club;

    if (form.fullName) form.fullName.value = data.fullName || '';
    if (form.shortName) form.shortName.value = data.shortName || '';
    if (form.slogan) form.slogan.value = data.slogan || '';
    if (form.signatureColor) {
      form.signatureColor.value = data.signatureColor || '#004b9b';
      if (form.signatureColorValue) {
        form.signatureColorValue.textContent = (data.signatureColor || '#004b9b').toUpperCase();
      }
    }
    if (form.address) form.address.value = data.address || '';
    if (form.phone) form.phone.value = data.phone || '';
    if (form.email) form.email.value = data.email || '';
    if (form.website) form.website.value = data.website || '';
    if (form.instagram) form.instagram.value = data.instagram || '';
    if (form.facebook) form.facebook.value = data.facebook || '';
    if (form.twitter) form.twitter.value = data.twitter || '';
    if (form.timezone) form.timezone.value = data.timezone || 'Europe/Paris';
    if (form.currency) form.currency.value = data.currency || 'EUR';
    if (form.dateFormat) form.dateFormat.value = data.dateFormat || 'DD/MM/YYYY';
    if (form.language) form.language.value = data.language || 'fr';

    if (data.logoDataUrl && form.logoPreview) {
      form.logoPreview.src = data.logoDataUrl;
      form.logoPreview.style.display = 'block';
    }
  }

  function saveClubSettings() {
    var form = refs.forms.club;

    state.currentSettings.club = {
      fullName: form.fullName ? form.fullName.value : '',
      shortName: form.shortName ? form.shortName.value : '',
      slogan: form.slogan ? form.slogan.value : '',
      signatureColor: form.signatureColor ? form.signatureColor.value : '#004b9b',
      logoDataUrl: state.currentSettings.club.logoDataUrl,
      address: form.address ? form.address.value : '',
      phone: form.phone ? form.phone.value : '',
      email: form.email ? form.email.value : '',
      website: form.website ? form.website.value : '',
      instagram: form.instagram ? form.instagram.value : '',
      facebook: form.facebook ? form.facebook.value : '',
      twitter: form.twitter ? form.twitter.value : '',
      timezone: form.timezone ? form.timezone.value : 'Europe/Paris',
      currency: form.currency ? form.currency.value : 'EUR',
      dateFormat: form.dateFormat ? form.dateFormat.value : 'DD/MM/YYYY',
      language: form.language ? form.language.value : 'fr'
    };

    if (saveToStorage(STORAGE_KEYS.club, state.currentSettings.club)) {
      showNotification('Paramètres du club sauvegardés', 'success');
      clearUnsaved();
    } else {
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  // ========================================
  // ONGLET SPONSORS
  // ========================================

  function initSponsorsTab() {
    var panel = refs.panels.sponsors;
    if (!panel) return;

    // Charger liste sponsors
    state.currentSettings.sponsors = loadFromStorage(
      STORAGE_KEYS.sponsors,
      DEFAULT_SETTINGS.sponsors
    );

    // TODO: Implémenter interface de gestion des sponsors
    // - Formulaire d'ajout
    // - Liste avec drag & drop
    // - Édition/suppression
    // - Zones d'affichage (toggles)
    // - Durée et priorité (sliders)

    renderSponsorsList();
  }

  function renderSponsorsList() {
    var container = document.getElementById('sponsors-list-container');
    if (!container) return;

    if (!state.currentSettings.sponsors || state.currentSettings.sponsors.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-text">Aucun sponsor configuré</div></div>';
      return;
    }

    // TODO: Générer HTML pour chaque sponsor
    container.innerHTML = '<p style="color: var(--muted);">Liste des sponsors à implémenter...</p>';
  }

  // ========================================
  // ONGLET PONG
  // ========================================

  function initPongTab() {
    var panel = refs.panels.pong;
    if (!panel) return;

    // Charger paramètres
    state.currentSettings.pong = loadFromStorage(
      STORAGE_KEYS.pong,
      DEFAULT_SETTINGS.pong
    );

    // TODO: Implémenter interface Pong
    // - Champs sponsor et IA
    // - Toggle couleurs thème
    // - Color pickers pour couleurs personnalisées
    // - Toggles leaderboard et sons
    // - Sélecteur difficulté
    // - QR code taille et position
  }

  // ========================================
  // ONGLET EXPORTS
  // ========================================

  function initExportsTab() {
    var panel = refs.panels.exports;
    if (!panel) return;

    // Charger paramètres
    state.currentSettings.exports = loadFromStorage(
      STORAGE_KEYS.exports,
      DEFAULT_SETTINGS.exports
    );

    // TODO: Implémenter interface Exports
    // - Sélection template avec preview
    // - Upload background de ligue
    // - Slider opacité
    // - Toggle dark filter
    // - Section branding
    // - Formats et qualité
  }

  // ========================================
  // ONGLET THÈME
  // ========================================

  function initThemeTab() {
    var panel = refs.panels.theme;
    if (!panel) return;

    // Charger bibliothèque de thèmes
    loadThemesLibrary();

    // TODO: Implémenter interface Thème
    // - Affichage grille de thèmes
    // - Éditeur personnalisé avec sections collapsibles
    // - Preview en temps réel
    // - Gestion thèmes sauvegardés
    // - Import/Export
  }

  function loadThemesLibrary() {
    fetch('themes-library.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Erreur chargement thèmes');
        return response.json();
      })
      .then(function(data) {
        state.themesLibrary = data.themes || [];
        renderThemesLibrary();
      })
      .catch(function(error) {
        console.error('Erreur chargement bibliothèque thèmes:', error);
        showNotification('Erreur chargement des thèmes', 'error');
      });
  }

  function renderThemesLibrary() {
    var container = document.getElementById('themes-library-grid');
    if (!container || !state.themesLibrary) return;

    var html = '';
    state.themesLibrary.forEach(function(theme) {
      html += '<div class="theme-card" data-theme-id="' + theme.id + '">';
      html += '  <div class="theme-card-header">';
      html += '    <span class="theme-card-icon">' + theme.icon + '</span>';
      html += '    <span class="theme-card-name">' + theme.name + '</span>';
      html += '  </div>';
      html += '  <div class="theme-palette">';
      theme.palette.forEach(function(color) {
        html += '<div class="theme-color-swatch" style="background-color: ' + color + '"></div>';
      });
      html += '  </div>';
      html += '  <button class="theme-apply-btn" data-theme-id="' + theme.id + '">Appliquer</button>';
      html += '</div>';
    });

    container.innerHTML = html;

    // Event listeners pour boutons Apply
    container.querySelectorAll('.theme-apply-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var themeId = this.getAttribute('data-theme-id');
        applyTheme(themeId);
      });
    });
  }

  function applyTheme(themeId) {
    var theme = state.themesLibrary.find(function(t) { return t.id === themeId; });
    if (!theme) return;

    // TODO: Appliquer le thème à l'application
    // - Mettre à jour les CSS variables
    // - Sauvegarder dans localStorage
    // - Confirmation utilisateur

    if (confirm('Appliquer le thème "' + theme.name + '" ?')) {
      saveToStorage(STORAGE_KEYS.activeTheme, theme);
      showNotification('Thème "' + theme.name + '" appliqué', 'success');
      // Recharger ou appliquer les couleurs dynamiquement
    }
  }

  // ========================================
  // GESTION FICHIERS
  // ========================================

  function handleFileUpload(event, callback) {
    var file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Le fichier doit être une image', 'error');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      if (callback) callback(e.target.result);
    };
    reader.onerror = function() {
      showNotification('Erreur lecture du fichier', 'error');
    };
    reader.readAsDataURL(file);
  }

  // ========================================
  // GESTION MODIFICATIONS NON SAUVEGARDÉES
  // ========================================

  function markUnsaved() {
    state.unsavedChanges = true;
    // TODO: Afficher indicateur visuel
  }

  function clearUnsaved() {
    state.unsavedChanges = false;
    // TODO: Masquer indicateur visuel
  }

  // ========================================
  // INITIALISATION
  // ========================================

  function init() {
    // Vérifier que nous sommes sur la page settings
    var settingsRoot = document.getElementById('settings-root');
    if (!settingsRoot) return;

    console.log('[Settings] Initialisation...');

    // Initialiser navigation
    initTabs();

    // Initialiser chaque onglet
    initClubTab();
    initSponsorsTab();
    initPongTab();
    initExportsTab();
    initThemeTab();

    // Warning avant quitter si modifications non sauvegardées
    window.addEventListener('beforeunload', function(e) {
      if (state.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées';
        return e.returnValue;
      }
    });

    console.log('[Settings] Initialisé avec succès');
  }

  // Lancer l'initialisation quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
