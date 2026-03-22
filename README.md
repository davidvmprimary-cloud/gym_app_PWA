# GymTracker PWA

Una aplicación web progresiva (PWA) para el seguimiento de entrenamientos en el gimnasio, construida con Vite + React y Dexie.js.

## 🚀 Despliegue en Vercel (Paso a Paso)

Esta aplicación está lista para ser desplegada en Vercel como un sitio estático.

### Opción A: Vercel CLI (Más rápido)
1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel` y sigue los pasos.
3. Para producción: `vercel --prod`

### Opción B: Dashboard de Vercel (Recomendado)
1. Sube tu código a un repositorio de **GitHub**.
2. Ve a [vercel.com](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New"** -> **"Project"**.
4. Importa tu repositorio de GymTracker.
5. Vercel detectará automáticamente que es un proyecto de Vite.
6. **Configuración del Proyecto:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. Haz clic en **"Deploy"**.

## 📱 Instalación como PWA
Una vez desplegada, puedes instalar la App:
- **iOS (Safari):** Pulsa el botón "Compartir" y selecciona "Añadir a la pantalla de inicio".
- **Android (Chrome):** Verás un banner de instalación o puedes ir al menú -> "Instalar aplicación".

## 🛠️ Tecnologías Utilizadas
- **React 18**: Interfaz de usuario dinámica.
- **Dexie.js**: Base de datos local (IndexedDB) para funcionamiento offline.
- **Vite PWA Plugin**: Gestión de Service Workers y Manifest.
- **Recharts**: Gráficos de progreso.
- **CSS Modules**: Estilos locales y limpios.
