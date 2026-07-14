// Archivo generado automáticamente. No editar manualmente.
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

export const GLOSARIO_DEFINICIONES: Record<string, GlosarioEntry> = {
  "antecedentes.cardiovascular.hipertension_arterial": {
    "key": "antecedentes.cardiovascular.hipertension_arterial",
    "term": "Hipertensión arterial",
    "definitionMarkdown": "Presión arterial crónicamente elevada (generalmente ≥ 140/90 mmHg o en tratamiento con antihipertensivos).\n* **Nota de desambiguación:** El evento cerebrovascular previo va en *Cardiovascular*, no en *Neurológico*.",
    "definitionHtml": "<p>Presión arterial crónicamente elevada (generalmente ≥ 140/90 mmHg o en tratamiento con antihipertensivos).</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> El evento cerebrovascular previo va en <em>Cardiovascular</em>, no en <em>Neurológico</em>.</li>\n</ul>"
  },
  "antecedentes.cardiovascular.accidente_cerebrovascular_previo": {
    "key": "antecedentes.cardiovascular.accidente_cerebrovascular_previo",
    "term": "Accidente cerebrovascular previo",
    "definitionMarkdown": "Antecedente de evento cerebrovascular isquémico o hemorrágico (ictus, derrame, ACV) antes del ingreso actual.\n* **Nota de desambiguación:** El evento cerebrovascular previo va en *Cardiovascular*, no en *Neurológico*.",
    "definitionHtml": "<p>Antecedente de evento cerebrovascular isquémico o hemorrágico (ictus, derrame, ACV) antes del ingreso actual.</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> El evento cerebrovascular previo va en <em>Cardiovascular</em>, no en <em>Neurológico</em>.</li>\n</ul>"
  },
  "antecedentes.hepatico_digestivo.cirrosis": {
    "key": "antecedentes.hepatico_digestivo.cirrosis",
    "term": "Daño hepático crónico o cirrosis",
    "definitionMarkdown": "Daño hepático crónico diagnosticado o sospecha clínica altamente probable (cirrosis, daño hepático por alcohol, etc.).\n\n---",
    "definitionHtml": "<p>Daño hepático crónico diagnosticado o sospecha clínica altamente probable (cirrosis, daño hepático por alcohol, etc.).</p>\n<hr>"
  },
  "soporte.respiratorio.vmi": {
    "key": "soporte.respiratorio.vmi",
    "term": "Ventilación mecánica invasiva",
    "definitionMarkdown": "Soporte ventilatorio mediante tubo endotraqueal (TET) o traqueostomía conectado a ventilador mecánico mecánico.\n* **Nota de desambiguación:** Si se realiza traqueostomía, la traqueostomía va en el campo correspondiente de *Soporte respiratorio*, no en *Complicaciones*.",
    "definitionHtml": "<p>Soporte ventilatorio mediante tubo endotraqueal (TET) o traqueostomía conectado a ventilador mecánico mecánico.</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> Si se realiza traqueostomía, la traqueostomía va en el campo correspondiente de <em>Soporte respiratorio</em>, no en <em>Complicaciones</em>.</li>\n</ul>"
  },
  "soporte.respiratorio.traqueostomia": {
    "key": "soporte.respiratorio.traqueostomia",
    "term": "Traqueostomía",
    "definitionMarkdown": "Procedimiento quirúrgico para crear una abertura en la tráquea (TQT) para soporte respiratorio prolongado.\n* **Nota de desambiguación:** La traqueostomía va en *Soporte respiratorio*, no en *Complicaciones*.\n\n---",
    "definitionHtml": "<p>Procedimiento quirúrgico para crear una abertura en la tráquea (TQT) para soporte respiratorio prolongado.</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> La traqueostomía va en <em>Soporte respiratorio</em>, no en <em>Complicaciones</em>.</li>\n</ul>\n<hr>"
  },
  "complicaciones.delirium": {
    "key": "complicaciones.delirium",
    "term": "Delirium",
    "definitionMarkdown": "Alteración fluctuante del estado mental, la atención y el nivel de conciencia durante la estadía en UCI (agitación, confusión, CAM-ICU positivo).\n* **Nota de desambiguación:** El delirium leve va aquí; el delirium grave (encefalopatía severa, coma) va en *Falla orgánica* (neurológica).",
    "definitionHtml": "<p>Alteración fluctuante del estado mental, la atención y el nivel de conciencia durante la estadía en UCI (agitación, confusión, CAM-ICU positivo).</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> El delirium leve va aquí; el delirium grave (encefalopatía severa, coma) va en <em>Falla orgánica</em> (neurológica).</li>\n</ul>"
  },
  "complicaciones.debilidad_adquirida": {
    "key": "complicaciones.debilidad_adquirida",
    "term": "Debilidad adquirida",
    "definitionMarkdown": "Debilidad muscular difusa, polineuropatía o miopatía del paciente crítico, o dificultad para el destete del ventilador mecánico debido a debilidad.",
    "definitionHtml": "<p>Debilidad muscular difusa, polineuropatía o miopatía del paciente crítico, o dificultad para el destete del ventilador mecánico debido a debilidad.</p>"
  },
  "complicaciones.lesiones_presion": {
    "key": "complicaciones.lesiones_presion",
    "term": "Lesiones por presión",
    "definitionMarkdown": "Úlceras por presión o escaras desarrolladas en la UCI, especialmente si requirieron aseo quirúrgico.",
    "definitionHtml": "<p>Úlceras por presión o escaras desarrolladas en la UCI, especialmente si requirieron aseo quirúrgico.</p>"
  },
  "complicaciones.desnutricion": {
    "key": "complicaciones.desnutricion",
    "term": "Desnutricion o soporte nutricional intensivo",
    "definitionMarkdown": "Requiere diagnóstico explícito de desnutrición en la epicrisis o la administración de soporte nutricional intensivo. La sola mención de nutrición enteral o parenteral no basta por sí sola si no hay diagnóstico o soporte intensivo explícito.",
    "definitionHtml": "<p>Requiere diagnóstico explícito de desnutrición en la epicrisis o la administración de soporte nutricional intensivo. La sola mención de nutrición enteral o parenteral no basta por sí sola si no hay diagnóstico o soporte intensivo explícito.</p>"
  },
  "complicaciones.disfagia": {
    "key": "complicaciones.disfagia",
    "term": "Disfagia o trastorno deglutorio",
    "definitionMarkdown": "Requiere diagnóstico explícito de disfagia o derivación formal a fonoaudiología por sospecha de trastorno deglutorio; la sola rehabilitación fonoaudiológica sin diagnóstico no basta por sí sola.",
    "definitionHtml": "<p>Requiere diagnóstico explícito de disfagia o derivación formal a fonoaudiología por sospecha de trastorno deglutorio; la sola rehabilitación fonoaudiológica sin diagnóstico no basta por sí sola.</p>"
  },
  "complicaciones.paciente_critico_cronico": {
    "key": "complicaciones.paciente_critico_cronico",
    "term": "Paciente crítico crónico",
    "definitionMarkdown": "Se marca con certeza solo si el texto de la epicrisis describe explícitamente al paciente como tal (\"crítico crónico\", \"paciente crónico de UCI\").",
    "definitionHtml": "<p>Se marca con certeza solo si el texto de la epicrisis describe explícitamente al paciente como tal (&quot;crítico crónico&quot;, &quot;paciente crónico de UCI&quot;).</p>"
  },
  "complicaciones.otra": {
    "key": "complicaciones.otra",
    "term": "Otra complicación",
    "definitionMarkdown": "Cualquier otra complicación surgida durante la estadía en la UCI que no esté cubierta por los campos anteriores.",
    "definitionHtml": "<p>Cualquier otra complicación surgida durante la estadía en la UCI que no esté cubierta por los campos anteriores.</p>"
  }
};

export const GLOSARIO_ESTRUCTURA: GlosarioSection[] = [
  {
    "id": "2",
    "key": "antecedentes",
    "label": "Bloque 2. Antecedentes",
    "type": "mother",
    "children": [
      {
        "id": "2.1",
        "key": "antecedentes.medicos",
        "label": "Antecedentes médicos",
        "type": "mother",
        "children": [
          {
            "id": "2.1.1",
            "key": "antecedentes.cardiovascular",
            "label": "Cardiovascular",
            "type": "mother",
            "children": [
              {
                "id": "2.1.1.1",
                "key": "antecedentes.cardiovascular.hipertension_arterial",
                "label": "Hipertensión arterial",
                "type": "leaf",
                "definitionMarkdown": "Presión arterial crónicamente elevada (generalmente ≥ 140/90 mmHg o en tratamiento con antihipertensivos).\n* **Nota de desambiguación:** El evento cerebrovascular previo va en *Cardiovascular*, no en *Neurológico*.",
                "definitionHtml": "<p>Presión arterial crónicamente elevada (generalmente ≥ 140/90 mmHg o en tratamiento con antihipertensivos).</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> El evento cerebrovascular previo va en <em>Cardiovascular</em>, no en <em>Neurológico</em>.</li>\n</ul>"
              },
              {
                "id": "2.1.1.3",
                "key": "antecedentes.cardiovascular.accidente_cerebrovascular_previo",
                "label": "Accidente cerebrovascular previo",
                "type": "leaf",
                "definitionMarkdown": "Antecedente de evento cerebrovascular isquémico o hemorrágico (ictus, derrame, ACV) antes del ingreso actual.\n* **Nota de desambiguación:** El evento cerebrovascular previo va en *Cardiovascular*, no en *Neurológico*.",
                "definitionHtml": "<p>Antecedente de evento cerebrovascular isquémico o hemorrágico (ictus, derrame, ACV) antes del ingreso actual.</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> El evento cerebrovascular previo va en <em>Cardiovascular</em>, no en <em>Neurológico</em>.</li>\n</ul>"
              }
            ]
          },
          {
            "id": "2.1.5",
            "key": "antecedentes.hepatico_digestivo",
            "label": "Hepático / digestivo",
            "type": "mother",
            "children": [
              {
                "id": "2.1.5.1",
                "key": "antecedentes.hepatico_digestivo.cirrosis",
                "label": "Daño hepático crónico o cirrosis",
                "type": "leaf",
                "definitionMarkdown": "Daño hepático crónico diagnosticado o sospecha clínica altamente probable (cirrosis, daño hepático por alcohol, etc.).\n\n---",
                "definitionHtml": "<p>Daño hepático crónico diagnosticado o sospecha clínica altamente probable (cirrosis, daño hepático por alcohol, etc.).</p>\n<hr>"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "7",
    "key": "complicaciones",
    "label": "Bloque 7. Complicaciones",
    "type": "mother",
    "children": [
      {
        "id": "7.1",
        "key": "complicaciones.delirium",
        "label": "Delirium",
        "type": "leaf",
        "definitionMarkdown": "Alteración fluctuante del estado mental, la atención y el nivel de conciencia durante la estadía en UCI (agitación, confusión, CAM-ICU positivo).\n* **Nota de desambiguación:** El delirium leve va aquí; el delirium grave (encefalopatía severa, coma) va en *Falla orgánica* (neurológica).",
        "definitionHtml": "<p>Alteración fluctuante del estado mental, la atención y el nivel de conciencia durante la estadía en UCI (agitación, confusión, CAM-ICU positivo).</p>\n<ul>\n<li><strong>Nota de desambiguación:</strong> El delirium leve va aquí; el delirium grave (encefalopatía severa, coma) va en <em>Falla orgánica</em> (neurológica).</li>\n</ul>"
      },
      {
        "id": "7.2",
        "key": "complicaciones.debilidad_adquirida",
        "label": "Debilidad adquirida",
        "type": "leaf",
        "definitionMarkdown": "Debilidad muscular difusa, polineuropatía o miopatía del paciente crítico, o dificultad para el destete del ventilador mecánico debido a debilidad.",
        "definitionHtml": "<p>Debilidad muscular difusa, polineuropatía o miopatía del paciente crítico, o dificultad para el destete del ventilador mecánico debido a debilidad.</p>"
      },
      {
        "id": "7.3",
        "key": "complicaciones.lesiones_presion",
        "label": "Lesiones por presión",
        "type": "leaf",
        "definitionMarkdown": "Úlceras por presión o escaras desarrolladas en la UCI, especialmente si requirieron aseo quirúrgico.",
        "definitionHtml": "<p>Úlceras por presión o escaras desarrolladas en la UCI, especialmente si requirieron aseo quirúrgico.</p>"
      },
      {
        "id": "7.4",
        "key": "complicaciones.desnutricion",
        "label": "Desnutricion o soporte nutricional intensivo",
        "type": "leaf",
        "definitionMarkdown": "Requiere diagnóstico explícito de desnutrición en la epicrisis o la administración de soporte nutricional intensivo. La sola mención de nutrición enteral o parenteral no basta por sí sola si no hay diagnóstico o soporte intensivo explícito.",
        "definitionHtml": "<p>Requiere diagnóstico explícito de desnutrición en la epicrisis o la administración de soporte nutricional intensivo. La sola mención de nutrición enteral o parenteral no basta por sí sola si no hay diagnóstico o soporte intensivo explícito.</p>"
      },
      {
        "id": "7.5",
        "key": "complicaciones.disfagia",
        "label": "Disfagia o trastorno deglutorio",
        "type": "leaf",
        "definitionMarkdown": "Requiere diagnóstico explícito de disfagia o derivación formal a fonoaudiología por sospecha de trastorno deglutorio; la sola rehabilitación fonoaudiológica sin diagnóstico no basta por sí sola.",
        "definitionHtml": "<p>Requiere diagnóstico explícito de disfagia o derivación formal a fonoaudiología por sospecha de trastorno deglutorio; la sola rehabilitación fonoaudiológica sin diagnóstico no basta por sí sola.</p>"
      },
      {
        "id": "7.6",
        "key": "complicaciones.paciente_critico_cronico",
        "label": "Paciente crítico crónico",
        "type": "leaf",
        "definitionMarkdown": "Se marca con certeza solo si el texto de la epicrisis describe explícitamente al paciente como tal (\"crítico crónico\", \"paciente crónico de UCI\").",
        "definitionHtml": "<p>Se marca con certeza solo si el texto de la epicrisis describe explícitamente al paciente como tal (&quot;crítico crónico&quot;, &quot;paciente crónico de UCI&quot;).</p>"
      },
      {
        "id": "7.7",
        "key": "complicaciones.otra",
        "label": "Otra complicación",
        "type": "leaf",
        "definitionMarkdown": "Cualquier otra complicación surgida durante la estadía en la UCI que no esté cubierta por los campos anteriores.",
        "definitionHtml": "<p>Cualquier otra complicación surgida durante la estadía en la UCI que no esté cubierta por los campos anteriores.</p>"
      }
    ]
  }
];
