/**
 * Birth chart builder module
 * Combines ephemeris, houses, aspects, and moon phase calculations
 */

const ephemeris = require('./ephemeris');
const houseCalc = require('./house');
const aspectsCalc = require('./aspects');

/**
 * Calculate Moon phase
 * @param {number} jd - Julian Day
 * @returns {{phase: string, illumination: number, age: number}}
 */
function calculateMoonPhase(jd) {
  // Calculate age of Moon in days since new moon
  // Using mean lunar synodic month of 29.530588853 days
  const daysSinceJ2000 = jd - 2451545.0;
  const lunarCycle = 29.530588853;

  // Mean longitude of Sun (used as proxy for new moon reference)
  const T = (jd - 2451545.0) / 36525;
  const sunLon = 280.46646 + 0.985647352 * daysSinceJ2000;

  // Mean longitude of Moon
  const moonLon = 218.3164591 + 481267.8813242 * T;

  // Age of Moon (days since last new moon)
  // New moon occurs when Sun and Moon have the same longitude
  let age = (moonLon - sunLon) % 360;
  if (age < 0) age += 360;
  age = (age / 360) * lunarCycle; // Convert to days

  // Determine phase name
  let phase;
  if (age < 1.85) {
    phase = 'new';
  } else if (age < 7.38) {
    phase = 'waxing';
  } else if (age < 14.77) {
    phase = 'full';
  } else if (age < 22.15) {
    phase = 'waning';
  } else if (age < 29.53) {
    phase = 'new';
  } else {
    phase = 'new';
  }

  // Illumination percentage (approximate)
  const illumination = Math.round((1 - Math.cos(age / lunarCycle * 2 * Math.PI)) / 2 * 100);

  return {
    phase,
    illumination,
    age: Math.round(age * 10) / 10
  };
}

/**
 * Build a complete birth chart
 * @param {string|Date} birthDate - Birth date
 * @param {string} birthTime - Birth time in HH:MM format (24-hour)
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @param {string} houseSystem - 'placidus', 'wholesign', or 'campanus'
 * @returns {Object} Complete birth chart data
 */
function buildBirthChart(birthDate, birthTime, latitude, longitude, houseSystem = 'placidus') {
  // Parse date and time
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);

  // Create date object (UTC)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // Calculate Julian Day
  const jd = ephemeris.dateToJulianDay(date);

  // Calculate planetary positions
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'NorthNode', 'SouthNode'];
  const planets = {};

  for (const name of planetNames) {
    planets[name] = ephemeris.calculatePlanetPosition(jd, name);
  }

  // Calculate houses
  const houses = houseCalc.calculateHouses(jd, latitude, longitude, houseSystem);

  // Calculate natal aspects
  const natalAspects = aspectsCalc.calculateAspectsFromPositions(planets);

  // Calculate moon phase
  const moonPhase = calculateMoonPhase(jd);

  // Determine rising sign (sign containing ascendant)
  const ascSign = Math.floor(houses.ascendant / 30);
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const risingSign = signs[ascSign];

  return {
    planets,
    houses: houses.houses,
    ascendant: houses.ascendant,
    MC: houses.MC,
    risingSign,
    aspects: natalAspects,
    moonPhase,
    metadata: {
      date: birthDate,
      time: birthTime,
      latitude,
      longitude,
      houseSystem,
      julianDay: jd
    }
  };
}

module.exports = {
  buildBirthChart,
  calculateMoonPhase
};