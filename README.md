# 🏦 Banbajío - Sistema Bancario Digital

Una aplicación bancaria completa con panel de administrador, gestión de clientes y transferencias simuladas.

## ✨ Características

- ✅ **Autenticación segura** con JWT
- ✅ **Contraseñas encriptadas** con bcryptjs
- ✅ **Panel de Admin** para crear clientes y gestionar cuentas
- ✅ **Dashboard de Cliente** con transferencias
- ✅ **Historial de transacciones** completo
- ✅ **Base de datos MongoDB** persistente
- ✅ **API REST** documentada
- ✅ **Interfaz móvil** responsive
- ✅ **Logo profesional** de Banbajío

---

## 🚀 Instalación Local

### Requisitos Previos
- Node.js (v18 o superior)
- MongoDB instalado localmente O MongoDB Atlas (recomendado)
- npm o yarn

### Pasos:

1. **Clonar o descargar el proyecto**
```bash
git clone <tu-repo>
cd banbajio
```

2. **Instalar dependencias backend**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
MONGODB_URI=mongodb://localhost:27017/banbajio
JWT_SECRET=tu_secreto_super_seguro_2024
PORT=5000
```

4. **Iniciar servidor backend**
```bash
npm start
# Para desarrollo con auto-reload:
npm run dev
```

5. **Instalar dependencias frontend** (en otra terminal)
```bash
cd frontend
npm install
```

6. **Configurar URL del API** (frontend/.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

7. **Iniciar frontend**
```bash
npm start
```

8. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🔐 Credenciales de Demo

**Admin por defecto:**
- 📧 Email: `admin@banbajio.com`
- 🔑 Contraseña: `Admin123!`

---

## 📱 Estructura del Proyecto

```
banbajio/
├── server.js                 # Backend Express + MongoDB
├── package.json              # Dependencias
├── .env.example              # Variables de entorno
├── Dockerfile                # Para Railway
└── frontend/
    ├── src/
    │   └── App.jsx          # Componente principal React
    ├── package.json         # Dependencias frontend
    └── .env.example         # Variables frontend
```

---

## 🚀 Deployment en Railway

Railway es la forma más fácil de desplegar esta app. Aquí te mostramos cómo:

### Paso 1: Preparar el repositorio Git

```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "Initial commit - Banbajío"

# Crear repo en GitHub y pushear
git push -u origin main
```

### Paso 2: Crear cuenta en Railway
1. Ir a [railway.app](https://railway.app)
2. Registrarse con GitHub
3. Conectar tu repositorio

### Paso 3: Configurar Backend en Railway

1. **Crear nuevo proyecto** → "Deploy from GitHub"
2. **Seleccionar tu repositorio**
3. **Agregar variable de entorno:**
   - `MONGODB_URI`: Tu URI de MongoDB Atlas
   - `JWT_SECRET`: Tu secreto JWT seguro
   - `PORT`: 5000 (Railway lo configura automáticamente)

4. **Railway detectará automáticamente Node.js**

5. **Obtener URL del backend:**
   - En Railway, tu app tendrá una URL como: `https://banbajio-prod.up.railway.app`

### Paso 4: Configurar Frontend en Railway

**Opción A: Frontend en Railway (recomendado)**

1. **Crear nuevo servicio en el mismo proyecto**
2. **Conectar repositorio (rama frontend/)**
3. **Agregar variables:**
   ```
   REACT_APP_API_URL=https://banbajio-prod.up.railway.app/api
   CI=false
   ```

4. **Build command:** `npm run build`
5. **Start command:** `npm start`

**Opción B: Frontend en Vercel o Netlify**

1. Conectar repositorio a [Vercel](https://vercel.com) o [Netlify](https://netlify.com)
2. Agregar variable: `REACT_APP_API_URL=https://tu-backend.up.railway.app/api`
3. Deploy automático

### Paso 5: Configurar MongoDB Atlas

1. Ir a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cuenta y cluster gratuito
3. Obtener connection string
4. Agregar a Railway como `MONGODB_URI`

---

## 🔧 API Endpoints

### Autenticación
```
POST /api/auth/login
Body: { email, contraseña }
Response: { token, usuario }
```

### Admin - Gestión de Clientes
```
POST /api/admin/clientes
GET /api/admin/clientes
PUT /api/admin/clientes/:id/saldo
PUT /api/admin/clientes/:id/desactivar
```

### Admin - Transacciones
```
GET /api/admin/transacciones
GET /api/admin/stats
```

### Cliente - Transferencias
```
POST /api/transferencia
GET /api/mis-transacciones
GET /api/usuarios
GET /api/perfil
```

---

## 🔐 Seguridad Implementada

- ✅ **JWT (JSON Web Tokens)** para autenticación
- ✅ **Bcrypt** para hash de contraseñas (10 rounds)
- ✅ **CORS** configurado
- ✅ **Validaciones** en servidor y cliente
- ✅ **Contraseñas nunca en respuesta**
- ✅ **Límites de transferencia** ($10,000 máximo)
- ✅ **Verificación de fondos** antes de transferencia
- ✅ **Tokens con expiración** (24 horas)

---

## 📊 Variables de Entorno Importantes

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/banbajio
JWT_SECRET=algo_super_seguro_y_largo_2024
PORT=5000
NODE_ENV=production
```

### Frontend (.env)
```
REACT_APP_API_URL=https://tu-backend-railway.app/api
```

---

## 🐛 Solución de Problemas

### "Error conectando a MongoDB"
- Verificar connection string
- Agregar IP a whitelist en MongoDB Atlas
- Asegurar variables de entorno configuradas

### "CORS Error"
- Verificar que REACT_APP_API_URL sea correcto
- Asegurar que backend tiene CORS habilitado

### "Token expirado"
- Los tokens expiran en 24 horas
- Usuario debe hacer login nuevamente
- Implementar refresh tokens si se requiere

---

## 💡 Próximas Mejoras

- [ ] Refresh tokens de larga duración
- [ ] Verificación de email de 2FA
- [ ] Historial de login
- [ ] Reportes descargables
- [ ] API de integración con bancos reales
- [ ] App móvil nativa
- [ ] Sistema de notificaciones
- [ ] Auditoría completa

---

## 📝 Licencia

Este proyecto es de demostración. Personalízalo según tus necesidades.

---

## 🎯 Notas Importantes

1. **Cambiar contraseña de admin** una vez en producción
2. **Usar JWT_SECRET fuerte** en producción
3. **Nunca commitear .env** con credenciales reales
4. **Usar HTTPS** en todas las conexiones
5. **Configurar limites de rate** en API para producción

---

## 📞 Soporte

¿Problemas? Revisa los logs en Railway o contacta al desarrollador.

**¡Listo para vender! 🚀**
