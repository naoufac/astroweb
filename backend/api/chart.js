/**
 * Chart API endpoint
 * GET /api/chart?birthdate=YYYY-MM-DD&time=HH:MM&lat=LAT&lon=LON&houses=placidus|wholesign|campanus
 */

const express = require('express');
const birthchart = require('../calculations/birthchart');

const router = express.Router();

router.get('/chart', (req, res) => {
  try {
    const { birthdate, time, lat, lon, houses } = req.query;

    // Validate required parameters
    if (!birthdate || !time || lat === undefined || lon === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: birthdate, time, lat, lon'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return res.status(400).json({
        error: 'Invalid birthdate format. Use YYYY-MM-DD'
      });
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({
        error: 'Invalid time format. Use HH:MM (24-hour)'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Validate coordinates
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Invalid latitude. Must be between -90 and 90'
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid longitude. Must be between -180 and 180'
      });
    }

    // Validate date
    const date = new Date(birthdate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: 'Invalid birthdate'
      });
    }

    const houseSystem = houses || 'placidus';
    const validSystems = ['placidus', 'wholesign', 'campanus'];
    if (!validSystems.includes(houseSystem.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid house system. Use: placidus, wholesign, or campanus'
      });
    }

    // Build the birth chart
    const chart = birthchart.buildBirthChart(birthdate, time, latitude, longitude, houseSystem);

    res.json({
      success: true,
      chart
    });
  } catch (error) {
    console.error('Chart API error:', error);
    res.status(500).json({
      error: 'Failed to calculate birth chart',
      message: error.message
    });
  }
});

module.exports = router;