// AspectGrid.js - Natal Aspect Display Component
// Shows a grid/table of natal aspects with color coding

class AspectGrid {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.aspectData = null;
  }

  render(aspectData) {
    this.aspectData = aspectData;
    this.container.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'aspect-view';

    view.innerHTML = `
      <div class="aspect-view-header">
        <h2>Natal Aspects</h2>
        <p>Planetary connections in your birth chart</p>
      </div>

      <div class="aspect-legend">
        <div class="legend-item"><div class="legend-dot conjunction"></div> Conjunction (0°)</div>
        <div class="legend-item"><div class="legend-dot trine"></div> Trine (120°)</div>
        <div class="legend-item"><div class="legend-dot square"></div> Square (90°)</div>
        <div class="legend-item"><div class="legend-dot opposition"></div> Opposition (180°)</div>
        <div class="legend-item"><div class="legend-dot sextile"></div> Sextile (60°)</div>
      </div>

      <div class="aspect-grid-container">
        <table class="aspect-table" id="aspect-table">
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Planet Pair</th>
              <th>Degrees</th>
              <th>Orb</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody id="aspect-table-body">
          </tbody>
        </table>
      </div>
    `;

    this.container.appendChild(view);
    this.renderTable();
  }

  renderTable() {
    const tbody = document.getElementById('aspect-table-body');
    if (!this.aspectData || !this.aspectData.aspects || this.aspectData.aspects.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px;">
            No aspects data available. Enter your birth details to generate your natal chart.
          </td>
        </tr>
      `;
      return;
    }

    // Sort by aspect type importance and orb
    const sorted = [...this.aspectData.aspects].sort((a, b) => {
      const priority = { conjunction: 0, square: 1, opposition: 2, trine: 3, sextile: 4 };
      const pDiff = (priority[a.type] || 5) - (priority[b.type] || 5);
      if (pDiff !== 0) return pDiff;
      return Math.abs(a.orb) - Math.abs(b.orb);
    });

    tbody.innerHTML = sorted.map(aspect => {
      const p1 = aspect.planet1 || '?';
      const p2 = aspect.planet2 || '?';
      const deg1 = aspect.degree1 !== undefined ? this.formatDeg(aspect.degree1) : '?';
      const deg2 = aspect.degree2 !== undefined ? this.formatDeg(aspect.degree2) : '?';

      return `
        <tr>
          <td><span class="aspect-type ${aspect.type}">${this.capitalize(aspect.type)}</span></td>
          <td><span class="planet-pair">${p1} – ${p2}</span></td>
          <td><span class="aspect-degree">${deg1} / ${deg2}</span></td>
          <td><span class="aspect-orb">${aspect.orb !== undefined ? aspect.orb.toFixed(1) + '°' : '?'}</span></td>
          <td>${this.getAspectInterpretation(aspect)}</td>
        </tr>
      `;
    }).join('');

    // Add hover highlight for rows
    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('mouseenter', () => {
        row.style.background = 'rgba(212, 175, 55, 0.04)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = '';
      });
    });
  }

  formatDeg(deg) {
    if (deg === undefined || deg === null) return '?';
    const d = Math.floor(deg);
    const m = Math.round((deg - d) * 60);
    return `${d}°${m.toString().padStart(2, '0')}'`;
  }

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getAspectInterpretation(aspect) {
    const type = aspect.type;
    const p1 = aspect.planet1;
    const p2 = aspect.planet2;

    // Build interpretation based on planet combinations
    const p1Domain = this.getPlanetDomain(p1);
    const p2Domain = this.getPlanetDomain(p2);

    if (type === 'conjunction') {
      return `These planets act together, intensifying their combined energy. ${p1Domain} and ${p2Domain} are merged in your psyche, giving you concentrated focus in these life areas but also potential blind spots.`;
    }
    if (type === 'trine') {
      return `${p1Domain} flows naturally with ${p2Domain}, giving you ease in these life areas. You have natural talent here, but be careful not to take this flow for granted. Talent thrives with application.`;
    }
    if (type === 'square') {
      return `Tension between ${p1Domain} and ${p2Domain} creates friction that demands resolution. This is a driving force for growth—face the challenge rather than avoid it. Transformation awaits on the other side.`;
    }
    if (type === 'opposition') {
      return `${p1Domain} and ${p2Domain} pull in different directions, creating a swing between extremes. Learning to balance these energies is the key lesson. Neither side should dominate.`;
    }
    if (type === 'sextile') {
      return `Opportunity exists between ${p1Domain} and ${p2Domain}. These planets can work together with conscious effort. Small, deliberate steps unlock potential here.`;
    }

    return `${p1} and ${p2} form a ${type} in your chart.`;
  }

  getPlanetDomain(planet) {
    const domains = {
      Sun: 'vital energy and identity',
      Moon: 'emotional nature and instincts',
      Mercury: 'communication and thinking',
      Venus: 'values and relationships',
      Mars: 'drive and assertion',
      Jupiter: 'expansion and meaning',
      Saturn: 'structure and mastery',
      Uranus: 'individuality and innovation',
      Neptune: 'intuition and transcendence',
      Pluto: 'transformation and power'
    };
    return domains[planet] || planet?.toLowerCase() || 'life energy';
  }
}

// Export for use in app.js
window.AspectGrid = AspectGrid;