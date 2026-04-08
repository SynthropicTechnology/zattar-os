## ADDED Requirements

### Requirement: Website Layout Integration

O sistema SHALL fornecer um layout para o website institucional integrado com o design system do Synthropic, garantindo consistencia visual e tecnica entre os apps.

#### Scenario: Carregamento de fontes do sistema
- **WHEN** o website e carregado
- **THEN** as fontes Inter, Montserrat e Geist Mono DEVEM estar disponiveis
- **AND** as variaveis CSS `--font-inter`, `--font-montserrat`, `--font-geist-mono` DEVEM estar definidas

#### Scenario: Uso do CSS global
- **WHEN** o layout do website e renderizado
- **THEN** DEVE usar o arquivo `src/app/globals.css` do sistema
- **AND** NAO DEVE ter CSS duplicado em `src/app/(website)/globals.css`

---

### Requirement: Website Component Imports

O sistema SHALL garantir que todos os componentes do website usem imports relativos corretos para funcionamento do build.

#### Scenario: Imports na pagina principal
- **WHEN** o arquivo `src/app/(website)/page.tsx` e compilado
- **THEN** os imports DEVEM usar caminhos relativos (`./components/`)
- **AND** NAO DEVE haver erros de modulo nao encontrado

#### Scenario: Imports nos componentes internos
- **WHEN** os componentes em `src/app/(website)/components/` sao compilados
- **THEN** imports de componentes UI DEVEM usar `./ui/`
- **AND** o build DEVE completar sem erros

---

### Requirement: Multi-App URL Configuration

O sistema SHALL permitir configuracao de URLs dos tres apps (Dashboard, Meu Processo, Website) via variaveis de ambiente.

#### Scenario: Variaveis de ambiente definidas
- **WHEN** o arquivo `.env.example` e consultado
- **THEN** DEVE conter `NEXT_PUBLIC_DASHBOARD_URL`
- **AND** DEVE conter `NEXT_PUBLIC_MEU_PROCESSO_URL`
- **AND** DEVE conter `NEXT_PUBLIC_WEBSITE_URL`

#### Scenario: Helper functions para URLs
- **WHEN** o arquivo `src/lib/urls.ts` e importado
- **THEN** DEVE exportar `getDashboardUrl()`, `getMeuProcessoUrl()`, `getWebsiteUrl()`
- **AND** funcoes DEVEM retornar URLs com fallback para desenvolvimento

---

### Requirement: Website Hero Meu Processo Link

O botao "Consultar Processo" no Hero do website SHALL direcionar o usuario para o portal Meu Processo quando clicado.

#### Scenario: Click no botao Consultar Processo
- **WHEN** usuario clica no botao "Consultar Processo" no Hero
- **THEN** o usuario DEVE ser redirecionado para a URL do portal Meu Processo
- **AND** a URL DEVE ser obtida via `getMeuProcessoUrl()`

---

### Requirement: Website Design System Alignment

Os componentes UI do website SHALL seguir os tokens de design system do Synthropic para garantir consistencia visual.

#### Scenario: Tokens de espacamento
- **WHEN** componentes do website sao renderizados
- **THEN** DEVEM usar classes de espacamento padronizadas (`gap-2`, `gap-4`, `gap-6`, `gap-8`, `p-2`, `p-4`, `p-6`, `p-8`)

#### Scenario: Tokens de transicao
- **WHEN** elementos interativos sao renderizados
- **THEN** DEVEM usar classes de transicao do sistema (`transition-colors duration-200`, `transition-transform duration-200`)

#### Scenario: Botao com cor brand
- **WHEN** o componente Button do website e renderizado com variante `brand`
- **THEN** DEVE usar a cor roxa `#5523eb`
- **AND** DEVE usar `rounded-md` para alinhamento com design system
