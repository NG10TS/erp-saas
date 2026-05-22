import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Plan {
  name: string;
  price: number;
  period: string;
  users: number | string;
  products: number | string;
  invoices: number | string;
  whatsapp: boolean;
  support: string;
  priceId: string;
}

const plans: Plan[] = [
  {
    name: 'Micro',
    price: 19,
    period: 'mes',
    users: 1,
    products: 100,
    invoices: 50,
    whatsapp: true,
    support: 'Email',
    priceId: 'price_micro_monthly',
  },
  {
    name: 'Startup',
    price: 49,
    period: 'mes',
    users: 3,
    products: 500,
    invoices: 200,
    whatsapp: true,
    support: 'Email + Chat',
    priceId: 'price_startup_monthly',
  },
  {
    name: 'Business',
    price: 99,
    period: 'mes',
    users: 10,
    products: 'Ilimitado',
    invoices: 'Ilimitado',
    whatsapp: true,
    support: 'Prioritario',
    priceId: 'price_business_monthly',
  },
  {
    name: 'Enterprise',
    price: 249,
    period: 'mes',
    users: 'Ilimitado',
    products: 'Ilimitado',
    invoices: 'Ilimitado',
    whatsapp: true,
    support: 'Dedicado',
    priceId: 'price_enterprise_monthly',
  },
];

const Pricing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (!isAuthenticated) {
      navigate('/register', { state: { plan: plan.name } });
      return;
    }
    
    setLoading(plan.name);
    try {
      const response = await axios.post('/api/v1/payments/create-checkout-session/' + plan.name);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error(error);
      alert('Error al iniciar el pago. Intenta de nuevo.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Planes y Precios - ERP Conversacional Ecuador</title>
        <meta name="description" content="Planes mensuales desde $19. Gestiona tu negocio desde WhatsApp con facturación electrónica SRI incluida." />
      </Helmet>
      <div className="bg-gradient-to-br from-white to-emerald-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Planes para cada negocio
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu empresa. Todos incluyen facturación electrónica SRI y WhatsApp.
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
              🎁 Pago anual: 2 meses gratis
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                    <span className="ml-1 text-gray-500">/{plan.period}</span>
                  </div>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.name}
                    className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === plan.name ? 'Procesando...' : (isAuthenticated ? 'Suscribirme' : 'Registrarse')}
                  </button>
                </div>
                <div className="border-t border-gray-100 bg-gray-50 p-6">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> {plan.users} {typeof plan.users === 'number' ? 'usuario' : ''} incluido{plan.users !== 1 && typeof plan.users === 'number' ? 's' : ''}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Hasta {plan.products} productos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Facturas/mes: {plan.invoices}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> WhatsApp Business API
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Soporte: {plan.support}
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;