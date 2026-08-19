const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/banbajio';
mongoose.connect(mongoUri).then(() => console.log('✅ MongoDB conectado')).catch(err => console.error('❌ Error MongoDB:', err));

// ===== SCHEMAS =====
const usuarioSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  contraseña: String,
  saldo: { type: Number, default: 0 },
  numeroCuenta: { type: String, unique: true }, // Ej: 1234567890
  tarjetaVirtual: String, // Ej: 4532****1234
  rol: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  createdAt: { type: Date, default: Date.now }
});

const transaccionSchema = new mongoose.Schema({
  emisorId: mongoose.Schema.Types.ObjectId,
  emisor: { nombre: String, numeroCuenta: String },
  receptorNumeroCuenta: String, // Número de cuenta (puede no estar registrado)
  receptorNombre: String,
  monto: Number,
  descripcion: String,
  estado: { type: String, enum: ['pendiente', 'completada'], default: 'pendiente' },
  createdAt: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
const Transaccion = mongoose.model('Transaccion', transaccionSchema);

// ===== FUNCIONES HELPERS =====
function generarNumeroCuenta() {
  return Math.floor(Math.random() * 9000000000) + 1000000000; // 10 dígitos
}

function generarTarjetaVirtual() {
  const ultimosDigitos = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `4532****${ultimosDigitos}`;
}

function generarToken(usuario) {
  return jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET || 'secreto_banbajio', { expiresIn: '7d' });
}

function middleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_banbajio');
    req.userId = decoded.id;
    req.rol = decoded.rol;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ===== RUTAS PÚBLICAS =====
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario || !await bcrypt.compare(contraseña, usuario.contraseña)) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    const token = generarToken(usuario);
    res.json({ token, usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, saldo: usuario.saldo, numeroCuenta: usuario.numeroCuenta, tarjetaVirtual: usuario.tarjetaVirtual, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RUTAS PROTEGIDAS =====
app.get('/api/perfil', middleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.userId).select('-contraseña');
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CLIENTE: Ver mis transacciones
app.get('/api/mis-transacciones', middleware, async (req, res) => {
  try {
    const transacciones = await Transaccion.find({ emisorId: req.userId }).sort({ createdAt: -1 });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CLIENTE: Transferencia a número de cuenta (sin registro previo)
app.post('/api/transferencia', middleware, async (req, res) => {
  try {
    const { receptorNumeroCuenta, monto, descripcion } = req.body;
    const emisor = await Usuario.findById(req.userId);

    if (emisor.saldo < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Buscar si el número de cuenta existe
    const receptor = await Usuario.findOne({ numeroCuenta: receptorNumeroCuenta });
    const receptorNombre = receptor ? receptor.nombre : 'Cuenta Externa';

    // Crear transacción pendiente
    const transaccion = new Transaccion({
      emisorId: req.userId,
      emisor: { nombre: emisor.nombre, numeroCuenta: emisor.numeroCuenta },
      receptorNumeroCuenta,
      receptorNombre,
      monto,
      descripcion: descripcion || '',
      estado: 'pendiente'
    });

    await transaccion.save();

    // Restar del emisor
    emisor.saldo -= monto;
    await emisor.save();

    // Si el receptor existe, sumar
    if (receptor) {
      receptor.saldo += monto;
      await receptor.save();
    }

    res.json({ success: true, transaccion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RUTAS ADMIN =====
app.post('/api/admin/clientes', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { nombre, email, contraseña, saldoInicial } = req.body;
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const numeroCuenta = generarNumeroCuenta().toString();
    const tarjetaVirtual = generarTarjetaVirtual();

    const usuario = new Usuario({
      nombre,
      email,
      contraseña: hashedPassword,
      saldo: saldoInicial || 0,
      numeroCuenta,
      tarjetaVirtual,
      rol: 'cliente'
    });

    await usuario.save();
    res.json({ success: true, usuario: { _id: usuario._id, nombre, email, saldo: usuario.saldo, numeroCuenta, tarjetaVirtual } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/clientes', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const clientes = await Usuario.find({ rol: 'cliente' }).select('-contraseña');
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Depositar dinero en cliente
app.post('/api/admin/deposito', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { clienteId, monto, descripcion } = req.body;
    const cliente = await Usuario.findById(clienteId);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    cliente.saldo += monto;
    await cliente.save();

    // Registrar como transacción
    const transaccion = new Transaccion({
      emisorId: null,
      emisor: { nombre: 'Depósito Admin', numeroCuenta: 'ADMIN' },
      receptorNumeroCuenta: cliente.numeroCuenta,
      receptorNombre: cliente.nombre,
      monto,
      descripcion: descripcion || 'Depósito del administrador',
      estado: 'completada'
    });

    await transaccion.save();

    res.json({ success: true, cliente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Hacer transferencia entre clientes
app.post('/api/admin/transferencia', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { emisorId, receptorId, monto, descripcion } = req.body;
    const emisor = await Usuario.findById(emisorId);
    const receptor = await Usuario.findById(receptorId);

    if (!emisor || !receptor) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (emisor.saldo < monto) return res.status(400).json({ error: 'Saldo insuficiente' });

    // Restar y sumar
    emisor.saldo -= monto;
    receptor.saldo += monto;
    await emisor.save();
    await receptor.save();

    // Registrar transacción
    const transaccion = new Transaccion({
      emisorId,
      emisor: { nombre: emisor.nombre, numeroCuenta: emisor.numeroCuenta },
      receptorNumeroCuenta: receptor.numeroCuenta,
      receptorNombre: receptor.nombre,
      monto,
      descripcion: descripcion || 'Transferencia del administrador',
      estado: 'completada'
    });

    await transaccion.save();

    res.json({ success: true, transaccion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Ver todas las transacciones
app.get('/api/admin/transacciones', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const transacciones = await Transaccion.find().sort({ createdAt: -1 });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN POR DEFECTO =====
async function crearAdminPorDefecto() {
  const adminExiste = await Usuario.findOne({ email: 'admin@banbajio.com' });
  if (!adminExiste) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@banbajio.com',
      contraseña: hashedPassword,
      saldo: 0,
      numeroCuenta: '0000000000',
      tarjetaVirtual: '0000****0000',
      rol: 'admin'
    });
    console.log('✅ Admin creado');
  }
}

crearAdminPorDefecto();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));