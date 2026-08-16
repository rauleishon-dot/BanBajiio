const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/banbajio';
mongoose.connect(mongoUri).catch(err => console.log('MongoDB connection error:', err));

// ============ SCHEMAS ============

// Usuario Schema (Admin y Clientes)
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  telefono: String,
  rol: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  saldo: { type: Number, default: 0 },
  numeroTarjeta: { type: String, unique: true, sparse: true },
  activo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('contraseña')) return next();
  this.contraseña = await bcrypt.hash(this.contraseña, 10);
  next();
});

// Método para comparar contraseñas
usuarioSchema.methods.compararContraseña = async function(contraseñaIngresada) {
  return await bcrypt.compare(contraseñaIngresada, this.contraseña);
};

// Transacción Schema
const transaccionSchema = new mongoose.Schema({
  emisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  receptor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  monto: { type: Number, required: true },
  descripcion: String,
  estado: { type: String, enum: ['pendiente', 'completada', 'fallida'], default: 'completada' },
  createdAt: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
const Transaccion = mongoose.model('Transaccion', transaccionSchema);

// ============ MIDDLEWARE DE AUTENTICACIÓN ============

const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_banbajio_123');
    req.usuarioId = decoded.id;
    req.rol = decoded.rol;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const esAdmin = (req, res, next) => {
  if (req.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores' });
  }
  next();
};

// ============ RUTAS DE AUTENTICACIÓN ============

// Registro/Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const esValida = await usuario.compararContraseña(contraseña);
    if (!esValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol, email: usuario.email },
      process.env.JWT_SECRET || 'secreto_banbajio_123',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        saldo: usuario.saldo,
        numeroTarjeta: usuario.numeroTarjeta
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RUTAS DE ADMIN ============

// Crear cliente
app.post('/api/admin/clientes', verificarToken, esAdmin, async (req, res) => {
  try {
    const { nombre, email, contraseña, telefono, saldoInicial } = req.body;

    // Generar número de tarjeta único
    const numeroTarjeta = 'BANJ' + Math.random().toString(36).substr(2, 12).toUpperCase();

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      contraseña,
      telefono,
      rol: 'cliente',
      saldo: saldoInicial || 0,
      numeroTarjeta
    });

    await nuevoUsuario.save();

    res.json({
      mensaje: 'Cliente creado exitosamente',
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        numeroTarjeta: nuevoUsuario.numeroTarjeta,
        saldo: nuevoUsuario.saldo
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos los clientes
app.get('/api/admin/clientes', verificarToken, esAdmin, async (req, res) => {
  try {
    const clientes = await Usuario.find({ rol: 'cliente' }).select('-contraseña');
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar saldo de cliente
app.put('/api/admin/clientes/:id/saldo', verificarToken, esAdmin, async (req, res) => {
  try {
    const { saldo } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { saldo },
      { new: true }
    ).select('-contraseña');

    res.json({ mensaje: 'Saldo actualizado', usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desactivar cliente
app.put('/api/admin/clientes/:id/desactivar', verificarToken, esAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    ).select('-contraseña');

    res.json({ mensaje: 'Cliente desactivado', usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ver todas las transacciones
app.get('/api/admin/transacciones', verificarToken, esAdmin, async (req, res) => {
  try {
    const transacciones = await Transaccion.find()
      .populate('emisor', 'nombre email')
      .populate('receptor', 'nombre email')
      .sort({ createdAt: -1 });

    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/admin/stats', verificarToken, esAdmin, async (req, res) => {
  try {
    const totalClientes = await Usuario.countDocuments({ rol: 'cliente' });
    const totalTransacciones = await Transaccion.countDocuments();
    const saldoTotal = await Usuario.aggregate([
      { $match: { rol: 'cliente' } },
      { $group: { _id: null, total: { $sum: '$saldo' } } }
    ]);

    res.json({
      totalClientes,
      totalTransacciones,
      saldoTotal: saldoTotal[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RUTAS DE CLIENTE ============

// Obtener datos del usuario
app.get('/api/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuarioId).select('-contraseña');
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Realizar transferencia
app.post('/api/transferencia', verificarToken, async (req, res) => {
  try {
    const { receptorId, monto, descripcion } = req.body;

    // Validaciones
    if (monto <= 0) {
      return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
    }

    if (monto > 10000) {
      return res.status(400).json({ error: 'Límite máximo de $10,000 por transferencia' });
    }

    const emisor = await Usuario.findById(req.usuarioId);
    if (!emisor || emisor.saldo < monto) {
      return res.status(400).json({ error: 'Fondos insuficientes' });
    }

    const receptor = await Usuario.findById(receptorId);
    if (!receptor) {
      return res.status(404).json({ error: 'Receptor no encontrado' });
    }

    // Procesar transferencia
    emisor.saldo -= monto;
    receptor.saldo += monto;

    const transaccion = new Transaccion({
      emisor: req.usuarioId,
      receptor: receptorId,
      monto,
      descripcion,
      estado: 'completada'
    });

    await emisor.save();
    await receptor.save();
    await transaccion.save();

    res.json({
      mensaje: 'Transferencia exitosa',
      transaccion: {
        id: transaccion._id,
        monto: transaccion.monto,
        receptor: receptor.nombre,
        fecha: transaccion.createdAt
      },
      nuevoSaldo: emisor.saldo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener transacciones del usuario
app.get('/api/mis-transacciones', verificarToken, async (req, res) => {
  try {
    const transacciones = await Transaccion.find({
      $or: [
        { emisor: req.usuarioId },
        { receptor: req.usuarioId }
      ]
    })
      .populate('emisor', 'nombre email')
      .populate('receptor', 'nombre email')
      .sort({ createdAt: -1 });

    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar otros usuarios (para transferencias)
app.get('/api/usuarios', verificarToken, async (req, res) => {
  try {
    const usuarios = await Usuario.find({
      _id: { $ne: req.usuarioId },
      rol: 'cliente'
    }).select('nombre email numeroTarjeta');

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CREAR ADMIN POR DEFECTO ============

const crearAdminPorDefecto = async () => {
  try {
    const adminExiste = await Usuario.findOne({ rol: 'admin' });
    if (!adminExiste) {
      const admin = new Usuario({
        nombre: 'Administrador',
        email: 'admin@banbajio.com',
        contraseña: 'Admin123!',
        rol: 'admin'
      });
      await admin.save();
      console.log('✅ Admin creado: admin@banbajio.com / Admin123!');
    }
  } catch (error) {
    console.log('Error creando admin:', error.message);
  }
};

// ============ INICIAR SERVIDOR ============

const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
  console.log('✅ MongoDB conectado');
  crearAdminPorDefecto();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
});