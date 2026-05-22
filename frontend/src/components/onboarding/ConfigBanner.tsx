// frontend/src/components/onboarding/ConfigBanner.tsx
import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ConfigBannerProps {
  business: any;
}

export const ConfigBanner: React.FC<ConfigBannerProps> = ({ business }) => {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const missingItems = [];

  if (business && !business.sri_has_digital_certificate) {
    missingItems.push({
      id: 'certificate',
      title: 'Certificado SRI pendiente',
      description: 'Configura tu firma electrónica para facturar automáticamente.',
      link: '/app/settings?sri=true',
      severity: 'warning',
    });
  }

  if (business && !business.whatsapp_business_phone) {
    missingItems.push({
      id: 'whatsapp',
      title: 'WhatsApp Business no configurado',
      description: 'Conecta tu WhatsApp para recibir pedidos automáticos.',
      link: '/app/settings?whatsapp=true',
      severity: 'info',
    });
  }

  const visibleItems = missingItems.filter(item => !dismissed.includes(item.id));

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className={`flex items-center justify-between p-4 rounded-lg border ${
            item.severity === 'warning'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${item.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={item.link}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Configurar
            </Link>
            <button
              onClick={() => setDismissed([...dismissed, item.id])}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};