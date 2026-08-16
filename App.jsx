import React, { useState, useEffect } from 'react';
import { CreditCard, Send, Eye, EyeOff, LogOut, Plus, Trash2, DollarSign, Users, TrendingUp, Home, Settings } from 'lucide-react';

// Logo Banbajio
const LogoBanbajio = ({ size = 32, white = false }) => (
  <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#1e40af', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#1e3a8a', stopOpacity: 1}} />
      </linearGradient>
    </defs>
    {/* Círculo de fondo */}
    <circle cx="100" cy="100" r="95" fill="url(#grad1)" />
    
    {/* Letra B */}
    <path d="M 60 140 L 60 70 L 95 70 Q 110 70 110 80 Q 110 90 95 90 L 75 90 L 95 90 Q 110 90 110 100 Q 110 115 90 115 L 75 115 L 95 140 Z" 
          fill="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
    
    {/* Símbolo de dinero */}
    <circle cx="135" cy="95" r="22" fill="none" stroke="white" strokeWidth="3"/>
    <text x="135" y="105" textAnchor="middle" fontSize="30" fontWeight="bold" fill="white">$</text>
  </svg>
);

export default function BanbajioApp() {
  const [pantalla, setPantalla] = useState('login'); // login, clienteDashboard, adminDashboard
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Verificar token al cargar
  useEffect(() => {
    if (token) {
      fetch(`${apiUrl}/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data._id) {
            setUsuario(data);
            setPantalla(data.rol === 'admin' ? 'adminDashboard' : 'clienteDashboard');
          } else {
            logout();
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = async (email, contraseña) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contraseña })
      });
      const data = await res.json();

      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUsuario(data.usuario);
        setPantalla(data.usuario.rol === 'admin' ? 'adminDashboard' : 'clienteDashboard');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error al conectar: ' + error.message);
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setPantalla('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      {pantalla === 'login' && <LoginScreen login={login} loading={loading} />}
      {pantalla === 'clienteDashboard' && usuario && <ClienteDashboard usuario={usuario} logout={logout} token={token} apiUrl={apiUrl} />}
      {pantalla === 'adminDashboard' && usuario && <AdminDashboard usuario={usuario} logout={logout} token={token} apiUrl={apiUrl} />}
    </div>
  );
}

// ============ PANTALLA DE LOGIN ============

function LoginScreen({ login, loading }) {
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mostrarContraseña, setMostrarContraseña] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, contraseña);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <LogoBanbajio size={60} />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Banbajío</h1>
        <p className="text-center text-gray-600 mb-8">Tu banco digital de confianza</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={mostrarContraseña ? 'text' : 'password'}
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarContraseña(!mostrarContraseña)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {mostrarContraseña ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-400"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-semibold mb-2">Demo - Admin:</p>
          <p>📧 admin@banbajio.com</p>
          <p>🔑 Admin123!</p>
        </div>
      </div>
    </div>
  );
}

// ============ DASHBOARD CLIENTE ============

function ClienteDashboard({ usuario, logout, token, apiUrl }) {
  const [showBalance, setShowBalance] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferData, setTransferData] = useState({ receptorId: '', monto: '', descripcion: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [txRes, usRes] = await Promise.all([
        fetch(`${apiUrl}/mis-transacciones`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const tx = await txRes.json();
      const us = await usRes.json();

      setTransacciones(tx);
      setUsuarios(us);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const realizarTransferencia = async () => {
    if (!transferData.receptorId || !transferData.monto) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/transferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receptorId: transferData.receptorId,
          monto: parseFloat(transferData.monto),
          descripcion: transferData.descripcion
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('¡Transferencia exitosa!');
        setShowTransfer(false);
        setTransferData({ receptorId: '', monto: '', descripcion: '' });
        cargarDatos();
        // Actualizar saldo
        usuario.saldo = data.nuevoSaldo;
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white p-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <LogoBanbajio size={32} />
          <h1 className="text-2xl font-bold">Banbajío</h1>
        </div>
        <button onClick={logout} className="p-2 bg-red-600 rounded-lg hover:bg-red-700">
          <LogOut size={20} />
        </button>
      </div>

      {/* Tarjeta */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-blue-200 text-sm">Saldo disponible</p>
            <div className="flex items-center gap-2">
              <h2 className="text-4xl font-bold">
                {showBalance ? `$${usuario.saldo.toFixed(2)}` : '••••'}
              </h2>
              <button onClick={() => setShowBalance(!showBalance)} className="p-1 hover:bg-blue-700 rounded">
                {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          <CreditCard size={32} />
        </div>
        <div className="flex justify-between">
          <div>
            <p className="text-blue-200 text-xs">Tarjeta</p>
            <p className="font-mono">{usuario.numeroTarjeta}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Vencimiento</p>
            <p className="font-mono">12/28</p>
          </div>
        </div>
      </div>

      {/* Botón Transferencia */}
      <button
        onClick={() => setShowTransfer(true)}
        className="w-full bg-white bg-opacity-20 rounded-xl p-4 mb-6 hover:bg-opacity-30 transition flex items-center justify-center gap-2"
      >
        <Send size={24} />
        <span className="text-lg font-semibold">Realizar Transferencia</span>
      </button>

      {/* Transacciones */}
      <div>
        <h3 className="text-lg font-bold mb-4">Últimas Transacciones</h3>
        {transacciones.length > 0 ? (
          <div className="space-y-3">
            {transacciones.map(tx => {
              const esEmisor = tx.emisor._id === usuario.id;
              return (
                <div key={tx._id} className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{esEmisor ? 'Enviado a' : 'Recibido de'}</p>
                      <p className="text-blue-200 text-sm">{esEmisor ? tx.receptor.nombre : tx.emisor.nombre}</p>
                      <p className="text-blue-300 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className={`font-bold text-lg ${esEmisor ? 'text-red-300' : 'text-green-300'}`}>
                      {esEmisor ? '-' : '+'} ${tx.monto.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-blue-200 text-center py-8">No hay transacciones</p>
        )}
      </div>

      {/* Modal Transferencia */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white text-gray-900 rounded-t-3xl w-full p-6">
            <h3 className="text-2xl font-bold mb-6">Nueva Transferencia</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Destinatario</label>
                <select
                  value={transferData.receptorId}
                  onChange={(e) => setTransferData({...transferData, receptorId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios.map(u => (
                    <option key={u._id} value={u._id}>{u.nombre} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Monto</label>
                <input
                  type="number"
                  value={transferData.monto}
                  onChange={(e) => setTransferData({...transferData, monto: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Descripción</label>
                <input
                  type="text"
                  value={transferData.descripcion}
                  onChange={(e) => setTransferData({...transferData, descripcion: e.target.value})}
                  placeholder="Concepto de la transferencia"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTransfer(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={realizarTransferencia}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Procesando...' : 'Transferir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ DASHBOARD ADMIN ============

function AdminDashboard({ usuario, logout, token, apiUrl }) {
  const [tab, setTab] = useState('clientes'); // clientes, transacciones
  const [clientes, setClientes] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [stats, setStats] = useState({});
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', email: '', contraseña: '', telefono: '', saldoInicial: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [clientesRes, txRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/admin/transacciones`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const c = await clientesRes.json();
      const tx = await txRes.json();
      const s = await statsRes.json();

      setClientes(c);
      setTransacciones(tx);
      setStats(s);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const crearCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.email || !nuevoCliente.contraseña) {
      alert('Completa los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoCliente)
      });

      if (res.ok) {
        alert('Cliente creado exitosamente');
        setShowNuevoCliente(false);
        setNuevoCliente({ nombre: '', email: '', contraseña: '', telefono: '', saldoInicial: 0 });
        cargarDatos();
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white p-4" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <LogoBanbajio size={40} />
          <div>
            <h1 className="text-2xl font-bold">Banbajío Admin</h1>
            <p className="text-blue-200 text-sm">Panel de Administración</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 bg-red-600 rounded-lg hover:bg-red-700">
          <LogOut size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Clientes Totales</p>
              <p className="text-4xl font-bold">{stats.totalClientes}</p>
            </div>
            <Users size={40} className="text-blue-300" />
          </div>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Transacciones</p>
              <p className="text-4xl font-bold">{stats.totalTransacciones}</p>
            </div>
            <TrendingUp size={40} className="text-blue-300" />
          </div>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Saldo Total</p>
              <p className="text-3xl font-bold">${stats.saldoTotal?.toFixed(2)}</p>
            </div>
            <DollarSign size={40} className="text-blue-300" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('clientes')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            tab === 'clientes'
              ? 'bg-blue-600'
              : 'bg-white bg-opacity-10 hover:bg-opacity-20'
          }`}
        >
          Clientes
        </button>
        <button
          onClick={() => setTab('transacciones')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            tab === 'transacciones'
              ? 'bg-blue-600'
              : 'bg-white bg-opacity-10 hover:bg-opacity-20'
          }`}
        >
          Transacciones
        </button>
      </div>

      {/* Contenido */}
      {tab === 'clientes' && (
        <div>
          <button
            onClick={() => setShowNuevoCliente(true)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={20} />
            Crear Nuevo Cliente
          </button>

          {clientes.length > 0 ? (
            <div className="bg-white bg-opacity-10 rounded-xl backdrop-blur overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white border-opacity-20">
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Tarjeta</th>
                    <th className="px-6 py-3">Saldo</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c._id} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5">
                      <td className="px-6 py-3">{c.nombre}</td>
                      <td className="px-6 py-3 text-blue-200">{c.email}</td>
                      <td className="px-6 py-3 font-mono text-sm">{c.numeroTarjeta}</td>
                      <td className="px-6 py-3">${c.saldo.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          c.activo
                            ? 'bg-green-500 bg-opacity-20 text-green-200'
                            : 'bg-red-500 bg-opacity-20 text-red-200'
                        }`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-blue-200 text-center py-8">No hay clientes</p>
          )}
        </div>
      )}

      {tab === 'transacciones' && (
        <div>
          {transacciones.length > 0 ? (
            <div className="bg-white bg-opacity-10 rounded-xl backdrop-blur overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white border-opacity-20">
                    <th className="px-6 py-3">Emisor</th>
                    <th className="px-6 py-3">Receptor</th>
                    <th className="px-6 py-3">Monto</th>
                    <th className="px-6 py-3">Descripción</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map(tx => (
                    <tr key={tx._id} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5">
                      <td className="px-6 py-3">{tx.emisor.nombre}</td>
                      <td className="px-6 py-3">{tx.receptor.nombre}</td>
                      <td className="px-6 py-3 font-bold text-green-300">${tx.monto.toFixed(2)}</td>
                      <td className="px-6 py-3 text-blue-200 text-sm">{tx.descripcion || '-'}</td>
                      <td className="px-6 py-3 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 rounded-full text-sm bg-green-500 bg-opacity-20 text-green-200">
                          Completada
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-blue-200 text-center py-8">No hay transacciones</p>
          )}
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {showNuevoCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">Crear Nuevo Cliente</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre</label>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Contraseña</label>
                <input
                  type="password"
                  value={nuevoCliente.contraseña}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, contraseña: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Saldo Inicial</label>
                <input
                  type="number"
                  value={nuevoCliente.saldoInicial}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, saldoInicial: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNuevoCliente(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearCliente}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}