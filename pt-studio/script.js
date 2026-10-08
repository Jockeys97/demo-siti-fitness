/* Studio Lume — calendario dimostrativo, nessun invio o salvataggio di dati. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const toggle = $('.nav-toggle');
  const menu = $('#nav-menu');
  const desktop = window.matchMedia('(min-width: 64em)');
  function setMenu(open, focus = false) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Chiudi menu' : 'Apri menu';
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (focus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  desktop.addEventListener('change', () => setMenu(false));

  // Hide the floating shortcut around the mobile form so it cannot cover fields.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      document.body.classList.toggle('booking-in-view', entry.isIntersecting);
    });
    observer.observe($('#prenota'));
  }

  const form = $('#booking-form');
  const daysEl = $('#cal-days');
  const slotsEl = $('#cal-slots');
  const service = $('#service');
  const name = $('#name');
  const phone = $('#phone');
  const status = $('#form-status');
  const success = $('#booking-success');
  const longDate = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const shortDay = new Intl.DateTimeFormat('it-IT', { weekday: 'short' });
  const shortMonth = new Intl.DateTimeFormat('it-IT', { month: 'short' });
  let days = [];
  let selectedDay = null;
  let selectedTime = null;
  let attempted = false;
  function dateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
  function hash(value) {
    let result = 2166136261;
    for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
    return result >>> 0;
  }
  function timesFor(date) {
    return date.getDay() === 6 ? ['08:00', '09:30', '11:00'] : ['07:00', '08:00', '09:30', '12:30', '17:30', '18:30', '19:30'];
  }
  function isPast(date, time) {
    // Today's slots starting within the next hour (or already gone) are not bookable.
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    return start.getTime() < Date.now() + 60 * 60 * 1000;
  }
  function busy(date, index) {
    // Rotating pattern guarantees both free and occupied slots every open day.
    return (hash(dateKey(date)) + index) % 3 === 0;
  }
  function summary() {
    $('#booking-summary').textContent = selectedDay
      ? `${longDate.format(selectedDay)}${selectedTime ? ` · ore ${selectedTime}` : ' · scegli un orario.'}`
      : 'Scegli un giorno e un orario.';
  }
  function slotError() {
    const message = !selectedDay ? 'Scegli un giorno dal calendario.' : !selectedTime ? 'Scegli un orario disponibile.' : '';
    $('#err-slot').textContent = message;
    return message;
  }
  function renderSlots() {
    slotsEl.replaceChildren();
    $('#slots-title').textContent = `2. Orari · ${longDate.format(selectedDay)}`;
    timesFor(selectedDay).forEach((time, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot';
      const past = isPast(selectedDay, time);
      button.disabled = past || busy(selectedDay, index);
      button.setAttribute('aria-pressed', 'false');
      button.textContent = time;
      if (button.disabled) {
        const label = document.createElement('span');
        label.textContent = past ? 'Non disponibile' : 'Occupato';
        button.append(label);
      }
      button.addEventListener('click', () => {
        selectedTime = time;
        slotsEl.querySelectorAll('button').forEach((slot) => slot.setAttribute('aria-pressed', String(slot === button)));
        summary();
        if (attempted) slotError();
      });
      slotsEl.append(button);
    });
  }
  function initCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
    selectedDay = null;
    selectedTime = null;
    daysEl.replaceChildren();
    days.forEach((date) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'day';
      const closed = date.getDay() === 0;
      const full = !closed && timesFor(date).every((time, index) => isPast(date, time) || busy(date, index));
      const note = closed ? 'Chiuso' : full ? 'Completo' : '';
      button.disabled = closed || full;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `${longDate.format(date)}${note ? `, ${note.toLowerCase()}` : ''}`);
      // Only generated dates are used here; user input is always rendered via textContent.
      button.innerHTML = `<span>${shortDay.format(date)}</span><strong>${date.getDate()}</strong><span>${shortMonth.format(date)}</span>${note ? `<small>${note}</small>` : ''}`;
      button.addEventListener('click', () => {
        selectedDay = date;
        selectedTime = null;
        daysEl.querySelectorAll('button').forEach((day) => day.setAttribute('aria-pressed', String(day === button)));
        renderSlots();
        summary();
        if (attempted) slotError();
      });
      daysEl.append(button);
    });
    slotsEl.innerHTML = '<p>Seleziona un giorno per vedere gli orari.</p>';
    $('#slots-title').textContent = '2. Scegli l’orario';
    summary();
  }
  function validateField(input) {
    const value = input.value.trim();
    let error = '';
    if (input === name && value.length < 2) error = 'Inserisci il tuo nome (almeno 2 caratteri).';
    if (input === phone && (!/^[+\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 8 || value.replace(/\D/g, '').length > 15)) {
      error = 'Inserisci un telefono valido, da 8 a 15 cifre.';
    }
    $(`#err-${input.id}`).textContent = error;
    if (error) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return error;
  }
  [name, phone].forEach((input) => input.addEventListener('input', () => {
    if (attempted) validateField(input);
  }));
  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', () => { service.value = link.dataset.service; });
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    attempted = true;
    const invalidSlot = slotError();
    const invalidName = validateField(name);
    const invalidPhone = validateField(phone);
    if (invalidSlot || invalidName || invalidPhone || !service.value) {
      status.textContent = 'Completa i campi indicati per provare la prenotazione.';
      const first = invalidSlot ? (selectedDay ? slotsEl : daysEl).querySelector('button:not(:disabled)') : invalidName ? name : invalidPhone ? phone : service;
      first.focus();
      return;
    }
    $('#success-copy').textContent = `Grazie ${name.value.trim()}! Ti aspettiamo ${longDate.format(selectedDay)} alle ${selectedTime}.`;
    $('#success-service').textContent = service.options[service.selectedIndex].textContent;
    form.hidden = true;
    success.hidden = false;
    $('#success-title').focus();
  });
  $('#booking-reset').addEventListener('click', () => {
    form.reset();
    attempted = false;
    [name, phone].forEach((input) => {
      input.removeAttribute('aria-invalid');
      $(`#err-${input.id}`).textContent = '';
    });
    status.textContent = '';
    $('#err-slot').textContent = '';
    success.hidden = true;
    form.hidden = false;
    initCalendar();
    daysEl.querySelector('button:not(:disabled)').focus();
  });
  initCalendar();
  $('.submit').disabled = false;
})();
