const fs = require('fs');

// 1. Content
let content = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-content.tsx', 'utf8');
content = content.replace('onViewChange={handleNavigate}', 'onValueChange={handleNavigate}');
content = content.replace('triggerClassName="w-[140px] h-9"', 'className="w-[140px] h-9"');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-content.tsx', content);

// 2. Month wrapper
let month = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx', 'utf8');
month = month.replace('onEdit={setSelectedExpedienteId}', ''); // remove onEdit
month = month.replace('expediente={expedientes.find(e => e.id === selectedExpedienteId) as any}', 'expedienteId={selectedExpedienteId || undefined}');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx', month);

// 3. Year
let year = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx', 'utf8');
year = year.replace('data={expedientes}', ''); // remove data prop
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx', year);

