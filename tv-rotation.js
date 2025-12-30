/**
 * TV Rotation Manager
 * Gère la rotation automatique des blocs d'affichage TV
 *
 * @author Claude
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  /**
   * Constructeur TVRotationManager
   * @param {Object} config - Configuration de rotation
   * @param {HTMLElement} container - Conteneur principal des blocs
   */
  function TVRotationManager(config, container) {
    this.config = config || {};
    this.container = container;
    this.currentIndex = 0;
    this.blocks = [];
    this.timer = null;
    this.isPaused = false;
    this.isRunning = false;
    this.transitionInProgress = false;

    // Déterminer combien de blocs afficher simultanément selon le layout
    this.blocksPerView = this.getBlocksPerView();

    // Éléments UI
    this.indicator = null;
    this.indicatorDots = [];

    // Liaison des méthodes
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
  }

  /**
   * Détermine combien de blocs afficher simultanément selon le layout
   * @returns {number} Nombre de blocs par vue
   */
  TVRotationManager.prototype.getBlocksPerView = function() {
    var layoutType = this.config.layout ? this.config.layout.type : 'fullscreen';

    switch (layoutType) {
      case 'split-vertical':
      case 'split-horizontal':
      case 'pip':
        return 2;
      case 'grid-2x2':
        return 4;
      case 'fullscreen':
      default:
        return 1;
    }
  };

  /**
   * Initialise le système de rotation
   */
  TVRotationManager.prototype.init = function() {
    console.log('[TVRotationManager] Initialisation...');

    if (!this.container) {
      console.error('[TVRotationManager] Aucun conteneur fourni');
      return false;
    }

    // Construire liste des blocs actifs selon config
    this.blocks = this.buildBlocksList();

    if (this.blocks.length === 0) {
      console.warn('[TVRotationManager] Aucun bloc activé');
      return false;
    }

    // Créer l'indicateur visuel si activé
    if (this.config.rotation && this.config.rotation.showIndicator) {
      this.createIndicator();
    }

    // Ajouter pause on hover si activé
    if (this.config.rotation && this.config.rotation.pauseOnHover) {
      this.container.addEventListener('mouseenter', this.handleMouseEnter);
      this.container.addEventListener('mouseleave', this.handleMouseLeave);
    }

    console.log('[TVRotationManager] Initialisé avec ' + this.blocks.length + ' blocs');
    return true;
  };

  /**
   * Construit la liste des blocs actifs selon la config
   * @returns {Array} Liste des blocs à afficher
   */
  TVRotationManager.prototype.buildBlocksList = function() {
    var blocks = [];

    if (!this.config.blocks || !this.config.rotation) {
      return blocks;
    }

    var order = this.config.rotation.order || [];
    var blockConfig = this.config.blocks;

    // Construire liste selon l'ordre défini
    for (var i = 0; i < order.length; i++) {
      var blockId = order[i];
      var block = blockConfig[blockId];

      if (block && block.enabled) {
        blocks.push({
          id: blockId,
          duration: block.duration || 10,
          name: this.getBlockName(blockId)
        });
      }
    }

    return blocks;
  };

  /**
   * Retourne le nom affiché d'un bloc
   * @param {string} blockId - ID du bloc
   * @returns {string} Nom du bloc
   */
  TVRotationManager.prototype.getBlockName = function(blockId) {
    var names = {
      'current_matches': 'Matchs en cours',
      'ranking': 'Classement',
      'next_matches': 'Prochains matchs',
      'podium': 'Podium',
      'resting_teams': 'Équipes au repos',
      'stats': 'Statistiques'
    };
    return names[blockId] || blockId;
  };

  /**
   * Démarre la rotation automatique
   */
  TVRotationManager.prototype.start = function() {
    if (this.isRunning) {
      console.warn('[TVRotationManager] Rotation déjà démarrée');
      return;
    }

    if (this.blocks.length === 0) {
      console.warn('[TVRotationManager] Aucun bloc à afficher');
      return;
    }

    console.log('[TVRotationManager] Démarrage de la rotation');
    this.isRunning = true;
    this.isPaused = false;

    // Afficher le premier bloc
    this.showBlock(0);
  };

  /**
   * Affiche un bloc spécifique
   * @param {number} index - Index du bloc à afficher
   */
  TVRotationManager.prototype.showBlock = function(index) {
    if (index < 0 || index >= this.blocks.length) {
      console.error('[TVRotationManager] Index invalide: ' + index);
      return;
    }

    if (this.transitionInProgress) {
      console.log('[TVRotationManager] Transition en cours, ignorer');
      return;
    }

    this.currentIndex = index;

    // Déterminer quels blocs afficher selon le layout
    var blocksToShow = [];
    for (var i = 0; i < this.blocksPerView && (index + i) < this.blocks.length; i++) {
      blocksToShow.push(this.blocks[index + i]);
    }

    console.log('[TVRotationManager] Affichage de ' + blocksToShow.length + ' bloc(s) à partir de l\'index ' + index);

    // Cacher tous les blocs
    this.hideAllBlocks();

    // Afficher les blocs cibles avec transition
    for (var j = 0; j < blocksToShow.length; j++) {
      this.applyTransition(blocksToShow[j]);
    }

    // Mettre à jour l'indicateur
    this.updateIndicator(index);

    // Programmer le prochain groupe de blocs (utiliser la durée du premier bloc)
    this.scheduleNext(blocksToShow[0].duration);
  };

  /**
   * Cache tous les blocs
   */
  TVRotationManager.prototype.hideAllBlocks = function() {
    var allBlocks = this.container.querySelectorAll('[data-tv-block]');

    for (var i = 0; i < allBlocks.length; i++) {
      allBlocks[i].style.display = 'none';
      allBlocks[i].classList.remove('tv-block-active');
    }
  };

  /**
   * Applique la transition pour afficher un bloc
   * @param {Object} block - Bloc à afficher
   */
  TVRotationManager.prototype.applyTransition = function(block) {
    var blockElement = this.container.querySelector('[data-tv-block="' + block.id + '"]');

    if (!blockElement) {
      console.warn('[TVRotationManager] Élément non trouvé pour: ' + block.id);
      return;
    }

    var transition = this.config.rotation.transition || { type: 'fade', duration: 0.5 };
    var duration = transition.duration || 0.5;
    var layoutType = this.config.layout ? this.config.layout.type : 'fullscreen';

    this.transitionInProgress = true;

    // Préparer l'élément
    blockElement.style.display = 'block';
    blockElement.style.opacity = '0';

    // En mode fullscreen, ne PAS appliquer de translateX (garde le bloc centré)
    if (transition.type === 'slide' && layoutType !== 'fullscreen') {
      blockElement.style.transform = 'translateX(100%)';
    } else {
      blockElement.style.transform = 'none';
    }

    // Forcer reflow
    void blockElement.offsetWidth;

    // Appliquer transition
    blockElement.style.transition = 'all ' + duration + 's ease-in-out';
    blockElement.style.opacity = '1';

    if (transition.type === 'slide' && layoutType !== 'fullscreen') {
      blockElement.style.transform = 'translateX(0)';
    }

    blockElement.classList.add('tv-block-active');

    // Marquer transition terminée
    var self = this;
    setTimeout(function() {
      self.transitionInProgress = false;
    }, duration * 1000);
  };

  /**
   * Programme l'affichage du bloc suivant
   * @param {number} duration - Durée en secondes
   */
  TVRotationManager.prototype.scheduleNext = function(duration) {
    // Annuler timer précédent
    if (this.timer) {
      clearTimeout(this.timer);
    }

    var self = this;
    this.timer = setTimeout(function() {
      if (!self.isPaused && self.isRunning) {
        self.showNext();
      }
    }, duration * 1000);
  };

  /**
   * Affiche le bloc suivant (ou groupe de blocs selon le layout)
   */
  TVRotationManager.prototype.showNext = function() {
    var nextIndex = (this.currentIndex + this.blocksPerView) % this.blocks.length;
    this.showBlock(nextIndex);
  };

  /**
   * Affiche le bloc précédent (ou groupe de blocs selon le layout)
   */
  TVRotationManager.prototype.showPrevious = function() {
    var prevIndex = (this.currentIndex - this.blocksPerView + this.blocks.length) % this.blocks.length;
    this.showBlock(prevIndex);
  };

  /**
   * Met en pause la rotation
   */
  TVRotationManager.prototype.pause = function() {
    if (!this.isRunning) return;

    console.log('[TVRotationManager] Pause');
    this.isPaused = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  /**
   * Reprend la rotation
   */
  TVRotationManager.prototype.resume = function() {
    if (!this.isRunning || !this.isPaused) return;

    console.log('[TVRotationManager] Reprise');
    this.isPaused = false;

    // Reprendre avec le bloc actuel
    var block = this.blocks[this.currentIndex];
    this.scheduleNext(block.duration);
  };

  /**
   * Arrête complètement la rotation
   */
  TVRotationManager.prototype.stop = function() {
    console.log('[TVRotationManager] Arrêt');
    this.isRunning = false;
    this.isPaused = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  /**
   * Crée l'indicateur visuel de progression
   */
  TVRotationManager.prototype.createIndicator = function() {
    // Vérifier si déjà créé
    if (this.indicator) return;

    // Créer conteneur indicateur
    this.indicator = document.createElement('div');
    this.indicator.className = 'tv-rotation-indicator';
    this.indicator.style.cssText =
      'position: fixed;' +
      'bottom: 20px;' +
      'left: 50%;' +
      'transform: translateX(-50%);' +
      'display: flex;' +
      'gap: 8px;' +
      'padding: 10px 16px;' +
      'background: rgba(15, 23, 42, 0.8);' +
      'backdrop-filter: blur(10px);' +
      'border-radius: 20px;' +
      'z-index: 9999;' +
      'transition: opacity 0.3s ease;';

    // Créer dots pour chaque bloc
    this.indicatorDots = [];
    for (var i = 0; i < this.blocks.length; i++) {
      var dot = document.createElement('div');
      dot.className = 'tv-indicator-dot';
      dot.style.cssText =
        'width: 8px;' +
        'height: 8px;' +
        'border-radius: 50%;' +
        'background: rgba(255, 255, 255, 0.3);' +
        'transition: all 0.3s ease;' +
        'cursor: pointer;';

      // Ajouter événement clic
      (function(index, self) {
        dot.addEventListener('click', function() {
          self.showBlock(index);
        });
      })(i, this);

      this.indicator.appendChild(dot);
      this.indicatorDots.push(dot);
    }

    this.container.appendChild(this.indicator);
  };

  /**
   * Met à jour l'indicateur visuel
   * @param {number} activeIndex - Index du bloc actif
   */
  TVRotationManager.prototype.updateIndicator = function(activeIndex) {
    if (!this.indicator || this.indicatorDots.length === 0) return;

    for (var i = 0; i < this.indicatorDots.length; i++) {
      var dot = this.indicatorDots[i];

      if (i === activeIndex) {
        dot.style.background = 'rgba(var(--brand-accent-rgb), 1)';
        dot.style.width = '24px';
        dot.style.borderRadius = '4px';
      } else {
        dot.style.background = 'rgba(255, 255, 255, 0.3)';
        dot.style.width = '8px';
        dot.style.borderRadius = '50%';
      }
    }
  };

  /**
   * Gère l'événement mouseenter (pause on hover)
   */
  TVRotationManager.prototype.handleMouseEnter = function() {
    if (this.config.rotation && this.config.rotation.pauseOnHover) {
      this.pause();
    }
  };

  /**
   * Gère l'événement mouseleave (reprise)
   */
  TVRotationManager.prototype.handleMouseLeave = function() {
    if (this.config.rotation && this.config.rotation.pauseOnHover) {
      this.resume();
    }
  };

  /**
   * Détruit le manager et nettoie les ressources
   */
  TVRotationManager.prototype.destroy = function() {
    console.log('[TVRotationManager] Destruction');

    this.stop();

    // Retirer événements
    if (this.container) {
      this.container.removeEventListener('mouseenter', this.handleMouseEnter);
      this.container.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    // Retirer indicateur
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }

    // Reset
    this.blocks = [];
    this.indicatorDots = [];
    this.indicator = null;
  };

  /**
   * Met à jour la configuration
   * @param {Object} newConfig - Nouvelle configuration
   */
  TVRotationManager.prototype.updateConfig = function(newConfig) {
    console.log('[TVRotationManager] Mise à jour configuration');

    var wasRunning = this.isRunning;

    // Arrêter rotation
    this.stop();
    this.destroy();

    // Appliquer nouvelle config
    this.config = newConfig;

    // Réinitialiser
    this.init();

    // Redémarrer si nécessaire
    if (wasRunning) {
      this.start();
    }
  };

  /**
   * Obtient les infos du bloc courant
   * @returns {Object} Infos du bloc actif
   */
  TVRotationManager.prototype.getCurrentBlock = function() {
    if (this.currentIndex >= 0 && this.currentIndex < this.blocks.length) {
      return this.blocks[this.currentIndex];
    }
    return null;
  };

  /**
   * Obtient la liste de tous les blocs
   * @returns {Array} Liste des blocs
   */
  TVRotationManager.prototype.getBlocks = function() {
    return this.blocks;
  };

  // Export vers window
  window.TVRotationManager = TVRotationManager;

})(window);
