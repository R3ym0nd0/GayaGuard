/* ========================================
   BARANGAY GAYA GAYA - MAIN JAVASCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components when DOM is fully loaded
    initNavbar();
    initMobileMenu();
    initScrollSpy();
    initSmoothScroll();
    initScrollAnimations();
    console.log('BARANGAY GAYA GAYA System UI Initialized ✅');
});

/**
 * Initialize Navbar scroll behavior
 */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/**
 * Initialize Mobile Hamburger Menu
 */
function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const navLinks = document.querySelectorAll('.nav-link');

    function setMenuState(isOpen) {
        navMenu.classList.toggle('active', isOpen);
        hamburgerBtn.classList.toggle('active', isOpen);
        document.documentElement.classList.toggle('menu-open', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
        if (navOverlay) {
            navOverlay.classList.toggle('active', isOpen);
        }
    }
    
    hamburgerBtn.addEventListener('click', function() {
        setMenuState(!navMenu.classList.contains('active'));
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            setMenuState(false);
        });
    });

    if (navOverlay) {
        navOverlay.addEventListener('click', function() {
            setMenuState(false);
        });
    }

    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            setMenuState(false);
        }
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            setMenuState(false);
        }
    });
}

/**
 * Initialize Scroll Spy for navigation
 */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
        let current = '';
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();
}

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 72; // Account for navbar height
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Add subtle entrance animations on scroll
 */
function initScrollAnimations() {
    if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.innerWidth <= 768
    ) {
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.12
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealTargets = document.querySelectorAll(
        '.section-header, .about-content, .dashboard-card, .highlight-card, .service-card, .feature-card, .step-card, .map-placeholder'
    );

    revealTargets.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const isHeroElement = element.closest('.hero-section');
        const isInitiallyVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isHeroElement || isInitiallyVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            element.style.transition = 'none';
            return;
        }

        const delay = (index % 4) * 70;
        element.style.opacity = '0';
        element.style.transform = 'translateY(18px)';
        element.style.transition = `opacity 0.55s ease, transform 0.55s ease ${delay}ms`;
        observer.observe(element);
    });
}
