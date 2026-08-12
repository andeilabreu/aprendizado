import matplotlib.pyplot as plt
import json
import numpy as np

# Configurar matplotlib para português
plt.rcParams['font.family'] = 'DejaVu Sans'

# Carregar dados da análise
with open('analise_resultado.json', 'r', encoding='utf-8') as f:
    dados = json.load(f)

# Criar figura com múltiplos gráficos
fig = plt.figure(figsize=(16, 10))
fig.suptitle('ANÁLISE FINANCEIRA - EXTRATO BANCÁRIO', fontsize=18, fontweight='bold')

# 1. Gráfico de Pizza - Gastos por Categoria
ax1 = plt.subplot(2, 2, 1)
categorias = list(dados['gastos_por_categoria'].keys())
valores = list(dados['gastos_por_categoria'].values())

# Cores personalizadas
cores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']

# Criar gráfico de pizza
wedges, texts, autotexts = ax1.pie(valores, labels=categorias, autopct='%1.1f%%',
                                     colors=cores, startangle=90,
                                     textprops={'fontsize': 9})
ax1.set_title('Distribuição de Gastos por Categoria', fontsize=12, fontweight='bold', pad=20)

# Melhorar legibilidade
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontweight('bold')

# 2. Gráfico de Barras - Top Gastos
ax2 = plt.subplot(2, 2, 2)
categorias_ordenadas = sorted(dados['gastos_por_categoria'].items(), key=lambda x: x[1], reverse=True)
cats = [c[0] for c in categorias_ordenadas]
vals = [c[1] for c in categorias_ordenadas]

# Quebrar nomes longos
cats_curtos = []
for cat in cats:
    if len(cat) > 20:
        palavras = cat.split()
        cats_curtos.append('\n'.join([' '.join(palavras[i:i+2]) for i in range(0, len(palavras), 2)]))
    else:
        cats_curtos.append(cat)

barras = ax2.barh(range(len(vals)), vals, color=cores[:len(vals)])
ax2.set_yticks(range(len(cats_curtos)))
ax2.set_yticklabels(cats_curtos, fontsize=9)
ax2.set_xlabel('Valor (R$)', fontsize=10)
ax2.set_title('Gastos por Categoria (Ranking)', fontsize=12, fontweight='bold', pad=20)
ax2.grid(axis='x', alpha=0.3)

# Adicionar valores nas barras
for i, (bar, val) in enumerate(zip(barras, vals)):
    ax2.text(val + 10, i, f'R$ {val:.2f}', va='center', fontsize=9)

# 3. Comparação Receitas x Despesas
ax3 = plt.subplot(2, 2, 3)
categorias_resumo = ['Receitas', 'Despesas']
valores_resumo = [dados['total_receitas'], dados['total_despesas']]
cores_resumo = ['#2ECC71', '#E74C3C']

barras2 = ax3.bar(categorias_resumo, valores_resumo, color=cores_resumo, width=0.5)
ax3.set_ylabel('Valor (R$)', fontsize=10)
ax3.set_title('Receitas vs Despesas', fontsize=12, fontweight='bold', pad=20)
ax3.grid(axis='y', alpha=0.3)

# Adicionar valores nas barras
for bar, val in zip(barras2, valores_resumo):
    height = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2., height,
             f'R$ {val:.2f}',
             ha='center', va='bottom', fontsize=11, fontweight='bold')

# Adicionar linha de saldo
saldo_liquido = dados['total_receitas'] - dados['total_despesas']
ax3.axhline(y=saldo_liquido, color='blue', linestyle='--', linewidth=2, label=f'Sobra: R$ {saldo_liquido:.2f}')
ax3.legend(fontsize=10)

# 4. Informações Resumidas
ax4 = plt.subplot(2, 2, 4)
ax4.axis('off')

# Texto informativo
info_texto = f"""
RESUMO DO PERÍODO
{dados['periodo']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SALDOS:
  • Saldo Inicial: R$ {dados['saldo_inicial']:.2f}
  • Saldo Final: R$ {dados['saldo_final']:.2f}
  • Variação: R$ {dados['variacao_saldo']:.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MOVIMENTAÇÃO:
  • Total Receitas: R$ {dados['total_receitas']:.2f}
  • Total Despesas: R$ {dados['total_despesas']:.2f}
  • Sobra do Mês: R$ {saldo_liquido:.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MÉDIAS:
  • Gasto Diário: R$ {dados['media_diaria_gastos']:.2f}
  • Gasto Mensal Projetado: R$ {dados['media_diaria_gastos'] * 30:.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOP 3 CATEGORIAS:
"""

# Adicionar top 3 categorias
top3 = sorted(dados['percentual_por_categoria'].items(), key=lambda x: x[1], reverse=True)[:3]
for i, (cat, perc) in enumerate(top3, 1):
    valor = dados['gastos_por_categoria'][cat]
    info_texto += f"  {i}. {cat[:25]}\n     R$ {valor:.2f} ({perc:.1f}%)\n\n"

ax4.text(0.1, 0.95, info_texto, transform=ax4.transAxes,
         fontsize=10, verticalalignment='top',
         bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3),
         family='monospace')

# Ajustar layout
plt.tight_layout(rect=[0, 0.03, 1, 0.96])

# Salvar gráfico
plt.savefig('analise_visual.png', dpi=300, bbox_inches='tight')
print("✓ Gráficos salvos em: analise_visual.png")

# Exibir
print("\n📊 Visualização gráfica criada com sucesso!")
print("📁 Arquivos gerados na pasta analise-financeira:")
print("   - analise_resultado.json (dados)")
print("   - analise_visual.png (gráficos)")
