const fs = require('fs');
const file = 'src/app/(authenticated)/expedientes/components/expedientes-week-mission.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
  /const \[\, setSelectedExpediente\] = React\.useState<Expediente \| null>\(null\);/g,
  'const [selectedExpediente, setSelectedExpediente] = React.useState<Expediente | null>(null);\n  const [detailOpen, setDetailOpen] = React.useState(false);'
);

txt = txt.replace(
  /const handleSelect = React\.useCallback\(\(exp: Expediente\) => \{\n    setSelectedExpediente\(exp\);\n    \/\/ TODO: abrir detail sheet\n  \}, \[\]\);/g,
  'const handleSelect = React.useCallback((exp: Expediente) => {\n    setSelectedExpediente(exp);\n    setDetailOpen(true);\n  }, []);'
);

txt = txt.replace(
  /import \{ cn \} from \'@\/lib\/utils\';/g,
  "import { cn } from '@/lib/utils';\nimport { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';"
);

txt = txt.replace(
  /<\/div>\n    <\/div>\n  \);\n\}/g,
  `      </div>\n      <ExpedienteVisualizarDialog\n        expediente={selectedExpediente as any}\n        open={detailOpen}\n        onOpenChange={setDetailOpen}\n      />\n    </div>\n  );\n}`
);

fs.writeFileSync(file, txt);
