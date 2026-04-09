/**
 * ENHANCEMENTS.JS — Non-destructive enhancement layer
 * Works alongside existing main.js — DO NOT modify original functions
 * Uses IIFE to avoid global scope pollution and conflicts
 */
(function () {
  'use strict';

  // ── Feature Flags (Optional toggles for new features) ──
  const FEATURE_FLAGS = {
    animations: true,
    notifications: true,
    testimonialSlider: true,
    affiliateTracking: true,
    appBanner: true,
    howItWorks: true,
  };

  // Read from localStorage for persistence
  function getFeatureFlag(flag) {
    const stored = localStorage.getItem('feature_' + flag);
    if (stored !== null) return stored === 'true';
    return FEATURE_FLAGS[flag] !== undefined ? FEATURE_FLAGS[flag] : true;
  }

  // ── AOS-like Scroll Animation Observer ──
  function initScrollAnimations() {
    if (!getFeatureFlag('animations')) return;

    const animatedElements = document.querySelectorAll('[data-aos]');
    if (!animatedElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-aos-delay') || 0;
            setTimeout(() => {
              entry.target.classList.add('aos-animate');
            }, parseInt(delay));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    animatedElements.forEach((el) => observer.observe(el));
  }

  // ── Section Visibility Observer ──
  function initSectionAnimations() {
    if (!getFeatureFlag('animations')) return;

    const sections = document.querySelectorAll('.section-animated');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  // ── Testimonials Slider ──
  function initTestimonialSlider() {
    if (!getFeatureFlag('testimonialSlider')) return;

    const track = document.querySelector('.testimonials-track');
    if (!track) return;

    const slides = track.querySelectorAll('.testimonial-slide');
    if (slides.length <= 1) return;

    let currentIndex = 0;
    const totalSlides = slides.length;

    function goToSlide(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentIndex = index;
      track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      updateDots();
    }

    function updateDots() {
      const dots = document.querySelectorAll('.testimonials-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    // Navigation buttons
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    // Dot navigation
    const dots = document.querySelectorAll('.testimonials-dot');
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => goToSlide(i));
    });

    // Auto-play
    let autoPlay = setInterval(() => goToSlide(currentIndex + 1), 5000);

    const sliderContainer = document.querySelector('.testimonials-slider');
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', () => clearInterval(autoPlay));
      sliderContainer.addEventListener('mouseleave', () => {
        autoPlay = setInterval(() => goToSlide(currentIndex + 1), 5000);
      });
    }

    // Touch support
    let touchStartX = 0;
    if (track) {
      track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        clearInterval(autoPlay);
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 60) {
          goToSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
        }
        autoPlay = setInterval(() => goToSlide(currentIndex + 1), 5000);
      }, { passive: true });
    }

    updateDots();
  }

  // ── Notification System ──
  const NotificationSystem = {
    notifications: [],
    isOpen: false,

    init: function () {
      if (!getFeatureFlag('notifications')) return;

      // Load mock notifications (replace with API call in production)
      this.notifications = this.getStoredNotifications();
      if (!this.notifications.length) {
        this.notifications = this.getDefaultNotifications();
        this.saveNotifications();
      }

      this.bindEvents();
      this.updateBadge();
    },

    getDefaultNotifications: function () {
      return [
        {
          id: 1,
          type: 'earning',
          icon: 'fas fa-rupee-sign',
          message: 'You earned ₹150 from a referral purchase!',
          time: '2 hours ago',
          read: false,
        },
        {
          id: 2,
          type: 'success',
          icon: 'fas fa-user-plus',
          message: 'New user signed up using your referral link.',
          time: '5 hours ago',
          read: false,
        },
        {
          id: 3,
          type: 'info',
          icon: 'fas fa-bell',
          message: 'Your affiliate dashboard has been updated with new features.',
          time: '1 day ago',
          read: true,
        },
        {
          id: 4,
          type: 'warning',
          icon: 'fas fa-exclamation-triangle',
          message: 'Complete your profile to unlock all affiliate features.',
          time: '2 days ago',
          read: true,
        },
      ];
    },

    getStoredNotifications: function () {
      try {
        return JSON.parse(localStorage.getItem('em_notifications')) || [];
      } catch (e) {
        return [];
      }
    },

    saveNotifications: function () {
      localStorage.setItem('em_notifications', JSON.stringify(this.notifications));
    },

    getUnreadCount: function () {
      return this.notifications.filter(function (n) { return !n.read; }).length;
    },

    updateBadge: function () {
      var badges = document.querySelectorAll('.notification-badge');
      var count = this.getUnreadCount();
      badges.forEach(function (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
    },

    toggle: function () {
      var panel = document.querySelector('.notification-panel');
      if (panel) {
        this.isOpen = !this.isOpen;
        panel.classList.toggle('active', this.isOpen);
      }
    },

    markAllRead: function () {
      this.notifications.forEach(function (n) { n.read = true; });
      this.saveNotifications();
      this.updateBadge();
      this.render();
    },

    render: function () {
      var list = document.querySelector('.notification-list');
      if (!list) return;

      if (!this.notifications.length) {
        list.innerHTML =
          '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
        return;
      }

      var html = '';
      this.notifications.forEach(function (n) {
        html += '<div class="notification-item ' + (n.read ? '' : 'unread') + '" data-id="' + n.id + '">';
        html += '  <div class="notification-icon ' + n.type + '"><i class="' + n.icon + '"></i></div>';
        html += '  <div class="notification-content">';
        html += '    <p>' + n.message + '</p>';
        html += '    <span class="notification-time">' + n.time + '</span>';
        html += '  </div>';
        html += '</div>';
      });

      list.innerHTML = html;
    },

    addNotification: function (notification) {
      notification.id = Date.now();
      notification.read = false;
      this.notifications.unshift(notification);
      if (this.notifications.length > 20) {
        this.notifications = this.notifications.slice(0, 20);
      }
      this.saveNotifications();
      this.updateBadge();
      if (this.isOpen) this.render();
    },

    bindEvents: function () {
      var self = this;

      // Bell click
      var bells = document.querySelectorAll('.notification-bell');
      bells.forEach(function (bell) {
        bell.addEventListener('click', function (e) {
          e.stopPropagation();
          self.toggle();
          if (self.isOpen) self.render();
        });
      });

      // Mark all read
      var markAllBtns = document.querySelectorAll('.mark-all-read');
      markAllBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          self.markAllRead();
        });
      });

      // Close on outside click
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.notification-dropdown-wrapper')) {
          var panel = document.querySelector('.notification-panel');
          if (panel && self.isOpen) {
            self.isOpen = false;
            panel.classList.remove('active');
          }
        }
      });
    },
  };

  // ── Affiliate Tracking Module ──
  const AffiliateTracker = {
    referralCode: null,

    init: function () {
      if (!getFeatureFlag('affiliateTracking')) return;

      this.captureReferral();
      this.initCopyButtons();
      this.loadStats();
    },

    captureReferral: function () {
      // Capture referral code from URL params
      var params = new URLSearchParams(window.location.search);
      var ref = params.get('ref');
      if (ref && /^[a-zA-Z0-9_-]+$/.test(ref)) {
        this.referralCode = ref;
        // Store with expiry (30 days)
        var data = { code: ref, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 };
        localStorage.setItem('em_referral', JSON.stringify(data));
        this.trackClick(ref);
      } else {
        // Check stored referral
        try {
          var stored = JSON.parse(localStorage.getItem('em_referral'));
          if (stored && stored.expires > Date.now()) {
            this.referralCode = stored.code;
          } else {
            localStorage.removeItem('em_referral');
          }
        } catch (e) {
          // ignore
        }
      }
    },

    trackClick: function (code) {
      // Track referral click (in production, send to server)
      var clicks = JSON.parse(localStorage.getItem('em_ref_clicks') || '{}');
      clicks[code] = (clicks[code] || 0) + 1;
      localStorage.setItem('em_ref_clicks', JSON.stringify(clicks));
    },

    generateReferralLink: function (userId) {
      var baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
      return baseUrl + '?ref=' + encodeURIComponent(userId || 'USER001');
    },

    initCopyButtons: function () {
      var self = this;
      var copyBtns = document.querySelectorAll('.copy-referral-link');
      copyBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var input = btn.closest('.referral-link-box').querySelector('input');
          if (!input) return;

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(input.value).then(function () {
              self.showCopiedFeedback(btn);
            });
          } else {
            // Fallback
            input.select();
            document.execCommand('copy');
            self.showCopiedFeedback(btn);
          }
        });
      });
    },

    showCopiedFeedback: function (btn) {
      var originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.innerHTML = originalHTML;
        btn.classList.remove('copied');
      }, 2000);
    },

    loadStats: function () {
      // Load affiliate stats (mock data — replace with API)
      var stats = this.getMockStats();
      this.renderStats(stats);
    },

    getMockStats: function () {
      return {
        totalClicks: 1247,
        conversions: 89,
        earnings: 15650,
        pendingPayout: 3200,
        conversionRate: 7.1,
        activeReferrals: 42,
      };
    },

    renderStats: function (stats) {
      var elements = {
        totalClicks: document.querySelector('[data-stat="total-clicks"]'),
        conversions: document.querySelector('[data-stat="conversions"]'),
        earnings: document.querySelector('[data-stat="earnings"]'),
        pendingPayout: document.querySelector('[data-stat="pending-payout"]'),
      };

      if (elements.totalClicks) this.animateNumber(elements.totalClicks, stats.totalClicks);
      if (elements.conversions) this.animateNumber(elements.conversions, stats.conversions);
      if (elements.earnings) this.animateNumber(elements.earnings, stats.earnings, '₹');
      if (elements.pendingPayout) this.animateNumber(elements.pendingPayout, stats.pendingPayout, '₹');
    },

    animateNumber: function (element, target, prefix) {
      prefix = prefix || '';
      var current = 0;
      var increment = Math.ceil(target / 60);
      var duration = 1500;
      var stepTime = duration / (target / increment);

      function step() {
        current += increment;
        if (current >= target) {
          element.textContent = prefix + target.toLocaleString('en-IN');
          return;
        }
        element.textContent = prefix + current.toLocaleString('en-IN');
        requestAnimationFrame(step);
      }

      // Only animate when visible
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          step();
          observer.disconnect();
        }
      });
      observer.observe(element);
    },
  };

  // ── Smooth Counter Enhancement ──
  function enhanceCounters() {
    var counters = document.querySelectorAll('.counter-enhanced');
    if (!counters.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            var target = parseInt(entry.target.getAttribute('data-target')) || 0;
            var prefix = entry.target.getAttribute('data-prefix') || '';
            var suffix = entry.target.getAttribute('data-suffix') || '';
            animateValue(entry.target, 0, target, 2000, prefix, suffix);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (c) { observer.observe(c); });
  }

  function animateValue(element, start, end, duration, prefix, suffix) {
    var range = end - start;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      var currentValue = Math.floor(start + range * eased);
      element.textContent = prefix + currentValue.toLocaleString('en-IN') + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ── Hero Particle Generator ──
  function initHeroParticles() {
    var container = document.querySelector('.hero-particles');
    if (!container) return;

    for (var i = 0; i < 20; i++) {
      var particle = document.createElement('div');
      particle.className = 'hero-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.setProperty('--x', Math.random().toString());
      particle.style.animationDelay = -(Math.random() * 20) + 's';
      particle.style.animationDuration = (15 + Math.random() * 15) + 's';
      var size = 3 + Math.random() * 6;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      var colors = [
        'rgba(123, 47, 247, 0.4)',
        'rgba(247, 37, 133, 0.3)',
        'rgba(67, 97, 238, 0.3)',
      ];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      container.appendChild(particle);
    }
  }

  // ── Typed Text Effect for Hero ──
  function initTypedEffect() {
    var element = document.getElementById('typed-text');
    if (!element) return;

    var words = ['Online Learning', 'Digital Skills', 'Affiliate Earning', 'Career Growth'];
    var wordIndex = 0;
    var charIndex = 0;
    var isDeleting = false;

    function type() {
      var currentWord = words[wordIndex];

      if (isDeleting) {
        element.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        element.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      var typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500;
      }

      setTimeout(type, typeSpeed);
    }

    type();
  }

  // ── Smooth Scroll Enhancement ──
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          var offset = 80; // Header height
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  // ── Profile Dropdown (for dashboard/affiliate) ──
  function initProfileDropdown() {
    var profileTriggers = document.querySelectorAll('.profile-dropdown-trigger');
    profileTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var dropdown = trigger.nextElementSibling;
        if (dropdown) {
          dropdown.classList.toggle('active');
        }
      });
    });

    document.addEventListener('click', function () {
      document.querySelectorAll('.profile-dropdown-menu.active').forEach(function (d) {
        d.classList.remove('active');
      });
    });
  }

  // ── Initialize Everything ──
  function init() {
    initScrollAnimations();
    initSectionAnimations();
    initTestimonialSlider();
    NotificationSystem.init();
    AffiliateTracker.init();
    enhanceCounters();
    initHeroParticles();
    initTypedEffect();
    initSmoothScroll();
    initProfileDropdown();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Expose minimal API for PHP integration ──
  window.RicherEnhancements = {
    notifications: NotificationSystem,
    affiliate: AffiliateTracker,
    getFeatureFlag: getFeatureFlag,
  };
})();
