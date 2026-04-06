const fs = require('fs');
const file = 'src/app/(authenticated)/expedientes/components/expedientes-control-view.tsx';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace(/responsavelNome=\{.*?\}/g, '');
txt = txt.replace(/tipoExpedienteNome=\{.*?\}/g, '');
fs.writeFileSync(file, txt);
