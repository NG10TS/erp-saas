// src/components/onboarding/steps/SriConfigStep.tsx
// Paso 5 del wizard (entre PlanSelection y CreateSale)
// Permite subir certificado digital .p12, validarlo y guardar env SRI

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Upload, Eye, EyeOff, AlertTriangle,
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, X,
  Calendar, Fingerprint, Building2, TestTube2, Globe
} from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

interface CertInfo {
  valid: boolean;
  subject?: string;
  issuer?: string;
  not_valid_after?: string;
  days_until_expiry?: number;
  is_expired?: boolean;
  expires_soon?: boolean;
  fingerprint_sha256?: string;
  certificate_b64?: string;
}

const API = import.meta.env.VITE_API_URL ?? '';

export const SriConfigStep: React.FC<Props> = ({ onNext, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [environment, setEnvironment] = useState<'1' | '2'>('1');
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().match(/\.(p12|pfx)$/)) {
      setError('Solo se aceptan archivos .p12 o .pfx');
      return;
    }
    setFile(f);
    setCertInfo(null);
    setSaved(false);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const validate = async () => {
    if (!file || !password) {
      setError('Sube tu certificado e ingresa la contraseña');
      return;
    }
    setValidating(true);
    setError(null);
    setCertInfo(null);

    const form = new FormData();
    form.append('certificate', file);
    form.append('password', password);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API}/api/v1/onboarding/sri/validate-certificate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? 'Error al validar el certificado');
      }

      const data: CertInfo = await res.json();
      setCertInfo(data);

      if (data.is_expired) {
        setError('El certificado ha expirado. Renuévalo en el BCE o en tu autoridad certificadora.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado');
    } finally {
      setValidating(false);
    }
  };

  const save = async () => {
    if (!certInfo?.certificate_b64) return;
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API}/api/v1/onboarding/sri/save-certificate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificate_b64: certInfo.certificate_b64,
          password,
          environment,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? 'Error al guardar el certificado');
      }

      setSaved(true);
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const canValidate = !!file && password.length > 0 && !validating;
  const canSave = certInfo?.valid && !certInfo.is_expired && !saved && !saving;
  const canContinue = saved || certInfo?.valid;

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-EC', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="py-10 px-6 md:px-12">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Firma Electrónica SRI</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Configura tu certificado digital para emitir comprobantes electrónicos válidos.
        </p>
      </motion.div>

      <div className="max-w-xl mx-auto space-y-6">

        {/* ── Drop zone ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Certificado digital (.p12 / .pfx)
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${dragging ? 'border-blue-400 bg-blue-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'}`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".p12,.pfx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setCertInfo(null); setSaved(false); }}
                  className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">
                  Arrastra tu archivo aquí o <span className="text-blue-600">haz clic para buscar</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Solo .p12 o .pfx — máx. 5 MB</p>
              </>
            )}
          </div>
        </motion.div>

        {/* ── Password ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Contraseña del certificado
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setCertInfo(null); setSaved(false); }}
              placeholder="Ingresa la contraseña de tu archivo .p12"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* ── Validate button ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            type="button"
            onClick={validate}
            disabled={!canValidate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {validating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Validando firma SHA-256…</>
            ) : (
              <><ShieldCheck className="w-5 h-5" /> Validar certificado</>
            )}
          </button>
        </motion.div>

        {/* ── Error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700"
          >
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* ── Cert info card ── */}
        {certInfo?.valid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Certificado válido — SHA-256 confirmado
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="Titular">
                {certInfo.subject?.match(/CN=([^,]+)/)?.[1] ?? certInfo.subject}
              </InfoRow>
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Expira">
                {formatDate(certInfo.not_valid_after)}
                {certInfo.expires_soon && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    Expira pronto ({certInfo.days_until_expiry}d)
                  </span>
                )}
              </InfoRow>
              <InfoRow icon={<Fingerprint className="w-4 h-4" />} label="Huella SHA-256">
                <span className="font-mono text-xs break-all">
                  {certInfo.fingerprint_sha256?.match(/.{1,8}/g)?.join(' ')}
                </span>
              </InfoRow>
            </div>

            {/* ── Environment selector ── */}
            <div className="pt-3 border-t border-emerald-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ambiente SRI
              </label>
              <div className="grid grid-cols-2 gap-3">
                <EnvButton
                  active={environment === '1'}
                  onClick={() => setEnvironment('1')}
                  icon={<TestTube2 className="w-4 h-4" />}
                  label="Pruebas"
                  sub="Para desarrollo y testing"
                />
                <EnvButton
                  active={environment === '2'}
                  onClick={() => setEnvironment('2')}
                  icon={<Globe className="w-4 h-4" />}
                  label="Producción"
                  sub="Para facturación real"
                />
              </div>
              {environment === '2' && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
                  ⚠️ En producción las facturas son legalmente vinculantes y se envían al SRI.
                </p>
              )}
            </div>

            {/* ── Save button ── */}
            {!saved && (
              <button
                type="button"
                onClick={save}
                disabled={!canSave}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Guardar configuración SRI</>
                )}
              </button>
            )}

            {saved && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-emerald-300 text-emerald-700 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Certificado guardado correctamente
              </div>
            )}
          </motion.div>
        )}

        {/* ── Skip notice ── */}
        {!certInfo && (
          <p className="text-center text-xs text-gray-400">
            Puedes configurar el certificado más tarde en Configuración → Facturación Electrónica.
          </p>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between gap-4 mt-10 max-w-xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Atrás
        </button>
        <button
          onClick={onNext}
          disabled={false} // siempre se puede continuar (configuración opcional)
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors text-sm shadow-sm disabled:opacity-40"
        >
          {canContinue ? 'Continuar' : 'Omitir por ahora'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className="flex items-start gap-2 text-gray-700">
    <span className="mt-0.5 text-emerald-600">{icon}</span>
    <span className="font-medium min-w-[90px] text-gray-500">{label}:</span>
    <span className="flex-1 flex items-center flex-wrap gap-1">{children}</span>
  </div>
);

const EnvButton: React.FC<{
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; sub: string;
}> = ({ active, onClick, icon, label, sub }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${
      active
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <span className={`mt-0.5 ${active ? 'text-blue-600' : 'text-gray-400'}`}>{icon}</span>
    <div>
      <p className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>
        {label}
      </p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  </button>
);