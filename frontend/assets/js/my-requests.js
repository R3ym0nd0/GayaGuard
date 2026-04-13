const MY_REQUESTS_API_BASE_URL = window.getApiBaseUrl ? window.getApiBaseUrl() : 'http://localhost:5000/api';
const MY_REQUESTS_UPLOADS_BASE_URL = window.getUploadsBaseUrl ? window.getUploadsBaseUrl() : 'http://localhost:5000/uploads';

function formatResidentRequestType(value) {
  const map = {
    clearance: 'Barangay Clearance',
    indigency: 'Certificate of Indigency',
    letter: 'Excuse / Supporting Letter',
    complaint: 'Complaint Submission',
    other: 'Other Request'
  };

  return map[value] || value || '-';
}

function formatResidentStatus(value) {
  if (!value) {
    return '-';
  }

  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatResidentDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function renderResidentScreeningScore(score) {
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

function getResidentBadgeClass(type, value) {
  if (type === 'screening') {
    const screeningMap = {
      low_concern: 'status-low',
      needs_review: 'status-review',
      high_concern: 'status-high',
      pending_screening: 'status-pending'
    };

    return screeningMap[value] || 'status-pending';
  }

  return `status-${value}`;
}

document.addEventListener('DOMContentLoaded', async function () {
  const sidebar = document.getElementById('residentSidebar');
  const overlay = document.getElementById('residentSidebarOverlay');
  const menuBtn = document.getElementById('residentMenuBtn');
  const sidebarToggle = document.getElementById('residentSidebarToggle');
  const viewLinks = Array.from(document.querySelectorAll('[data-resident-view-link]'));
  const viewSections = Array.from(document.querySelectorAll('[data-resident-view]'));
  const actionButtons = Array.from(document.querySelectorAll('[data-resident-action]'));
  const headerSubtitle = document.getElementById('residentHeaderSubtitle');
  const welcomeTitle = document.getElementById('residentWelcomeTitle');
  const overviewText = document.getElementById('residentOverviewText');
  const profileFullName = document.getElementById('residentProfileFullName');
  const profileUsername = document.getElementById('residentProfileUsername');
  const profileNameValue = document.getElementById('residentProfileNameValue');
  const profileUsernameValue = document.getElementById('residentProfileUsernameValue');
  const profileEmailValue = document.getElementById('residentProfileEmailValue');
  const profileRoleValue = document.getElementById('residentProfileRoleValue');
  const profileRoleBadge = document.getElementById('residentProfileRoleBadge');
  const profileTotalRequests = document.getElementById('residentProfileTotalRequests');
  const profilePendingRequests = document.getElementById('residentProfilePendingRequests');
  const profileLatestStatus = document.getElementById('residentProfileLatestStatus');
  const listEl = document.getElementById('myRequestsList');
  const emptyEl = document.getElementById('myRequestsEmptyState');
  const profileNameEl = document.getElementById('residentProfileName');
  const logoutLink = document.getElementById('residentLogoutLink');
  const totalRequestsEl = document.getElementById('residentTotalRequests');
  const pendingRequestsEl = document.getElementById('residentPendingRequests');
  const approvedRequestsEl = document.getElementById('residentApprovedRequests');
  const rejectedRequestsEl = document.getElementById('residentRejectedRequests');
  const recentRequestTypeEl = document.getElementById('residentRecentRequestType');
  const latestFinalStatusEl = document.getElementById('residentLatestFinalStatus');
  const latestScreeningStatusEl = document.getElementById('residentLatestScreeningStatus');
  const modal = document.getElementById('residentRequestModal');
  const modalOverlay = document.getElementById('residentRequestModalOverlay');
  const modalClose = document.getElementById('residentModalClose');
  const modalRequestType = document.getElementById('residentModalRequestType');
  const modalCreatedAt = document.getElementById('residentModalCreatedAt');
  const modalDateNeeded = document.getElementById('residentModalDateNeeded');
  const modalPurpose = document.getElementById('residentModalPurpose');
  const modalAddress = document.getElementById('residentModalAddress');
  const modalContactNumber = document.getElementById('residentModalContactNumber');
  const modalScreeningScore = document.getElementById('residentModalScreeningScore');
  const modalScreeningStatus = document.getElementById('residentModalScreeningStatus');
  const modalScreeningSummary = document.getElementById('residentModalScreeningSummary');
  const modalFinalStatus = document.getElementById('residentModalFinalStatus');
  const modalAdditionalNotes = document.getElementById('residentModalAdditionalNotes');
  const modalSupportingDocument = document.getElementById('residentModalSupportingDocument');
  const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');
  const storedUser = window.getStoredAuthUser ? window.getStoredAuthUser() : null;
  const rawUser = storedUser ? JSON.stringify(storedUser) : localStorage.getItem('authUser');
  let currentResidentView = 'dashboard';

  function getResidentViewFromHash() {
    if (window.location.hash === '#submit-request') {
      return 'submit-request';
    }

    if (window.location.hash === '#my-requests') {
      return 'my-requests';
    }

    if (window.location.hash === '#profile') {
      return 'profile';
    }

    return 'dashboard';
  }

  function setSidebarState(isOpen) {
    if (!sidebar || !overlay) {
      return;
    }

    sidebar.classList.toggle('active', isOpen);
    overlay.classList.toggle('active', isOpen);
    document.documentElement.classList.toggle('menu-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);

    if (menuBtn) {
      menuBtn.classList.toggle('active', isOpen);
    }

    if (sidebarToggle) {
      sidebarToggle.classList.toggle('active', isOpen);
    }
  }

  async function handleLogout(event) {
    if (event) {
      event.preventDefault();
    }

    setSidebarState(false);

    const shouldLogout = window.showConfirmDialog
      ? await window.showConfirmDialog({
        title: 'Log Out',
        message: 'Are you sure you want to log out of your account?',
        confirmLabel: 'Log Out',
        cancelLabel: 'Stay'
      })
      : window.confirm('Are you sure you want to log out?');

    if (!shouldLogout) {
      return;
    }

    if (window.clearAuthSession) {
      window.clearAuthSession();
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
    }
    window.location.href = 'login.html';
  }

  function closeResidentModal() {
    if (!modal || !modalOverlay) {
      return;
    }

    modal.classList.remove('active');
    modalOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  function setResidentView(nextView, options = {}) {
    const validViews = ['dashboard', 'submit-request', 'my-requests', 'profile'];
    currentResidentView = validViews.includes(nextView) ? nextView : 'dashboard';

    viewLinks.forEach(function (link) {
      link.classList.toggle('active', link.dataset.residentViewLink === currentResidentView);
    });

    viewSections.forEach(function (section) {
      section.classList.toggle('resident-view-active', section.dataset.residentView === currentResidentView);
    });

    if (headerSubtitle) {
      const subtitleMap = {
        dashboard: 'Dashboard',
        'submit-request': 'Submit Request',
        'my-requests': 'My Requests',
        profile: 'Profile'
      };

      headerSubtitle.textContent = subtitleMap[currentResidentView] || 'Dashboard';
    }

    if (!options.skipHashUpdate) {
      const targetHashMap = {
        dashboard: '#dashboard',
        'submit-request': '#submit-request',
        'my-requests': '#my-requests',
        profile: '#profile'
      };
      const targetHash = targetHashMap[currentResidentView] || '#dashboard';
      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }

    if (window.innerWidth <= 1024) {
      setSidebarState(false);
    }
  }

  function openResidentModal(request) {
    if (!modal || !modalOverlay) {
      return;
    }

    modalRequestType.textContent = formatResidentRequestType(request.request_type);
    modalCreatedAt.textContent = formatResidentDate(request.created_at);
    modalDateNeeded.textContent = formatResidentDate(request.date_needed);
    modalPurpose.textContent = request.purpose || '-';
    modalAddress.textContent = request.complete_address || '-';
    modalContactNumber.textContent = request.contact_number || '-';
    modalScreeningScore.innerHTML = renderResidentScreeningScore(request.screening_score);
    modalScreeningStatus.textContent = formatResidentStatus(request.screening_status);
    modalScreeningSummary.textContent = request.screening_summary || 'No screening notes yet.';
    modalFinalStatus.textContent = formatResidentStatus(request.final_status);
    modalAdditionalNotes.textContent = request.additional_notes || 'No additional notes provided.';
    modalSupportingDocument.innerHTML = request.supporting_file_name
      ? `<a href="${MY_REQUESTS_UPLOADS_BASE_URL}/${request.supporting_file_name}" target="_blank" rel="noopener noreferrer">${request.supporting_file_name}</a>`
      : 'No file uploaded.';

    modal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.classList.add('modal-open');
  }

  if (!token || !rawUser) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(rawUser);

  if (user.role === 'admin' || user.role === 'staff') {
    window.location.href = 'admin.html';
    return;
  }

  document.body.classList.remove('auth-pending');

  if (profileNameEl) {
    profileNameEl.textContent = user.full_name || user.username || 'Resident Account';
  }

  if (profileFullName) {
    profileFullName.textContent = user.full_name || user.username || 'Resident Account';
  }

  if (profileUsername) {
    profileUsername.textContent = `@${user.username || 'resident'}`;
  }

  if (profileNameValue) {
    profileNameValue.textContent = user.full_name || user.username || '-';
  }

  if (profileUsernameValue) {
    profileUsernameValue.textContent = user.username || '-';
  }

  if (profileEmailValue) {
    profileEmailValue.textContent = user.email || '-';
  }

  if (profileRoleValue) {
    profileRoleValue.textContent = 'Resident User';
  }

  if (profileRoleBadge) {
    profileRoleBadge.textContent = 'Resident User';
  }

  if (welcomeTitle) {
    const firstName = (user.full_name || user.username || 'Resident').split(' ')[0];
    welcomeTitle.textContent = `Welcome back, ${firstName}`;
  }

  if (logoutLink) {
    logoutLink.addEventListener('click', handleLogout);
  }

  viewLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      setResidentView(link.dataset.residentViewLink);
    });
  });

  actionButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setResidentView(button.dataset.residentAction);
    });
  });

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setSidebarState(!sidebar.classList.contains('active'));
    });
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      setSidebarState(!sidebar.classList.contains('active'));
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function () {
      setSidebarState(false);
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeResidentModal);
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeResidentModal);
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      setSidebarState(false);
    }
  });

  window.addEventListener('hashchange', function () {
    setResidentView(getResidentViewFromHash(), { skipHashUpdate: true });
  });

  window.addEventListener('request:submitted', function () {
    setResidentView('my-requests');
    loadResidentRequests();
  });

  try {
    const meResponse = await fetch(`${MY_REQUESTS_API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const meData = await meResponse.json();

    if (!meResponse.ok || !meData.user) {
      throw new Error(meData.message || 'Session expired.');
    }

    if (localStorage.getItem('authToken')) {
      localStorage.setItem('authUser', JSON.stringify(meData.user));
    } else {
      sessionStorage.setItem('authUser', JSON.stringify(meData.user));
    }

    if (profileNameEl) {
      profileNameEl.textContent = meData.user.full_name || meData.user.username || 'Resident Account';
    }

    if (profileFullName) {
      profileFullName.textContent = meData.user.full_name || meData.user.username || 'Resident Account';
    }

    if (profileUsername) {
      profileUsername.textContent = `@${meData.user.username || 'resident'}`;
    }

    if (profileNameValue) {
      profileNameValue.textContent = meData.user.full_name || meData.user.username || '-';
    }

    if (profileUsernameValue) {
      profileUsernameValue.textContent = meData.user.username || '-';
    }

    if (profileEmailValue) {
      profileEmailValue.textContent = meData.user.email || '-';
    }

    if (profileRoleBadge) {
      profileRoleBadge.textContent = 'Resident User';
    }
  } catch (error) {
    handleLogout();
    return;
  }

  async function loadResidentRequests() {
    try {
      const response = await fetch(`${MY_REQUESTS_API_BASE_URL}/requests/mine`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load your requests.');
      }

      const requests = data.requests || [];
      const pendingCount = requests.filter(request => request.final_status === 'pending').length;
      const approvedCount = requests.filter(request => request.final_status === 'approved').length;
      const rejectedCount = requests.filter(request => request.final_status === 'rejected').length;

      if (totalRequestsEl) {
        totalRequestsEl.textContent = requests.length;
      }

      if (pendingRequestsEl) {
        pendingRequestsEl.textContent = pendingCount;
      }

      if (approvedRequestsEl) {
        approvedRequestsEl.textContent = approvedCount;
      }

      if (rejectedRequestsEl) {
        rejectedRequestsEl.textContent = rejectedCount;
      }

      if (profileTotalRequests) {
        profileTotalRequests.textContent = requests.length;
      }

      if (profilePendingRequests) {
        profilePendingRequests.textContent = pendingCount;
      }

      if (overviewText) {
        overviewText.textContent = requests.length
          ? `You currently have ${pendingCount} pending request${pendingCount === 1 ? '' : 's'} and ${approvedCount} approved request${approvedCount === 1 ? '' : 's'} in your account history.`
          : 'Track your current request activity and use the shortcuts below to continue your transactions.';
      }

      const latestRequest = requests[0] || null;

      if (recentRequestTypeEl) {
        recentRequestTypeEl.textContent = latestRequest
          ? formatResidentRequestType(latestRequest.request_type)
          : 'No requests yet';
      }

      if (latestFinalStatusEl) {
        latestFinalStatusEl.textContent = latestRequest
          ? formatResidentStatus(latestRequest.final_status)
          : 'No updates yet';
      }

      if (latestScreeningStatusEl) {
        latestScreeningStatusEl.textContent = latestRequest
          ? formatResidentStatus(latestRequest.screening_status)
          : 'Pending';
      }

      if (profileLatestStatus) {
        profileLatestStatus.textContent = latestRequest
          ? formatResidentStatus(latestRequest.final_status)
          : 'No updates yet';
      }

      if (!requests.length) {
        emptyEl.style.display = 'flex';
        listEl.innerHTML = '';
        return;
      }

      emptyEl.style.display = 'none';
      listEl.innerHTML = '';

      requests.forEach(request => {
        const card = document.createElement('article');
        card.className = 'resident-request-card';
        card.innerHTML = `
        <div class="resident-request-top">
          <div class="resident-request-title-group">
            <span class="resident-request-kicker">Request Record</span>
            <h4>${formatResidentRequestType(request.request_type)}</h4>
            <p>Submitted on ${formatResidentDate(request.created_at)}</p>
          </div>
          <span class="resident-request-date">Needed by ${formatResidentDate(request.date_needed)}</span>
        </div>
        <div class="resident-request-body">
          <div class="resident-request-detail">
            <span class="resident-request-detail-label">Purpose</span>
            <p>${request.purpose || '-'}</p>
          </div>
          <div class="resident-request-detail">
            <span class="resident-request-detail-label">Address</span>
            <p>${request.complete_address || '-'}</p>
          </div>
          <div class="resident-request-detail">
            <span class="resident-request-detail-label">Supporting Document</span>
            <p>${request.supporting_file_name ? `<a href="${MY_REQUESTS_UPLOADS_BASE_URL}/${request.supporting_file_name}" target="_blank" rel="noopener noreferrer">${request.supporting_file_name}</a>` : 'None uploaded'}</p>
          </div>
        </div>
        <div class="resident-request-footer">
          <div class="resident-request-statuses">
            <span class="status-badge ${getResidentBadgeClass('screening', request.screening_status)}">${formatResidentStatus(request.screening_status)}</span>
            <span class="status-badge ${getResidentBadgeClass('final', request.final_status)}">${formatResidentStatus(request.final_status)}</span>
          </div>
          <span class="resident-request-link-hint">Tap to view details</span>
        </div>
      `;

        card.addEventListener('click', function () {
          openResidentModal(request);
        });

        listEl.appendChild(card);
      });
    } catch (error) {
      emptyEl.style.display = 'flex';
      listEl.innerHTML = '';
    }
  }

  setResidentView(getResidentViewFromHash(), { skipHashUpdate: true });

  await loadResidentRequests();
});
