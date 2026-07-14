import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { marked } from 'marked';
import { FORM_SCHEMA, getLeafNodes, FormNode } from '../src/constants/formSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Normalize string for diacritics, spaces, casing and punctuation
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9 ]/g, "")     // Remove punctuation except spaces
    .replace(/\s+/g, " ")           // Normalize multiple spaces
    .trim();
}

function run() {
  const mdPath = path.resolve(__dirname, '../../epicrisis_documentacion/guias/glosario-anotacion.md');
  const generatedPath = path.resolve(__dirname, '../src/constants/glosario.generated.ts');

  if (!fs.existsSync(mdPath)) {
    console.error(`Error: No se encontró el archivo del glosario en ${mdPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  const leafNodes = getLeafNodes();
  
  // Create mapping from normalized label to FormNode
  const labelToNodeMap = new Map<string, FormNode>();
  for (const node of leafNodes) {
    const norm = normalizeString(node.label);
    labelToNodeMap.set(norm, node);
  }

  let modified = false;
  let currentTerm: string | null = null;
  let currentDefinitionLines: string[] = [];
  let currentHeadingLineIndex: number | null = null;
  
  const parsedDefinitions = new Map<string, { key: string; term: string; definitionMarkdown: string; definitionHtml: string }>();

  function saveTerm(term: string, definitionLines: string[], headingLineIndex: number) {
    const normTerm = normalizeString(term);
    const matchedNode = labelToNodeMap.get(normTerm);
    
    if (matchedNode) {
      // If headings differ exactly (e.g. spelling or diacritics), adapt glossary md to formSchema
      if (term !== matchedNode.label) {
        console.log(`[Adaptación] Cambiando cabecera del glosario "${term}" -> "${matchedNode.label}" (se adapta al formulario)`);
        lines[headingLineIndex] = `### ${matchedNode.label}`;
        modified = true;
        term = matchedNode.label;
      }
      
      const definitionMarkdown = definitionLines.join('\n').trim();
      const definitionHtml = marked.parse(definitionMarkdown) as string;
      
      parsedDefinitions.set(matchedNode.key, {
        key: matchedNode.key,
        term: matchedNode.label,
        definitionMarkdown,
        definitionHtml: definitionHtml.trim()
      });
    } else {
      // Orphan term (no matching node label in formSchema)
      const definitionMarkdown = definitionLines.join('\n').trim();
      const definitionHtml = marked.parse(definitionMarkdown) as string;
      
      parsedDefinitions.set(`orphan:${term}`, {
        key: `orphan:${term}`,
        term,
        definitionMarkdown,
        definitionHtml: definitionHtml.trim()
      });
    }
  }

  // Parse lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      // Save previous term
      if (currentTerm && currentHeadingLineIndex !== null) {
        saveTerm(currentTerm, currentDefinitionLines, currentHeadingLineIndex);
      }
      
      // Start new term
      currentTerm = line.substring(4).trim();
      currentHeadingLineIndex = i;
      currentDefinitionLines = [];
    } else if (line.startsWith('## ') || line.startsWith('# ')) {
      // End term block when reaching a section heading
      if (currentTerm && currentHeadingLineIndex !== null) {
        saveTerm(currentTerm, currentDefinitionLines, currentHeadingLineIndex);
      }
      currentTerm = null;
      currentHeadingLineIndex = null;
      currentDefinitionLines = [];
    } else {
      if (currentTerm !== null) {
        currentDefinitionLines.push(line);
      }
    }
  }
  // Save last term if exists
  if (currentTerm && currentHeadingLineIndex !== null) {
    saveTerm(currentTerm, currentDefinitionLines, currentHeadingLineIndex);
  }

  // Write modifications back to glosario-anotacion.md if headings were updated
  if (modified) {
    fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
    console.log(`[Sync] Sincronizados títulos en ${mdPath}`);
  }

  // Separate orphans and valid definitions
  const definitionsObj: Record<string, any> = {};
  const orphans: string[] = [];
  const definedKeys = new Set<string>();

  for (const [key, value] of parsedDefinitions.entries()) {
    if (key.startsWith('orphan:')) {
      orphans.push(value.term);
    } else {
      definitionsObj[key] = value;
      definedKeys.add(key);
    }
  }

  // Filter FORM_SCHEMA recursively to only include sections with definitions
  function buildGlossaryStructure(nodes: FormNode[]): any[] {
    const result: any[] = [];
    for (const node of nodes) {
      if (node.type === 'mother') {
        const filteredChildren = buildGlossaryStructure(node.children || []);
        if (filteredChildren.length > 0) {
          result.push({
            id: node.id,
            key: node.key,
            label: node.label,
            type: node.type,
            children: filteredChildren
          });
        }
      } else {
        if (definitionsObj[node.key]) {
          result.push({
            id: node.id,
            key: node.key,
            label: node.label,
            type: node.type,
            definitionMarkdown: definitionsObj[node.key].definitionMarkdown,
            definitionHtml: definitionsObj[node.key].definitionHtml
          });
        }
      }
    }
    return result;
  }

  const glossaryStructure = buildGlossaryStructure(FORM_SCHEMA);

  // Write TS file
  const tsContent = `// Archivo generado automáticamente. No editar manualmente.
// Fuente: epicrisis_documentacion/guias/glosario-anotacion.md

export interface GlosarioEntry {
  key: string;
  term: string;
  definitionMarkdown: string;
  definitionHtml: string;
}

export interface GlosarioSection {
  id: string;
  key: string;
  label: string;
  type: 'mother' | 'leaf' | 'date' | 'select' | 'number' | 'text';
  children?: GlosarioSection[];
  definitionMarkdown?: string;
  definitionHtml?: string;
}

export const GLOSARIO_DEFINICIONES: Record<string, GlosarioEntry> = ${JSON.stringify(definitionsObj, null, 2)};

export const GLOSARIO_ESTRUCTURA: GlosarioSection[] = ${JSON.stringify(glossaryStructure, null, 2)};
`;

  fs.writeFileSync(generatedPath, tsContent, 'utf8');
  console.log(`[Sync] Archivo de constantes TypeScript generado en ${generatedPath}`);

  // Validation report
  const missing = leafNodes
    .filter(node => !definedKeys.has(node.key))
    .map(node => `${node.key} ("${node.label}")`);

  console.log('\n=== REPORTE DE CONSISTENCIA DEL GLOSARIO ===');
  if (orphans.length > 0) {
    console.warn(`⚠️  Entradas huérfanas en el glosario (no existen en el formulario):`);
    orphans.forEach(o => console.warn(`  - ${o}`));
  } else {
    console.log(`✅ No hay entradas huérfanas en el glosario.`);
  }

  if (missing.length > 0) {
    console.info(`ℹ️  Campos del formulario sin definición (${missing.length} de ${leafNodes.length}):`);
    missing.forEach(m => console.info(`  - ${m}`));
  } else {
    console.log(`✅ Todos los campos del formulario tienen definición en el glosario.`);
  }
}

run();
