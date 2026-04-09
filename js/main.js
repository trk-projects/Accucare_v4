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
  var SEND_APPLICATION_API = '/.netlify/functions/send-application-email';

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
              <p>Thank you. We'll be in touch shortly. For urgent needs, call us at <strong>(713) 777-9969</strong>.</p>
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
                  <option value="">Select a service</option>
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

    var homeServiceOptions = [
      { value: 'RN Coverage',          label: 'RN Coverage' },
      { value: 'LVN Coverage',         label: 'LVN Coverage' },
      { value: 'CNA Coverage',         label: 'CNA Coverage' },
      { value: 'Caregiver / Companion',label: 'Caregiver / Companion' },
      { value: 'ICU / Critical Care',  label: 'ICU / Critical Care' },
      { value: 'Not Sure',             label: 'Not Sure / Need Guidance' }
    ];

    var facilityServiceOptions = [
      { value: 'RN Coverage',         label: 'RN Coverage' },
      { value: 'LVN Coverage',        label: 'LVN Coverage' },
      { value: 'CNA Coverage',        label: 'CNA Coverage' },
      { value: 'CMA',                 label: 'CMA' },
      { value: 'ICU / Critical Care', label: 'ICU / Critical Care' },
      { value: 'Med-Surg',            label: 'Med-Surg' }
    ];

    function populateServiceDropdown(options) {
      var select = document.getElementById('lm-service');
      select.innerHTML = '<option value="">Select a service</option>';
      options.forEach(function(opt) {
        var el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.label;
        select.appendChild(el);
      });
    }

    // Choice buttons
    document.getElementById('choice-home').addEventListener('click', function () {
      careType = 'home';
      facilityLabel.innerHTML = 'Home Address <span class="form__required" aria-hidden="true">*</span>';
      facilityInput.placeholder = 'e.g. 123 Main St, Houston TX';
      subtitle.textContent = 'Fill out the form and our team will follow up within one business hour.';
      populateServiceDropdown(homeServiceOptions);
      showStep2();
    });

    document.getElementById('choice-facility').addEventListener('click', function () {
      careType = 'facility';
      facilityLabel.innerHTML = 'Facility / Organization <span class="form__required" aria-hidden="true">*</span>';
      facilityInput.placeholder = 'e.g. Houston Medical Center';
      subtitle.textContent = 'Fill out the form and our team will follow up within one business hour.';
      populateServiceDropdown(facilityServiceOptions);
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

  /* --- Career Application Modal --- */
  function initCareerModal() {
    var overlay = document.createElement('div');
    overlay.className = 'lead-modal-overlay';
    overlay.id = 'career-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'career-modal-title');

    overlay.innerHTML = `
      <div class="lead-modal" id="career-modal">
        <div class="lead-modal__header">
          <div class="lead-modal__header-text">
            <h2 id="career-modal-title">Apply to Join Accucare</h2>
            <p>Fill out the form and we'll follow up to schedule your onboarding.</p>
          </div>
          <button class="lead-modal__close" id="career-modal-close" aria-label="Close form">
            <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="lead-modal__body">
          <div class="lead-modal__success" id="career-modal-success" style="display:none;">
            <div class="lead-modal__success-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3>Application Received!</h3>
            <p>Thank you for applying. We'll review your application and reach out shortly. For urgent inquiries call <strong>(713) 777-9969</strong>.</p>
          </div>
          <form class="lead-modal__form" id="career-modal-form" novalidate>

            <div class="form__row">
              <div class="form__group">
                <label for="cm-firstname">First Name <span class="form__required" aria-hidden="true">*</span></label>
                <input type="text" id="cm-firstname" name="firstname" class="form__input" placeholder="Jane" required autocomplete="given-name" />
                <div class="form__error" aria-live="polite"></div>
              </div>
              <div class="form__group">
                <label for="cm-lastname">Last Name <span class="form__required" aria-hidden="true">*</span></label>
                <input type="text" id="cm-lastname" name="lastname" class="form__input" placeholder="Smith" required autocomplete="family-name" />
                <div class="form__error" aria-live="polite"></div>
              </div>
            </div>

            <div class="form__row">
              <div class="form__group">
                <label for="cm-email">Email Address <span class="form__required" aria-hidden="true">*</span></label>
                <input type="email" id="cm-email" name="email" class="form__input" placeholder="jane@example.com" required autocomplete="email" />
                <div class="form__error" aria-live="polite"></div>
              </div>
              <div class="form__group">
                <label for="cm-phone">Phone Number <span class="form__required" aria-hidden="true">*</span></label>
                <input type="tel" id="cm-phone" name="phone" class="form__input" placeholder="(713) 555-0100" required autocomplete="tel" />
                <div class="form__error" aria-live="polite"></div>
              </div>
            </div>

            <div class="form__group">
              <label for="cm-role">Position Applying For <span class="form__required" aria-hidden="true">*</span></label>
              <select id="cm-role" name="role" class="form__select" required>
                <option value="">Select a position</option>
                <option value="RN">RN</option>
                <option value="LVN">LVN</option>
                <option value="CNA">CNA</option>
                <option value="Caregiver / Sitter">Caregiver / Sitter</option>
              </select>
              <div class="form__error" aria-live="polite"></div>
            </div>

            <div class="form__group">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e293b;">Do you have the required license or certification for the position you are applying for? <span class="form__required" aria-hidden="true">*</span></p>
              <div style="display:flex;gap:12px;" id="cm-licensed-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="licensed" value="Yes" required /> Yes</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="licensed" value="No" /> No</label>
              </div>
              <div class="form__error" id="cm-licensed-error" aria-live="polite"></div>
            </div>

            <div class="form__group">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e293b;">Are you willing to undergo a background check, in accordance with local law/regulations? <span class="form__required" aria-hidden="true">*</span></p>
              <div style="display:flex;gap:12px;" id="cm-bgcheck-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="bgcheck" value="Yes" required /> Yes</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="bgcheck" value="No" /> No</label>
              </div>
              <div class="form__error" id="cm-bgcheck-error" aria-live="polite"></div>
            </div>

            <div class="form__group">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e293b;">Are you willing to take a drug test, in accordance with local law/regulations? <span class="form__required" aria-hidden="true">*</span></p>
              <div style="display:flex;gap:12px;" id="cm-drugtest-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="drugtest" value="Yes" required /> Yes</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="drugtest" value="No" /> No</label>
              </div>
              <div class="form__error" id="cm-drugtest-error" aria-live="polite"></div>
            </div>

            <div class="form__group">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e293b;">Are you legally authorized to work in the United States? <span class="form__required" aria-hidden="true">*</span></p>
              <div style="display:flex;gap:12px;" id="cm-workauth-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="workauth" value="Yes" required /> Yes</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="workauth" value="No" /> No</label>
              </div>
              <div class="form__error" id="cm-workauth-error" aria-live="polite"></div>
            </div>

            <div class="form__group">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e293b;">Will you now, or in the future, require sponsorship for employment visa status (e.g. H-1B)? <span class="form__required" aria-hidden="true">*</span></p>
              <div style="display:flex;gap:12px;" id="cm-sponsorship-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="sponsorship" value="Yes" required /> Yes</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;"><input type="radio" name="sponsorship" value="No" /> No</label>
              </div>
              <div class="form__error" id="cm-sponsorship-error" aria-live="polite"></div>
            </div>

            <div class="form__row">
              <div class="form__group">
                <label for="cm-experience">Years of experience in this position <span class="form__required" aria-hidden="true">*</span></label>
                <input type="number" id="cm-experience" name="experience" class="form__input" placeholder="e.g. 3" min="0" max="50" required />
                <div class="form__error" aria-live="polite"></div>
              </div>
              <div class="form__group">
                <label for="cm-startdate">Preferred Start Date <span class="form__required" aria-hidden="true">*</span></label>
                <input type="date" id="cm-startdate" name="startdate" class="form__input" required />
                <div class="form__error" aria-live="polite"></div>
              </div>
            </div>

            <div class="form__group">
              <label for="cm-resume">Resume <span class="form__required" aria-hidden="true">*</span></label>
              <div id="cm-resume-dropzone" style="border:2px dashed #cbd5e1;border-radius:8px;padding:20px 16px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;background:#f8fafc;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;margin-bottom:8px;" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p id="cm-resume-label" style="margin:0;font-size:14px;color:#64748b;">Click to upload or drag &amp; drop</p>
                <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">PDF, DOC, or DOCX, max 5 MB</p>
                <input type="file" id="cm-resume" name="resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;" aria-required="true" />
              </div>
              <div class="form__error" id="cm-resume-error" aria-live="polite"></div>
            </div>

            <div class="lead-modal__submit-row">
              <button type="submit" class="btn btn--primary" id="career-modal-submit">Submit Application</button>
              <p class="lead-modal__disclaimer">Your information is only used to evaluate your application.</p>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    var form = document.getElementById('career-modal-form');
    var closeBtn = document.getElementById('career-modal-close');
    var successDiv = document.getElementById('career-modal-success');
    var submitBtn = document.getElementById('career-modal-submit');
    var resumeInput = document.getElementById('cm-resume');
    var resumeDropzone = document.getElementById('cm-resume-dropzone');
    var resumeLabel = document.getElementById('cm-resume-label');
    var resumeError = document.getElementById('cm-resume-error');

    var radioGroups = [
      { name: 'licensed',    errorId: 'cm-licensed-error' },
      { name: 'bgcheck',     errorId: 'cm-bgcheck-error' },
      { name: 'drugtest',    errorId: 'cm-drugtest-error' },
      { name: 'workauth',    errorId: 'cm-workauth-error' },
      { name: 'sponsorship', errorId: 'cm-sponsorship-error' }
    ];

    function validateRadioGroup(name, errorId) {
      var selected = form.querySelector('input[name="' + name + '"]:checked');
      var errorEl = document.getElementById(errorId);
      if (!selected) {
        if (errorEl) { errorEl.textContent = 'Please select an option.'; errorEl.style.display = 'block'; }
        return false;
      }
      if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }
      return true;
    }

    // Dropzone click opens file picker
    resumeDropzone.addEventListener('click', function () { resumeInput.click(); });

    // Drag and drop
    resumeDropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      resumeDropzone.style.borderColor = '#0E7C7B';
      resumeDropzone.style.background = '#f0fdf9';
    });
    resumeDropzone.addEventListener('dragleave', function () {
      resumeDropzone.style.borderColor = '#cbd5e1';
      resumeDropzone.style.background = '#f8fafc';
    });
    resumeDropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      resumeDropzone.style.borderColor = '#cbd5e1';
      resumeDropzone.style.background = '#f8fafc';
      if (e.dataTransfer.files.length) {
        resumeInput.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    resumeInput.addEventListener('change', function () {
      if (this.files.length) handleFileSelect(this.files[0]);
    });

    function handleFileSelect(file) {
      var allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      var allowedExt = /\.(pdf|doc|docx)$/i;
      if (!allowed.includes(file.type) && !allowedExt.test(file.name)) {
        resumeError.textContent = 'Please upload a PDF, DOC, or DOCX file.';
        resumeError.style.display = 'block';
        resumeDropzone.style.borderColor = '#ef4444';
        resumeLabel.textContent = 'Click to upload or drag & drop';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        resumeError.textContent = 'File must be 5 MB or smaller.';
        resumeError.style.display = 'block';
        resumeDropzone.style.borderColor = '#ef4444';
        resumeLabel.textContent = 'Click to upload or drag & drop';
        return;
      }
      resumeError.textContent = '';
      resumeError.style.display = 'none';
      resumeDropzone.style.borderColor = '#0E7C7B';
      resumeDropzone.style.background = '#f0fdf9';
      resumeLabel.textContent = '✓ ' + file.name;
    }

    function validateCareerField(field) {
      var group = field.closest('.form__group');
      if (!group) return true;
      var errorEl = group.querySelector('.form__error');
      var value = field.value.trim();
      var valid = true;
      var message = '';

      if (field.required && !value) { valid = false; message = 'This field is required.'; }
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { valid = false; message = 'Please enter a valid email address.'; }
      if (field.type === 'tel' && value && !/[\d\-\(\)\s\+]{7,20}/.test(value)) { valid = false; message = 'Please enter a valid phone number.'; }
      if (field.tagName === 'SELECT' && field.required && !value) { valid = false; message = 'Please make a selection.'; }

      if (valid) {
        field.classList.remove('form__input--error', 'form__select--error');
        if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
      } else {
        field.classList.add(field.tagName === 'SELECT' ? 'form__select--error' : 'form__input--error');
        if (errorEl) { errorEl.textContent = message; errorEl.style.display = 'block'; }
      }
      return valid;
    }

    form.querySelectorAll('input:not([type="file"]), select').forEach(function (field) {
      field.addEventListener('blur', function () { validateCareerField(this); });
      field.addEventListener('input', function () {
        if (this.classList.contains('form__input--error') || this.classList.contains('form__select--error')) validateCareerField(this);
      });
    });

    // Open modal on any .js-career-modal trigger
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('.js-career-modal');
      if (trigger) { e.preventDefault(); openCareerModal(); }
    });

    closeBtn.addEventListener('click', closeCareerModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCareerModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeCareerModal();
    });

    function openCareerModal() {
      form.reset();
      successDiv.style.display = 'none';
      form.style.display = 'block';
      resumeLabel.textContent = 'Click to upload or drag & drop';
      resumeDropzone.style.borderColor = '#cbd5e1';
      resumeDropzone.style.background = '#f8fafc';
      resumeError.textContent = '';
      resumeError.style.display = 'none';
      radioGroups.forEach(function (g) {
        var el = document.getElementById(g.errorId);
        if (el) { el.textContent = ''; el.style.display = 'none'; }
      });
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function closeCareerModal() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var allValid = true;
      form.querySelectorAll('input:not([type="file"]):not([type="radio"])[required], select[required]').forEach(function (field) {
        if (!validateCareerField(field)) allValid = false;
      });

      radioGroups.forEach(function (g) {
        if (!validateRadioGroup(g.name, g.errorId)) allValid = false;
      });

      // Validate resume
      var file = resumeInput.files && resumeInput.files[0];
      if (!file) {
        resumeError.textContent = 'Please upload your resume.';
        resumeError.style.display = 'block';
        resumeDropzone.style.borderColor = '#ef4444';
        allValid = false;
      }

      if (!allValid) {
        var first = form.querySelector('.form__input--error, .form__select--error');
        if (first) { first.focus(); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        else { resumeDropzone.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var reader = new FileReader();
      reader.onload = function (ev) {
        var base64 = ev.target.result.split(',')[1];

        var payload = {
          firstname:       form.elements['firstname'].value.trim(),
          lastname:        form.elements['lastname'].value.trim(),
          email:           form.elements['email'].value.trim(),
          phone:           form.elements['phone'].value.trim(),
          role:            form.elements['role'].value,
          licensed:        form.querySelector('input[name="licensed"]:checked').value,
          bgcheck:         form.querySelector('input[name="bgcheck"]:checked').value,
          drugtest:        form.querySelector('input[name="drugtest"]:checked').value,
          workauth:        form.querySelector('input[name="workauth"]:checked').value,
          sponsorship:     form.querySelector('input[name="sponsorship"]:checked').value,
          experience:      form.elements['experience'].value,
          startdate:       form.elements['startdate'].value,
          resume_filename: file.name,
          resume_content:  base64,
          submitted_at:    new Date().toISOString(),
          source_page:     window.location.href
        };

        fetch(SEND_APPLICATION_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            if (res.ok) {
              form.style.display = 'none';
              successDiv.style.display = 'block';
              successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Submit Application';
              alert('There was a problem submitting your application. Please call us at (713) 777-9969.');
            }
          })
          .catch(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
            alert('There was a problem submitting your application. Please call us at (713) 777-9969.');
          });
      };
      reader.readAsDataURL(file);
    });
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
    initCareerModal();
    initMobileNav();
    initSmoothScroll();
    initForms();
    initScrollReveal();
    initNavShadow();
    initNavScroll();
  });

})();
