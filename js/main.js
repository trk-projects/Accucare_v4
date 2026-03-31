/* ============================================================
   Accucare Nurse Staffing — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
   * Power Automate Webhook
   * Replace the URL below with your Power Automate HTTP trigger URL.
   * Flow: HTTP trigger → Add row to Excel Online → Send Outlook email.
   * ---------------------------------------------------------------- */
  var POWER_AUTOMATE_WEBHOOK = 'YOUR_POWER_AUTOMATE_WEBHOOK_URL_HERE';
  var SEND_LEAD_API = '/.netlify/functions/send-lead-email';

  /* --- Lead Capture Modal --- */
  function initLeadModal() {
    var overlay = document.createElement('div');
    overlay.className = 'lead-modal-overlay';
    overlay.id = 'lead-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'lead-modal-title');

    overlay.innerHTML = `
      <div class="lead-modal" id="lead-modal">
        <div class="lead-modal__header">
          <div class="lead-modal__header-text">
            <h2 id="lead-modal-title">Request Staffing Coverage</h2>
            <p id="lead-modal-subtitle">Who needs care?</p>
          </div>
          <button class="lead-modal__close" id="lead-modal-close" aria-label="Close form">
            <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="lead-modal__body">

          <!-- Step 1: Care type choice -->
          <div id="lead-modal-step1">
            <div class="lead-modal__choices">
              <button class="lead-modal__choice-btn" id="choice-home" type="button">
                <span class="lead-modal__choice-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </span>
                <span class="lead-modal__choice-label">My Home</span>
                <span class="lead-modal__choice-desc">Care for myself or a family member at home</span>
              </button>
              <button class="lead-modal__choice-btn" id="choice-facility" type="button">
                <span class="lead-modal__choice-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                </span>
                <span class="lead-modal__choice-label">A Facility or Organization</span>
                <span class="lead-modal__choice-desc">Hospital, hospice agency, nursing home, or home health agency</span>
              </button>
            </div>
          </div>

          <!-- Step 2: Form -->
          <div id="lead-modal-step2" style="display:none;">
            <button class="lead-modal__back" id="lead-modal-back" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <div class="lead-modal__success" id="lead-modal-success">
              <div class="lead-modal__success-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3>Request Received!</h3>
              <p>Thank you — we'll be in touch shortly. For urgent needs, call us at <strong>(713) 777-9969</strong>.</p>
            </div>
            <form class="lead-modal__form" id="lead-modal-form" novalidate>
              <div class="form__row">
                <div class="form__group">
                  <label for="lm-name">Full Name <span class="form__required" aria-hidden="true">*</span></label>
                  <input type="text" id="lm-name" name="name" class="form__input" placeholder="Jane Smith" required autocomplete="name" />
                  <div class="form__error" aria-live="polite"></div>
                </div>
                <div class="form__group">
                  <label for="lm-facility" id="lm-facility-label">Location <span class="form__required" aria-hidden="true">*</span></label>
                  <input type="text" id="lm-facility" name="facility" class="form__input" placeholder="" required />
                  <div class="form__error" aria-live="polite"></div>
                </div>
              </div>
              <div class="form__row">
                <div class="form__group">
                  <label for="lm-email">Email Address <span class="form__required" aria-hidden="true">*</span></label>
                  <input type="email" id="lm-email" name="email" class="form__input" placeholder="jane@example.com" required autocomplete="email" />
                  <div class="form__error" aria-live="polite"></div>
                </div>
                <div class="form__group">
                  <label for="lm-phone">Phone Number <span class="form__required" aria-hidden="true">*</span></label>
                  <input type="tel" id="lm-phone" name="phone" class="form__input" placeholder="(713) 555-0100" required autocomplete="tel" />
                  <div class="form__error" aria-live="polite"></div>
                </div>
              </div>
              <div class="form__group">
                <label for="lm-service">Type of Coverage Needed <span class="form__required" aria-hidden="true">*</span></label>
                <select id="lm-service" name="service" class="form__select" required>
                  <option value="">— Select a service —</option>
                  <option value="RN Coverage">RN Coverage</option>
                  <option value="LVN Coverage">LVN Coverage</option>
                  <option value="CNA Coverage">CNA / PCT Coverage</option>
                  <option value="ICU / Critical Care">ICU / Critical Care</option>
                  <option value="Med-Surg">Med-Surg</option>
                  <option value="Multiple Roles">Multiple Roles / Mixed</option>
                  <option value="Not Sure">Not Sure — Need Guidance</option>
                </select>
                <div class="form__error" aria-live="polite"></div>
              </div>
              <div class="form__group">
                <label for="lm-message">Message / Additional Details</label>
                <textarea id="lm-message" name="message" class="form__textarea" placeholder="Tell us about your timeline, shift needs, or anything else that would help us respond quickly."></textarea>
              </div>
              <div class="lead-modal__submit-row">
                <button type="submit" class="btn btn--primary" id="lead-modal-submit">Send Request</button>
                <p class="lead-modal__disclaimer">We respect your privacy. Your information is only used to respond to your inquiry.</p>
              </div>
            </form>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    var form = document.getElementById('lead-modal-form');
    var closeBtn = document.getElementById('lead-modal-close');
    var successDiv = document.getElementById('lead-modal-success');
    var submitBtn = document.getElementById('lead-modal-submit');
    var step1 = document.getElementById('lead-modal-step1');
    var step2 = document.getElementById('lead-modal-step2');
    var subtitle = document.getElementById('lead-modal-subtitle');
    var facilityLabel = document.getElementById('lm-facility-label');
    var facilityInput = document.getElementById('lm-facility');
    var backBtn = document.getElementById('lead-modal-back');
    var careType = '';

    // Choice buttons
    document.getElementById('choice-home').addEventListener('click', function () {
      careType = 'home';
      facilityLabel.innerHTML = 'Home Address <span class="form__required" aria-hidden="true">*</span>';
      facilityInput.placeholder = 'e.g. 123 Main St, Houston TX';
      subtitle.textContent = 'Fill out the form and our team will follow up within one business hour.';
      showStep2();
    });

    document.getElementById('choice-facility').addEventListener('click', function () {
      careType = 'facility';
      facilityLabel.innerHTML = 'Facility / Organization <span class="form__required" aria-hidden="true">*</span>';
      facilityInput.placeholder = 'e.g. Houston Medical Center';
      subtitle.textContent = 'Fill out the form and our team will follow up within one business hour.';
      showStep2();
    });

    backBtn.addEventListener('click', showStep1);

    function showStep1() {
      step2.style.display = 'none';
      step1.style.display = 'block';
      subtitle.textContent = 'Who needs care?';
    }

    function showStep2() {
      step1.style.display = 'none';
      step2.style.display = 'block';
      facilityInput.focus();
    }

    // Open modal on any .js-lead-modal trigger
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('.js-lead-modal');
      if (trigger) {
        e.preventDefault();
        openModal();
      }
    });

    // Close on X button
    closeBtn.addEventListener('click', closeModal);

    // Close on overlay backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    // Close on ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeModal();
      }
    });

    function openModal() {
      showStep1();
      form.reset();
      successDiv.style.display = 'none';
      form.style.display = 'block';
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function closeModal() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    // Modal form validation (reuses validateField logic inline)
    function validateModalField(field) {
      var group = field.closest('.form__group');
      if (!group) return true;
      var errorEl = group.querySelector('.form__error');
      var value = field.value.trim();
      var valid = true;
      var message = '';

      if (field.required && !value) {
        valid = false;
        message = 'This field is required.';
      }
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        valid = false;
        message = 'Please enter a valid email address.';
      }
      if (field.type === 'tel' && value && !/[\d\-\(\)\s\+]{7,20}/.test(value)) {
        valid = false;
        message = 'Please enter a valid phone number.';
      }
      if (field.tagName === 'SELECT' && field.required && !value) {
        valid = false;
        message = 'Please make a selection.';
      }

      if (valid) {
        field.classList.remove('form__input--error', 'form__select--error', 'form__textarea--error');
        if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
      } else {
        var errClass = field.tagName === 'SELECT' ? 'form__select--error' : 'form__input--error';
        field.classList.add(errClass);
        if (errorEl) { errorEl.textContent = message; errorEl.style.display = 'block'; }
      }
      return valid;
    }

    // Real-time validation
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('blur', function () { validateModalField(this); });
      field.addEventListener('input', function () {
        if (this.classList.contains('form__input--error') || this.classList.contains('form__select--error')) {
          validateModalField(this);
        }
      });
    });

    // Submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var allValid = true;
      form.querySelectorAll('[required]').forEach(function (field) {
        if (!validateModalField(field)) allValid = false;
      });

      if (!allValid) {
        var first = form.querySelector('.form__input--error, .form__select--error');
        if (first) { first.focus(); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var payload = {
        name: form.elements['name'].value.trim(),
        care_type: careType,
        facility: form.elements['facility'].value.trim(),
        email: form.elements['email'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        service: form.elements['service'].value,
        message: form.elements['message'].value.trim(),
        submitted_at: new Date().toISOString(),
        source_page: window.location.href
      };

      // Send email notification via Resend (primary)
      fetch(SEND_LEAD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (res.ok) {
            showModalSuccess();
          } else {
            showModalError();
          }
        })
        .catch(function () { showModalError(); });

      // Log to Excel via Power Automate (fire-and-forget, when configured)
      if (POWER_AUTOMATE_WEBHOOK && POWER_AUTOMATE_WEBHOOK !== 'YOUR_POWER_AUTOMATE_WEBHOOK_URL_HERE') {
        fetch(POWER_AUTOMATE_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function () {});
      }
    });

    function showModalSuccess() {
      form.style.display = 'none';
      successDiv.style.display = 'block';
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showModalError() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Request';
      alert('There was a problem submitting your request. Please call us at (713) 777-9969.');
    }
  }

  /* --- Hamburger Menu Toggle --- */
  function initMobileNav() {
    const hamburger = document.querySelector('.nav__hamburger');
    const mobileMenu = document.querySelector('.nav__mobile');

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.contains('is-open');

      if (isOpen) {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation menu');
      } else {
        mobileMenu.classList.add('is-open');
        hamburger.classList.add('is-open');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-label', 'Close navigation menu');
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on link click within mobile menu
    const mobileLinks = mobileMenu.querySelectorAll('.nav__link');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- Active Nav Link Highlighting --- */
  function initActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav__link');

    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href) return;

      const isHome = (href === 'index.html' || href === './') && (currentPath === '/' || currentPath.endsWith('index.html') || currentPath.endsWith('/'));
      const isMatch = !isHome && href !== 'index.html' && href !== './' && currentPath.includes(href.replace('.html', ''));

      if (isHome || isMatch) {
        link.classList.add('nav__link--active');
      }
    });
  }

  /* --- Smooth Scroll for Anchor Links --- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* --- Form Validation & Submission --- */
  function validateField(field) {
    const group = field.closest('.form__group');
    if (!group) return true;

    const errorEl = group.querySelector('.form__error');
    const value = field.value.trim();
    let valid = true;
    let message = '';

    // Required check
    if (field.required && !value) {
      valid = false;
      message = 'This field is required.';
    }

    // Email format
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        valid = false;
        message = 'Please enter a valid email address.';
      }
    }

    // Phone format (loose)
    if (field.type === 'tel' && value) {
      const phoneRegex = /[\d\-\(\)\s\+]{7,20}/;
      if (!phoneRegex.test(value)) {
        valid = false;
        message = 'Please enter a valid phone number.';
      }
    }

    // Select validation
    if (field.tagName === 'SELECT' && field.required && (!value || value === '')) {
      valid = false;
      message = 'Please make a selection.';
    }

    if (valid) {
      field.classList.remove('form__input--error', 'form__select--error', 'form__textarea--error');
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }
    } else {
      field.classList.add(field.tagName === 'SELECT' ? 'form__select--error' : (field.tagName === 'TEXTAREA' ? 'form__textarea--error' : 'form__input--error'));
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
    }

    return valid;
  }

  function initForms() {
    const forms = document.querySelectorAll('.js-form');

    forms.forEach(function (form) {
      const successDiv = form.parentElement.querySelector('.form__success');
      const honeypot = form.querySelector('.form__honeypot input');

      // Real-time validation on blur
      const fields = form.querySelectorAll('input:not([type="checkbox"]):not([type="hidden"]), select, textarea');
      fields.forEach(function (field) {
        field.addEventListener('blur', function () {
          if (this.classList.contains('form__input--error') || this.classList.contains('form__select--error') || this.classList.contains('form__textarea--error')) {
            validateField(this);
          }
        });

        field.addEventListener('input', function () {
          if (this.classList.contains('form__input--error') || this.classList.contains('form__select--error') || this.classList.contains('form__textarea--error')) {
            validateField(this);
          }
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot check
        if (honeypot && honeypot.value) {
          return; // Likely spam
        }

        // Validate all required fields
        const requiredFields = form.querySelectorAll('[required]');
        let allValid = true;

        requiredFields.forEach(function (field) {
          if (!validateField(field)) {
            allValid = false;
          }
        });

        if (!allValid) {
          // Scroll to first error
          const firstError = form.querySelector('.form__input--error, .form__select--error, .form__textarea--error');
          if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        // Get form action (Formspree endpoint)
        const action = form.getAttribute('action');
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
        }

        // If real Formspree action is set, submit via fetch
        if (action && action.includes('formspree.io')) {
          const formData = new FormData(form);

          fetch(action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          })
            .then(function (response) {
              if (response.ok) {
                showSuccess(form, successDiv);
              } else {
                showError(submitBtn, originalText);
              }
            })
            .catch(function () {
              showError(submitBtn, originalText);
            });
        } else {
          // Demo mode — show success immediately
          showSuccess(form, successDiv);
        }
      });
    });
  }

  function showSuccess(form, successDiv) {
    form.style.display = 'none';
    if (successDiv) {
      successDiv.style.display = 'block';
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showError(submitBtn, originalText) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
    alert('There was an error submitting the form. Please call us at (713) 777-9969 or try again.');
  }

  /* --- Scroll-Reveal Animation (lightweight) --- */
  function initScrollReveal() {
    if (!window.IntersectionObserver) return;

    const style = document.createElement('style');
    style.textContent = `
      .reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.55s ease, transform 0.55s ease;
      }
      .reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    const elements = document.querySelectorAll(
      '.service-card, .serve-card, .why-card, .testimonial-card, .vertical-card, .step, .care-setting-card, .role-card, .value-card, .stat-block'
    );

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  /* --- Nav Scroll Shadow --- */
  function initNavShadow() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 12) {
        nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
      } else {
        nav.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
      }
    }, { passive: true });
  }

  /* --- Nav scroll shrink --- */
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* --- Init all --- */
  document.addEventListener('DOMContentLoaded', function () {
    initLeadModal();
    initMobileNav();
    initActiveNav();
    initSmoothScroll();
    initForms();
    initScrollReveal();
    initNavShadow();
    initNavScroll();
  });

})();
