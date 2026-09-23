/**
 * AFTER DARK - Premium Event Ticketing Server & Analytics Engine
 * Built with native Node.js (Zero external dependencies)
 * Presented by NØHREIN, Amritsar
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'afterdark2026';
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');

// Check admin key (case-insensitive with standard aliases)
function checkAdminKey(providedKey) {
  if (!providedKey) return false;
  const clean = String(providedKey).trim().toLowerCase();
  return clean === 'afterdark2026' ||
         clean === '2026' ||
         clean === 'admin' ||
         clean === 'admin123' ||
         clean === 'nohrein' ||
         clean === 'nohrein2026';
}

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), 'utf8');
}

if (!fs.existsSync(VISITS_FILE)) {
  const initialVisits = {
    totalVisits: 0,
    uniqueIps: {},
    visits: []
  };
  fs.writeFileSync(VISITS_FILE, JSON.stringify(initialVisits, null, 2), 'utf8');
}

// Helpers for Data Persistence
function readJSON(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || 'null') || fallback;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  try {
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        resolve({ rawText: raw });
      }
    });
    req.on('error', err => reject(err));
  });
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function detectDevice(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) return 'Mobile';
  if (/ipad|tablet|android(?!.*mobile)/.test(ua)) return 'Tablet';
  return 'Desktop';
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

// Request Handler
const server = http.createServer(async (req, res) => {
  // CORS Headers for API flexibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // =========================================================================
  // API ROUTE: Track Visit (POST /api/track-visit)
  // =========================================================================
  if (req.method === 'POST' && pathname === '/api/track-visit') {
    try {
      const body = await parseBody(req);
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const device = body.device || detectDevice(userAgent);
      const referrer = body.referrer || req.headers['referer'] || 'Direct';

      const visitsData = readJSON(VISITS_FILE, { totalVisits: 0, uniqueIps: {}, visits: [] });
      visitsData.totalVisits = (visitsData.totalVisits || 0) + 1;
      
      if (!visitsData.uniqueIps) visitsData.uniqueIps = {};
      const isNewIp = !visitsData.uniqueIps[ip];
      visitsData.uniqueIps[ip] = (visitsData.uniqueIps[ip] || 0) + 1;

      const visitRecord = {
        id: 'v-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        ip: ip.replace(/:\d+$/, ''),
        device: device,
        userAgent: userAgent.slice(0, 150),
        referrer: referrer.slice(0, 150),
        page: body.path || '/'
      };

      if (!Array.isArray(visitsData.visits)) visitsData.visits = [];
      visitsData.visits.unshift(visitRecord);
      if (visitsData.visits.length > 500) {
        visitsData.visits = visitsData.visits.slice(0, 500); // retain last 500 visits
      }

      writeJSON(VISITS_FILE, visitsData);

      const uniqueCount = Object.keys(visitsData.uniqueIps).length;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        totalVisits: visitsData.totalVisits,
        uniqueVisitors: uniqueCount,
        isNewVisitor: isNewIp
      }));
    } catch (err) {
      console.error('Error tracking visit:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // =========================================================================
  // API ROUTE: Save Booking (POST /api/bookings)
  // =========================================================================
  if (req.method === 'POST' && pathname === '/api/bookings') {
    try {
      const body = await parseBody(req);
      if (!body.fullName || !body.phone || !body.ticketType) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing required attendee fields' }));
        return;
      }

      const clientIp = getClientIp(req);
      const bookings = readJSON(BOOKINGS_FILE, []);

      const bookingRecord = {
        bookingRef: body.bookingRef || ('AD-' + Math.floor(10000 + Math.random() * 90000)),
        fullName: body.fullName.trim(),
        phone: body.phone.trim(),
        age: parseInt(body.age, 10) || null,
        email: (body.email || '').trim().toLowerCase(),
        ticketType: body.ticketType,
        ticketName: body.ticketName || body.ticketType,
        amount: parseInt(body.amount, 10) || 0,
        guestCount: parseInt(body.guestCount, 10) || 1,
        notes: (body.notes || '').trim(),
        timestamp: body.timestamp || new Date().toISOString(),
        formattedDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        status: body.status || 'Pending WhatsApp Verification',
        ip: clientIp
      };

      // Check if reference already exists, if so update it; otherwise prepend
      const existingIdx = bookings.findIndex(b => b.bookingRef === bookingRecord.bookingRef);
      if (existingIdx >= 0) {
        bookings[existingIdx] = { ...bookings[existingIdx], ...bookingRecord };
      } else {
        bookings.unshift(bookingRecord);
      }

      writeJSON(BOOKINGS_FILE, bookings);

      console.log(`[BOOKING LOGGED] ${bookingRecord.bookingRef} - ${bookingRecord.fullName} (${bookingRecord.ticketName}) - ₹${bookingRecord.amount}`);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        bookingRef: bookingRecord.bookingRef,
        message: 'Booking registered successfully in AFTER DARK database'
      }));
    } catch (err) {
      console.error('Error saving booking:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // =========================================================================
  // API ROUTE: Admin Data Dashboard (GET /api/admin/data)
  // =========================================================================
  if (req.method === 'GET' && pathname === '/api/admin/data') {
    const providedKey = req.headers['x-admin-key'] || query.key;
    if (!checkAdminKey(providedKey)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized. Invalid admin passcode.' }));
      return;
    }

    try {
      const bookings = readJSON(BOOKINGS_FILE, []);
      const visitsData = readJSON(VISITS_FILE, { totalVisits: 0, uniqueIps: {}, visits: [] });

      const totalVisits = visitsData.totalVisits || 0;
      const uniqueVisitors = Object.keys(visitsData.uniqueIps || {}).length;
      const totalBookings = bookings.length;
      
      let totalRevenue = 0;
      const categoryCounts = {
        female: 0,
        stag: 0,
        couple: 0,
        standing: 0,
        vip: 0
      };

      bookings.forEach(b => {
        totalRevenue += (b.amount || 0);
        const t = (b.ticketType || '').toLowerCase();
        if (categoryCounts[t] !== undefined) {
          categoryCounts[t]++;
        } else {
          categoryCounts[t] = 1;
        }
      });

      // Today's visits calculation
      const todayString = new Date().toLocaleDateString('en-IN');
      const todayVisits = (visitsData.visits || []).filter(v => v.date === todayString).length;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        summary: {
          totalVisits,
          uniqueVisitors,
          todayVisits,
          totalBookings,
          totalRevenue,
          categoryCounts
        },
        bookings: bookings,
        recentVisits: (visitsData.visits || []).slice(0, 100)
      }));
    } catch (err) {
      console.error('Error fetching admin data:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // =========================================================================
  // API ROUTE: Update Booking Status (POST /api/admin/update-status)
  // =========================================================================
  if (req.method === 'POST' && pathname === '/api/admin/update-status') {
    const providedKey = req.headers['x-admin-key'] || query.key;
    if (!checkAdminKey(providedKey)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized.' }));
      return;
    }

    try {
      const body = await parseBody(req);
      const { bookingRef, status } = body;
      if (!bookingRef || !status) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing bookingRef or status' }));
        return;
      }

      const bookings = readJSON(BOOKINGS_FILE, []);
      const idx = bookings.findIndex(b => b.bookingRef === bookingRef);
      if (idx === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Booking reference not found' }));
        return;
      }

      bookings[idx].status = status;
      writeJSON(BOOKINGS_FILE, bookings);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, booking: bookings[idx] }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // =========================================================================
  // API ROUTE: Delete Single Booking (POST /api/admin/delete-booking)
  // =========================================================================
  if (req.method === 'POST' && pathname === '/api/admin/delete-booking') {
    const providedKey = req.headers['x-admin-key'] || query.key;
    if (!checkAdminKey(providedKey)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized.' }));
      return;
    }

    try {
      const body = await parseBody(req);
      const { bookingRef } = body;
      if (!bookingRef) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing bookingRef' }));
        return;
      }

      let bookings = readJSON(BOOKINGS_FILE, []);
      const initialLength = bookings.length;
      bookings = bookings.filter(b => b.bookingRef !== bookingRef);

      if (bookings.length === initialLength) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Booking reference not found' }));
        return;
      }

      writeJSON(BOOKINGS_FILE, bookings);

      console.log(`[BOOKING DELETED] Reference ${bookingRef} removed.`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Booking deleted successfully', bookingRef }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // =========================================================================
  // API ROUTE: Clear All / Reset Test Data (POST /api/admin/clear-all)
  // =========================================================================
  if (req.method === 'POST' && pathname === '/api/admin/clear-all') {
    const providedKey = req.headers['x-admin-key'] || query.key;
    if (!checkAdminKey(providedKey)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized.' }));
      return;
    }

    try {
      const body = await parseBody(req);
      writeJSON(BOOKINGS_FILE, []);
      
      if (body && body.clearVisits) {
        writeJSON(VISITS_FILE, { totalVisits: 0, uniqueIps: {}, visits: [] });
      }

      console.log(`[ADMIN DATA RESET] All test bookings cleared by admin.`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'All test bookings cleared successfully.' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // =========================================================================
  // API ROUTE: Export CSV (GET /api/admin/export-csv)
  // =========================================================================
  if (req.method === 'GET' && pathname === '/api/admin/export-csv') {
    const providedKey = req.headers['x-admin-key'] || query.key;
    if (!checkAdminKey(providedKey)) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized. Invalid admin passcode.');
      return;
    }

    try {
      const bookings = readJSON(BOOKINGS_FILE, []);
      const headers = ['Booking Ref', 'Guest Name', 'Phone', 'Age', 'Email', 'Ticket Type', 'Amount (INR)', 'Guests Count', 'Status', 'Booking Date', 'Notes'];
      
      const rows = bookings.map(b => [
        `"${(b.bookingRef || '').replace(/"/g, '""')}"`,
        `"${(b.fullName || '').replace(/"/g, '""')}"`,
        `"${(b.phone || '').replace(/"/g, '""')}"`,
        `"${b.age || ''}"`,
        `"${(b.email || '').replace(/"/g, '""')}"`,
        `"${(b.ticketName || b.ticketType || '').replace(/"/g, '""')}"`,
        `"${b.amount || 0}"`,
        `"${b.guestCount || 1}"`,
        `"${(b.status || '').replace(/"/g, '""')}"`,
        `"${(b.formattedDate || b.timestamp || '').replace(/"/g, '""')}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="after_dark_attendees_' + Date.now() + '.csv"'
      });
      res.end(csvContent);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error generating CSV: ' + err.message);
    }
    return;
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);

  // Security barrier against escaping root
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>404 - Page Not Found</title><style>body{background:#05070d;color:#fff;font-family:sans-serif;text-align:center;padding:100px 20px;}a{color:#4fc3f7;text-decoration:none;}</style></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The requested file does not exist on the AFTER DARK server.</p>
          <p><a href="/">Return to Event Page</a></p>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ AFTER DARK Server & Analytics Engine is LIVE!`);
  console.log(`🌙 Main Website:       http://localhost:${PORT}`);
  console.log(`🔐 Owner Admin Portal: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Admin Passcode:     ${ADMIN_KEY}`);
  console.log(`======================================================\n`);
});
