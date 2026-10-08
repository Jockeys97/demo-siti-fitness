/* Forgia Fitness Club — sito dimostrativo
   JavaScript vanilla, nessuna dipendenza. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMediaChange = (mq, fn) => (mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener(fn));

  /* ---------- Giorno e ora correnti (fuso di Roma) ---------- */
  function romeNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      const get = (type) => parts.find((p) => p.type === type).value;
      const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[get('weekday')], minutes: Number(get('hour')) * 60 + Number(get('minute')) };
    } catch (err) {
      const d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }
  const now = romeNow();

  /* ---------- Header: sfondo allo scroll ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const nav = $('#nav');
  const toggle = $('.nav__toggle', nav);
  const panel = $('#nav-panel');
  const desktopNav = window.matchMedia('(min-width: 60em)');
  const outsideMenu = [$('main'), $('.site-footer'), $('.wa-float')];

  function setMenu(open, restoreFocus) {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    outsideMenu.forEach((el) => { if (el) el.inert = open; });
    if (open) {
      const firstLink = $('a', panel);
      if (firstLink) firstLink.focus();
    } else if (restoreFocus) {
      toggle.focus();
    }
  }
  const menuIsOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  toggle.addEventListener('click', () => setMenu(!menuIsOpen(), false));
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a') && menuIsOpen()) setMenu(false, false);
  });
  document.addEventListener('keydown', (e) => {
    if (!menuIsOpen()) return;
    if (e.key === 'Escape') {
      setMenu(false, true);
      return;
    }
    // Mantiene il focus nell'header mentre il menu è aperto
    if (e.key === 'Tab') {
      const focusables = $$('a[href], button:not([disabled])', header).filter((el) => el.offsetParent !== null);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  onMediaChange(desktopNav, (e) => { if (e.matches && menuIsOpen()) setMenu(false, false); });

  /* ---------- Link attivo nel menu ---------- */
  const navLinks = $$('.nav__list a');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const hash = '#' + entry.target.id;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === hash) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- Comparsa al scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    reveals.forEach((el) => {
      const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
      const index = siblings.indexOf(el);
      if (index > 0) el.style.setProperty('--d', (Math.min(index, 4) * 0.08).toFixed(2) + 's');
      revealer.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ==========================================================================
     ORARI DEI CORSI
     ========================================================================== */
  const TYPES = {
    functional: { label: 'Functional', color: 'var(--t-functional)' },
    cross: { label: 'Cross Training', color: 'var(--t-cross)' },
    spinning: { label: 'Spinning', color: 'var(--t-spinning)' },
    total: { label: 'Total Body', color: 'var(--t-total)' },
    boxe: { label: 'Boxe', color: 'var(--t-boxe)' },
    yoga: { label: 'Yoga', color: 'var(--t-yoga)' },
    pilates: { label: 'Pilates', color: 'var(--t-pilates)' }
  };

  const DAYS = [
    { short: 'Lun', name: 'Lunedì' },
    { short: 'Mar', name: 'Martedì' },
    { short: 'Mer', name: 'Mercoledì' },
    { short: 'Gio', name: 'Giovedì' },
    { short: 'Ven', name: 'Venerdì' },
    { short: 'Sab', name: 'Sabato' }
  ];

  // [orario, tipo, durata in minuti, istruttore]
  const SCHEDULE = [
    [['07:00', 'functional', 45, 'Giulia'], ['09:30', 'pilates', 50, 'Elena'], ['13:15', 'total', 45, 'Davide'], ['18:00', 'spinning', 45, 'Luca'], ['19:00', 'cross', 60, 'Davide'], ['20:15', 'yoga', 60, 'Elena']],
    [['07:00', 'spinning', 45, 'Giulia'], ['10:00', 'yoga', 60, 'Elena'], ['13:15', 'functional', 45, 'Giulia'], ['18:30', 'boxe', 60, 'Luca'], ['19:45', 'pilates', 50, 'Elena']],
    [['07:00', 'cross', 50, 'Davide'], ['09:30', 'pilates', 50, 'Elena'], ['13:15', 'spinning', 45, 'Luca'], ['18:00', 'functional', 45, 'Giulia'], ['19:00', 'total', 45, 'Davide'], ['20:15', 'boxe', 60, 'Luca']],
    [['07:00', 'functional', 45, 'Giulia'], ['10:00', 'yoga', 60, 'Elena'], ['13:15', 'total', 45, 'Davide'], ['18:30', 'boxe', 60, 'Luca'], ['19:45', 'spinning', 45, 'Giulia']],
    [['07:00', 'spinning', 45, 'Luca'], ['09:30', 'pilates', 50, 'Elena'], ['13:15', 'functional', 45, 'Giulia'], ['18:00', 'cross', 60, 'Davide'], ['19:15', 'yoga', 60, 'Elena']],
    [['09:00', 'functional', 45, 'Giulia'], ['10:00', 'spinning', 45, 'Luca'], ['11:00', 'pilates', 50, 'Elena'], ['12:00', 'cross', 60, 'Davide']]
  ];

  const tabsEl = $('#schedule-tabs');
  const gridEl = $('#schedule-grid');
  const filtersEl = $('#filters');
  const scheduleStatus = $('#schedule-status');

  if (tabsEl && gridEl && filtersEl) {
    const todayIndex = now.day === 0 ? -1 : now.day - 1; // domenica: nessun corso
    let activeIndex = todayIndex >= 0 ? todayIndex : 0;
    const desktopSchedule = window.matchMedia('(min-width: 64em)');

    const tabs = [];
    const panels = [];

    DAYS.forEach((day, i) => {
      const isToday = i === todayIndex;

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tab';
      tab.id = 'tab-' + i;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'panel-' + i);
      tab.innerHTML =
        `<span class="tab__day" aria-hidden="true">${day.short}</span>` +
        `<span class="sr-only">${day.name}${isToday ? ', oggi' : ''},</span>` +
        '<span class="tab__count"></span>' +
        (isToday ? '<span class="tab__today" aria-hidden="true">Oggi</span>' : '');
      tabsEl.appendChild(tab);
      tabs.push(tab);

      const dayPanel = document.createElement('div');
      dayPanel.className = 'schedule__day' + (isToday ? ' is-today' : '');
      dayPanel.id = 'panel-' + i;

      const cards = SCHEDULE[i].map(([time, type, duration, coach]) =>
        `<li class="class-card" data-type="${type}" style="--c: ${TYPES[type].color}">` +
          `<span class="class-card__time"><time>${time}</time></span>` +
          `<span class="class-card__name">${TYPES[type].label}</span>` +
          `<span class="class-card__meta">${duration} min · con <strong>${coach}</strong></span>` +
        '</li>'
      ).join('');

      dayPanel.innerHTML =
        `<h3 class="schedule__dayname" id="dayname-${i}">${day.name}` +
          (isToday ? ' <span class="schedule__today-label">Oggi</span>' : '') +
        '</h3>' +
        `<ul class="schedule__list" aria-labelledby="dayname-${i}">${cards}<li class="schedule__empty" hidden></li></ul>`;
      gridEl.appendChild(dayPanel);
      panels.push(dayPanel);
    });

    // Desktop: griglia settimanale. Mobile: tab per giorno (pattern ARIA tabs).
    function applyScheduleMode() {
      const desktop = desktopSchedule.matches;
      tabsEl.hidden = desktop;
      panels.forEach((p, i) => {
        if (desktop) {
          p.removeAttribute('role');
          p.removeAttribute('aria-labelledby');
          p.removeAttribute('tabindex');
          p.hidden = false;
        } else {
          p.setAttribute('role', 'tabpanel');
          p.setAttribute('aria-labelledby', 'tab-' + i);
          p.tabIndex = 0;
          p.hidden = i !== activeIndex;
        }
      });
      if (!desktop) scrollTabIntoView(activeIndex, false);
    }

    function scrollTabIntoView(i, smooth) {
      const tab = tabs[i];
      const left = tab.offsetLeft - (tabsEl.clientWidth - tab.offsetWidth) / 2;
      tabsEl.scrollTo({ left: Math.max(0, left), behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto' });
    }

    function selectTab(i, moveFocus) {
      activeIndex = i;
      tabs.forEach((t, j) => {
        const selected = j === i;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
      });
      if (!desktopSchedule.matches) panels.forEach((p, j) => { p.hidden = j !== i; });
      if (moveFocus) tabs[i].focus();
      scrollTabIntoView(i, true);
    }

    tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) selectTab(tabs.indexOf(tab), false);
    });

    tabsEl.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        selectTab(next, true);
      }
    });

    // Filtri per tipo di corso
    ['all', ...Object.keys(TYPES)].forEach((key) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.filter = key;
      chip.setAttribute('aria-pressed', String(key === 'all'));
      chip.innerHTML = key === 'all'
        ? 'Tutti i corsi'
        : `<span class="chip__dot" style="--c: ${TYPES[key].color}" aria-hidden="true"></span>${TYPES[key].label}`;
      filtersEl.appendChild(chip);
    });

    function applyFilter(key, announce) {
      $$('.chip', filtersEl).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === key)));
      let total = 0;
      panels.forEach((p, i) => {
        let count = 0;
        $$('.class-card', p).forEach((card) => {
          const visible = key === 'all' || card.dataset.type === key;
          card.hidden = !visible;
          if (visible) count += 1;
        });
        const empty = $('.schedule__empty', p);
        empty.hidden = count > 0;
        if (!count) empty.textContent = `Nessuna lezione di ${TYPES[key].label} il ${DAYS[i].name.toLowerCase()}.`;
        $('.tab__count', tabs[i]).textContent = count === 1 ? '1 corso' : `${count} corsi`;
        tabs[i].classList.toggle('is-empty', count === 0);
        total += count;
      });
      if (announce) {
        scheduleStatus.textContent = key === 'all'
          ? `Mostrati tutti i ${total} corsi della settimana.`
          : `${TYPES[key].label}: ${total} ${total === 1 ? 'lezione' : 'lezioni'} in settimana.`;
      }
    }

    // Su mobile i filtri scorrono in orizzontale: la sfumatura sparisce a fine corsa
    const updateFilterFade = () => {
      filtersEl.classList.toggle('is-end', filtersEl.scrollLeft + filtersEl.clientWidth >= filtersEl.scrollWidth - 4);
    };
    filtersEl.addEventListener('scroll', updateFilterFade, { passive: true });
    window.addEventListener('resize', updateFilterFade);
    updateFilterFade();

    filtersEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) applyFilter(chip.dataset.filter, true);
    });

    selectTab(activeIndex, false);
    applyFilter('all', false);
    applyScheduleMode();
    onMediaChange(desktopSchedule, applyScheduleMode);
  }

  /* ==========================================================================
     ABBONAMENTI: mensile / annuale
     ========================================================================== */
  const billingStatus = $('#billing-status');
  $$('input[name="billing"]').forEach((input) => {
    input.addEventListener('change', () => {
      const mode = input.value; // "monthly" | "yearly"
      $$('[data-monthly][data-yearly]').forEach((el) => {
        el.textContent = el.dataset[mode];
        if (!reducedMotion.matches) {
          el.classList.remove('is-swapping');
          void el.offsetWidth; // riavvia l'animazione
          el.classList.add('is-swapping');
        }
      });
      billingStatus.textContent = mode === 'yearly'
        ? 'Prezzi aggiornati: pagamento annuale, 2 mesi in omaggio.'
        : 'Prezzi aggiornati: pagamento mensile.';
    });
  });

  // I bottoni dei piani precompilano l'abbonamento nel modulo
  const planSelect = $('#f-piano');
  $$('[data-plan]').forEach((link) => {
    link.addEventListener('click', () => { if (planSelect) planSelect.value = link.dataset.plan; });
  });

  /* ==========================================================================
     MODULO PROVA GRATUITA (solo validazione client-side, nessun invio)
     ========================================================================== */
  const form = $('#trial-form');
  if (form) {
    const success = $('#form-success');
    const formStatus = $('#form-status');
    const submitBtn = $('button[type="submit"]', form);
    const submitLabel = $('.btn__label', submitBtn);
    const submitLabelHTML = submitLabel.innerHTML;
    const NAME_RE = /^[\p{L}][\p{L}' .-]*$/u;
    const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

    const nameRule = (label) => (v) => {
      const s = v.trim();
      if (!s) return `Inserisci il tuo ${label}.`;
      if (s.length < 2) return `Il ${label} deve avere almeno 2 caratteri.`;
      if (!NAME_RE.test(s)) return `Il ${label} può contenere solo lettere, spazi e apostrofi.`;
      return '';
    };

    const fields = {
      nome: { el: $('#f-nome'), rule: nameRule('nome') },
      cognome: { el: $('#f-cognome'), rule: nameRule('cognome') },
      email: {
        el: $('#f-email'),
        rule: (v) => {
          if (!v.trim()) return 'Inserisci la tua email.';
          if (!EMAIL_RE.test(v.trim())) return "Controlla l'email: dovrebbe essere nel formato nome@esempio.it.";
          return '';
        }
      },
      telefono: {
        el: $('#f-tel'),
        rule: (v) => {
          if (!v.trim()) return 'Inserisci un numero di telefono.';
          if (!/^\+?\d{8,15}$/.test(v.replace(/[\s.\-()/]/g, ''))) return 'Numero non valido: usa solo cifre, ad esempio 333 123 4567.';
          return '';
        }
      },
      giorno: { el: $('#f-giorno'), rule: (v) => (v ? '' : 'Scegli il giorno in cui preferisci venire.') },
      interesse: { el: $('#f-interesse'), rule: (v) => (v ? '' : 'Dicci cosa ti piacerebbe provare.') },
      privacy: {
        el: $('#f-privacy'),
        rule: (v, el) => (el.checked ? '' : "Per inviare la richiesta devi accettare l'informativa privacy.")
      }
    };

    const errorEl = (field) => document.getElementById(field.el.id + '-err');

    function setError(field, message) {
      if (message) field.el.setAttribute('aria-invalid', 'true');
      else field.el.removeAttribute('aria-invalid');
      errorEl(field).textContent = message;
    }

    function validate(name) {
      const field = fields[name];
      const message = field.rule(field.el.value, field.el);
      setError(field, message);
      return !message;
    }

    Object.keys(fields).forEach((name) => {
      const el = fields[name].el;
      const isChoice = el.type === 'checkbox' || el.tagName === 'SELECT';
      // Validazione "gentile": all'uscita dal campo solo se compilato, poi in tempo reale se c'è un errore
      el.addEventListener(isChoice ? 'change' : 'blur', () => {
        if (isChoice || el.value.trim() || el.hasAttribute('aria-invalid')) validate(name);
      });
      el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true') validate(name);
      });
    });

    let submitting = false;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitting) return;

      const invalid = Object.keys(fields).filter((name) => !validate(name));
      if (invalid.length) {
        formStatus.textContent = invalid.length === 1
          ? 'Richiesta non inviata: correggi il campo evidenziato.'
          : `Richiesta non inviata: correggi i ${invalid.length} campi evidenziati.`;
        fields[invalid[0]].el.focus();
        return;
      }

      formStatus.textContent = '';
      submitting = true;
      submitBtn.setAttribute('aria-disabled', 'true');
      submitLabel.textContent = 'Invio in corso…';

      // Demo: simuliamo l'invio, nessun dato lascia il browser.
      window.setTimeout(() => {
        showSuccess({
          nome: fields.nome.el.value.trim(),
          telefono: fields.telefono.el.value.trim(),
          giorno: fields.giorno.el.value,
          interesse: fields.interesse.el.value
        });
        submitting = false;
        submitBtn.removeAttribute('aria-disabled');
        submitLabel.innerHTML = submitLabelHTML;
      }, 900);
    });

    function showSuccess(data) {
      const strong = (text) => {
        const s = document.createElement('strong');
        s.textContent = text;
        return s;
      };
      $('#success-title').textContent = `Grazie, ${data.nome}!`;

      const p = $('#success-text');
      p.textContent = '';
      const unsure = data.interesse.startsWith('Non so');
      const activity = data.interesse === 'Sala pesi' ? 'in sala pesi' : 'di ' + data.interesse;
      p.append(
        'Ti chiameremo entro 24 ore al ', strong(data.telefono),
        unsure ? ' per fissare la tua prova di ' : ` per fissare l'orario della tua prova ${activity} di `,
        strong(data.giorno),
        unsure ? ': ti consiglieremo noi da dove partire.' : '.'
      );

      form.hidden = true;
      success.hidden = false;
      success.focus();
      success.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }

    $('#form-reset').addEventListener('click', () => {
      form.reset();
      Object.values(fields).forEach((field) => setError(field, ''));
      formStatus.textContent = '';
      success.hidden = true;
      form.hidden = false;
      fields.nome.el.focus();
    });
  }

  /* ==========================================================================
     ORARI DI APERTURA: aperto ora / chiuso
     ========================================================================== */
  const OPENING = { 0: [540, 840], 1: [390, 1350], 2: [390, 1350], 3: [390, 1350], 4: [390, 1350], 5: [390, 1350], 6: [480, 1200] };
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const openStatus = $('#open-status');

  if (openStatus) {
    const [opens, closes] = OPENING[now.day];
    let text;
    let isOpen = false;
    if (now.minutes >= opens && now.minutes < closes) {
      isOpen = true;
      text = `Aperto ora · chiude alle ${fmt(closes)}`;
    } else if (now.minutes < opens) {
      text = `Chiuso ora · apre alle ${fmt(opens)}`;
    } else {
      text = `Chiuso ora · apre domani alle ${fmt(OPENING[(now.day + 1) % 7][0])}`;
    }
    openStatus.textContent = text;
    openStatus.classList.toggle('is-open', isOpen);
    openStatus.hidden = false;
  }

  $$('.hours__table tr[data-days]').forEach((row) => {
    const days = row.dataset.days.split(',').map(Number);
    row.classList.toggle('is-today', days.includes(now.day));
  });
})();
