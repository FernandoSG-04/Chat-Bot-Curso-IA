// Funcionalidad para la página de métodos de pago

document.addEventListener('DOMContentLoaded', function() {
    // Cargar métodos de pago guardados
    loadPaymentMethods();
    
    // Configurar validación de formularios
    setupFormValidation();
    
    // Animaciones de entrada
    animatePaymentElements();
});

function loadPaymentMethods() {
    // Cargar métodos de pago desde localStorage
    const savedMethods = localStorage.getItem('paymentMethods');
    if (savedMethods) {
        const methods = JSON.parse(savedMethods);
        displayPaymentMethods(methods);
    }
}

function displayPaymentMethods(methods) {
    // Mostrar métodos de pago guardados
    const paymentMethodsContainer = document.querySelector('.payment-methods');
    if (paymentMethodsContainer && methods.length > 0) {
        // Actualizar la visualización con los métodos guardados
        methods.forEach(method => {
            // Aquí se actualizaría la UI con los métodos guardados
        });
    }
}

function setupFormValidation() {
    // Validación del número de tarjeta
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            value = value.replace(/\D/g, '');
            value = value.replace(/(\d{4})/g, '$1 ').trim();
            e.target.value = value;
        });
    }
    
    // Validación de fecha de expiración
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Validación de CVV
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

function addPaymentMethod() {
    // Validar formulario
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardHolder = document.getElementById('cardHolder').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        showNotification('Número de tarjeta inválido', 'error');
        return;
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
        showNotification('CVV inválido', 'error');
        return;
    }
    
    // Mostrar indicador de carga
    const addBtn = document.querySelector('.btn-primary[onclick="addPaymentMethod()"]');
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
    addBtn.disabled = true;
    
    // Simular procesamiento
    setTimeout(() => {
        // Crear nuevo método de pago
        const newMethod = {
            id: Date.now(),
            type: getCardType(cardNumber),
            number: '****' + cardNumber.slice(-4),
            holder: cardHolder,
            expiry: expiryDate,
            saved: document.getElementById('saveCard').checked
        };
        
        // Guardar en localStorage
        const existingMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        existingMethods.push(newMethod);
        localStorage.setItem('paymentMethods', JSON.stringify(existingMethods));
        
        // Mostrar mensaje de éxito
        showNotification('Método de pago agregado correctamente', 'success');
        
        // Limpiar formulario
        clearPaymentForm();
        
        // Restaurar botón
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
        
        // Recargar métodos
        loadPaymentMethods();
        
    }, 1500);
}

function getCardType(cardNumber) {
    // Detectar tipo de tarjeta basado en el número
    if (cardNumber.startsWith('4')) return 'visa';
    if (cardNumber.startsWith('5')) return 'mastercard';
    if (cardNumber.startsWith('3')) return 'amex';
    return 'generic';
}

function editPaymentMethod(id) {
    // Crear modal para editar método de pago
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Editar Método de Pago</h3>
                <button class="modal-close" onclick="closePaymentModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="editCardHolder">Titular de la Tarjeta</label>
                    <input type="text" id="editCardHolder" placeholder="Nombre Apellido">
                </div>
                <div class="form-group">
                    <label for="editExpiryDate">Fecha de Expiración</label>
                    <input type="text" id="editExpiryDate" placeholder="MM/YY" maxlength="5">
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closePaymentModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="updatePaymentMethod(${id})">Actualizar</button>
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

function closePaymentModal() {
    const modal = document.querySelector('.payment-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function updatePaymentMethod(id) {
    const cardHolder = document.getElementById('editCardHolder').value;
    const expiryDate = document.getElementById('editExpiryDate').value;
    
    if (!cardHolder || !expiryDate) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    // Simular actualización
    showNotification('Método de pago actualizado correctamente', 'success');
    closePaymentModal();
}

function deletePaymentMethod(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
        // Simular eliminación
        const deleteBtn = document.querySelector(`.btn-danger[onclick="deletePaymentMethod(${id})"]`);
        const originalText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        deleteBtn.disabled = true;
        
        setTimeout(() => {
            // Eliminar de localStorage
            const existingMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
            const updatedMethods = existingMethods.filter(method => method.id !== id);
            localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
            
            showNotification('Método de pago eliminado correctamente', 'success');
            
            // Recargar métodos
            loadPaymentMethods();
            
        }, 1000);
    }
}

function clearPaymentForm() {
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardHolder').value = '';
    document.getElementById('expiryDate').value = '';
    document.getElementById('cvv').value = '';
    document.getElementById('saveCard').checked = true;
}

function savePaymentSettings() {
    // Mostrar indicador de carga
    const saveBtn = document.querySelector('.btn-primary[onclick="savePaymentSettings()"]');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    saveBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('Configuración de pagos guardada correctamente', 'success');
        
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
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

function animatePaymentElements() {
    // Animar elementos de pago
    const paymentSections = document.querySelectorAll('.payment-section');
    paymentSections.forEach((section, index) => {
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
