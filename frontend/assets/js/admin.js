document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = window.getApiBaseUrl ? window.getApiBaseUrl() : 'http://localhost:5000/api';
    const UPLOADS_BASE_URL = window.getUploadsBaseUrl ? window.getUploadsBaseUrl() : 'http://localhost:5000/uploads';
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const headerMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const viewLinks = Array.from(document.querySelectorAll('[data-admin-view-link]'));
    const viewSections = Array.from(document.querySelectorAll('[data-admin-view]'));
    const actionButtons = Array.from(document.querySelectorAll('[data-admin-action]'));
    const headerSubtitle = document.getElementById('adminHeaderSubtitle');
    const requestStatusFilter = document.getElementById('adminRequestStatusFilter');
    const requestSortFilter = document.getElementById('adminRequestSortFilter');
    const exportRecordsBtn = document.getElementById('exportRecordsBtn');
    const modal = document.getElementById('requestPreviewModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const allRequestsBody = document.getElementById('allRequestsBody');
    const recordsBody = document.getElementById('recordsBody');
    const residentsBody = document.getElementById('residentsBody');
    const reportTotalThisMonth = document.getElementById('reportTotalThisMonth');
    const reportApprovedThisMonth = document.getElementById('reportApprovedThisMonth');
    const reportRejectedThisMonth = document.getElementById('reportRejectedThisMonth');
    const reportPendingThisMonth = document.getElementById('reportPendingThisMonth');
    const reportTypeBreakdown = document.getElementById('reportTypeBreakdown');
    const reportScreeningBreakdown = document.getElementById('reportScreeningBreakdown');
    const reportTopResidents = document.getElementById('reportTopResidents');
    const reportRecentDecisions = document.getElementById('reportRecentDecisions');
    const statTotalRequests = document.getElementById('statTotalRequests');
    const statPendingRequests = document.getElementById('statPendingRequests');
    const statApprovedRequests = document.getElementById('statApprovedRequests');
    const statRejectedRequests = document.getElementById('statRejectedRequests');
    const statNeedsReview = document.getElementById('statNeedsReview');
    const adminOverviewText = document.getElementById('adminOverviewText');
    const adminRecentRequestType = document.getElementById('adminRecentRequestType');
    const adminRecentResidentName = document.getElementById('adminRecentResidentName');
    const adminLatestFinalStatus = document.getElementById('adminLatestFinalStatus');
    const previewResidentName = document.getElementById('previewResidentName');
    const previewRequestType = document.getElementById('previewRequestType');
    const previewDateNeeded = document.getElementById('previewDateNeeded');
    const previewPurpose = document.getElementById('previewPurpose');
    const previewScreeningScore = document.getElementById('previewScreeningScore');
    const previewScreeningStatus = document.getElementById('previewScreeningStatus');
    const previewScreeningSummary = document.getElementById('previewScreeningSummary');
    const previewPaymentStatus = document.getElementById('previewPaymentStatus');
    const previewPaymentAmount = document.getElementById('previewPaymentAmount');
    const previewPaymentReference = document.getElementById('previewPaymentReference');
    const previewPaidAt = document.getElementById('previewPaidAt');
    const previewFinalStatus = document.getElementById('previewFinalStatus');
    const previewAdditionalNotes = document.getElementById('previewAdditionalNotes');
    const previewSupportingDocument = document.getElementById('previewSupportingDocument');
    const previewReleaseProof = document.getElementById('previewReleaseProof');
    const previewActionGuide = document.getElementById('previewActionGuide');
    const approveRequestBtn = document.getElementById('approveRequestBtn');
    const rejectRequestBtn = document.getElementById('rejectRequestBtn');
    const reviewRequestBtn = document.getElementById('reviewRequestBtn');
    const prepareRequestBtn = document.getElementById('prepareRequestBtn');
    const readyRequestBtn = document.getElementById('readyRequestBtn');
    const printRequestBtn = document.getElementById('printRequestBtn');
    const paymentStatusInput = document.getElementById('paymentStatusInput');
    const paymentAmountInput = document.getElementById('paymentAmountInput');
    const paymentReferenceInput = document.getElementById('paymentReferenceInput');
    const savePaymentBtn = document.getElementById('savePaymentBtn');
    const releaseProofInput = document.getElementById('releaseProofInput');
    const releaseProofSelected = document.getElementById('releaseProofSelected');
    const saveReleaseProofBtn = document.getElementById('saveReleaseProofBtn');

    let selectedRequest = null;
    let currentAdminView = 'dashboard';
    let allAdminRequests = [];

    if (!sidebar || !overlay) {
        return;
    }

    function formatRequestType(value) {
        const map = {
            clearance: 'Barangay Clearance',
            indigency: 'Certificate of Indigency',
            letter: 'Excuse / Supporting Letter',
            complaint: 'Complaint Submission',
            other: 'Other Request'
        };

        return map[value] || value || '-';
    }

    function formatDate(value) {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function formatCurrency(value) {
        const amount = Number(value) || 0;
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }

    function formatStatusLabel(status) {
        if (!status) {
            return '-';
        }

        return status
            .split('_')
            .map(function (part) {
                return part.charAt(0).toUpperCase() + part.slice(1);
            })
            .join(' ');
    }

    function getScreeningBadgeClass(status) {
        const map = {
            low_concern: 'status-low',
            needs_review: 'status-review',
            high_concern: 'status-high',
            pending_screening: 'status-pending'
        };

        return map[status] || 'status-pending';
    }

    function createStatusBadge(status, type) {
        const badge = document.createElement('span');
        badge.className = `status-badge ${type === 'screening' ? getScreeningBadgeClass(status) : `status-${status}`}`;
        badge.textContent = formatStatusLabel(status);
        return badge;
    }

    function setActionButtonLoading(button, isLoading, loadingText) {
        if (!button) {
            return;
        }

        if (!button.dataset.defaultLabel) {
            button.dataset.defaultLabel = button.innerHTML.trim();
        }

        if (isLoading) {
            button.disabled = true;
            button.classList.add('is-loading');
            button.setAttribute('aria-busy', 'true');
            button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${loadingText}</span>`;
            return;
        }

        button.disabled = false;
        button.classList.remove('is-loading');
        button.removeAttribute('aria-busy');
        button.innerHTML = button.dataset.defaultLabel;
    }

    function renderScreeningScore(score) {
        const normalizedScore = Number(score) || 0;
        const percentage = Math.max(0, Math.min(100, Math.round((normalizedScore / 12) * 100)));

        return `
            <div class="preview-score-meter">
                <div class="preview-score-topline">
                    <strong>${percentage}%</strong>
                    <span>${normalizedScore} pts</span>
                </div>
                <div class="preview-score-bar">
                    <span style="width: ${percentage}%"></span>
                </div>
            </div>
        `;
    }

    function setActionVisibility(button, shouldShow) {
        if (!button) {
            return;
        }

        button.classList.toggle('is-hidden', !shouldShow);
        button.disabled = !shouldShow;
    }

    function updatePreviewActions(request) {
        const status = request.final_status;
        const hasOutstandingPayment = Number(request.payment_amount) > 0 && request.payment_status !== 'paid';
        const statusMap = {
            submitted: {
                guide: 'Next step: start the review so the request can move into screening.',
                show: ['print', 'start_review', 'reject']
            },
            under_review: {
                guide: 'Next step: prepare the document once review is complete, or reject if needed.',
                show: ['print', 'prepare_document', 'reject']
            },
            preparing_document: {
                guide: 'Next step: mark the document as ready once the barangay copy is prepared.',
                show: ['print', 'mark_ready', 'reject']
            },
            ready_for_pickup: {
                guide: hasOutstandingPayment
                    ? 'This request is ready, but payment still needs to be marked as paid before completion.'
                    : 'Next step: complete the request after the resident receives the document.',
                show: hasOutstandingPayment ? ['print'] : ['print', 'complete']
            },
            completed: {
                guide: 'This request is already completed. You can still print the document summary.',
                show: ['print']
            },
            approved: {
                guide: 'This request is already completed. You can still print the document summary.',
                show: ['print']
            },
            rejected: {
                guide: 'This request has been rejected. Only printing is available now.',
                show: ['print']
            },
            pending: {
                guide: 'Next step: start the review so the request can move into screening.',
                show: ['print', 'start_review', 'reject']
            }
        };

        const config = statusMap[status] || statusMap.submitted;
        const visibleActions = new Set(config.show);

        if (previewActionGuide) {
            previewActionGuide.textContent = config.guide;
        }

        setActionVisibility(printRequestBtn, visibleActions.has('print'));
        setActionVisibility(reviewRequestBtn, visibleActions.has('start_review'));
        setActionVisibility(prepareRequestBtn, visibleActions.has('prepare_document'));
        setActionVisibility(readyRequestBtn, visibleActions.has('mark_ready'));
        setActionVisibility(approveRequestBtn, visibleActions.has('complete'));
        setActionVisibility(rejectRequestBtn, visibleActions.has('reject'));
    }

    function escapePrintHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function openPrintableSummary(request, options = {}) {
        const statusTitle = options.statusTitle || 'Processing Status';
        const printWindow = window.open('', '_blank', 'width=900,height=700');

        if (!printWindow) {
            window.alert('Please allow popups first so the print summary can open.');
            return;
        }

        const proofLabel = request.release_proof_file_name ? request.release_proof_file_name : 'No proof uploaded yet.';
        const documentLabel = request.supporting_file_name ? request.supporting_file_name : 'No file uploaded.';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>GayaGuard - Request Summary</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
                    .sheet { max-width: 820px; margin: 0 auto; }
                    .brand { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #176b4d; }
                    .brand small { display: block; color: #176b4d; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
                    .brand h1 { margin: 0 0 8px; font-size: 30px; color: #0f4f39; }
                    .brand p { margin: 0; color: #475569; line-height: 1.6; }
                    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 24px; }
                    .item { border: 1px solid #dbe7e0; border-radius: 14px; padding: 14px 16px; background: #fbfdfb; }
                    .item.full { grid-column: 1 / -1; }
                    .label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
                    .value { font-size: 15px; line-height: 1.7; color: #0f172a; word-break: break-word; }
                    .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
                    @media print {
                        body { margin: 0; }
                        .sheet { max-width: none; }
                    }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div class="brand">
                        <small>GayaGuard</small>
                        <h1>Request Summary</h1>
                        <p>Barangay Gaya Gaya Request Screening and Monitoring System</p>
                    </div>
                    <div class="grid">
                        <div class="item"><span class="label">Resident Name</span><div class="value">${escapePrintHtml(request.full_name || '-')}</div></div>
                        <div class="item"><span class="label">Request Type</span><div class="value">${escapePrintHtml(formatRequestType(request.request_type))}</div></div>
                        <div class="item"><span class="label">Date Submitted</span><div class="value">${escapePrintHtml(formatDate(request.created_at))}</div></div>
                        <div class="item"><span class="label">Date Needed</span><div class="value">${escapePrintHtml(formatDate(request.date_needed))}</div></div>
                        <div class="item"><span class="label">Screening Score</span><div class="value">${escapePrintHtml(`${Math.max(0, Math.min(100, Math.round(((Number(request.screening_score) || 0) / 12) * 100)))}% (${Number(request.screening_score) || 0} pts)`)}</div></div>
                        <div class="item"><span class="label">Screening Status</span><div class="value">${escapePrintHtml(formatStatusLabel(request.screening_status))}</div></div>
                        <div class="item"><span class="label">${escapePrintHtml(statusTitle)}</span><div class="value">${escapePrintHtml(formatStatusLabel(request.final_status))}</div></div>
                        <div class="item"><span class="label">Payment Status</span><div class="value">${escapePrintHtml(formatStatusLabel(request.payment_status || 'unpaid'))}</div></div>
                        <div class="item"><span class="label">Payment Amount</span><div class="value">${escapePrintHtml(formatCurrency(request.payment_amount))}</div></div>
                        <div class="item"><span class="label">Payment Reference</span><div class="value">${escapePrintHtml(request.payment_reference || 'No payment reference yet.')}</div></div>
                        <div class="item full"><span class="label">Purpose</span><div class="value">${escapePrintHtml(request.purpose || '-')}</div></div>
                        <div class="item full"><span class="label">Additional Notes</span><div class="value">${escapePrintHtml(request.additional_notes || 'No additional notes provided.')}</div></div>
                        <div class="item"><span class="label">Supporting Document</span><div class="value">${escapePrintHtml(documentLabel)}</div></div>
                        <div class="item"><span class="label">Ready Document Proof</span><div class="value">${escapePrintHtml(proofLabel)}</div></div>
                        <div class="item full"><span class="label">Screening Summary</span><div class="value">${escapePrintHtml(request.screening_summary || 'No screening notes yet.')}</div></div>
                    </div>
                    <div class="footer">Generated from GayaGuard on ${escapePrintHtml(new Date().toLocaleString('en-US'))}</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    function openPrintableDocumentTemplate(request) {
        if (!request) {
            return;
        }

        sessionStorage.setItem('gayaguardPrintRequest', JSON.stringify(request));
        window.open('print-document.html', '_blank');
    }

    function getAdminViewFromHash() {
        const view = window.location.hash.replace('#', '');
        return ['dashboard', 'requests', 'records', 'residents', 'reports'].includes(view) ? view : 'dashboard';
    }

    function isArchivedStatus(status) {
        return ['approved', 'completed', 'rejected'].includes(status);
    }

    function setSidebarState(isOpen) {
        sidebar.classList.toggle('active', isOpen);
        overlay.classList.toggle('active', isOpen);
        document.documentElement.classList.toggle('menu-open', isOpen);
        document.body.classList.toggle('menu-open', isOpen);

        if (headerMenuBtn) {
            headerMenuBtn.classList.toggle('active', isOpen);
        }

        if (sidebarToggle) {
            sidebarToggle.classList.toggle('active', isOpen);
        }
    }

    function setAdminView(nextView, options = {}) {
        currentAdminView = ['dashboard', 'requests', 'records', 'residents', 'reports'].includes(nextView)
            ? nextView
            : 'dashboard';

        viewLinks.forEach(function (link) {
            link.classList.toggle('active', link.dataset.adminViewLink === currentAdminView);
        });

        viewSections.forEach(function (section) {
            section.classList.toggle('admin-view-active', section.dataset.adminView === currentAdminView);
        });

        if (headerSubtitle) {
            const subtitleMap = {
                dashboard: 'Dashboard',
                requests: 'Requests',
                records: 'Records',
                residents: 'Residents',
                reports: 'Reports'
            };

            headerSubtitle.textContent = subtitleMap[currentAdminView] || 'Dashboard';
        }

        if (!options.skipHashUpdate) {
            const targetHash = `#${currentAdminView}`;
            if (window.location.hash !== targetHash) {
                history.replaceState(null, '', targetHash);
            }
        }

        if (window.innerWidth <= 1024) {
            setSidebarState(false);
        }
    }

    function openPreview(request) {
        if (!modal || !modalOverlay) {
            return;
        }

        selectedRequest = request;
        previewResidentName.textContent = request.full_name || '-';
        previewRequestType.textContent = formatRequestType(request.request_type);
        previewDateNeeded.textContent = formatDate(request.date_needed || request.created_at);
        previewPurpose.textContent = request.purpose || '-';
        previewScreeningScore.innerHTML = renderScreeningScore(request.screening_score);
        previewScreeningStatus.textContent = formatStatusLabel(request.screening_status);
        previewScreeningSummary.textContent = request.screening_summary || 'No screening notes yet.';
        previewPaymentStatus.textContent = formatStatusLabel(request.payment_status || 'unpaid');
        previewPaymentAmount.textContent = formatCurrency(request.payment_amount);
        previewPaymentReference.textContent = request.payment_reference || 'No payment reference yet.';
        previewPaidAt.textContent = request.paid_at ? formatDate(request.paid_at) : 'Not paid yet.';
        previewFinalStatus.textContent = formatStatusLabel(request.final_status);
        previewAdditionalNotes.textContent = request.additional_notes || 'No additional notes provided.';
        previewSupportingDocument.innerHTML = request.supporting_file_name
            ? `<a href="${UPLOADS_BASE_URL}/${request.supporting_file_name}" target="_blank" rel="noopener noreferrer">${request.supporting_file_name}</a>`
            : 'No file uploaded.';
        if (previewReleaseProof) {
            previewReleaseProof.innerHTML = request.release_proof_file_name
                ? `<a href="${UPLOADS_BASE_URL}/${request.release_proof_file_name}" target="_blank" rel="noopener noreferrer">${request.release_proof_file_name}</a>`
                : 'No proof uploaded yet.';
        }

        if (paymentStatusInput) {
            paymentStatusInput.value = request.payment_status || 'unpaid';
        }
        if (paymentAmountInput) {
            paymentAmountInput.value = Number(request.payment_amount) || 0;
        }
        if (paymentReferenceInput) {
            paymentReferenceInput.value = request.payment_reference || '';
        }
        if (releaseProofInput) {
            releaseProofInput.value = '';
        }
        if (releaseProofSelected) {
            releaseProofSelected.innerHTML = '<i class="fas fa-image"></i><span>No proof image selected yet.</span>';
        }
        if (printRequestBtn) {
            printRequestBtn.textContent = ['clearance', 'indigency', 'letter'].includes(request.request_type)
                ? 'Print Document'
                : 'Print Summary';
        }
        updatePreviewActions(request);

        modal.classList.add('active');
        modalOverlay.classList.add('active');
        document.body.classList.add('modal-open');
    }

    function closePreview() {
        if (!modal || !modalOverlay) {
            return;
        }

        selectedRequest = null;
        modal.classList.remove('active');
        modalOverlay.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    function sortRequests(requests, sortValue) {
        const items = [...requests];

        if (sortValue === 'oldest') {
            return items.sort(function (a, b) {
                return new Date(a.created_at) - new Date(b.created_at);
            });
        }

        if (sortValue === 'high-score') {
            return items.sort(function (a, b) {
                return (Number(b.screening_score) || 0) - (Number(a.screening_score) || 0);
            });
        }

        if (sortValue === 'low-score') {
            return items.sort(function (a, b) {
                return (Number(a.screening_score) || 0) - (Number(b.screening_score) || 0);
            });
        }

        return items.sort(function (a, b) {
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    function renderRequestRows(container, requests, emptyMessage) {
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (!requests.length) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5">${emptyMessage}</td>`;
            container.appendChild(row);
            return;
        }

        requests.forEach(function (request) {
            const row = document.createElement('tr');

            const residentCell = document.createElement('td');
            residentCell.textContent = request.full_name;

            const typeCell = document.createElement('td');
            typeCell.textContent = formatRequestType(request.request_type);

            const createdCell = document.createElement('td');
            createdCell.textContent = formatDate(request.created_at);

            const screeningCell = document.createElement('td');
            screeningCell.appendChild(createStatusBadge(request.screening_status, 'screening'));

            const finalCell = document.createElement('td');
            finalCell.appendChild(createStatusBadge(request.final_status, 'final'));

            row.appendChild(residentCell);
            row.appendChild(typeCell);
            row.appendChild(createdCell);
            row.appendChild(screeningCell);
            row.appendChild(finalCell);

            row.addEventListener('click', function () {
                openPreview(request);
            });

            container.appendChild(row);
        });
    }

    function renderRequestsTable(requests) {
        renderRequestRows(allRequestsBody, requests, 'No active requests match the current filters.');
    }

    function renderRecordsTable(requests) {
        renderRequestRows(recordsBody, requests, 'No completed or rejected records yet.');
    }

    function getArchivedRecords() {
        return allAdminRequests.filter(function (request) {
            return isArchivedStatus(request.final_status);
        });
    }

    function applyRequestFilters() {
        const statusValue = requestStatusFilter ? requestStatusFilter.value : '';
        const sortValue = requestSortFilter ? requestSortFilter.value : '';

        const activeRequests = allAdminRequests.filter(function (request) {
            return !isArchivedStatus(request.final_status);
        });

        const filteredRequests = activeRequests.filter(function (request) {
            if (!statusValue) {
                return true;
            }

            return request.final_status === statusValue || request.screening_status === statusValue;
        });

        renderRequestsTable(sortRequests(filteredRequests, sortValue));
    }

    function renderAdminTablesFromDataset() {
        applyRequestFilters();
        renderRecordsTable(sortRequests(getArchivedRecords(), ''));
    }

    function escapeCsvValue(value) {
        const stringValue = String(value ?? '');
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    function exportRecordsAsCsv() {
        const archivedRecords = sortRequests(getArchivedRecords(), '');

        if (!archivedRecords.length) {
            window.alert('No completed or rejected records available to export yet.');
            return;
        }

        const headers = [
            'Resident Name',
            'Request Type',
            'Date Submitted',
            'Date Needed',
            'Payment Status',
            'Payment Amount',
            'Payment Reference',
            'Screening Score',
            'Screening Status',
            'Final Status',
            'Supporting Document',
            'Release Proof'
        ];

        const rows = archivedRecords.map(function (request) {
            return [
                request.full_name || '',
                formatRequestType(request.request_type),
                formatDate(request.created_at),
                formatDate(request.date_needed),
                formatStatusLabel(request.payment_status || 'unpaid'),
                Number(request.payment_amount) || 0,
                request.payment_reference || '',
                request.screening_score ?? 0,
                formatStatusLabel(request.screening_status),
                formatStatusLabel(request.final_status),
                request.supporting_file_name || '',
                request.release_proof_file_name || ''
            ].map(escapeCsvValue).join(',');
        });

        const csvContent = [headers.map(escapeCsvValue).join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = `barangay-records-${stamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function renderResidentsTable(residents) {
        if (!residentsBody) {
            return;
        }

        residentsBody.innerHTML = '';

        if (!residents.length) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5">No resident accounts found yet.</td>';
            residentsBody.appendChild(row);
            return;
        }

        residents.forEach(function (resident) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${resident.full_name || '-'}</td>
                <td>${resident.username || '-'}</td>
                <td>${resident.email || '-'}</td>
                <td>${resident.total_requests ?? 0}</td>
                <td>${resident.latest_request_at ? formatDate(resident.latest_request_at) : 'No requests yet'}</td>
            `;
            residentsBody.appendChild(row);
        });
    }

    function renderBreakdownList(container, items, formatter, emptyMessage) {
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (!items.length) {
            container.innerHTML = `<div class="report-breakdown-empty">${emptyMessage}</div>`;
            return;
        }

        items.forEach(function (item) {
            const row = document.createElement('div');
            row.className = 'report-breakdown-item';

            const label = document.createElement('span');
            label.className = 'report-breakdown-label';
            label.textContent = formatter(item);

            const value = document.createElement('strong');
            value.className = 'report-breakdown-value';
            value.textContent = item.total ?? 0;

            row.appendChild(label);
            row.appendChild(value);
            container.appendChild(row);
        });
    }

    function renderTopResidents(residents) {
        if (!reportTopResidents) {
            return;
        }

        reportTopResidents.innerHTML = '';

        if (!residents.length) {
            reportTopResidents.innerHTML = '<div class="report-breakdown-empty">No resident activity yet.</div>';
            return;
        }

        residents.forEach(function (resident) {
            const row = document.createElement('div');
            row.className = 'report-breakdown-item';
            row.innerHTML = `
                <div class="report-breakdown-copy">
                    <span class="report-breakdown-eyebrow">Resident Activity</span>
                    <span class="report-breakdown-label">${resident.full_name}</span>
                    <span class="report-breakdown-meta">@${resident.username}</span>
                </div>
                <strong class="report-breakdown-value">${resident.total_requests}</strong>
            `;
            reportTopResidents.appendChild(row);
        });
    }

    function renderRecentDecisions(decisions) {
        if (!reportRecentDecisions) {
            return;
        }

        reportRecentDecisions.innerHTML = '';

        if (!decisions.length) {
            reportRecentDecisions.innerHTML = `
                <li>
                    <span class="admin-dashboard-note-icon"><i class="fas fa-clock"></i></span>
                    <div>
                        <strong>No recent decisions yet</strong>
                        <span>Completed and rejected activity will appear here once requests are resolved.</span>
                    </div>
                </li>
            `;
            return;
        }

        decisions.forEach(function (decision) {
            const item = document.createElement('li');
            const decisionIcon = decision.final_status === 'rejected' ? 'fa-times-circle' : 'fa-check-circle';
            const decisionText = decision.final_status === 'rejected' ? 'Rejected' : 'Completed';
            item.innerHTML = `
                <span class="admin-dashboard-note-icon"><i class="fas ${decisionIcon}"></i></span>
                <div>
                    <strong>${decision.full_name} • ${formatRequestType(decision.request_type)}</strong>
                    <span>${decisionText} on ${formatDate(decision.reviewed_at)}</span>
                </div>
            `;
            reportRecentDecisions.appendChild(item);
        });
    }

    async function loadDashboardData() {
        const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');

        if (!token) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load dashboard data.');
            }

            if (statTotalRequests) {
                statTotalRequests.textContent = data.summary.total_requests ?? 0;
            }
            if (statPendingRequests) {
                statPendingRequests.textContent = data.summary.active_requests ?? 0;
            }
            if (statApprovedRequests) {
                statApprovedRequests.textContent = data.summary.ready_for_pickup_requests ?? 0;
            }
            if (statRejectedRequests) {
                statRejectedRequests.textContent = data.summary.rejected_requests ?? 0;
            }
            if (statNeedsReview) {
                statNeedsReview.textContent = data.summary.needs_review ?? 0;
            }

            const recentRequests = data.recentRequests || [];
            const latestRequest = recentRequests[0] || null;

            if (adminOverviewText) {
                adminOverviewText.textContent = recentRequests.length
                    ? `There are ${data.summary.active_requests ?? 0} active requests, ${data.summary.ready_for_pickup_requests ?? 0} ready for pickup, and ${data.summary.needs_review ?? 0} items currently under review.`
                    : 'Track live request volume, review priorities, and recent resident activity from one place.';
            }

            if (adminRecentRequestType) {
                adminRecentRequestType.textContent = latestRequest ? formatRequestType(latestRequest.request_type) : 'No requests yet';
            }

            if (adminRecentResidentName) {
                adminRecentResidentName.textContent = latestRequest ? latestRequest.full_name || '-' : 'No activity yet';
            }

            if (adminLatestFinalStatus) {
                adminLatestFinalStatus.textContent = latestRequest ? formatStatusLabel(latestRequest.final_status) : 'No updates yet';
            }
        } catch (error) {
            if (adminOverviewText) {
                adminOverviewText.textContent = 'Unable to load dashboard overview right now.';
            }
        }
    }

    async function loadAllRequestsData() {
        const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');

        if (!token) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/requests`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load request records.');
            }

            allAdminRequests = data.requests || [];
            renderAdminTablesFromDataset();
        } catch (error) {
            if (allRequestsBody) {
                allRequestsBody.innerHTML = '<tr><td colspan="5">Unable to load requests right now.</td></tr>';
            }
            if (recordsBody) {
                recordsBody.innerHTML = '<tr><td colspan="5">Unable to load records right now.</td></tr>';
            }
        }
    }

    async function loadResidentsData() {
        const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');

        if (!token || !residentsBody) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/residents`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load residents.');
            }

            renderResidentsTable(data.residents || []);
        } catch (error) {
            residentsBody.innerHTML = '<tr><td colspan="5">Unable to load residents right now.</td></tr>';
        }
    }

    async function loadReportsData() {
        const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');

        if (!token) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/reports`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load reports.');
            }

            if (reportTotalThisMonth) {
                reportTotalThisMonth.textContent = data.monthlySummary?.total_this_month ?? 0;
            }
            if (reportApprovedThisMonth) {
                reportApprovedThisMonth.textContent = data.monthlySummary?.completed_this_month ?? 0;
            }
            if (reportRejectedThisMonth) {
                reportRejectedThisMonth.textContent = data.monthlySummary?.rejected_this_month ?? 0;
            }
            if (reportPendingThisMonth) {
                reportPendingThisMonth.textContent = data.monthlySummary?.active_this_month ?? 0;
            }

            renderBreakdownList(
                reportTypeBreakdown,
                data.requestTypeBreakdown || [],
                function (item) {
                    return formatRequestType(item.request_type);
                },
                'No request type analytics yet.'
            );

            renderBreakdownList(
                reportScreeningBreakdown,
                data.screeningBreakdown || [],
                function (item) {
                    return formatStatusLabel(item.screening_status);
                },
                'No screening analytics yet.'
            );

            renderTopResidents(data.topResidents || []);
            renderRecentDecisions(data.recentDecisions || []);
        } catch (error) {
            if (reportTypeBreakdown) {
                reportTypeBreakdown.innerHTML = '<div class="report-breakdown-empty">Unable to load request type analytics.</div>';
            }
            if (reportScreeningBreakdown) {
                reportScreeningBreakdown.innerHTML = '<div class="report-breakdown-empty">Unable to load screening analytics.</div>';
            }
            if (reportTopResidents) {
                reportTopResidents.innerHTML = '<div class="report-breakdown-empty">Unable to load resident activity.</div>';
            }
            if (reportRecentDecisions) {
                reportRecentDecisions.innerHTML = `
                    <li>
                        <span class="admin-dashboard-note-icon"><i class="fas fa-circle-exclamation"></i></span>
                        <div>
                            <strong>Unable to load recent decisions</strong>
                            <span>Try refreshing the page after the reports endpoint becomes available.</span>
                        </div>
                    </li>
                `;
            }
        }
    }

    async function updateRequestStatus(action) {
        const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');

        if (!token || !selectedRequest) {
            return;
        }

        const actionButtonMap = {
            start_review: reviewRequestBtn,
            prepare_document: prepareRequestBtn,
            mark_ready: readyRequestBtn,
            complete: approveRequestBtn,
            reject: rejectRequestBtn,
            approve: approveRequestBtn,
            review: reviewRequestBtn
        };
        const activeButton = actionButtonMap[action];
        const loadingLabelMap = {
            start_review: 'Starting Review...',
            prepare_document: 'Preparing...',
            mark_ready: 'Marking Ready...',
            complete: 'Completing...',
            reject: 'Rejecting...',
            approve: 'Completing...',
            review: 'Starting Review...'
        };

        Object.values(actionButtonMap).forEach(function (button) {
            if (!button) {
                return;
            }

            if (button === activeButton) {
                setActionButtonLoading(button, true, loadingLabelMap[action] || 'Saving...');
                return;
            }

            button.disabled = true;
        });

        try {
            const response = await fetch(`${API_BASE_URL}/admin/requests/${selectedRequest.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to update request.');
            }

            await Promise.all([loadDashboardData(), loadAllRequestsData(), loadReportsData()]);
            const refreshedRequest = allAdminRequests.find(function (request) {
                return request.id === selectedRequest.id;
            });

            if (refreshedRequest) {
                selectedRequest = refreshedRequest;
                openPreview(refreshedRequest);
            }
        } catch (error) {
            window.alert(error.message || 'Unable to update request.');
        } finally {
            Object.values(actionButtonMap).forEach(function (button) {
                if (!button) {
                    return;
                }

                if (button === activeButton) {
                    setActionButtonLoading(button, false);
                    return;
                }

                button.disabled = false;
            });
        }
    }

    async function updateRequestPayment() {
        const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');

        if (!token || !selectedRequest || !savePaymentBtn) {
            return;
        }

        setActionButtonLoading(savePaymentBtn, true, 'Saving Payment...');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/requests/${selectedRequest.id}/payment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    paymentStatus: paymentStatusInput ? paymentStatusInput.value : 'unpaid',
                    paymentAmount: paymentAmountInput ? paymentAmountInput.value : 0,
                    paymentReference: paymentReferenceInput ? paymentReferenceInput.value : ''
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to update payment details.');
            }

            await Promise.all([loadDashboardData(), loadAllRequestsData(), loadReportsData()]);

            if (selectedRequest) {
                selectedRequest.payment_status = data.request.payment_status;
                selectedRequest.payment_amount = data.request.payment_amount;
                selectedRequest.payment_reference = data.request.payment_reference;
                selectedRequest.paid_at = data.request.paid_at;
                openPreview(selectedRequest);
            }
        } catch (error) {
            window.alert(error.message || 'Unable to update payment details.');
        } finally {
            setActionButtonLoading(savePaymentBtn, false);
        }
    }

    async function updateRequestReleaseProof() {
        const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');

        if (!token || !selectedRequest || !saveReleaseProofBtn || !releaseProofInput || !releaseProofInput.files.length) {
            window.alert('Please choose a proof image first.');
            return;
        }

        const formData = new FormData();
        formData.append('releaseProof', releaseProofInput.files[0]);

        setActionButtonLoading(saveReleaseProofBtn, true, 'Uploading Proof...');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/requests/${selectedRequest.id}/release-proof`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to upload release proof.');
            }

            await Promise.all([loadDashboardData(), loadAllRequestsData(), loadReportsData()]);

            if (selectedRequest) {
                selectedRequest.release_proof_file_name = data.request.release_proof_file_name;
                openPreview(selectedRequest);
            }
        } catch (error) {
            window.alert(error.message || 'Unable to upload release proof.');
        } finally {
            setActionButtonLoading(saveReleaseProofBtn, false);
        }
    }

    viewLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            setAdminView(link.dataset.adminViewLink);
        });
    });

    actionButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            setAdminView(button.dataset.adminAction);
        });
    });

    if (requestStatusFilter) {
        requestStatusFilter.addEventListener('change', applyRequestFilters);
    }

    if (requestSortFilter) {
        requestSortFilter.addEventListener('change', applyRequestFilters);
    }

    if (exportRecordsBtn) {
        exportRecordsBtn.addEventListener('click', exportRecordsAsCsv);
    }

    if (headerMenuBtn) {
        headerMenuBtn.addEventListener('click', function () {
            setSidebarState(!sidebar.classList.contains('active'));
        });
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            setSidebarState(!sidebar.classList.contains('active'));
        });
    }

    overlay.addEventListener('click', function () {
        setSidebarState(false);
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024) {
            setSidebarState(false);
        }
    });

    window.addEventListener('hashchange', function () {
        setAdminView(getAdminViewFromHash(), { skipHashUpdate: true });
    });

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closePreview);
    }

    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closePreview);
    }

    if (approveRequestBtn) {
        approveRequestBtn.addEventListener('click', function () {
            updateRequestStatus('complete');
        });
    }

    if (rejectRequestBtn) {
        rejectRequestBtn.addEventListener('click', function () {
            updateRequestStatus('reject');
        });
    }

    if (reviewRequestBtn) {
        reviewRequestBtn.addEventListener('click', function () {
            updateRequestStatus('start_review');
        });
    }

    if (prepareRequestBtn) {
        prepareRequestBtn.addEventListener('click', function () {
            updateRequestStatus('prepare_document');
        });
    }

    if (readyRequestBtn) {
        readyRequestBtn.addEventListener('click', function () {
            updateRequestStatus('mark_ready');
        });
    }

    if (savePaymentBtn) {
        savePaymentBtn.addEventListener('click', updateRequestPayment);
    }

    if (releaseProofInput && releaseProofSelected) {
        releaseProofInput.addEventListener('change', function () {
            const nextFile = releaseProofInput.files && releaseProofInput.files[0];
            releaseProofSelected.innerHTML = nextFile
                ? `<i class="fas fa-image"></i><span>${nextFile.name}</span>`
                : '<i class="fas fa-image"></i><span>No proof image selected yet.</span>';
        });
    }

    if (saveReleaseProofBtn) {
        saveReleaseProofBtn.addEventListener('click', updateRequestReleaseProof);
    }

    if (printRequestBtn) {
        printRequestBtn.addEventListener('click', function () {
            if (!selectedRequest) {
                return;
            }

            if (['clearance', 'indigency', 'letter'].includes(selectedRequest.request_type)) {
                openPrintableDocumentTemplate(selectedRequest);
                return;
            }

            openPrintableSummary(selectedRequest, { statusTitle: 'Processing Status' });
        });
    }

    setAdminView(getAdminViewFromHash(), { skipHashUpdate: true });
    loadDashboardData();
    loadAllRequestsData();
    loadResidentsData();
    loadReportsData();
});
