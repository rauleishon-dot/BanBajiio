import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogOut, Send, Plus, CreditCard, Menu, X, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function BanbajioApp() {
  const [pantalla, setPantalla] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      verificarToken();
    }
  }, [token]);

  const verificarToken = async () => {
    try {
      const res = await fetch(`${apiUrl}/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data._id) {
        setUsuario(data);
        setPantalla(data.rol === 'admin' ? 'adminDashboard' : 'clienteDashboard');
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setPantalla('login');
  };

  const login = async (email, contraseña) => {
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
      } else {
        alert('Error: ' + (data.error || 'No se pudo iniciar sesión'));
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  if (pantalla === 'login') return <LoginScreen login={login} />;
  if (pantalla === 'clienteDashboard' && usuario) return <ClienteDashboard usuario={usuario} logout={logout} token={token} />;
  if (pantalla === 'adminDashboard' && usuario) return <AdminDashboard usuario={usuario} logout={logout} token={token} />;
  
  return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Cargando...</p></div>;
}

// ============ LOGIN SCREEN ============
function LoginScreen({ login }) {
  const [email, setEmail] = useState('admin@banbajio.com');
  const [contraseña, setContraseña] = useState('Admin123!');
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !contraseña) {
      alert('Completa todos los campos');
      return;
    }
    setLoading(true);
    await login(email, contraseña);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
         <div className="mb-4">
  <img src="/logo.png" alt="Banbajío" className="w-24 h-24 mx-auto" />
</div>
          <h1 className="text-4xl font-bold text-white mb-2">Banbajío Pro</h1>
          <p className="text-purple-200">Tu banco digital seguro</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={mostrar ? 'text' : 'password'}
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => setMostrar(!mostrar)}
                className="absolute right-3 top-3 text-gray-500 hover:text-purple-600"
              >
                {mostrar ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 text-white text-sm">
          <p className="font-semibold mb-2">Demo Admin:</p>
          <p>📧 admin@banbajio.com</p>
          <p>🔑 Admin123!</p>
        </div>
      </div>
    </div>
  );
}

// ============ CLIENTE DASHBOARD ============
function ClienteDashboard({ usuario, logout, token }) {
  const [showBalance, setShowBalance] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [monto, setMonto] = useState('');
  const [receptorId, setReceptorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [txRes, usRes] = await Promise.all([
        fetch(`${apiUrl}/mis-transacciones`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const tx = await txRes.json();
      const us = await usRes.json();
      
      if (Array.isArray(tx)) setTransacciones(tx);
      if (Array.isArray(us)) setUsuarios(us);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetTransferForm = () => {
    setShowTransfer(false);
    setMonto('');
    setReceptorId('');
  };

  const realizar = async () => {
    if (!receptorId || !monto) {
      alert('Selecciona un usuario y ingresa un monto');
      return;
    }

    if (parseFloat(monto) <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/transferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receptorId, monto: parseFloat(monto), descripcion: '' })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('¡Transferencia exitosa!');
        resetTransferForm();
        await loadData();
      } else {
        alert('Error: ' + (data.error || 'No se pudo procesar la transferencia'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-red-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-purple-200 text-sm">Bienvenido</p>
            <h1 className="text-2xl font-bold">{usuario.nombre}</h1>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/20 rounded-lg transition">
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu */}
        {showMenu && (
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-6">
            <button onClick={logout} className="w-full flex items-center gap-2 text-white hover:bg-white/20 p-3 rounded-lg transition">
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* Tarjeta */}
        <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-white">
          <p className="text-white/70 text-sm mb-2">SALDO DISPONIBLE</p>
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold">
              {showBalance ? `$${usuario.saldo.toFixed(2)}` : '••••••'}
            </h2>
            <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/20 rounded-lg transition">
              {showBalance ? <Eye size={24} /> : <EyeOff size={24} />}
            </button>
          </div>
          <p className="text-white/70 text-xs mt-4">Tarjeta: {usuario.numeroTarjeta}</p>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-4">
        <button onClick={() => setShowTransfer(true)} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col items-center gap-2">
          <Send className="text-purple-600" size={28} />
          <span className="text-sm font-semibold text-gray-700">Transferir</span>
        </button>
        <button className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col items-center gap-2">
          <CreditCard className="text-red-600" size={28} />
          <span className="text-sm font-semibold text-gray-700">Tarjeta</span>
        </button>
      </div>

      {/* Transacciones */}
      <div className="px-4 mt-8">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Últimas transacciones</h3>
        {loadingData ? (
          <p className="text-gray-500 text-center py-8">Cargando...</p>
        ) : transacciones.length > 0 ? (
          <div className="space-y-3">
            {transacciones.map(tx => {
              const esEmisor = tx.emisor._id === usuario.id;
              return (
                <div key={tx._id} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${esEmisor ? 'bg-red-100' : 'bg-green-100'}`}>
                      {esEmisor ? <ArrowUpRight className="text-red-600" size={20} /> : <ArrowDownLeft className="text-green-600" size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{esEmisor ? 'Enviado' : 'Recibido'}</p>
                      <p className="text-gray-500 text-xs">{esEmisor ? tx.receptor.nombre : tx.emisor.nombre}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${esEmisor ? 'text-red-600' : 'text-green-600'}`}>
                    {esEmisor ? '-' : '+'} ${tx.monto.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay transacciones</p>
        )}
      </div>

      {/* Modal Transferencia */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Transferencia</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">A quién</label>
                <select 
                  value={receptorId} 
                  onChange={(e) => setReceptorId(e.target.value)} 
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios.map(u => (<option key={u._id} value={u._id}>{u.nombre}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto</label>
                <input 
                  type="number" 
                  value={monto} 
                  onChange={(e) => setMonto(e.target.value)} 
                  placeholder="$0.00" 
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={resetTransferForm} 
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={realizar} 
                  disabled={loading} 
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-red-700 disabled:opacity-50 transition"
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

// ============ ADMIN DASHBOARD ============
function AdminDashboard({ usuario, logout, token }) {
  const [tab, setTab] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [showNuevo, setShowNuevo] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [saldo, setSaldo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [cRes, txRes] = await Promise.all([
        fetch(`${apiUrl}/admin/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/admin/transacciones`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const c = await cRes.json();
      const tx = await txRes.json();
      
      if (Array.isArray(c)) setClientes(c);
      if (Array.isArray(tx)) setTransacciones(tx);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setShowNuevo(false);
    setNombre('');
    setEmail('');
    setContraseña('');
    setSaldo('');
  };

  const crear = async () => {
    if (!nombre || !email || !contraseña) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, email, contraseña, saldoInicial: parseFloat(saldo) || 0 })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Cliente creado exitosamente');
        resetForm();
        await loadData();
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear el cliente'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-red-600 text-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Panel Admin</h1>
          <button onClick={logout} className="p-2 hover:bg-white/20 rounded-lg transition">
            <LogOut size={24} />
          </button>
        </div>
        <p className="text-white/80">Bienvenido, {usuario.nombre}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6 flex gap-2">
        <button 
          onClick={() => setTab('clientes')} 
          className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'clientes' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
        >
          Clientes ({clientes.length})
        </button>
        <button 
          onClick={() => setTab('transacciones')} 
          className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'transacciones' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
        >
          Transacciones ({transacciones.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'clientes' && (
        <div className="p-4">
          <button 
            onClick={() => setShowNuevo(true)} 
            className="w-full bg-gradient-to-r from-purple-600 to-red-600 text-white py-3 rounded-lg font-semibold mb-6 flex items-center justify-center gap-2 hover:from-purple-700 hover:to-red-700 transition"
          >
            <Plus size={20} /> Crear Cliente
          </button>
          
          {loadingData ? (
            <p className="text-gray-500 text-center py-8">Cargando...</p>
          ) : clientes.length > 0 ? (
            <div className="space-y-3">
              {clientes.map(c => (
                <div key={c._id} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{c.nombre}</p>
                      <p className="text-gray-500 text-sm">{c.email}</p>
                    </div>
                    <p className="font-bold text-purple-600">${c.saldo.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay clientes</p>
          )}
        </div>
      )}

      {tab === 'transacciones' && (
        <div className="p-4">
          {loadingData ? (
            <p className="text-gray-500 text-center py-8">Cargando...</p>
          ) : transacciones.length > 0 ? (
            <div className="space-y-3">
              {transacciones.map(tx => (
                <div key={tx._id} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                  <div className="flex justify-between mb-2">
                    <p className="font-bold text-gray-900 text-sm">{tx.emisor.nombre} → {tx.receptor.nombre}</p>
                    <p className="font-bold text-green-600">${tx.monto.toFixed(2)}</p>
                  </div>
                  <p className="text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay transacciones</p>
          )}
        </div>
      )}

      {/* Modal Crear Cliente */}
      {showNuevo && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Crear Cliente</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                placeholder="Nombre completo" 
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" 
              />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email" 
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" 
              />
              <input 
                type="password" 
                value={contraseña} 
                onChange={(e) => setContraseña(e.target.value)} 
                placeholder="Contraseña" 
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" 
              />
              <input 
                type="number" 
                value={saldo} 
                onChange={(e) => setSaldo(e.target.value)} 
                placeholder="Saldo inicial" 
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" 
              />
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={resetForm} 
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={crear} 
                  disabled={loading} 
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-red-700 disabled:opacity-50 transition"
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