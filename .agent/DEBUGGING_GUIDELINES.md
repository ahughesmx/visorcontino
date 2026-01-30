# Guías de Debugging para Visor Contino

## PRINCIPIO FUNDAMENTAL: ANÁLISIS SISTEMÁTICO 360°

**NUNCA hacer intentos a ciegas. SIEMPRE seguir un proceso sistemático de inicio a fin.**

## Proceso Obligatorio para Problemas Persistentes

### 1. DIAGNÓSTICO COMPLETO (Antes de cualquier cambio)

Cuando un problema persiste después de 2 intentos, DETENTE y ejecuta:

#### A. Verificación de Infraestructura
```powershell
# ¿El servidor está sirviendo los archivos correctos?
node -e "const fs = require('fs'); console.log(fs.readdirSync('public'));"

# ¿Hay errores de sintaxis JavaScript?
node --check public/app.js

# ¿Qué versión está cargando el navegador?
curl http://localhost:3001 | findstr "app.js"
```

#### B. Verificación de Consola del Navegador
- Pedir al usuario que abra DevTools (F12)
- Revisar:
  - Errores en consola (rojo)
  - Warnings (amarillo)
  - Logs de carga de archivos
  - Estado de elementos DOM específicos

#### C. Verificación de Elementos DOM
```javascript
// En consola del navegador
document.getElementById('elemento-problema')
window.funcionProblema
```

#### D. Verificación de CSS
```javascript
// Verificar estilos aplicados
getComputedStyle(document.getElementById('elemento')).display
getComputedStyle(document.getElementById('elemento')).zIndex
```

### 2. IDENTIFICACIÓN DE LA CAPA DEL PROBLEMA

El problema SIEMPRE está en una de estas capas:

1. **Infraestructura**: Servidor no sirve archivos / Caché navegador
2. **Sintaxis**: Error JavaScript bloquea ejecución
3. **Lógica**: Código se ejecuta pero hace lo incorrecto
4. **DOM**: Elementos no existen o tienen IDs incorrectos
5. **CSS**: Elementos existen pero no son visibles
6. **Eventos**: Event listeners no se adjuntan

**Verificar en este orden**, no saltar pasos.

### 3. RECOPILACIÓN DE EVIDENCIA

Antes de proponer una solución:
- ✅ Logs de consola del navegador
- ✅ Logs del servidor
- ✅ Verificación de que archivos editados se están sirviendo
- ✅ Estado de elementos DOM relevantes
- ✅ Estilos CSS aplicados

### 4. SOLUCIÓN DIRIGIDA

Solo DESPUÉS de identificar la capa exacta:
- Hacer UN cambio dirigido
- Verificar resultado
- Si persiste, volver al paso 1

## Ejemplo: "Botón no abre modal"

### ❌ INCORRECTO (Múltiples intentos a ciegas)
1. Cambiar onclick
2. Cambiar event listener
3. Cambiar scope de función
4. Cambiar nombre de archivo
... (12+ intentos)

### ✅ CORRECTO (Sistemático 360°)
1. **Verificar que JS carga**: `console.log` al inicio
   - Si NO carga → Problema de infraestructura
   - Si SÍ carga → Continuar
   
2. **Verificar que función existe**: `typeof window.funcion`
   - Si undefined → Problema de sintaxis o scope
   - Si function → Continuar
   
3. **Verificar que botón existe**: `document.getElementById('boton')`
   - Si null → Problema de DOM/HTML
   - Si existe → Continuar
   
4. **Verificar que evento funciona**: Click y revisar console.log
   - Si no logs → Problema de eventos
   - Si hay logs → Continuar
   
5. **Verificar que modal existe**: `document.getElementById('modal')`
   - Si null → Problema de DOM
   - Si existe → Continuar
   
6. **Verificar estilos del modal**: `getComputedStyle(modal).display`
   - Si "none" o mal z-index → **Problema de CSS** ← Solución específica

## Anti-patrones a Evitar

1. ❌ Hacer 3+ cambios sin verificar logs de consola
2. ❌ Asumir que el problema es código cuando puede ser caché
3. ❌ Editar sin confirmar que el archivo editado se está sirviendo
4. ❌ No pedir evidencia del navegador del usuario

## Checklist Pre-solución

Antes de proponer una solución, confirmar:
- [ ] He visto logs de consola del navegador
- [ ] He verificado que archivos se están sirviendo correctamente
- [ ] He identificado la capa exacta del problema
- [ ] Mi solución ataca esa capa específica
- [ ] Tengo un plan de verificación

---

**Última actualización**: 2026-01-23
**Razón**: Pérdida de tiempo con 12+ intentos no sistemáticos en problema de modal
