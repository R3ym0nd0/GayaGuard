document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const headerMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const modal = document.getElementById('requestPreviewModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const tableRows = document.querySelectorAll('.request-table tbody tr');

    if (!sidebar || !overlay) {
        return;
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

    function toggleSidebar() {
        setSidebarState(!sidebar.classList.contains('active'));
    }

    if (headerMenuBtn) {
        headerMenuBtn.addEventListener('click', toggleSidebar);
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    overlay.addEventListener('click', function () {
        setSidebarState(false);
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024) {
            setSidebarState(false);
        }
    });

    if (modal && modalOverlay && tableRows.length) {
        tableRows.forEach(row => {
            row.addEventListener('click', function () {
                modal.classList.add('active');
                modalOverlay.classList.add('active');
                document.body.classList.add('modal-open');
            });
        });
    }
});
