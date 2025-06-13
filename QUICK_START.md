# 🚀 Guía de Inicio Rápido - SPC Demo

## ¿Qué es esto?

Una demostración funcional de **Secure Payment Confirmation (SPC)**, la nueva API del W3C para pagos seguros con autenticación biométrica.

## 📋 Antes de empezar

1. **Navegador**: Chrome 95+ o Edge 95+
2. **Dispositivo**: Con autenticación biométrica (Touch ID, Face ID, Windows Hello, etc.)
3. **Node.js**: Versión 18 o superior

## 🎯 Prueba rápida (5 minutos)

### 1. Configura el entorno

```bash
# Clona o descarga el proyecto
npm install

# Genera certificados SSL (opcional, para SPC)
npm run setup

# Inicia el servidor
npm start
```

### 2. Accede a la aplicación

**Tienes dos opciones:**

#### 🌐 HTTP (básico)
- Ve a **http://localhost:3000**
- Todas las funciones funcionan EXCEPTO SPC
- No necesitas aceptar certificados

#### 🔒 HTTPS (completo con SPC)
- Ve a **https://localhost:3443** (desarrollo local)
- O usa el túnel: **https://demo.savagesoftware.dev** (producción)
- **Acepta el certificado auto-firmado** si usas localhost
- SPC funciona completamente aquí

### 3. Flujo de prueba

1. **Registra una cuenta**: 
   - Usuario: `demo` 
   - Contraseña: `123456`

2. **Configura una passkey**:
   - Ve a la página de Passkeys
   - Haz clic en "Registrar nueva passkey"
   - Usa tu biometría cuando te lo pida

3. **Prueba SPC** (solo en HTTPS):
   - Ve a la página de Pagos
   - Haz clic en "Pagar con Secure Payment Confirmation"
   - ¡Deberías ver la UI nativa de SPC!

## 🔄 Cambio automático HTTP → HTTPS

Si intentas usar SPC desde HTTP, la aplicación:
1. Te mostrará un mensaje explicando que necesitas HTTPS
2. Te dará un botón para cambiar automáticamente
3. Te redirigirá a la versión HTTPS

## 🌐 Configuración del dominio

El proyecto está configurado para `demo.savagesoftware.dev`. Si necesitas cambiar el dominio:
1. Modifica `rpID` en `server/index.js`
2. Ejecuta `npm run generate-certs`
3. Reinicia con `npm start`

## 🔧 Si SPC no funciona

### Habilita las banderas experimentales:

1. Ve a `chrome://flags/`
2. Busca "Secure Payment Confirmation"
3. Habilítalo
4. Reinicia Chrome

### También verifica:

- ✅ Estás usando **HTTPS** (https://localhost:3443)
- ✅ Tienes una **passkey registrada**
- ✅ Tu dispositivo tiene **autenticación biométrica**
- ✅ Has **aceptado el certificado** auto-firmado

## 🎉 ¿Qué deberías ver?

### En HTTP (http://localhost:3000):
- ✅ Registro de usuarios
- ✅ Login con contraseña
- ✅ Registro de passkeys
- ✅ Login con passkeys
- ❌ SPC (te sugiere cambiar a HTTPS)

### En HTTPS (https://localhost:3443):
- ✅ Todas las funciones anteriores
- ✅ **SPC completamente funcional**:
  - Ventana nativa del navegador
  - Detalles del pago
  - Información del comercio
  - Confirmación biométrica

## 🐛 Problemas comunes

| Problema | Solución |
|----------|----------|
| "SPC requiere HTTPS" | Usa https://localhost:3443 |
| Error de certificado | Acepta el certificado auto-firmado |
| "SPC no está soportado" | Habilita las banderas en `chrome://flags/` |
| "PaymentRequest no disponible" | Usa Chrome/Edge 95+ |
| "No hay passkeys" | Registra una passkey primero |
| Sesiones no sincronizadas | Las sesiones se comparten entre HTTP y HTTPS |

## 💡 Consejos

- **Desarrollo general**: Usa HTTP (más rápido, sin certificados)
- **Pruebas de SPC**: Usa HTTPS (requerido por la especificación)
- **Cambio fácil**: Los datos se comparten entre ambas versiones
- **Redirección inteligente**: La app te guía automáticamente

## 📚 Más información

- **Especificación W3C**: https://www.w3.org/TR/secure-payment-confirmation/
- **Chrome Status**: https://chromestatus.com/feature/5165040614768640
- **SimpleWebAuthn**: https://simplewebauthn.dev/

---

💡 **Tip**: Puedes desarrollar en HTTP y cambiar a HTTPS solo cuando quieras probar SPC específicamente. 
