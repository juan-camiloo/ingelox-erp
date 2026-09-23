import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackageCheck,
  Lock,
  Mail,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  KeyRound,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { accessDeniedError, clearAccessDenied } = useAuth();
  const navigate = useNavigate();

  // 1. Enviar código OTP al correo
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    clearAccessDenied();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Por favor ingresa tu correo corporativo.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
      });

      if (error) {
        if (error.message.includes('Signups not allowed for otp') || error.message.includes('User not found')) {
          throw new Error('El correo ingresado no está registrado en el sistema.');
        }
        throw error;
      }

      setInfoMessage(`Se ha enviado un código de acceso de 6 dígitos a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`);
      setStep('code');
    } catch (err: any) {
      console.error('Error enviando código OTP:', err);
      setErrorMessage(err.message || 'Error al enviar código de acceso.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificar código OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = otpCode.trim();

    if (!cleanToken) {
      setErrorMessage('Por favor ingresa el código de 6 dígitos.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        throw new Error('Código inválido o expirado. Verifica el código e intenta nuevamente.');
      }

      if (data?.session) {
        navigate('/operations');
      }
    } catch (err: any) {
      console.error('Error verificando OTP:', err);
      setErrorMessage(err.message || 'Error al validar código de verificación.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Inicio con contraseña
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    clearAccessDenied();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor ingresa correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        navigate('/operations');
      }
    } catch (err: any) {
      console.error('Error signing in with password:', err);
      let msg = err.message || 'Error al iniciar sesión';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Credenciales inválidas. Verifica tu correo y contraseña, o ingresa con código al correo.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const activeError = errorMessage || accessDeniedError;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-orange to-orange-500 flex items-center justify-center shadow-xl shadow-brand-orange/25 mb-4">
            <PackageCheck className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-white">INGELOX ERP</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
              OPERATIVO
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Centro de trabajo y control de tráfico interno
          </p>
        </div>

        {/* Security Badge Notice */}
        <div className="mb-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-left text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Acceso Restringido:</span> Exclusivo para operadores y personal interno registrado de Ingelox.
          </div>
        </div>

        {/* Messages */}
        {activeError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">{activeError}</div>
          </div>
        )}

        {infoMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="flex-1">{infoMessage}</div>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('otp');
              setStep('email');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg font-semibold transition-all ${
              authMethod === 'otp'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Código al Correo (OTP)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg font-semibold transition-all ${
              authMethod === 'password'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Contraseña
          </button>
        </div>

        {/* FORMS */}
        {authMethod === 'otp' ? (
          step === 'email' ? (
            /* STEP 1: Enter email */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-left">
                  Correo Corporativo Registrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@ingelox.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1.5 block text-left">
                  Recibirás un código de 6 dígitos en tu bandeja de entrada.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando código...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Código de Acceso</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Enter 6-digit OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Código de 6 dígitos
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-[11px] text-brand-orange hover:underline"
                  >
                    Cambiar correo
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono tracking-widest text-center placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Validar e Ingresar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>¿No recibiste el código? Reenviar</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* PASSWORD FORM */
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-left">
                Correo Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operaciones@ingelox.com"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-left">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando acceso...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Customer Portal Link */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            ¿Eres cliente y deseas rastrear tu carga?
          </p>
          <a
            href="https://como-va-mi-carga.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-orange hover:text-orange-400 font-semibold mt-1 transition-colors"
          >
            Ir al Portal de Clientes
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
