# 🚀 Guía Completa: Desplegar Banbajío en Railway

Railway es la plataforma más simple para desplegar esta aplicación. Sigue esta guía paso a paso.

---

## 📋 Requisitos Previos

1. Tener el código en un repositorio de **GitHub**
2. Cuenta en **Railway.app** (gratis con GitHub)
3. Cuenta en **MongoDB Atlas** (gratis)
4. 15 minutos de tu tiempo

---

## PASO 1: Preparar tu Repositorio en GitHub

### 1.1 Crear repositorio

```bash
# En tu carpeta del proyecto:
git init
git add .
git commit -m "Banbajio - Sistema Bancario Seguro"

# En GitHub: Crear repo nuevo llamado "banbajio"

git remote add origin https://github.com/TU_USUARIO/banbajio.git
git branch -M main
git push -u origin main
```

### 1.2 Estructura correcta del repo

```
banbajio/
├── server.js                    # Backend principal
├── package.json                 # Dependencias backend
├── .env.example                 # Ejemplo de variables
├── Dockerfile                   # Docker para Railway
├── README.md                    # Documentación
├── SEGURIDAD.md                 # Info de seguridad
└── frontend/                    # (Opcional, ver Paso 3B)
    ├── src/
    │   ├── App.jsx
    │   └── index.js
    └── package.json
```

### 1.3 Asegurar .gitignore

```bash
# En archivo .gitignore (no commitear):
node_modules/
.env
.env.local
.DS_Store
dist/
build/
```

---

## PASO 2: Configurar MongoDB Atlas (Base de Datos)

### 2.1 Crear cuenta en MongoDB Atlas

1. Ir a [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Click en **"Try Free"**
3. Registrarse con Google o crear cuenta
4. Verificar email

### 2.2 Crear Cluster Gratuito

1. Click en **"Create a Deployment"**
2. Seleccionar **"Free"** (M0 Sandbox)
3. Proveedor: **AWS**
4. Región: Elige la más cercana (ej: us-east-1)
5. Cluster name: `banbajio-cluster`
6. Click **"Create Cluster"** (esperar 3-5 minutos)

### 2.3 Configurar Seguridad

**Crear usuario de base de datos:**
1. En sidebar: **"Security" → "Database Access"**
2. Click **"+ Add New Database User"**
3. Nombre: `banbajio_user`
4. Contraseña: Algo seguro (ej: `B@njio2024!Secure`)
5. Click **"Add User"**

**Permitir acceso desde cualquier IP:**
1. En sidebar: **"Security" → "Network Access"**
2. Click **"+ Add IP Address"**
3. Seleccionar **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Confirmar (para Railway es necesario)

### 2.4 Obtener Connection String

1. En sidebar: **"Database" → "Clusters"**
2. Click en tu cluster **"Connect"**
3. Seleccionar **"Drivers"** (Node.js)
4. Copiar connection string:

```
mongodb+srv://banbajio_user:PASSWORD@banbajio-cluster.mongodb.net/banbajio?retryWrites=true&w=majority
```

5. **Reemplazar:**
   - `PASSWORD` por tu contraseña real
   - Resultado: `mongodb+srv://banbajio_user:B@njio2024!Secure@banbajio-cluster.mongodb.net/banbajio?retryWrites=true&w=majority`

**¡GUARDA ESTA URI! La necesitarás pronto.**

---

## PASO 3: Desplegar Backend en Railway

### 3.1 Conectar Railway a GitHub

1. Ir a [railway.app](https://railway.app)
2. Click **"Login with GitHub"**
3. Autorizar Railway a acceder a tus repos
4. Después de login, click **"+ New Project"**

### 3.2 Crear Proyecto

1. Seleccionar **"Deploy from GitHub repo"**
2. Seleccionar tu repositorio `banbajio`
3. Railway detectará automáticamente **Node.js**

### 3.3 Configurar Variables de Entorno

1. En Railway, haz click en tu aplicación
2. Tab: **"Variables"**
3. Agregar las siguientes variables:

| Clave | Valor |
|-------|-------|
| `MONGODB_URI` | `mongodb+srv://banbajio_user:B@njio2024!Secure@banbajio-cluster.mongodb.net/banbajio?retryWrites=true&w=majority` |
| `JWT_SECRET` | `tu_secreto_muy_seguro_2024_aqui_ponemos_algo_largo` |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |

**Importante:** Cambiar los valores por los reales.

### 3.4 Deploy Automático

1. Ir a tab **"Deployments"**
2. Railway automáticamente iniciará el build
3. Esperar a que diga **"Deployment Successful ✅"**
4. Verás un enlace como: `https://banbajio-prod.railway.app`

### 3.5 Verificar que Backend está corriendo

Abre en tu navegador:
```
https://banbajio-prod.railway.app/api/auth/login
```

Deberías ver un error 405 (POST not allowed) o similar, pero **sin error de conexión**. ✅

---

## PASO 4A: Desplegar Frontend en Railway (Opción Recomendada)

### 4A.1 Preparar Frontend

Tu carpeta `frontend/` debe tener:

```
frontend/
├── src/
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── public/
│   └── index.html
├── package.json
└── .env.example
```

**Contenido de frontend/package.json:**
```json
{
  "name": "banbajio-frontend",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "lucide-react": "^0.263.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": ["last 2 versions", "not dead"]
}
```

### 4A.2 Crear archivo .env en frontend

```
REACT_APP_API_URL=https://banbajio-prod.railway.app/api
```

**Cambiar `banbajio-prod` por el nombre real de tu backend en Railway.**

### 4A.3 Commitear y Pushear

```bash
git add .
git commit -m "Agregar frontend y env"
git push origin main
```

### 4A.4 Desplegar Frontend

En Railway:

1. **+ New Service** → **"Deploy from GitHub repo"**
2. Seleccionar el mismo repo
3. Cambiar **Root Directory** a `frontend/`
4. Configurar variables:

| Clave | Valor |
|-------|-------|
| `REACT_APP_API_URL` | `https://banbajio-prod.railway.app/api` |
| `CI` | `false` |

5. Build Command: `npm run build`
6. Start Command: `npm start` (o deixar por defecto)

7. Esperar deploy ✅

Tu frontend estará en: `https://banbajio-frontend.railway.app`

---

## PASO 4B: Desplegar Frontend en Vercel (Alternativa)

Si prefieres usar **Vercel** para el frontend (también gratis):

### 4B.1 Preparar

```bash
cd frontend
npm run build
```

### 4B.2 En Vercel.com

1. Ir a [vercel.com](https://vercel.com)
2. "Import Project" → seleccionar tu repo GitHub
3. Root Directory: `frontend`
4. Agregar variable de entorno:
   ```
   REACT_APP_API_URL=https://tu-backend.railway.app/api
   ```
5. Deploy ✅

---

## PASO 5: Probar la Aplicación

### 5.1 Acceder a tu app

```
Frontend: https://banbajio-frontend.railway.app
Backend: https://banbajio-prod.railway.app
```

### 5.2 Credenciales de Admin por defecto

```
📧 Email: admin@banbajio.com
🔑 Contraseña: Admin123!
```

### 5.3 Probar funciones

1. **Login como Admin**
   - Crear un nuevo cliente
   - Asignar saldo inicial (ej: $5000)

2. **Login como Cliente**
   - Ver saldo
   - Hacer una transferencia a otro cliente

3. **Volver a Admin**
   - Ver lista de clientes actualizada
   - Ver todas las transacciones

---

## 🔧 Monitoreo en Railway

### Ver logs

1. En Railway → tu app → **"Logs"**
2. Verás los console.log y errores en tiempo real

### Ver uso de recursos

1. **"Metrics"**
2. CPU, Memoria, Network

### Reiniciar app

1. **"Deployments"** → **"Redeploy"**

---

## 🆘 Solución de Problemas

### Error: "Cannot connect to MongoDB"

**Causa:** Connection string incorrect o IP no autorizada

**Solución:**
1. Verifica la URI en Railway variables
2. En MongoDB Atlas → Network Access → Verifica 0.0.0.0/0

### Error: "CORS Error" en frontend

**Causa:** CORS no configurado

**Solución:**
En `server.js`, verificar:
```javascript
app.use(cors({
  origin: "*", // Permitir desde cualquier lugar
  credentials: true
}));
```

### Error: "Token inválido"

**Causa:** JWT_SECRET diferente en local vs production

**Solución:**
- En Railway → Variables → Cambiar JWT_SECRET por uno consistente

### Frontend no carga datos

**Causa:** REACT_APP_API_URL incorrect

**Solución:**
- Verificar variable en Railway
- Debe ser: `https://TU_BACKEND.railway.app/api`
- Sin trailing slash

---

## 💰 Costos en Railway

```
Free Tier (incluido):
- 5GB almacenamiento
- 100 horas/mes de ejecución
- Perfect para esta app

Máximo costo: $5-10/mes si necesitas más
```

---

## 📱 URLs Finales

Una vez deployado:

```
📱 Frontend:     https://banbajio-frontend.railway.app
🔗 Backend API:  https://banbajio-prod.railway.app/api
📊 Admin:        https://banbajio-frontend.railway.app (login admin)
👤 Cliente:      https://banbajio-frontend.railway.app (login cliente)
```

---

## ✅ Checklist Final

Antes de considerar "LISTO PARA VENDER":

```
[ ] Backend deployado en Railway
[ ] MongoDB Atlas configurado
[ ] Frontend deployado (Railway o Vercel)
[ ] Variables de entorno correctas
[ ] Admin por defecto puede login
[ ] Admin puede crear clientes
[ ] Clientes pueden hacer transferencias
[ ] Transferencias se guardan en BD
[ ] Saldos se actualizan correctamente
[ ] Cambiar JWT_SECRET y contraseña admin
[ ] Dominios personalizados (opcional)
[ ] Respaldos automáticos configurados
```

---

## 🎯 ¡LISTO PARA VENDER!

Tu app de banca está 100% funcional en la nube, con:
- ✅ Seguridad real (JWT + Bcrypt)
- ✅ Base de datos persistente
- ✅ Panel de admin profesional
- ✅ Transferencias completamente funcionales
- ✅ Escalable y mantenible
- ✅ Hospedado en servidores confiables

**Ahora es cuestión de marketing y vender la plantilla o servicio.**

---

Preguntas? Revisa README.md o SEGURIDAD.md
