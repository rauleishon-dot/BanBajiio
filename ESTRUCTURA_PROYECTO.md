# 📁 Estructura Completa del Proyecto Banbajío

Esta guía te muestra cómo organizar tu proyecto para que funcione perfectamente con Railway.

---

## 🎯 Estructura Final Recomendada

```
banbajio/
│
├── 📄 server.js                  ← Backend Express PRINCIPAL
├── 📄 package.json               ← Dependencias backend
├── 📄 .env.example               ← Variables de ejemplo
├── 📄 Dockerfile                 ← Para Railway
├── 📄 .gitignore                 ← Archivos a ignorar
├── 📄 README.md                  ← Documentación principal
├── 📄 SEGURIDAD.md              ← Info de seguridad
├── 📄 RAILWAY_DEPLOYMENT.md     ← Guía de deployment
│
└── 📁 frontend/                  ← Frontend React
    ├── 📁 src/
    │   ├── 📄 App.jsx            ← Componente principal
    │   ├── 📄 App.css            ← Estilos
    │   ├── 📄 index.js           ← Entry point
    │   └── 📄 index.css          ← Estilos globales
    ├── 📁 public/
    │   ├── 📄 index.html         ← HTML principal
    │   └── favicon.ico
    ├── 📄 package.json           ← Dependencias frontend
    ├── 📄 .env.example
    ├── 📄 .gitignore
    └── 📄 tailwind.config.js     ← Tailwind config (si lo usas)
```

---

## 📋 Archivos Necesarios

### 1. Raíz del Proyecto

#### `server.js` ✅
Backend principal. Ya está creado.

#### `package.json` ✅
```json
{
  "name": "banbajio-backend",
  "version": "1.0.0",
  "description": "Backend bancario seguro",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

#### `.env.example` ✅
Ya creado. Nunca commitear `.env` con valores reales.

#### `Dockerfile` ✅
Ya creado para Railway.

#### `.gitignore`
```
node_modules/
.env
.env.local
.DS_Store
*.log
dist/
build/
.vscode/
.idea/
```

#### `railway.json` (Opcional)
```json
{
  "schema": {
    "PORT": {
      "description": "Port to listen on",
      "default": 5000
    },
    "MONGODB_URI": {
      "description": "MongoDB connection string",
      "required": true
    },
    "JWT_SECRET": {
      "description": "Secret for JWT tokens",
      "required": true
    }
  }
}
```

---

## 💻 Crear Frontend desde Cero

### Opción 1: Con Create React App (Más simple)

```bash
# En la raíz del proyecto:
npx create-react-app frontend

# Ir a la carpeta:
cd frontend

# Instalar dependencias adicionales:
npm install lucide-react axios

# Crear archivo .env.example:
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.example
```

### Opción 2: Con Vite (Más rápido)

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install lucide-react axios
```

---

## 📝 Archivos Frontend

### `frontend/src/App.jsx`

Usa el archivo `App.jsx` que ya proporcioné.

### `frontend/public/index.html`

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1e40af" />
    <meta name="description" content="Banbajío - Tu banco digital de confianza" />
    <title>Banbajío - Banco Digital</title>
  </head>
  <body>
    <noscript>Necesitas habilitar JavaScript para ejecutar esta aplicación.</noscript>
    <div id="root"></div>
  </body>
</html>
```

### `frontend/src/index.js` (Create React App)

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

O para Vite:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### `frontend/src/index.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(to bottom, #1e3a8a, #1e40af);
  min-height: 100vh;
}
```

### `frontend/package.json`

```json
{
  "name": "banbajio-frontend",
  "version": "0.1.0",
  "private": true,
  "proxy": "http://localhost:5000",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "lucide-react": "^0.263.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### `frontend/.env.example`

```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚀 Pasos para Crear el Proyecto

### Paso 1: Inicializar repo

```bash
# Crear carpeta:
mkdir banbajio
cd banbajio

# Inicializar git:
git init
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Crear .gitignore:
cat > .gitignore << EOF
node_modules/
.env
.env.local
.DS_Store
EOF
```

### Paso 2: Agregar backend

```bash
# Copiar server.js aquí (ya lo tienes)
# Copiar package.json aquí (ya lo tienes)
# Copiar .env.example aquí (ya lo tienes)
# Copiar Dockerfile aquí (ya lo tienes)

# Instalar dependencias:
npm install
```

### Paso 3: Crear frontend

**Opción A: Create React App**
```bash
npx create-react-app frontend
cd frontend
npm install lucide-react
```

**Opción B: Vite**
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install lucide-react
```

### Paso 4: Agregar código React

```bash
# Copiar App.jsx al frontend/src/
cp App.jsx frontend/src/

# Crear .env.example en frontend:
echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env.example

# Crear .env para desarrollo:
echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env
```

### Paso 5: Commitear al repo

```bash
git add .
git commit -m "Banbajio - Sistema Bancario Seguro"

# Crear repo en GitHub y hacer push:
git remote add origin https://github.com/TU_USUARIO/banbajio.git
git branch -M main
git push -u origin main
```

---

## 🏃 Ejecutar Localmente

### Terminal 1: Backend

```bash
# En raíz del proyecto:
npm start
# Servidor en http://localhost:5000
```

### Terminal 2: Frontend

```bash
# En carpeta frontend:
cd frontend
npm start
# App en http://localhost:3000
```

---

## 🔗 Variables de Entorno

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/banbajio
JWT_SECRET=secreto_super_seguro_aqui
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## ✅ Validación de Estructura

Verificar que tengas esto antes de pushear a GitHub:

```bash
# Desde raíz del proyecto:

# Backend:
ls -la server.js              ✓
ls -la package.json           ✓
ls -la .env.example           ✓
ls -la Dockerfile             ✓

# Frontend:
ls -la frontend/src/App.jsx   ✓
ls -la frontend/package.json  ✓
ls -la frontend/.env.example  ✓

# Git:
ls -la .gitignore             ✓
git remote -v                 ✓ (debe mostrar origin)
```

---

## 📦 Tamaño Esperado

```
banbajio/
├── node_modules/              ~500MB (no se pushea)
├── frontend/
│   ├── node_modules/         ~800MB (no se pushea)
│   └── src/                  ~50KB ✓
├── server.js                 ~20KB ✓
└── package.json              ~2KB ✓

Total sin node_modules: ~100KB ✓
```

---

## 🎯 Checklist Pre-Deploy

```
[ ] server.js existe y funciona localmente
[ ] Frontend compila sin errores (npm run build)
[ ] .env.example tiene todas las variables necesarias
[ ] .gitignore excluye node_modules
[ ] README.md explica cómo instalar
[ ] Dockerfile existe
[ ] Package.json tiene script "start"
[ ] Git remoto apunta a GitHub correcto
[ ] Todos los archivos en main branch
```

---

## 🚀 Próximo Paso

Una vez tengas esta estructura lista, sigue:
→ [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

¡Listo para subir a la nube! ☁️
