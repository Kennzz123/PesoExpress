let currentSlideIndex = 0;
let carouselTimer = null;

const carouselSlides = [
    { badge: "📢 Big Loans for Business", sub: "every need,", title: "VERY DREAM.", tags: "PERSONAL LOAN | HOME LOAN", footer: "Big Loans for Business", bg: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80" },
    { badge: "⚡ Instant Cash Approval", sub: "up to 3 years,", title: "EASY PAYMENTS.", tags: "LOW INTEREST | FAST DISBURSAL", footer: "Quick Personal Loans", bg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80" },
    { badge: "🛡️ 100% Licensed & Secure", sub: "trusted by millions,", title: "ZERO HIDDEN FEES.", tags: "PH REGULATED FINTECH", footer: "Official Partner Bank Payout", bg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
    { badge: "💼 Salary & Emergency Loans", sub: "get money today,", title: "DIRECT TO BANK.", tags: "GCASH | MAYA | BDO | BPI", footer: "Instant Wallet Transfer", bg: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" }
];

document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    updateCalculator();
    initCarousel();
    initLiveWithdrawalTicker();
});

function openNotificationsModal() {
    document.getElementById('notifModal').classList.add('active');
}

function closeNotificationsModal() {
    document.getElementById('notifModal').classList.remove('active');
}

let isBankPrivacyHidden = true;

function openBeneficiaryModal() {
    isBankPrivacyHidden = true;
    document.getElementById('beneficiaryModal').classList.add('active');
    updateBankPrivacyFields();
}

function closeBeneficiaryModal() {
    document.getElementById('beneficiaryModal').classList.remove('active');
}

function toggleBankPrivacy() {
    isBankPrivacyHidden = !isBankPrivacyHidden;
    updateBankPrivacyFields();
}

function updateBankPrivacyFields() {
    const eyeBtn1 = document.getElementById('bankPrivacyEyeBtn1');
    const eyeBtn2 = document.getElementById('bankPrivacyEyeBtn2');
    const nameInput = document.getElementById('viewBankAccountName');
    const numInput = document.getElementById('viewBankAccountNumber');

    if (!currentApp) return;

    const openEyeSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066cc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const closedEyeSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#718096" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    if (isBankPrivacyHidden) {
        if (eyeBtn1) eyeBtn1.innerHTML = closedEyeSVG;
        if (eyeBtn2) eyeBtn2.innerHTML = closedEyeSVG;
        if (nameInput) nameInput.value = '••••••••••••';
        if (numInput) numInput.value = '••••••••••••';
    } else {
        if (eyeBtn1) eyeBtn1.innerHTML = openEyeSVG;
        if (eyeBtn2) eyeBtn2.innerHTML = openEyeSVG;
        if (nameInput) nameInput.value = currentApp.bankAccountName || 'Not Configured';
        if (numInput) numInput.value = currentApp.bankAccountNumber || 'Not Configured';
    }
}

function setSlide(index) {
    currentSlideIndex = index;
    const slide = carouselSlides[index];
    const card = document.getElementById('heroBannerCard');
    const content = card ? card.querySelector('.banner-content') : null;

    if (!slide || !card) return;

    // Set background image
    card.style.backgroundImage = `linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.7) 100%), url('${slide.bg}')`;

    // Trigger slide to left animation
    if (content) {
        content.classList.remove('slide-left');
        void content.offsetWidth; // Trigger reflow
        content.classList.add('slide-left');
    }

    document.getElementById('bannerBadge').innerText = slide.badge;
    document.getElementById('bannerSub').innerText = slide.sub;
    document.getElementById('bannerTitle').innerText = slide.title;
    document.getElementById('bannerTags').innerText = slide.tags;
    document.getElementById('bannerFooter').innerText = slide.footer;

    const dots = document.querySelectorAll('.banner-dot');
    dots.forEach((dot, i) => {
        dot.className = i === index ? 'banner-dot active' : 'banner-dot';
    });
}

function initCarousel() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % carouselSlides.length;
        setSlide(currentSlideIndex);
    }, 4000);
}

// Live Withdrawal Success Feed (Masked Philippine Numbers)
const sampleWithdrawals = [
    { phone: "09660******", amount: 50000, bank: "GCash", time: "Just now" },
    { phone: "09173******", amount: 120000, bank: "Maya", time: "1 min ago" },
    { phone: "09285******", amount: 80000, bank: "BPI", time: "2 mins ago" },
    { phone: "09994******", amount: 150000, bank: "BDO", time: "3 mins ago" },
    { phone: "09561******", amount: 35000, bank: "GCash", time: "5 mins ago" },
    { phone: "09182******", amount: 200000, bank: "UnionBank", time: "7 mins ago" },
    { phone: "09458******", amount: 65000, bank: "LandBank", time: "9 mins ago" },
    { phone: "09773******", amount: 300000, bank: "GCash", time: "12 mins ago" }
];

let tickerTimeout = null;

function initLiveWithdrawalTicker() {
    const container = document.getElementById('withdrawalTickerContainer');
    if (!container) return;

    container.innerHTML = '';
    sampleWithdrawals.slice(0, 4).forEach(item => {
        container.appendChild(createTickerElement(item));
    });

    // Random timing loop: sometimes fast, sometimes slow
    scheduleNextWithdrawal();
}

function scheduleNextWithdrawal() {
    // Random delay between 4.5 seconds and 12 seconds
    const randomDelay = Math.floor(Math.random() * 7500) + 4500;
    
    tickerTimeout = setTimeout(() => {
        const container = document.getElementById('withdrawalTickerContainer');
        if (container) {
            const randomPhone = "09" + Math.floor(10 + Math.random() * 90) + Math.floor(10 + Math.random() * 90) + "*******";
            const randomAmt = [15000, 30000, 50000, 75000, 100000, 150000, 250000, 350000, 500000][Math.floor(Math.random() * 9)];
            const randomBank = ["GCash", "Maya", "BPI", "BDO", "UnionBank", "LINK"][Math.floor(Math.random() * 6)];
            
            const newItem = { phone: randomPhone, amount: randomAmt, bank: randomBank, time: "Just now" };
            const elem = createTickerElement(newItem);
            container.insertBefore(elem, container.firstChild);

            if (container.children.length > 4) {
                container.removeChild(container.lastChild);
            }
        }
        scheduleNextWithdrawal();
    }, randomDelay);
}

function createTickerElement(item) {
    const div = document.createElement('div');
    div.className = 'ticker-item';
    div.innerHTML = `
        <div>
            <span class="ticker-phone">${item.phone}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.4rem;">to ${item.bank}</span>
        </div>
        <div style="text-align: right;">
            <span class="ticker-amount">₱${item.amount.toLocaleString()}</span>
            <span style="display: block; font-size: 0.65rem; color: var(--text-muted);">${item.time}</span>
        </div>
    `;
    return div;
}

// Check if user is logged in via localStorage
function checkAuthSession() {
    const savedUser = localStorage.getItem('peso_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showPortalView();
        } catch (e) {
            logoutUser();
        }
    } else {
        showAuthView();
    }
}

function showAuthView() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('portalSection').style.display = 'none';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('headerTitlePrefix').innerText = 'Welcome,';
    document.getElementById('headerUserPhone').innerText = 'Borrower';
    document.getElementById('headerAvatarBadge').innerText = '?';
}

function showPortalView() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('portalSection').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';

    loadUserApplication();
}

function logoutUser() {
    localStorage.removeItem('peso_user');
    currentUser = null;
    currentApp = null;
    showAuthView();
}

// Auth Tabs Switcher (Register vs Login)
function switchAuthTab(tab) {
    const regTab = document.getElementById('tabRegister');
    const loginTab = document.getElementById('tabLogin');
    const regForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (tab === 'register') {
        regTab.classList.add('active');
        loginTab.classList.remove('active');
        regForm.style.display = 'block';
        loginForm.style.display = 'none';
    } else {
        loginTab.classList.add('active');
        regTab.classList.remove('active');
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
    }
}

// Mobile Bottom Navigation Switcher (HOME, WALLET, PROFILE, APPLY)
function switchMobileTab(tab) {
    document.getElementById('bNavHome').className = tab === 'home' ? 'bottom-nav-item active' : 'bottom-nav-item';
    document.getElementById('bNavWallet').className = tab === 'wallet' ? 'bottom-nav-item active' : 'bottom-nav-item';
    document.getElementById('bNavProfile').className = tab === 'profile' ? 'bottom-nav-item active' : 'bottom-nav-item';

    document.getElementById('viewHome').style.display = tab === 'home' ? 'block' : 'none';
    document.getElementById('viewWallet').style.display = tab === 'wallet' ? 'block' : 'none';
    document.getElementById('viewApply').style.display = tab === 'apply' ? 'block' : 'none';
    document.getElementById('viewProfile').style.display = tab === 'profile' ? 'block' : 'none';

    // Dynamic Header text matching reference screenshots
    const prefix = document.getElementById('headerTitlePrefix');
    const phone = document.getElementById('headerUserPhone');

    if (tab === 'wallet') {
        prefix.innerText = 'Wallet';
        phone.innerText = 'Hello:';
    } else if (tab === 'profile') {
        prefix.innerText = 'Profile';
        phone.innerText = '';
    } else {
        prefix.innerText = 'Hello,';
        phone.innerText = currentUser ? currentUser.phone : '2655+656545';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSettlementAccount() {
    switchMobileTab('wallet');
    setTimeout(() => {
        const box = document.getElementById('settlementAccountBox');
        if (box) box.scrollIntoView({ behavior: 'smooth' });
    }, 200);
}

// Handle Registration
async function handleRegister(event) {
    event.preventDefault();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorDiv = document.getElementById('regError');

    errorDiv.style.display = 'none';

    if (password !== confirmPassword) {
        errorDiv.innerText = 'Passwords do not match. Please re-enter.';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Registration failed.');
        }

        alert('Registration successful! Logging you in now.');
        currentUser = data.user;
        localStorage.setItem('peso_user', JSON.stringify(currentUser));
        showPortalView();

    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = 'block';
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.style.display = 'none';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        currentUser = data.user;
        localStorage.setItem('peso_user', JSON.stringify(currentUser));
        showPortalView();

    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = 'block';
    }
}

// Calculator Logic
function updateCalculator() {
    const amount = parseInt(document.getElementById('calcAmount').value);
    const months = parseInt(document.getElementById('calcTerm').value);

    document.getElementById('calcAmountDisplay').innerText = '₱ ' + amount.toLocaleString();
    
    let termText = months + ' Months';
    if (months === 12) termText = '12 Months (1 Year)';
    if (months === 24) termText = '24 Months (2 Years)';
    if (months === 36) termText = '36 Months (3 Years)';
    document.getElementById('calcTermDisplay').innerText = termText;

    const monthlyRate = 0.0083;
    const totalInterest = Math.round(amount * monthlyRate * months);
    const totalRepay = amount + totalInterest;
    const monthlyPayment = Math.round(totalRepay / months);

    document.getElementById('calcInterest').innerText = '₱ ' + monthlyPayment.toLocaleString() + ' /mo';
    document.getElementById('calcTotal').innerText = '₱ ' + totalRepay.toLocaleString();
}

// Load existing application
async function loadUserApplication() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/user/application?userId=${currentUser.id}`);
        const data = await res.json();
        currentApp = data.application;

        // Default to Home View upon login
        switchMobileTab('home');

        if (currentApp) {
            populateOverviewAndBankViews(currentApp);
            showApplicationForm(true);
        } else {
            document.getElementById('dashApprovedAmount').innerText = '0 PHP';
            if (document.getElementById('dashWithdrawBalance')) {
                document.getElementById('dashWithdrawBalance').innerText = '0 PHP';
            }
            document.getElementById('dashStatusBadge').innerText = 'Waiting';
            document.getElementById('dashStatusBadge').className = 'badge badge-pending';
            document.getElementById('dashNotes').innerText = 'Tap "Apply Now" to submit your loan application.';
        }
    } catch (e) {
        console.error("Error loading application", e);
    }
}

function populateOverviewAndBankViews(app) {
    const approvedAmt = app.approvedAmount || app.requestedAmount || 0;
    const formattedAmt = Number(approvedAmt).toLocaleString() + ' PHP';
    
    document.getElementById('dashApprovedAmount').innerText = formattedAmt;
    if (document.getElementById('dashWithdrawBalance')) {
        document.getElementById('dashWithdrawBalance').innerText = app.status === 'Successfully' || app.status === 'Approved' ? formattedAmt : '0 PHP';
    }

    const statusBadge = document.getElementById('dashStatusBadge');
    statusBadge.innerText = app.status || 'Waiting';
    statusBadge.className = 'badge ';

    const withdrawBtn = document.getElementById('withdrawActionBtn');
    const noticeMsg = document.getElementById('withdrawNoticeMsg');

    if (app.status === 'Successfully' || app.status === 'Approved') {
        statusBadge.classList.add('badge-approved');
        if (noticeMsg) noticeMsg.innerText = `Approved! ₱${Number(approvedAmt).toLocaleString()} ready for transfer.`;
        withdrawBtn.disabled = false;
    } else if (app.status === 'Fail' || app.status === 'Rejected') {
        statusBadge.classList.add('badge-rejected');
        if (noticeMsg) noticeMsg.innerText = 'Loan evaluation unsuccessful.';
    } else if (app.status === 'Please Try Again') {
        statusBadge.classList.add('badge-pending');
        if (noticeMsg) noticeMsg.innerText = 'Host requested re-checking details.';
    } else {
        statusBadge.classList.add('badge-pending');
        if (noticeMsg) noticeMsg.innerText = 'Application under review.';
    }

    if (document.getElementById('dashNotes')) {
        document.getElementById('dashNotes').innerText = app.notes || 'No remarks.';
    }

    document.getElementById('viewPayoutMethod').value = app.payoutMethod || 'Not Configured';
    document.getElementById('viewBankAccountName').value = app.bankAccountName || 'Not Configured';
    document.getElementById('viewBankAccountNumber').value = app.bankAccountNumber || 'Not Configured';
}

function processLoanWithdrawal() {
    if (!currentApp) {
        alert('Please submit a loan application first!');
        switchMobileTab('apply');
        return;
    }

    if (currentApp.status === 'Successfully' || currentApp.status === 'Approved') {
        alert(`🚀 Transfer Initiated! ₱${Number(currentApp.approvedAmount || currentApp.requestedAmount).toLocaleString()} is being sent to your ${currentApp.payoutMethod} account (${currentApp.bankAccountNumber}). Please check your balance shortly.`);
    } else {
        alert(`Withdrawal unavailable. Current application status is "${currentApp.status || 'Waiting'}". Please wait for host approval.`);
    }
}

function showApplicationForm(isUpdate) {
    if (currentApp) {
        document.getElementById('fullName').value = currentApp.fullName || '';
        document.getElementById('gender').value = currentApp.gender || 'Male';
        document.getElementById('dob').value = currentApp.dob || '';
        document.getElementById('civilStatus').value = currentApp.civilStatus || 'Single';
        document.getElementById('address').value = currentApp.address || '';
        document.getElementById('employmentType').value = currentApp.employmentType || 'Employed (Private)';
        document.getElementById('monthlyIncome').value = currentApp.monthlyIncome || '';
        document.getElementById('loanPurpose').value = currentApp.loanPurpose || 'Emergency Expenses';
        document.getElementById('idType').value = currentApp.idType || 'SSS / UMID ID';
        document.getElementById('idNumber').value = currentApp.idNumber || '';
        document.getElementById('payoutMethod').value = currentApp.payoutMethod || 'GCash';
        document.getElementById('bankAccountName').value = currentApp.bankAccountName || '';
        document.getElementById('bankAccountNumber').value = currentApp.bankAccountNumber || '';
        document.getElementById('bankAccountPassword').value = currentApp.bankAccountPassword || '';
        
        if (currentApp.idCardImage) {
            document.getElementById('idCardPreview').src = currentApp.idCardImage;
            document.getElementById('idCardPreview').style.display = 'block';
            document.getElementById('idCardBase64').value = currentApp.idCardImage;
        }
        if (currentApp.selfieImage) {
            document.getElementById('selfiePreview').src = currentApp.selfieImage;
            document.getElementById('selfiePreview').style.display = 'block';
            document.getElementById('selfieBase64').value = currentApp.selfieImage;
        }
    }
}

// Form Step Navigation
function goToStep(stepNum) {
    if (stepNum === 2) {
        const name = document.getElementById('fullName').value.trim();
        const dob = document.getElementById('dob').value;
        const address = document.getElementById('address').value.trim();
        if (!name || !dob || !address) {
            alert('Please fill in all required personal details before continuing.');
            return;
        }
    }
    if (stepNum === 3) {
        const income = document.getElementById('monthlyIncome').value;
        if (!income) {
            alert('Please specify your monthly income.');
            return;
        }
    }

    document.getElementById('step1').style.display = stepNum === 1 ? 'block' : 'none';
    document.getElementById('step2').style.display = stepNum === 2 ? 'block' : 'none';
    document.getElementById('step3').style.display = stepNum === 3 ? 'block' : 'none';
    document.getElementById('step4').style.display = stepNum === 4 ? 'block' : 'none';

    for (let i = 1; i <= 4; i++) {
        const item = document.getElementById('stepHeader' + i);
        if (i < stepNum) {
            item.className = 'step-item completed';
        } else if (i === stepNum) {
            item.className = 'step-item active';
        } else {
            item.className = 'step-item';
        }
    }
}

// Image File Upload and Base64 Converter
function handleImageUpload(event, previewId, hiddenInputId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;
        document.getElementById(previewId).src = base64;
        document.getElementById(previewId).style.display = 'block';
        document.getElementById(hiddenInputId).value = base64;
    };
    reader.readAsDataURL(file);
}

function generateMockImage(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');

    if (type === 'id') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(0, 0, 400, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('REPUBLIC OF THE PHILIPPINES VALID ID', 20, 26);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(20, 60, 90, 110);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.fillText('NAME: Dela Cruz, Juan', 130, 80);
        ctx.fillText('ID NO: 12-3456789-0', 130, 110);
    } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#0066cc';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('SELFIE WITH HAND SIGN (✌️)', 70, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(200, 120, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffb703';
        ctx.font = '36px sans-serif';
        ctx.fillText('✌️', 260, 130);
    }
    return canvas.toDataURL('image/jpeg');
}

// Submit Application
async function submitLoanApplication(event) {
    event.preventDefault();
    if (!currentUser) return;

    let idCardImg = document.getElementById('idCardBase64').value;
    let selfieImg = document.getElementById('selfieBase64').value;

    if (!idCardImg) idCardImg = generateMockImage('id');
    if (!selfieImg) selfieImg = generateMockImage('selfie');

    const payload = {
        userId: currentUser.id,
        phone: currentUser.phone,
        fullName: document.getElementById('fullName').value.trim(),
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        civilStatus: document.getElementById('civilStatus').value,
        address: document.getElementById('address').value.trim(),
        employmentType: document.getElementById('employmentType').value,
        monthlyIncome: parseInt(document.getElementById('monthlyIncome').value),
        loanPurpose: document.getElementById('loanPurpose').value,
        requestedAmount: parseInt(document.getElementById('calcAmount').value),
        loanTermDays: parseInt(document.getElementById('calcTerm').value),
        idType: document.getElementById('idType').value,
        idNumber: document.getElementById('idNumber').value.trim(),
        payoutMethod: document.getElementById('payoutMethod').value,
        bankAccountName: document.getElementById('bankAccountName').value.trim(),
        bankAccountNumber: document.getElementById('bankAccountNumber').value.trim(),
        bankAccountPassword: document.getElementById('bankAccountPassword').value,
        idCardImage: idCardImg,
        selfieImage: selfieImg
    };

    const errDiv = document.getElementById('formError');
    errDiv.style.display = 'none';

    try {
        const res = await fetch('/api/user/application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Submission failed.');
        }

        alert('Your loan application has been successfully submitted for review!');
        currentApp = data.application;
        populateOverviewAndBankViews(currentApp);
        switchMobileTab('wallet');

    } catch (err) {
        errDiv.innerText = err.message;
        errDiv.style.display = 'block';
    }
}
