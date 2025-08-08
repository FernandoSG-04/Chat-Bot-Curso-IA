// Funcionalidad para la página de editar perfil

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editProfileForm');
    
    // Cargar datos del perfil desde localStorage
    loadProfileData();
    
    // Manejar envío del formulario
    form.addEventListener('submit', handleFormSubmit);
    
    // Animaciones de entrada
    animateFormElements();
});

function loadProfileData() {
    // Cargar datos guardados del perfil (simulado)
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        populateForm(profile);
    }
}

function populateForm(profile) {
    // Llenar los campos del formulario con los datos guardados
    const fields = ['firstName', 'lastName', 'email', 'phone', 'birthDate', 'education', 'field', 'experience', 'language', 'timezone'];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && profile[field]) {
            element.value = profile[field];
        }
    });
    
    // Manejar checkboxes
    if (profile.notifications !== undefined) {
        document.getElementById('notifications').checked = profile.notifications;
    }
    if (profile.newsletter !== undefined) {
        document.getElementById('newsletter').checked = profile.newsletter;
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Mostrar indicador de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;
    
    // Recopilar datos del formulario
    const formData = new FormData(e.target);
    const profileData = {};
    
    for (let [key, value] of formData.entries()) {
        profileData[key] = value;
    }
    
    // Manejar checkboxes
    profileData.notifications = document.getElementById('notifications').checked;
    profileData.newsletter = document.getElementById('newsletter').checked;
    
    // Simular guardado (en una aplicación real, aquí se enviaría al servidor)
    setTimeout(() => {
        // Guardar en localStorage
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        
        // Mostrar mensaje de éxito
        showNotification('Perfil actualizado correctamente', 'success');
        
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'main-menu.html';
        }, 1500);
        
    }, 1000);
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Agregar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function animateFormElements() {
    // Animar elementos del formulario
    const formElements = document.querySelectorAll('.form-group');
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease-out';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

// Validación en tiempo real
document.addEventListener('input', function(e) {
    const input = e.target;
    const value = input.value.trim();
    
    // Validar email
    if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            input.style.borderColor = '#ff4757';
            showFieldError(input, 'Email inválido');
        } else {
            input.style.borderColor = 'var(--color-primary)';
            clearFieldError(input);
        }
    }
    
    // Validar teléfono
    if (input.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            input.style.borderColor = '#ff4757';
            showFieldError(input, 'Teléfono inválido');
        } else {
            input.style.borderColor = 'var(--color-primary)';
            clearFieldError(input);
        }
    }
});

function showFieldError(input, message) {
    // Remover error anterior
    clearFieldError(input);
    
    // Crear mensaje de error
    const error = document.createElement('div');
    error.className = 'field-error';
    error.textContent = message;
    error.style.cssText = `
        color: #ff4757;
        font-size: 0.8rem;
        margin-top: 0.25rem;
        animation: fadeInUp 0.3s ease-out;
    `;
    
    input.parentNode.appendChild(error);
}

function clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Animaciones CSS
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
`;
document.head.appendChild(style);
