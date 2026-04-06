const fs = require('fs');

// Month Wrapper
let month = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx', 'utf8');
month = month.replace('selectedDate,\n    setSelectedDate,\n  } = useExpedientes();', '} = useExpedientes();\n  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());\n  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());');
month = month.replace('<ExpedientesCalendarCompact\n            expedientes={expedientes}\n            selectedDate={selectedDate}\n            onDateSelect={setSelectedDate}\n          />', '<ExpedientesCalendarCompact\n            expedientes={expedientes}\n            selectedDate={selectedDate}\n            onDateSelect={setSelectedDate}\n            currentMonth={currentMonth}\n            onMonthChange={setCurrentMonth}\n          />');
month = month.replace('usuarios={usuariosData}\n', '');
month = month.replace('tipos={tiposExpedientesData}\n', '');
month = month.replace('expedienteId={selectedExpedienteId || undefined}', 'expediente={expedientes.find(e => e.id === selectedExpedienteId) as any}');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx', month);

// Year Wrapper
let year = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx', 'utf8');
year = year.replace('selectedDate,\n    setSelectedDate,\n  } = useExpedientes();', '} = useExpedientes();\n  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());');
year = year.replace('expedientes={expedientes}', 'data={expedientes}');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx', year);

// Base Types/Errors
let content = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-content.tsx', 'utf8');
content = content.replace('currentView={visualizacao}', 'value={visualizacao}');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-content.tsx', content);

let list = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-list-wrapper.tsx', 'utf8');
list = list.replace('searchQuery?: string;\n', ''); // if exists
list = list.replace('export interface ExpedientesListWrapperProps {', 'export interface ExpedientesListWrapperProps {\n  searchQuery?: string;');
list = list.replace('error.message || ', '');
list = list.replace('expedienteId={selectedBaixarId}', 'expediente={expedientes.find(e => e.id === selectedBaixarId) as any}');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-list-wrapper.tsx', list);

let control = fs.readFileSync('src/app/(authenticated)/expedientes/components/expedientes-control-view.tsx', 'utf8');
control = control.replace('expediente={selectedExpediente}', 'expediente={selectedExpediente as any}');
fs.writeFileSync('src/app/(authenticated)/expedientes/components/expedientes-control-view.tsx', control);

