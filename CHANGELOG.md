# Changelog - Taller Peter Manager

Este documento registra todos los cambios, mejoras y correcciones realizadas en la aplicación **Taller Peter Manager**.

## [v1.4.2] - 2026-01-28
### Corregido
- **Previsualización de Presupuesto en Móvil**: Se ha solucionado el problema donde la barra de navegación inferior del móvil ocultaba el botón de "Imprimir / PDF". Ahora el modal tiene un margen inferior y una altura ajustada para garantizar la accesibilidad de los botones de acción.

## [v1.4.1] - 2026-01-28
### UI/UX
- **Diseño de Lista de Vehículos (Móvil)**: Se ha refactorizado completamente la pantalla de "Vehículos" para dispositivos móviles.
    - Eliminado el padding fijo que causaba solapamientos.
    - Implementada una estructura `flex-column` con cabecera fija y lista desplazable (`scroll` independiente).
    - Ajustados los márgenes (`safe-area`) para dispositivos como iPhone.
    - Optimizada la visualización de las tarjetas de vehículos para evitar cortes de texto.

## [v1.4.0] - 2026-01-28
### Añadido
- **Gestión de Kilometraje**: Nuevo campo "Kilometraje" en el formulario de creación/edición de trabajos. Ahora el historial refleja los kilómetros reales del vehículo en el momento de la entrada.
- **Cálculo de Beneficio Neto**: Nueva sección interna en la ficha del trabajo que muestra el **Beneficio Neto Estimado** (Total Facturado - Gastos Internos). Este dato es privado y no aparece en el presupuesto del cliente.
- **Rendimiento Mensual**: El Dashboard ahora muestra el gráfico de rendimiento basado en el mes actual (días 1-30/31) en lugar de semanal, calculando la facturación diaria dinámicamente.

## [v1.3.0] - 2026-01-27
### Mantenimiento
- Correcciones generales de estabilidad y optimización de consultas a base de datos.

## [v1.2.0] - 2026-01-27
### Correcciones
- Solución a problemas de sincronización en tiempo real.
- Ajustes en la interfaz de usuario para mejorar la consistencia.

## [v1.1.0] - 2026-01-20
### Funcionalidades
- **Recepción Rápida**: Mejoras en el flujo del asistente de recepción.
- Corrección de errores en el módulo de gastos.

## [v1.0.0] - 2026-01-20
### Lanzamiento
- Versión inicial estable completa ("Final Version 1.0").
- Módulos activos: Dashboard, Clientes, Vehículos, Trabajos, Gastos, Configuración.
- Integración completa con Supabase.
