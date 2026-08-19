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
  numeroCuenta: { type: String, unique: true },
  tarjetaVirtual: {
    numero: String,
    cvv: String,
    nombreTitular: String,
    fechaExpedicion: Date,
    fechaVencimiento: Date,
    ultimosDigitos: String
  },
  rol: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  createdAt: { type: Date, default: Date.now }
});

const transaccionSchema = new mongoose.Schema({
  emisorId: mongoose.Schema.Types.ObjectId,
  emisor: { nombre: String, numeroCuenta: String },
  receptorNumeroCuenta: String,
  receptorNombre: String,
  monto: Number,
  descripcion: String,
  estado: { type: String, enum: ['pendiente', 'completada'], default: 'pendiente' },
  createdAt: { type: Date, default: Date.now }
});

const aclaracionSchema = new mongoose.Schema({
  transaccionId: mongoose.Schema.Types.ObjectId,
  clienteId: mongoose.Schema.Types.ObjectId,
  clienteNombre: String,
  descripcion: String,
  estado: { type: String, enum: ['pendiente', 'revisado'], default: 'pendiente' },
  createdAt: { type: Date, default: Date.now }
});

const configuracionSchema = new mongoose.Schema({
  telefonoSoporte: { type: String, default: '01-800-000-0000' }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
const Transaccion = mongoose.model('Transaccion', transaccionSchema);
const Aclaracion = mongoose.model('Aclaracion', aclaracionSchema);
const Configuracion = mongoose.model('Configuracion', configuracionSchema);

// ===== FUNCIONES HELPERS =====
function generarNumeroCuenta() {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
}

function generarTarjetaVirtual(nombre) {
  const parte1 = '4532';
  const parte2 = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const parte3 = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const numeroCompleto = parte1 + parte2 + parte3;

  const cvv = Math.floor(Math.random() * 900) + 100;
  const fechaExpedicion = new Date();
  const fechaVencimiento = new Date(fechaExpedicion);
  fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 5);

  return {
    numero: numeroCompleto,
    cvv: cvv.toString(),
    nombreTitular: nombre.toUpperCase(),
    fechaExpedicion: fechaExpedicion,
    fechaVencimiento: fechaVencimiento,
    ultimosDigitos: numeroCompleto.slice(-4)
  };
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
    res.json({
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        saldo: usuario.saldo,
        numeroCuenta: usuario.numeroCuenta,
        tarjetaVirtual: usuario.tarjetaVirtual,
        rol: usuario.rol,
        createdAt: usuario.createdAt
      }
    });
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

app.get('/api/mis-transacciones', middleware, async (req, res) => {
  try {
    const transacciones = await Transaccion.find({ emisorId: req.userId }).sort({ createdAt: -1 });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transferencia', middleware, async (req, res) => {
  try {
    const { receptorNumeroCuenta, monto, descripcion } = req.body;
    const emisor = await Usuario.findById(req.userId);

    if (emisor.saldo < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const receptor = await Usuario.findOne({ numeroCuenta: receptorNumeroCuenta });
    const receptorNombre = receptor ? receptor.nombre : 'Cuenta Externa';

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

    emisor.saldo -= monto;
    await emisor.save();

    if (receptor) {
      receptor.saldo += monto;
      await receptor.save();
    }

    res.json({ success: true, transaccion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CONFIGURACIÓN =====
app.get('/api/configuracion', middleware, async (req, res) => {
  try {
    let config = await Configuracion.findOne();
    if (!config) {
      config = await Configuracion.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/configuracion', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const { telefonoSoporte } = req.body;
    let config = await Configuracion.findOne();
    if (!config) {
      config = await Configuracion.create({ telefonoSoporte });
    } else {
      config.telefonoSoporte = telefonoSoporte;
      await config.save();
    }
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ACLARACIONES =====
app.post('/api/aclaracion', middleware, async (req, res) => {
  try {
    const { transaccionId, descripcion } = req.body;
    const usuario = await Usuario.findById(req.userId);

    const aclaracion = new Aclaracion({
      transaccionId,
      clienteId: req.userId,
      clienteNombre: usuario.nombre,
      descripcion
    });

    await aclaracion.save();
    res.json({ success: true, aclaracion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/aclaraciones', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const aclaraciones = await Aclaracion.find().sort({ createdAt: -1 });
    res.json(aclaraciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/aclaraciones/:id', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const aclaracion = await Aclaracion.findById(req.params.id);
    if (!aclaracion) return res.status(404).json({ error: 'No encontrada' });
    aclaracion.estado = 'revisado';
    await aclaracion.save();
    res.json({ success: true, aclaracion });
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
    const tarjetaVirtual = generarTarjetaVirtual(nombre);

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
    res.json({
      success: true,
      usuario: {
        _id: usuario._id,
        nombre,
        email,
        saldo: usuario.saldo,
        numeroCuenta,
        tarjetaVirtual
      }
    });
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

app.put('/api/admin/clientes/:id/numeroCuenta', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { nuevoCuenta } = req.body;
    const cliente = await Usuario.findById(req.params.id);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const existente = await Usuario.findOne({ numeroCuenta: nuevoCuenta });
    if (existente && existente._id.toString() !== req.params.id) {
      return res.status(400).json({ error: 'Número de cuenta ya existe' });
    }

    cliente.numeroCuenta = nuevoCuenta;
    await cliente.save();

    res.json({ success: true, cliente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/clientes/:id', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { nombre, email, saldo } = req.body;
    const cliente = await Usuario.findById(req.params.id);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (nombre) cliente.nombre = nombre;
    if (email && email !== cliente.email) {
      const emailExiste = await Usuario.findOne({ email });
      if (emailExiste) return res.status(400).json({ error: 'Email ya existe' });
      cliente.email = email;
    }
    if (saldo !== undefined) cliente.saldo = saldo;

    await cliente.save();

    res.json({ success: true, cliente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/clientes/:id', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const cliente = await Usuario.findByIdAndDelete(req.params.id);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/deposito', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { clienteId, monto, descripcion } = req.body;
    const cliente = await Usuario.findById(clienteId);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    cliente.saldo += monto;
    await cliente.save();

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

app.post('/api/admin/transferencia', middleware, async (req, res) => {
  try {
    if (req.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { emisorId, receptorId, monto, descripcion } = req.body;
    const emisor = await Usuario.findById(emisorId);
    const receptor = await Usuario.findById(receptorId);

    if (!emisor || !receptor) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (emisor.saldo < monto) return res.status(400).json({ error: 'Saldo insuficiente' });

    emisor.saldo -= monto;
    receptor.saldo += monto;
    await emisor.save();
    await receptor.save();

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
      tarjetaVirtual: {
        numero: '4532000000000000',
        cvv: '000',
        nombreTitular: 'ADMINISTRADOR',
        fechaExpedicion: new Date(),
        fechaVencimiento: new Date(new Date().getFullYear() + 5, new Date().getMonth(), new Date().getDate()),
        ultimosDigitos: '0000'
      },
      rol: 'admin'
    });
    console.log('✅ Admin creado');
  }
}

crearAdminPorDefecto();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));