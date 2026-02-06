# 🚗 Taller Peter Manager

**Sistema Integral de Gestión para Talleres Mecánicos**

Una aplicación web moderna y potente diseñada para digitalizar y optimizar todas las operaciones de un taller mecánico automotriz. Construida pensando en la movilidad y la eficiencia, permite gestionar desde la recepción del vehículo hasta la facturación final.

---

## ⚡️ Características Principales

### 📊 Dashboard Inteligente
- **Visión Global**: Panel de control con KPIs financieros en tiempo real (Ingresos, Gastos, Beneficio Neto).
- **Rendimiento**: Gráficas de facturación diaria y carga de trabajo por mecánico.

### 🛠 Gestión de Trabajos (Flujo Operativo)
- **Tablero Kanban**: Visualiza el estado de cada reparación (Pendiente, En Proceso, Completado, Entregado).
- **Ficha de Trabajo**: Registro detallado con descripción de avería, repuestos, mano de obra y seguimiento de kilometraje.
- **Control Financiero**: Cálculo automático de costes, margen de beneficio neto (interno) y generación de presupuestos para el cliente (PDF).

### 🚘 Flota y Clientes
- **Historial Completo**: Acceso rápido al historial de reparaciones de cada vehículo.
- **Alertas ITV**: Cálculo automático y notificaciones visuales del estado de la ITV.
- **Base de Datos CRM**: Gestión sencilla de clientes y vinuculación con sus vehículos.

### 📱 Diseño "Mobile-First"
- **App de Bolsillo**: Interfaz optimizada para usar cómodamente desde el móvil (iPhone/Android).
- **Recepción Rápida**: Asistente paso a paso para dar de alta nuevos trabajos a pie de calle.

## 🛠 Tecnologías

Este proyecto está construido con un stack tecnológico moderno para garantizar velocidad y escalabilidad:

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) (Diseño responsivo y glassmorphism)
- **Backend & Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Gráficos**: Recharts
- **Iconos**: Lucide React

## 🚀 Instalación y Ejecución

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/DavidPal02/AI-Taller-2.git
   cd Taller-Peter
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**
   Crea un archivo `.env.local` con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima
   ```

4. **Iniciar Servidor de Desarrollo**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

---
*Desarrollado para Taller Peter - v1.4.5*
