import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout/Layout';

// Auth pages
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { VerifyEmail } from '@/pages/auth/VerifyEmail';

// Dashboard
import { Dashboard } from '@/pages/dashboard/Dashboard';

// Productos
import { Products } from '@/pages/products/Products';
import { ProductDetail } from '@/pages/products/ProductDetail';
import { ProductForm } from '@/pages/products/ProductForm';

// Ventas
import { Sales } from '@/pages/sales/Sales';
import { SaleDetail } from '@/pages/sales/SaleDetail';
import { NewSale } from '@/pages/sales/NewSale';

// Clientes
import { Customers } from '@/pages/customers/Customers';
import { CustomerDetail } from '@/pages/customers/CustomerDetail';

// Facturas
import { Invoices } from '@/pages/invoices/Invoices';
import { InvoiceDetail } from '@/pages/invoices/InvoiceDetail';

// WhatsApp
import { WhatsApp } from '@/pages/whatsapp/WhatsApp';
import { Templates } from '@/pages/whatsapp/Templates';

// Configuración
import { Settings } from '@/pages/settings/Settings';
import { Profile } from '@/pages/settings/Profile';

// Categorías
import { Categories } from '@/pages/categories/Categories';

// Marketing y legales
import Landing from '@/pages/landing/Landing';
import Pricing from '@/pages/pricing/Pricing';
import Terms from '@/pages/legal/Terms';
import Privacy from '@/pages/legal/Privacy';

// Owner & Admin Management Pages
import { EmployeesList } from '@/pages/owner/EmployeesList';
import { CreateEmployee } from '@/pages/owner/CreateEmployee';
import { EditPermissions } from '@/pages/owner/EditPermissions';
import { BusinessAuditLogs } from '@/pages/owner/BusinessAuditLogs';

// Protección
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { Waybills } from '@/pages/waybills/Waybills';
import { WaybillDetail } from '@/pages/waybills/WaybillDetail';
import { NewWaybill } from '@/pages/waybills/NewWaybill';

import { Reports } from '@/pages/reports/Reports';
// ============================================
// DEFINICIÓN DE ROLES (Principio de Menor Privilegio)
// ============================================

/**
 * Jerarquía de roles:
 * 
 * OWNER     → Acceso total (dueño del negocio)
 * ADMIN     → Gestión diaria, empleados, reportes (NO plan/pagos, NO permisos avanzados)
 * MANAGER   → Supervisión de ventas, aprobar descuentos, ver reportes (NO empleados, NO config)
 * SELLER    → Solo crear ventas y ver clientes/productos (NO costos, NO reportes, NO config)
 * ACCOUNTANT → Facturación SRI, reportes fiscales (NO ventas, NO productos)
 * VIEWER    → Solo lectura en todo (NO crear, NO editar, NO eliminar)
 */

export const router = createBrowserRouter([
  // ============================================
  // 🟢 RUTAS PÚBLICAS
  // ============================================
  { path: '/', element: <Landing /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/terms', element: <Terms /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/verify-email', element: <VerifyEmail /> },

  // ============================================
  // 🔵 RUTAS PROTEGIDAS
  // ============================================
  {
    path: '/app',
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          // ─── Dashboard (todos los roles) ───────────────────────
          {
            index: true,
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },

          // ─── Productos ─────────────────────────────────────────
          {
            path: 'products',
            children: [
              // Ver productos: owner, admin, manager, seller, viewer
              { index: true, element: <Products /> },
              // Crear producto: owner, admin, manager
              {
                element: <ProtectedRoute allowedRoles={['owner', 'admin', 'manager']} />,
                children: [{ path: 'new', element: <ProductForm /> }],
              },
              // Ver detalle: todos
              { path: ':id', element: <ProductDetail /> },
              // Editar producto: owner, admin, manager
              {
                element: <ProtectedRoute allowedRoles={['owner', 'admin', 'manager']} />,
                children: [{ path: ':id/edit', element: <ProductForm /> }],
              },
            ],
          },

          // ─── Categorías (owner, admin, manager) ────────────────
          {
            path: 'categories',
            children: [
              {
                element: <ProtectedRoute allowedRoles={['owner', 'admin', 'manager']} permissionKey="categories" />,
                children: [{ index: true, element: <Categories /> }],
              },
            ],
          },

          // ─── Ventas ────────────────────────────────────────────
          {
            path: 'sales',
            children: [
              // Ver ventas: owner, admin, manager (todos), seller (solo suyas)
              { index: true, element: <Sales /> },
              // Crear venta: owner, admin, manager, seller
              {
                element: <ProtectedRoute allowedRoles={['owner', 'admin', 'manager', 'seller']} />,
                children: [{ path: 'new', element: <NewSale /> }],
              },
              // Ver detalle: todos los roles
              { path: ':id', element: <SaleDetail /> },
            ],
          },

          // ─── Clientes ──────────────────────────────────────────
          {
            path: 'customers',
            children: [
              // Ver clientes: todos
              { index: true, element: <Customers /> },
              // Ver detalle: todos
              { path: ':id', element: <CustomerDetail /> },
            ],
          },

          // ─── Facturas (owner, admin, accountant) ───────────────
          {
            path: 'invoices',
            element: <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']} permissionKey="invoices" />,
            children: [
              { index: true, element: <Invoices /> },
              { path: ':id', element: <InvoiceDetail /> },
            ],
          },

          // ─── WhatsApp (owner, admin, manager, seller) ──────────
          {
            path: 'whatsapp',
            children: [
              { index: true, element: <WhatsApp /> },
              {
                element: <ProtectedRoute allowedRoles={['owner', 'admin', 'manager']} />,
                children: [{ path: 'templates', element: <Templates /> }],
              },
            ],
          },

          // ─── Configuración (owner, admin, accountant) ──────────
          {
            path: 'settings',
            element: <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']} permissionKey="settings" />,
            children: [
              { index: true, element: <Settings /> },
              { path: 'profile', element: <Profile /> },
            ],
          },

          // ─── Owner & Admin Management ──────────────────────────
          {
            path: 'owner',
            element: <ProtectedRoute allowedRoles={['owner', 'admin']} />,
            children: [
              // Lista de empleados: owner, admin
              {
                path: 'employees',
                children: [
                  { index: true, element: <EmployeesList /> },
                  // Crear empleado: owner, admin
                  {
                    element: <ProtectedRoute allowedRoles={['owner', 'admin']} />,
                    children: [{ path: 'create', element: <CreateEmployee /> }],
                  },
                  // Editar permisos: SOLO owner
                  {
                    element: <ProtectedRoute allowedRoles={['owner']} />,
                    children: [{ path: ':userId/permissions', element: <EditPermissions /> }],
                  },
                ],
              },
              // Auditoría: SOLO owner
              {
                path: 'audit-logs',
                element: <ProtectedRoute allowedRoles={['owner']} />,
                children: [{ index: true, element: <BusinessAuditLogs /> }],
              },
            ],
          },

          {
            path: 'waybills',
            children: [
              { index: true, element: <Waybills /> },
              { path: 'new', element: <NewWaybill /> },
              { path: ':id', element: <WaybillDetail /> },
            ],
          },

          {
            path: 'reports',
            element: <Reports />,
          },
        ],
      },
    ],
  },

  // ============================================
  // 🔴 404
  // ============================================
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);