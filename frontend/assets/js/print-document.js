document.addEventListener('DOMContentLoaded', function () {
    const paper = document.getElementById('printDocumentPaper');
    const title = document.getElementById('printDocumentTitle');
    const subtitle = document.getElementById('printDocumentSubtitle');
    const printButton = document.getElementById('printDocumentPrintBtn');
    const backButton = document.getElementById('printDocumentBackBtn');
    const storedRequest = sessionStorage.getItem('gayaguardPrintRequest');

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(value) {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function titleCaseWords(value) {
        return String(value || '')
            .split(' ')
            .filter(Boolean)
            .map(function (part) {
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            })
            .join(' ');
    }

    function renderDocumentHeader(documentName) {
        return `
            <header class="print-document-header">
                <div class="print-document-header-top">Republic of the Philippines</div>
                <div class="print-document-header-top">Province of Bulacan</div>
                <div class="print-document-header-top">Municipality of San Jose del Monte</div>
                <div class="print-document-header-main">Barangay Gaya Gaya</div>
                <div class="print-document-header-sub">Office of the Barangay Captain</div>
                <div class="print-document-title">${documentName}</div>
            </header>
        `;
    }

    function renderFooter() {
        return `
            <footer class="print-document-footer">
                <div class="print-signature-block">
                    <div class="print-signature-line"></div>
                    <strong>Barangay Captain</strong>
                    <span>Authorized Signatory</span>
                </div>
                <div class="print-signature-block">
                    <div class="print-signature-line"></div>
                    <strong>Resident Signature</strong>
                    <span>Received By</span>
                </div>
            </footer>
        `;
    }

    function renderClearanceDocument(request) {
        return `
            ${renderDocumentHeader('Barangay Clearance')}
            <section class="print-document-body">
                <p>To whom it may concern:</p>
                <p>
                    This is to certify that <strong>${escapeHtml(request.full_name)}</strong>, of legal age, and a resident of
                    <strong>${escapeHtml(request.complete_address || 'Barangay Gaya Gaya')}</strong>, is known to be a resident of this barangay.
                </p>
                <p>
                    This clearance is issued upon the request of the above-named person for
                    <strong>${escapeHtml(request.purpose || 'the stated purpose')}</strong>.
                </p>
                <div class="print-document-details">
                    <div class="print-detail-item">
                        <span>Request Date</span>
                        <strong>${escapeHtml(formatDate(request.created_at))}</strong>
                    </div>
                    <div class="print-detail-item">
                        <span>Date Needed</span>
                        <strong>${escapeHtml(formatDate(request.date_needed))}</strong>
                    </div>
                    <div class="print-detail-item">
                        <span>Processing Status</span>
                        <strong>${escapeHtml(titleCaseWords(String(request.final_status || '').replace(/_/g, ' ')))}</strong>
                    </div>
                </div>
                <p>
                    Issued this <strong>${escapeHtml(formatDate(new Date()))}</strong> at Barangay Gaya Gaya,
                    San Jose del Monte, Bulacan.
                </p>
            </section>
            ${renderFooter()}
        `;
    }

    function renderIndigencyDocument(request) {
        return `
            ${renderDocumentHeader('Certificate of Indigency')}
            <section class="print-document-body">
                <p>To whom it may concern:</p>
                <p>
                    This is to certify that <strong>${escapeHtml(request.full_name)}</strong>, a resident of
                    <strong>${escapeHtml(request.complete_address || 'Barangay Gaya Gaya')}</strong>, belongs to an indigent family in this barangay.
                </p>
                <p>
                    This certification is being issued upon the request of the above-named resident for
                    <strong>${escapeHtml(request.purpose || 'the stated purpose')}</strong>.
                </p>
                <div class="print-document-details">
                    <div class="print-detail-item">
                        <span>Request Date</span>
                        <strong>${escapeHtml(formatDate(request.created_at))}</strong>
                    </div>
                    <div class="print-detail-item">
                        <span>Date Needed</span>
                        <strong>${escapeHtml(formatDate(request.date_needed))}</strong>
                    </div>
                    <div class="print-detail-item">
                        <span>Processing Status</span>
                        <strong>${escapeHtml(titleCaseWords(String(request.final_status || '').replace(/_/g, ' ')))}</strong>
                    </div>
                </div>
                <p>
                    Issued this <strong>${escapeHtml(formatDate(new Date()))}</strong> for whatever legal purpose it may serve.
                </p>
            </section>
            ${renderFooter()}
        `;
    }

    function renderLetterDocument(request) {
        return `
            ${renderDocumentHeader('Certification / Supporting Letter')}
            <section class="print-document-body">
                <p>To whom it may concern:</p>
                <p>
                    Greetings from Barangay Gaya Gaya.
                </p>
                <p>
                    This letter is issued in support of the request of <strong>${escapeHtml(request.full_name)}</strong>,
                    currently residing at <strong>${escapeHtml(request.complete_address || 'Barangay Gaya Gaya')}</strong>.
                </p>
                <p>
                    The resident has requested this certification for
                    <strong>${escapeHtml(request.purpose || 'the stated purpose')}</strong>.
                </p>
                <div class="print-document-details">
                    <div class="print-detail-item">
                        <span>Request Date</span>
                        <strong>${escapeHtml(formatDate(request.created_at))}</strong>
                    </div>
                    <div class="print-detail-item">
                        <span>Date Needed</span>
                        <strong>${escapeHtml(formatDate(request.date_needed))}</strong>
                    </div>
                    <div class="print-detail-item">
                        <span>Contact Number</span>
                        <strong>${escapeHtml(request.contact_number || '-')}</strong>
                    </div>
                </div>
                <p>
                    Issued this <strong>${escapeHtml(formatDate(new Date()))}</strong> upon the request of the resident.
                </p>
            </section>
            ${renderFooter()}
        `;
    }

    function renderUnsupportedDocument(request) {
        return `
            <div class="print-document-loading">
                <strong>No official template for this request type yet.</strong>
                <span>${escapeHtml(request.request_type || 'This request')} currently uses the summary print flow only.</span>
            </div>
        `;
    }

    function renderDocument(request) {
        const requestType = request.request_type;

        if (requestType === 'clearance') {
            document.title = 'Barangay Clearance';
            title.textContent = 'Barangay Clearance';
            subtitle.textContent = 'Official printable clearance layout for Barangay Gaya Gaya.';
            paper.innerHTML = renderClearanceDocument(request);
            return;
        }

        if (requestType === 'indigency') {
            document.title = 'Certificate of Indigency';
            title.textContent = 'Certificate of Indigency';
            subtitle.textContent = 'Official printable indigency certificate layout for Barangay Gaya Gaya.';
            paper.innerHTML = renderIndigencyDocument(request);
            return;
        }

        if (requestType === 'letter') {
            document.title = 'Supporting Letter';
            title.textContent = 'Supporting Letter';
            subtitle.textContent = 'Official printable supporting letter layout for Barangay Gaya Gaya.';
            paper.innerHTML = renderLetterDocument(request);
            return;
        }

        document.title = 'Request Summary';
        title.textContent = 'Printable Request Summary';
        subtitle.textContent = 'This request type does not have a formal document template yet.';
        paper.innerHTML = renderUnsupportedDocument(request);
    }

    if (backButton) {
        backButton.addEventListener('click', function () {
            window.close();
        });
    }

    if (printButton) {
        printButton.addEventListener('click', function () {
            window.print();
        });
    }

    if (!storedRequest) {
        document.title = 'Document Preview';
        title.textContent = 'Document Not Available';
        subtitle.textContent = 'No request data was found for printing.';
        paper.innerHTML = `
            <div class="print-document-loading">
                <strong>No request selected.</strong>
                <span>Please go back to the dashboard and open a request first.</span>
            </div>
        `;
        return;
    }

    try {
        const request = JSON.parse(storedRequest);
        renderDocument(request);
    } catch (error) {
        document.title = 'Document Preview';
        title.textContent = 'Document Not Available';
        subtitle.textContent = 'The print data could not be read properly.';
        paper.innerHTML = `
            <div class="print-document-loading">
                <strong>Unable to load print data.</strong>
                <span>Please reopen the request and try again.</span>
            </div>
        `;
    }
});
