import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogOut, Send, Plus, CreditCard, Menu, X, ArrowUpRight, ArrowDownLeft, Wallet, Copy, Check, Edit, Trash2, FileText, Phone, AlertCircle, Settings, ChevronRight, CheckCircle2 } from 'lucide-react';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const NOMBRE_APP = 'Novo Opciones';
const RAZON_SOCIAL = 'Novo Opciones, S.A.P.I. de C.V., SOFOM, E.N.R.';

function formatearDinero(cantidad) {
  return '$' + cantidad.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatearFechaCorta(date) {
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BanbajioApp() {
  const [pantalla, setPantalla] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    verificarToken();
  }, []);

  const verificarToken = async () => {
    try {
      const t = sessionStorage.getItem('token');
      if (!t) return;
      const res = await fetch(`${apiUrl}/perfil`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      const data = await res.json();
      if (data._id) {
        setUsuario(data);
        setToken(t);
        setPantalla(data.rol === 'admin' ? 'adminDashboard' : 'clienteDashboard');
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error:', error);
      logout();
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
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
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUsuario(data.usuario);
        setPantalla(data.usuario.rol === 'admin' ? 'adminDashboard' : 'clienteDashboard');
      } else {
        alert('Error: ' + (data.error || 'No se pudo iniciar sesión'));
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  if (pantalla === 'login') return <LoginScreen login={login} />;
  if (pantalla === 'clienteDashboard' && usuario) return <ClienteDashboard usuario={usuario} logout={logout} token={token} />;
  if (pantalla === 'adminDashboard' && usuario) return <AdminDashboard usuario={usuario} logout={logout} token={token} esMaster={usuario.rol === 'master'} />;

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
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt={NOMBRE_APP} className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg" />
          <h1 className="text-4xl font-bold text-white mb-2">{NOMBRE_APP}</h1>
          <p className="text-blue-200">Tu banco digital seguro</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => setMostrar(!mostrar)}
                className="absolute right-3 top-3 text-gray-500 hover:text-blue-600"
              >
                {mostrar ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 text-white text-sm">
          <p className="font-semibold mb-2">Demo Admin:</p>
          <p>📧 admin@banbajio.com</p>
          <p>🔑 Admin123!</p>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">{RAZON_SOCIAL}</p>
      </div>
    </div>
  );
}

// ============ CLIENTE DASHBOARD ============
function ClienteDashboard({ usuario, logout, token }) {
  const [showBalance, setShowBalance] = useState(false);
  const [showCVVModal, setShowCVVModal] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCuenta, setShowCuenta] = useState(false);
  const [showTarjeta, setShowTarjeta] = useState(false);
  const [showEstadoCuenta, setShowEstadoCuenta] = useState(false);
  const [showAclaracion, setShowAclaracion] = useState(false);
  const [showDetalleTx, setShowDetalleTx] = useState(false);
  const [txDetalle, setTxDetalle] = useState(null);
  const [txSeleccionada, setTxSeleccionada] = useState(null);
  const [descripcionAclaracion, setDescripcionAclaracion] = useState('');
  const [telefonoSoporte, setTelefonoSoporte] = useState('01-800-000-0000');
  const [numeroCuentaDestino, setNumeroCuentaDestino] = useState('');
  const [nombreBeneficiario, setNombreBeneficiario] = useState('');
  const [bancoDestino, setBancoDestino] = useState(NOMBRE_APP);
  const [conceptoTransferencia, setConceptoTransferencia] = useState('');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCreditoModal, setShowCreditoModal] = useState(false);
  const [creditoProcesando, setCreditoProcesando] = useState(false);
  const [creditoNombre, setCreditoNombre] = useState('');

  const loadData = async (silent = false) => {
    if (!silent) setLoadingData(true);
    try {
      const res = await fetch(`${apiUrl}/mis-transacciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tx = await res.json();
      if (Array.isArray(tx)) setTransacciones(tx);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      if (!silent) setLoadingData(false);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/configuracion`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.telefonoSoporte) setTelefonoSoporte(data.telefonoSoporte);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadConfig();
    const interval = setInterval(() => loadData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransacciones(prev => {
        let cambio = false;
        const next = prev.map(tx => {
          if (tx.estado === 'pendiente') {
            const minutos = (Date.now() - new Date(tx.createdAt).getTime()) / 60000;
            if (minutos >= 30) {
              cambio = true;
              return { ...tx, estado: 'completada' };
            }
          }
          return tx;
        });
        return cambio ? next : prev;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const copiarCuenta = () => {
    navigator.clipboard.writeText(usuario.numeroCuenta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetTransferForm = () => {
    setShowTransfer(false);
    setNumeroCuentaDestino('');
    setNombreBeneficiario('');
    setBancoDestino(NOMBRE_APP);
    setConceptoTransferencia('');
    setMonto('');
  };

  const realizar = async () => {
    if (!numeroCuentaDestino || !nombreBeneficiario || !monto) {
      alert('Completa número de cuenta, nombre y monto');
      return;
    }
    if (parseFloat(monto) <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }
    if (numeroCuentaDestino === usuario.numeroCuenta) {
      alert('No puedes transferir a tu propia cuenta');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/transferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          receptorNumeroCuenta: numeroCuentaDestino,
          nombreBeneficiario,
          bancoDestino,
          monto: parseFloat(monto),
          descripcion: conceptoTransferencia || ''
        })
      });

      const data = await res.json();

      if (res.ok) {
        resetTransferForm();
        await loadData();
        setTxDetalle(data.transaccion);
        setShowDetalleTx(true);
      } else {
        alert('Error: ' + (data.error || 'No se pudo procesar'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirAclaracion = (tx) => {
    setTxSeleccionada(tx);
    setDescripcionAclaracion('');
    setShowAclaracion(true);
  };

  const enviarAclaracion = async () => {
    if (!descripcionAclaracion.trim()) {
      alert('Describe el motivo de tu aclaración');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/aclaracion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ transaccionId: txSeleccionada._id, descripcion: descripcionAclaracion })
      });
      if (res.ok) {
        alert('✅ Aclaración enviada. Nuestro equipo la revisará pronto.');
        setShowAclaracion(false);
        setTxSeleccionada(null);
        setDescripcionAclaracion('');
      } else {
        alert('Error al enviar la aclaración');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const solicitarCredito = (nombre) => {
    setCreditoNombre(nombre);
    setShowCreditoModal(true);
    setCreditoProcesando(true);
    setTimeout(() => {
      setCreditoProcesando(false);
    }, 2500);
  };

  const getEstadoColor = (estado) => {
    if (estado === 'pendiente') return 'bg-yellow-100 text-yellow-800';
    if (estado === 'completada') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado) => {
    if (estado === 'pendiente') return '⏳ Pendiente';
    return '✅ Completada';
  };

  const formatearFecha = (date) => {
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear().toString().slice(-2);
    return `${mes}/${año}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-blue-200 text-sm">Bienvenido</p>
            <h1 className="text-2xl font-bold">{usuario.nombre}</h1>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/20 rounded-lg transition">
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {showMenu && (
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-6">
            <button onClick={logout} className="w-full flex items-center gap-2 text-white hover:bg-white/20 p-3 rounded-lg transition">
              <LogOut size={20} /> Cerrar sesión
            </button>
          </div>
        )}

        {/* Saldo */}
        <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-white">
          <p className="text-white/70 text-sm mb-2">SALDO DISPONIBLE</p>
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold">
              {showBalance ? formatearDinero(usuario.saldo) : '••••••'}
            </h2>
            <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/20 rounded-lg transition">
              {showBalance ? <Eye size={24} /> : <EyeOff size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="px-4 mt-6 grid grid-cols-3 gap-4">
        <button onClick={() => setShowTransfer(true)} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col items-center gap-2">
          <Send className="text-blue-700" size={28} />
          <span className="text-sm font-semibold text-gray-700">Transferir</span>
        </button>
        <button onClick={() => setShowTarjeta(true)} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col items-center gap-2">
          <CreditCard className="text-blue-500" size={28} />
          <span className="text-sm font-semibold text-gray-700">Tarjeta</span>
        </button>
        <button onClick={() => setShowCuenta(true)} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col items-center gap-2">
          <Wallet className="text-blue-900" size={28} />
          <span className="text-sm font-semibold text-gray-700">Cuenta</span>
        </button>
      </div>

      {/* Beneficios y Productos */}
      <div className="px-4 mt-8">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Productos para ti</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="text-blue-700" size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Tarjeta de Crédito</p>
                  <p className="text-gray-500 text-xs">Hasta $50,000 de línea de crédito</p>
                </div>
              </div>
              <button onClick={() => solicitarCredito('Tarjeta de Crédito')} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition">
                Solicitar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="text-blue-600" size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Crédito de Nómina</p>
                  <p className="text-gray-500 text-xs">Tasa preferencial para empleados</p>
                </div>
              </div>
              <button onClick={() => solicitarCredito('Crédito de Nómina')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                Solicitar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowUpRight className="text-blue-900" size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Crédito Automotriz</p>
                  <p className="text-gray-500 text-xs">Financia tu auto nuevo o seminuevo</p>
                </div>
              </div>
              <button onClick={() => solicitarCredito('Crédito Automotriz')} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-950 transition">
                Solicitar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transacciones */}
      <div className="px-4 mt-8">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Últimas transacciones</h3>
        {loadingData ? (
          <p className="text-gray-500 text-center py-8">Cargando...</p>
        ) : transacciones.length > 0 ? (
          <div className="space-y-3">
            {transacciones.map(tx => {
              const esEmisor = tx.emisorId === usuario._id;
              return (
                <div key={tx._id} onClick={() => { setTxDetalle(tx); setShowDetalleTx(true); }} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${esEmisor ? 'bg-red-100' : 'bg-green-100'}`}>
                        {esEmisor ? <ArrowUpRight className="text-red-600" size={20} /> : <ArrowDownLeft className="text-green-600" size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{esEmisor ? 'Enviado a' : 'Recibido de'}</p>
                        <p className="text-gray-500 text-xs">{esEmisor ? tx.receptorNombre : tx.emisor.nombre}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${esEmisor ? 'text-red-600' : 'text-green-600'}`}>
                      {esEmisor ? '-' : '+'} {formatearDinero(tx.monto)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(tx.estado)}`}>
                      {getEstadoTexto(tx.estado)}
                    </span>
                    <p className="text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <p className="text-gray-400 text-xs font-mono">Ref: {tx._id.slice(-8).toUpperCase()}</p>
                    <button onClick={(e) => { e.stopPropagation(); abrirAclaracion(tx); }} className="flex items-center gap-1 text-xs text-blue-700 font-semibold hover:text-blue-900 transition">
                      <AlertCircle size={14} /> Aclarar/Reportar
                    </button>
                  </div>
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
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Transferencia</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Cuenta</label>
                <input
                  type="text"
                  value={numeroCuentaDestino}
                  onChange={(e) => setNumeroCuentaDestino(e.target.value)}
                  placeholder="Ej: 1234567890"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Beneficiario</label>
                <input
                  type="text"
                  value={nombreBeneficiario}
                  onChange={(e) => setNombreBeneficiario(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Banco</label>
                <select
                  value={bancoDestino}
                  onChange={(e) => setBancoDestino(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value={NOMBRE_APP}>{NOMBRE_APP}</option>
                  <option value="BBVA">BBVA</option>
                  <option value="Banorte">Banorte</option>
                  <option value="Santander">Santander</option>
                  <option value="HSBC">HSBC</option>
                  <option value="Citibanamex">Citibanamex</option>
                  <option value="Scotiabank">Scotiabank</option>
                  <option value="Banco Azteca">Banco Azteca</option>
                  <option value="Inbursa">Inbursa</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Concepto</label>
                <input
                  type="text"
                  value={conceptoTransferencia}
                  onChange={(e) => setConceptoTransferencia(e.target.value)}
                  placeholder="Ej: Pago de renta"
                  maxLength={40}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto</label>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="$0.00"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
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
                  className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Procesando...' : 'Transferir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tarjeta Virtual */}
      {showTarjeta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center">Mi Tarjeta Virtual</h3>

            <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 rounded-2xl p-8 text-white shadow-2xl mb-6">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <p className="text-blue-100 text-sm mb-2">Número de Tarjeta</p>
                  <p className="text-white font-mono text-2xl tracking-wider">{usuario.tarjetaVirtual?.numero ? usuario.tarjetaVirtual.numero.slice(0, 4) + ' ' + usuario.tarjetaVirtual.numero.slice(4, 8) + ' ' + usuario.tarjetaVirtual.numero.slice(8, 12) + ' ' + usuario.tarjetaVirtual.numero.slice(12, 16) : '•••• •••• •••• ••••'}</p>
                </div>
                <CreditCard size={40} className="text-blue-100" />
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-blue-100 text-xs mb-1">Titular</p>
                  <p className="text-white font-semibold text-sm">{usuario.tarjetaVirtual?.nombreTitular || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-xs mb-1">Vencimiento</p>
                  <p className="text-white font-mono text-sm">{usuario.tarjetaVirtual?.fechaVencimiento ? `${String(new Date(usuario.tarjetaVirtual.fechaVencimiento).getMonth() + 1).padStart(2, '0')}/${new Date(usuario.tarjetaVirtual.fechaVencimiento).getFullYear().toString().slice(-2)}` : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Código de Seguridad (CVV)</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{showCVVModal ? usuario.tarjetaVirtual?.cvv || '***' : '***'}</p>
                </div>
                <button onClick={() => setShowCVVModal(!showCVVModal)} className="p-2 hover:bg-gray-200 rounded-lg transition">
                  {showCVVModal ? <Eye size={24} className="text-gray-700" /> : <EyeOff size={24} className="text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mb-6 text-xs text-blue-800">
              <p className="font-semibold mb-1">💡 Información Importante</p>
              <p>Esta es una tarjeta virtual segura para compras en línea. No la compartas con nadie.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowTarjeta(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                Cerrar
              </button>
              <button onClick={() => navigator.clipboard.writeText(usuario.tarjetaVirtual?.numero || '')} className="flex-1 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2">
                <Copy size={18} /> Copiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mi Cuenta */}
      {showCuenta && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Mi Cuenta</h3>
              <button onClick={() => setShowCuenta(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Nombre del titular</p>
                <p className="font-bold text-gray-900 text-lg">{usuario.nombre}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Número de Cuenta</p>
                    <p className="font-mono font-bold text-gray-900 text-lg">{usuario.numeroCuenta}</p>
                  </div>
                  <button onClick={copiarCuenta} className="p-2 hover:bg-blue-100 rounded-lg transition">
                    {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-blue-700" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Cliente desde</p>
                <p className="font-semibold text-gray-900">{usuario.createdAt ? formatearFechaCorta(usuario.createdAt) : 'N/A'}</p>
              </div>

              <button
                onClick={() => { setShowCuenta(false); setShowEstadoCuenta(true); }}
                className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-700" size={22} />
                  <span className="font-semibold text-gray-900">Ver Estado de Cuenta</span>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estado de Cuenta */}
      {showEstadoCuenta && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto" style={{ maxHeight: '90vh' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Estado de Cuenta</h3>
              <button onClick={() => setShowEstadoCuenta(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-4 text-white mb-4">
              <p className="text-xs text-blue-100">Titular: {usuario.nombre}</p>
              <p className="text-xs text-blue-100">Cuenta: {usuario.numeroCuenta}</p>
              <p className="text-xs text-blue-100 mt-1">Periodo: {formatearFechaCorta(usuario.createdAt || new Date())} - {formatearFechaCorta(new Date())}</p>
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-blue-100 text-xs">Saldo Actual</p>
                <p className="text-2xl font-bold">{formatearDinero(usuario.saldo)}</p>
              </div>
            </div>

            <p className="font-bold text-gray-900 mb-3">Movimientos</p>
            {transacciones.length > 0 ? (
              <div className="space-y-2">
                {transacciones.map(tx => {
                  const esEmisor = tx.emisorId === usuario._id;
                  return (
                    <div key={tx._id} className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{esEmisor ? `Envío a ${tx.receptorNombre}` : `Depósito de ${tx.emisor.nombre}`}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString('es-MX')}</p>
                        <p className="text-xs text-gray-400 font-mono">Ref: {tx._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <p className={`font-bold text-sm ${esEmisor ? 'text-red-600' : 'text-green-600'}`}>
                        {esEmisor ? '-' : '+'}{formatearDinero(tx.monto)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay movimientos en este periodo</p>
            )}
          </div>
        </div>
      )}

      {/* Modal Detalle de Transacción - Estilo Ticket */}
      {showDetalleTx && txDetalle && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDetalleTx(false)}>
          <div className="bg-gray-50 w-full rounded-t-3xl max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const esEmisor = txDetalle.emisorId === usuario._id;
              return (
                <div className="p-6 pb-10">
                  <div className="flex justify-end">
                    <button onClick={() => setShowDetalleTx(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                      <X size={22} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center mb-6 -mt-2">
                    <div className="w-20 h-20 rounded-full bg-white shadow flex items-center justify-center mb-4">
                      <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={32} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {txDetalle.estado === 'pendiente' ? '¡Tu transferencia está en proceso!' : '¡Tu transferencia fue exitosa!'}
                    </h3>
                  </div>

                  <p className="text-center text-gray-500 font-semibold mb-1">{esEmisor ? 'Envié' : 'Recibí'}</p>
                  <p className="text-center text-4xl font-bold text-gray-900 mb-6">
                    {formatearDinero(txDetalle.monto)} <span className="text-lg text-gray-400 font-semibold">MXN</span>
                  </p>

                  <div className="bg-white rounded-2xl shadow p-5 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-2">Desde</p>
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2">
                          <Wallet className="text-blue-700" size={22} />
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{esEmisor ? usuario.nombre : txDetalle.emisor.nombre}</p>
                        <p className="text-xs text-gray-400 mt-1">Cuenta ****{(esEmisor ? usuario.numeroCuenta : txDetalle.emisor.numeroCuenta || '').slice(-4)}</p>
                      </div>
                      <div className="text-center border-l border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">Para</p>
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-2">
                          <ArrowUpRight className="text-gray-600" size={22} />
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{esEmisor ? txDetalle.receptorNombre : usuario.nombre}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {esEmisor ? (txDetalle.bancoDestino || NOMBRE_APP) : NOMBRE_APP} ****{(esEmisor ? txDetalle.receptorNumeroCuenta : usuario.numeroCuenta || '').slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow p-5 space-y-3">
                    {txDetalle.descripcion && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400 text-sm">Concepto</span>
                        <span className="text-gray-900 font-semibold text-sm text-right max-w-[60%]">{txDetalle.descripcion}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-gray-400 text-sm">Estado</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(txDetalle.estado)}`}>{getEstadoTexto(txDetalle.estado)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Fecha</span>
                      <span className="text-gray-900 font-semibold text-sm">{new Date(txDetalle.createdAt).toLocaleString('es-MX')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Referencia</span>
                      <span className="text-gray-900 font-mono font-semibold text-sm">{txDetalle._id.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowDetalleTx(false); abrirAclaracion(txDetalle); }}
                    className="w-full mt-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={18} /> Aclarar este movimiento
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Aclaración */}
      {showAclaracion && txSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Aclarar Movimiento</h3>
            <p className="text-xs text-gray-500 font-mono mb-6">Referencia: {txSeleccionada._id.slice(-8).toUpperCase()}</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Monto: <span className="font-bold text-gray-900">{formatearDinero(txSeleccionada.monto)}</span></p>
              <p className="text-sm text-gray-600">Fecha: <span className="font-bold text-gray-900">{new Date(txSeleccionada.createdAt).toLocaleString('es-MX')}</span></p>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">¿Cuál es el motivo de tu aclaración?</label>
            <textarea
              value={descripcionAclaracion}
              onChange={(e) => setDescripcionAclaracion(e.target.value)}
              placeholder="Describe brevemente el problema con este movimiento..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-4"
            />

            <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <Phone className="text-blue-700" size={22} />
              <div>
                <p className="text-xs text-blue-700">¿Necesitas ayuda inmediata? Llama a soporte:</p>
                <p className="font-bold text-blue-900">{telefonoSoporte}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAclaracion(false); setTxSeleccionada(null); }}
                className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarAclaracion}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Enviando...' : 'Enviar Aclaración'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Solicitud de Crédito */}
      {showCreditoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
            {creditoProcesando ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Analizando tu solicitud</h3>
                <p className="text-gray-500 text-sm">Estamos evaluando tu perfil para {creditoNombre}...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Solicitud no aprobada</h3>
                <p className="text-gray-500 text-sm mb-6">Por el momento no eres apto para {creditoNombre}. Intenta nuevamente más adelante.</p>
                <button
                  onClick={() => setShowCreditoModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 transition"
                >
                  Entendido
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ADMIN DASHBOARD ============
function AdminDashboard({ usuario, logout, token, esMaster }) {
  const [tab, setTab] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [aclaraciones, setAclaraciones] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [telefonoSoporte, setTelefonoSoporte] = useState('');
  const [showNuevo, setShowNuevo] = useState(false);
  const [showDeposito, setShowDeposito] = useState(false);
  const [showEditarCliente, setShowEditarCliente] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [saldo, setSaldo] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [clienteSelectId, setClienteSelectId] = useState('');
  const [montoDeposito, setMontoDeposito] = useState('');
  const [nuevaPassCliente, setNuevaPassCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Estados para gestión de administradores (solo master)
  const [showNuevoAdmin, setShowNuevoAdmin] = useState(false);
  const [showEditarAdmin, setShowEditarAdmin] = useState(false);
  const [adminEditando, setAdminEditando] = useState(null);
  const [adminNombre, setAdminNombre] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminContraseña, setAdminContraseña] = useState('');

  // Estados para editar/eliminar transacciones (solo master)
  const [showEditarTx, setShowEditarTx] = useState(false);
  const [txEditando, setTxEditando] = useState(null);
  const [txMonto, setTxMonto] = useState('');
  const [txEstado, setTxEstado] = useState('pendiente');
  const [txDescripcion, setTxDescripcion] = useState('');

  // Estados para cambiar mi propia contraseña
  const [showCambiarPass, setShowCambiarPass] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');

  const loadData = async () => {
    setLoadingData(true);
    try {
      const peticiones = [
        fetch(`${apiUrl}/admin/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/admin/transacciones`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/admin/aclaraciones`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/configuracion`, { headers: { 'Authorization': `Bearer ${token}` } })
      ];
      if (esMaster) {
        peticiones.push(fetch(`${apiUrl}/master/admins`, { headers: { 'Authorization': `Bearer ${token}` } }));
      }

      const [cRes, txRes, acRes, cfgRes, adminsRes] = await Promise.all(peticiones);

      const c = await cRes.json();
      const tx = await txRes.json();
      const ac = await acRes.json();
      const cfg = await cfgRes.json();

      if (Array.isArray(c)) setClientes(c);
      if (Array.isArray(tx)) setTransacciones(tx);
      if (Array.isArray(ac)) setAclaraciones(ac);
      if (cfg.telefonoSoporte) setTelefonoSoporte(cfg.telefonoSoporte);

      if (esMaster && adminsRes) {
        const ad = await adminsRes.json();
        if (Array.isArray(ad)) setAdmins(ad);
      }
    } catch (error) {
      console.error('Error:', error);
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

  const resetDeposito = () => {
    setShowDeposito(false);
    setClienteSelectId('');
    setMontoDeposito('');
  };

  const abrirEditar = (cliente) => {
    setClienteEditando(cliente);
    setNombre(cliente.nombre);
    setEmail(cliente.email);
    setSaldo(cliente.saldo.toString());
    setNumeroCuenta(cliente.numeroCuenta);
    setNuevaPassCliente('');
    setShowEditarCliente(true);
  };

  const resetEditar = () => {
    setShowEditarCliente(false);
    setClienteEditando(null);
    setNombre('');
    setEmail('');
    setSaldo('');
    setNumeroCuenta('');
    setNuevaPassCliente('');
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
        alert('✅ Cliente creado');
        resetForm();
        await loadData();
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const editarCliente = async () => {
    if (!nombre || !email || saldo === '') {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const body = { nombre, email, saldo: parseFloat(saldo) };
      if (esMaster && nuevaPassCliente) body.contraseña = nuevaPassCliente;

      const res = await fetch(`${apiUrl}/admin/clientes/${clienteEditando._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('✅ Cliente actualizado');
        resetEditar();
        await loadData();
      } else {
        alert('Error al actualizar');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const editarNumeroCuenta = async () => {
    if (!numeroCuenta) {
      alert('Ingresa el nuevo número de cuenta');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/clientes/${clienteEditando._id}/numeroCuenta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nuevoCuenta: numeroCuenta })
      });

      if (res.ok) {
        alert('✅ Número de cuenta actualizado');
        resetEditar();
        await loadData();
      } else {
        alert('Error: Número de cuenta ya existe o inválido');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar este cliente permanentemente?')) return;

    try {
      const res = await fetch(`${apiUrl}/admin/clientes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert('✅ Cliente eliminado');
        await loadData();
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const hacerDeposito = async () => {
    if (!clienteSelectId || !montoDeposito) {
      alert('Selecciona cliente y monto');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/deposito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clienteId: clienteSelectId, monto: parseFloat(montoDeposito), descripcion: 'Depósito admin' })
      });

      if (res.ok) {
        alert('✅ Depósito realizado');
        resetDeposito();
        await loadData();
      } else {
        alert('Error al hacer depósito');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarTelefono = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ telefonoSoporte })
      });
      if (res.ok) {
        alert('✅ Teléfono de soporte actualizado');
      } else {
        alert('Error al actualizar');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarRevisado = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/admin/aclaraciones/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ===== GESTIÓN DE ADMINISTRADORES (solo master) =====
  const resetNuevoAdmin = () => {
    setShowNuevoAdmin(false);
    setAdminNombre('');
    setAdminEmail('');
    setAdminContraseña('');
  };

  const crearAdmin = async () => {
    if (!adminNombre || !adminEmail || !adminContraseña) {
      alert('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/master/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: adminNombre, email: adminEmail, contraseña: adminContraseña })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Administrador creado');
        resetNuevoAdmin();
        await loadData();
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirEditarAdmin = (admin) => {
    setAdminEditando(admin);
    setAdminNombre(admin.nombre);
    setAdminEmail(admin.email);
    setAdminContraseña('');
    setShowEditarAdmin(true);
  };

  const resetEditarAdmin = () => {
    setShowEditarAdmin(false);
    setAdminEditando(null);
    setAdminNombre('');
    setAdminEmail('');
    setAdminContraseña('');
  };

  const guardarEditarAdmin = async () => {
    setLoading(true);
    try {
      const body = { nombre: adminNombre, email: adminEmail };
      if (adminContraseña) body.contraseña = adminContraseña;
      const res = await fetch(`${apiUrl}/master/admins/${adminEditando._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert('✅ Administrador actualizado');
        resetEditarAdmin();
        await loadData();
      } else {
        alert('Error al actualizar');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarAdmin = async (id) => {
    if (!window.confirm('¿Eliminar este administrador permanentemente?')) return;
    try {
      const res = await fetch(`${apiUrl}/master/admins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('✅ Administrador eliminado');
        await loadData();
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ===== EDITAR / ELIMINAR TRANSACCIONES (solo master) =====
  const abrirEditarTx = (tx) => {
    setTxEditando(tx);
    setTxMonto(tx.monto.toString());
    setTxEstado(tx.estado);
    setTxDescripcion(tx.descripcion || '');
    setShowEditarTx(true);
  };

  const resetEditarTx = () => {
    setShowEditarTx(false);
    setTxEditando(null);
    setTxMonto('');
    setTxEstado('pendiente');
    setTxDescripcion('');
  };

  const guardarEditarTx = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/master/transacciones/${txEditando._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ monto: parseFloat(txMonto), estado: txEstado, descripcion: txDescripcion })
      });
      if (res.ok) {
        alert('✅ Transacción actualizada');
        resetEditarTx();
        await loadData();
      } else {
        alert('Error al actualizar la transacción');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarTx = async (id) => {
    if (!window.confirm('¿Eliminar esta transacción permanentemente? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${apiUrl}/master/transacciones/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('✅ Transacción eliminada');
        await loadData();
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ===== CAMBIAR MI PROPIA CONTRASEÑA =====
  const resetCambiarPass = () => {
    setShowCambiarPass(false);
    setPassActual('');
    setPassNueva('');
    setPassConfirmar('');
  };

  const guardarNuevaPass = async () => {
    if (!passActual || !passNueva || !passConfirmar) {
      alert('Completa todos los campos');
      return;
    }
    if (passNueva.length < 8) {
      alert('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (passNueva !== passConfirmar) {
      alert('La nueva contraseña y su confirmación no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/perfil/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ actual: passActual, nueva: passNueva })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Contraseña actualizada. Úsala la próxima vez que inicies sesión.');
        resetCambiarPass();
      } else {
        alert('Error: ' + (data.error || 'No se pudo actualizar'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{esMaster ? 'Panel Master 👑' : 'Panel Admin'}</h1>
          <div className="flex gap-2">
            {esMaster && (
              <button onClick={() => setShowCambiarPass(true)} className="p-2 hover:bg-white/20 rounded-lg transition" title="Cambiar mi contraseña">
                <Settings size={22} />
              </button>
            )}
            <button onClick={logout} className="p-2 hover:bg-white/20 rounded-lg transition">
              <LogOut size={24} />
            </button>
          </div>
        </div>
        <p className="text-white/80">Bienvenido, {usuario.nombre}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setTab('clientes')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'clientes' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700'}`}
        >
          Clientes ({clientes.length})
        </button>
        <button
          onClick={() => setTab('transacciones')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'transacciones' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700'}`}
        >
          Transacciones ({transacciones.length})
        </button>
        <button
          onClick={() => setTab('aclaraciones')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'aclaraciones' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700'}`}
        >
          Aclaraciones ({aclaraciones.filter(a => a.estado === 'pendiente').length})
        </button>
        <button
          onClick={() => setTab('configuracion')}
          className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${tab === 'configuracion' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700'}`}
        >
          <Settings size={16} /> Config
        </button>
        {esMaster && (
          <button
            onClick={() => setTab('administradores')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'administradores' ? 'bg-blue-900 text-white' : 'bg-white text-blue-900 border-2 border-blue-900'}`}
          >
            👑 Administradores ({admins.length})
          </button>
        )}
      </div>

      {/* Content */}
      {tab === 'clientes' && (
        <div className="p-4">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowNuevo(true)}
              className="flex-1 bg-gradient-to-r from-blue-800 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-900 hover:to-blue-700 transition"
            >
              <Plus size={20} /> Crear Cliente
            </button>
            <button
              onClick={() => setShowDeposito(true)}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition"
            >
              <Plus size={20} /> Depósito
            </button>
          </div>

          {loadingData ? (
            <p className="text-gray-500 text-center py-8">Cargando...</p>
          ) : clientes.length > 0 ? (
            <div className="space-y-3">
              {clientes.map(c => (
                <div key={c._id} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{c.nombre}</p>
                      <p className="text-gray-500 text-sm">{c.email}</p>
                      <p className="text-gray-400 text-xs font-mono mt-1">Cuenta: {c.numeroCuenta}</p>
                    </div>
                    <p className="font-bold text-blue-700 text-lg">{formatearDinero(c.saldo)}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => abrirEditar(c)} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition flex items-center justify-center gap-2">
                      <Edit size={16} /> Editar
                    </button>
                    <button onClick={() => eliminarCliente(c._id)} className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Eliminar
                    </button>
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
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{tx.emisor.nombre || 'Admin'} → {tx.receptorNombre}</p>
                      <p className="text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      <p className="text-gray-400 text-xs font-mono">Ref: {tx._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatearDinero(tx.monto)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${tx.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {tx.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Completada'}
                      </span>
                    </div>
                  </div>
                  {esMaster && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button onClick={() => abrirEditarTx(tx)} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition flex items-center justify-center gap-2 text-sm">
                        <Edit size={14} /> Editar
                      </button>
                      <button onClick={() => eliminarTx(tx._id)} className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition flex items-center justify-center gap-2 text-sm">
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay transacciones</p>
          )}
        </div>
      )}

      {tab === 'aclaraciones' && (
        <div className="p-4">
          {loadingData ? (
            <p className="text-gray-500 text-center py-8">Cargando...</p>
          ) : aclaraciones.length > 0 ? (
            <div className="space-y-3">
              {aclaraciones.map(ac => (
                <div key={ac._id} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{ac.clienteNombre}</p>
                      <p className="text-gray-400 text-xs">{new Date(ac.createdAt).toLocaleString('es-MX')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${ac.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {ac.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Revisado'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 mb-3">{ac.descripcion}</p>
                  {ac.estado === 'pendiente' && (
                    <button onClick={() => marcarRevisado(ac._id)} className="w-full py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition">
                      Marcar como Revisado
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay aclaraciones</p>
          )}
        </div>
      )}

      {tab === 'configuracion' && (
        <div className="p-4">
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-bold text-gray-900 mb-4">Configuración General</h3>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📞 Teléfono de Soporte</label>
            <p className="text-xs text-gray-500 mb-3">Este número se muestra a los clientes cuando reportan un movimiento.</p>
            <input
              type="text"
              value={telefonoSoporte}
              onChange={(e) => setTelefonoSoporte(e.target.value)}
              placeholder="01-800-000-0000"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-4"
            />
            <button
              onClick={guardarTelefono}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {tab === 'administradores' && esMaster && (
        <div className="p-4">
          <div className="bg-blue-900 text-white rounded-xl p-4 mb-4 text-sm">
            👑 Como usuario Master, tú controlas a todos los administradores y puedes editar o eliminar cualquier transacción del sistema.
          </div>
          <button
            onClick={() => setShowNuevoAdmin(true)}
            className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white py-3 rounded-lg font-semibold mb-6 flex items-center justify-center gap-2 hover:from-blue-950 hover:to-blue-800 transition"
          >
            <Plus size={20} /> Crear Administrador
          </button>

          {loadingData ? (
            <p className="text-gray-500 text-center py-8">Cargando...</p>
          ) : admins.length > 0 ? (
            <div className="space-y-3">
              {admins.map(a => (
                <div key={a._id} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{a.nombre}</p>
                      <p className="text-gray-500 text-sm">{a.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">Admin</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => abrirEditarAdmin(a)} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition flex items-center justify-center gap-2">
                      <Edit size={16} /> Editar
                    </button>
                    <button onClick={() => eliminarAdmin(a._id)} className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay administradores creados</p>
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
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="password"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
                placeholder="Saldo inicial"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
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
                  className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {showEditarCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-8 text-gray-900">Editar Cliente: {clienteEditando?.nombre}</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">✉️ Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: juan@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Saldo Actual</label>
                <input
                  type="number"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  placeholder="Ej: 5000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🏦 Número de Cuenta</label>
                <input
                  type="text"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="Ej: 1234567890"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Actual: {clienteEditando?.numeroCuenta}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">💳 Tarjeta Virtual</p>
                <p className="text-xs text-blue-700">Número: {clienteEditando?.tarjetaVirtual?.numero ? `${clienteEditando.tarjetaVirtual.numero.slice(0, 4)} **** **** ${clienteEditando.tarjetaVirtual.numero.slice(-4)}` : 'N/A'}</p>
                <p className="text-xs text-blue-700">Vencimiento: {clienteEditando?.tarjetaVirtual?.fechaVencimiento ? new Date(clienteEditando.tarjetaVirtual.fechaVencimiento).toLocaleDateString() : 'N/A'}</p>
              </div>

              {esMaster && (
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <label className="block text-sm font-semibold text-yellow-900 mb-2">🔒 Resetear contraseña (solo Master)</label>
                  <input
                    type="password"
                    value={nuevaPassCliente}
                    onChange={(e) => setNuevaPassCliente(e.target.value)}
                    placeholder="Dejar vacío para no cambiarla"
                    className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none bg-white"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={resetEditar}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={() => editarNumeroCuenta()}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  🏦 Actualizar Cuenta
                </button>
                <button
                  onClick={editarCliente}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 disabled:opacity-50 transition"
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Depósito */}
      {showDeposito && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Hacer Depósito</h3>
            <div className="space-y-3">
              <select
                value={clienteSelectId}
                onChange={(e) => setClienteSelectId(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Selecciona cliente</option>
                {clientes.map(c => (
                  <option key={c._id} value={c._id}>{c.nombre} ({c.email})</option>
                ))}
              </select>
              <input
                type="number"
                value={montoDeposito}
                onChange={(e) => setMontoDeposito(e.target.value)}
                placeholder="Monto a depositar"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetDeposito}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={hacerDeposito}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Procesando...' : 'Depositar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Administrador (solo master) */}
      {showNuevoAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">👑 Crear Administrador</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={adminNombre}
                onChange={(e) => setAdminNombre(e.target.value)}
                placeholder="Nombre completo"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="password"
                value={adminContraseña}
                onChange={(e) => setAdminContraseña(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetNuevoAdmin}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearAdmin}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-950 hover:to-blue-800 disabled:opacity-50 transition"
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Administrador (solo master) */}
      {showEditarAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">👑 Editar Administrador</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={adminNombre}
                  onChange={(e) => setAdminNombre(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  value={adminContraseña}
                  onChange={(e) => setAdminContraseña(e.target.value)}
                  placeholder="Dejar vacío para no cambiarla"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetEditarAdmin}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEditarAdmin}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-950 hover:to-blue-800 disabled:opacity-50 transition"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Transacción (solo master) */}
      {showEditarTx && txEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">👑 Editar Transacción</h3>
            <p className="text-xs text-gray-500 font-mono mb-6">Ref: {txEditando._id.slice(-8).toUpperCase()}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto</label>
                <input
                  type="number"
                  value={txMonto}
                  onChange={(e) => setTxMonto(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  value={txEstado}
                  onChange={(e) => setTxEstado(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Concepto</label>
                <input
                  type="text"
                  value={txDescripcion}
                  onChange={(e) => setTxDescripcion(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetEditarTx}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEditarTx}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-950 hover:to-blue-800 disabled:opacity-50 transition"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Mi Contraseña */}
      {showCambiarPass && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">🔒 Cambiar mi contraseña</h3>
            <p className="text-xs text-gray-500 mb-6">Recomendado hacerlo la primera vez que inicias sesión con una contraseña por defecto.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña actual</label>
                <input
                  type="password"
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva contraseña</label>
                <input
                  type="password"
                  value={passNueva}
                  onChange={(e) => setPassNueva(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={passConfirmar}
                  onChange={(e) => setPassConfirmar(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetCambiarPass}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarNuevaPass}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
