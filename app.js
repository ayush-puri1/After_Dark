/**
 * AFTER DARK - Exclusive Pool Party Ticketing Engine
 * Presented by NØHRINE, Amritsar
 * Client-side Controller & Payment Orchestrator
 */

// Strict Mode
'use strict';

// ==========================================================================
// 1. Configuration & Constants
// ==========================================================================
const CONFIG = {
  vpa: 'sarojmalhotra121@okaxis',
  payeeName: 'Saroj Malhotra',
  aid: 'uGICAgKCguOqyHw',
  whatsappPhone: '919914980829',
  eventName: 'AFTER DARK Pool Party',
  eventDate: 'Tue, 26 Sept 2026',
  eventVenue: 'NØHRINE, Amritsar',
};

const TICKETS = {
  stag: {
    id: 'stag',
    name: 'Stag Entry',
    price: 2500,
    color: '#e63950',
    group: 'Individual (1 Guest)',
    minGuests: 1,
    maxGuests: 1,
    isTable: false
  },
  couple: {
    id: 'couple',
    name: 'Couple Entry',
    price: 4000,
    color: '#b34fe0',
    group: 'Couple (2 Guests)',
    minGuests: 2,
    maxGuests: 2,
    isTable: false
  },
  standing: {
    id: 'standing',
    name: 'Standing Table',
    price: 15000,
    color: '#2fa8ff',
    group: 'Group (5–6 Members)',
    minGuests: 5,
    maxGuests: 6,
    isTable: true
  },
  vip: {
    id: 'vip',
    name: 'VIP Table',
    price: 40000,
    color: '#d4af37',
    group: 'Cabana (Up to 15 Guests)',
    minGuests: 5,
    maxGuests: 15,
    isTable: true
  }
};

const POSTERS = [
  { src: 'assets/poster-blue.png', title: 'Electric Poolside Edition' },
  { src: 'assets/poster-red.png', title: 'Crimson Rush Stag Edition' },
  { src: 'assets/poster-gold.png', title: 'Royal Gold VIP Lounge Edition' }
];

// Active State
const state = {
  selectedTicket: 'stag',
  guestCount: 1,
  fullName: '',
  phone: '',
  age: '',
  email: '',
  notes: '',
  bookingRef: '',
  showingStaticQR: false,
  modalIndex: 0
};

// ==========================================================================
// 2. DOM Elements
// ==========================================================================
const dom = {
  navbar: document.getElementById('navbar'),
  ticketGrid: document.getElementById('ticket-grid'),
  ticketCards: document.querySelectorAll('.ticket-card'),
  
  // Summary bar
  summaryDot: document.getElementById('summary-dot'),
  summaryTicketName: document.getElementById('summary-ticket-name'),
  summaryTicketGroup: document.getElementById('summary-ticket-group'),
  summaryTicketPrice: document.getElementById('summary-ticket-price'),
  btnChangeTicket: document.getElementById('btn-change-ticket'),
  
  // Form fields
  bookingForm: document.getElementById('booking-form'),
  inputFullName: document.getElementById('input-fullname'),
  inputPhone: document.getElementById('input-phone'),
  inputAge: document.getElementById('input-age'),
  inputEmail: document.getElementById('input-email'),
  groupGuestsWrapper: document.getElementById('group-guests-wrapper'),
  selectGuests: document.getElementById('select-guests'),
  inputNotes: document.getElementById('input-notes'),
  btnProceedPay: document.getElementById('btn-proceed-pay'),
  
  // Sections
  bookingSection: document.getElementById('booking-section'),
  paymentSection: document.getElementById('payment-section'),
  confirmationSection: document.getElementById('confirmation-section'),
  
  // Payment Elements
  payTicketName: document.getElementById('pay-ticket-name'),
  payGuestName: document.getElementById('pay-guest-name'),
  payGuestPhone: document.getElementById('pay-guest-phone'),
  payGuestCountRow: document.getElementById('pay-guest-count-row'),
  payGuestCount: document.getElementById('pay-guest-count'),
  payTotalAmount: document.getElementById('pay-total-amount'),
  dynamicQrBox: document.getElementById('dynamic-qr-box'),
  btnToggleStaticQr: document.getElementById('btn-toggle-static-qr'),
  linkUpiApp: document.getElementById('link-upi-app'),
  valUpiId: document.getElementById('val-upi-id'),
  btnCopyUpi: document.getElementById('btn-copy-upi'),
  btnWhatsappSend: document.getElementById('btn-whatsapp-send'),
  btnViewPass: document.getElementById('btn-view-pass'),
  
  // Confirmation Elements
  passTypeBadge: document.getElementById('pass-type-badge'),
  passGuestName: document.getElementById('pass-guest-name'),
  passRefId: document.getElementById('pass-ref-id'),
  passAmount: document.getElementById('pass-amount'),
  passAllocation: document.getElementById('pass-allocation'),
  btnReopenWhatsapp: document.getElementById('btn-reopen-whatsapp'),
  btnPrintPass: document.getElementById('btn-print-pass'),
  btnBookAnother: document.getElementById('btn-book-another'),
  
  // Poster Modal
  posterModal: document.getElementById('poster-modal'),
  modalImg: document.getElementById('modal-img'),
  modalTitle: document.getElementById('modal-title'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalPrevBtn: document.getElementById('modal-prev-btn'),
  modalNextBtn: document.getElementById('modal-next-btn'),
  btnOpenGallery: document.getElementById('btn-open-gallery'),
  btnHeroPoster: document.getElementById('btn-hero-poster'),
  posterCards: document.querySelectorAll('.poster-card'),
  
  // Toast
  toastMsg: document.getElementById('toast-msg'),
  toastText: document.getElementById('toast-text'),
  
  // Canvas
  particleCanvas: document.getElementById('particle-canvas')
};

// ==========================================================================
// 3. Application Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initParticleBackground();
  initNavigation();
  initTicketSelection();
  initFormValidation();
  initPaymentActions();
  initModalGallery();
  initConfirmationActions();
  
  // Set default selection
  selectTicket('stag', false);
});

// ==========================================================================
// 4. Ticket Selection Logic
// ==========================================================================
function initTicketSelection() {
  dom.ticketCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      selectTicket(type, true);
    });
  });

  dom.btnChangeTicket.addEventListener('click', () => {
    document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
  });
}

function selectTicket(type, autoScroll = false) {
  if (!TICKETS[type]) return;
  state.selectedTicket = type;
  const ticket = TICKETS[type];

  // Update Card UI
  dom.ticketCards.forEach(card => {
    const isThis = card.dataset.type === type;
    card.classList.toggle('selected', isThis);
    const btnText = card.querySelector('.btn-text');
    if (btnText) {
      btnText.textContent = isThis ? '✓ Selected Pass' : 'Select This Ticket';
    }
  });

  // Update Summary Bar
  dom.summaryDot.style.background = ticket.color;
  dom.summaryDot.style.boxShadow = `0 0 10px ${ticket.color}`;
  dom.summaryTicketName.textContent = ticket.name;
  dom.summaryTicketGroup.textContent = ticket.group;
  dom.summaryTicketPrice.textContent = `₹${ticket.price.toLocaleString('en-IN')}`;
  dom.summaryTicketPrice.style.color = ticket.color;

  // Handle Guest Count for Table options
  if (ticket.isTable) {
    dom.groupGuestsWrapper.style.display = 'flex';
    dom.selectGuests.innerHTML = '';
    
    // Populate select
    for (let i = ticket.minGuests; i <= ticket.maxGuests; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${i} Guests / Table Members`;
      dom.selectGuests.appendChild(opt);
    }
    dom.selectGuests.value = ticket.minGuests;
    state.guestCount = ticket.minGuests;
  } else {
    dom.groupGuestsWrapper.style.display = 'none';
    state.guestCount = ticket.maxGuests;
  }

  // Tactile feedback
  triggerHaptic();

  // Smooth scroll to form if requested
  if (autoScroll) {
    dom.bookingSection.style.display = 'block';
    dom.bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ==========================================================================
// 5. Form Validation & Submission
// ==========================================================================
function initFormValidation() {
  const fields = [
    { input: dom.inputFullName, error: 'error-fullname', group: 'group-fullname', validate: val => val.trim().length >= 2 },
    { input: dom.inputPhone, error: 'error-phone', group: 'group-phone', validate: val => /^[6-9]\d{9}$/.test(val.trim()) },
    { input: dom.inputAge, error: 'error-age', group: 'group-age', validate: val => parseInt(val, 10) >= 18 },
    { input: dom.inputEmail, error: 'error-email', group: 'group-email', validate: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) }
  ];

  fields.forEach(({ input, group, validate }) => {
    input.addEventListener('input', () => {
      const grpEl = document.getElementById(group);
      if (validate(input.value)) {
        grpEl.classList.remove('has-error');
      }
    });

    input.addEventListener('blur', () => {
      const grpEl = document.getElementById(group);
      if (!validate(input.value) && input.value.length > 0) {
        grpEl.classList.add('has-error');
      }
    });
  });

  // Phone input restriction to digits only
  dom.inputPhone.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });

  // Handle Form Submit
  dom.bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    fields.forEach(({ input, group, validate }) => {
      const grpEl = document.getElementById(group);
      if (!validate(input.value)) {
        grpEl.classList.add('has-error');
        isValid = false;
      } else {
        grpEl.classList.remove('has-error');
      }
    });

    if (!isValid) {
      showToast('Please correct the highlighted fields (Age must be 18+).');
      return;
    }

    // Save fields to state
    state.fullName = dom.inputFullName.value.trim();
    state.phone = dom.inputPhone.value.trim();
    state.age = parseInt(dom.inputAge.value, 10);
    state.email = dom.inputEmail.value.trim();
    state.notes = dom.inputNotes.value.trim();
    if (TICKETS[state.selectedTicket].isTable) {
      state.guestCount = parseInt(dom.selectGuests.value, 10);
    }

    // Generate Booking Reference (e.g. AD-83921)
    state.bookingRef = 'AD-' + Math.floor(10000 + Math.random() * 90000);

    // Save to LocalStorage
    saveBookingRecord();

    // Proceed to Step 3 (Payment)
    renderPaymentStep();
  });
}

// ==========================================================================
// 6. Payment & Dynamic QR Generation
// ==========================================================================
function renderPaymentStep() {
  const ticket = TICKETS[state.selectedTicket];
  
  // Populate Summary
  dom.payTicketName.textContent = ticket.name;
  dom.payGuestName.textContent = state.fullName;
  dom.payGuestPhone.textContent = `+91 ${state.phone}`;
  dom.payTotalAmount.textContent = `₹${ticket.price.toLocaleString('en-IN')}`;
  
  if (ticket.isTable) {
    dom.payGuestCountRow.style.display = 'flex';
    dom.payGuestCount.textContent = `${state.guestCount} Members Allocation`;
  } else {
    dom.payGuestCountRow.style.display = 'none';
  }

  // Construct clean transaction note: AfterDark-<Ticket>-<Ref>
  const cleanName = state.fullName.replace(/[^a-zA-Z0-9]/g, '');
  const cleanTicket = ticket.name.replace(/[^a-zA-Z0-9]/g, '');
  const note = `AfterDark-${cleanTicket}-${cleanName}-${state.bookingRef}`;

  // UPI Deep Link Specification
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(CONFIG.vpa)}&pn=${encodeURIComponent(CONFIG.payeeName)}&am=${ticket.price}&cu=INR&tn=${encodeURIComponent(note)}&aid=${encodeURIComponent(CONFIG.aid)}`;

  // Generate Dynamic QR code
  generateDynamicQR(upiDeepLink);

  // Set Pay via UPI Mobile App link
  dom.linkUpiApp.href = upiDeepLink;

  // Set WhatsApp Screenshot handoff link
  const waMessage = `Hi, I've completed payment for AFTER DARK 🌙
• Ticket: ${ticket.name}
• Ref ID: ${state.bookingRef}
• Name: ${state.fullName}
• Phone: ${state.phone}
• Amount: ₹${ticket.price.toLocaleString('en-IN')}

Attaching my payment screenshot for digital pass issuance!`;

  const waUrl = `https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent(waMessage)}`;
  dom.btnWhatsappSend.href = waUrl;
  dom.btnReopenWhatsapp.href = waUrl;

  // Reveal Payment Section
  dom.paymentSection.style.display = 'block';
  dom.paymentSection.scrollIntoView({ behavior: 'smooth' });
}

function generateDynamicQR(text) {
  dom.dynamicQrBox.innerHTML = '';
  state.showingStaticQR = false;
  dom.btnToggleStaticQr.textContent = 'Switch to Official GPay QR Image';

  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(dom.dynamicQrBox, {
        text: text,
        width: 230,
        height: 230,
        colorDark: '#05070d',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      // Fallback to QR server API if offline script failed
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(text)}`;
      img.alt = 'UPI Payment QR Code';
      dom.dynamicQrBox.appendChild(img);
    }
  } catch (err) {
    console.error('QR code generation error:', err);
    renderStaticQR();
  }
}

function renderStaticQR() {
  dom.dynamicQrBox.innerHTML = `
    <img src="assets/gpay-qr.jpeg" alt="Official Google Pay QR" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
  `;
  state.showingStaticQR = true;
  dom.btnToggleStaticQr.textContent = 'Switch to Auto-Amount QR Code';
}

function initPaymentActions() {
  // Toggle static vs dynamic QR
  dom.btnToggleStaticQr.addEventListener('click', () => {
    if (state.showingStaticQR) {
      const ticket = TICKETS[state.selectedTicket];
      const cleanName = state.fullName.replace(/[^a-zA-Z0-9]/g, '') || 'Guest';
      const cleanTicket = ticket.name.replace(/[^a-zA-Z0-9]/g, '');
      const note = `AfterDark-${cleanTicket}-${cleanName}-${state.bookingRef || 'TKT'}`;
      const upiDeepLink = `upi://pay?pa=${encodeURIComponent(CONFIG.vpa)}&pn=${encodeURIComponent(CONFIG.payeeName)}&am=${ticket.price}&cu=INR&tn=${encodeURIComponent(note)}&aid=${encodeURIComponent(CONFIG.aid)}`;
      generateDynamicQR(upiDeepLink);
    } else {
      renderStaticQR();
    }
  });

  // Copy UPI ID
  dom.btnCopyUpi.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(CONFIG.vpa).then(() => {
        showToast('Payee UPI ID copied to clipboard!');
      }).catch(() => {
        fallbackCopy(CONFIG.vpa);
      });
    } else {
      fallbackCopy(CONFIG.vpa);
    }
  });

  // Proceed to Confirmation Pass
  dom.btnViewPass.addEventListener('click', () => {
    renderConfirmationStep();
  });

  dom.btnWhatsappSend.addEventListener('click', () => {
    // When user clicks WhatsApp, automatically show pass after a short delay
    setTimeout(() => {
      renderConfirmationStep();
    }, 1200);
  });
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('Payee UPI ID copied to clipboard!');
}

// ==========================================================================
// 7. Confirmation & Digital Pass Stub
// ==========================================================================
function renderConfirmationStep() {
  const ticket = TICKETS[state.selectedTicket];
  
  dom.passTypeBadge.textContent = ticket.name;
  dom.passTypeBadge.style.color = ticket.color;
  dom.passTypeBadge.style.borderColor = ticket.color;
  dom.passTypeBadge.style.background = `${ticket.color}15`;

  dom.passGuestName.textContent = state.fullName || 'Guest Attendee';
  dom.passRefId.textContent = state.bookingRef || 'AD-99104';
  dom.passAmount.textContent = `₹${ticket.price.toLocaleString('en-IN')}`;
  
  if (ticket.isTable) {
    dom.passAllocation.textContent = `${state.guestCount} Guests (Reserved Table)`;
  } else {
    dom.passAllocation.textContent = ticket.group;
  }

  dom.confirmationSection.style.display = 'block';
  dom.confirmationSection.scrollIntoView({ behavior: 'smooth' });
  triggerHaptic();
}

function initConfirmationActions() {
  // Print / Save Pass
  dom.btnPrintPass.addEventListener('click', () => {
    window.print();
  });

  // Book Another
  dom.btnBookAnother.addEventListener('click', () => {
    dom.bookingForm.reset();
    dom.paymentSection.style.display = 'none';
    dom.confirmationSection.style.display = 'none';
    selectTicket('stag', true);
    showToast('Ready for your next pass booking!');
  });
}

function saveBookingRecord() {
  try {
    const existing = JSON.parse(localStorage.getItem('afterDark_bookings') || '[]');
    const record = {
      bookingRef: state.bookingRef,
      ticketType: state.selectedTicket,
      ticketName: TICKETS[state.selectedTicket].name,
      amount: TICKETS[state.selectedTicket].price,
      name: state.fullName,
      phone: state.phone,
      age: state.age,
      email: state.email,
      guestCount: state.guestCount,
      notes: state.notes,
      timestamp: new Date().toISOString()
    };
    existing.unshift(record);
    localStorage.setItem('afterDark_bookings', JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.warn('LocalStorage save skipped', e);
  }
}

// ==========================================================================
// 8. Poster Lightbox Gallery
// ==========================================================================
function initModalGallery() {
  const openModalAt = (index) => {
    state.modalIndex = (index + POSTERS.length) % POSTERS.length;
    const item = POSTERS[state.modalIndex];
    dom.modalImg.src = item.src;
    dom.modalTitle.textContent = item.title;
    dom.posterModal.classList.add('active');
    dom.posterModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    dom.posterModal.classList.remove('active');
    dom.posterModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  dom.btnOpenGallery.addEventListener('click', () => openModalAt(0));
  dom.btnHeroPoster.addEventListener('click', () => openModalAt(0));

  dom.posterCards.forEach((card, idx) => {
    card.addEventListener('click', () => openModalAt(idx));
  });

  dom.modalCloseBtn.addEventListener('click', closeModal);
  dom.posterModal.addEventListener('click', (e) => {
    if (e.target === dom.posterModal) closeModal();
  });

  dom.modalPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openModalAt(state.modalIndex - 1);
  });

  dom.modalNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openModalAt(state.modalIndex + 1);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!dom.posterModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') openModalAt(state.modalIndex - 1);
    if (e.key === 'ArrowRight') openModalAt(state.modalIndex + 1);
  });
}

// ==========================================================================
// 9. Navigation & Scroll Effects
// ==========================================================================
function initNavigation() {
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 40) {
      dom.navbar.classList.add('scrolled');
    } else {
      dom.navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });
}

// ==========================================================================
// 10. Ambient Particle Background (HTML5 Canvas)
// ==========================================================================
function initParticleBackground() {
  const canvas = dom.particleCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, particles = [];

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();

  const particleCount = window.innerWidth < 768 ? 35 : 70;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.5,
      color: Math.random() > 0.4 ? 'rgba(79, 195, 247, ' : 'rgba(255, 255, 255, ',
      alpha: Math.random() * 0.7 + 0.2,
      speedY: Math.random() * 0.4 + 0.15,
      speedX: (Math.random() - 0.5) * 0.3,
      glow: Math.random() * 8 + 2
    });
  }

  let animationFrame;
  const render = () => {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.speedY;
      p.x += p.speedX;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.shadowBlur = p.glow;
      ctx.shadowColor = '#4fc3f7';
      ctx.fill();
    }

    animationFrame = requestAnimationFrame(render);
  };

  render();

  // Pause rendering when document hidden to save device battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
    } else {
      render();
    }
  });
}

// ==========================================================================
// 11. Utilities
// ==========================================================================
function showToast(message) {
  dom.toastText.textContent = message;
  dom.toastMsg.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    dom.toastMsg.classList.remove('show');
  }, 3200);
}

function triggerHaptic() {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(20);
    } catch (e) {
      // Ignored if device does not permit
    }
  }
}
