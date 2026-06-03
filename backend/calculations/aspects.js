/**
 * Aspects calculation module
 * Calculates angular relationships between planets
 */

// Aspect definitions: [name, orb, diff in degrees]
const ASPECTS = [
  ['conjunction', 8, 0],
  ['trine', 6, 120],
  ['square', 6, 90],
  ['opposition', 8, 180],
  ['sextile', 4, 60],
  ['quincunx', 3, 150]
];

/**
 * Normalize angle to [0, 360)
 */
function normDeg(deg) {
  deg = deg % 360;
  return deg < 0 ? deg + 360 : deg;
}

/**
 * Calculate the shortest angular distance between two longitudes
 */
function angularDistance(lon1, lon2) {
  let diff = Math.abs(lon1 - lon2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Calculate aspects between planets
 * @param {Array<{name: string, longitude: number, latitude: number}>} planets - Array of planet objects
 * @returns {Array<{planet1: string, planet2: string, aspect: string, orb: number, exactness: number}>}
 */
function calculateAspects(planets) {
  const aspects = [];
  const seen = new Set();

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      const pairKey = [p1.name, p2.name].sort().join('-');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const distance = angularDistance(p1.longitude, p2.longitude);

      for (const [aspectName, defaultOrb, targetAngle] of ASPECTS) {
        const diff = Math.abs(distance - targetAngle);

        if (diff <= defaultOrb) {
          const exactness = 1 - (diff / defaultOrb); // 1 = exact, 0 = at edge of orb
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspect: aspectName,
            orb: parseFloat((defaultOrb - diff).toFixed(3)),
            exactness: parseFloat(exactness.toFixed(3))
          });
          break; // Only one aspect per pair (the closest)
        }
      }
    }
  }

  // Sort by exactness (most exact first)
  aspects.sort((a, b) => b.exactness - a.exactness);

  return aspects;
}

/**
 * Calculate aspects from planet positions object
 * @param {Object} planets - Object with planet names as keys and position objects as values
 * @returns {Array} Aspects array
 */
function calculateAspectsFromPositions(planets) {
  const planetList = Object.entries(planets).map(([name, pos]) => ({
    name,
    longitude: pos.longitude,
    latitude: pos.latitude || 0
  }));
  return calculateAspects(planetList);
}

module.exports = {
  calculateAspects,
  calculateAspectsFromPositions,
  ASPECTS
};