import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackageCheck,
  Mail,
  AlertTriangle,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const LOGIN_DRAFT_KEY = 'ingelox_login_draft';

interface LoginDraft {
  email: string;
  step: 'email' | 'code';
  infoMessage?: string | null;
}

function getStoredLoginDraft(): LoginDraft | null {
  try {
    const raw = sessionStorage.getItem(LOGIN_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const LoginPage: React.FC = () => {
  const storedDraft = getStoredLoginDraft();
  const [email, setEmail] = useState(storedDraft?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>(storedDraft?.step || 'email');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(storedDraft?.infoMessage || null);

  const { accessDeniedError, clearAccessDenied, session, isInternal } = useAuth();
  const navigate = useNavigate();

  // Redirigir a operaciones y limpiar borrador solo cuando la sesión y el perfil interno estén confirmados
  useEffect(() => {
    if (session && isInternal) {
      try {
        sessionStorage.removeItem(LOGIN_DRAFT_KEY);
      } catch {}
      navigate('/operations', { replace: true });
    }
  }, [session, isInternal, navigate]);

  // Si llega un error de acceso denegado desde AuthContext, desactivar loader del botón
  useEffect(() => {
    if (accessDeniedError) {
      setLoading(false);
    }
  }, [accessDeniedError]);

  // Persistir el borrador para que al cambiar de pestaña no se reinicie
  useEffect(() => {
    try {
      sessionStorage.setItem(
        LOGIN_DRAFT_KEY,
        JSON.stringify({
          email,
          step,
          infoMessage: step === 'code' ? infoMessage : null,
        })
      );
    } catch {
      // Ignorar fallos de cuota o cookies bloqueadas
    }
  }, [email, step, infoMessage]);

  const handleChangeEmail = () => {
    setStep('email');
    setOtpCode('');
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      sessionStorage.setItem(
        LOGIN_DRAFT_KEY,
        JSON.stringify({ email, step: 'email' })
      );
    } catch {
      // Ignorar
    }
  };

  // 1. Validar permisos y enviar código OTP al correo
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

      // A. Validación de rol antes de solicitar el código OTP:
      // Se verifica mediante RPC (con SECURITY DEFINER) para que un usuario no autenticado
      // pueda comprobar si el correo corresponde a un administrador/operador interno activo.
      const { data: isAdmin, error: rpcError } = await supabase.rpc('check_user_is_admin', {
        lookup_email: cleanEmail,
      });

      if (!rpcError && isAdmin === false) {
        setErrorMessage('Acceso denegado: El correo no está registrado o no cuenta con permisos de administrador en Ingelox ERP.');
        setLoading(false);
        return;
      }

      // Si la función RPC no existe aún (ej. antes de ejecutar la migración SQL), fallback con consulta directa
      if (rpcError) {
        console.warn('RPC check_user_is_admin no disponible, ejecutando verificación preventiva:', rpcError);
        const { data: directProfile } = await supabase
          .from('profiles')
          .select('is_internal, status')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (directProfile && (!directProfile.is_internal || directProfile.status === 'inactive')) {
          setErrorMessage('Acceso denegado: El usuario no cuenta con permisos de administrador en Ingelox ERP.');
          setLoading(false);
          return;
        }
      }

      // B. Si cuenta con permisos, solicitar el código OTP por correo
      // Usamos la Edge Function dedicada 'send-otp-erp' para enviar el correo corporativo de Ingelox ERP
      let sentViaFunction = false;
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('send-otp-erp', {
          body: { email: cleanEmail },
        });

        if (!fnError && (fnData as any)?.success) {
          sentViaFunction = true;
        } else if (fnError) {
          let detailedMsg = fnError.message;
          if ((fnError as any).context && typeof (fnError as any).context.json === 'function') {
            try {
              const body = await (fnError as any).context.json();
              if (body?.error) detailedMsg = body.error;
            } catch {}
          }
          if (detailedMsg && !detailedMsg.includes('Failed to send') && !detailedMsg.includes('Not Found') && !detailedMsg.includes('404')) {
            throw new Error(detailedMsg);
          }
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('Acceso denegado') || err.message.includes('El correo'))) {
          throw err;
        }
        console.warn('Edge Function send-otp-erp no disponible, usando signInWithOtp directo:', err);
      }

      if (!sentViaFunction) {
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
    clearAccessDenied();

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = otpCode.trim();

    if (!cleanToken) {
      setErrorMessage('Por favor ingresa el código de 6 dígitos.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        throw new Error('Código inválido o expirado. Verifica el código e intenta nuevamente.');
      }

      // Si verifyOtp fue exitoso, AuthContext procesa la sesión mediante onAuthStateChange.
      // Cuando session && isInternal sea true, el useEffect redirigirá a /operations y limpiará el borrador.
      // Si la cuenta es rechazada, AuthContext activará accessDeniedError.
    } catch (err: any) {
      console.error('Error verificando OTP:', err);
      setErrorMessage(err.message || 'Error al validar código de verificación.');
      setLoading(false);
    }
  };

  const activeError = errorMessage || accessDeniedError;

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans"
         style={{ backgroundColor: 'var(--sidebar-bg)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(243,88,21,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(77,143,196,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Login card */}
      <div className="w-full max-w-[400px] relative z-10 rounded-2xl overflow-hidden"
           style={{ backgroundColor: 'var(--surface-base)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-overlay)' }}>

        {/* Header — franja navy de la marca */}
        <div className="px-8 py-6 flex flex-col items-center text-center"
             style={{ backgroundColor: 'var(--sidebar-bg-deeper)', borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #F35815, #c2410c)', boxShadow: '0 6px 20px rgba(243,88,21,0.4)' }}>
            <PackageCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold tracking-tight text-white">INGELOX ERP</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-orange-300"
                  style={{ backgroundColor: 'rgba(243,88,21,0.2)', border: '1px solid rgba(243,88,21,0.35)' }}>
              OPERATIVO
            </span>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--nav-text)' }}>
            Centro de trabajo exclusivo para colaboradores internos
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-7 space-y-5">


          {/* Error / Info */}
          {activeError && (
            <div className="flex items-start gap-3 rounded-xl p-3"
                 style={{ backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-danger)' }} />
              <div className="text-[11px] leading-relaxed" style={{ color: 'var(--color-danger)' }}>{activeError}</div>
            </div>
          )}
          {infoMessage && (
            <div className="flex items-start gap-3 rounded-xl p-3"
                 style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
              <div className="text-[11px] leading-relaxed" style={{ color: 'var(--color-success)' }}>{infoMessage}</div>
            </div>
          )}

          {/* OTP Authentication Flow */}
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="erp-label">Correo corporativo</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-disabled)' }} />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@ingelox.com.co"
                    className="erp-input pl-10 py-2.5 text-sm"
                  />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Te enviaremos un código de acceso de 6 dígitos.
                </p>
              </div>
              <button type="submit" disabled={loading} className="erp-btn-primary w-full py-2.5 text-sm">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando permisos...</span>
                  </>
                ) : (
                  <>
                    <span>Solicitar Código OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="erp-label mb-0">Código de 6 dígitos</label>
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-[11px] font-semibold"
                    style={{ color: 'var(--brand-orange-text)' }}
                  >
                    Cambiar correo
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-disabled)' }} />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="· · · · · ·"
                    className="erp-input pl-10 py-2.5 text-sm font-mono tracking-[0.5em] text-center"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="erp-btn-primary w-full py-2.5 text-sm">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs inline-flex items-center gap-1.5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            ¿Cliente?{' '}
            <a
              href="https://como-va-mi-carga.ingelox.com.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: 'var(--brand-orange-text)' }}
            >
              Portal de Seguimiento
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
