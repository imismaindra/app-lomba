const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'echotech_super_secret_key_12345';
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

// Create tables helper
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      user_id INTEGER PRIMARY KEY,
      scan_reminders INTEGER DEFAULT 1,
      reward_updates INTEGER DEFAULT 1,
      eco_tips INTEGER DEFAULT 1,
      app_updates INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating notification_settings table:', err.message);
    } else {
      console.log('Notification settings table ready.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY,
      language_code TEXT DEFAULT 'id',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_preferences table:', err.message);
    } else {
      console.log('User preferences table ready.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      confidence REAL NOT NULL,
      points INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating scan_history table:', err.message);
    } else {
      console.log('Scan history table ready.');
    }
  });
}

// Database helper functions wrapped in Promises
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getMlPythonPath = () => {
  if (process.env.ML_PYTHON_PATH) {
    return process.env.ML_PYTHON_PATH;
  }

  const localVenvPython = path.join(__dirname, '..', 'ml', '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(localVenvPython)) {
    return localVenvPython;
  }

  return 'python';
};

const predictWasteImage = (imagePath) => {
  const pythonPath = getMlPythonPath();
  const scriptPath = path.join(__dirname, '..', 'ml', 'predict_image.py');
  const modelPath = path.join(__dirname, '..', 'ml', 'artifacts', 'best_model.keras');
  const labelsPath = path.join(__dirname, '..', 'ml', 'artifacts', 'labels.json');

  return new Promise((resolve, reject) => {
    execFile(
      pythonPath,
      [
        scriptPath,
        '--image',
        imagePath,
        '--model',
        modelPath,
        '--labels',
        labelsPath,
      ],
      { cwd: path.join(__dirname, '..', 'ml'), timeout: 120000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch (parseError) {
          reject(new Error(`Gagal membaca hasil prediksi: ${stdout}`));
        }
      }
    );
  });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak disediakan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa' });
    }

    req.user = decoded;
    next();
  });
};

// Route: Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Simple validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Harap isi semua kolom' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    // Check if user already exists
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email sudah terdaftar' });
      }
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    await dbRun(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.toLowerCase().trim(), email.toLowerCase().trim(), hashedPassword]
    );

    res.status(201).json({ success: true, message: 'Registrasi berhasil!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Route: Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Harap isi semua kolom' });
    }

    const input = emailOrUsername.toLowerCase().trim();

    // Find user by email or username
    const user = await dbGet('SELECT * FROM users WHERE email = ? OR username = ?', [input, input]);
    if (!user) {
      return res.status(400).json({ error: 'Email atau username tidak terdaftar' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Password salah' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Route: Get Profile (Authenticated Route)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Akses ditolak. Token tidak disediakan.' });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa' });
      }

      const user = await dbGet('SELECT id, username, email, created_at FROM users WHERE id = ?', [decoded.id]);
      if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      res.json({ success: true, user });
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Route: Update Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const cleanUsername = username?.toLowerCase().trim();
    const cleanEmail = email?.toLowerCase().trim();

    if (!cleanUsername || !cleanEmail) {
      return res.status(400).json({ error: 'Username dan email wajib diisi' });
    }

    const existingUser = await dbGet(
      'SELECT id, username, email FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [cleanUsername, cleanEmail, req.user.id]
    );

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
      }
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    await dbRun('UPDATE users SET username = ?, email = ? WHERE id = ?', [
      cleanUsername,
      cleanEmail,
      req.user.id,
    ]);

    const updatedUser = await dbGet(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
});

// Route: Change Password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Gagal mengubah password' });
  }
});

// Route: Get Notification Settings
app.get('/api/notification-settings', authenticateToken, async (req, res) => {
  try {
    let settings = await dbGet('SELECT * FROM notification_settings WHERE user_id = ?', [req.user.id]);

    if (!settings) {
      await dbRun('INSERT INTO notification_settings (user_id) VALUES (?)', [req.user.id]);
      settings = await dbGet('SELECT * FROM notification_settings WHERE user_id = ?', [req.user.id]);
    }

    res.json({
      success: true,
      settings: {
        scanReminders: !!settings.scan_reminders,
        rewardUpdates: !!settings.reward_updates,
        ecoTips: !!settings.eco_tips,
        appUpdates: !!settings.app_updates,
      },
    });
  } catch (error) {
    console.error('Notification settings fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat pengaturan notifikasi' });
  }
});

// Route: Update Notification Settings
app.put('/api/notification-settings', authenticateToken, async (req, res) => {
  try {
    const { scanReminders, rewardUpdates, ecoTips, appUpdates } = req.body;

    await dbRun(`
      INSERT INTO notification_settings (
        user_id, scan_reminders, reward_updates, eco_tips, app_updates
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        scan_reminders = excluded.scan_reminders,
        reward_updates = excluded.reward_updates,
        eco_tips = excluded.eco_tips,
        app_updates = excluded.app_updates
    `, [
      req.user.id,
      scanReminders ? 1 : 0,
      rewardUpdates ? 1 : 0,
      ecoTips ? 1 : 0,
      appUpdates ? 1 : 0,
    ]);

    res.json({ success: true, message: 'Pengaturan notifikasi tersimpan' });
  } catch (error) {
    console.error('Notification settings update error:', error);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan notifikasi' });
  }
});

const SUPPORTED_LANGUAGES = [
  { code: 'id', name: 'Indonesia', nativeName: 'Bahasa Indonesia' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda' },
];

// Route: Get Languages
app.get('/api/languages', authenticateToken, async (req, res) => {
  try {
    let preferences = await dbGet('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);

    if (!preferences) {
      await dbRun('INSERT INTO user_preferences (user_id) VALUES (?)', [req.user.id]);
      preferences = await dbGet('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    }

    res.json({
      success: true,
      languages: SUPPORTED_LANGUAGES,
      selectedLanguage: preferences.language_code || 'id',
    });
  } catch (error) {
    console.error('Languages fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar bahasa' });
  }
});

// Route: Update Language
app.put('/api/languages', authenticateToken, async (req, res) => {
  try {
    const { languageCode } = req.body;
    const isSupported = SUPPORTED_LANGUAGES.some((language) => language.code === languageCode);

    if (!isSupported) {
      return res.status(400).json({ error: 'Bahasa tidak didukung' });
    }

    await dbRun(`
      INSERT INTO user_preferences (user_id, language_code)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET language_code = excluded.language_code
    `, [req.user.id, languageCode]);

    res.json({ success: true, selectedLanguage: languageCode });
  } catch (error) {
    console.error('Language update error:', error);
    res.status(500).json({ error: 'Gagal menyimpan bahasa' });
  }
});

const getPointLevel = (totalPoints) => {
  if (totalPoints >= 700) {
    return {
      level: 'Platinum',
      nextLevelPoints: totalPoints,
      nextLevelName: 'Level maksimum',
    };
  }

  if (totalPoints >= 300) {
    return {
      level: 'Gold',
      nextLevelPoints: 700,
      nextLevelName: 'Platinum',
    };
  }

  if (totalPoints >= 100) {
    return {
      level: 'Silver',
      nextLevelPoints: 300,
      nextLevelName: 'Gold',
    };
  }

  return {
    level: 'Bronze',
    nextLevelPoints: 100,
    nextLevelName: 'Silver',
  };
};

const rewards = [
  {
    id: 1,
    name: 'Voucher Belanja',
    description: 'Voucher Rp10.000',
    points: 50,
    icon: 'cart-outline',
    available: true,
  },
  {
    id: 2,
    name: 'Pulsa Listrik',
    description: 'Pulsa Rp20.000',
    points: 100,
    icon: 'flash-outline',
    available: true,
  },
  {
    id: 3,
    name: 'Bibit Tanaman',
    description: 'Paket 3 bibit pohon',
    points: 150,
    icon: 'leaf-outline',
    available: true,
  },
  {
    id: 4,
    name: 'E-Tumbler',
    description: 'Tumbler stainless steel',
    points: 300,
    icon: 'cup-outline',
    available: false,
  },
  {
    id: 5,
    name: 'Voucher Makanan',
    description: 'Voucher Rp50.000',
    points: 500,
    icon: 'restaurant-outline',
    available: false,
  },
];

// Route: Get Scan History
app.get('/api/scan-history', authenticateToken, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT id, label, category, confidence, points, created_at
      FROM scan_history
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
    `, [req.user.id]);

    const history = rows.map((row) => ({
      id: String(row.id),
      wasteType: row.label,
      category: row.category,
      confidence: Number(row.confidence || 0),
      points: Number(row.points || 0),
      date: row.created_at,
    }));

    const totalPoints = history.reduce((sum, item) => sum + item.points, 0);

    res.json({
      success: true,
      history,
      summary: {
        totalPoints,
        totalScan: history.length,
      },
    });
  } catch (error) {
    console.error('Scan history fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat riwayat scan' });
  }
});

// Route: Get Eco Point data
app.get('/api/eco-points', authenticateToken, async (req, res) => {
  try {
    const scanStats = await dbGet(`
      SELECT
        COALESCE(SUM(points), 0) AS total_points,
        COUNT(*) AS scan_count
      FROM scan_history
      WHERE user_id = ?
    `, [req.user.id]);

    const totalPoints = Number(scanStats?.total_points || 0);
    const itemsRecycled = Number(scanStats?.scan_count || 0);
    const levelInfo = getPointLevel(totalPoints);
    const co2Saved = Number((itemsRecycled * 0.68).toFixed(1));

    res.json({
      success: true,
      userPoints: {
        totalPoints,
        ...levelInfo,
        co2Saved,
        itemsRecycled,
      },
      rewards,
    });
  } catch (error) {
    console.error('Eco points fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat data Eco Poin' });
  }
});

// Route: Predict Waste Image
app.post('/api/predict-waste', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Foto sampah wajib dikirim' });
  }

  try {
    const prediction = await predictWasteImage(req.file.path);
    await dbRun(
      `
        INSERT INTO scan_history (user_id, label, category, confidence, points)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        prediction.label || 'Tidak diketahui',
        prediction.category || 'Anorganik',
        typeof prediction.confidence === 'number' ? prediction.confidence : 0,
        Number(prediction.points || 0),
      ]
    );

    res.json({ success: true, prediction });
  } catch (error) {
    console.error('Waste prediction error:', error);
    res.status(500).json({
      error: 'Gagal memprediksi gambar sampah',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  } finally {
    fs.unlink(req.file.path, (unlinkError) => {
      if (unlinkError) {
        console.error('Failed to delete uploaded image:', unlinkError);
      }
    });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}` });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
