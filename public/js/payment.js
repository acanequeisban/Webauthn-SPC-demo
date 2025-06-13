// Sistema de logging para SPC
const SPCLogger = {
  log: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`🔵 [SPC-CLIENT ${timestamp}] ${message}`);
    if (data) {
      console.log('📊 Data:', data);
    }
  },
  
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`🔴 [SPC-CLIENT ${timestamp}] ERROR: ${message}`);
    if (error) {
      console.error('💥 Error details:', error);
      if (error.stack) {
        console.error('📍 Stack:', error.stack);
      }
    }
  },
  
  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`🟢 [SPC-CLIENT ${timestamp}] SUCCESS: ${message}`);
    if (data) {
      console.log('✅ Data:', data);
    }
  },
  
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`🟡 [SPC-CLIENT ${timestamp}] WARNING: ${message}`);
    if (data) {
      console.warn('⚠️ Data:', data);
    }
  }
};

// Verificar disponibilidad de SPC con logs detallados
const checkSPCAvailability = async () => {
  SPCLogger.log('🔍 Iniciando verificación de disponibilidad de SPC...');
  
  try {
    // Información del navegador
    SPCLogger.log('🌐 Información del navegador:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    });
    
    // Verificar protocolo
    SPCLogger.log(`🔒 Protocolo actual: ${location.protocol}`);
    SPCLogger.log(`🌍 Host actual: ${location.host}`);
    SPCLogger.log(`📍 URL completa: ${location.href}`);
    
    // Verificar si estamos en HTTPS (requerido para SPC)
    if (location.protocol !== 'https:') {
      SPCLogger.warn('❌ SPC requiere HTTPS - protocolo actual: ' + location.protocol);
      return {
        available: false,
        message: 'SPC requiere HTTPS',
        needsHTTPS: true
      };
    }
    
    SPCLogger.success('✅ Protocolo HTTPS verificado');
    
    // Verificar APIs disponibles
    const apis = {
      PaymentRequest: 'PaymentRequest' in window,
      PublicKeyCredential: 'PublicKeyCredential' in window,
      credentials: 'credentials' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window
    };
    
    SPCLogger.log('🔧 APIs disponibles:', apis);
    
    // Verificar PaymentRequest
    if (!apis.PaymentRequest) {
      SPCLogger.error('❌ PaymentRequest API no disponible');
      return { 
        available: false, 
        message: 'Payment Request API no está soportada en este navegador' 
      };
    }
    
    SPCLogger.success('✅ PaymentRequest API disponible');
    
    // Verificar WebAuthn
    if (!apis.PublicKeyCredential) {
      SPCLogger.error('❌ WebAuthn (PublicKeyCredential) no disponible');
      return { 
        available: false, 
        message: 'PaymentRequest disponible pero falta WebAuthn' 
      };
    }
    
    SPCLogger.success('✅ WebAuthn (PublicKeyCredential) disponible');
    
    // Verificar métodos de pago soportados
    if (window.PaymentRequest && typeof window.PaymentRequest.prototype.canMakePayment === 'function') {
      try {
        // Test básico de SPC
        const testRequest = new PaymentRequest(
          [{ supportedMethods: 'secure-payment-confirmation' }],
          { total: { label: 'Test', amount: { currency: 'EUR', value: '1.00' } } }
        );
        
        const canMakePayment = await testRequest.canMakePayment();
        SPCLogger.log('🧪 Test canMakePayment para SPC:', canMakePayment);
        
        // No importa el resultado, el hecho de que no arroje error es bueno
        SPCLogger.success('✅ SPC method test completado sin errores');
      } catch (testError) {
        SPCLogger.warn('⚠️ Test de SPC method falló (puede ser normal):', testError.message);
      }
    }
    
    SPCLogger.success('🎯 Todas las verificaciones completadas - SPC debería funcionar');
    
    return { 
      available: true, 
      message: 'PaymentRequest y WebAuthn disponibles - SPC debería funcionar',
      apis 
    };
    
  } catch (error) {
    SPCLogger.error('💥 Error durante verificación de SPC', error);
    return { 
      available: false, 
      message: 'Error al verificar disponibilidad de PaymentRequest: ' + error.message 
    };
  }
};

// Mostrar estado de SPC
const showSPCStatus = async () => {
  const statusElement = document.getElementById('spc-status');
  if (statusElement) {
    const { available, message, needsHTTPS } = await checkSPCAvailability();
    
    let statusHTML = `
      <div class="alert alert-${available ? 'success' : 'warning'}">
        ${available ? '✓' : '⚠'} ${message}
      </div>
    `;
    
    if (needsHTTPS) {
      const httpsUrl = location.hostname === 'localhost' ? 
        'https://localhost:3443/payment.html' : 
        `https://${location.hostname}/payment.html`;
      statusHTML += `
        <div class="alert alert-info">
          <strong>🔒 Cambiar a HTTPS:</strong>
          <a href="${httpsUrl}" class="btn btn-primary" style="margin-left: 10px;">
            Ir a versión HTTPS
          </a>
        </div>
      `;
    }
    
    statusElement.innerHTML = statusHTML;
  }
};

// Actualizar total del carrito
const updateCartTotal = () => {
  const subtotal = parseFloat(document.getElementById('cart-subtotal').textContent);
  const shipping = parseFloat(document.getElementById('cart-shipping').textContent);
  const tax = parseFloat(document.getElementById('cart-tax').textContent);
  const total = subtotal + shipping + tax;
  
  document.getElementById('cart-total').textContent = total.toFixed(2);
  return total.toFixed(2);
};

// Procesar pago con SPC
const processSPCPayment = async (event) => {
  event.preventDefault();
  
  const payButton = event.target;
  const originalText = payButton.innerHTML;
  
  try {
    payButton.disabled = true;
    payButton.innerHTML = '<span class="spinner"></span> Procesando...';
    
    // Get payment data
    const amount = updateCartTotal();
    
    // Request SPC configuration from server
    const spcResponse = await fetch('/api/payment/spc/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        amount,
        currency: 'EUR'
      })
    });
    
    if (!spcResponse.ok) {
      throw new Error('Error al iniciar SPC');
    }
    
    const spcData = await spcResponse.json();
    
    // Convert challenge and credentialIds to ArrayBuffer
    spcData.challenge = base64ToBuffer(spcData.challenge);
    spcData.credentialIds = spcData.credentialIds.map(id => base64ToBuffer(id));
    
    // Create payment request with minimal structure matching the working example
    const paymentRequest = new PaymentRequest(
      [{
        supportedMethods: 'secure-payment-confirmation',
        data: {
          challenge: spcData.challenge,
          rpId: window.location.hostname,
          credentialIds: spcData.credentialIds,
          instrument: {
            displayName: 'Tarjeta Demo ****1234',
            icon: 'https://demo.savagesoftware.dev/images/mastercard.png'
          },
          timeout: 60000,
          payeeOrigin: window.location.origin,
          payeeName: 'Comercio Demo'
        }
      }],
      {
        total: {
          label: 'Total',
          amount: {
            currency: spcData.total.currency,
            value: spcData.total.value
          }
        }
      }
    );
    
    // Show payment UI
    const paymentResponse = await paymentRequest.show();
    
    // Process the response
    if (paymentResponse) {
      const details = paymentResponse.details;
      
      // Prepare verification data
      const verificationData = {
        id: details.id,
        rawId: bufferToBase64(details.rawId),
        response: {
          clientDataJSON: bufferToBase64(details.response.clientDataJSON),
          authenticatorData: bufferToBase64(details.response.authenticatorData),
          signature: bufferToBase64(details.response.signature),
          userHandle: details.response.userHandle ? bufferToBase64(details.response.userHandle) : null
        },
        type: details.type
      };
      
      // Verify with server
      const verifyResponse = await fetch('/api/payment/spc/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response: verificationData })
      });
      
      const result = await verifyResponse.json();
      
      if (verifyResponse.ok && result.verified) {
        await paymentResponse.complete('success');
        showPaymentSuccess(result.paymentId);
      } else {
        await paymentResponse.complete('fail');
        throw new Error(result.error || 'Verificación del pago fallida');
      }
    }
  } catch (error) {
    showPaymentError(error.message);
  } finally {
    payButton.disabled = false;
    payButton.innerHTML = originalText;
  }
};

// Procesar pago tradicional (sin SPC)
const processTraditionalPayment = async (event) => {
  event.preventDefault();
  
  const payButton = event.target;
  const originalText = payButton.innerHTML;
  
  try {
    payButton.disabled = true;
    payButton.innerHTML = '<span class="spinner"></span> Procesando...';
    
    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mostrar éxito
    showPaymentSuccess(`payment-${Date.now()}`);
  } catch (error) {
    showPaymentError('Error al procesar el pago');
  } finally {
    payButton.disabled = false;
    payButton.innerHTML = originalText;
  }
};

// Mostrar éxito del pago
const showPaymentSuccess = (paymentId) => {
  const paymentForm = document.getElementById('payment-form');
  paymentForm.innerHTML = `
    <div class="text-center">
      <div style="font-size: 64px; color: var(--success-color); margin-bottom: 24px;">
        ✓
      </div>
      <h2 style="margin-bottom: 16px;">¡Pago exitoso!</h2>
      <p class="text-muted" style="margin-bottom: 24px;">
        Tu pago ha sido procesado correctamente.<br>
        ID de transacción: <strong>${paymentId}</strong>
      </p>
      <button class="btn btn-primary" onclick="location.href='/'">
        Volver al inicio
      </button>
    </div>
  `;
  
  // Scroll al mensaje
  paymentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Mostrar error del pago
const showPaymentError = (message) => {
  showAlert(message, 'error');
};

// Inicializar página de pago
document.addEventListener('DOMContentLoaded', async () => {
  SPCLogger.log('🚀 ================== INICIANDO PÁGINA DE PAGOS ==================');
  SPCLogger.log('📄 DOMContentLoaded ejecutado');
  
  // Obtener referencias a elementos del DOM
  const spcPayButton = document.getElementById('pay-with-spc');
  const traditionalPayButton = document.getElementById('pay-traditional');
  
  try {
    // Mostrar estado de SPC
    SPCLogger.log('🔍 Verificando estado de SPC...');
    await showSPCStatus();
    SPCLogger.success('✅ Estado de SPC verificado');
    
    // Actualizar total inicial
    SPCLogger.log('💰 Actualizando total del carrito...');
    const total = updateCartTotal();
    SPCLogger.log('💰 Total calculado:', total);
    
    // Configurar botones de pago
    SPCLogger.log('🔧 Configurando event listeners...');
    
    if (spcPayButton) {
      spcPayButton.addEventListener('click', processSPCPayment);
      SPCLogger.log('✅ Event listener agregado a botón SPC');
    } else {
      SPCLogger.warn('⚠️ Botón SPC no encontrado en DOM');
    }
    
    if (traditionalPayButton) {
      traditionalPayButton.addEventListener('click', processTraditionalPayment);
      SPCLogger.log('✅ Event listener agregado a botón tradicional');
    } else {
      SPCLogger.warn('⚠️ Botón tradicional no encontrado en DOM');
    }
  } catch (error) {
    SPCLogger.error('💥 Error durante inicialización', error);
  }
  
        // Verificar sesión
  SPCLogger.log('🔍 Verificando sesión de usuario...');
  try {
    const response = await fetch('/api/session', { credentials: 'include' });
    const session = await response.json();
    
    SPCLogger.log('👤 Estado de sesión:', {
      authenticated: session.authenticated,
      username: session.username,
      hasPasskeys: session.hasPasskeys
    });
    
    if (!session.authenticated) {
      SPCLogger.warn('⚠️ Usuario no autenticado - redirigiendo al login');
      // Redirigir al login manteniendo el protocolo
      window.location.href = '/login.html';
      return;
    }
    
    SPCLogger.success('✅ Usuario autenticado:', session.username);
    
    // Mostrar/ocultar botón SPC según tenga passkeys
    if (spcPayButton) {
      if (!session.hasPasskeys) {
        spcPayButton.disabled = true;
        spcPayButton.textContent = 'Registra una passkey primero';
        SPCLogger.warn('⚠️ Usuario sin passkeys - botón SPC deshabilitado');
      } else if (location.protocol !== 'https:') {
        spcPayButton.textContent = 'SPC requiere HTTPS - Haz clic para cambiar';
        SPCLogger.warn('⚠️ Protocolo HTTP - botón SPC modificado');
      } else {
        SPCLogger.success('✅ Usuario listo para SPC - tiene passkeys y está en HTTPS');
      }
    }
  } catch (error) {
    SPCLogger.error('💥 Error verificando sesión', error);
  }
  
  SPCLogger.success('🏁 ================== PÁGINA DE PAGOS LISTA ==================');
});
