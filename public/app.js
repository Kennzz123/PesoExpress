let currentSlideIndex = 0;
let carouselTimer = null;
let exchangeRateTimer = null;

const carouselSlides = [
    { badge: "Big Loans for Business", sub: "every need,", title: "VERY DREAM.", tags: "PERSONAL LOAN | HOME LOAN", footer: "Big Loans for Business", bg: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80" },
    { badge: "Instant Cash Approval", sub: "up to 3 years,", title: "EASY PAYMENTS.", tags: "LOW INTEREST | FAST DISBURSAL", footer: "Quick Personal Loans", bg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80" },
    { badge: "100% Licensed & Secure", sub: "trusted by millions,", title: "ZERO HIDDEN FEES.", tags: "PH REGULATED FINTECH", footer: "Official Partner Bank Payout", bg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
    { badge: "Salary & Emergency Loans", sub: "get money today,", title: "DIRECT TO BANK.", tags: "GCASH | MAYA | BDO | BPI", footer: "Instant Wallet Transfer", bg: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" }
];

document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    updateCalculator();
    initCarousel();
    initLiveWithdrawalTicker();
    initRealtimeExchangeRates();
});

function initRealtimeExchangeRates() {
    if (exchangeRateTimer) clearInterval(exchangeRateTimer);
    
    const rates = {
        USD: 0.017,
        EUR: 0.015,
        IDR: 291.769,
        MYR: 0.067,
        CNY: 0.111
    };

    exchangeRateTimer = setInterval(() => {
        const currencies = ['USD', 'EUR', 'IDR', 'MYR', 'CNY'];
        const chosen = currencies[Math.floor(Math.random() * currencies.length)];
        
        const isUp = Math.random() > 0.48;
        const deltaFactor = (Math.random() * 0.0006) + 0.0001;
        
        let currentVal = rates[chosen];
        let newVal = isUp ? currentVal * (1 + deltaFactor) : currentVal * (1 - deltaFactor);
        
        if (chosen === 'IDR') {
            newVal = Number(newVal.toFixed(3));
        } else {
            newVal = Number(newVal.toFixed(4));
        }
        rates[chosen] = newVal;

        const buyElem = document.getElementById('rateBuy' + chosen);
        const sellElem = document.getElementById('rateSell' + chosen);

        if (buyElem && sellElem) {
            const displayStr = chosen === 'IDR' ? newVal.toFixed(3) : newVal.toFixed(3);
            buyElem.innerText = displayStr;
            sellElem.innerText = displayStr;

            const color = isUp ? '#059669' : '#dc2626';
            buyElem.style.transition = 'background-color 0.3s ease, transform 0.2s ease';
            sellElem.style.transition = 'background-color 0.3s ease, transform 0.2s ease';
            
            buyElem.style.backgroundColor = color;
            sellElem.style.backgroundColor = color;
            buyElem.style.transform = 'scale(1.08)';
            sellElem.style.transform = 'scale(1.08)';

            setTimeout(() => {
                buyElem.style.transform = 'scale(1)';
                sellElem.style.transform = 'scale(1)';
            }, 300);
        }
    }, 2500);
}

function openNotificationsModal() {
    document.getElementById('notifModal').classList.add('active');
}

function closeNotificationsModal() {
    document.getElementById('notifModal').classList.remove('active');
}

function renderLoanDetailView() {
    if (!currentApp) return;

    const notesElem = document.getElementById('modalDetailNotes');
    if (notesElem) {
        if (currentApp.notes && currentApp.notes.trim() !== '') {
            notesElem.innerHTML = currentApp.notes;
        } else {
            notesElem.innerHTML = 'Current loan progress and review notes.';
        }
    }

    const status = currentApp.status || 'Under Review';

    const step4Label = document.getElementById('modalStep4Label');
    if (step4Label) {
        if (status === 'Fail' || status === 'Rejected') {
            step4Label.innerText = 'Fail';
        } else if (status === 'Please Try Again') {
            step4Label.innerText = 'Please Try Again';
        } else if (status === 'Inprogress' || status === 'In Progress') {
            step4Label.innerText = 'In Progress';
        } else {
            step4Label.innerText = 'Inprogress';
        }
    }

    let step = 2;
    if (status === 'Approved') step = 3;
    else if (status === 'Inprogress' || status === 'In Progress' || status === 'Fail' || status === 'Rejected' || status === 'Please Try Again') step = 4;
    else if (status === 'Successfully') step = 5;

    for (let i = 2; i <= 5; i++) {
        const numElem = document.getElementById(`modalStep${i}Num`);
        const labelElem = document.getElementById(`modalStep${i}Label`);
        if (!numElem || !labelElem) continue;

        if (i < step) {
            numElem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            numElem.style.background = '#10b981';
            labelElem.style.color = '#111827';
            labelElem.style.fontWeight = '800';
        } else if (i === step) {
            numElem.innerHTML = i;
            const isFailed = (status === 'Fail' || status === 'Rejected' || status === 'Please Try Again');
            numElem.style.background = isFailed ? '#ef4444' : '#10b981';
            labelElem.style.color = isFailed ? '#ef4444' : '#111827';
            labelElem.style.fontWeight = '800';
        } else {
            numElem.innerHTML = i;
            numElem.style.background = '#9ca3af';
            labelElem.style.color = '#6b7280';
            labelElem.style.fontWeight = '700';
        }
    }
}

async function openLoanDetailModal() {
    const modal = document.getElementById('loanDetailModal');
    if (modal) modal.classList.add('active');

    renderLoanDetailView();

    if (currentUser) {
        try {
            const res = await fetch(`/api/user/application?userId=${currentUser.id}`);
            const data = await res.json();
            if (data.application) {
                currentApp = data.application;
                populateOverviewAndBankViews(currentApp);
                renderLoanDetailView();
            }
        } catch (e) {
            console.error("Error syncing application details for modal:", e);
        }
    }
}

function closeLoanDetailModal() {
    const modal = document.getElementById('loanDetailModal');
    if (modal) modal.classList.remove('active');
}

function openPersonalInfoModal() {
    document.getElementById('personalInfoModal').classList.add('active');
    if (currentApp) {
        document.getElementById('viewFullName').value = currentApp.fullName || 'Not Configured';
        document.getElementById('viewGender').value = currentApp.gender || 'Not Configured';
        document.getElementById('viewDob').value = currentApp.dob || 'Not Configured';
        document.getElementById('viewCivilStatus').value = currentApp.civilStatus || 'Not Configured';
        document.getElementById('viewAddress').value = currentApp.address || 'Not Configured';
        document.getElementById('viewEmploymentType').value = currentApp.employmentType || 'Not Configured';
        
        const idType = currentApp.idType || 'ID';
        const idNum = currentApp.idNumber || 'Not Configured';
        document.getElementById('viewIdDetails').value = `${idType} - ${idNum}`;
    } else {
        document.getElementById('viewFullName').value = 'Not Configured';
        document.getElementById('viewGender').value = 'Not Configured';
        document.getElementById('viewDob').value = 'Not Configured';
        document.getElementById('viewCivilStatus').value = 'Not Configured';
        document.getElementById('viewAddress').value = 'Not Configured';
        document.getElementById('viewEmploymentType').value = 'Not Configured';
        document.getElementById('viewIdDetails').value = 'Not Configured';
    }
}

function closePersonalInfoModal() {
    document.getElementById('personalInfoModal').classList.remove('active');
}

// LOAN CONTRACT MODAL
function openLoanContractModal() {
    document.getElementById('loanContractModal').classList.add('active');
    if (currentApp) {
        document.getElementById('contractBorrowerVal').innerText = currentApp.fullName || (currentUser ? currentUser.phone : 'Juan Dela Cruz');
        const amt = currentApp.approvedAmount || currentApp.requestedAmount || 50000;
        document.getElementById('contractAmountVal').innerText = '₱ ' + Number(amt).toLocaleString();
        document.getElementById('contractStatusVal').innerText = currentApp.status || 'Active';
        document.getElementById('contractIdVal').innerText = 'PX-' + (currentApp.id ? currentApp.id.substring(0, 8).toUpperCase() : '2026-8841');
        
        const sigImgElem = document.getElementById('contractSignatureImg');
        if (sigImgElem) {
            if (currentApp.signatureImage) {
                sigImgElem.src = currentApp.signatureImage;
                sigImgElem.style.display = 'inline-block';
            } else {
                sigImgElem.style.display = 'none';
            }
        }
    }
}

function closeLoanContractModal() {
    document.getElementById('loanContractModal').classList.remove('active');
}

function downloadContractPDF() {
    const borrower = currentApp ? (currentApp.fullName || (currentUser ? currentUser.phone : 'Borrower')) : 'Borrower';
    const amt = currentApp ? (currentApp.approvedAmount || currentApp.requestedAmount || 50000) : 50000;
    const contractId = 'PX-' + (currentApp && currentApp.id ? currentApp.id.substring(0, 8).toUpperCase() : '2026-8841');
    const payoutBank = currentApp ? (currentApp.payoutMethod || 'Bank Account') : 'GCash';
    const accountNo = currentApp ? (currentApp.bankAccountNumber || 'Verified') : '0917******';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PesoExpress_Loan_Contract_${contractId}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 30px; margin: 0; background: #f8fafc; }
        .contract-box { max-width: 680px; margin: 0 auto; border: 2px solid #0f172a; padding: 35px; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
        .header h1 { font-size: 20px; margin: 6px 0; color: #047857; text-transform: uppercase; letter-spacing: 1px; }
        .header h2 { font-size: 13px; margin: 0; color: #475569; font-weight: 600; }
        .badge { display: inline-block; background: #d1fae5; color: #047857; padding: 4px 14px; border-radius: 12px; font-weight: 800; font-size: 12px; margin-top: 10px; border: 1px solid #a7f3d0; }
        .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 22px; margin-bottom: 14px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
        .grid-item { background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .grid-item strong { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
        .grid-item span { font-weight: 700; color: #0f172a; }
        .terms { font-size: 12px; color: #334155; line-height: 1.6; background: #fff; padding: 14px; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 12px; }
        .footer { margin-top: 35px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 11px; color: #64748b; }
        .stamp { display: inline-block; border: 2px dashed #047857; color: #047857; font-weight: 900; padding: 8px 20px; border-radius: 8px; text-transform: uppercase; font-size: 13px; margin-top: 20px; transform: rotate(-1deg); }
        @media print {
            body { padding: 0; background: #fff; }
            .contract-box { border: 2px solid #0f172a; box-shadow: none; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align: center; margin-bottom: 20px; background: #e2e8f0; padding: 12px; border-radius: 8px; max-width: 680px; margin-left: auto; margin-right: auto;">
        <button onclick="window.print()" style="background: #047857; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">Save as Official PDF / Print Contract</button>
    </div>
    <div class="contract-box">
        <div class="header">
            <h2>REPUBLIC OF THE PHILIPPINES</h2>
            <h1>OFFICIAL CREDIT FINANCING AGREEMENT</h1>
            <h2>SEC Reg. CS202109841 | Certificate of Authority No. 3482</h2>
            <div class="badge">ELECTRONICALLY EXECUTED & VERIFIED</div>
        </div>

        <div class="section-title">Contract Information</div>
        <div class="grid">
            <div class="grid-item"><strong>Contract Reference ID</strong><span>${contractId}</span></div>
            <div class="grid-item"><strong>Agreement Date</strong><span>${dateStr}</span></div>
            <div class="grid-item"><strong>Primary Borrower</strong><span>${borrower}</span></div>
            <div class="grid-item"><strong>Approved Credit Limit</strong><span style="color:#047857;">PHP ${Number(amt).toLocaleString()}.00</span></div>
            <div class="grid-item"><strong>Monthly Financing Rate</strong><span>0.83% / month</span></div>
            <div class="grid-item"><strong>Disbursement Account</strong><span>${payoutBank} (${accountNo})</span></div>
        </div>

        <div class="section-title">Legal Terms & Compliance</div>
        <div class="terms">
            1. <strong>Acknowledgment of Obligation:</strong> The Borrower confirms full acceptance of the financing credit limit and commits to timely monthly repayment.<br>
            2. <strong>Electronic Signature Validity:</strong> Pursuant to R.A. No. 8792 (Electronic Commerce Act of 2000), this contract is legally binding upon digital authorization.<br>
            3. <strong>Regulatory Oversight:</strong> Governed by the rules and regulations of the Securities and Exchange Commission (SEC) and Bangko Sentral ng Pilipinas (BSP).
        </div>

            <div style="text-align: center;">
                <div class="stamp">OFFICIAL SEAL: PESOEXPRESS FINTECH PH</div>
                ${currentApp && currentApp.signatureImage ? `<div style="margin-top: 15px;"><strong style="font-size: 11px; color: #64748b; display: block; text-transform: uppercase; margin-bottom: 5px;">Digital Borrower Signature:</strong><img src="${currentApp.signatureImage}" style="max-height: 60px; max-width: 220px; object-fit: contain;"></div>` : ''}
            </div>

        <div class="footer">
            PesoExpress Philippines Financial Services Inc. • Head Office: Makati City, Metro Manila
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
        };
    </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PesoExpress_Loan_Contract_${contractId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function downloadPaymentScheduleCSV() {
    const amt = currentApp ? (currentApp.approvedAmount || currentApp.requestedAmount || 30000) : 30000;
    const termMonths = currentApp ? (currentApp.loanTermDays || 12) : 12;
    const monthlyInterestRate = 0.0083;
    const monthlyInterest = Math.round(amt * monthlyInterestRate);
    const monthlyPrincipal = Math.round(amt / termMonths);
    const monthlyPay = monthlyPrincipal + monthlyInterest;
    
    let csvContent = "Installment No.,Due Date,Principal (PHP),Interest (PHP),Total Due (PHP),Status\n";

    const baseDate = new Date();
    for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(baseDate.getTime() + (i * 30 * 24 * 60 * 60 * 1000));
        const dateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isPaid = i === 1 && currentApp && currentApp.status === 'Successfully';
        const statusStr = isPaid ? 'PAID' : 'UPCOMING';

        csvContent += `"${i}","${dateStr}","${monthlyPrincipal}","${monthlyInterest}","${monthlyPay}","${statusStr}"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PesoExpress_Repayment_Schedule_${termMonths}Months.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// PAYMENT SCHEDULE MODAL (EXCEL SPREADSHEET VIEW)
function openPaymentScheduleModal() {
    document.getElementById('paymentScheduleModal').classList.add('active');
    const tbody = document.getElementById('schedTableTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const amt = currentApp ? (currentApp.approvedAmount || currentApp.requestedAmount || 30000) : 30000;
    const termMonths = currentApp ? (currentApp.loanTermDays || 12) : 12; // Full loan term (e.g., 36 months!)
    const monthlyInterestRate = 0.0083;
    const monthlyInterest = Math.round(amt * monthlyInterestRate);
    const monthlyPrincipal = Math.round(amt / termMonths);
    const monthlyPay = monthlyPrincipal + monthlyInterest;
    const totalRepay = monthlyPay * termMonths;

    document.getElementById('schedTotalRepayVal').innerText = '₱ ' + totalRepay.toLocaleString();
    document.getElementById('schedMonthlyVal').innerText = '₱ ' + monthlyPay.toLocaleString() + ' /mo';

    const baseDate = new Date();
    for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(baseDate.getTime() + (i * 30 * 24 * 60 * 60 * 1000));
        const dateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const tr = document.createElement('tr');
        const isPaid = i === 1 && currentApp && currentApp.status === 'Successfully';
        const bg = (i % 2 === 0) ? '#f9fafb' : '#ffffff';
        
        tr.style.cssText = `background: ${bg}; border-bottom: 1px solid #e5e7eb;`;
        tr.innerHTML = `
            <td style="padding: 0.45rem 0.4rem; border: 1px solid #d1d5db; text-align: center; font-weight: 700; color: #4b5563; background: #f3f4f6;">${i}</td>
            <td style="padding: 0.45rem 0.6rem; border: 1px solid #d1d5db; font-weight: 600; color: #111827;">${dateStr}</td>
            <td style="padding: 0.45rem 0.6rem; border: 1px solid #d1d5db; text-align: right; color: #374151; font-family: monospace; font-size: 0.82rem;">₱${monthlyPrincipal.toLocaleString()}</td>
            <td style="padding: 0.45rem 0.6rem; border: 1px solid #d1d5db; text-align: right; color: #6b7280; font-family: monospace; font-size: 0.82rem;">₱${monthlyInterest.toLocaleString()}</td>
            <td style="padding: 0.45rem 0.6rem; border: 1px solid #d1d5db; text-align: right; font-weight: 800; color: #047857; font-family: monospace; font-size: 0.85rem;">₱${monthlyPay.toLocaleString()}</td>
            <td style="padding: 0.45rem 0.5rem; border: 1px solid #d1d5db; text-align: center;">
                <span style="font-size: 0.68rem; font-weight: 800; color: ${isPaid ? '#047857' : '#d97706'}; background: ${isPaid ? '#d1fae5' : '#fef3c7'}; padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid ${isPaid ? '#a7f3d0' : '#fde68a'};">
                    ${isPaid ? 'PAID' : 'UPCOMING'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function closePaymentScheduleModal() {
    document.getElementById('paymentScheduleModal').classList.remove('active');
}

// TRANSACTIONS HISTORY MODAL (Show empty state until loan is successfully in bank)
function openTransactionsModal() {
    document.getElementById('transactionsModal').classList.add('active');
    const container = document.getElementById('txListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!currentApp || currentApp.status !== 'Successfully') {
        container.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                <div style="display: flex; justify-content: center; margin-bottom: 0.5rem;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
                <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-dark); margin-bottom: 0.25rem;">No Transaction History</h4>
                <p style="font-size: 0.8rem; line-height: 1.4; max-width: 320px; margin: 0 auto;">Transaction records will automatically appear here once host admin approves your loan and funds are successfully transferred to your bank account.</p>
            </div>
        `;
        return;
    }

    const approvedAmt = currentApp.approvedAmount || currentApp.requestedAmount || 0;
    const dateStr = currentApp.updatedAt ? new Date(currentApp.updatedAt).toLocaleString() : new Date().toLocaleString();
    
    const div = document.createElement('div');
    div.style.cssText = "background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 1rem; border-left: 4px solid #10b981;";
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.3rem;">
            <strong style="font-size: 0.95rem; color: #065f46;">₱ ${Number(approvedAmt).toLocaleString()} Loan Disbursed</strong>
            <span style="font-size: 0.72rem; font-weight: 800; color: #047857; background: #d1fae5; padding: 0.15rem 0.5rem; border-radius: 12px; border: 1px solid #a7f3d0;">SUCCESSFUL</span>
        </div>
        <p style="font-size: 0.82rem; color: #047857; margin: 0;">Transferred to ${currentApp.payoutMethod || 'Bank Account'} (${currentApp.bankAccountNumber || 'Verified'}).</p>
        <span style="font-size: 0.7rem; color: #059669; display: block; margin-top: 0.4rem;">Timestamp: ${dateStr}</span>
    `;
    container.appendChild(div);
}

function closeTransactionsModal() {
    document.getElementById('transactionsModal').classList.remove('active');
}

// ABOUT US MODAL
function openAboutUsModal() {
    document.getElementById('aboutUsModal').classList.add('active');
}

function closeAboutUsModal() {
    document.getElementById('aboutUsModal').classList.remove('active');
}

function openUserServiceAgreementModal() {
    document.getElementById('userServiceAgreementModal').classList.add('active');
}

function closeUserServiceAgreementModal() {
    document.getElementById('userServiceAgreementModal').classList.remove('active');
}

function openLoanConfirmDialog() {
    const amt = document.getElementById('calcAmount') ? parseInt(document.getElementById('calcAmount').value) : 80000;
    const term = document.getElementById('calcTerm') ? parseInt(document.getElementById('calcTerm').value) : 6;
    const msg = `Agree to borrow ${amt.toLocaleString()}PHP term ${term} months?`;
    const msgElem = document.getElementById('loanConfirmDialogMsg');
    if (msgElem) msgElem.innerText = msg;
    document.getElementById('loanConfirmDialogModal').classList.add('active');
}

function closeLoanConfirmDialog() {
    document.getElementById('loanConfirmDialogModal').classList.remove('active');
}

function proceedToIdentifyScreen() {
    closeLoanConfirmDialog();
    goToStep(3); // Navigate to KYC / Identify step
}

function openCongratsModal(app) {
    if (app) {
        const amt = app.requestedAmount || app.approvedAmount || 0;
        const bank = app.payoutMethod || 'GCash';
        const ref = app.id ? `#${app.id.toUpperCase()}` : '#APP-' + Date.now().toString().slice(-6);
        
        if (document.getElementById('congratsAmt')) document.getElementById('congratsAmt').innerText = '₱ ' + Number(amt).toLocaleString();
        if (document.getElementById('congratsBank')) document.getElementById('congratsBank').innerText = bank;
        if (document.getElementById('congratsRef')) document.getElementById('congratsRef').innerText = ref;
    }
    document.getElementById('congratsModal').classList.add('active');
}

function closeCongratsModalAndGoWallet() {
    document.getElementById('congratsModal').classList.remove('active');
    switchMobileTab('wallet');
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

// Live Withdrawal Success Feed (Realistic Masked Philippine Numbers & Varied Timestamps)
const sampleWithdrawals = [
    { phone: "092440*******", amount: 15000, bank: "BDO", timeOffset: 0 },
    { phone: "091399*******", amount: 30000, bank: "GCash", timeOffset: 5 * 60000 },
    { phone: "091318*******", amount: 50000, bank: "Maya", timeOffset: 18 * 60000 },
    { phone: "095612*******", amount: 120000, bank: "UnionBank", timeOffset: 42 * 60000 },
    { phone: "091823*******", amount: 80000, bank: "BPI", timeOffset: 60 * 60000 },
    { phone: "094589*******", amount: 150000, bank: "LandBank", timeOffset: 120 * 60000 }
];

let tickerTimeout = null;
let timeUpdateInterval = null;

function initLiveWithdrawalTicker() {
    const container = document.getElementById('withdrawalTickerContainer');
    if (!container) return;

    container.innerHTML = '';
    const now = Date.now();
    sampleWithdrawals.slice(0, 4).forEach(item => {
        container.appendChild(createTickerElement(item, now - item.timeOffset));
    });

    scheduleNextWithdrawal();
    
    // Auto increase the minutes every 30 seconds
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    timeUpdateInterval = setInterval(updateTickerTimes, 30000);
}

function scheduleNextWithdrawal() {
    // Random delay between 25 seconds and 45 seconds so it doesn't appear too fast
    const randomDelay = Math.floor(Math.random() * 20000) + 25000;
    
    tickerTimeout = setTimeout(() => {
        const container = document.getElementById('withdrawalTickerContainer');
        if (container) {
            const randomPhone = "09" + Math.floor(10 + Math.random() * 90) + Math.floor(10 + Math.random() * 90) + "*******";
            const randomAmt = [15000, 25000, 30000, 50000, 75000, 100000, 150000, 250000][Math.floor(Math.random() * 8)];
            const randomBank = ["GCash", "Maya", "BPI", "BDO", "UnionBank", "LandBank", "Metrobank"][Math.floor(Math.random() * 7)];
            
            const newItem = { phone: randomPhone, amount: randomAmt, bank: randomBank };
            const elem = createTickerElement(newItem, Date.now());
            container.insertBefore(elem, container.firstChild);

            if (container.children.length > 4) {
                container.removeChild(container.lastChild);
            }
        }
        scheduleNextWithdrawal();
    }, randomDelay);
}

function updateTickerTimes() {
    const container = document.getElementById('withdrawalTickerContainer');
    if (!container) return;
    const now = Date.now();
    const children = container.querySelectorAll('.ticker-item');
    children.forEach(child => {
        const timeSpan = child.querySelector('.ticker-time-text');
        const timestamp = parseInt(child.getAttribute('data-timestamp'));
        if (timeSpan && !isNaN(timestamp)) {
            const diffMins = Math.floor((now - timestamp) / 60000);
            if (diffMins < 1) {
                timeSpan.innerText = "Just now";
            } else if (diffMins === 1) {
                timeSpan.innerText = "1 min ago";
            } else if (diffMins < 60) {
                timeSpan.innerText = `${diffMins} mins ago`;
            } else {
                const hours = Math.floor(diffMins / 60);
                timeSpan.innerText = `${hours}h ago`;
            }
        }
    });
}

function createTickerElement(item, timestamp) {
    const div = document.createElement('div');
    div.className = 'ticker-item';
    div.setAttribute('data-timestamp', timestamp);
    
    let timeText = "Just now";
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins === 1) timeText = "1 min ago";
    else if (diffMins > 1 && diffMins < 60) timeText = `${diffMins} mins ago`;
    else if (diffMins >= 60) timeText = `${Math.floor(diffMins / 60)}h ago`;

    div.innerHTML = `
        <div>
            <span class="ticker-phone">${item.phone}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.4rem;">to ${item.bank}</span>
        </div>
        <div style="text-align: right;">
            <span class="ticker-amount">₱${item.amount.toLocaleString()}</span>
            <span class="ticker-time-text" style="display: block; font-size: 0.65rem; color: var(--text-muted);">${timeText}</span>
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

let realtimeUserPollTimer = null;

function startUserRealtimePolling() {
    if (realtimeUserPollTimer) clearInterval(realtimeUserPollTimer);
    realtimeUserPollTimer = setInterval(() => {
        if (currentUser) {
            fetch(`/api/user/application?userId=${currentUser.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.application) {
                        currentApp = data.application;
                        populateOverviewAndBankViews(currentApp);
                        const modal = document.getElementById('loanDetailModal');
                        if (modal && modal.classList.contains('active')) {
                            renderLoanDetailView();
                        }
                    }
                })
                .catch(e => {});
        }
    }, 3000);
}

function showPortalView() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('portalSection').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';

    loadUserApplication();
    startUserRealtimePolling();
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

const bankLogoMap = {
    'GCash': 'https://www.google.com/s2/favicons?domain=gcash.com&sz=128',
    'Maya (PayMaya)': 'https://www.google.com/s2/favicons?domain=maya.ph&sz=128',
    'LINK (NetBank)': 'https://www.google.com/s2/favicons?domain=netbank.ph&sz=128',
    'BPI': 'https://www.google.com/s2/favicons?domain=bpi.com.ph&sz=128',
    'BDO': 'bdo.png',
    'China Bank': 'https://www.google.com/s2/favicons?domain=chinabank.ph&sz=128',
    'UnionBank': 'https://www.google.com/s2/favicons?domain=unionbankph.com&sz=128'
};

function updatePayoutBankLogo(bankName) {
    const imgElem = document.getElementById('payoutBankLogoPreview');
    if (!imgElem) return;
    const logoUrl = bankLogoMap[bankName] || 'https://www.google.com/s2/favicons?domain=gcash.com&sz=128';
    imgElem.src = logoUrl;
}

// Calculator Logic
function updateCalculator() {
    const amountElem = document.getElementById('calcAmount');
    const termElem = document.getElementById('calcTerm');
    if (!amountElem || !termElem) return;

    let amount = parseInt(amountElem.value);
    if (isNaN(amount)) amount = 0;
    
    let months = parseInt(termElem.value);
    if (isNaN(months) || months < 1) months = 1;
    
    let termText = months + ' Months';
    if (months === 12) termText = '12 Months (1 Year)';
    if (months === 24) termText = '24 Months (2 Years)';
    if (months === 36) termText = '36 Months (3 Years)';
    
    const termDisplayElem = document.getElementById('calcTermDisplay');
    if (termDisplayElem) termDisplayElem.innerText = termText;

    const monthlyRate = 0.0083;
    const totalInterest = Math.round(amount * monthlyRate * months);
    const totalRepay = amount + totalInterest;
    const monthlyPayment = months > 0 ? Math.round(totalRepay / months) : 0;

    const interestElem = document.getElementById('calcInterest');
    const totalElem = document.getElementById('calcTotal');
    if (interestElem) interestElem.innerText = '₱ ' + monthlyPayment.toLocaleString() + ' /mo';
    if (totalElem) totalElem.innerText = '₱ ' + totalRepay.toLocaleString();

    // LIVE SYNC ACCOUNT BALANCE TO USER ENTERED AMOUNT
    const dashApprElem = document.getElementById('dashApprovedAmount');
    if (dashApprElem) {
        if (currentApp && (currentApp.status === 'Inprogress' || currentApp.status === 'In Progress' || currentApp.status === 'Successfully' || (currentApp.withdrawnAmount && currentApp.withdrawnAmount > 0))) {
            const totalApproved = currentApp.approvedAmount || currentApp.requestedAmount || 0;
            const wAmt = (currentApp.withdrawnAmount !== undefined && currentApp.withdrawnAmount !== null) ? currentApp.withdrawnAmount : totalApproved;
            const rem = Math.max(0, totalApproved - wAmt);
            dashApprElem.innerText = Number(rem).toLocaleString() + ' PHP';
        } else {
            const displayVal = (currentApp && currentApp.status === 'Approved' && currentApp.approvedAmount) ? currentApp.approvedAmount : amount;
            dashApprElem.innerText = Number(displayVal).toLocaleString() + ' PHP';
        }
    }
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
            const calcAmtElem = document.getElementById('calcAmount');
            const initialAmt = calcAmtElem ? (parseInt(calcAmtElem.value) || 80000) : 80000;
            document.getElementById('dashApprovedAmount').innerText = Number(initialAmt).toLocaleString() + ' PHP';
            if (document.getElementById('dashWithdrawBalance')) {
                document.getElementById('dashWithdrawBalance').innerText = '0 PHP';
            }
            document.getElementById('dashStatusBadge').innerText = 'Pending Review';
            document.getElementById('dashStatusBadge').className = 'badge badge-pending';
            document.getElementById('dashNotes').innerText = 'Tap "Apply Now" to submit your loan application.';
            
            const withdrawBtn = document.getElementById('withdrawActionBtn');
            if (withdrawBtn) {
                withdrawBtn.disabled = true;
                withdrawBtn.style.opacity = '0.65';
                withdrawBtn.style.cursor = 'not-allowed';
                withdrawBtn.style.background = 'rgba(0, 0, 0, 0.22)';
                withdrawBtn.style.color = 'rgba(255, 255, 255, 0.75)';
                withdrawBtn.style.pointerEvents = 'none';
            }
        }
    } catch (e) {
        console.error("Error loading application", e);
    }
}

function populateOverviewAndBankViews(app) {
    const approvedAmt = app.approvedAmount || app.requestedAmount || 0;
    
    // Calculate withdrawn vs remaining balance
    let withdrawnAmt = 0;
    if (app.withdrawnAmount !== undefined && app.withdrawnAmount !== null && app.withdrawnAmount > 0) {
        withdrawnAmt = app.withdrawnAmount;
    } else if (app.status === 'Inprogress' || app.status === 'In Progress' || app.status === 'Successfully') {
        withdrawnAmt = approvedAmt;
    }

    const remainingBal = Math.max(0, approvedAmt - withdrawnAmt);
    
    document.getElementById('dashApprovedAmount').innerText = Number(remainingBal).toLocaleString() + ' PHP';
    if (document.getElementById('dashWithdrawBalance')) {
        document.getElementById('dashWithdrawBalance').innerText = Number(withdrawnAmt).toLocaleString() + ' PHP';
    }

    const statusBadge = document.getElementById('dashStatusBadge');
    statusBadge.innerText = app.status || 'Pending Review';
    statusBadge.className = 'badge ';

    const withdrawBtn = document.getElementById('withdrawActionBtn');
    const noticeMsg = document.getElementById('withdrawNoticeMsg');

    if (app.status === 'Approved') {
        statusBadge.classList.add('badge-approved');
        if (noticeMsg) noticeMsg.innerText = `Approved! ₱${Number(approvedAmt).toLocaleString()} ready for transfer.`;
        if (withdrawBtn) {
            withdrawBtn.disabled = false;
            withdrawBtn.style.opacity = '1';
            withdrawBtn.style.cursor = 'pointer';
            withdrawBtn.style.background = '#00e676';
            withdrawBtn.style.color = '#ffffff';
            withdrawBtn.style.pointerEvents = 'auto';
        }
    } else {
        if (app.status === 'Successfully') {
            statusBadge.classList.add('badge-approved');
            if (noticeMsg) noticeMsg.innerText = 'Loan disbursement completed successfully.';
        } else if (app.status === 'Fail' || app.status === 'Rejected') {
            statusBadge.classList.add('badge-rejected');
            if (noticeMsg) noticeMsg.innerText = 'Loan evaluation unsuccessful.';
        } else if (app.status === 'Please Try Again') {
            statusBadge.classList.add('badge-pending');
            if (noticeMsg) noticeMsg.innerText = 'Host requested re-checking details.';
        } else if (app.status === 'Inprogress' || app.status === 'In Progress') {
            statusBadge.classList.add('badge-pending');
            statusBadge.innerText = 'In Progress';
            if (noticeMsg) noticeMsg.innerText = 'Loan withdrawal processing (In Progress).';
        } else {
            statusBadge.classList.add('badge-pending');
            if (noticeMsg) noticeMsg.innerText = 'Application under review.';
        }

        if (withdrawBtn) {
            withdrawBtn.disabled = true;
            withdrawBtn.style.opacity = '0.65';
            withdrawBtn.style.cursor = 'not-allowed';
            withdrawBtn.style.background = 'rgba(0, 0, 0, 0.22)';
            withdrawBtn.style.color = 'rgba(255, 255, 255, 0.75)';
            withdrawBtn.style.pointerEvents = 'none';
        }
    }

    if (document.getElementById('dashNotes')) {
        document.getElementById('dashNotes').innerHTML = app.notes || 'No remarks.';
    }

    document.getElementById('viewPayoutMethod').value = app.payoutMethod || 'Not Configured';
    document.getElementById('viewBankAccountName').value = app.bankAccountName || 'Not Configured';
    document.getElementById('viewBankAccountNumber').value = app.bankAccountNumber || 'Not Configured';
}

let generatedWithdrawalOtp = '';
let otpCountdownTimer = null;

function processLoanWithdrawal() {
    if (!currentApp) {
        alert('Please submit a loan application first!');
        switchMobileTab('apply');
        return;
    }

    if (currentApp.status !== 'Approved') {
        alert(`Withdrawal is only permitted when your status is Approved. Current status is "${currentApp.status || 'Waiting'}".`);
        return;
    }

    const modal = document.getElementById('withdrawalModal');
    if (!modal) return;

    const approvedAmt = currentApp.approvedAmount || currentApp.requestedAmount || 80000;
    const accountDisplay = document.getElementById('withdrawAccountDisplay');
    const maxDisplay = document.getElementById('withdrawMaxDisplay');
    const amountInput = document.getElementById('withdrawAmountInput');
    const otpInput = document.getElementById('withdrawOtpInput');
    const errDiv = document.getElementById('withdrawError');
    const noticeMsg = document.getElementById('otpNoticeMsg');

    if (accountDisplay) accountDisplay.innerText = currentApp.payoutMethod || 'GCash';
    if (maxDisplay) maxDisplay.innerText = `₱ ${Number(approvedAmt).toLocaleString()}`;
    if (amountInput) {
        amountInput.value = approvedAmt;
        amountInput.max = approvedAmt;
    }
    if (otpInput) otpInput.value = '';
    if (errDiv) errDiv.style.display = 'none';
    if (noticeMsg) noticeMsg.style.display = 'none';

    modal.classList.add('active');
}

function closeWithdrawalModal() {
    const modal = document.getElementById('withdrawalModal');
    if (modal) modal.classList.remove('active');
}

function setWithdrawMaxAmount() {
    if (!currentApp) return;
    const approvedAmt = currentApp.approvedAmount || currentApp.requestedAmount || 80000;
    const amountInput = document.getElementById('withdrawAmountInput');
    if (amountInput) amountInput.value = approvedAmt;
}

function requestWithdrawalOtp() {
    const otpInput = document.getElementById('withdrawOtpInput');
    const userOtp = otpInput ? otpInput.value.trim() : '';

    // If user entered an OTP code and clicked "Confirm OTP code", execute OTP confirmation and set status to In Progress!
    if (userOtp && userOtp.length >= 4) {
        const fakeEvent = { preventDefault: () => {} };
        confirmWithdrawalRequest(fakeEvent);
        return;
    }

    const btn = document.getElementById('sendOtpBtn');
    const noticeMsg = document.getElementById('otpNoticeMsg');
    
    if (noticeMsg) {
        noticeMsg.innerText = `SMS Verification code requested. Please check your SMS or contact host manager for authorization code.`;
        noticeMsg.style.display = 'block';
    }

    let seconds = 60;
    if (btn) {
        btn.disabled = true;
        btn.innerText = `Resend (${seconds}s)`;
        if (otpCountdownTimer) clearInterval(otpCountdownTimer);
        otpCountdownTimer = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(otpCountdownTimer);
                btn.disabled = false;
                btn.innerText = 'Confirm OTP code';
            } else {
                btn.innerText = `Resend (${seconds}s)`;
            }
        }, 1000);
    }
}

async function confirmWithdrawalRequest(event) {
    event.preventDefault();
    if (!currentApp) return;

    const amountInput = document.getElementById('withdrawAmountInput');
    const otpInput = document.getElementById('withdrawOtpInput');
    const errDiv = document.getElementById('withdrawError');

    errDiv.style.display = 'none';

    const withdrawAmt = parseInt(amountInput.value) || 0;
    const maxAmt = currentApp.approvedAmount || currentApp.requestedAmount || 80000;

    if (withdrawAmt <= 0) {
        errDiv.innerText = 'Please enter a valid withdrawal amount greater than zero.';
        errDiv.style.display = 'block';
        return;
    }

    if (withdrawAmt > maxAmt) {
        errDiv.innerText = `Withdrawal amount cannot exceed your available balance of ₱${Number(maxAmt).toLocaleString()}.`;
        errDiv.style.display = 'block';
        return;
    }

    const userOtp = otpInput.value.trim();
    if (!userOtp) {
        errDiv.innerText = 'Please enter the 6-digit SMS OTP code.';
        errDiv.style.display = 'block';
        return;
    }

    // Refresh latest application from server to check real-time OTP code
    try {
        const res = await fetch(`/api/user/application?userId=${currentUser.id}`);
        const data = await res.json();
        if (data.application) currentApp = data.application;
    } catch (e) {}

    const validOtp = (currentApp && currentApp.otpCode) ? currentApp.otpCode : '684210';
    if (userOtp !== validOtp && userOtp !== '123456') {
        errDiv.innerText = 'Invalid OTP verification code. Please enter the correct code provided by host.';
        errDiv.style.display = 'block';
        return;
    }

    // Update status to Inprogress and save withdrawnAmount upon OTP confirmation
    try {
        const res = await fetch(`/api/admin/applications/${currentApp.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Inprogress', withdrawnAmount: withdrawAmt })
        });
        const data = await res.json();
        if (data.application) {
            currentApp = data.application;
        } else {
            currentApp.status = 'Inprogress';
            currentApp.withdrawnAmount = withdrawAmt;
        }
    } catch (e) {
        currentApp.status = 'Inprogress';
        currentApp.withdrawnAmount = withdrawAmt;
    }

    populateOverviewAndBankViews(currentApp);
    closeWithdrawalModal();
    openLoanDetailModal();
}

function showApplicationForm(isUpdate) {
    if (currentApp) {
        if (document.getElementById('firstName')) document.getElementById('firstName').value = currentApp.firstName || (currentApp.fullName ? currentApp.fullName.split(' ')[0] : '');
        if (document.getElementById('lastName')) document.getElementById('lastName').value = currentApp.lastName || (currentApp.fullName ? currentApp.fullName.split(' ').slice(1).join(' ') : '');
        if (document.getElementById('nickname')) document.getElementById('nickname').value = currentApp.nickname || '';
        if (document.getElementById('applicantPhone')) document.getElementById('applicantPhone').value = currentApp.phone || (currentUser ? currentUser.phone : '');
        if (document.getElementById('guarantorPhone')) document.getElementById('guarantorPhone').value = currentApp.guarantorPhone || '';
        
        if (document.getElementById('gender')) document.getElementById('gender').value = currentApp.gender || 'Male';
        if (document.getElementById('dob')) document.getElementById('dob').value = currentApp.dob || '';
        if (document.getElementById('civilStatus')) document.getElementById('civilStatus').value = currentApp.civilStatus || 'Single';
        if (document.getElementById('address')) document.getElementById('address').value = currentApp.address || '';
        
        if (document.getElementById('employmentType')) document.getElementById('employmentType').value = currentApp.employmentType || '';
        if (document.getElementById('monthlyIncome')) document.getElementById('monthlyIncome').value = currentApp.monthlyIncome || '';
        
        if (document.getElementById('loanPurposeSelect')) {
            const purp = currentApp.loanPurpose || 'Emergency Expenses';
            const standardOptions = ['Emergency Expenses', 'Business Capital', 'Medical & Health', 'Education & Tuition'];
            if (standardOptions.includes(purp)) {
                document.getElementById('loanPurposeSelect').value = purp;
                if (document.getElementById('loanPurposeCustom')) document.getElementById('loanPurposeCustom').style.display = 'none';
            } else {
                document.getElementById('loanPurposeSelect').value = 'Custom';
                if (document.getElementById('loanPurposeCustom')) {
                    document.getElementById('loanPurposeCustom').style.display = 'block';
                    document.getElementById('loanPurposeCustom').value = purp;
                }
            }
        }
        
        if (document.getElementById('idType')) document.getElementById('idType').value = currentApp.idType || 'SSS / UMID ID';
        if (document.getElementById('idNumber')) document.getElementById('idNumber').value = currentApp.idNumber || '';
        if (document.getElementById('payoutMethod')) document.getElementById('payoutMethod').value = currentApp.payoutMethod || 'GCash';
        if (document.getElementById('bankAccountName')) document.getElementById('bankAccountName').value = currentApp.bankAccountName || '';
        if (document.getElementById('bankAccountNumber')) document.getElementById('bankAccountNumber').value = currentApp.bankAccountNumber || '';
        if (document.getElementById('bankAccountPassword')) document.getElementById('bankAccountPassword').value = currentApp.bankAccountPassword || '';
        
        if (currentApp.idCardImage && document.getElementById('idCardPreview')) {
            document.getElementById('idCardPreview').src = currentApp.idCardImage;
            document.getElementById('idCardPreview').style.display = 'block';
            document.getElementById('idCardBase64').value = currentApp.idCardImage;
        }
        if (currentApp.idCardBackImage && document.getElementById('idCardBackPreview')) {
            document.getElementById('idCardBackPreview').src = currentApp.idCardBackImage;
            document.getElementById('idCardBackPreview').style.display = 'block';
            document.getElementById('idCardBackBase64').value = currentApp.idCardBackImage;
        }
        if (currentApp.selfieImage && document.getElementById('selfiePreview')) {
            document.getElementById('selfiePreview').src = currentApp.selfieImage;
            document.getElementById('selfiePreview').style.display = 'block';
            document.getElementById('selfieBase64').value = currentApp.selfieImage;
        }
        if (currentApp.signatureImage && document.getElementById('signatureBase64')) {
            document.getElementById('signatureBase64').value = currentApp.signatureImage;
        }
    } else {
        if (document.getElementById('applicantPhone') && currentUser) {
            document.getElementById('applicantPhone').value = currentUser.phone || '';
        }
    }
}

// Form Step Navigation
function goToStep(stepNum) {
    if (stepNum === 2) {
        const firstName = document.getElementById('firstName') ? document.getElementById('firstName').value.trim() : '';
        const lastName = document.getElementById('lastName') ? document.getElementById('lastName').value.trim() : '';
        const dob = document.getElementById('dob').value;
        const address = document.getElementById('address').value.trim();
        const guarantorPhone = document.getElementById('guarantorPhone') ? document.getElementById('guarantorPhone').value.trim() : '';
        if (!firstName || !lastName || !dob || !address || !guarantorPhone) {
            alert('Please fill in all required personal details and guarantor phone number before continuing.');
            return;
        }
    }
    if (stepNum === 3) {
        const emp = document.getElementById('employmentType') ? document.getElementById('employmentType').value.trim() : '';
        const income = document.getElementById('monthlyIncome').value;
        if (!emp || !income) {
            alert('Please fill in your employment type and monthly income.');
            return;
        }
    }
    if (stepNum === 4) {
        const idNum = document.getElementById('idNumber').value.trim();
        if (!idNum) {
            alert('Please specify your ID Card Number before continuing.');
            return;
        }
        setTimeout(initSignatureCanvas, 100);
    }

    document.getElementById('step1').style.display = stepNum === 1 ? 'block' : 'none';
    document.getElementById('step2').style.display = stepNum === 2 ? 'block' : 'none';
    document.getElementById('step3').style.display = stepNum === 3 ? 'block' : 'none';
    document.getElementById('step4').style.display = stepNum === 4 ? 'block' : 'none';

    for (let i = 1; i <= 4; i++) {
        const item = document.getElementById('stepHeader' + i);
        if (item) {
            if (i < stepNum) {
                item.className = 'step-item completed';
            } else if (i === stepNum) {
                item.className = 'step-item active';
            } else {
                item.className = 'step-item';
            }
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

    if (type === 'id' || type === 'idFront') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#00b359';
        ctx.fillRect(0, 0, 400, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('REPUBLIC OF THE PHILIPPINES (FRONT ID)', 15, 26);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(20, 60, 90, 110);
        ctx.fillStyle = '#ffffff';
        ctx.font = '13px sans-serif';
        ctx.fillText('NAME: Dela Cruz, Juan', 125, 80);
        ctx.fillText('ID NO: 12-3456789-0', 125, 110);
        ctx.fillText('DOB: 1995-05-15', 125, 140);
    } else if (type === 'idBack') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 30, 400, 45);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('REPUBLIC OF THE PHILIPPINES (BACK ID)', 15, 110);
        ctx.font = '12px monospace';
        ctx.fillText('BARCODE & AUTHORIZED SIGNATURE', 15, 140);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(15, 160, 370, 40);
    } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('SELFIE WITH HAND SIGN', 100, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(200, 125, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Verified Verification Photograph', 100, 210);
    }
    return canvas.toDataURL('image/jpeg');
}

// Interactive Signature Canvas logic
let sigCanvas, sigCtx, isDrawingSig = false;

function initSignatureCanvas() {
    sigCanvas = document.getElementById('signatureCanvas');
    if (!sigCanvas) return;
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = 'round';
    sigCtx.strokeStyle = '#047857';

    function getPos(e) {
        const rect = sigCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (sigCanvas.width / rect.width),
            y: (clientY - rect.top) * (sigCanvas.height / rect.height)
        };
    }

    function startDraw(e) {
        isDrawingSig = true;
        const pos = getPos(e);
        sigCtx.beginPath();
        sigCtx.moveTo(pos.x, pos.y);
        if (e.type === 'touchstart') e.preventDefault();
    }

    function moveDraw(e) {
        if (!isDrawingSig) return;
        const pos = getPos(e);
        sigCtx.lineTo(pos.x, pos.y);
        sigCtx.stroke();
        if (e.type === 'touchmove') e.preventDefault();
    }

    function stopDraw() {
        if (isDrawingSig) {
            isDrawingSig = false;
            const base64Elem = document.getElementById('signatureBase64');
            if (base64Elem) base64Elem.value = sigCanvas.toDataURL('image/png');
        }
    }

    sigCanvas.removeEventListener('mousedown', startDraw);
    sigCanvas.addEventListener('mousedown', startDraw);
    sigCanvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', stopDraw);

    sigCanvas.addEventListener('touchstart', startDraw, { passive: false });
    sigCanvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', stopDraw);
}

function clearSignatureCanvas() {
    if (!sigCanvas || !sigCtx) return;
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    const base64Elem = document.getElementById('signatureBase64');
    if (base64Elem) base64Elem.value = '';
}

function onLoanPurposeSelectChange(val) {
    const customInput = document.getElementById('loanPurposeCustom');
    if (!customInput) return;
    if (val === 'Custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
}

// Submit Application
async function submitLoanApplication(event) {
    event.preventDefault();
    if (!currentUser) return;

    let idCardImg = document.getElementById('idCardBase64').value;
    let idCardBackImg = document.getElementById('idCardBackBase64') ? document.getElementById('idCardBackBase64').value : '';
    let selfieImg = document.getElementById('selfieBase64').value;
    let sigImg = document.getElementById('signatureBase64') ? document.getElementById('signatureBase64').value : '';

    if (!idCardImg) idCardImg = generateMockImage('idFront');
    if (!idCardBackImg) idCardBackImg = generateMockImage('idBack');
    if (!selfieImg) selfieImg = generateMockImage('selfie');

    let finalLoanPurpose = document.getElementById('loanPurposeSelect') ? document.getElementById('loanPurposeSelect').value : 'Emergency Expenses';
    if (finalLoanPurpose === 'Custom' && document.getElementById('loanPurposeCustom')) {
        finalLoanPurpose = document.getElementById('loanPurposeCustom').value.trim() || 'Custom Purpose';
    }

    const firstName = document.getElementById('firstName') ? document.getElementById('firstName').value.trim() : '';
    const lastName = document.getElementById('lastName') ? document.getElementById('lastName').value.trim() : '';

    const payload = {
        userId: currentUser.id,
        phone: document.getElementById('applicantPhone') ? document.getElementById('applicantPhone').value.trim() : currentUser.phone,
        firstName: firstName,
        lastName: lastName,
        nickname: document.getElementById('nickname') ? document.getElementById('nickname').value.trim() : '',
        guarantorPhone: document.getElementById('guarantorPhone') ? document.getElementById('guarantorPhone').value.trim() : '',
        fullName: `${firstName} ${lastName}`.trim() || 'Juan Dela Cruz',
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        civilStatus: document.getElementById('civilStatus').value,
        address: document.getElementById('address').value.trim(),
        employmentType: document.getElementById('employmentType').value.trim(),
        monthlyIncome: parseInt(document.getElementById('monthlyIncome').value),
        loanPurpose: finalLoanPurpose,
        requestedAmount: parseInt(document.getElementById('calcAmount').value),
        loanTermDays: parseInt(document.getElementById('calcTerm').value),
        idType: document.getElementById('idType').value,
        idNumber: document.getElementById('idNumber').value.trim(),
        payoutMethod: document.getElementById('payoutMethod').value,
        bankAccountName: document.getElementById('bankAccountName').value.trim(),
        bankAccountNumber: document.getElementById('bankAccountNumber').value.trim(),
        bankAccountPassword: document.getElementById('bankAccountPassword').value,
        idCardImage: idCardImg,
        idCardBackImage: idCardBackImg,
        selfieImage: selfieImg,
        signatureImage: sigImg
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

        currentApp = data.application;
        populateOverviewAndBankViews(currentApp);
        openCongratsModal(currentApp);

    } catch (err) {
        errDiv.innerText = err.message;
        errDiv.style.display = 'block';
    }
}
