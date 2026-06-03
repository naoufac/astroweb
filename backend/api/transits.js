/**
 * Transits API endpoint
 * GET /api/transits?date=YYYY-MM-DD&lat=LAT&lon=LON
 * Returns current planetary positions + transiting aspects to natal + daily horoscope
 */

const express = require('express');
const ephemeris = require('../calculations/ephemeris');
const houseCalc = require('../calculations/house');
const aspectsCalc = require('../calculations/aspects');

const router = express.Router();

// Planet order for horoscope
const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

/**
 * Get sign from longitude
 */
function getSign(longitude) {
  const signIndex = Math.floor(normDeg(longitude) / 30);
  return ZODIAC_SIGNS[signIndex];
}

function normDeg(deg) {
  deg = deg % 360;
  return deg < 0 ? deg + 360 : deg;
}

/**
 * Generate daily horoscope lines for a sign
 */
function generateHoroscope(signName, signIndex, planets, natalPositions) {
  const lines = [];
  const signLon = signIndex * 30;

  // Check for major transits
  const transitPlanets = Object.entries(planets);

  // Find planets in this sign
  const inSign = transitPlanets.filter(([name, pos]) => {
    return Math.floor(pos.longitude / 30) === signIndex;
  });

  if (inSign.length > 0) {
    const planetNames = inSign.map(([n]) => n).join(', ');
    lines.push(`${planetNames} transiting through ${signName}.`);
  }

  // Check for aspects to natal planets
  const aspectsToNatal = [];
  for (const [name, pos] of transitPlanets) {
    for (const [natalName, natalPos] of Object.entries(natalPositions)) {
      const dist = Math.abs(pos.longitude - natalPos.longitude) % 360;
      const diff = Math.min(dist, 360 - dist);

      if (diff <= 2) { // within 2 degrees
        aspectsToNatal.push({ transit: name, natal: natalName, type: 'conjunct' });
      } else if (Math.abs(diff - 120) <= 6) {
        aspectsToNatal.push({ transit: name, natal: natalName, type: 'trine' });
      } else if (Math.abs(diff - 90) <= 6) {
        aspectsToNatal.push({ transit: name, natal: natalName, type: 'square' });
      } else if (Math.abs(diff - 180) <= 8) {
        aspectsToNatal.push({ transit: name, natal: natalName, type: 'opposition' });
      }
    }
  }

  if (aspectsToNatal.length > 0) {
    lines.push(`Watch for dynamic aspects: ${aspectsToNatal.map(a => `${a.transit} ${a.type} ${a.natal}`).join(', ')}.`);
  }

  // Generic guidance based on sign
  const guidance = {
    Aries: 'Energy runs high. Channel it into action, not conflict.',
    Taurus: 'Patience brings rewards. Stick to practical pursuits.',
    Gemini: 'Communication flows freely. Express yourself clearly.',
    Cancer: 'Emotions may run deep. Trust your instincts today.',
    Leo: 'Your light shines bright. Share your creativity with others.',
    Virgo: 'Details matter. Focus on organization and analysis.',
    Libra: 'Balance is key. Seek harmony in relationships.',
    Scorpio: 'Transformation awaits. Embrace change with courage.',
    Sagittarius: 'Adventure calls. Explore new horizons and ideas.',
    Capricorn: 'Discipline pays off. Stay focused on long-term goals.',
    Aquarius: 'Innovation sparks. Think outside traditional boundaries.',
    Pisces: 'Intuition guides you. Trust your inner wisdom.'
  };

  if (lines.length < 3) {
    lines.push(guidance[signName] || 'A day for reflection and growth.');
  }

  return lines.slice(0, 3);
}

router.get('/transits', (req, res) => {
  try {
    const { date, lat, lon, birthdate, time, birthlat, birthlon } = req.query;

    if (!date || lat === undefined || lon === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: date, lat, lon'
      });
    }

    // Validate date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const [year, month, day] = date.split('-').map(Number);
    const transitDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid coordinates'
      });
    }

    // Calculate Julian Day
    const jd = ephemeris.dateToJulianDay(transitDate);

    // Current planetary positions
    const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const planets = {};
    const planetList = [];

    for (const name of planetNames) {
      const pos = ephemeris.calculatePlanetPosition(jd, name);
      planets[name] = pos;
      planetList.push({
        name,
        longitude: pos.longitude,
        latitude: pos.latitude
      });
      pos.sign = getSign(pos.longitude);
    }

    // Current transiting aspects
    const transitingAspects = aspectsCalc.calculateAspects(planetList);

    // Houses for the transit location
    const houses = houseCalc.calculateHouses(jd, latitude, longitude, 'placidus');

    // Natal positions if provided
    let natalPositions = {};
    if (birthdate && time && birthlat !== undefined && birthlon !== undefined) {
      try {
        const [by, bm, bd] = birthdate.split('-').map(Number);
        const [bh, bmin] = time.split(':').map(Number);
        const natalDate = new Date(Date.UTC(by, bm - 1, bd, bh, bmin, 0));
        const natalJd = ephemeris.dateToJulianDay(natalDate);

        for (const name of planetNames) {
          natalPositions[name] = ephemeris.calculatePlanetPosition(natalJd, name);
        }
      } catch (e) {
        // Natal calculation failed, continue without it
      }
    }

    // Daily horoscope for each sign
    const horoscope = {};
    for (let i = 0; i < 12; i++) {
      horoscope[ZODIAC_SIGNS[i]] = generateHoroscope(ZODIAC_SIGNS[i], i, planets, natalPositions);
    }

    res.json({
      success: true,
      date,
      planets,
      aspects: transitingAspects,
      houses: houses.houses,
      ascendant: houses.ascendant,
      horoscope
    });
  } catch (error) {
    console.error('Transits API error:', error);
    res.status(500).json({
      error: 'Failed to calculate transits',
      message: error.message
    });
  }
});

module.exports = router;