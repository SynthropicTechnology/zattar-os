const fs = require('fs');

let month = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx', 'utf8');
month = month.replace(/<ExpedienteDialog[\s\S]*?\/>/m, `<ExpedienteVisualizarDialog\n        expediente={expedientes.find(e => e.id === selectedExpedienteId) as any}\n        open={!!selectedExpedienteId}\n        onOpenChange={(open) => {\n          if (!open) setSelectedExpedienteId(null);\n        }}\n      />`);
month = month.replace("import { ExpedienteDialog } from './expediente-dialog';", "import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';");
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx', month);

let year = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx', 'utf8');
year = year.replace('onDateSelect={setSelectedDate}', '');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx', year);

