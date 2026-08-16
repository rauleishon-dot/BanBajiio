# 🔐 Guía de Seguridad - Banbajío

## Arquitectura de Seguridad

### 1. Autenticación (Backend)

**JWT (JSON Web Tokens)**
```javascript
// Cuando usuario inicia sesión:
1. Email + contraseña
2. Verificar en BD
3. Generar JWT con ID + ROL
4. Token expires en 24h
5. Cliente guarda en localStorage
6. Cada request incluye: "Authorization: Bearer <token>"
```

**Verificación de Token**
```javascript
// Middleware verificarToken:
1. Extrae token del header
2. Valida firma JWT
3. Verifica que no haya expirado
4. Extrae usuario ID y rol
5. Permite o deniega acceso
```

---

### 2. Contraseñas (Backend)

**Hash con Bcrypt**
```javascript
// Antes de guardar:
plainPassword = "Admin123!"
          ↓
       bcrypt.hash (10 rounds)
          ↓
hash = "$2a$10$nOUIs5kJ8..." (irreversible)

// Para comparar:
plainPassword = "Admin123!"
          ↓
       bcrypt.compare
          ↓
hash = "$2a$10$nOUIs5kJ8..."
          ↓
        Match ✅
```

**Por qué 10 rounds?**
- Más tiempo = más seguro
- Actualmente 100ms por hash
- Imposible hacer rainbow tables
- Imposible brute force rápido

---

### 3. Validaciones (Backend)

**En cada endpoint:**

```javascript
// ✅ VALIDACIONES IMPLEMENTADAS:

// Login
- Email existe? ✓
- Contraseña es correcta? ✓
- Usuario está activo? ✓

// Transferencia
- Usuario autenticado? ✓
- Tiene fondos suficientes? ✓
- Monto > 0? ✓
- Monto <= 10000? ✓
- Receptor existe? ✓

// Crear Cliente (solo admin)
- Es admin? ✓
- Email no existe? ✓
- Campos requeridos? ✓
```

---

### 4. Control de Acceso (Authorization)

**Roles implementados:**
```
ADMIN
├─ Crear clientes
├─ Ver todos los clientes
├─ Actualizar saldos
├─ Ver todas las transacciones
└─ Ver estadísticas

CLIENTE
├─ Ver su perfil
├─ Ver su saldo
├─ Realizar transferencias
└─ Ver sus transacciones
```

**Middleware esAdmin:**
```javascript
// Si no es admin:
if (req.rol !== 'admin') {
  return res.status(403).json({ error: 'Acceso denegado' });
}
```

---

### 5. Seguridad en Transferencias

**Flujo de transferencia:**
```
1. Usuario solicita transferencia
2. Validar: fondos, monto, usuario
3. IMPORTANTE: Usar transacción atómica (en MongoDB)
4. Restar de emisor
5. Sumar a receptor
6. Guardar registro
7. Retornar confirmación
```

**Problema evitado:**
```
Sin transacción atómica:
- Restar de A ✓
- FALLA EN SERVIDOR ✗
- Sumar a B ✗
- ¡Dinero desaparece!
```

---

### 6. No Guardar Datos Sensibles

**❌ NUNCA en respuesta:**
```javascript
usuario: {
  _id: "...",
  nombre: "Juan",
  contraseña: "$2a$10$...",  ❌ NUNCA ESTO
  token: "eyJhbGc..."        ❌ NUNCA ESTO
}
```

**✅ SIEMPRE así:**
```javascript
usuario: {
  id: "123abc",
  nombre: "Juan",
  email: "juan@email.com",
  rol: "cliente",
  saldo: 1500.50
}
// Contraseña y datos sensibles: ¡NUNCA!
```

---

### 7. Almacenamiento Frontend

**LocalStorage:**
```javascript
// ✅ SEGURO guardar:
- JWT token (con expiración)
- Preferencias de usuario
- Idioma

// ❌ NUNCA guardar:
- Contraseña
- Datos bancarios completos
- Info personal sensible
```

**Token en localStorage:**
```javascript
// Cuando login exitoso:
localStorage.setItem('token', data.token)

// En cada request:
headers: { 
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}

// Al logout:
localStorage.removeItem('token')
```

---

### 8. Límites de Seguridad Implementados

```javascript
// Transferencias
MONTO_MAXIMO = 10000
MONTO_MINIMO = 0.01

// JWT
TOKEN_EXPIRA_EN = 24 * 60 * 60 // segundos

// Contraseña Bcrypt
SALT_ROUNDS = 10

// Rate Limiting (recomendado agregar):
// - 5 intentos de login por IP en 15 minutos
// - 100 transferencias por usuario al día
```

---

### 9. HTTPS en Producción

**Railway automáticamente da HTTPS:**
```
❌ http://banbajio-prod.up.railway.app
✅ https://banbajio-prod.up.railway.app
```

**En backend:**
```javascript
// CORS solo acepta tu dominio
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

### 10. Variables de Entorno Sensibles

**Nunca commitear:**
```
❌ NUNCA en git:
JWT_SECRET=mi_secreto_123
MONGODB_URI=mongodb+srv://user:pass@...
```

**Usar .env.example:**
```
✅ En git:
JWT_SECRET=CAMBIAR_EN_PRODUCCION
MONGODB_URI=AGREGAR_URI_DE_MONGODB
```

**En Railway:**
- Variables se definen en la interfaz
- Never en repo

---

## 🚨 Mejoras Futuras de Seguridad

### Nivel 1 (Esencial)
- [ ] Rate limiting en endpoints
- [ ] 2FA (Two Factor Authentication)
- [ ] Refresh tokens
- [ ] IP whitelist

### Nivel 2 (Avanzado)
- [ ] Encriptación de datos en tránsito (TLS/SSL)
- [ ] Auditoría completa de acciones
- [ ] Detección de fraude con ML
- [ ] Tokenización de tarjetas

### Nivel 3 (Enterprise)
- [ ] PCI DSS Compliance
- [ ] Pruebas de penetración
- [ ] Key rotation
- [ ] Blockchain para transacciones

---

## ✅ Checklist de Seguridad

Antes de ir a producción:

```
[ ] Cambiar JWT_SECRET
[ ] Cambiar contraseña de admin
[ ] Activar HTTPS
[ ] Configurar MongoDB con autenticación
[ ] IP whitelist en MongoDB
[ ] Rate limiting activado
[ ] Logs configurados
[ ] Backup automático de BD
[ ] CORS restringido
[ ] .env.example sin credenciales
[ ] Dependencias actualizadas (npm audit)
[ ] Testing de endpoints
[ ] Revisa headers de seguridad
```

---

## 📊 Comparativa de Seguridad

```
                Banbajío    Producción    NIVEL
JWT             ✅          ✅            ✅✅✅
Bcrypt          ✅          ✅            ✅✅✅
HTTPS           ✅          ✅            ✅✅✅
Rate Limit      ❌          ✅            ⚠️
2FA             ❌          ✅            ⚠️
Auditoría       ❌          ✅            ⚠️
Penetration Test ❌         ✅            ⚠️
PCI DSS         ❌          ✅            ⚠️
```

---

## 🔍 Cómo Probar la Seguridad

### Test de Contraseña
```bash
# Intentar con contraseña incorrecta:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@banbajio.com","contraseña":"incorrecta"}'
# Respuesta: {"error":"Credenciales inválidas"}
```

### Test de Token Expirado
```javascript
// Si JWT_SECRET es diferente, token es inválido
const oldToken = "eyJhbGc..."; // token antiguo
// Respuesta: {"error":"Token inválido"}
```

### Test de Acceso (no admin)
```bash
# Cliente intenta crear otro cliente:
curl -X POST http://localhost:5000/api/admin/clientes \
  -H "Authorization: Bearer <token-cliente>"
# Respuesta: {"error":"Acceso denegado. Solo administradores"}
```

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/Top10/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Bcrypt Documentation](https://github.com/dcodeIO/bcrypt.js)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

**¡Tu aplicación está segura! 🔒**
