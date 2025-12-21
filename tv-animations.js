/**
 * TV Animations System
 * Gère les animations de victoire et effets visuels pour les vues TV
 *
 * @author Claude
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  /**
   * Constructeur TVAnimations
   * @param {Object} config - Configuration des animations
   */
  function TVAnimations(config) {
    this.config = config || {};
    this.confettiCanvas = null;
    this.confettiContext = null;
    this.confettiParticles = [];
    this.confettiAnimationId = null;

    // Audio context pour sons (si enabled)
    this.audioContext = null;
  }

  /**
   * Initialise le système d'animations
   */
  TVAnimations.prototype.init = function() {
    console.log('[TVAnimations] Initialisation...');

    if (!this.config.enabled) {
      console.log('[TVAnimations] Animations désactivées');
      return;
    }

    // Créer canvas pour confettis si activé
    if (this.config.confetti && this.config.confetti.enabled) {
      this.createConfettiCanvas();
    }

    // Initialiser audio context si sons activés
    if (this.config.sound && this.config.sound.enabled) {
      this.initAudio();
    }

    console.log('[TVAnimations] Initialisé');
  };

  /**
   * Crée le canvas pour les confettis
   */
  TVAnimations.prototype.createConfettiCanvas = function() {
    if (this.confettiCanvas) return;

    this.confettiCanvas = document.createElement('canvas');
    this.confettiCanvas.id = 'tv-confetti-canvas';
    this.confettiCanvas.style.cssText =
      'position: fixed;' +
      'top: 0;' +
      'left: 0;' +
      'width: 100vw;' +
      'height: 100vh;' +
      'pointer-events: none;' +
      'z-index: 99999;';

    document.body.appendChild(this.confettiCanvas);

    this.confettiCanvas.width = window.innerWidth;
    this.confettiCanvas.height = window.innerHeight;
    this.confettiContext = this.confettiCanvas.getContext('2d');

    // Redimensionner canvas si fenêtre change
    var self = this;
    window.addEventListener('resize', function() {
      if (self.confettiCanvas) {
        self.confettiCanvas.width = window.innerWidth;
        self.confettiCanvas.height = window.innerHeight;
      }
    });
  };

  /**
   * Initialise le contexte audio
   */
  TVAnimations.prototype.initAudio = function() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      console.log('[TVAnimations] Audio context créé');
    } catch (e) {
      console.warn('[TVAnimations] Audio non supporté:', e);
      this.audioContext = null;
    }
  };

  /**
   * Déclenche la célébration de victoire complète
   * @param {Object} winner - Infos sur le gagnant { team, players, score }
   * @param {HTMLElement} targetElement - Élément cible pour les animations
   */
  TVAnimations.prototype.celebrate = function(winner, targetElement) {
    if (!this.config.enabled) return;

    console.log('[TVAnimations] Célébration victoire:', winner);

    // Flash
    if (this.config.flash && this.config.flash.enabled) {
      this.triggerFlash(targetElement);
    }

    // Confetti
    if (this.config.confetti && this.config.confetti.enabled) {
      this.launchConfetti();
    }

    // Badge victoire
    if (this.config.badge && this.config.badge.enabled) {
      this.showVictoryBadge(winner, targetElement);
    }

    // Scale animation
    if (this.config.scale && this.config.scale.enabled) {
      this.applyScaleAnimation(targetElement);
    }

    // Son
    if (this.config.sound && this.config.sound.enabled) {
      this.playVictorySound();
    }
  };

  /**
   * Déclenche un flash lumineux
   * @param {HTMLElement} element - Élément cible
   */
  TVAnimations.prototype.triggerFlash = function(element) {
    var duration = (this.config.flash && this.config.flash.duration) || 0.5;

    // Créer overlay flash
    var flash = document.createElement('div');
    flash.style.cssText =
      'position: absolute;' +
      'top: 0;' +
      'left: 0;' +
      'width: 100%;' +
      'height: 100%;' +
      'background: rgba(var(--brand-accent-rgb), 0.3);' +
      'pointer-events: none;' +
      'z-index: 9998;' +
      'animation: tv-flash ' + duration + 's ease-out;';

    // Ajouter style d'animation si pas déjà présent
    if (!document.getElementById('tv-flash-style')) {
      var style = document.createElement('style');
      style.id = 'tv-flash-style';
      style.textContent =
        '@keyframes tv-flash {' +
        '  0% { opacity: 1; }' +
        '  100% { opacity: 0; }' +
        '}';
      document.head.appendChild(style);
    }

    element.appendChild(flash);

    setTimeout(function() {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, duration * 1000);
  };

  /**
   * Lance les confettis
   */
  TVAnimations.prototype.launchConfetti = function() {
    if (!this.confettiCanvas || !this.confettiContext) return;

    var intensity = (this.config.confetti && this.config.confetti.intensity) || 3;
    var colorScheme = (this.config.confetti && this.config.confetti.colors) || 'theme';

    // Créer particules
    var particleCount = intensity * 50; // 50 particules par niveau d'intensité
    var colors = this.getConfettiColors(colorScheme);

    for (var i = 0; i < particleCount; i++) {
      this.confettiParticles.push({
        x: Math.random() * this.confettiCanvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        gravity: 0.15,
        drag: 0.98
      });
    }

    // Démarrer animation si pas déjà en cours
    if (!this.confettiAnimationId) {
      this.animateConfetti();
    }
  };

  /**
   * Retourne les couleurs des confettis selon le schéma
   * @param {string} scheme - 'theme' ou 'multicolor'
   * @returns {Array} Liste de couleurs
   */
  TVAnimations.prototype.getConfettiColors = function(scheme) {
    if (scheme === 'multicolor') {
      return [
        '#FF6B6B', // Rouge
        '#4ECDC4', // Turquoise
        '#FFE66D', // Jaune
        '#95E1D3', // Vert menthe
        '#F38181', // Rose
        '#AA96DA', // Violet
        '#FCBAD3', // Rose clair
        '#A8E6CF'  // Vert pastel
      ];
    }

    // Schéma thème par défaut
    var accentRGB = getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-accent-rgb')
      .trim()
      .split(',')
      .map(function(v) { return parseInt(v.trim(), 10); });

    return [
      'rgb(' + accentRGB.join(',') + ')',
      'rgba(' + accentRGB.join(',') + ', 0.7)',
      'rgba(' + accentRGB.join(',') + ', 0.5)',
      '#ffffff',
      'rgba(255, 255, 255, 0.7)'
    ];
  };

  /**
   * Anime les confettis
   */
  TVAnimations.prototype.animateConfetti = function() {
    var self = this;

    function render() {
      if (!self.confettiContext || !self.confettiCanvas) return;

      // Clear canvas
      self.confettiContext.clearRect(0, 0, self.confettiCanvas.width, self.confettiCanvas.height);

      // Mettre à jour et dessiner particules
      for (var i = self.confettiParticles.length - 1; i >= 0; i--) {
        var p = self.confettiParticles[i];

        // Physique
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Retirer si hors écran
        if (p.y > self.confettiCanvas.height + 20) {
          self.confettiParticles.splice(i, 1);
          continue;
        }

        // Dessiner confetti
        self.confettiContext.save();
        self.confettiContext.translate(p.x, p.y);
        self.confettiContext.rotate(p.rotation * Math.PI / 180);
        self.confettiContext.fillStyle = p.color;
        self.confettiContext.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        self.confettiContext.restore();
      }

      // Continuer animation si particules restantes
      if (self.confettiParticles.length > 0) {
        self.confettiAnimationId = requestAnimationFrame(render);
      } else {
        self.confettiAnimationId = null;
      }
    }

    render();
  };

  /**
   * Affiche le badge de victoire
   * @param {Object} winner - Infos gagnant
   * @param {HTMLElement} element - Élément cible
   */
  TVAnimations.prototype.showVictoryBadge = function(winner, element) {
    var duration = (this.config.badge && this.config.badge.duration) || 5;

    // Créer badge
    var badge = document.createElement('div');
    badge.className = 'tv-victory-badge';
    badge.innerHTML =
      '<div class="tv-victory-icon">🏆</div>' +
      '<div class="tv-victory-text">' +
      '<div class="tv-victory-title">VICTOIRE !</div>' +
      '<div class="tv-victory-team">' + (winner.team || 'Équipe') + '</div>' +
      '</div>';

    badge.style.cssText =
      'position: absolute;' +
      'top: 50%;' +
      'left: 50%;' +
      'transform: translate(-50%, -50%) scale(0);' +
      'background: linear-gradient(135deg, rgba(var(--brand-accent-rgb), 0.95), rgba(var(--brand-title-rgb), 0.95));' +
      'padding: 24px 40px;' +
      'border-radius: 20px;' +
      'display: flex;' +
      'align-items: center;' +
      'gap: 20px;' +
      'z-index: 9999;' +
      'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);' +
      'animation: tv-badge-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;';

    // Styles pour le contenu
    var iconStyle = document.createElement('style');
    iconStyle.textContent =
      '.tv-victory-icon {' +
      '  font-size: 48px;' +
      '  line-height: 1;' +
      '}' +
      '.tv-victory-text {' +
      '  color: #0f172a;' +
      '}' +
      '.tv-victory-title {' +
      '  font-size: 32px;' +
      '  font-weight: 900;' +
      '  letter-spacing: 2px;' +
      '}' +
      '.tv-victory-team {' +
      '  font-size: 20px;' +
      '  font-weight: 600;' +
      '  margin-top: 4px;' +
      '}' +
      '@keyframes tv-badge-pop {' +
      '  0% { transform: translate(-50%, -50%) scale(0); }' +
      '  70% { transform: translate(-50%, -50%) scale(1.1); }' +
      '  100% { transform: translate(-50%, -50%) scale(1); }' +
      '}' +
      '@keyframes tv-badge-fade-out {' +
      '  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }' +
      '  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }' +
      '}';

    if (!document.getElementById('tv-badge-style')) {
      iconStyle.id = 'tv-badge-style';
      document.head.appendChild(iconStyle);
    }

    element.appendChild(badge);

    // Retirer après durée
    setTimeout(function() {
      badge.style.animation = 'tv-badge-fade-out 0.5s ease-out forwards';
      setTimeout(function() {
        if (badge.parentNode) {
          badge.parentNode.removeChild(badge);
        }
      }, 500);
    }, duration * 1000);
  };

  /**
   * Applique animation de scale sur élément
   * @param {HTMLElement} element - Élément cible
   */
  TVAnimations.prototype.applyScaleAnimation = function(element) {
    var factor = (this.config.scale && this.config.scale.factor) || 1.05;

    var originalTransform = element.style.transform;

    element.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    element.style.transform = 'scale(' + factor + ')';

    setTimeout(function() {
      element.style.transform = originalTransform || 'scale(1)';
    }, 300);
  };

  /**
   * Joue le son de victoire
   */
  TVAnimations.prototype.playVictorySound = function() {
    if (!this.audioContext) return;

    var type = (this.config.sound && this.config.sound.type) || 'ding';
    var volume = ((this.config.sound && this.config.sound.volume) || 50) / 100;

    try {
      var oscillator = this.audioContext.createOscillator();
      var gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      gainNode.gain.value = volume;

      if (type === 'fanfare') {
        // Séquence de notes joyeuses
        var notes = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do aigu
        var time = this.audioContext.currentTime;

        for (var i = 0; i < notes.length; i++) {
          var osc = this.audioContext.createOscillator();
          var gain = this.audioContext.createGain();

          osc.connect(gain);
          gain.connect(this.audioContext.destination);

          osc.frequency.value = notes[i];
          osc.type = 'sine';
          gain.gain.value = volume * 0.3;

          osc.start(time + i * 0.15);
          osc.stop(time + i * 0.15 + 0.2);
        }
      } else {
        // Simple ding
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('[TVAnimations] Erreur lecture son:', e);
    }
  };

  /**
   * Animation simple de highlight (utilisé pour score, nouveau match, etc.)
   * @param {HTMLElement} element - Élément à highlighter
   * @param {string} color - Couleur (optionnel, par défaut accent)
   */
  TVAnimations.prototype.highlight = function(element, color) {
    if (!this.config.enabled) return;

    var bgColor = color || 'rgba(var(--brand-accent-rgb), 0.2)';

    var originalBg = element.style.backgroundColor;

    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = bgColor;

    setTimeout(function() {
      element.style.backgroundColor = originalBg;
    }, 600);
  };

  /**
   * Animation pulse (pour éléments importants)
   * @param {HTMLElement} element - Élément à animer
   * @param {number} duration - Durée en secondes
   */
  TVAnimations.prototype.pulse = function(element, duration) {
    if (!this.config.enabled) return;

    duration = duration || 2;

    if (!document.getElementById('tv-pulse-style')) {
      var style = document.createElement('style');
      style.id = 'tv-pulse-style';
      style.textContent =
        '@keyframes tv-pulse {' +
        '  0%, 100% { transform: scale(1); opacity: 1; }' +
        '  50% { transform: scale(1.03); opacity: 0.9; }' +
        '}';
      document.head.appendChild(style);
    }

    element.style.animation = 'tv-pulse ' + duration + 's ease-in-out';

    setTimeout(function() {
      element.style.animation = '';
    }, duration * 1000);
  };

  /**
   * Nettoie toutes les animations en cours
   */
  TVAnimations.prototype.cleanup = function() {
    console.log('[TVAnimations] Nettoyage...');

    // Arrêter confettis
    if (this.confettiAnimationId) {
      cancelAnimationFrame(this.confettiAnimationId);
      this.confettiAnimationId = null;
    }

    this.confettiParticles = [];

    // Clear canvas
    if (this.confettiContext && this.confettiCanvas) {
      this.confettiContext.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }

    // Fermer audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  };

  /**
   * Détruit complètement le système d'animations
   */
  TVAnimations.prototype.destroy = function() {
    console.log('[TVAnimations] Destruction');

    this.cleanup();

    // Retirer canvas
    if (this.confettiCanvas && this.confettiCanvas.parentNode) {
      this.confettiCanvas.parentNode.removeChild(this.confettiCanvas);
    }

    this.confettiCanvas = null;
    this.confettiContext = null;
  };

  // Export vers window
  window.TVAnimations = TVAnimations;

})(window);
