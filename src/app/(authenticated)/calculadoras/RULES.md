# Regras de Negócio - Calculadoras

## Contexto
Módulo de calculadoras trabalhistas do Sinesys. Implementa **cálculos puros client-side** sem persistência — cada calculadora é um componente React isolado que recebe inputs do usuário e exibe o resultado em tempo real. Por não haver lógica de persistência, o módulo intencionalmente **não possui** `domain.ts`, `service.ts` ou `repository.ts`.

## Calculadoras Implementadas
- **Horas Extras** (`HorasExtrasCalculator`): Cálculo de valor de horas extras com DSR

## Regras de Cálculo

### Horas Extras (`horas-extras-calculator.tsx`)

**Inputs**:
- `salarioBase`: Salário bruto mensal (R$)
- `horasMensais`: Carga horária mensal contratada (default: 220h)
- `horasExtras`: Quantidade de horas extras no período
- `percentual`: Adicional de horas extras (50%, 60%, 100% — conforme CCT)

**Fórmula**:
```
valorHora        = salarioBase / horasMensais
multiplicador    = 1 + (percentual / 100)
valorHoraExtra   = valorHora × multiplicador
totalHorasExtras = valorHoraExtra × horasExtras
DSR              = totalHorasExtras / 6
totalBruto       = totalHorasExtras + DSR
```

**Regras aplicadas**:
- DSR (Descanso Semanal Remunerado) é calculado pela regra geral de **1/6 do valor das horas extras** (Súmula 172 do TST e Lei 605/49)
- Percentual mínimo legal de horas extras é 50% (CF/88, Art. 7º, XVI), mas convenções coletivas podem aumentar
- Não distingue entre horas diurnas e noturnas (não inclui adicional noturno)
- Não considera reflexos em férias, 13º, FGTS — apenas o valor bruto das horas extras + DSR

## Restrições do Módulo
- **Sem persistência**: Cálculos não são salvos no banco
- **Sem autenticação**: Disponível para qualquer usuário autenticado no sistema
- **Sem auditoria**: Não há registro de cálculos realizados
- **Client-side puro**: Toda a lógica roda no browser via React state

## Por que não há `domain.ts`/`service.ts`/`repository.ts`?
Cada calculadora é uma fórmula determinística sem entidades, sem persistência e sem regras de validação que justifiquem uma camada de domínio. Adicionar essas camadas aqui seria YAGNI — a fórmula vive no próprio componente porque é a única coisa que existe para abstrair.

Se no futuro for necessário **persistir histórico de cálculos** ou **versionar fórmulas conforme legislação**, será o momento de extrair domínio/serviço.

## Adicionando Novas Calculadoras
1. Criar componente em `components/<nome>-calculator.tsx`
2. Re-exportar em `index.ts`
3. Documentar a fórmula nesta seção do RULES.md
4. Adicionar referência legal (artigo de lei, súmula) que sustenta a fórmula
