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
  rol: { type: String, enum: ['master', 'admin', 'cliente'], default: 'cliente' },
  esDemo: { type: Boolean, default: false },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, default: null }, // admin/master que creó este cliente
  createdAt: { type: Date, default: Date.now }
});

const transaccionSchema = new mongoose.Schema({
  emisorId: mongoose.Schema.Types.ObjectId,
  emisor: { nombre: String, numeroCuenta: String },
  receptorNumeroCuenta: String,
  receptorNombre: String,
  bancoDestino: { type: String, default: 'Novo Opciones' },
  monto: Number,
  descripcion: String,
  tipo: { type: String, enum: ['transferencia', 'deposito'], default: 'transferencia' },
  // Datos de recibo, solo se usan cuando tipo === 'deposito'
  cuentaOrigenExterna: String,
  sucursal: { type: String, default: '0423' },
  referencia: String,
  saldoAnterior: Number,
  saldoPosterior: Number,
  estado: { type: String, enum: ['pendiente', 'completada', 'declinada'], default: 'pendiente' },
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

function generarDigitos(cantidad) {
  let resultado = '';
  for (let i = 0; i < cantidad; i++) {
    resultado += Math.floor(Math.random() * 10).toString();
  }
  return resultado;
}

// Cambia a "declinada" cualquier transferencia que lleve 1,440 minutos (24 hrs) pendiente.
// Se calcula contra la hora real guardada en la base de datos, así que no depende
// de que el cliente tenga la app abierta.
const MINUTOS_LIMITE_PENDIENTE = 1440;
async function declinarTransferenciasVencidas() {
  const limite = new Date(Date.now() - MINUTOS_LIMITE_PENDIENTE * 60000);
  await Transaccion.updateMany(
    { estado: 'pendiente', tipo: 'transferencia', createdAt: { $lte: limite } },
    { $set: { estado: 'declinada' } }
  );
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

function esAdminOMaster(req) {
  return req.rol === 'admin' || req.rol === 'master';
}

function esMaster(req) {
  return req.rol === 'master';
}

function esDuenoDeCliente(req, cliente) {
  if (esMaster(req)) return true;
  return cliente.creadoPor && cliente.creadoPor.toString() === req.userId;
}

// ===== RUTAS PÚBLICAS =====
const DEMO_SALDO_CLIENTE = 55000;

// Deja la cuenta demo cliente exactamente como el primer día: mismo saldo,
// sin historial de transacciones propio.
async function reiniciarDemoCliente(usuario) {
  await Transaccion.deleteMany({
    $or: [{ emisorId: usuario._id }, { receptorNumeroCuenta: usuario.numeroCuenta }]
  });
  usuario.saldo = DEMO_SALDO_CLIENTE;
  await usuario.save();

  await Transaccion.create({
    emisorId: null,
    emisor: { nombre: 'Depósito Inicial', numeroCuenta: generarDigitos(16) },
    receptorNumeroCuenta: usuario.numeroCuenta,
    receptorNombre: usuario.nombre,
    monto: DEMO_SALDO_CLIENTE,
    descripcion: 'Depósito inicial de apertura de cuenta',
    tipo: 'deposito',
    cuentaOrigenExterna: generarDigitos(16),
    sucursal: '0423',
    referencia: generarDigitos(7),
    saldoAnterior: 0,
    saldoPosterior: DEMO_SALDO_CLIENTE,
    estado: 'completada'
  });
}

// Borra todos los clientes y transacciones que se hayan creado en la sesión
// demo anterior del admin, para que cada quien empiece desde cero.
async function reiniciarDemoAdmin(usuario) {
  const clientesDemo = await Usuario.find({ creadoPor: usuario._id });
  const idsClientes = clientesDemo.map(c => c._id);
  const cuentasClientes = clientesDemo.map(c => c.numeroCuenta);

  if (idsClientes.length > 0) {
    await Transaccion.deleteMany({
      $or: [
        { emisorId: { $in: idsClientes } },
        { receptorNumeroCuenta: { $in: cuentasClientes } }
      ]
    });
    await Usuario.deleteMany({ _id: { $in: idsClientes } });
  }
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario || !await bcrypt.compare(contraseña, usuario.contraseña)) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (usuario.esDemo) {
      if (usuario.rol === 'cliente') await reiniciarDemoCliente(usuario);
      if (usuario.rol === 'admin') await reiniciarDemoAdmin(usuario);
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
        esDemo: usuario.esDemo,
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
    await declinarTransferenciasVencidas();
    const transacciones = await Transaccion.find({
      $or: [{ emisorId: req.userId }, { receptorNumeroCuenta: (await Usuario.findById(req.userId))?.numeroCuenta }]
    }).sort({ createdAt: -1 });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transferencia', middleware, async (req, res) => {
  try {
    const { receptorNumeroCuenta, nombreBeneficiario, bancoDestino, monto, descripcion } = req.body;
    const emisor = await Usuario.findById(req.userId);

    if (emisor.saldo < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const receptor = await Usuario.findOne({ numeroCuenta: receptorNumeroCuenta });
    const receptorNombre = receptor ? receptor.nombre : (nombreBeneficiario || 'Cuenta Externa');

    const transaccion = new Transaccion({
      emisorId: req.userId,
      emisor: { nombre: emisor.nombre, numeroCuenta: emisor.numeroCuenta },
      receptorNumeroCuenta,
      receptorNombre,
      bancoDestino: bancoDestino || 'Novo Opciones',
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
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });
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
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const aclaraciones = await Aclaracion.find().sort({ createdAt: -1 });
    res.json(aclaraciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/aclaraciones/:id', middleware, async (req, res) => {
  try {
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const aclaracion = await Aclaracion.findById(req.params.id);
    if (!aclaracion) return res.status(404).json({ error: 'No encontrada' });
    aclaracion.estado = 'revisado';
    await aclaracion.save();
    res.json({ success: true, aclaracion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CAMBIAR MI PROPIA CONTRASEÑA (solo master) =====
app.put('/api/perfil/password', middleware, async (req, res) => {
  try {
    if (!esMaster(req)) return res.status(403).json({ error: 'No autorizado' });

    const { actual, nueva } = req.body;
    if (!actual || !nueva) return res.status(400).json({ error: 'Completa ambos campos' });
    if (nueva.length < 8) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });

    const usuario = await Usuario.findById(req.userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const coincide = await bcrypt.compare(actual, usuario.contraseña);
    if (!coincide) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    usuario.contraseña = await bcrypt.hash(nueva, 10);
    await usuario.save();

    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RUTAS ADMIN (clientes) =====
app.post('/api/admin/clientes', middleware, async (req, res) => {
  try {
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });

    const { nombre, email, contraseña, saldoInicial } = req.body;
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const numeroCuenta = generarNumeroCuenta().toString();
    const tarjetaVirtual = generarTarjetaVirtual(nombre);
    const montoInicial = saldoInicial || 0;

    const usuario = new Usuario({
      nombre,
      email,
      contraseña: hashedPassword,
      saldo: montoInicial,
      numeroCuenta,
      tarjetaVirtual,
      rol: 'cliente',
      creadoPor: req.userId
    });

    await usuario.save();

    // Si se le dio saldo inicial, generamos el recibo de depósito
    if (montoInicial > 0) {
      const transaccion = new Transaccion({
        emisorId: null,
        emisor: { nombre: 'Depósito Inicial', numeroCuenta: generarDigitos(16) },
        receptorNumeroCuenta: numeroCuenta,
        receptorNombre: nombre,
        monto: montoInicial,
        descripcion: 'Depósito inicial de apertura de cuenta',
        tipo: 'deposito',
        cuentaOrigenExterna: generarDigitos(16),
        sucursal: '0423',
        referencia: generarDigitos(7),
        saldoAnterior: 0,
        saldoPosterior: montoInicial,
        estado: 'completada'
      });
      await transaccion.save();
    }

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
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const filtro = esMaster(req) ? { rol: 'cliente' } : { rol: 'cliente', creadoPor: req.userId };
    const clientes = await Usuario.find(filtro).select('-contraseña');
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/clientes/:id/numeroCuenta', middleware, async (req, res) => {
  try {
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });

    const { nuevoCuenta } = req.body;
    const cliente = await Usuario.findById(req.params.id);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!esDuenoDeCliente(req, cliente)) return res.status(403).json({ error: 'No autorizado' });

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
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });

    const { nombre, email, saldo, contraseña } = req.body;
    const cliente = await Usuario.findById(req.params.id);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!esDuenoDeCliente(req, cliente)) return res.status(403).json({ error: 'No autorizado' });

    if (nombre) cliente.nombre = nombre;
    if (email && email !== cliente.email) {
      const emailExiste = await Usuario.findOne({ email });
      if (emailExiste) return res.status(400).json({ error: 'Email ya existe' });
      cliente.email = email;
    }
    if (saldo !== undefined) cliente.saldo = saldo;

    // Solo el master puede resetear la contraseña de un cliente
    if (contraseña && esMaster(req)) {
      cliente.contraseña = await bcrypt.hash(contraseña, 10);
    }

    await cliente.save();

    res.json({ success: true, cliente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/clientes/:id', middleware, async (req, res) => {
  try {
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });

    const cliente = await Usuario.findById(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!esDuenoDeCliente(req, cliente)) return res.status(403).json({ error: 'No autorizado' });

    await Usuario.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/deposito', middleware, async (req, res) => {
  try {
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });

    const { clienteId, monto, descripcion } = req.body;
    const cliente = await Usuario.findById(clienteId);

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!esDuenoDeCliente(req, cliente)) return res.status(403).json({ error: 'No autorizado' });

    const saldoAntes = cliente.saldo;
    cliente.saldo += monto;
    await cliente.save();

    const transaccion = new Transaccion({
      emisorId: null,
      emisor: { nombre: 'Depósito', numeroCuenta: generarDigitos(16) },
      receptorNumeroCuenta: cliente.numeroCuenta,
      receptorNombre: cliente.nombre,
      monto,
      descripcion: descripcion || 'Depósito',
      tipo: 'deposito',
      cuentaOrigenExterna: generarDigitos(16),
      sucursal: '0423',
      referencia: generarDigitos(7),
      saldoAnterior: saldoAntes,
      saldoPosterior: cliente.saldo,
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
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });

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
    if (!esAdminOMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    await declinarTransferenciasVencidas();

    if (esMaster(req)) {
      const transacciones = await Transaccion.find().sort({ createdAt: -1 });
      return res.json(transacciones);
    }

    // Un admin normal solo ve transacciones de SUS clientes
    const misClientes = await Usuario.find({ rol: 'cliente', creadoPor: req.userId }).select('_id numeroCuenta');
    const misIds = misClientes.map(c => c._id.toString());
    const misCuentas = misClientes.map(c => c.numeroCuenta);

    const transacciones = await Transaccion.find({
      $or: [
        { emisorId: { $in: misIds } },
        { receptorNumeroCuenta: { $in: misCuentas } }
      ]
    }).sort({ createdAt: -1 });

    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EDITAR una transacción (solo master)
app.put('/api/master/transacciones/:id', middleware, async (req, res) => {
  try {
    if (!esMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const { monto, estado, descripcion } = req.body;
    const tx = await Transaccion.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });

    if (monto !== undefined) tx.monto = monto;
    if (estado !== undefined) tx.estado = estado;
    if (descripcion !== undefined) tx.descripcion = descripcion;

    await tx.save();
    res.json({ success: true, transaccion: tx });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ELIMINAR una transacción (solo master)
app.delete('/api/master/transacciones/:id', middleware, async (req, res) => {
  try {
    if (!esMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const tx = await Transaccion.findByIdAndDelete(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });
    res.json({ success: true, message: 'Transacción eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RUTAS MASTER (gestión de administradores) =====
app.get('/api/master/admins', middleware, async (req, res) => {
  try {
    if (!esMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const admins = await Usuario.find({ rol: 'admin' }).select('-contraseña');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/master/admins', middleware, async (req, res) => {
  try {
    if (!esMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const { nombre, email, contraseña } = req.body;

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'Ese email ya existe' });

    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const numeroCuenta = generarNumeroCuenta().toString();
    const tarjetaVirtual = generarTarjetaVirtual(nombre);

    const admin = new Usuario({
      nombre,
      email,
      contraseña: hashedPassword,
      saldo: 0,
      numeroCuenta,
      tarjetaVirtual,
      rol: 'admin'
    });

    await admin.save();
    res.json({ success: true, admin: { _id: admin._id, nombre, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/master/admins/:id', middleware, async (req, res) => {
  try {
    if (!esMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const { nombre, email, contraseña } = req.body;
    const admin = await Usuario.findById(req.params.id);
    if (!admin || admin.rol !== 'admin') return res.status(404).json({ error: 'Administrador no encontrado' });

    if (nombre) admin.nombre = nombre;
    if (email && email !== admin.email) {
      const emailExiste = await Usuario.findOne({ email });
      if (emailExiste) return res.status(400).json({ error: 'Email ya existe' });
      admin.email = email;
    }
    if (contraseña) {
      admin.contraseña = await bcrypt.hash(contraseña, 10);
    }

    await admin.save();
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/master/admins/:id', middleware, async (req, res) => {
  try {
    if (!esMaster(req)) return res.status(403).json({ error: 'No autorizado' });
    const admin = await Usuario.findById(req.params.id);
    if (!admin || admin.rol !== 'admin') return res.status(404).json({ error: 'Administrador no encontrado' });
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Administrador eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== LIMPIEZA DEL ADMIN ANTIGUO =====
// Elimina el admin de pruebas que se creaba automáticamente antes
// (admin@banbajio.com). Solo se ejecuta una vez, si existe.
async function eliminarAdminAntiguo() {
  const resultado = await Usuario.deleteOne({ email: 'admin@banbajio.com', rol: 'admin' });
  if (resultado.deletedCount > 0) {
    console.log('🗑️ Admin antiguo eliminado');
  }
}

// ===== CUENTAS DEMO (se reinician solas cada vez que alguien inicia sesión) =====
async function crearDemoAdminPorDefecto() {
  const email = process.env.DEMO_ADMIN_EMAIL || 'demo.admin@novoopciones.com';
  const password = process.env.DEMO_ADMIN_PASSWORD || 'DemoAdmin2026!';

  const existe = await Usuario.findOne({ email });
  if (!existe) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await Usuario.create({
      nombre: 'Admin Demo',
      email,
      contraseña: hashedPassword,
      saldo: 0,
      numeroCuenta: generarNumeroCuenta().toString(),
      tarjetaVirtual: generarTarjetaVirtual('Admin Demo'),
      rol: 'admin',
      esDemo: true
    });
    console.log('✅ Admin Demo creado');
  }
}

async function crearDemoClientePorDefecto() {
  const email = process.env.DEMO_CLIENTE_EMAIL || 'demo.cliente@novoopciones.com';
  const password = process.env.DEMO_CLIENTE_PASSWORD || 'DemoCliente2026!';

  const existe = await Usuario.findOne({ email });
  if (!existe) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const numeroCuenta = generarNumeroCuenta().toString();
    await Usuario.create({
      nombre: 'Cliente Demo',
      email,
      contraseña: hashedPassword,
      saldo: DEMO_SALDO_CLIENTE,
      numeroCuenta,
      tarjetaVirtual: generarTarjetaVirtual('Cliente Demo'),
      rol: 'cliente',
      esDemo: true
    });
    console.log('✅ Cliente Demo creado');
  }
}

async function crearMasterPorDefecto() {
  const emailMaster = process.env.MASTER_EMAIL || 'master@novoopciones.com';
  const passMaster = process.env.MASTER_PASSWORD || 'Master123!';

  const masterExiste = await Usuario.findOne({ email: emailMaster });
  if (!masterExiste) {
    const hashedPassword = await bcrypt.hash(passMaster, 10);
    await Usuario.create({
      nombre: 'Master',
      email: emailMaster,
      contraseña: hashedPassword,
      saldo: 0,
      numeroCuenta: '9999999999',
      tarjetaVirtual: {
        numero: '4532999999999999',
        cvv: '999',
        nombreTitular: 'MASTER',
        fechaExpedicion: new Date(),
        fechaVencimiento: new Date(new Date().getFullYear() + 5, new Date().getMonth(), new Date().getDate()),
        ultimosDigitos: '9999'
      },
      rol: 'master'
    });
    console.log('✅ Master creado');
  }
}

eliminarAdminAntiguo();
crearDemoAdminPorDefecto();
crearDemoClientePorDefecto();
crearMasterPorDefecto();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
