# Componentes Públicos - Assinatura Digital

Componentes para o fluxo público (não autenticado) de assinatura digital.

## Identidade Visual

- **Primary Color**: `#135bec` (azul)
- **Tipografia**: Inter
- **Icons**: Material Symbols Outlined
- **Design**: Mobile-first

## Componentes

### Layout

- `PublicPageShell` - Layout principal com header/footer
- `PublicStepLayout` - Layout de step com progresso
- `PublicStepIndicator` - Lista de steps com status

### Shared

- `PublicDocumentCard` - Card de preview do documento
- `PublicProgressBar` - Barra de progresso standalone

## Uso

```tsx
import {
  PublicPageShell,
  PublicStepLayout,
  PublicStepIndicator,
  PublicDocumentCard,
} from "@/features/assinatura-digital/components/public";

// Exemplo: Página de boas-vindas
<PublicPageShell avatarInitials="JD">
  <PublicStepLayout
    title="Bem-vindo"
    description="Complete os seguintes passos para assinar o documento."
    currentStep={1}
    totalSteps={3}
    hideProgress
    onNext={() => nextStep()}
  >
    <PublicDocumentCard
      fileName="Contrato_2024.pdf"
      sender="Departamento Jurídico"
      date="24 Out 2024"
    />

    <PublicStepIndicator
      steps={[
        {
          label: "Confirmar dados",
          description: "Verifique suas informações pessoais",
          icon: "person",
          status: "current",
        },
        {
          label: "Verificação por foto",
          description: "Tire uma selfie para confirmação de identidade",
          icon: "photo_camera",
          status: "pending",
        },
        {
          label: "Assinar documento",
          description: "Revise e assine o documento",
          icon: "draw",
          status: "pending",
        },
      ]}
    />
  </PublicStepLayout>
</PublicPageShell>;
```

## Diferenças do Dashboard

Estes componentes **não** usam o design system interno (Zattar Purple).
Eles seguem uma identidade visual específica para páginas públicas:

| Aspecto    | Dashboard         | Público      |
| ---------- | ----------------- | ------------ |
| Cor        | Zattar Purple     | Azul #135bec |
| Layout     | PageShell interno | PublicPageShell |
| Progresso  | FormStepLayout    | PublicStepLayout |
| Background | Light/Dark Theme  | Dots pattern |

## Props Detalhadas

### PublicPageShell

| Prop           | Tipo      | Default | Descrição                    |
| -------------- | --------- | ------- | ---------------------------- |
| children       | ReactNode | -       | Conteúdo da página           |
| showAvatar     | boolean   | true    | Mostrar avatar do usuário    |
| avatarInitials | string    | "JD"    | Iniciais do avatar           |

### PublicStepLayout

| Prop               | Tipo       | Default     | Descrição                    |
| ------------------ | ---------- | ----------- | ---------------------------- |
| title              | string     | -           | Título do step               |
| description        | string     | -           | Descrição opcional           |
| currentStep        | number     | -           | Step atual (1-indexed)       |
| totalSteps         | number     | -           | Total de steps               |
| onPrevious         | () => void | -           | Handler do botão Voltar      |
| onNext             | () => void | -           | Handler do botão Continuar   |
| nextLabel          | string     | "Continuar" | Label do botão next          |
| previousLabel      | string     | "Voltar"    | Label do botão previous      |
| isNextDisabled     | boolean    | false       | Desabilitar botão next       |
| isPreviousDisabled | boolean    | false       | Desabilitar botão previous   |
| isLoading          | boolean    | false       | Estado de loading            |
| hideProgress       | boolean    | false       | Esconder barra de progresso  |

### PublicStepIndicator

| Prop  | Tipo                                           | Descrição       |
| ----- | ---------------------------------------------- | --------------- |
| steps | `{ label, description, icon?, status }[]`      | Lista de steps  |

Status possíveis: `"completed"`, `"current"`, `"pending"`

### PublicDocumentCard

| Prop      | Tipo   | Descrição               |
| --------- | ------ | ----------------------- |
| fileName  | string | Nome do arquivo         |
| sender    | string | Remetente (opcional)    |
| date      | string | Data (opcional)         |
| className | string | Classes CSS adicionais  |

### PublicProgressBar

| Prop      | Tipo    | Default | Descrição                |
| --------- | ------- | ------- | ------------------------ |
| current   | number  | -       | Step atual               |
| total     | number  | -       | Total de steps           |
| showLabel | boolean | false   | Mostrar "Passo X de Y"   |
| className | string  | -       | Classes CSS adicionais   |

## Acessibilidade

- Todos os componentes usam roles ARIA apropriados
- Progress bars têm `role="progressbar"` com valores `aria-valuenow/min/max`
- Step indicators têm `role="list"` e `aria-current="step"`
- Icons decorativos têm `aria-hidden="true"`
- Navegação por teclado funciona corretamente

## Requisitos

- Material Symbols Outlined (carregado via CDN ou local)
- Tailwind CSS 4+
- shadcn/ui components (Button, Card, Separator)
