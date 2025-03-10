const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Authentifizierungs-Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ 
      success: false, 
      error: 'Nicht autorisiert' 
    });
  }
};

// Dashboard-Statistiken
router.get('/dashboard-stats', isAuthenticated, async (req, res) => {
  try {
    const [
      newRequestsCount,
      activeProjectsCount,
      totalCustomersCount,
      monthlyRevenue
    ] = await Promise.all([
      // Neue Anfragen
      pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'"),
      
      // Aktive Projekte
      pool.query("SELECT COUNT(*) FROM projekte WHERE status IN ('neu', 'in_bearbeitung')"),
      
      // Gesamtkunden
      pool.query("SELECT COUNT(*) FROM kunden WHERE status = 'aktiv'"),
      
      // Monatlicher Umsatz
      pool.query(`
        SELECT COALESCE(SUM(betrag), 0) as umsatz 
        FROM rechnungen 
        WHERE rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE)
      `)
    ]);

    res.json({
      success: true,
      stats: {
        newRequests: parseInt(newRequestsCount.rows[0].count),
        activeProjects: parseInt(activeProjectsCount.rows[0].count),
        totalCustomers: parseInt(totalCustomersCount.rows[0].count),
        monthlyRevenue: parseFloat(monthlyRevenue.rows[0].umsatz)
      }
    });
  } catch (error) {
    console.error('Fehler bei Dashboard-Statistiken:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Datenbankfehler: ' + error.message 
    });
  }
});

// Suche über mehrere Entitäten
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term || term.trim().length < 2) {
      return res.json({ success: true, results: [] });
    }
    
    const [
      kundenResults,
      projekteResults,
      termineResults
    ] = await Promise.all([
      // Kunden suchen
      pool.query(`
        SELECT 
          id, name, email, 'kunde' as type 
        FROM kunden 
        WHERE 
          LOWER(name) LIKE LOWER($1) OR 
          LOWER(email) LIKE LOWER($1)
        LIMIT 5
      `, [`%${term}%`]),
      
      // Projekte suchen
      pool.query(`
        SELECT 
          id, titel as name, 'projekt' as type 
        FROM projekte 
        WHERE LOWER(titel) LIKE LOWER($1)
        LIMIT 5
      `, [`%${term}%`]),
      
      // Termine suchen
      pool.query(`
        SELECT 
          id, titel as name, 'termin' as type 
        FROM termine 
        WHERE LOWER(titel) LIKE LOWER($1)
        LIMIT 5
      `, [`%${term}%`])
    ]);

    const results = [
      ...kundenResults.rows,
      ...projekteResults.rows,
      ...termineResults.rows
    ];

    res.json({ 
      success: true, 
      results 
    });
  } catch (error) {
    console.error('Fehler bei globaler Suche:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Datenbankfehler: ' + error.message 
    });
  }
});

module.exports = router;