/**
 * Aspects API endpoint
 * GET /api/aspects?birthdate=YYYY-MM-DD&time=HH:MM&lat=LAT&lon=LON&date=YYYY-MM-DD
 * Returns natal aspects + transiting aspects on a given date
 */

const express = require('express');
const ephemeris = require('../calculations/ephemeris');
const aspectsCalc = require('../calculations/aspects');
const moonCalc = require('../calculations/birthchart');

const router = express.Router();

router.get('/aspects', (req, res) => {
  try {
    const { birthdate, time, lat, lon, date } = req.query;

    // Validate required parameters
    if (!birthdate || !time || lat === undefined || lon === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: birthdate, time, lat, lon'
      });
    }

    // Validate formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return res.status(400).json({
        error: 'Invalid birthdate format. Use YYYY-MM-DD'
      });
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({
        error: 'Invalid time format. Use HH:MM'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Invalid latitude'
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid longitude'
      });
    }

    // Calculate natal Julian Day
    const [by, bm, bd] = birthdate.split('-').map(Number);
    const [bh, bmin] = time.split(':').map(Number);
    const natalDate = new Date(Date.UTC(by, bm - 1, bd, bh, bmin, 0));
    const natalJd = ephemeris.dateToJulianDay(natalDate);

    // Calculate transit date (default to today if not provided)
    const transitDateStr = date || new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transitDateStr)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const [ty, tm, td] = transitDateStr.split('-').map(Number);
    const transitDate = new Date(Date.UTC(ty, tm - 1, td, 12, 0, 0));
    const transitJd = ephemeris.dateToJulianDay(transitDate);

    // Planet names
    const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'NorthNode', 'SouthNode'];

    // Calculate natal positions
    const natalPlanets = {};
    const natalPlanetList = [];

    for (const name of planetNames) {
      const pos = ephemeris.calculatePlanetPosition(natalJd, name);
      natalPlanets[name] = pos;
      natalPlanetList.push({
        name,
        longitude: pos.longitude,
        latitude: pos.latitude || 0
      });
    }

    // Calculate transit positions
    const transitPlanets = {};
    const transitPlanetList = [];

    for (const name of planetNames) {
      const pos = ephemeris.calculatePlanetPosition(transitJd, name);
      transitPlanets[name] = pos;
      transitPlanetList.push({
        name,
        longitude: pos.longitude,
        latitude: pos.latitude || 0
      });
    }

    // Calculate natal aspects
    const natalAspects = aspectsCalc.calculateAspects(natalPlanetList);

    // Calculate transit aspects
    const transitAspects = aspectsCalc.calculateAspects(transitPlanetList);

    // Calculate aspects between transit and natal planets
    const transitNatalAspects = [];

    for (const transitPlanet of transitPlanetList) {
      for (const natalPlanet of natalPlanetList) {
        // Skip Sun and Moon comparisons for transits (too personal)
        const dist = Math.abs(transitPlanet.longitude - natalPlanet.longitude) % 360;
        const diff = Math.min(dist, 360 - dist);

        // Check each aspect type
        const aspectTypes = [
          { name: 'conjunction', orb: 8, angle: 0 },
          { name: 'trine', orb: 6, angle: 120 },
          { name: 'square', orb: 6, angle: 90 },
          { name: 'opposition', orb: 8, angle: 180 },
          { name: 'sextile', orb: 4, angle: 60 },
          { name: 'quincunx', orb: 3, angle: 150 }
        ];

        for (const asp of aspectTypes) {
          if (Math.abs(diff - asp.angle) <= asp.orb) {
            transitNatalAspects.push({
              transitPlanet: transitPlanet.name,
              natalPlanet: natalPlanet.name,
              aspect: asp.name,
              exactness: 1 - (Math.abs(diff - asp.angle) / asp.orb),
              difference: parseFloat((Math.abs(diff - asp.angle)).toFixed(2))
            });
            break;
          }
        }
      }
    }

    // Sort by exactness
    transitNatalAspects.sort((a, b) => b.exactness - a.exactness);

    // Get moon phase for natal
    const natalMoonPhase = moonCalc.calculateMoonPhase(natalJd);
    const transitMoonPhase = moonCalc.calculateMoonPhase(transitJd);

    res.json({
      success: true,
      natal: {
        date: birthdate,
        time,
        julianDay: natalJd,
        planets: natalPlanets,
        aspects: natalAspects,
        moonPhase: natalMoonPhase
      },
      transit: {
        date: transitDateStr,
        julianDay: transitJd,
        planets: transitPlanets,
        aspects: transitAspects,
        moonPhase: transitMoonPhase
      },
      transitNatalAspects,
      summary: {
        totalNatalAspects: natalAspects.length,
        totalTransitAspects: transitAspects.length,
        significantTransits: transitNatalAspects.filter(a => a.exactness > 0.8).length
      }
    });
  } catch (error) {
    console.error('Aspects API error:', error);
    res.status(500).json({
      error: 'Failed to calculate aspects',
      message: error.message
    });
  }
});

module.exports = router;