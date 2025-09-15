# 🛍️ Tienda de Variedades - Sistema de Gestión

Sistema web completo para la gestión de una tienda de variedades desarrollado con React y Node.js.

## 📋 Características Principales

### 📦 Gestión de Productos
- Registro completo de productos con códigos únicos
- Control de precios de compra y venta
- Gestión de stock con alertas de stock mínimo
- Categorización de productos
- Búsqueda avanzada por nombre, código o descripción

### 🏷️ Gestión de Categorías
- Creación y edición de categorías
- Organización jerárquica de productos
- Control de estado (activa/inactiva)

### 🚚 Gestión de Proveedores
- Registro de información de proveedores
- Datos de contacto completos
- Asociación con productos

### 💰 Sistema de Ventas
- Registro de ventas con múltiples productos
- Diferentes métodos de pago (efectivo, tarjeta, transferencia, mixto)
- Generación automática de números de factura
- Control de stock automático
- Información del cliente opcional

### 🔄 Gestión de Devoluciones
- Registro de devoluciones por venta
- Diferentes motivos de devolución
- Control de estados (pendiente, aprobada, rechazada, procesada)
- Restauración automática de stock

### 📊 Dashboard y Reportes
- Resumen diario de ventas
- Estadísticas por método de pago
- Productos más vendidos
- Alertas de stock bajo
- Devoluciones pendientes

### 🔐 Seguridad
- Autenticación JWT
- Encriptación de contraseñas con bcryptjs
- Roles de usuario (Admin, Vendedor, Inventario)
- Middleware de autenticación

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con hooks modernos
- **React Router** para navegación
- **React Query** para gestión de estado del servidor
- **React Hook Form** para formularios
- **Lucide React** para iconos
- **Tailwind CSS** para estilos
- **React Hot Toast** para notificaciones

### Backend
- **Node.js** con Express
- **Sequelize** ORM para MySQL
- **JWT** para autenticación
- **bcryptjs** para encriptación
- **Helmet** para seguridad
- **Express Rate Limit** para limitación de requests

### Base de Datos
- **MySQL** para persistencia de datos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- MySQL (v8 o superior)
- Git

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd tienda-variedades
```

### 2. Configurar Backend
```bash
cd backend
npm install
cp env.example .env
# Editar .env con tus configuraciones
npm run dev
```

### 3. Configurar Base de Datos
```sql
CREATE DATABASE tienda_variedades;
-- El sistema creará automáticamente las tablas al iniciar
```

### 4. Configurar Frontend
```bash
cd frontend
npm install
cp env.example .env
# Editar .env con la URL de tu API
npm start
```

## 📱 Uso de la Aplicación

### Usuario Administrador por Defecto
- **Email:** admin@tienda.com
- **Contraseña:** admin123
- ⚠️ **Cambiar contraseña después del primer login**

### Funcionalidades Principales

1. **Dashboard:** Vista general con estadísticas del día
2. **Productos:** Gestión completa del inventario
3. **Categorías:** Organización de productos
4. **Proveedores:** Gestión de proveedores
5. **Ventas:** Registro y seguimiento de ventas
6. **Devoluciones:** Gestión de devoluciones
7. **Perfil:** Configuración personal

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)
```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tienda_variedades
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# Servidor
PORT=3000
JWT_SECRET=tu_jwt_secret_seguro

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
```

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **usuarios:** Gestión de usuarios del sistema
- **categorias:** Categorías de productos
- **proveedores:** Información de proveedores
- **productos:** Inventario de productos
- **ventas:** Registro de ventas
- **detalle_ventas:** Detalles de productos por venta
- **devoluciones:** Gestión de devoluciones

## 🔒 Seguridad

- Contraseñas encriptadas con bcryptjs
- Tokens JWT con expiración de 24 horas
- Validación de entrada en todos los endpoints
- Headers de seguridad con Helmet
- Rate limiting implementado
- CORS configurado

## 📈 Características Técnicas

- **Arquitectura:** MVC con separación de responsabilidades
- **Base de Datos:** Relaciones bien definidas con Sequelize
- **API:** RESTful con respuestas consistentes
- **Frontend:** Componentes reutilizables y hooks personalizados
- **Estado:** React Query para gestión del estado del servidor
- **UI/UX:** Diseño moderno y responsivo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🎯 Roadmap

- [ ] Notificaciones en tiempo real
- [ ] Integración con sistemas de pago
- [ ] Dashboard con gráficos avanzados
- [ ] Exportación de reportes en PDF
- [ ] API para integraciones externas
- [ ] Aplicación móvil complementaria

---

**Desarrollado con ❤️ para la gestión eficiente de tiendas**