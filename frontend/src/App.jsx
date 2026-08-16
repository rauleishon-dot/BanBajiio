import React, { useState, useEffect } from 'react';
import { CreditCard, Send, Eye, EyeOff, LogOut, Plus } from 'lucide-react';

const LogoBanbajio = ({ size = 32 }) => (
  <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#1e40af', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#1e3a8a', stopOpacity: 1}} />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#grad1)" />
    <path d="M 60 140 L 60 70 L 95 70 Q 110 70 110 80 Q 110 90 95 90 L 75 90 L 95 90 Q 110 90 110 100 Q 110 115 90 115 L 75 115 L 95 140 Z" fill="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
    <circle cx="135" cy="95" r="22" fill="none" stroke="white" strokeWidth="3"/>
    <text x="135" y="105" textAnchor="middle" fontSize="30" fontWeight="bold" fill="white">$</text>
  </svg>
);

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function BanbajioApp() {
  const [pantalla, setPantalla] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`${apiUrl}/perfil`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
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
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setPantalla('login');
  };

  if (pantalla === 'login') return <LoginScreen login={login} loading={loading} />;
  if (pantalla === 'clienteDashboard') return <ClienteDashboard usuario={usuario} logout={logout} token={token} />;
  if (pantalla === 'adminDashboard') return <AdminDashboard usuario={usuario} logout={logout} token={token} />;
}

function LoginScreen({ login, loading }) {
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mostrar, setMostrar] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-900 to-blue-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6"><LogoBanbajio size={60} /></div>
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Banbajío</h1>
        <p className="text-center text-gray-600 mb-8">Tu banco digital de confianza</p>
        <form onSubmit={(e) => { e.preventDefault(); login(email, contraseña); }} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@banbajio.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          <input type={mostrar ? 'text' : 'password'} value={contraseña} onChange={(e) => setContraseña(e.target.value)} placeholder="Admin123!" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg disabled:bg-gray-400">
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ClienteDashboard({ usuario, logout, token }) {
  const [showBalance, setShowBalance] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [monto, setMonto] = useState('');
  const [receptorId, setReceptorId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    fetch(`${apiUrl}/mis-transacciones`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(tx => setTransacciones(tx));
    fetch(`${apiUrl}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(us => setUsuarios(us));
  };

  useEffect(() => {
    loadData();
  }, []);

  const realizar = async () => {
    if (!receptorId || !monto) { alert('Completa los campos'); return; }
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
        setShowTransfer(false);
        setMonto('');
        setReceptorId('');
        loadData();
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2"><LogoBanbajio size={32} /><h1 className="text-2xl font-bold">Banbajío</h1></div>
        <button onClick={logout} className="p-2 bg-red-600 rounded-lg"><LogOut size={20} /></button>
      </div>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-blue-200 text-sm">Saldo disponible</p>
            <div className="flex items-center gap-2">
              <h2 className="text-4xl font-bold">{showBalance ? `$${usuario.saldo.toFixed(2)}` : '••••'}</h2>
              <button onClick={() => setShowBalance(!showBalance)} className="p-1 hover:bg-blue-700 rounded">{showBalance ? <Eye size={20} /> : <EyeOff size={20} />}</button>
            </div>
          </div>
          <CreditCard size={32} />
        </div>
        <p className="font-mono">{usuario.numeroTarjeta}</p>
      </div>
      <button onClick={() => setShowTransfer(true)} className="w-full bg-white bg-opacity-20 rounded-xl p-4 mb-6 hover:bg-opacity-30 flex items-center justify-center gap-2"><Send size={24} /><span>Transferencia</span></button>
      <div><h3 className="text-lg font-bold mb-4">Transacciones</h3>
        {transacciones.length > 0 ? (
          <div className="space-y-3">
            {transacciones.map(tx => (
              <div key={tx._id} className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="flex justify-between">
                  <div><p className="font-semibold">{tx.emisor._id === usuario.id ? 'Enviado a' : 'Recibido de'}</p><p className="text-blue-200 text-sm">{tx.emisor._id === usuario.id ? tx.receptor.nombre : tx.emisor.nombre}</p></div>
                  <p className={`font-bold ${tx.emisor._id === usuario.id ? 'text-red-300' : 'text-green-300'}`}>{tx.emisor._id === usuario.id ? '-' : '+'} ${tx.monto.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-blue-200 text-center py-8">No hay transacciones</p>
        )}
      </div>
      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white text-gray-900 rounded-t-3xl w-full p-6">
            <h3 className="text-2xl font-bold mb-6">Nueva Transferencia</h3>
            <select value={receptorId} onChange={(e) => setReceptorId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4">
              <option value="">Selecciona usuario</option>
              {usuarios.map(u => (<option key={u._id} value={u._id}>{u.nombre}</option>))}
            </select>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowTransfer(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancelar</button>
              <button onClick={realizar} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">{loading ? 'Procesando...' : 'Transferir'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const loadData = () => {
    fetch(`${apiUrl}/admin/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(c => setClientes(c));
    fetch(`${apiUrl}/admin/transacciones`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(tx => setTransacciones(tx));
  };

  useEffect(() => {
    loadData();
  }, []);

  const crear = async () => {
    if (!nombre || !email || !contraseña) { alert('Completa los campos'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, email, contraseña, saldoInicial: parseFloat(saldo) || 0 })
      });
      if (res.ok) {
        alert('Cliente creado');
        setShowNuevo(false);
        setNombre('');
        setEmail('');
        setContraseña('');
        setSaldo('');
        loadData();
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
      <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-2"><LogoBanbajio size={40} /><h1 className="text-2xl font-bold">Admin</h1></div><button onClick={logout} className="p-2 bg-red-600 rounded-lg"><LogOut size={20} /></button></div>
      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('clientes')} className={`px-6 py-2 rounded-lg ${tab === 'clientes' ? 'bg-blue-600' : 'bg-white bg-opacity-10'}`}>Clientes</button>
        <button onClick={() => setTab('transacciones')} className={`px-6 py-2 rounded-lg ${tab === 'transacciones' ? 'bg-blue-600' : 'bg-white bg-opacity-10'}`}>Transacciones</button>
      </div>
      {tab === 'clientes' && (
        <div>
          <button onClick={() => setShowNuevo(true)} className="mb-6 px-4 py-2 bg-green-600 rounded-lg flex gap-2"><Plus size={20} /> Crear</button>
          <div className="bg-white bg-opacity-10 rounded-xl overflow-x-auto">
            <table className="w-full text-left"><thead><tr className="border-b border-white border-opacity-20"><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Saldo</th></tr></thead>
              <tbody>{clientes.map(c => (<tr key={c._id} className="border-b border-white border-opacity-10"><td className="px-6 py-3">{c.nombre}</td><td className="px-6 py-3">{c.email}</td><td className="px-6 py-3">${c.saldo.toFixed(2)}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'transacciones' && (
        <div className="bg-white bg-opacity-10 rounded-xl overflow-x-auto">
          <table className="w-full text-left"><thead><tr className="border-b border-white border-opacity-20"><th className="px-6 py-3">Emisor</th><th className="px-6 py-3">Receptor</th><th className="px-6 py-3">Monto</th></tr></thead>
            <tbody>{transacciones.map(tx => (<tr key={tx._id} className="border-b border-white border-opacity-10"><td className="px-6 py-3">{tx.emisor.nombre}</td><td className="px-6 py-3">{tx.receptor.nombre}</td><td className="px-6 py-3 text-green-300">${tx.monto.toFixed(2)}</td></tr>))}</tbody>
          </table>
        </div>
      )}
      {showNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">Crear Cliente</h3>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
            <input type="password" value={contraseña} onChange={(e) => setContraseña(e.target.value)} placeholder="Contraseña" className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
            <input type="number" value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="Saldo" className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowNuevo(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancelar</button>
              <button onClick={crear} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">{loading ? 'Creando...' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}