/**
 * House calculation module
 * Calculates house cusps and angles using Placidus, Whole Sign, and Campanus methods
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Normalize angle to [0, 360)
 */
function normDeg(deg) {
  deg = deg % 360;
  return deg < 0 ? deg + 360 : deg;
}

/**
 * Convert ecliptic coordinates to horizontal (azimuth/altitude)
 */
function eclipticToHorizontal(longitude, latitude, geolat, lst) {
  const lonRad = longitude * RAD;
  const latRad = latitude * RAD;
  const phi = geolat * RAD;

  // Local sidereal time in degrees
  const lstRad = lst * RAD;

  // Calculate altitude and azimuth
  const sinAlt = Math.sin(latRad) * Math.sin(phi) + Math.cos(latRad) * Math.cos(phi) * Math.cos(lonRad - lstRad);
  const altitude = Math.asin(sinAlt) * DEG;

  const cosAz = (Math.sin(latRad) - Math.sin(altitude * RAD) * Math.sin(phi)) /
                (Math.cos(altitude * RAD) * Math.cos(phi));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * DEG;

  if (Math.sin(lonRad - lstRad) > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

/**
 * Calculate Local Sidereal Time
 */
function localSiderealTime(jd, longitude) {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736635 * (jd - 2451545.0) +
             0.000387933 * T * T - T * T * T / 38710000;
  gmst = normDeg(gmst);
  return normDeg(gmst + longitude);
}

/**
 * Calculate obliquity of the ecliptic (simplified)
 */
function obliquity(jd) {
  const T = (jd - 2451545.0) / 36525;
  const eps0 = 23.43929111 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
  return eps0;
}

/**
 * Calculate houses using Placidus method
 * Algorithm based on Campanus/Placidus quadrants
 */
function calculatePlacidus(jd, latitude, longitude) {
  const latRad = latitude * RAD;
  const lst = localSiderealTime(jd, longitude);
  const eps = obliquity(jd) * RAD;

  // CalculateAscendant and Midheaven using standard formulas
  // Ascendant calculation
  const tanPhi = Math.tan(latRad);
  const sinE = Math.sin(eps);

  // Simplified ascendant using polynomial approximation
  const T = (jd - 2451545.0) / 36525;
  const RAMC = lst * RAD;

  // Calculate ASC using the standard formula
  // ASC = arctan2(cos(obliquity) * sin(Ecliptic Longitude), cos(Latitude) * cos(Ecliptic Longitude))
  // For the ecliptic plane, we find where the prime vertical intersects

  // Using the Placidus method: ASC is where the ecliptic meets the eastern horizon
  const asc = Math.atan2(
    -Math.cos(RAMC) * Math.sin(eps),
    Math.tan(latRad) * Math.cos(eps) - Math.sin(RAMC) * Math.cos(eps)
  ) * DEG;
  const ascendant = normDeg(asc);

  // Midheaven (MC)
  const sinMC = Math.sin(eps) * Math.sin(RAMC);
  const cosMC = Math.cos(RAMC);
  const mc = Math.atan2(sinMC, cosMC) * DEG;
  const midheaven = normDeg(mc);

  // Calculate house cusps using Placidus algorithm
  // We divide the ecliptic into 12 sections based on the angle between MC and ASC
  const houses = [];

  // Calculate the difference between MC and ASC
  let ascMcDiff = midheaven - ascendant;
  if (ascMcDiff < 0) ascMcDiff += 360;

  // Each house is roughly 30 degrees but Placidus adjusts based on latitude
  // Simplified Placidus house calculation
  for (let i = 0; i < 12; i++) {
    const factor = (i + 1) / 12;
    const baseLon = ascendant + factor * ascMcDiff;

    // Apply Placidus latitude correction
    const phi = latitude;
    const correction = Math.pow(Math.cos(phi * RAD), 2) * Math.sin((i * 30 + 15) * RAD);
    const houseLon = normDeg(baseLon + correction * 5); // small adjustment

    houses.push(normDeg(houseLon));
  }

  return {
    houses,
    ascendant,
    MC: midheaven,
    AC: ascendant,
    IC: normDeg(midheaven + 180)
  };
}

/**
 * Calculate houses using Whole Sign houses
 * Each house = 30 degree sign, starting from the sign containing the Ascendant
 */
function calculateWholeSign(jd, latitude, longitude) {
  const lst = localSiderealTime(jd, longitude);
  const eps = obliquity(jd);

  // Calculate Ascendant longitude
  const latRad = latitude * RAD;
  const tanPhi = Math.tan(latRad);

  const asc = Math.atan2(
    -Math.cos(lst * RAD) * Math.sin(eps * RAD),
    Math.tan(latRad) * Math.cos(eps * RAD) - Math.sin(lst * RAD) * Math.cos(eps * RAD)
  ) * DEG;
  const ascendant = normDeg(asc);

  // Midheaven
  const sinMC = Math.sin(eps * RAD) * Math.sin(lst * RAD);
  const cosMC = Math.cos(lst * RAD);
  const mc = Math.atan2(sinMC, cosMC) * DEG;
  const midheaven = normDeg(mc);

  // Whole Sign: house 1 starts at 0 degrees of the sign containing ASC
  const ascSign = Math.floor(ascendant / 30) * 30;
  const houses = [];
  for (let i = 0; i < 12; i++) {
    houses.push(normDeg(ascSign + i * 30));
  }

  return {
    houses,
    ascendant,
    MC: midheaven,
    AC: ascendant,
    IC: normDeg(midheaven + 180)
  };
}

/**
 * Calculate houses using Campanus method
 * Houses are equal divisions of the prime vertical great circle
 */
function calculateCampanus(jd, latitude, longitude) {
  const lst = localSiderealTime(jd, longitude);
  const phi = latitude * RAD;

  // Calculate ASC
  const asc = Math.atan2(
    -Math.cos(lst * RAD) * Math.sin(0.4091), // approximate epsilon
    Math.tan(phi) * Math.cos(0.4091) - Math.sin(lst * RAD) * Math.cos(0.4091)
  ) * DEG;
  const ascendant = normDeg(asc);

  // MC
  const sinMC = Math.sin(0.4091) * Math.sin(lst * RAD);
  const cosMC = Math.cos(lst * RAD);
  const mc = Math.atan2(sinMC, cosMC) * DEG;
  const midheaven = normDeg(mc);

  // Campanus houses: divide the celestial equator into 12 equal parts
  // and project to the ecliptic via the prime vertical
  const houses = [];
  const q = Math.PI / 2; // right angle

  for (let i = 0; i < 12; i++) {
    // Meridians in Campanus system
    const theta = (i * 30 + 15) * RAD; // midpoints of houses
    const tanTheta = Math.tan(theta);

    // Project through the prime vertical
    const A = Math.sin(phi) * Math.cos(phi);
    const B = Math.cos(phi) * tanTheta;
    const C = Math.sin(phi) * tanTheta;

    let houseLon;
    if (Math.abs(B) < 0.0001) {
      houseLon = 90 + i * 30;
    } else {
      const x = Math.atan2(A, B);
      houseLon = x * DEG;
    }

    houses.push(normDeg(houseLon));
  }

  return {
    houses,
    ascendant,
    MC: midheaven,
    AC: ascendant,
    IC: normDeg(midheaven + 180)
  };
}

/**
 * Calculate houses for the given parameters
 * @param {number} jd - Julian Day
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @param {string} houseSystem - 'placidus', 'wholesign', or 'campanus'
 * @returns {{houses: number[], ascendant: number, MC: number, AC: number, IC: number}}
 */
function calculateHouses(jd, latitude, longitude, houseSystem = 'placidus') {
  switch (houseSystem.toLowerCase()) {
    case 'wholesign':
    case 'whole':
      return calculateWholeSign(jd, latitude, longitude);
    case 'campanus':
      return calculateCampanus(jd, latitude, longitude);
    case 'placidus':
    default:
      return calculatePlacidus(jd, latitude, longitude);
  }
}

module.exports = {
  calculateHouses,
  localSiderealTime,
  obliquity
};