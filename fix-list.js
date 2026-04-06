const fs = require('fs');
const file = 'src/app/(authenticated)/expedientes/components/expedientes-list-wrapper.tsx';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace('expedienteId={selectedVisualizarId}', 'expediente={expedientes.find(e => e.id === selectedVisualizarId) as any}');
txt = txt.replace('<ExpedienteVisualizarDialog', '{selectedVisualizarId && (\n        <ExpedienteVisualizarDialog');
txt = txt.replace('/>\n    </div>', '/>\n      )}\n    </div>');
fs.writeFileSync(file, txt);
