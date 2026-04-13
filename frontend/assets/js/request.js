const REQUESTS_API_BASE_URL = window.getApiBaseUrl ? window.getApiBaseUrl() : 'http://localhost:5000/api';

function setRequestMessage(element, message, type) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `form-message ${type}`;
}

document.addEventListener('DOMContentLoaded', function () {
  const requestForm = document.getElementById('requestForm');

  if (!requestForm) {
    return;
  }

  const messageEl = document.getElementById('requestMessage');
  const fileInput = document.getElementById('supportingFileInput');
  const fileUploadArea = requestForm.querySelector('.file-upload-area');
  const fileSelectedEl = document.getElementById('supportingFileSelected');
  const submitButton = requestForm.querySelector('button[type="submit"]');

  function updateSelectedFileState() {
    if (!fileInput || !fileSelectedEl) {
      return;
    }

    const selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    if (!selectedFile) {
      fileSelectedEl.classList.remove('has-file');
      if (fileUploadArea) {
        fileUploadArea.classList.remove('has-file');
      }
      fileSelectedEl.innerHTML = '<i class="fas fa-file-circle-check"></i><span>No file selected yet.</span>';
      return;
    }

    fileSelectedEl.classList.add('has-file');
    if (fileUploadArea) {
      fileUploadArea.classList.add('has-file');
    }
    fileSelectedEl.innerHTML = `<i class="fas fa-file-circle-check"></i><span><strong>${selectedFile.name}</strong> selected</span>`;
  }

  if (fileInput) {
    fileInput.addEventListener('change', updateSelectedFileState);
  }

  requestForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(requestForm);
    const authToken = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('authToken');
    const supportingFile = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    formData.set('fullName', String(formData.get('fullName') || '').trim());
    formData.set('completeAddress', String(formData.get('completeAddress') || '').trim());
    formData.set('contactNumber', String(formData.get('contactNumber') || '').trim());
    formData.set('requestType', String(formData.get('requestType') || '').trim());
    formData.set('dateNeeded', String(formData.get('dateNeeded') || '').trim());
    formData.set('purpose', String(formData.get('purpose') || '').trim());
    formData.set('additionalNotes', String(formData.get('additionalNotes') || '').trim());

    setRequestMessage(messageEl, 'Submitting your request...', 'info');
    submitButton.disabled = true;

    try {
      if (supportingFile && supportingFile.size > 5 * 1024 * 1024) {
        throw new Error('Supporting document must be 5MB or smaller.');
      }

      const headers = {};

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`${REQUESTS_API_BASE_URL}/requests`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request submission failed.');
      }

      setRequestMessage(messageEl, data.message || 'Request submitted successfully.', 'success');
      requestForm.reset();
      updateSelectedFileState();
      window.dispatchEvent(new CustomEvent('request:submitted', {
        detail: {
          request: data.request || null
        }
      }));
    } catch (error) {
      setRequestMessage(messageEl, error.message || 'Unable to submit your request right now.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  updateSelectedFileState();
});
