// Verificar sesión actual
const checkSession = async () => {
  try {
    const response = await fetch('/api/session', {
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return { authenticated: false };
  }
};

// Registro de usuario
const registerUser = async (event) => {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (password !== confirmPassword) {
    showAlert('Las contraseñas no coinciden', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showAlert('Registro exitoso. Redirigiendo...', 'success');
      setTimeout(() => {
        window.location.href = '/passkey.html';
      }, 1500);
    } else {
      showAlert(result.error || 'Error en el registro', 'error');
    }
  } catch (error) {
    showAlert('Error de conexión', 'error');
    console.error('Error:', error);
  }
};

// Login con contraseña
const loginUser = async (event) => {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showAlert('Login exitoso. Redirigiendo...', 'success');
      setTimeout(() => {
        window.location.href = '/payment.html';
      }, 1500);
    } else {
      showAlert(result.error || 'Credenciales inválidas', 'error');
    }
  } catch (error) {
    showAlert('Error de conexión', 'error');
    console.error('Error:', error);
  }
};

// Registrar passkey
const registerPasskey = async () => {
  try {
    // Verificar soporte de WebAuthn
    if (!window.PublicKeyCredential) {
      showAlert('WebAuthn no está soportado en este navegador', 'error');
      return;
    }
    
    // Iniciar registro
    const beginResponse = await fetch('/api/passkey/register/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!beginResponse.ok) {
      const error = await beginResponse.json();
      showAlert(error.error || 'Error al iniciar registro', 'error');
      return;
    }
    
    const options = await beginResponse.json();
    
    // Convertir base64 a ArrayBuffer
    options.challenge = base64ToBuffer(options.challenge);
    options.user.id = base64ToBuffer(options.user.id);
    
    if (options.excludeCredentials) {
      options.excludeCredentials = options.excludeCredentials.map(cred => ({
        ...cred,
        id: base64ToBuffer(cred.id)
      }));
    }
    
    // Asegurar que las opciones para SPC sean correctas
    options.extensions = {
      payment: {
        isPayment: true
      }
    };
    options.authenticatorSelection = options.authenticatorSelection || {};
    options.authenticatorSelection.userVerification = 'required';
    
    console.log('Opciones para navigator.credentials.create:', options);
    
    // Crear credencial
    const credential = await navigator.credentials.create({
      publicKey: options
    });
    
    // Preparar respuesta
    const credentialResponse = {
      id: credential.id,
      rawId: bufferToBase64(credential.rawId),
      response: {
        clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
        attestationObject: bufferToBase64(credential.response.attestationObject),
        transports: credential.response.getTransports ? credential.response.getTransports() : ['internal']
      },
      type: credential.type
    };
    
    // Completar registro
    const completeResponse = await fetch('/api/passkey/register/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentialResponse)
    });
    
    const result = await completeResponse.json();
    
    if (completeResponse.ok && result.verified) {
      showAlert('Passkey registrada exitosamente', 'success');
      updatePasskeyStatus();
    } else {
      showAlert(result.error || 'Error al registrar passkey', 'error');
    }
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      showAlert('Registro cancelado por el usuario', 'warning');
    } else {
      showAlert('Error al registrar passkey', 'error');
      console.error('Error:', error);
    }
  }
};

// Autenticar con passkey (con autofill opcional)
const authenticatePasskey = async (username = null, isConditional = false) => {
  try {
    // Verificar soporte
    if (!window.PublicKeyCredential) {
      showAlert('WebAuthn no está soportado en este navegador', 'error');
      return;
    }
    
    // Iniciar autenticación
    const beginResponse = await fetch('/api/passkey/authenticate/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username })
    });
    
    const options = await beginResponse.json();
    
    // Convertir base64 a ArrayBuffer
    options.challenge = base64ToBuffer(options.challenge);
    
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map(cred => ({
        ...cred,
        id: base64ToBuffer(cred.id)
      }));
    }
    
    // Agregar mediation condicional para autofill
    const credentialRequestOptions = {
      publicKey: options
    };
    
    if (isConditional && 'conditional' in navigator.credentials) {
      credentialRequestOptions.mediation = 'conditional';
    }
    
    console.log('Opciones para navigator.credentials.get:', credentialRequestOptions);
    
    // Obtener credencial
    const credential = await navigator.credentials.get(credentialRequestOptions);
    
    if (!credential) {
      return;
    }
    
    // Preparar respuesta
    const credentialResponse = {
      id: credential.id,
      rawId: bufferToBase64(credential.rawId),
      response: {
        clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
        authenticatorData: bufferToBase64(credential.response.authenticatorData),
        signature: bufferToBase64(credential.response.signature),
        userHandle: credential.response.userHandle ? bufferToBase64(credential.response.userHandle) : null
      },
      type: credential.type
    };
    
    // Completar autenticación
    const completeResponse = await fetch('/api/passkey/authenticate/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, response: credentialResponse })
    });
    
    const result = await completeResponse.json();
    
    if (completeResponse.ok && result.verified) {
      showAlert(`Autenticación exitosa. Bienvenido ${result.username}!`, 'success');
      setTimeout(() => {
        window.location.href = '/payment.html';
      }, 1500);
    } else {
      showAlert(result.error || 'Error en la autenticación', 'error');
    }
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      showAlert('Autenticación cancelada', 'warning');
    } else if (!isConditional) {
      showAlert('Error al autenticar con passkey', 'error');
      console.error('Error:', error);
    }
  }
};

// Configurar autofill condicional
const setupConditionalUI = () => {
  if (window.PublicKeyCredential && 
      PublicKeyCredential.isConditionalMediationAvailable) {
    PublicKeyCredential.isConditionalMediationAvailable().then(available => {
      if (available) {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
          usernameInput.setAttribute('autocomplete', 'username webauthn');
          // Iniciar autenticación condicional
          authenticatePasskey(null, true);
        }
      }
    });
  }
};

// Actualizar estado de passkeys
const updatePasskeyStatus = async () => {
  const session = await checkSession();
  const statusElement = document.getElementById('passkey-status');
  
  if (statusElement && session.authenticated) {
    if (session.hasPasskeys) {
      statusElement.innerHTML = '<div class="alert alert-success">✓ Tienes passkeys registradas</div>';
    } else {
      statusElement.innerHTML = '<div class="alert alert-warning">⚠ No tienes passkeys registradas</div>';
    }
  }
};

// Logout
const logout = async () => {
  try {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};

// --- GESTIÓN DE PASSKEYS ---

const listPasskeys = async () => {
    const listContainer = document.getElementById('passkey-list');
    if (!listContainer) return;

    try {
        const response = await fetch('/api/passkeys', { credentials: 'include' });
        if (!response.ok) {
            listContainer.innerHTML = '<p class="text-muted">Error al cargar las passkeys.</p>';
            return;
        }
        const { passkeys } = await response.json();
        
        if (passkeys.length === 0) {
            listContainer.innerHTML = '<p class="text-muted" style="padding: 24px 0; text-align: center;">No tienes ninguna passkey registrada.</p>';
            return;
        }

        let html = '<ul style="list-style: none; padding: 0; margin-top: 20px;">';
        passkeys.forEach(passkey => {
            const date = new Date(passkey.createdAt || Date.now()).toLocaleString('es-ES', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const name = passkey.friendlyName || 'Dispositivo sin nombre';

            html += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-weight: 600; color: #1e293b;">${name}</span>
                        <span style="font-size: 13px; color: #94a3b8;">Registrada: ${date}</span>
                        <span style="font-family: monospace; font-size: 12px; color: #94a3b8;">ID: ${passkey.credentialID.substring(0, 20)}...</span>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deletePasskey('${passkey.credentialID}')">Eliminar</button>
                </li>
            `;
        });
        html += '</ul>';
        listContainer.innerHTML = html;

    } catch (error) {
        listContainer.innerHTML = '<p class="text-muted">Error de conexión al cargar las passkeys.</p>';
    }
};

const deletePasskey = async (credentialID) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta passkey? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch('/api/passkey/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ credentialID })
        });

        const result = await response.json();
        if (response.ok && result.success) {
            showAlert('Passkey eliminada exitosamente.', 'success');
            listPasskeys(); // Refrescar la lista
        } else {
            showAlert(result.error || 'No se pudo eliminar la passkey.', 'error');
        }
    } catch (error) {
        showAlert('Error de conexión al eliminar la passkey.', 'error');
    }
};

// Inicializar página según contexto
document.addEventListener('DOMContentLoaded', () => {
  // Verificar formularios
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', registerUser);
  }
  
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', loginUser);
    setupConditionalUI();
  }
  
  // Verificar botones
  const registerPasskeyBtn = document.getElementById('register-passkey');
  if (registerPasskeyBtn) {
    registerPasskeyBtn.addEventListener('click', registerPasskey);
    updatePasskeyStatus();
    listPasskeys();
  }
  
  const authenticatePasskeyBtn = document.getElementById('authenticate-passkey');
  if (authenticatePasskeyBtn) {
    authenticatePasskeyBtn.addEventListener('click', () => {
      // Permite el login sin contraseña (discoverable credentials)
      const usernameInput = document.getElementById('username');
      const username = usernameInput ? usernameInput.value : null;
      authenticatePasskey(username || null); // Pasa null si el campo está vacío
    });
  }
  
  // Configurar navegación activa
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
});
