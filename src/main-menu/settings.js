// Funcionalidad para la página de configuración

document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración guardada
    loadSettings();
    
    // Animaciones de entrada
    animateSettingsElements();
});

function loadSettings() {
    // Cargar configuración desde localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        applySettings(settings);
    }
}

function applySettings(settings) {
    // Aplicar configuración a los elementos del formulario
    const checkboxes = [
        'emailNotifications',
        'pushNotifications', 
        'studyReminders',
        'publicProfile',
        'twoFactorAuth',
        'activityHistory',
        'darkMode',
        'autoPlay'
    ];
    
    checkboxes.forEach(id => {
        const element = document.getElementById(id);
        if (element && settings[id] !== undefined) {
            element.checked = settings[id];
        }
    });
    
    // Aplicar selects
    const selects = ['videoQuality', 'interfaceLanguage', 'timezone'];
    selects.forEach(id => {
        const element = document.getElementById(id);
        if (element && settings[id]) {
            element.value = settings[id];
        }
    });
}

function saveSettings() {
    // Mostrar indicador de carga
    const saveBtn = document.querySelector('.btn-primary');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    saveBtn.disabled = true;
    
    // Recopilar configuración
    const settings = {};
    
    // Checkboxes
    const checkboxes = [
        'emailNotifications',
        'pushNotifications', 
        'studyReminders',
        'publicProfile',
        'twoFactorAuth',
        'activityHistory',
        'darkMode',
        'autoPlay'
    ];
    
    checkboxes.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            settings[id] = element.checked;
        }
    });
    
    // Selects
    const selects = ['videoQuality', 'interfaceLanguage', 'timezone'];
    selects.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            settings[id] = element.value;
        }
    });
    
    // Simular guardado
    setTimeout(() => {
        // Guardar en localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        // Mostrar mensaje de éxito
        showNotification('Configuración guardada correctamente', 'success');
        
        // Restaurar botón
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'main-menu.html';
        }, 1500);
        
    }, 1000);
}

function changePassword() {
    // Crear modal para cambiar contraseña
    const modal = document.createElement('div');
    modal.className = 'password-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-key"></i> Cambiar Contraseña</h3>
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="currentPassword">Contraseña Actual</label>
                    <input type="password" id="currentPassword" placeholder="Ingresa tu contraseña actual">
                </div>
                <div class="form-group">
                    <label for="newPassword">Nueva Contraseña</label>
                    <input type="password" id="newPassword" placeholder="Ingresa la nueva contraseña">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Contraseña</label>
                    <input type="password" id="confirmPassword" placeholder="Confirma la nueva contraseña">
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="updatePassword()">Actualizar</button>
            </div>
        </div>
    `;
    
    // Agregar estilos
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector('.password-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Simular actualización
    showNotification('Contraseña actualizada correctamente', 'success');
    closeModal();
}

function exportData() {
    // Simular exportación de datos
    const saveBtn = document.querySelector('.btn-secondary[onclick="exportData()"]');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
    saveBtn.disabled = true;
    
    setTimeout(() => {
        // Crear archivo de datos
        const userData = {
            profile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
            settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
            progress: JSON.parse(localStorage.getItem('userProgress') || '{}'),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Datos exportados correctamente', 'success');
        
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }, 2000);
}

function deleteAccount() {
    if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        if (confirm('Esta es tu última advertencia. ¿Realmente quieres eliminar tu cuenta?')) {
            // Simular eliminación
            const deleteBtn = document.querySelector('.btn-danger[onclick="deleteAccount()"]');
            const originalText = deleteBtn.innerHTML;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
            deleteBtn.disabled = true;
            
            setTimeout(() => {
                // Limpiar localStorage
                localStorage.clear();
                
                showNotification('Cuenta eliminada correctamente', 'success');
                
                // Redirigir al login
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 2000);
                
            }, 2000);
        }
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Agregar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 
                     type === 'error' ? 'linear-gradient(135deg, #ff4757, #ff3742)' : 
                     'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'};
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

function animateSettingsElements() {
    // Animar elementos de configuración
    const settingsSections = document.querySelectorAll('.settings-section');
    settingsSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            section.style.transition = 'all 0.6s ease-out';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

// Estilos para el modal
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal-content {
        background: var(--glass);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(7, 17, 36, 0.3);
        border-radius: 20px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: slideInUp 0.3s ease-out;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .modal-header h3 {
        color: #ffffff;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .modal-close {
        background: none;
        border: none;
        color: #d1e7ff;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s ease;
    }
    
    .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }
    
    .modal-body {
        margin-bottom: 1.5rem;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(modalStyles);
