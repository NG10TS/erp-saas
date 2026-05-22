# 🔧 DEBUGGING - Flujo OAuth + Onboarding

## 📋 Cambios Implementados

### Backend

1. **`backend/app/api/v1/endpoints/business.py` - GET /business/me**
   - ✅ Cambio: Ahora verifica explícitamente si `current_user.business_id` es None
   - ✅ Lanza `HTTP 404` con mensaje "Usuario sin negocio asociado"
   - ✅ Esto permite que el frontend detecte el estado de onboarding requerido
   - **Uso**: Después de OAuth, frontend intenta obtener negocio → 404 → muestra modal

### Frontend

1. **`frontend/src/components/common/TokenHandler.tsx`**
   - ✅ Mejorado con logs más claros
   - ✅ Captura `?token=...` desde URL de OAuth callback
   - ✅ Guarda en localStorage
   - ✅ Llama a `initializeAuth()` para cargar estado
   - ✅ Limpia URL (remueve parámetro token)

2. **`frontend/src/store/slices/authSlice.ts` - initializeAuth()**
   - ✅ Manejo explícito de errores HTTP
   - ✅ Cuando recibe 404: `business = null` pero **NO limpia el token**
   - ✅ Mantiene token en localStorage para que OnboardingModal pueda usarlo
   - ✅ Logs detallados para debugging

3. **`frontend/src/pages/dashboard/Dashboard.tsx`**
   - ✅ Verifica si `business` es null
   - ✅ Si está null, muestra OnboardingModal automáticamente
   - ✅ Si tiene datos incompletos, también muestra modal
   - ✅ Logs mejorrados: "Usuario sin negocio → mostrar modal"

4. **`frontend/src/components/onboarding/OnboardingModal.tsx`**
   - ✅ Ahora usa POST `/onboarding/business` para crear (no PUT)
   - ✅ Usa PUT `/business/me` solo para actualizar
   - ✅ Llama a `onComplete()` cuando termina
   - ✅ Logs para debugging

## 🔄 Flujo Completo (Sin Negocio)

```
1. Usuario: Click en "Entrar con Google"
   └─> Redirige a: https://accounts.google.com/o/oauth2/v2/auth?...

2. Google: Autentica y redirige a callback
   └─> GET /api/v1/auth/google/callback?code=ABC123&state=XYZ

3. Backend (oauth.py):
   └─> Intercambia código por token de Google
   └─> Obtiene información del usuario (email)
   └─> Busca/crea usuario con business_id = None (usuario nuevo)
   └─> Crea JWT con is_new=true, has_business=false
   └─> Redirige a: FRONTEND_URL/app/dashboard?token=JWT

4. Frontend: RootLayout monta TokenHandler
   └─> TokenHandler captura ?token=JWT
   └─> Guarda en localStorage: access_token = JWT
   └─> Llama initializeAuth()

5. Frontend: authSlice.initializeAuth()
   └─> Lee token de localStorage ✅
   └─> Llama: GET /business/me
   └─> Backend responde: 404 (sin negocio)
   └─> initializeAuth() detecta 404
   └─> Establece: business = null
   └─> **NO borra el token** ✅

6. Frontend: Dashboard useEffect
   └─> Detecta: business === null
   └─> Establece: showOnboardingModal = true
   └─> Renderiza: <OnboardingModal isOpen={true} />

7. Usuario: Completa el modal con datos
   └─> Ingresa: RUC, nombre, email, etc.
   └─> Click: Guardar

8. Frontend: OnboardingModal.saveBusiness()
   └─> POST /onboarding/business { ruc, business_name, email, ... }
   └─> Backend crea Business y asigna a usuario
   └─> Retorna: { message, business, user_id }
   └─> OnboardingModal llama: onComplete()

9. Frontend: Dashboard.handleOnboardingComplete()
   └─> Cierra modal
   └─> Llama: refreshBusiness()
   └─> GET /business/me ahora retorna el negocio
   └─> Dashboard renderiza estadísticas normales ✅
```

## 🐛 Debugging - Qué Buscar en Console

### Token Handler
```
🔑 TokenHandler - Token capturado en URL, guardando en localStorage
✅ Token guardado en localStorage
📡 Llamando a initializeAuth...
🔄 Limpiando URL a: /app/dashboard
```

### AuthSlice
```
🔍 initializeAuth - token encontrado: Sí
📡 Llamando a /business/me...
🏢 Usuario sin negocio - requiere onboarding (404)  ← CLAVE
```

### Dashboard
```
📊 Dashboard.useEffect - isAuthenticated: false business: null
🏢 Usuario sin negocio → mostrar modal onboarding
```

### OnboardingModal
```
📝 Creando nuevo negocio via POST /onboarding/business
🎉 Onboarding completado
```

## ❌ Si Algo Falla

### Problema: Token no aparece en localStorage
- **Dónde mirar**: Console del navegador (Ejecutor → Console)
- **Qué buscar**: "🔑 Token capturado" log
- **Si no aparece**: 
  - Verificar que OAuth callback URL está correctamente configurada
  - Verificar que TokenHandler está en RootLayout
  - Verificar que `router` en routes/index.tsx tiene RootLayout como elemento raíz

### Problema: "El usuario no tiene token"
- **Log esperado**: "❌ Sin token - limpiando auth"
- **Solución**: Verificar que backend redirige con `?token=JWT`
- **Dónde mirar**: Network tab → GET /google/callback → Respuesta

### Problema: initializeAuth no detecta 404
- **Log esperado**: "🏢 Usuario sin negocio - requiere onboarding (404)"
- **Si muestra otro error**: Error de conexión, CORS, o backend apagado
- **Dónde mirar**: Network tab → GET /business/me → Código de estado

### Problema: Modal no aparece aunque hay 404
- **Verificar**: Dashboard.tsx useEffect está revisando correctamente `!business`
- **Verificar**: RootLayout tiene `<TokenHandler />` antes de `<Outlet />`
- **Dónde mirar**: Console → "🏢 Usuario sin negocio → mostrar modal"

### Problema: Modal aparece pero no guarda
- **Verificar**: POST /onboarding/business existe en backend
- **Verificar**: Usuario tiene token válido
- **Dónde mirar**: Network tab → POST /onboarding/business → Status, Response

## 🧪 Prueba Manual

1. Abre la aplicación en incógnito (sin sesión previa)
2. Click en "Entrar con Google"
3. Autentica con tu cuenta Google
4. **Espera a que aparezca el modal de onboarding**
5. Completa los datos: RUC, Nombre del Negocio, Email
6. Click en "Guardar"
7. **Dashboard debe cargar con tus estadísticas**

## 📊 Arquitectura de Decisiones

**¿Por qué no limpiar token en 404?**
- El usuario necesita el token para hacer POST /onboarding/business
- 404 no significa "error de autenticación", significa "recurso no encontrado"
- Solo errores 401/403 significan token inválido

**¿Por qué POST /onboarding/business en lugar de PUT /business/me?**
- PUT /business/me requiere `get_current_business` que lanza 404 si no existe
- POST /onboarding/business está diseñado específicamente para crear
- Distinción clara: POST = crear, PUT = actualizar

**¿Por qué TokenHandler es necesario?**
- OAuth callback viene con token en URL (?token=JWT)
- TokenHandler intercepta este parámetro en el router context
- Sin router context, el token se pierde al navegar

---

✅ **Configuración lista para testing**
