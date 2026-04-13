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
    const previewFinalStatus = document.getElementById('previewFinalStatus');
    const previewAdditionalNotes = document.getElementById('previewAdditionalNotes');
    const previewSupportingDocument = document.getElementById('previewSupportingDocument');
    const approveRequestBtn = document.getElementById('approveRequestBtn');
    const rejectRequestBtn = document.getElementById('rejectRequestBtn');
    const reviewRequestBtn = document.getElementById('reviewRequestBtn');

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

    function getAdminViewFromHash() {
        const view = window.location.hash.replace('#', '');
        return ['dashboard', 'requests', 'records', 'residents', 'reports'].includes(view) ? view : 'dashboard';
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
        previewFinalStatus.textContent = formatStatusLabel(request.final_status);
        previewAdditionalNotes.textContent = request.additional_notes || 'No additional notes provided.';
        previewSupportingDocument.innerHTML = request.supporting_file_name
            ? `<a href="${UPLOADS_BASE_URL}/${request.supporting_file_name}" target="_blank" rel="noopener noreferrer">${request.supporting_file_name}</a>`
            : 'No file uploaded.';

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
        renderRequestRows(recordsBody, requests, 'No approved or rejected records yet.');
    }

    function getArchivedRecords() {
        return allAdminRequests.filter(function (request) {
            return request.final_status === 'approved' || request.final_status === 'rejected';
        });
    }

    function applyRequestFilters() {
        const statusValue = requestStatusFilter ? requestStatusFilter.value : '';
        const sortValue = requestSortFilter ? requestSortFilter.value : '';

        const activeRequests = allAdminRequests.filter(function (request) {
            return request.final_status !== 'approved' && request.final_status !== 'rejected';
        });

        const filteredRequests = activeRequests.filter(function (request) {
            if (!statusValue) {
                return true;
            }

            if (statusValue === 'pending') {
                return request.final_status === 'pending';
            }

            return request.screening_status === statusValue;
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
            window.alert('No approved or rejected records available to export yet.');
            return;
        }

        const headers = [
            'Resident Name',
            'Request Type',
            'Date Submitted',
            'Date Needed',
            'Screening Score',
            'Screening Status',
            'Final Status',
            'Supporting Document'
        ];

        const rows = archivedRecords.map(function (request) {
            return [
                request.full_name || '',
                formatRequestType(request.request_type),
                formatDate(request.created_at),
                formatDate(request.date_needed),
                request.screening_score ?? 0,
                formatStatusLabel(request.screening_status),
                formatStatusLabel(request.final_status),
                request.supporting_file_name || ''
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
                        <span>Approved and rejected activity will appear here once requests are resolved.</span>
                    </div>
                </li>
            `;
            return;
        }

        decisions.forEach(function (decision) {
            const item = document.createElement('li');
            const decisionIcon = decision.final_status === 'approved' ? 'fa-check-circle' : 'fa-times-circle';
            item.innerHTML = `
                <span class="admin-dashboard-note-icon"><i class="fas ${decisionIcon}"></i></span>
                <div>
                    <strong>${decision.full_name} • ${formatRequestType(decision.request_type)}</strong>
                    <span>${formatStatusLabel(decision.final_status)} on ${formatDate(decision.reviewed_at)}</span>
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
                statPendingRequests.textContent = data.summary.pending_requests ?? 0;
            }
            if (statApprovedRequests) {
                statApprovedRequests.textContent = data.summary.approved_requests ?? 0;
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
                    ? `There are ${data.summary.pending_requests ?? 0} pending requests and ${data.summary.needs_review ?? 0} items currently marked for review in the system.`
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
                reportApprovedThisMonth.textContent = data.monthlySummary?.approved_this_month ?? 0;
            }
            if (reportRejectedThisMonth) {
                reportRejectedThisMonth.textContent = data.monthlySummary?.rejected_this_month ?? 0;
            }
            if (reportPendingThisMonth) {
                reportPendingThisMonth.textContent = data.monthlySummary?.pending_this_month ?? 0;
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
            approve: approveRequestBtn,
            reject: rejectRequestBtn,
            review: reviewRequestBtn
        };
        const activeButton = actionButtonMap[action];
        const originalText = activeButton ? activeButton.textContent : '';

        if (activeButton) {
            activeButton.disabled = true;
            activeButton.textContent = 'Saving...';
        }

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

            closePreview();
            await Promise.all([loadDashboardData(), loadAllRequestsData(), loadReportsData()]);
        } catch (error) {
            window.alert(error.message || 'Unable to update request.');
        } finally {
            if (activeButton) {
                activeButton.disabled = false;
                activeButton.textContent = originalText;
            }
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
            updateRequestStatus('approve');
        });
    }

    if (rejectRequestBtn) {
        rejectRequestBtn.addEventListener('click', function () {
            updateRequestStatus('reject');
        });
    }

    if (reviewRequestBtn) {
        reviewRequestBtn.addEventListener('click', function () {
            updateRequestStatus('review');
        });
    }

    setAdminView(getAdminViewFromHash(), { skipHashUpdate: true });
    loadDashboardData();
    loadAllRequestsData();
    loadResidentsData();
    loadReportsData();
});
