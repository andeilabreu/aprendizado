# 📊 Análise Financeira - Andeil

Análise completa do extrato bancário do período de **07/07/2026 a 07/08/2026** (32 dias).

## 📁 Arquivos Gerados

### 1. `Extrato-07-07-2026-a-07-08-2026-PDF.pdf`
Seu extrato bancário original em PDF.

### 2. `analise_gastos.py`
Script Python que analisa o extrato e gera relatório detalhado no terminal.

**Como executar:**
```bash
python3 analise_gastos.py
```

### 3. `analise_resultado.json`
Dados estruturados da análise em formato JSON, contendo:
- Resumo financeiro
- Gastos por categoria
- Percentuais
- Médias

### 4. `relatorio_visual.html` ⭐
**Relatório visual interativo e responsivo!**

**Como visualizar:**
```bash
# Opção 1: Abrir diretamente no navegador
xdg-open relatorio_visual.html

# Opção 2: Clicar duas vezes no arquivo
```

Este relatório contém:
- 📊 Gráficos de barras coloridos
- 💳 Cards com resumo financeiro
- 💡 Insights principais
- 🎯 Recomendações personalizadas

---

## 📈 Resumo Executivo

### Saldos
- **Saldo Inicial:** R$ 95,32
- **Saldo Final:** R$ 68,68
- **Variação:** -R$ 26,64

### Movimentação
- **Total de Receitas:** R$ 2.503,90
- **Total de Despesas:** R$ 1.927,01
- **Sobra do Mês:** R$ 576,89 💰

### Média Diária
- **Gasto Diário:** R$ 60,22

---

## 💳 Distribuição de Gastos

| Categoria | Valor | % |
|-----------|-------|---|
| 🛒 Alimentação - Mercado | R$ 553,68 | 28,7% |
| 🚗 Transporte (Uber) | R$ 437,52 | 22,7% |
| 💸 Transferências (PIX) | R$ 372,00 | 19,3% |
| 💧 Água/Bebidas | R$ 302,25 | 15,7% |
| 🍽️ Alimentação - Restaurante | R$ 171,58 | 8,9% |
| 🛍️ Outros | R$ 65,99 | 3,4% |
| 💊 Farmácia | R$ 23,99 | 1,2% |

---

## 💡 Principais Insights

### 1. Alimentação é o maior gasto
- **Total:** R$ 725,26 (37,6% dos gastos)
- Mercado: R$ 553,68
- Restaurante: R$ 171,58

### 2. Transporte significativo
- **Total:** R$ 437,52 (22,7%)
- Média diária: R$ 13,67

### 3. Gestão positiva!
- Você poupou **R$ 576,89** no mês
- Isso representa **23% das receitas** 👏

---

## 🎯 Recomendações

### 🛒 Alimentação
- Planeje compras semanais
- Reduza idas a restaurantes
- Faça listas de compras
- Compare preços

### 🚗 Transporte
- Avalie transporte público
- Considere carona compartilhada
- Agrupe deslocamentos
- **Meta:** reduzir 30% = economia de R$ 131,26/mês

### 💧 Água/Bebidas
- Avalie investir em filtro de água
- Compare preços de distribuidoras
- Considere galões maiores

### 📈 Próximos Passos
- Continue monitorando mensalmente
- Estabeleça limites por categoria
- Meta: aumentar sobra para 30% da receita
- Crie reserva de emergência

---

## 🚀 Como Usar Esta Análise

1. **Visualização Rápida:** Abra o `relatorio_visual.html` no navegador
2. **Análise Detalhada:** Execute `python3 analise_gastos.py`
3. **Dados Brutos:** Consulte `analise_resultado.json`

---

## 📞 Próximas Análises

Para análises futuras, basta:
1. Adicionar novo extrato PDF nesta pasta
2. Atualizar o script `analise_gastos.py` com os novos dados
3. Executar novamente

---

**Criado em:** 07/08/2026
**Ferramenta:** Cursor AI Agent
