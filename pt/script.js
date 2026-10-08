/* =========================================================
   Marco Ferri Coaching — sito demo
   Navigazione, animazioni, calendario mock e form (nessun backend)
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Navigazione ---------- */
  const header = $('#site-header');
  const toggle = $('.nav-toggle');
  const menu = $('#nav-menu');
  const desktop = window.matchMedia('(min-width: 960px)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function setMenu(open, returnFocus = false) {
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
    if (!open && returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setMenu(!isOpen()));

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen() || desktop.matches) return;
    if (e.key === 'Escape') {
      setMenu(false, true);
      return;
    }
    // Focus trap nel pannello mobile aperto
    if (e.key === 'Tab') {
      const items = [toggle, ...$$('a', menu)];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  desktop.addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- WhatsApp flottante ---------- */
  // Su mobile resta nascosto finché si vede il bottone WhatsApp dell'hero, così non lo copre
  const heroWa = $('.hero-ctas a[href^="https://wa.me"]');
  if (heroWa && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      document.body.classList.toggle('hero-wa-visible', entry.isIntersecting);
    }).observe(heroWa);
  }

  /* ---------- Scrollspy ---------- */
  const navLinks = $$('.nav-menu a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          a.classList.remove('is-active');
          a.removeAttribute('aria-current');
        });
        const link = byId.get(entry.target.id);
        if (link) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'chi-sono', 'servizi', 'trasformazioni', 'prenota', 'contatti']
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((section) => spy.observe(section));
  }

  /* ---------- Reveal on scroll ---------- */
  $$('.pricing, .tf-grid, .reviews, .method-list').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty('--d', `${Math.min(i, 5) * 90}ms`);
    });
  });

  const reveals = $$('.reveal');
  const settle = (el) => {
    // A fine animazione rimuove la classe: gli hover tornano alle loro transizioni
    const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
    window.setTimeout(() => {
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--d');
    }, 850 + delay);
  };

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
        settle(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.remove('reveal'));
  }

  /* ---------- Contatori hero ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = Number(el.dataset.decimals) || 0;
    const fmt = (n) => n.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (reduceMotion.matches || Number.isNaN(target)) return;
    const duration = 1500;
    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  $$('[data-count]').forEach(animateCount);

  /* ---------- Calendario prenotazioni (mock) ---------- */
  const DAYS_AHEAD = 14;
  const SLOTS_WEEKDAY = ['07:00', '08:00', '09:00', '12:30', '13:30', '17:00', '18:00', '19:00', '20:00'];
  const SLOTS_SATURDAY = ['08:00', '09:00', '10:00', '11:00', '12:00'];

  const fmtLong = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtWeekday = new Intl.DateTimeFormat('it-IT', { weekday: 'short' });
  const fmtMonth = new Intl.DateTimeFormat('it-IT', { month: 'short' });
  const fmtMonthName = new Intl.DateTimeFormat('it-IT', { month: 'long' });

  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const stripDot = (s) => s.replace('.', '');

  // Hash FNV-1a: occupazione "casuale" ma deterministica per data e ora
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const bookedThisSession = new Set();

  function slotsFor(date) {
    const wd = date.getDay();
    if (wd === 0) return [];
    return wd === 6 ? SLOTS_SATURDAY : SLOTS_WEEKDAY;
  }

  function isBusy(key, time) {
    if (bookedThisSession.has(`${key} ${time}`)) return true;
    if (hash(`full|${key}`) % 11 === 0) return true; // giornata al completo
    // Le fasce serali e del primo mattino sono le più richieste
    let threshold = 30;
    if (time >= '17:00') threshold += 25;
    if (time <= '07:00') threshold += 10;
    return hash(`${key}|${time}`) % 100 < threshold;
  }

  const freeSlots = (date) => slotsFor(date).filter((t) => !isBusy(dateKey(date), t));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1); // da domani
    return d;
  });

  const form = $('#booking-form');
  const daysEl = $('#cal-days');
  const slotsEl = $('#cal-slots');
  const slotsLegend = $('#slots-legend');
  const monthEl = $('#cal-month');
  const summaryEl = $('#booking-summary');
  const slotErr = $('#err-slot');
  const nextSlotEl = $('#next-slot');

  let selectedDay = null; // Date
  let selectedTime = null; // "HH:MM"
  let submitted = false;

  function renderMonthLabel() {
    const first = days[0];
    const last = days[days.length - 1];
    const m1 = cap(fmtMonthName.format(first));
    const m2 = cap(fmtMonthName.format(last));
    monthEl.textContent = m1 === m2
      ? `${m1} ${first.getFullYear()}`
      : `${m1} – ${m2} ${last.getFullYear()}`;
  }

  function renderDays() {
    daysEl.textContent = '';
    days.forEach((d) => {
      const key = dateKey(d);
      const closed = d.getDay() === 0;
      const free = freeSlots(d).length;
      const state = closed ? 'chiuso' : free === 0 ? 'completo' : `${free} ${free === 1 ? 'orario libero' : 'orari liberi'}`;

      const wrap = document.createElement('div');
      wrap.className = 'day';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'giorno';
      input.id = `day-${key}`;
      input.value = key;
      input.disabled = free === 0;

      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.innerHTML =
        `<span class="day-wd" aria-hidden="true">${stripDot(fmtWeekday.format(d))}</span>` +
        `<span class="day-num" aria-hidden="true">${d.getDate()}</span>` +
        `<span class="day-mo" aria-hidden="true">${stripDot(fmtMonth.format(d))}</span>` +
        `<span class="sr-only">${fmtLong.format(d)}, ${state}</span>`;
      if (free === 0) label.title = cap(state);

      wrap.append(input, label);
      daysEl.append(wrap);
    });
  }

  function renderSlots() {
    slotsEl.textContent = '';
    if (!selectedDay) {
      slotsLegend.textContent = 'Orari disponibili';
      const p = document.createElement('p');
      p.className = 'slots-empty';
      p.textContent = 'Seleziona un giorno per vedere gli orari.';
      slotsEl.append(p);
      return;
    }
    const key = dateKey(selectedDay);
    slotsLegend.textContent = `Orari · ${fmtLong.format(selectedDay)}`;

    slotsFor(selectedDay).forEach((time) => {
      const busy = isBusy(key, time);
      const wrap = document.createElement('div');
      wrap.className = 'slot';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'orario';
      input.id = `slot-${key}-${time.replace(':', '')}`;
      input.value = time;
      input.disabled = busy;
      input.checked = !busy && time === selectedTime;

      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.innerHTML = `<span class="slot-time">${time}</span>` +
        (busy ? '<span class="slot-busy-tag" aria-hidden="true">Occupato</span><span class="sr-only">, occupato</span>' : '');

      wrap.append(input, label);
      slotsEl.append(wrap);
    });
  }

  function updateSummary() {
    if (!selectedDay) {
      summaryEl.textContent = 'Seleziona un giorno e un orario.';
    } else if (!selectedTime) {
      summaryEl.innerHTML = `Hai scelto: <strong>${fmtLong.format(selectedDay)}</strong> · ora scegli un orario.`;
    } else {
      summaryEl.innerHTML = `Hai scelto: <strong>${fmtLong.format(selectedDay)}, ${selectedTime}</strong>`;
    }
  }

  function selectDay(key, time = null) {
    const d = days.find((x) => dateKey(x) === key);
    if (!d || freeSlots(d).length === 0) return;
    selectedDay = d;
    selectedTime = time && !isBusy(key, time) ? time : null;
    const input = document.getElementById(`day-${key}`);
    if (input) input.checked = true;
    renderSlots();
    updateSummary();
    if (submitted) setSlotError(validateSlot());
  }

  function firstAvailable() {
    for (const d of days) {
      const free = freeSlots(d);
      if (free.length) return { day: d, time: free[0] };
    }
    return null;
  }

  function updateNextSlot() {
    const next = firstAvailable();
    if (!next || !nextSlotEl) return;
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const when = dateKey(next.day) === dateKey(tomorrow)
      ? 'domani'
      : `${stripDot(fmtWeekday.format(next.day))} ${next.day.getDate()} ${stripDot(fmtMonth.format(next.day))}`;
    nextSlotEl.innerHTML = `Prossimo posto libero: <strong>${when} alle ${next.time}</strong>`;
  }

  function initCalendar() {
    selectedDay = null;
    selectedTime = null;
    renderMonthLabel();
    renderDays();
    const next = firstAvailable();
    if (next) selectDay(dateKey(next.day));
    else { renderSlots(); updateSummary(); }
    updateNextSlot();
  }

  daysEl.addEventListener('change', (e) => {
    if (e.target.name === 'giorno') selectDay(e.target.value);
  });

  slotsEl.addEventListener('change', (e) => {
    if (e.target.name !== 'orario') return;
    selectedTime = e.target.value;
    updateSummary();
    if (submitted) setSlotError(validateSlot());
  });

  // Il badge in hero preseleziona il primo posto libero
  const heroAvail = $('.hero-availability');
  if (heroAvail) {
    heroAvail.addEventListener('click', () => {
      const next = firstAvailable();
      if (next) selectDay(dateKey(next.day), next.time);
    });
  }

  // Le card prezzi preimpostano il servizio nel form
  const serviceSelect = $('#f-servizio');
  $$('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      serviceSelect.value = btn.dataset.plan;
    });
  });

  /* ---------- Validazione form ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const fields = [
    {
      el: $('#f-nome'),
      err: $('#err-nome'),
      check: (v) => (v.trim().length < 2 ? 'Inserisci nome e cognome.' : ''),
    },
    {
      el: $('#f-email'),
      err: $('#err-email'),
      check: (v) => {
        if (!v.trim()) return 'Inserisci il tuo indirizzo email.';
        return EMAIL_RE.test(v.trim()) ? '' : 'Inserisci un’email valida, ad esempio nome@dominio.it.';
      },
    },
    {
      el: $('#f-tel'),
      err: $('#err-tel'),
      check: (v) => {
        const value = v.trim();
        if (!value) return 'Inserisci un numero di telefono.';
        const digits = value.replace(/\D/g, '');
        if (!/^[+\d\s().-]+$/.test(value) || digits.length < 8 || digits.length > 15) {
          return 'Inserisci un numero valido, con almeno 8 cifre.';
        }
        return '';
      },
    },
    {
      el: $('#f-obiettivo'),
      err: $('#err-obiettivo'),
      check: (v) => (v ? '' : 'Seleziona il tuo obiettivo principale.'),
    },
    {
      el: $('#f-privacy'),
      err: $('#err-privacy'),
      check: (_, el) => (el.checked ? '' : 'Per prenotare è necessario il consenso al trattamento dei dati.'),
    },
  ];

  function setFieldError(field, msg) {
    field.err.textContent = msg;
    if (msg) field.el.setAttribute('aria-invalid', 'true');
    else field.el.removeAttribute('aria-invalid');
  }

  const validateField = (field) => {
    const msg = field.check(field.el.value, field.el);
    setFieldError(field, msg);
    return msg;
  };

  function validateSlot() {
    if (!selectedDay) return 'Scegli un giorno dal calendario.';
    if (!selectedTime) return 'Scegli un orario per il giorno selezionato.';
    return '';
  }

  function setSlotError(msg) {
    slotErr.textContent = msg;
  }

  fields.forEach((field) => {
    const evt = field.el.type === 'checkbox' || field.el.tagName === 'SELECT' ? 'change' : 'input';
    field.el.addEventListener(evt, () => {
      if (submitted || field.el.hasAttribute('aria-invalid')) validateField(field);
    });
    field.el.addEventListener('blur', () => {
      if (submitted || (field.el.value && field.el.type !== 'checkbox')) validateField(field);
    });
  });

  const note = $('#f-note');
  const noteCount = $('#note-count');
  const updateNoteCount = () => {
    noteCount.textContent = `${note.value.length}/${note.maxLength} caratteri`;
  };
  note.addEventListener('input', updateNoteCount);

  const statusEl = $('#form-status');
  function announce(msg) {
    statusEl.textContent = '';
    if (msg) window.setTimeout(() => { statusEl.textContent = msg; }, 60);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitted = true;

    const invalid = [];
    const slotMsg = validateSlot();
    setSlotError(slotMsg);
    if (slotMsg) {
      const target = selectedDay
        ? $('input[name="orario"]:not(:disabled)', slotsEl)
        : $('input[name="giorno"]:not(:disabled)', daysEl);
      invalid.push(target);
    }
    fields.forEach((field) => {
      if (validateField(field)) invalid.push(field.el);
    });

    if (invalid.length) {
      announce(invalid.length === 1
        ? 'C’è un campo da completare o correggere.'
        : `Ci sono ${invalid.length} campi da completare o correggere.`);
      if (invalid[0]) invalid[0].focus();
      return;
    }

    announce('');
    showSuccess();
  });

  /* ---------- Successo ---------- */
  const success = $('#booking-success');
  const successTitle = $('#success-title');

  function out(name, value) {
    $$(`[data-out="${name}"]`, success).forEach((el) => { el.textContent = value; });
  }

  function showSuccess() {
    const data = new FormData(form);
    const dayLabel = fmtLong.format(selectedDay);
    const firstName = String(data.get('nome')).trim().split(/\s+/)[0];

    out('nome', firstName);
    out('quando', `${dayLabel} alle ${selectedTime}`);
    out('quando-full', `${cap(dayLabel)}, ore ${selectedTime} · 60 minuti`);
    out('servizio', String(data.get('servizio')));
    out('obiettivo', String(data.get('obiettivo')));
    out('email', String(data.get('email')).trim());
    out('telefono', String(data.get('telefono')).trim());

    bookedThisSession.add(`${dateKey(selectedDay)} ${selectedTime}`);

    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    successTitle.focus({ preventScroll: true });
  }

  $('#booking-reset').addEventListener('click', () => {
    form.reset();
    submitted = false;
    fields.forEach((field) => setFieldError(field, ''));
    setSlotError('');
    announce('');
    updateNoteCount();
    initCalendar();
    success.hidden = true;
    form.hidden = false;
    $('#f-nome').focus();
  });

  initCalendar();
  updateNoteCount();

  /* ---------- Varie ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
