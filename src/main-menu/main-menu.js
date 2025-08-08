// Elementos del DOM
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const indicator = document.querySelector('.indicator');

// Función para activar enlace del navbar
function activeLink() {
    // Remover clase active de todos los elementos
    navItems.forEach(item => item.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    // Agregar clase active al elemento clickeado
    this.classList.add('active');
    
    // Obtener el target del enlace
    const target = this.querySelector('.nav-link').getAttribute('href').substring(1);
    
    // Mostrar la sección correspondiente
    const targetSection = document.getElementById(target);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar indicador
    updateIndicator();
}

// Función para actualizar el indicador
function updateIndicator() {
    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem && indicator) {
        const index = Array.from(navItems).indexOf(activeItem);
        indicator.style.transform = `translateX(calc(120px * ${index}))`;
    }
}

// Función para manejar la navegación por hash
function handleHashNavigation() {
    const hash = window.location.hash || '#home';
    const targetItem = document.querySelector(`[href="${hash}"]`);
    
    if (targetItem) {
        const navItem = targetItem.closest('.nav-item');
        if (navItem) {
            navItems.forEach(item => item.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            navItem.classList.add('active');
            const targetSection = document.getElementById(hash.substring(1));
            if (targetSection) {
                targetSection.classList.add('active');
            }
            updateIndicator();
        }
    }
    
    // Asegurar que la página no haga scroll automático
    if (window.scrollY > 0) {
        window.scrollTo(0, 0);
    }
}

// Función para toggle del menú móvil
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    
    // Animar las barras del toggle
    const bars = navToggle.querySelectorAll('.bar');
    bars.forEach((bar, index) => {
        if (navMenu.classList.contains('active')) {
            if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            if (index === 1) bar.style.opacity = '0';
            if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bar.style.transform = 'none';
            bar.style.opacity = '1';
        }
    });
}

// Función para cerrar menú móvil al hacer click en un enlace
function closeMobileMenu() {
    navMenu.classList.remove('active');
    const bars = navToggle.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.style.transform = 'none';
        bar.style.opacity = '1';
    });
}

// Función para animar elementos al hacer scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.stat-card, .course-card, .progress-card, .profile-card');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Función para manejar el progreso circular
function updateCircularProgress() {
    const circularProgress = document.querySelector('.circular-progress-fill');
    if (circularProgress) {
        const progress = circularProgress.style.getPropertyValue('--progress') || '65%';
        const percentage = parseInt(progress);
        
        // Animar el progreso
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 1;
            circularProgress.style.setProperty('--progress', `${currentProgress}%`);
            
            if (currentProgress >= percentage) {
                clearInterval(interval);
            }
        }, 20);
    }
}

// Función para manejar los botones de curso
function handleCourseButtons() {
    const courseButtons = document.querySelectorAll('.course-btn');
    courseButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Aquí puedes agregar la lógica para continuar el curso
            const courseCard = this.closest('.course-card');
            const courseTitle = courseCard.querySelector('h3').textContent;
            
            // Mostrar mensaje de confirmación
            showNotification(`Continuando con: ${courseTitle}`, 'success');
        });
    });
}

// Función para manejar los botones del perfil
function handleProfileButtons() {
    const profileButtons = document.querySelectorAll('.profile-btn');
    profileButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            
            switch(action) {
                case 'Editar Perfil':
                    window.location.href = 'edit-profile.html';
                    break;
                case 'Configuración':
                    window.location.href = 'settings.html';
                    break;
                case 'Métodos de Pago':
                    window.location.href = 'payment-methods.html';
                    break;
                case 'Cerrar Sesión':
                    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                        // Redirigir al login
                        window.location.href = '../login/login.html';
                    }
                    break;
            }
        });
    });
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Agregar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(7, 17, 36, 0.3);
        border-radius: 10px;
        padding: 1rem;
        color: var(--text-on-dark);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Función para cerrar notificación
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Función para inicializar las animaciones de las partículas
function initParticles() {
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        particle.style.animationDelay = `${index * 0.5}s`;
    });
}

// Función para manejar el scroll suave
function smoothScroll(target) {
    const targetElement = document.querySelector(target);
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Prevenir scroll automático al cargar la página
    window.scrollTo(0, 0);
    
    // Inicializar navegación
    navItems.forEach(item => item.addEventListener('click', activeLink));
    
    // Inicializar toggle móvil
    navToggle.addEventListener('click', toggleMobileMenu);
    
    // Cerrar menú móvil al hacer click en un enlace
    navItems.forEach(item => {
        item.addEventListener('click', closeMobileMenu);
    });
    
    // Manejar navegación por hash
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
    
    // Inicializar animaciones
    initParticles();
    updateCircularProgress();
    handleCourseButtons();
    handleProfileButtons();
    
    // Animar elementos al hacer scroll (solo cuando el usuario hace scroll)
    window.addEventListener('scroll', animateOnScroll);
    
    // Inicializar animaciones de elementos visibles sin causar scroll
    setTimeout(() => {
        animateOnScroll();
    }, 100);
    
    // Manejar clicks en enlaces externos
    const externalLinks = document.querySelectorAll('a[href^="http"]');
    externalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(this.href, '_blank');
        });
    });
    
    // Manejar el botón de chat
    const chatBtn = document.querySelector('.chat-btn');
    if (chatBtn) {
        chatBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Agregar transición suave antes de redirigir
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                window.location.href = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            }, 300);
        });
    }
    
    // Agregar estilos para las notificaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-on-dark);
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: 1rem;
        }
        
        .notification-close:hover {
            opacity: 0.7;
        }
    `;
    document.head.appendChild(style);
});

// Función para manejar el responsive
function handleResponsive() {
    const width = window.innerWidth;
    
    if (width <= 768) {
        // Ajustes para móvil
        navItems.forEach(item => {
            item.style.width = '100%';
        });
    } else {
        // Ajustes para desktop
        navItems.forEach(item => {
            item.style.width = '120px';
        });
    }
}

// Event listener para responsive
window.addEventListener('resize', handleResponsive);

// Inicializar responsive al cargar
handleResponsive();
