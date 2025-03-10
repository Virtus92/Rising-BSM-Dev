const express = require('express');
const router = express.Router();
const pool = require('../db');
const { isAuthenticated, isAdmin, isManager } = require('../middleware/auth');
const slugify = require('slugify');
const axios = require('axios');
const { formatDistanceToNow, format } = require('date-fns');
const { de } = require('date-fns/locale');

// Helper function for HTTP requests
const _post = async (url, data) => {
  try {
    return await axios.post(url, data);
  } catch (error) {
    console.error(`Error in _post to ${url}:`, error);
    throw error; // Re-throw to be handled by the route
  }
};

// Helper function for database queries
const _query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error(`Error in _query with text ${text}:`, error);
    throw error; // Re-throw to be handled by the route
  }
};

// Helper function for DB connection
const connect = async () => {
  try {
    return await pool.connect();
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error; // Re-throw to be handled by the route
  }
};

// Middleware to get new requests count
const getNewRequestsCount = async (req, res, next) => {
  try {
    const newRequestsCountQuery = await _query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    req.newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0, 10);
    next();
  } catch (error) {
    console.error('Error fetching new requests count:', error);
    req.newRequestsCount = 0; // Default value in case of error
    next();
  }
};

// Apply middleware to all routes that need it
router.use(getNewRequestsCount);

// N8N Webhook-URL für Automatisierung
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.dinel.at/webhook/blog-automation';

// Blog Dashboard - Übersicht (nur für Geschäftsführer)
router.get('/', isAuthenticated, isManager, async (req, res) => {
  try {
    // Pagination Parameter
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    
    // Status-Filter aufbauen
    let statusFilter = '';
    let queryParams = [limit, offset];
    
    if (status && ['published', 'draft', 'review'].includes(status)) {
      statusFilter = 'WHERE p.status = $3';
      queryParams.push(status);
    }
    
    // Blogposts abrufen mit Pagination
    const postsQuery = await _query(`
      SELECT 
        p.id, 
        p.title, 
        p.excerpt, 
        p.status, 
        p.published_at,
        p.created_at,
        u.name as author_name
      FROM 
        blog_posts p
        LEFT JOIN benutzer u ON p.author_id = u.id
      ${statusFilter}
      ORDER BY 
        CASE WHEN p.status = 'published' THEN 0
             WHEN p.status = 'review' THEN 1
             ELSE 2 END,
        COALESCE(p.published_at, p.created_at) DESC
      LIMIT $1 OFFSET $2
    `, queryParams);
    
    // Gesamtanzahl der Posts für Pagination
    const countParams = status ? [status] : [];
    const countQuery = await _query(`
      SELECT COUNT(*) as total 
      FROM blog_posts 
      ${status ? 'WHERE status = $1' : ''}
    `, countParams);
    
    const totalPosts = parseInt(countQuery.rows[0].total, 10);
    const totalPages = Math.ceil(totalPosts / limit);
    
    // Statistiken abrufen
    const statsQuery = await _query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'review') as review_count,
        COUNT(*) as total_count
      FROM 
        blog_posts
    `);
    
    // Laufende KI-Generierungen abrufen
    const aiRequestsQuery = await _query(`
      SELECT id, topic, status, created_at
      FROM blog_ai_requests
      WHERE status IN ('pending', 'processing')
      ORDER BY created_at DESC
    `);
    
    // Top-Keywords abrufen
    const keywordsQuery = await _query(`
      SELECT 
        keyword, 
        search_volume, 
        current_ranking
      FROM 
        blog_seo_keywords
      ORDER BY
        search_volume DESC
      LIMIT 5
    `);
    
    res.render('dashboard/blog/index', {
      title: 'Blog-Management - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/blog',
      posts: postsQuery.rows.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt || post.title,
        status: post.status,
        statusLabel: post.status === 'published' ? 'Veröffentlicht' :
                   post.status === 'review' ? 'In Prüfung' : 'Entwurf',
        statusClass: post.status === 'published' ? 'success' :
                    post.status === 'review' ? 'warning' : 'secondary',
        author: post.author_name,
        date: post.published_at ? format(new Date(post.published_at), 'dd.MM.yyyy') :
                                format(new Date(post.created_at), 'dd.MM.yyyy'),
      })),
      stats: statsQuery.rows[0],
      aiRequests: aiRequestsQuery.rows.map(req => ({
        id: req.id,
        topic: req.topic,
        status: req.status,
        statusLabel: req.status === 'pending' ? 'Ausstehend' : 
                    req.status === 'processing' ? 'In Bearbeitung' : 'Abgeschlossen',
        created: formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: de })
      })),
      keywords: keywordsQuery.rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        totalItems: totalPosts,
        status: status
      },
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Blog Dashboard Fehler:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Blog-Content-Generierung - Formular
router.get('/generate', isAuthenticated, isManager, async (req, res) => {
  try {
    // Kategorien für Dropdown abrufen
    const categoriesQuery = await _query('SELECT id, name FROM blog_categories ORDER BY name');
    
    // Top-Keywords für Vorschläge abrufen
    const keywordsQuery = await _query(`
      SELECT keyword, search_volume
      FROM blog_seo_keywords
      ORDER BY search_volume DESC
      LIMIT 15
    `);
    
    res.render('dashboard/blog/generate', {
      title: 'Blog-Beitrag generieren - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/blog',
      categories: categoriesQuery.rows,
      keywords: keywordsQuery.rows,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Generierungsformulars:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

router.post('/generate', isAuthenticated, isManager, async (req, res) => {
  try {
    const { 
      topic, 
      keywords, 
      target_audience, 
      tone,
      category_ids,
      min_length,
      max_length,
      include_images
    } = req.body;
    
    // Verbesserte Validierung
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      req.flash('error', 'Bitte geben Sie ein gültiges Thema an.');
      return res.redirect('/dashboard/blog/generate');
    }
    
    // Validiere category_ids
    let cleanCategoryIds = [];
    if (category_ids) {
      // Stelle sicher, dass category_ids immer ein Array ist
      const categoryArray = Array.isArray(category_ids) ? category_ids : [category_ids];
      // Validiere, dass jede ID eine Zahl ist
      cleanCategoryIds = categoryArray.filter(id => /^\d+$/.test(id));
    }
    
    // In Datenbank speichern
    const requestResult = await _query(
      `INSERT INTO blog_ai_requests (
        topic, 
        keywords, 
        target_audience, 
        status, 
        requested_by
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        topic.trim(),
        keywords || null,
        target_audience || null,
        'pending',
        req.session.user.id
      ]
    );
    
    const requestId = requestResult.rows[0].id;
    
    // N8N Webhook auslösen
    try {
      await _post(N8N_WEBHOOK_URL, {
        action: 'generate_post',
        request_id: requestId,
        topic: topic.trim(),
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        target_audience,
        tone,
        category_ids: cleanCategoryIds,
        min_length: min_length || 500,
        max_length: max_length || 1500,
        include_images: include_images === 'on',
        user_id: req.session.user.id
      });
      
      req.flash('success', 'Die Generierung wurde gestartet! Sie werden benachrichtigt, sobald der Beitrag fertig ist.');
    } catch (webhookError) {
      console.error('Fehler beim Auslösen des N8N Webhooks:', webhookError);
      
      // Status auf "failed" setzen
      await _query(
        'UPDATE blog_ai_requests SET status = $1 WHERE id = $2',
        ['failed', requestId]
      );
      
      req.flash('error', 'Die Generierung konnte nicht gestartet werden. Bitte versuchen Sie es später erneut.');
    }
    
    res.redirect('/dashboard/blog');
  } catch (error) {
    console.error('Fehler beim Starten der KI-Generierung:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/generate');
  }
});

// KI-Generierungsstatus abrufen
router.get('/generate/status/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    const requestQuery = await _query(
      'SELECT * FROM blog_ai_requests WHERE id = $1',
      [id]
    );
    
    if (requestQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anfrage nicht gefunden' });
    }
    
    const request = requestQuery.rows[0];
    
    res.json({
      success: true,
      status: request.status,
      result_post_id: request.result_post_id,
      completed_at: request.completed_at
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Generierungsstatus:', error);
    res.status(500).json({ success: false, error: 'Datenbankfehler: ' + error.message });
  }
});

// Neuen Blogpost erstellen - Formular
router.get('/neu', isAuthenticated, isManager, async (req, res) => {
  try {
    // Kategorien für Dropdown abrufen
    const categoriesQuery = await _query('SELECT id, name FROM blog_categories ORDER BY name');
    
    // Alle Tags abrufen
    const tagsQuery = await _query('SELECT id, name FROM blog_tags ORDER BY name');
    
    // Top-Keywords für SEO-Vorschläge abrufen
    const keywordsQuery = await _query(`
      SELECT keyword, search_volume
      FROM blog_seo_keywords
      ORDER BY search_volume DESC
      LIMIT 10
    `);
    
    res.render('dashboard/blog/neu', {
      title: 'Neuer Blogpost - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/blog',
      categories: categoriesQuery.rows,
      tags: tagsQuery.rows,
      keywords: keywordsQuery.rows,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      formData: {
        title: '',
        content: '',
        excerpt: '',
        status: 'draft'
      },
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Blog-Formulars:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Blogpost speichern
router.post('/neu', isAuthenticated, isManager, async (req, res) => {
  const client = await connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      title, 
      content, 
      excerpt, 
      status, 
      categories, 
      tags, 
      featured_image,
      seo_title,
      seo_description,
      seo_keywords
    } = req.body;
    
    // Slug erstellen
    let slug = slugify(title, { lower: true, strict: true });
    
    // Prüfen ob Slug bereits existiert
    const slugCheck = await client.query(
      'SELECT COUNT(*) FROM blog_posts WHERE slug = $1',
      [slug]
    );
    
    // Wenn Slug existiert, Suffix hinzufügen
    if (parseInt(slugCheck.rows[0].count, 10) > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    
    // Veröffentlichungsdatum setzen, wenn Status "published"
    const published_at = status === 'published' ? new Date() : null;
    
    // Blogpost speichern
    const result = await client.query(
      `INSERT INTO blog_posts (
        title, 
        slug, 
        content, 
        excerpt, 
        status, 
        featured_image,
        author_id,
        published_at,
        seo_title,
        seo_description,
        seo_keywords
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        title,
        slug,
        content,
        excerpt || null,
        status,
        featured_image || null,
        req.session.user.id,
        published_at,
        seo_title || title,
        seo_description || excerpt,
        seo_keywords || null
      ]
    );
    
    const postId = result.rows[0].id;
    
    await client.query('DELETE FROM blog_post_categories WHERE post_id = $1', [id]);

    if (categories && Array.isArray(categories) && categories.length > 0) {
      for (const categoryId of categories) {
        await client.query(
          'INSERT INTO blog_post_categories (post_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }
    }
    
    // Tags zuweisen und ggf. neue Tags erstellen
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Tags können als Array von IDs oder als Komma-separierter String kommen
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      
      for (const tag of tagList) {
        let tagId;
        
        // Prüfen ob es eine numerische ID ist
        if (/^\d+$/.test(tag)) {
          tagId = tag;
        } else {
          // Tag anlegen, falls es nicht existiert
          const tagSlug = slugify(tag, { lower: true, strict: true });
          
          const existingTag = await client.query(
            'SELECT id FROM blog_tags WHERE slug = $1',
            [tagSlug]
          );
          
          if (existingTag.rows.length > 0) {
            tagId = existingTag.rows[0].id;
          } else {
            const newTag = await client.query(
              'INSERT INTO blog_tags (name, slug) VALUES ($1, $2) RETURNING id',
              [tag, tagSlug]
            );
            tagId = newTag.rows[0].id;
          }
        }
        
        // Tag zum Post hinzufügen
        await client.query(
          'INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2)',
          [postId, tagId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // N8N Webhook triggern für SEO-Analyse, wenn der Post veröffentlicht wird
    if (status === 'published' || status === 'review') {
      try {
        await _post(N8N_WEBHOOK_URL, {
          action: 'analyze_seo',
          post_id: postId,
          title,
          content,
          excerpt,
          keywords: seo_keywords ? seo_keywords.split(',').map(k => k.trim()) : []
        });
        console.log(`N8N Webhook für Post ${postId} ausgelöst`);
      } catch (webhookError) {
        console.error('Fehler beim Auslösen des N8N Webhooks:', webhookError);
        // Wir brechen hier nicht ab, wenn der Webhook fehlschlägt
      }
    }
    
    req.flash('success', 'Blogpost erfolgreich erstellt!');
    res.redirect(`/dashboard/blog/${postId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Speichern des Blogposts:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/neu');
  } finally {
    client.release();
  }
});

// Blogpost anzeigen
router.get('/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Blogpost abrufen
    const postQuery = await _query(`
      SELECT 
        p.*,
        u.name as author_name
      FROM 
        blog_posts p
        LEFT JOIN benutzer u ON p.author_id = u.id
      WHERE 
        p.id = $1
    `, [id]);
    
    if (postQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Blogpost mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const post = postQuery.rows[0];
    
    // Kategorien des Posts abrufen
    const categoriesQuery = await _query(`
      SELECT c.id, c.name
      FROM blog_categories c
      JOIN blog_post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = $1
    `, [id]);
    
    // Tags des Posts abrufen
    const tagsQuery = await _query(`
      SELECT t.id, t.name
      FROM blog_tags t
      JOIN blog_post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = $1
    `, [id]);
    
    // Analytics-Daten abrufen
    const analyticsQuery = await _query(`
      SELECT 
        SUM(views) as total_views,
        SUM(unique_visitors) as total_visitors
      FROM 
        blog_analytics
      WHERE 
        post_id = $1
    `, [id]);
    
    const analytics = analyticsQuery.rows[0];
    
    // SEO-Keywords für diesen Post abrufen
    const keywordsQuery = await _query(`
      SELECT keyword, search_volume, current_ranking
      FROM blog_seo_keywords
      WHERE target_post_id = $1
      ORDER BY search_volume DESC
    `, [id]);
    
    res.render('dashboard/blog/detail', {
      title: `Blog: ${post.title} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/blog',
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        slug: post.slug,
        status: post.status,
        statusLabel: post.status === 'published' ? 'Veröffentlicht' :
                   post.status === 'review' ? 'In Prüfung' : 'Entwurf',
        statusClass: post.status === 'published' ? 'success' :
                    post.status === 'review' ? 'warning' : 'secondary',
        author: post.author_name,
        featuredImage: post.featured_image,
        createdAt: format(new Date(post.created_at), 'dd.MM.yyyy'),
        publishedAt: post.published_at ? format(new Date(post.published_at), 'dd.MM.yyyy') : null,
        seoTitle: post.seo_title,
        seoDescription: post.seo_description,
        seoKeywords: post.seo_keywords
      },
      categories: categoriesQuery.rows,
      tags: tagsQuery.rows,
      analytics: {
        views: analytics.total_views || 0,
        visitors: analytics.total_visitors || 0
      },
      keywords: keywordsQuery.rows,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Anzeigen des Blogposts:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Blogpost bearbeiten - Formular
router.get('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Blogpost abrufen
    const postQuery = await _query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    
    if (postQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Blogpost mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const post = postQuery.rows[0];
    
    // Kategorien für Dropdown abrufen
    const categoriesQuery = await _query('SELECT id, name FROM blog_categories ORDER BY name');
    
    // Zugewiesene Kategorien abrufen
    const assignedCategoriesQuery = await _query(`
      SELECT category_id
      FROM blog_post_categories
      WHERE post_id = $1
    `, [id]);
    
    const assignedCategoryIds = assignedCategoriesQuery.rows.map(row => row.category_id);
    
    // Alle Tags abrufen
    const tagsQuery = await _query('SELECT id, name FROM blog_tags ORDER BY name');
    
    // Zugewiesene Tags abrufen
    const assignedTagsQuery = await _query(`
      SELECT t.id, t.name
      FROM blog_tags t
      JOIN blog_post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = $1
    `, [id]);
    
    res.render('dashboard/blog/edit', {
      title: `Blog bearbeiten: ${post.title} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/blog',
      post: post,
      categories: categoriesQuery.rows,
      assignedCategories: assignedCategoryIds,
      tags: tagsQuery.rows,
      assignedTags: assignedTagsQuery.rows,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Bearbeitungsformulars:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Blogpost aktualisieren
router.post('/:id/edit', isAuthenticated, isManager, async (req, res) => {
  const client = await connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      title, 
      content, 
      excerpt, 
      status, 
      categories, 
      tags, 
      featured_image,
      seo_title,
      seo_description,
      seo_keywords,
      update_slug
    } = req.body;
    
    // Aktuellen Post abrufen
    const currentPostQuery = await client.query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    );
    
    if (currentPostQuery.rows.length === 0) {
      throw new Error(`Blogpost mit ID ${id} nicht gefunden`);
    }
    
    const currentPost = currentPostQuery.rows[0];
    
    // Slug aktualisieren, falls gewünscht
    let slug = currentPost.slug;
    if (update_slug) {
      slug = slugify(title, { lower: true, strict: true });
      
      // Prüfen ob Slug bereits existiert (und nicht der eigene ist)
      const slugCheck = await client.query(
        'SELECT COUNT(*) FROM blog_posts WHERE slug = $1 AND id != $2',
        [slug, id]
      );
      
      // Wenn Slug existiert, Suffix hinzufügen
      if (parseInt(slugCheck.rows[0].count, 10) > 0) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }
    
    // Veröffentlichungsdatum setzen, wenn Status sich auf "published" ändert
    let published_at = currentPost.published_at;
    if (status === 'published' && currentPost.status !== 'published') {
      published_at = new Date();
    } else if (status !== 'published' && currentPost.status === 'published') {
      // Keep the original publish date if unpublishing
      // This preserves the original date when re-publishing
    }
    
    // Blogpost aktualisieren
    await client.query(
      `UPDATE blog_posts SET
        title = $1,
        slug = $2,
        content = $3,
        excerpt = $4,
        status = $5,
        featured_image = $6,
        published_at = $7,
        seo_title = $8,
        seo_description = $9,
        seo_keywords = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11`,
      [
        title,
        slug,
        content,
        excerpt || null,
        status,
        featured_image || currentPost.featured_image,
        published_at,
        seo_title || title,
        seo_description || excerpt,
        seo_keywords || null,
        id
      ]
    );
    
    // Kategorien zurücksetzen und neu zuweisen
    await client.query('DELETE FROM blog_post_categories WHERE post_id = $1', [id]);
    
    if (categories && Array.isArray(categories) && categories.length > 0) {
      for (const categoryId of categories) {
        await client.query(
          'INSERT INTO blog_post_categories (post_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }
    }
    
    // Tags zurücksetzen und neu zuweisen
    await client.query('DELETE FROM blog_post_tags WHERE post_id = $1', [id]);
    
    if (tags && tags.length > 0) {
      // Tags können als Array von IDs oder als Komma-separierter String kommen
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      
      for (const tag of tagList) {
        let tagId;
        
        // Prüfen ob es eine numerische ID ist
        if (/^\d+$/.test(tag)) {
          tagId = tag;
        } else {
          // Tag anlegen, falls es nicht existiert
          const tagSlug = slugify(tag, { lower: true, strict: true });
          
          const existingTag = await client.query(
            'SELECT id FROM blog_tags WHERE slug = $1',
            [tagSlug]
          );
          
          if (existingTag.rows.length > 0) {
            tagId = existingTag.rows[0].id;
          } else {
            const newTag = await client.query(
              'INSERT INTO blog_tags (name, slug) VALUES ($1, $2) RETURNING id',
              [tag, tagSlug]
            );
            tagId = newTag.rows[0].id;
          }
        }
        
        // Tag zum Post hinzufügen
        await client.query(
          'INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2)',
          [id, tagId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // N8N Webhook triggern für SEO-Analyse, wenn der Status sich ändert
    if ((status === 'published' && currentPost.status !== 'published')) {
      try {
        await _post(N8N_WEBHOOK_URL, {
          action: 'analyze_seo',
          post_id: id,
          title,
          content,
          excerpt,
          keywords: seo_keywords ? seo_keywords.split(',').map(k => k.trim()) : []
        });
        console.log(`N8N Webhook für Post ${id} ausgelöst`);
      } catch (webhookError) {
        console.error('Fehler beim Auslösen des N8N Webhooks:', webhookError);
      }
    }
    
    req.flash('success', 'Blogpost erfolgreich aktualisiert!');
    res.redirect(`/dashboard/blog/${id}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Aktualisieren des Blogposts:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/blog/${req.params.id}/edit`);
  } finally {
    client.release();
  }
});

// Blogpost Status ändern
router.post('/:id/status', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Aktuellen Post abrufen
    const currentPostQuery = await _query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    );
    
    if (currentPostQuery.rows.length === 0) {
      req.flash('error', `Blogpost mit ID ${id} nicht gefunden`);
      return res.redirect('/dashboard/blog');
    }
    
    const currentPost = currentPostQuery.rows[0];
    
    let published_at = currentPost.published_at;
    if (status === 'published' && currentPost.status !== 'published') {
      published_at = new Date();
    } else if (status !== 'published' && currentPost.status === 'published') {
      // Keep the original publish date if unpublishing
      // This preserves the original date when re-publishing
    }
    
    // Status aktualisieren
    await _query(
      `UPDATE blog_posts SET
        status = $1,
        published_at = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [status, published_at, id]
    );
    
    // N8N Webhook triggern wenn veröffentlicht
    if (status === 'published' && currentPost.status !== 'published') {
      try {
        await _post(N8N_WEBHOOK_URL, {
          action: 'analyze_seo',
          post_id: id
        });
      } catch (webhookError) {
        console.error('Fehler beim Auslösen des N8N Webhooks:', webhookError);
      }
    }
    
    req.flash('success', `Blogpost-Status wurde auf "${status}" geändert.`);
    res.redirect(`/dashboard/blog/${id}`);
  } catch (error) {
    console.error('Fehler beim Ändern des Blogpost-Status:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/blog/${req.params.id}`);
  }
});

// Blog Kategorie-Verwaltung anzeigen
router.get('/categories', isAuthenticated, isManager, async (req, res) => {
  try {
    // Alle Kategorien abrufen
    const categoriesQuery = await _query(`
      SELECT 
        c.id, 
        c.name, 
        c.description,
        c.slug,
        COUNT(pc.post_id) as post_count
      FROM 
        blog_categories c
        LEFT JOIN blog_post_categories pc ON c.id = pc.category_id
      GROUP BY 
        c.id
      ORDER BY 
        c.name
    `);
    
    res.render('dashboard/blog/categories', {
      title: 'Blog Kategorien - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/blog',
      categories: categoriesQuery.rows,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Kategorien:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Kategorie speichern
router.post('/categories', isAuthenticated, isManager, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validierung
    if (!name) {
      req.flash('error', 'Kategoriename ist ein Pflichtfeld.');
      return res.redirect('/dashboard/blog/categories');
    }
    
    // Slug erstellen
    // Umlaut-Behandlung hinzufügen
    const slug = slugify(name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
      replacement: '-',
      locale: 'de'
    });
    
    // Prüfen ob Slug bereits existiert
    const slugCheck = await _query(
      'SELECT COUNT(*) FROM blog_categories WHERE slug = $1',
      [slug]
    );
    
    if (parseInt(slugCheck.rows[0].count, 10) > 0) {
      req.flash('error', `Eine Kategorie mit dem Namen "${name}" existiert bereits.`);
      return res.redirect('/dashboard/blog/categories');
    }
    
    // In Datenbank speichern
    await _query(
      'INSERT INTO blog_categories (name, slug, description) VALUES ($1, $2, $3)',
      [name, slug, description || null]
    );
    
    req.flash('success', 'Kategorie erfolgreich erstellt!');
    res.redirect('/dashboard/blog/categories');
  } catch (error) {
    console.error('Fehler beim Speichern der Kategorie:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/categories');
  }
});

// Kategorie löschen
router.post('/categories/:id/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if category has associated posts
    const postCheckQuery = await _query(
      'SELECT COUNT(*) FROM blog_post_categories WHERE category_id = $1',
      [id]
    );
    
    if (parseInt(postCheckQuery.rows[0].count, 10) > 0) {
      req.flash('error', 'Diese Kategorie hat zugeordnete Beiträge und kann nicht gelöscht werden.');
      return res.redirect('/dashboard/blog/categories');
    }
    
    // Now we can safely delete the category
    await _query('DELETE FROM blog_categories WHERE id = $1', [id]);
    
    req.flash('success', 'Kategorie erfolgreich gelöscht!');
    res.redirect('/dashboard/blog/categories');
  } catch (error) {
    console.error('Fehler beim Löschen der Kategorie:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/categories');
  }
});

// SEO-Dashboard
router.get('/seo', isAuthenticated, isManager, async (req, res) => {
  try {
    // Top-Suchbegriffe abrufen
    const keywordsQuery = await _query(`
      SELECT 
        keyword, 
        search_volume, 
        current_ranking,
        target_post_id
      FROM 
        blog_seo_keywords
      ORDER BY 
        search_volume DESC
      LIMIT 20
    `);
    
    // Zugehörige Blogpost-Titel abrufen
    const postsQuery = await _query(`
      SELECT id, title 
      FROM blog_posts 
      WHERE id IN (SELECT target_post_id FROM blog_seo_keywords WHERE target_post_id IS NOT NULL)
    `);
    
    // Posts in Map umwandeln
    const postsMap = {};
    postsQuery.rows.forEach(post => {
      postsMap[post.id] = post.title;
    });
    
    res.render('dashboard/blog/seo', {
      title: 'Blog SEO - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/blog',
      keywords: keywordsQuery.rows.map(keyword => ({
        ...keyword,
        post_title: keyword.target_post_id ? postsMap[keyword.target_post_id] : null
      })),
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des SEO-Dashboards:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Neues Keyword hinzufügen
router.post('/seo/keywords', isAuthenticated, isManager, async (req, res) => {
  try {
    const { keyword, search_volume, target_post_id } = req.body;
    
    // Validierung
    if (!keyword) {
      req.flash('error', 'Keyword ist ein Pflichtfeld.');
      return res.redirect('/dashboard/blog/seo');
    }

    
    if (target_post_id) {
      const postExists = await _query('SELECT id FROM blog_posts WHERE id = $1', [target_post_id]);
      if (!postExists.rows.length) {
        req.flash('error', 'Ungültige Post-ID');
        return res.redirect('/dashboard/blog/seo');
      }
    }

    let parsedTargetPostId = target_post_id;

    // Überprüfen, ob target_post_id eine gültige Zahl ist oder leer
    if (target_post_id && !/^\d+$/.test(target_post_id)) {
      req.flash('error', 'Ziel-Post-ID muss eine gültige Zahl sein.');
      return res.redirect('/dashboard/blog/seo');
    }

    // Wenn es leer ist, setze es auf null
    if (!target_post_id) {
      parsedTargetPostId = null;
    }

    // In Datenbank speichern
    await _query(
      `INSERT INTO blog_seo_keywords (
        keyword,
        search_volume,
        target_post_id
      ) VALUES ($1, $2, $3)`,
      [
        keyword,
        search_volume || 0,
        parsedTargetPostId
      ]
    );
    
    // Wenn ein Ziel-Post angegeben ist, N8N-Webhook auslösen für SEO-Analyse
    if (target_post_id) {
      try {
        await _post(N8N_WEBHOOK_URL, {
          action: 'analyze_keyword',
          keyword,
          post_id: target_post_id
        });
      } catch (webhookError) {
        console.error('Fehler beim Auslösen des N8N Webhooks:', webhookError);
      }
    }
    
    req.flash('success', 'Keyword erfolgreich hinzugefügt!');
    res.redirect('/dashboard/blog/seo');
  } catch (error) {
    console.error('Fehler beim Speichern des Keywords:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/seo');
  }
});

// Content-Verbesserung anfordern
router.post('/improve-content', isAuthenticated, isManager, async (req, res) => {
  try {
    const { 
      post_id, 
      focus
    } = req.body;
    
    // Post-Daten abrufen
    const postQuery = await _query('SELECT title, content FROM blog_posts WHERE id = $1', [post_id]);
    
    if (postQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Blogpost nicht gefunden'
      });
    }
    
    const post = postQuery.rows[0];
    
    // N8N Webhook auslösen für Content-Verbesserung
    try {
      const response = await _post(N8N_WEBHOOK_URL, {
        action: 'improve_content',
        post_id,
        title: post.title,
        content: post.content,
        focus
      });
      
      res.json({
        success: true,
        data: response.data
      });
    } catch (webhookError) {
      console.error('Fehler beim Auslösen des N8N Webhooks:', webhookError);
      res.status(500).json({
        success: false,
        error: 'Fehler bei der Content-Verbesserung.'
      });
    }
  } catch (error) {
    console.error('Fehler bei der Content-Verbesserung:', error);
    res.status(500).json({
      success: false,
      error: 'Datenbankfehler: ' + error.message
    });
  }
});

// Öffentliche Blog-Routen für Frontend-Besucher

// Blog-Hauptseite
router.get('/public', async (req, res) => {
  try {
    // Veröffentlichte Blogposts abrufen
    const postsQuery = await _query(`
      SELECT 
        p.id, 
        p.title, 
        p.slug,
        p.excerpt, 
        p.published_at,
        p.featured_image,
        u.name as author_name,
        ARRAY_AGG(DISTINCT c.name) as categories
      FROM 
        blog_posts p
        LEFT JOIN benutzer u ON p.author_id = u.id
        LEFT JOIN blog_post_categories pc ON p.id = pc.post_id
        LEFT JOIN blog_categories c ON pc.category_id = c.id
      WHERE 
        p.status = 'published'
      GROUP BY
        p.id, u.name
      ORDER BY 
        p.published_at DESC
      LIMIT 10
    `);
    
    // Kategorien für Seitenleiste abrufen
    const categoriesQuery = await _query(`
      SELECT 
        c.id, 
        c.name, 
        c.slug,
        COUNT(pc.post_id) as post_count
      FROM 
        blog_categories c
        JOIN blog_post_categories pc ON c.id = pc.category_id
        JOIN blog_posts p ON pc.post_id = p.id
      WHERE
        p.status = 'published'
      GROUP BY 
        c.id
      ORDER BY 
        c.name
    `);
    
    res.render('blog/index', {
      title: 'Blog - Rising BSM',
      posts: postsQuery.rows.map(post => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        date: format(new Date(post.published_at), 'dd.MM.yyyy'),
        author: post.author_name,
        image: post.featured_image,
        categories: post.categories.filter(c => c !== null)
      })),
      categories: categoriesQuery.rows
    });
  } catch (error) {
    console.error('Fehler beim Laden des Blogs:', error);
    res.status(500).render('error', {
      message: 'Fehler beim Laden des Blogs: ' + error.message,
      error: error
    });
  }
});

// Suche im Blog
router.get('/public/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.redirect('/blog');
    }
    
    // Suche in Posts
    const sanitizedQuery = q.replace(/%/g, '\\%');
    const searchQuery = await _query(`
      SELECT 
        p.id, 
        p.title, 
        p.slug,
        p.excerpt, 
        p.published_at,
        p.featured_image,
        u.name as author_name
      FROM 
        blog_posts p
        LEFT JOIN benutzer u ON p.author_id = u.id
      WHERE
        (p.title ILIKE $1 OR p.content ILIKE $1 OR p.excerpt ILIKE $1)
        AND p.status = 'published'
      ORDER BY
        p.published_at DESC
    `, [`%${sanitizedQuery}%`]);
    
    res.render('blog/search', {
      title: `Suchergebnisse für "${q}" - Blog - Rising BSM`,
      query: q,
      results: searchQuery.rows.map(post => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        date: format(new Date(post.published_at), 'dd.MM.yyyy'),
        author: post.author_name,
        image: post.featured_image
      }))
    });
  } catch (error) {
    console.error('Fehler bei der Blog-Suche:', error);
    res.status(500).render('error', {
      message: 'Fehler bei der Suche: ' + error.message,
      error: error
    });
  }
});

// Blogposts nach Kategorie anzeigen
router.get('/public/category/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Kategorie abrufen
    const categoryQuery = await _query(
      'SELECT id, name, description FROM blog_categories WHERE slug = $1',
      [slug]
    );

    if (categoryQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: 'Die gesuchte Kategorie wurde nicht gefunden.',
        error: { status: 404 }
      });
    }

    const category = categoryQuery.rows[0];

    // Posts dieser Kategorie abrufen
    const postsQuery = await _query(`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.published_at,
        p.featured_image,
        u.name as author_name
      FROM
        blog_posts p
        LEFT JOIN benutzer u ON p.author_id = u.id
        JOIN blog_post_categories pc ON p.id = pc.post_id
        JOIN blog_categories c ON pc.category_id = c.id
      WHERE
        c.slug = $1
        AND p.status = 'published'
      ORDER BY
        p.published_at DESC
    `, [slug]);

    res.render('blog/category', {
      title: `Blog Kategorie: ${category.name} - Rising BSM`,
      category: category,
      posts: postsQuery.rows.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        date: format(new Date(post.published_at), 'dd.MM.yyyy'),
        author: post.author_name,
        image: post.featured_image
      }))
    });
  } catch (error) {
    console.error('Fehler beim Anzeigen der Blog-Kategorie:', error);
    res.status(500).render('error', {
      message: 'Fehler beim Laden der Blog-Kategorie: ' + error.message,
      error: error
    });
  }
});

// Einzelner Blogpost anzeigen
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Blogpost abrufen
    const postQuery = await _query(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.seo_title,
        p.seo_description,
        p.seo_keywords,
        p.published_at,
        p.featured_image,
        u.name as author_name
      FROM
        blog_posts p
        LEFT JOIN benutzer u ON p.author_id = u.id
      WHERE
        p.slug = $1
        AND p.status = 'published'
    `, [slug]);

    if (postQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: 'Der gesuchte Blogpost wurde nicht gefunden.',
        error: { status: 404 }
      });
    }

    const post = postQuery.rows[0];

    // Kategorien abrufen
    const categoriesQuery = await _query(`
      SELECT c.name, c.slug
      FROM blog_categories c
      JOIN blog_post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = $1
    `, [post.id]);

    // Tags abrufen
    const tagsQuery = await _query(`
      SELECT t.name, t.slug
      FROM blog_tags t
      JOIN blog_post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = $1
    `, [post.id]);

    // Ähnliche Posts abrufen
    const relatedPostsQuery = await _query(`
      SELECT
        p.title,
        p.slug,
        p.published_at
      FROM
        blog_posts p
        JOIN blog_post_categories pc1 ON p.id = pc1.post_id
        JOIN blog_post_categories pc2 ON pc1.category_id = pc2.category_id
      WHERE
        pc2.post_id = $1
        AND p.id <> $1
        AND p.status = 'published'
      GROUP BY
        p.id
      ORDER BY
        p.published_at DESC
      LIMIT 3
    `, [post.id]);

    // Analytics tracken - Ansicht zählen
    try {
      const today = new Date().toISOString().split('T')[0];

      // Prüfen, ob bereits ein Eintrag für heute existiert
      const existingEntry = await _query(
        'SELECT id FROM blog_analytics WHERE post_id = $1 AND date = $2',
        [post.id, today]
      );

      if (existingEntry.rows.length > 0) {
        // Eintrag aktualisieren
        await _query(
          'UPDATE blog_analytics SET views = views + 1 WHERE id = $1',
          [existingEntry.rows[0].id]
        );
      } else {
        // Neuen Eintrag erstellen
        await _query(
          'INSERT INTO blog_analytics (post_id, views, unique_visitors, date) VALUES ($1, 1, 1, $2)',
          [post.id, today]
        );
      }
    } catch (analyticsError) {
      console.error('Fehler beim Tracken der Analytics:', analyticsError);
    }

    res.render('blog/post', {
      title: post.seo_title || post.title,
      metaDescription: post.seo_description || post.excerpt,
      metaKeywords: post.seo_keywords,
      post: {
        title: post.title,
        content: post.content,
        date: format(new Date(post.published_at), 'dd.MM.yyyy'),
        author: post.author_name,
        image: post.featured_image
      },
      categories: categoriesQuery.rows,
      tags: tagsQuery.rows,
      relatedPosts: relatedPostsQuery.rows.map(related => ({
        title: related.title,
        slug: related.slug,
        date: format(new Date(related.published_at), 'dd.MM.yyyy')
      }))
    });
  } catch (error) {
    console.error('Fehler beim Anzeigen des Blogposts:', error);
    res.status(500).render('error', {
      message: 'Fehler beim Laden des Blogposts: ' + error.message,
      error: error
    });
  }
});

// Keyword hinzufügen
router.post('/dashboard/blog/seo/keywords', isAuthenticated, isManager, async (req, res) => {
  try {
    const { keyword, search_volume, target_post_id } = req.body;
    
    // Validierung
    if (!keyword) {
      req.flash('error', 'Keyword ist ein Pflichtfeld.');
      return res.redirect('/dashboard/blog/seo');
    }
    
    // In Datenbank speichern
    await _query(
      `INSERT INTO blog_seo_keywords (
        keyword, 
        search_volume, 
        target_post_id
      ) VALUES ($1, $2, $3)`,
      [
        keyword,
        search_volume || 0,
        target_post_id || null
      ]
    );
    
    req.flash('success', 'Keyword erfolgreich hinzugefügt!');
    res.redirect('/dashboard/blog/seo');
  } catch (error) {
    console.error('Fehler beim Speichern des Keywords:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/seo');
  }
});

// Keyword bearbeiten
router.post('/dashboard/blog/seo/keywords/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id, keyword, search_volume, target_post_id } = req.body;
    
    if (!id || !keyword) {
      req.flash('error', 'ID und Keyword sind Pflichtfelder.');
      return res.redirect('/dashboard/blog/seo');
    }
    
    await _query(
      `UPDATE blog_seo_keywords 
       SET keyword = $1, 
           search_volume = $2, 
           target_post_id = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        keyword,
        search_volume || 0,
        target_post_id || null,
        id
      ]
    );
    
    req.flash('success', 'Keyword erfolgreich aktualisiert!');
    res.redirect('/dashboard/blog/seo');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Keywords:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/seo');
  }
});

// Keyword löschen
router.post('/dashboard/blog/seo/keywords/delete', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      req.flash('error', 'Keyword-ID ist erforderlich.');
      return res.redirect('/dashboard/blog/seo');
    }
    
    await _query('DELETE FROM blog_seo_keywords WHERE id = $1', [id]);
    
    req.flash('success', 'Keyword erfolgreich gelöscht!');
    res.redirect('/dashboard/blog/seo');
  } catch (error) {
    console.error('Fehler beim Löschen des Keywords:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/blog/seo');
  }
});

// Kategorie bearbeiten
router.post('/dashboard/blog/categories/edit', isAuthenticated, isManager, async (req, res) => {
  try {
    const { id, name, description, update_slug } = req.body;
    
    if (!id || !name) {
      req.flash('error', 'ID und Name sind Pflichtfelder.');
      return res.redirect('/dashboard/blog/categories');
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let slug = null;
      
      if (update_slug) {
        slug = slugify(name, { lower: true, strict: true });
        
        // Prüfen ob Slug bereits existiert (und nicht der eigene ist)
        const slugCheck = await client.query(
          'SELECT COUNT(*) FROM blog_categories WHERE slug = $1 AND id != $2',
          [slug, id]
        );
        
        if (parseInt(slugCheck.rows[0].count, 10) > 0) {
          throw new Error(`Eine Kategorie mit dem Namen "${name}" existiert bereits.`);
        }
      }
      
      if (slug) {
        await client.query(
          'UPDATE blog_categories SET name = $1, description = $2, slug = $3 WHERE id = $4',
          [name, description || null, slug, id]
        );
      } else {
        await client.query(
          'UPDATE blog_categories SET name = $1, description = $2 WHERE id = $3',
          [name, description || null, id]
        );
      }
      
      await client.query('COMMIT');
      req.flash('success', 'Kategorie erfolgreich aktualisiert!');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    res.redirect('/dashboard/blog/categories');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kategorie:', error);
    req.flash('error', error.message || 'Ein Fehler ist aufgetreten.');
    res.redirect('/dashboard/blog/categories');
  }
});

// Export the router using CommonJS syntax
module.exports = router;