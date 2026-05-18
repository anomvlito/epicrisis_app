# Estrategia de Migración: De Markdown a Visor PDF Interactivo

Este documento detalla la estrategia técnica y arquitectónica para reemplazar el renderizado de texto Markdown por un visor de PDF interactivo en la Plataforma de Anotación de Epicrisis. 

El objetivo es permitir que los anotadores (clínicos/estudiantes) visualicen el documento original en formato PDF, seleccionen texto directamente desde el PDF para capturar evidencia, y mantengan una referencia visual (resaltado) sobre el documento.

> [!IMPORTANT]
> **Requisito Crítico Inicial:** Esta estrategia asume que los archivos PDF generados poseen una capa de texto nativa (fueron exportados como texto digital). Si los PDF provienen de documentos físicos escaneados (imágenes planas), será estrictamente necesario procesarlos previamente con un sistema OCR (Reconocimiento Óptico de Caracteres) antes de subirlos a la plataforma.

## Decisiones Pendientes

Se requiere confirmación sobre los siguientes puntos antes de la fase de despliegue:

1. **Proveedor de Almacenamiento (Object Storage):** Al estar en Vercel, la opción más nativa es **Vercel Blob**, pero también se puede utilizar **AWS S3** o **Supabase Storage**.
2. **Naturaleza de los PDFs:** Confirmar que los PDFs a utilizar contienen texto nativamente seleccionable.

## Arquitectura Propuesta

### 1. Almacenamiento y Base de Datos (Backend)
Guardar archivos binarios pesados (PDFs) en PostgreSQL degradaría el rendimiento de la base de datos Neon. 

- **Estrategia:** Los archivos PDF se subirán a un servicio de Object Storage (ej. Vercel Blob o AWS S3).
- **Modificación en BD:** En la tabla `epicrisis` (`db/schema.ts`), en lugar de guardar el PDF, agregaremos un campo de tipo `text` (ej. `pdf_url`) que almacenará el enlace directo al archivo almacenado en el Object Storage.

### 2. Renderizado del PDF (Frontend)
El uso nativo de `<iframe src="documento.pdf">` no permite interactuar con el DOM (es imposible extraer el texto seleccionado vía JavaScript).

- **Estrategia:** Utilizaremos **PDF.js** (desarrollado por Mozilla), preferentemente a través de un wrapper compatible con Vue 3 como `vue-pdf-embed`.
- Esta tecnología dibuja el PDF visualmente en un elemento `<canvas>` y sobrepone una **capa invisible de texto HTML** (`textLayer`). Esta capa invisible es la que permite a los usuarios usar el cursor para seleccionar texto tal como lo harían en un documento web normal.

### 3. Componente Intermedia y Captura de Evidencia
Actualmente, el proyecto captura texto desde un componente Markdown.

- **Estrategia:** 
  1. Se creará un nuevo componente (ej. `PdfViewer.vue`) que reemplazará a `MarkdownRenderer.vue`.
  2. Al seleccionar texto sobre el `textLayer` del PDF.js, el evento nativo `selectionchange` o `mouseup` activará la lógica existente en `useTextSelection.ts`.
  3. La función `window.getSelection().toString()` extraerá la evidencia.
  4. **Resaltado Visual:** Para mantener demarcada la evidencia sobre el PDF, reutilizaremos la `CSS Custom Highlight API` aplicándola sobre los nodos de texto invisibles de PDF.js.

---

## Cambios Propuestos (A nivel de Código)

A continuación, se detalla el impacto en los diferentes módulos del proyecto.

### Base de Datos y API (Backend)

#### `db/schema.ts`
- Agregar la columna `pdfUrl` a la tabla `epicrisis`.
- Mantener `contentMarkdown` como opcional o nullable para retrocompatibilidad con las epicrisis antiguas.

#### `api/epicrisis.ts` y Endpoints de Carga
- Modificar los endpoints para aceptar y devolver la nueva propiedad `pdfUrl`.

### Frontend (Vue 3)

#### `package.json`
- Instalar dependencias necesarias: `vue-pdf-embed` y `pdfjs-dist`.

#### `src/components/annotation/PdfViewer.vue`
- Componente que encapsula la carga del PDF desde la URL (`pdfUrl`), maneja los estados de carga (loading spinners), y habilita la capa de texto interactiva.

#### `src/views/AnnotationView.vue`
- Sustituir la inclusión de `MarkdownRenderer.vue` por el nuevo `PdfViewer.vue`.
- Conectar la lógica de `useTextSelection.ts` al contenedor del visor PDF.
