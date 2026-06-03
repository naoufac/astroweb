// app.js - Main Frontend Application
// Handles routing, data fetching, state management, and UI orchestration

(function() {
  'use strict';

  // ----- State -----
  const state = {
    currentView: 'input',
    natalData: null,
    transitData: null,
    aspectData: null,
    loading: false,
    error: null,
    selectedPlanet: null,
    lastInput: null
  };

  // ----- Components -----
  let birthChart;
  let transitView;
  let aspectGrid;

  // ----- DOM Elements -----
  const views = {
    input: document.getElementById('view-input'),
    chart: document.getElementById('view-chart'),
    transit: document.getElementById('view-transit'),
    aspects: document.getElementById('view-aspects')
  };

  const tabs = {
    input: document.getElementById('tab-input'),
    chart: document.getElementById('tab-chart'),
    transit: document.getElementById('tab-transit'),
    aspects: document.getElementById('tab-aspects')
  };

  const loadingEl = document.getElementById('loading-overlay');
  const errorEl = document.getElementById('error-box');
  const errorText = document.getElementById('error-text');

  // ----- Init -----
  function init() {
    birthChart = new BirthChart('.chart-wheel-container');
    transitView = new TransitView('#transit-view-content');
    aspectGrid = new AspectGrid('#aspect-grid-content');

    bindEvents();
    loadFromStorage();
    showView('input');
  }

  // ----- Event Binding -----
  function bindEvents() {
    // Tab navigation
    Object.keys(tabs).forEach(key => {
      tabs[key].addEventListener('click', () => {
        if (key === 'chart' && !state.natalData) return;
        if (key === 'transit' && !state.transitData) return;
        if (key === 'aspects' && !state.aspectData) return;
        showView(key);
      });
    });

    // Form submission
    const form = document.getElementById('birth-form');
    form.addEventListener('submit', handleFormSubmit);

    // Planet selection in details
    document.addEventListener('planetSelected', (e) => {
      state.selectedPlanet = e.detail.planet;
      updatePlanetDetails(e.detail.planet, e.detail.chartData);
    });

    // Clear stored data
    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearStoredData);
    }
  }

  // ----- View Management -----
  function showView(name) {
    state.currentView = name;

    // Update tabs
    Object.keys(tabs).forEach(key => {
      tabs[key].classList.toggle('active', key === name);
    });

    // Update views
    Object.keys(views).forEach(key => {
      views[key].classList.toggle('active', key === name);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ----- Form Handler -----
  async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const input = {
      birthDate: formData.get('birthDate'),
      birthTime: formData.get('birthTime'),
      latitude: parseFloat(formData.get('latitude')),
      longitude: parseFloat(formData.get('longitude')),
      houseSystem: formData.get('houseSystem')
    };

    // Basic validation
    if (!input.birthDate || !input.birthTime) {
      showError('Please enter your birth date and time.');
      return;
    }

    if (isNaN(input.latitude) || isNaN(input.longitude)) {
      showError('Please enter valid latitude and longitude coordinates.');
      return;
    }

    if (input.latitude < -90 || input.latitude > 90 || input.longitude < -180 || input.longitude > 180) {
      showError('Latitude must be between -90 and 90. Longitude must be between -180 and 180.');
      return;
    }

    hideError();
    showLoading(true);

    try {
      state.lastInput = input;
      saveToStorage(input);

      // Fetch all data in parallel
      const [natalRes, transitRes, aspectsRes] = await Promise.all([
        fetchJSON('/api/chart', 'POST', input),
        fetchJSON('/api/transits', 'POST', input),
        fetchJSON('/api/aspects', 'POST', input)
      ]);

      if (!natalRes.success) throw new Error(natalRes.error || 'Failed to calculate birth chart');
      if (!transitRes.success) throw new Error(transitRes.error || 'Failed to calculate transits');
      if (!aspectsRes.success) throw new Error(aspectsRes.error || 'Failed to calculate aspects');

      state.natalData = natalRes.data;
      state.transitData = transitRes.data;
      state.aspectData = aspectsRes.data;

      // Render all views
      birthChart.render(state.natalData);
      transitView.render(state.transitData, state.natalData);
      aspectGrid.render(state.aspectData);

      showLoading(false);
      showView('chart');

    } catch (err) {
      showLoading(false);
      showError(err.message || 'An error occurred. Please try again.');
    }
  }

  // ----- API Helpers -----
  async function fetchJSON(url, method = 'GET', body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, options);
      const data = await res.json();
      return data;
    } catch (err) {
      // If API not available, generate demo data
      if (url.includes('/api/chart')) {
        return { success: true, data: generateDemoNatal(body) };
      }
      if (url.includes('/api/transits')) {
        return { success: true, data: generateDemoTransits() };
      }
      if (url.includes('/api/aspects')) {
        return { success: true, data: generateDemoAspects() };
      }
      throw err;
    }
  }

  // ----- Demo Data Generators (when API unavailable) -----
  function generateDemoNatal(input) {
    const planets = [
      { name: 'Sun', sign: 'Aries', position: randBetween(0, 30), house: randBetween(1, 12) },
      { name: 'Moon', sign: 'Cancer', position: randBetween(90, 120), house: randBetween(1, 12) },
      { name: 'Mercury', sign: 'Taurus', position: randBetween(30, 60), house: randBetween(1, 12) },
      { name: 'Venus', sign: 'Pisces', position: randBetween(330, 360), house: randBetween(1, 12) },
      { name: 'Mars', sign: 'Capricorn', position: randBetween(270, 300), house: randBetween(1, 12) },
      { name: 'Jupiter', sign: 'Sagittarius', position: randBetween(240, 270), house: randBetween(1, 12) },
      { name: 'Saturn', sign: 'Virgo', position: randBetween(150, 180), house: randBetween(1, 12) },
      { name: 'Uranus', sign: 'Scorpio', position: randBetween(210, 240), house: randBetween(1, 12) },
      { name: 'Neptune', sign: 'Sagittarius', position: randBetween(240, 270), house: randBetween(1, 12) },
      { name: 'Pluto', sign: 'Libra', position: randBetween(180, 210), house: randBetween(1, 12) }
    ];

    const houses = Array.from({ length: 12 }, (_, i) => ({
      start: (i * 30) % 360,
      end: ((i + 1) * 30) % 360
    }));

    const aspects = [
      { planet1: 'Sun', planet2: 'Moon', type: 'trine', orb: 3.2 },
      { planet1: 'Sun', planet2: 'Mars', type: 'conjunction', orb: 0.8 },
      { planet1: 'Venus', planet2: 'Jupiter', type: 'trine', orb: 2.1 },
      { planet1: 'Mercury', planet2: 'Saturn', type: 'square', orb: 4.5 },
      { planet1: 'Moon', planet2: 'Uranus', type: 'opposition', orb: 1.8 },
      { planet1: 'Mars', planet2: 'Pluto', type: 'square', orb: 3.0 }
    ];

    return { planets, houses, aspects, input };
  }

  function generateDemoTransits() {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

    const planets = [
      { name: 'Sun', sign: signs[dayOfYear % 12], degree: (dayOfYear * 1.5) % 360 },
      { name: 'Moon', sign: signs[(dayOfYear * 2) % 12], degree: (dayOfYear * 5) % 360 },
      { name: 'Mercury', sign: signs[(dayOfYear + 2) % 12], degree: (dayOfYear * 0.8) % 360 },
      { name: 'Venus', sign: signs[(dayOfYear + 5) % 12], degree: (dayOfYear * 1.2) % 360 },
      { name: 'Mars', sign: signs[(dayOfYear + 1) % 12], degree: (dayOfYear * 1.8) % 360 },
      { name: 'Jupiter', sign: signs[(dayOfYear + 3) % 12], degree: (dayOfYear * 0.3) % 360 },
      { name: 'Saturn', sign: signs[(dayOfYear + 7) % 12], degree: (dayOfYear * 0.2) % 360 },
      { name: 'Uranus', sign: signs[(dayOfYear + 9) % 12], degree: (dayOfYear * 0.1) % 360 },
      { name: 'Neptune', sign: signs[(dayOfYear + 11) % 12], degree: (dayOfYear * 0.08) % 360 },
      { name: 'Pluto', sign: signs[(dayOfYear + 4) % 12], degree: (dayOfYear * 0.05) % 360 }
    ];

    const aspects = [
      { planet1: 'Sun', planet2: 'Saturn', type: 'square', orb: 1.5 },
      { planet1: 'Moon', planet2: 'Mars', type: 'square', orb: 0.8 },
      { planet1: 'Venus', planet2: 'Jupiter', type: 'trine', orb: 2.2 },
      { planet1: 'Mercury', planet2: 'Neptune', type: 'sextile', orb: 3.1 }
    ];

    return { planets, aspects, date: now.toISOString() };
  }

  function generateDemoAspects() {
    const aspects = [
      { planet1: 'Sun', planet2: 'Moon', type: 'trine', degree1: 15.2, degree2: 17.4, orb: 2.2 },
      { planet1: 'Sun', planet2: 'Mars', type: 'conjunction', degree1: 15.2, degree2: 14.8, orb: 0.4 },
      { planet1: 'Venus', planet2: 'Jupiter', type: 'trine', degree1: 8.5, degree2: 12.3, orb: 3.8 },
      { planet1: 'Mercury', planet2: 'Saturn', type: 'square', degree1: 22.1, degree2: 18.6, orb: 3.5 },
      { planet1: 'Moon', planet2: 'Uranus', type: 'opposition', degree1: 5.8, degree2: 3.2, orb: 2.6 },
      { planet1: 'Mars', planet2: 'Pluto', type: 'square', degree1: 28.4, degree2: 25.1, orb: 3.3 },
      { planet1: 'Jupiter', planet2: 'Saturn', type: 'sextile', degree1: 3.7, degree2: 18.6, orb: 5.1 },
      { planet1: 'Neptune', planet2: 'Pluto', type: 'trine', degree1: 14.2, degree2: 25.1, orb: 1.1 },
      { planet1: 'Sun', planet2: 'Venus', type: 'sextile', degree1: 15.2, degree2: 8.5, orb: 6.7 },
      { planet1: 'Moon', planet2: 'Mercury', type: 'conjunction', degree1: 5.8, degree2: 22.1, orb: 3.7 }
    ];

    return { aspects };
  }

  function randBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  // ----- Planet Details Panel -----
  function updatePlanetDetails(planetName, chartData) {
    const panel = document.getElementById('planet-details-panel');
    if (!panel || !chartData || !chartData.planets) return;

    const planet = chartData.planets.find(p => p.name === planetName);
    if (!planet) return;

    // Update selected state in list
    document.querySelectorAll('.planet-select-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.planet === planetName);
    });

    // Build details HTML
    const signSymbol = getSignSymbol(planet.sign);

    document.getElementById('detail-planet-name').textContent = planet.name;
    document.getElementById('detail-planet-sign').innerHTML = `${signSymbol} ${planet.sign}`;
    document.getElementById('detail-planet-degree').textContent = `${Math.floor(planet.position)}°${Math.round((planet.position % 1) * 60)}'`;
    document.getElementById('detail-planet-house').textContent = `House ${planet.house}`;

    // Update all planet details in the list
    const listContainer = document.getElementById('planet-details-list');
    listContainer.innerHTML = chartData.planets.map(p => {
      const pSignSymbol = getSignSymbol(p.sign);
      return `
        <div class="detail-row">
          <span class="planet-name">
            <span class="dot" style="background:${getPlanetColor(p.name)}"></span>
            ${p.name}
          </span>
          <span class="planet-value">
            <span class="sign">${pSignSymbol} ${p.sign}</span>
            <span class="degree">${Math.floor(p.position)}°</span>
            <span class="house-num">H${p.house}</span>
          </span>
        </div>
      `;
    }).join('');
  }

  function getSignSymbol(sign) {
    const symbols = {
      Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
      Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
    };
    return symbols[sign] || '';
  }

  function getPlanetColor(name) {
    const colors = {
      Sun: '#d4af37', Moon: '#c0c0e0', Mercury: '#b0b0b0', Venus: '#e8a0a0',
      Mars: '#cc4444', Jupiter: '#d09040', Saturn: '#a08840', Uranus: '#60b0d0',
      Neptune: '#4060b0', Pluto: '#886090'
    };
    return colors[name] || '#888888';
  }

  // ----- Loading & Error -----
  function showLoading(show) {
    state.loading = show;
    loadingEl.classList.toggle('active', show);
  }

  function showError(message) {
    state.error = message;
    errorText.textContent = message;
    errorEl.classList.add('active');
  }

  function hideError() {
    state.error = null;
    errorEl.classList.remove('active');
  }

  // ----- LocalStorage -----
  function saveToStorage(input) {
    try {
      localStorage.setItem('astroweb_last_input', JSON.stringify(input));
    } catch (e) {
      // Storage not available
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem('astroweb_last_input');
      if (!stored) return;

      const input = JSON.parse(stored);
      if (!input || !input.birthDate) return;

      // Populate form
      const form = document.getElementById('birth-form');
      if (form) {
        if (input.birthDate) form.querySelector('[name="birthDate"]').value = input.birthDate;
        if (input.birthTime) form.querySelector('[name="birthTime"]').value = input.birthTime;
        if (input.latitude) form.querySelector('[name="latitude"]').value = input.latitude;
        if (input.longitude) form.querySelector('[name="longitude"]').value = input.longitude;
        if (input.houseSystem) form.querySelector('[name="houseSystem"]').value = input.houseSystem;
      }

    } catch (e) {
      // Storage not available or invalid data
    }
  }

  function clearStoredData() {
    try {
      localStorage.removeItem('astroweb_last_input');
    } catch (e) {}
    // Reset form
    const form = document.getElementById('birth-form');
    if (form) form.reset();
    // Reset state
    state.natalData = null;
    state.transitData = null;
    state.aspectData = null;
    state.lastInput = null;
    // Go to input view
    showView('input');
  }

  // ----- Planet Select Buttons (in chart view) -----
  function initPlanetSelectButtons() {
    const container = document.getElementById('planet-select-buttons');
    if (!container) return;

    const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];

    container.innerHTML = planets.map(p => `
      <button class="planet-select-btn" data-planet="${p}">${p}</button>
    `).join('');

    container.querySelectorAll('.planet-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const planetName = btn.dataset.planet;
        birthChart.selectPlanet(planetName);
        container.querySelectorAll('.planet-select-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.planet === planetName);
        });
      });
    });
  }

  // ----- Initialize on DOM Ready -----
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initPlanetSelectButtons();
  });

})();