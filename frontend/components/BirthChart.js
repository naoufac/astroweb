// BirthChart.js - Birth Chart Wheel Component
// Renders an animated SVG birth chart with houses, planets, and aspects

class BirthChart {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.chartData = null;
    this.selectedPlanet = null;
    this.svgNS = 'http://www.w3.org/2000/svg';
    this.wheelRadius = 170;
    this.innerRadius = 55;
    this.orbitRadius = 145;
  }

  render(chartData) {
    this.chartData = chartData;
    const container = this.container;
    container.innerHTML = '';
    container.classList.add('chart-wheel-container');

    const svg = this.createSVG(380, 380);
    svg.classList.add('chart-wheel');
    container.appendChild(svg);

    this.drawWheel(svg);
    this.drawZodiacRing(svg);
    this.drawHouses(svg);
    this.drawAspects(svg);
    this.drawPlanets(svg);
    this.drawCenter(svg);

    this.bindEvents();
  }

  createSVG(width, height) {
    const svg = document.createElementNS(this.svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('xmlns', this.svgNS);
    return svg;
  }

  degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  pointOnCircle(cx, cy, r, angleDeg) {
    const rad = this.degToRad(angleDeg);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  }

  createArcPath(cx, cy, r, startAngle, endAngle) {
    const start = this.pointOnCircle(cx, cy, r, startAngle);
    const end = this.pointOnCircle(cx, cy, r, endAngle);
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  drawWheel(svg) {
    const cx = 190, cy = 190;

    // Outer ring
    const outerRing = document.createElementNS(this.svgNS, 'circle');
    outerRing.setAttribute('cx', cx);
    outerRing.setAttribute('cy', cy);
    outerRing.setAttribute('r', this.wheelRadius + 5);
    outerRing.setAttribute('stroke', 'rgba(212, 175, 55, 0.25)');
    outerRing.setAttribute('stroke-width', '2');
    outerRing.setAttribute('fill', 'none');
    svg.appendChild(outerRing);

    // House ring
    const houseRing = document.createElementNS(this.svgNS, 'circle');
    houseRing.setAttribute('cx', cx);
    houseRing.setAttribute('cy', cy);
    houseRing.setAttribute('r', this.wheelRadius);
    houseRing.setAttribute('fill', 'var(--bg-secondary)');
    houseRing.setAttribute('stroke', 'rgba(212, 175, 55, 0.2)');
    houseRing.setAttribute('stroke-width', '1');
    svg.appendChild(houseRing);

    // Inner background
    const innerBg = document.createElementNS(this.svgNS, 'circle');
    innerBg.setAttribute('cx', cx);
    innerBg.setAttribute('cy', cy);
    innerBg.setAttribute('r', this.innerRadius);
    innerBg.setAttribute('fill', 'var(--bg-primary)');
    innerBg.setAttribute('stroke', 'rgba(212, 175, 55, 0.2)');
    innerBg.setAttribute('stroke-width', '1');
    svg.appendChild(innerBg);
  }

  drawZodiacRing(svg) {
    const cx = 190, cy = 190;
    const signs = [
      { name: 'Aries', symbol: '♈', start: 0 },
      { name: 'Taurus', symbol: '♉', start: 30 },
      { name: 'Gemini', symbol: '♊', start: 60 },
      { name: 'Cancer', symbol: '♋', start: 90 },
      { name: 'Leo', symbol: '♌', start: 120 },
      { name: 'Virgo', symbol: '♍', start: 150 },
      { name: 'Libra', symbol: '♎', start: 180 },
      { name: 'Scorpio', symbol: '♏', start: 210 },
      { name: 'Sagittarius', symbol: '♐', start: 240 },
      { name: 'Capricorn', symbol: '♑', start: 270 },
      { name: 'Aquarius', symbol: '♒', start: 300 },
      { name: 'Pisces', symbol: '♓', start: 330 }
    ];

    signs.forEach(sign => {
      const midAngle = sign.start + 15;
      const labelPos = this.pointOnCircle(cx, cy, this.wheelRadius - 18, midAngle);

      // Sign symbol
      const text = document.createElementNS(this.svgNS, 'text');
      text.setAttribute('x', labelPos.x);
      text.setAttribute('y', labelPos.y);
      text.setAttribute('class', 'sign-label');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = sign.symbol;
      svg.appendChild(text);
    });

    // Zodiac ring border
    const zRing = document.createElementNS(this.svgNS, 'circle');
    zRing.setAttribute('cx', cx);
    zRing.setAttribute('cy', cy);
    zRing.setAttribute('r', this.wheelRadius - 2);
    zRing.setAttribute('class', 'zodiac-ring');
    svg.appendChild(zRing);
  }

  drawHouses(svg) {
    if (!this.chartData.houses) return;
    const cx = 190, cy = 190;
    const houses = this.chartData.houses;

    houses.forEach((house, i) => {
      if (!house) return;
      const startAngle = (house.start + 360) % 360;
      const endAngle = (house.end + 360) % 360;
      let span = endAngle - startAngle;
      if (span <= 0) span += 360;
      if (span > 350) span = 30; // fallback for full chart

      const arcPath = this.createArcPath(cx, cy, this.wheelRadius - 2, startAngle, startAngle + span);

      const path = document.createElementNS(this.svgNS, 'path');
      path.setAttribute('d', arcPath);
      path.setAttribute('class', 'house-arc');
      path.setAttribute('data-house', i + 1);
      svg.appendChild(path);

      // House number
      const midAngle = startAngle + span / 2;
      const labelPos = this.pointOnCircle(cx, cy, this.wheelRadius + 15, midAngle);

      const label = document.createElementNS(this.svgNS, 'text');
      label.setAttribute('x', labelPos.x);
      label.setAttribute('y', labelPos.y);
      label.setAttribute('class', 'house-label');
      label.setAttribute('dominant-baseline', 'middle');
      label.textContent = (i + 1).toString();
      svg.appendChild(label);

      // Degree ticks every 10°
      for (let deg = 0; deg < 360; deg += 10) {
        const tickInner = this.pointOnCircle(cx, cy, this.wheelRadius - 30, deg);
        const tickOuter = this.pointOnCircle(cx, cy, this.wheelRadius - 24, deg);
        const tick = document.createElementNS(this.svgNS, 'line');
        tick.setAttribute('x1', tickInner.x);
        tick.setAttribute('y1', tickInner.y);
        tick.setAttribute('x2', tickOuter.x);
        tick.setAttribute('y2', tickOuter.y);
        tick.setAttribute('class', 'degree-tick');
        svg.appendChild(tick);
      }
    });
  }

  drawAspects(svg) {
    if (!this.chartData.aspects) return;
    const cx = 190, cy = 190;

    this.chartData.aspects.forEach(aspect => {
      const planet1 = this.chartData.planets.find(p => p.name === aspect.planet1);
      const planet2 = this.chartData.planets.find(p => p.name === aspect.planet2);
      if (!planet1 || !planet2) return;

      const pos1 = this.pointOnCircle(cx, cy, this.orbitRadius, planet1.position);
      const pos2 = this.pointOnCircle(cx, cy, this.orbitRadius, planet2.position);

      const line = document.createElementNS(this.svgNS, 'line');
      line.setAttribute('x1', pos1.x);
      line.setAttribute('y1', pos1.y);
      line.setAttribute('x2', pos2.x);
      line.setAttribute('y2', pos2.y);
      line.setAttribute('class', `aspect-line ${aspect.type}`);
      svg.appendChild(line);
    });
  }

  drawPlanets(svg) {
    if (!this.chartData.planets) return;
    const cx = 190, cy = 190;

    this.chartData.planets.forEach((planet, idx) => {
      const pos = this.pointOnCircle(cx, cy, this.orbitRadius, planet.position);

      const group = document.createElementNS(this.svgNS, 'g');
      group.setAttribute('class', 'planet-marker');
      group.setAttribute('data-planet', planet.name);
      group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

      // Planet circle
      const circle = document.createElementNS(this.svgNS, 'circle');
      const r = this.getPlanetRadius(planet.name);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', this.getPlanetColor(planet.name));
      if (planet.name === 'Sun') circle.setAttribute('class', 'sun-indicator');
      if (planet.name === 'Moon') circle.setAttribute('class', 'moon-indicator');
      group.appendChild(circle);

      // Glow effect for Sun/Moon
      if (planet.name === 'Sun' || planet.name === 'Moon') {
        const glow = document.createElementNS(this.svgNS, 'circle');
        glow.setAttribute('r', r + 3);
        glow.setAttribute('fill', 'none');
        glow.setAttribute('stroke', this.getPlanetColor(planet.name));
        glow.setAttribute('stroke-width', '2');
        glow.setAttribute('opacity', '0.4');
        group.insertBefore(glow, circle);
      }

      // Planet symbol on hover (tooltip style handled via CSS)
      const label = document.createElementNS(this.svgNS, 'text');
      label.setAttribute('y', r + 14);
      label.setAttribute('class', 'planet-label');
      label.setAttribute('fill', 'var(--text-primary)');
      label.setAttribute('font-size', '10');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-family', 'var(--font-main)');
      label.textContent = this.getPlanetSymbol(planet.name);
      group.appendChild(label);

      svg.appendChild(group);
    });
  }

  drawCenter(svg) {
    const cx = 190, cy = 190;

    // Center decoration
    const centerCircle = document.createElementNS(this.svgNS, 'circle');
    centerCircle.setAttribute('cx', cx);
    centerCircle.setAttribute('cy', cy);
    centerCircle.setAttribute('r', 20);
    centerCircle.setAttribute('fill', 'var(--bg-card)');
    centerCircle.setAttribute('stroke', 'rgba(212, 175, 55, 0.4)');
    centerCircle.setAttribute('stroke-width', '1.5');
    svg.appendChild(centerCircle);

    const centerDot = document.createElementNS(this.svgNS, 'circle');
    centerDot.setAttribute('cx', cx);
    centerDot.setAttribute('cy', cy);
    centerDot.setAttribute('r', 4);
    centerDot.setAttribute('fill', 'var(--accent-gold)');
    svg.appendChild(centerDot);

    // Degree labels around inner ring
    for (let i = 0; i < 360; i += 30) {
      const pos = this.pointOnCircle(cx, cy, 38, i);
      const text = document.createElementNS(this.svgNS, 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y);
      text.setAttribute('fill', 'rgba(212, 175, 55, 0.4)');
      text.setAttribute('font-size', '8');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-family', 'var(--font-main)');
      text.textContent = i.toString();
      svg.appendChild(text);
    }
  }

  getPlanetColor(name) {
    const colors = {
      Sun: '#d4af37',
      Moon: '#c0c0e0',
      Mercury: '#b0b0b0',
      Venus: '#e8a0a0',
      Mars: '#cc4444',
      Jupiter: '#d09040',
      Saturn: '#a08840',
      Uranus: '#60b0d0',
      Neptune: '#4060b0',
      Pluto: '#886090'
    };
    return colors[name] || '#888888';
  }

  getPlanetRadius(name) {
    const radii = {
      Sun: 7,
      Moon: 6,
      Mercury: 4,
      Venus: 5,
      Mars: 5,
      Jupiter: 6,
      Saturn: 6,
      Uranus: 5,
      Neptune: 5,
      Pluto: 4
    };
    return radii[name] || 4;
  }

  getPlanetSymbol(name) {
    const symbols = {
      Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
      Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇'
    };
    return symbols[name] || '●';
  }

  bindEvents() {
    const markers = this.container.querySelectorAll('.planet-marker');
    markers.forEach(marker => {
      marker.addEventListener('click', (e) => {
        const planetName = marker.getAttribute('data-planet');
        this.selectPlanet(planetName);
      });
    });
  }

  selectPlanet(name) {
    this.selectedPlanet = name;
    // Update active state
    this.container.querySelectorAll('.planet-marker').forEach(m => {
      m.style.opacity = '';
    });
    const selected = this.container.querySelector(`[data-planet="${name}"]`);
    if (selected) {
      selected.style.opacity = '1';
    }

    // Dispatch event for details panel
    this.container.dispatchEvent(new CustomEvent('planetSelected', {
      detail: { planet: name, chartData: this.chartData }
    }));
  }

  highlightAspect(aspectType) {
    this.container.querySelectorAll('.aspect-line').forEach(line => {
      line.style.opacity = '0.15';
    });
    const toHighlight = this.container.querySelectorAll(`.aspect-line.${aspectType}`);
    toHighlight.forEach(line => {
      line.style.opacity = '0.9';
      line.style.strokeWidth = '2.5';
    });
  }

  clearHighlight() {
    this.container.querySelectorAll('.aspect-line').forEach(line => {
      line.style.opacity = '';
      line.style.strokeWidth = '';
    });
  }
}

// Export for use in app.js
window.BirthChart = BirthChart;