// Utilidades compartidas para WebAuthn
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const base64ToBuffer = (base64) => {
  const base64Cleaned = base64.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64Cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Mostrar mensajes de alerta
const showAlert = (message, type = 'info') => {
  const alertsContainer = document.getElementById('alerts-container') || createAlertsContainer();
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
  `;
  
  alertsContainer.appendChild(alert);
  
  // Auto-eliminar después de 5 segundos
  setTimeout(() => alert.remove(), 5000);
};

const createAlertsContainer = () => {
  const container = document.createElement('div');
  container.id = 'alerts-container';
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.zIndex = '1000';
  container.style.maxWidth = '400px';
  document.body.appendChild(container);
  return container;
}; 
