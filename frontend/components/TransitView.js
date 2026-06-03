// TransitView.js - Daily Transit Component
// Shows current planetary positions, transiting aspects, and daily horoscope

class TransitView {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.transitData = null;
    this.natalData = null;
  }

  render(transitData, natalData) {
    this.transitData = transitData;
    this.natalData = natalData;
    this.container.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'transit-view';

    view.innerHTML = `
      <div class="transit-header">
        <h2>Daily Transits</h2>
        <div class="transit-date-badge">
          <span>${this.formatDate(new Date())}</span>
        </div>
      </div>

      <div class="transit-positions">
        <h3>Planetary Positions Today</h3>
        <div class="transit-positions-grid" id="transit-positions-grid"></div>
      </div>

      <div class="transit-grid" id="transit-aspects-grid"></div>

      <div class="daily-horoscope">
        <h3>Daily Horoscope by Sign</h3>
        <div class="horoscope-grid" id="horoscope-grid"></div>
      </div>
    `;

    this.container.appendChild(view);

    this.renderPositions();
    this.renderAspects();
    this.renderHoroscope();
  }

  formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  renderPositions() {
    const grid = document.getElementById('transit-positions-grid');
    if (!this.transitData || !this.transitData.planets) return;

    grid.innerHTML = this.transitData.planets.map(planet => `
      <div class="transit-position-item">
        <span class="planet-name">${planet.name}</span>
        <span class="planet-pos">${planet.sign} ${this.formatDegree(planet.degree)}</span>
      </div>
    `).join('');
  }

  formatDegree(deg) {
    const d = Math.floor(deg);
    const m = Math.round((deg - d) * 60);
    return `${d}°${m}'`;
  }

  renderAspects() {
    const grid = document.getElementById('transit-aspects-grid');
    if (!this.transitData || !this.transitData.aspects) {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:20px;">No major aspects today.</p>';
      return;
    }

    const aspects = this.transitData.aspects;
    if (aspects.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:20px;">No major aspects today.</p>';
      return;
    }

    grid.innerHTML = aspects.map(aspect => {
      const icon = this.getAspectIcon(aspect.type);
      const isHighlight = this.isHighlightAspect(aspect);
      return `
        <div class="transit-card ${isHighlight ? 'highlight' : ''}">
          <div class="transit-aspect-icon ${aspect.type}">${icon}</div>
          <div class="transit-card-title">${this.formatAspectTitle(aspect)}</div>
          <div class="transit-card-description">${this.getAspectDescription(aspect)}</div>
          <div class="transit-card-planets">${aspect.planet1} ${aspect.type} ${aspect.planet2} · Orb: ${aspect.orb.toFixed(1)}°</div>
        </div>
      `;
    }).join('');
  }

  getAspectIcon(type) {
    const icons = {
      conjunction: '☌',
      trine: '△',
      square: '□',
      opposition: '☍',
      sextile: '✶'
    };
    return icons[type] || '●';
  }

  formatAspectTitle(aspect) {
    return `${aspect.planet1} ${aspect.type.charAt(0).toUpperCase() + aspect.type.slice(1)} ${aspect.planet2}`;
  }

  isHighlightAspect(aspect) {
    // Highlight if it's a Sun, Moon, or Mercury aspect within 2° orb
    const sensitive = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
    const isSensitive = sensitive.includes(aspect.planet1) || sensitive.includes(aspect.planet2);
    return isSensitive && aspect.orb <= 2 && ['square', 'opposition', 'conjunction'].includes(aspect.type);
  }

  getAspectDescription(aspect) {
    const descriptions = this.getDescriptions();
    const key = `${aspect.planet1}-${aspect.type}-${aspect.planet2}`;
    const reverseKey = `${aspect.planet2}-${aspect.type}-${aspect.planet1}`;

    return descriptions[key] || descriptions[reverseKey] || this.getGenericDescription(aspect);
  }

  getGenericDescription(aspect) {
    const type = aspect.type;
    const p1 = aspect.planet1;
    const p2 = aspect.planet2;

    if (type === 'conjunction') {
      return `${p1} and ${p2} align today, amplifying their combined energy. This is a powerful time for new beginnings in areas they govern.`;
    }
    if (type === 'trine') {
      return `${p1} flows harmoniously with ${p2}, creating ease and opportunity. Trust your instincts in matters related to both planets.`;
    }
    if (type === 'square') {
      return `${p1} challenges ${p2}, creating tension that demands adjustment. This friction can lead to important growth if you face it directly.`;
    }
    if (type === 'opposition') {
      return `${p1} and ${p2} face off, bringing things to a head. Balance is key—consider others\' perspective while honoring your own needs.`;
    }
    if (type === 'sextile') {
      return `${p1} supports ${p2} with opportunity for cooperation. Small steps today can lead to meaningful progress.`;
    }
    return `${p1} connects with ${p2}.`;
  }

  getDescriptions() {
    return {
      'Sun-square-Saturn': 'Today your Sun squares your natal Saturn, bringing a test of discipline and patience. Obligations may feel heavier, but this is a time to do the work rather than seek validation. Focus on responsibilities and avoid confrontation with authority figures.',
      'Moon-square-Mars': 'Emotional tension rises as the Moon challenges Mars. Avoid reactive decisions—channel restless energy into physical activity. Home and family matters may need attention.',
      'Venus-trine-Jupiter': 'A blessed connection between Venus and Jupiter brings harmony to relationships and finances. Opportunity for expansion in creative pursuits or social connections.',
      'Mercury-conjunction-Sun': 'Your communication receives a boost as Mercury aligns with the Sun. Ideas flow clearly, and conversations carry weight. Good day for important discussions and negotiations.',
      'Mars-opposition-Saturn': 'Frustration builds as Mars collides with Saturn\'s resistance. You want to act, but obstacles stand in the way. Patience and strategic action will overcome these barriers.',
      'Sun-trine-Moon': 'Inner harmony prevails as Sun and Moon support each other. Emotional clarity and intuitive insights are strong. Good for reflecting on your path forward.',
      'Moon-opposition-Sun': 'Internal conflict arises between what you feel and what you think you should do. Trust your gut but verify with reason before making moves.',
      'Mercury-square-Neptune': 'Miscommunication risk increases—verify details before committing. Avoid signing important documents today. Confusion in plans is likely.',
      'Venus-square-Pluto': 'Intensity in relationships may surface unexpectedly. Power dynamics could shift in close partnerships. Proceed with honesty.',
      'Jupiter-trine-Saturn': 'Expansion and structure align favorably. Long-term planning benefits from this stable, optimistic energy. Good time for investments.'
    };
  }

  renderHoroscope() {
    const grid = document.getElementById('horoscope-grid');
    const signs = [
      { name: 'Aries', symbol: '♈', element: 'Fire' },
      { name: 'Taurus', symbol: '♉', element: 'Earth' },
      { name: 'Gemini', symbol: '♊', element: 'Air' },
      { name: 'Cancer', symbol: '♋', element: 'Water' },
      { name: 'Leo', symbol: '♌', element: 'Fire' },
      { name: 'Virgo', symbol: '♍', element: 'Earth' },
      { name: 'Libra', symbol: '♎', element: 'Air' },
      { name: 'Scorpio', symbol: '♏', element: 'Water' },
      { name: 'Sagittarius', symbol: '♐', element: 'Fire' },
      { name: 'Capricorn', symbol: '♑', element: 'Earth' },
      { name: 'Aquarius', symbol: '♒', element: 'Air' },
      { name: 'Pisces', symbol: '♓', element: 'Water' }
    ];

    grid.innerHTML = signs.map(sign => `
      <div class="horoscope-card">
        <div class="sign-name">${sign.symbol} ${sign.name}</div>
        <div class="horoscope-text">${this.generateHoroscope(sign.name)}</div>
      </div>
    `).join('');
  }

  generateHoroscope(signName) {
    // Generate consistent daily horoscope based on sign name and date
    const horoscopes = this.getHoroscopeLibrary();
    const dateSeed = new Date().toISOString().split('T')[0];
    const signIndex = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(signName);
    const seed = this.hashCode(dateSeed + signName);

    const signHoroscopes = horoscopes[signIndex % horoscopes.length];
    return signHoroscopes;
  }

  getHoroscopeLibrary() {
    return [
      // Aries
      'Focus on groundwork today—small steps build momentum. Avoid rushing decisions; patience pays off. Evening favors quiet reflection.',
      // Taurus
      'Financial matters may need attention. Trust your instincts but verify details. Creative inspiration strikes unexpectedly.',
      // Gemini
      'Communication flows smoothly today. Share ideas freely—others are receptive. Late afternoon brings an important realization.',
      // Cancer
      'Home and family take center stage. Nurture yourself as you nurture others. A memory surfaces with valuable insight.',
      // Leo
      'Creative energy peaks—channel it into projects that matter. Recognition comes from unexpected quarters. Trust your vision.',
      // Virgo
      'Details matter today; double-check work before sharing. Health matters deserve attention. A small improvement makes a big difference.',
      // Libra
      'Relationships require balance—give and receive equally. Partnership discussions go well. Your sense of fairness guides important decisions.',
      // Scorpio
      'Deep transformation is available if you face what\'s been avoided. Trust in the process of change. Emotional bonds strengthen.',
      // Sagittarius
      'Adventure calls, but check logistics first. Philosophical ideas bring clarity to practical matters. A journey mentally expands horizons.',
      // Capricorn
      'Career responsibilities may shift focus. Long-term planning benefits from today\'s practical energy. Authority figures may be supportive.',
      // Aquarius
      'Social connections bring unexpected opportunities. Your originality is valued—share your thinking. Community involvement bears fruit.',
      // Pisces
      'Intuition is especially strong today—trust what you sense beneath the surface. Creative or spiritual pursuits are favored. Compassion heals.'
    ];
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Export for use in app.js
window.TransitView = TransitView;