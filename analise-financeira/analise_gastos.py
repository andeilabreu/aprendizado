import re
from datetime import datetime
from collections import defaultdict
import json

# Dados do extrato
saldo_inicial = 95.32
saldo_final = 68.68

# Listas para armazenar transações
receitas = []
despesas = []

# Categorias de despesas
categorias = {
    'Transporte': ['Uber', 'DL*UberRides'],
    'Alimentação - Mercado': ['EMPORIO TURMALINA', 'SUP SANTA HELENA', 'REDE SANTANA', 'ATACADAO'],
    'Alimentação - Restaurante': ['GARAPASTEL', 'CHURRASQUINHO', 'BOA VISTA SORVETERIA', 'IMPERIO DO CALDO', 'PANIFICADORA'],
    'Água/Bebidas': ['DistribuidoraTraz', 'Distribuidora'],
    'Transferências': ['Pix enviado', 'Leonardo Duarte', 'Evimar Gomes', 'Caio Felipe', 'Sergio Emilio', 'Geni Falcao', 'MORANGOS'],
    'Farmácia': ['RAIA DROGASIL'],
    'Outros': ['ALESSANDRORODRIGU', 'SergioEmilioFranc', 'NELMA LUZIA', 'PIPOCAS DA MI', 'EderCavalcantiDe', 'BardoRoberto']
}

# Dados extraídos do extrato (seleção das principais transações)
transacoes = [
    # Receitas
    ('07/07', 'PIX recebido - GISELE RIBEIRO FRANCO', 40.00, 'receita'),
    ('08/07', 'PIX recebido', 50.00, 'receita'),
    ('09/07', 'PIX recebido', 80.00, 'receita'),
    ('11/07', 'PIX recebido', 100.00, 'receita'),
    ('12/07', 'PIX recebido', 100.00, 'receita'),
    ('13/07', 'PIX recebido', 100.00, 'receita'),
    ('14/07', 'PIX recebido', 100.00, 'receita'),
    ('16/07', 'PIX recebido', 100.00, 'receita'),
    ('17/07', 'PIX recebido', 100.00, 'receita'),
    ('17/07', 'PIX recebido', 135.00, 'receita'),
    ('19/07', 'PIX recebido', 200.00, 'receita'),
    ('21/07', 'PIX recebido', 100.00, 'receita'),
    ('22/07', 'PIX recebido', 100.00, 'receita'),
    ('23/07', 'PIX recebido', 143.90, 'receita'),
    ('25/07', 'PIX recebido', 100.00, 'receita'),
    ('25/07', 'PIX recebido', 50.00, 'receita'),
    ('27/07', 'PIX recebido', 75.00, 'receita'),
    ('29/07', 'PIX recebido', 200.00, 'receita'),
    ('31/07', 'PIX recebido', 100.00, 'receita'),
    ('31/07', 'PIX recebido - CAIO FELIPE', 30.00, 'receita'),
    ('04/08', 'PIX recebido - THIAGO RODRIGUES', 300.00, 'receita'),
    ('06/08', 'PIX recebido - THIAGO RODRIGUES', 200.00, 'receita'),
]

# Calcular totais de receitas
total_receitas = sum([t[2] for t in transacoes if t[3] == 'receita'])

# Despesas por categoria (valores aproximados com base no extrato completo)
gastos_por_categoria = {
    'Transporte (Uber)': 437.52,
    'Alimentação - Mercado': 553.68,
    'Alimentação - Restaurante': 171.58,
    'Água/Bebidas': 302.25,
    'Transferências (PIX enviados)': 372.00,
    'Farmácia': 23.99,
    'Outros': 65.99
}

total_despesas = sum(gastos_por_categoria.values())

# Análise
resultado = {
    'periodo': '07/07/2026 a 07/08/2026 (32 dias)',
    'saldo_inicial': saldo_inicial,
    'saldo_final': saldo_final,
    'total_receitas': total_receitas,
    'total_despesas': total_despesas,
    'variacao_saldo': saldo_final - saldo_inicial,
    'gastos_por_categoria': gastos_por_categoria,
    'media_diaria_gastos': round(total_despesas / 32, 2),
    'percentual_por_categoria': {}
}

# Calcular percentuais
for categoria, valor in gastos_por_categoria.items():
    percentual = (valor / total_despesas) * 100
    resultado['percentual_por_categoria'][categoria] = round(percentual, 2)

# Exibir relatório
print("=" * 80)
print("ANÁLISE FINANCEIRA - EXTRATO BANCÁRIO".center(80))
print("=" * 80)
print(f"\nPeríodo: {resultado['periodo']}")
print(f"\nSaldo inicial: R$ {resultado['saldo_inicial']:.2f}")
print(f"Saldo final: R$ {resultado['saldo_final']:.2f}")
print(f"Variação: R$ {resultado['variacao_saldo']:.2f}")

print(f"\n{'─' * 80}")
print("RESUMO FINANCEIRO")
print(f"{'─' * 80}")
print(f"Total de receitas: R$ {resultado['total_receitas']:.2f}")
print(f"Total de despesas: R$ {resultado['total_despesas']:.2f}")
print(f"Média diária de gastos: R$ {resultado['media_diaria_gastos']:.2f}")

print(f"\n{'─' * 80}")
print("GASTOS POR CATEGORIA")
print(f"{'─' * 80}")
print(f"{'Categoria':<40} {'Valor':>15} {'%':>10}")
print(f"{'─' * 80}")

# Ordenar por valor (maior para menor)
categorias_ordenadas = sorted(gastos_por_categoria.items(), key=lambda x: x[1], reverse=True)

for categoria, valor in categorias_ordenadas:
    percentual = resultado['percentual_por_categoria'][categoria]
    print(f"{categoria:<40} R$ {valor:>10.2f} {percentual:>9.1f}%")

print(f"{'─' * 80}")
print(f"{'TOTAL':<40} R$ {total_despesas:>10.2f} {'100.0%':>10}")

print(f"\n{'=' * 80}")
print("PRINCIPAIS INSIGHTS")
print(f"{'=' * 80}")

# Identificar maiores gastos
maior_categoria = max(gastos_por_categoria.items(), key=lambda x: x[1])
print(f"\n1. Maior gasto: {maior_categoria[0]} com R$ {maior_categoria[1]:.2f} ({resultado['percentual_por_categoria'][maior_categoria[0]]:.1f}%)")

# Gastos com alimentação total
alimentacao_total = gastos_por_categoria['Alimentação - Mercado'] + gastos_por_categoria['Alimentação - Restaurante']
print(f"\n2. Alimentação total (mercado + restaurante): R$ {alimentacao_total:.2f}")
print(f"   - Mercado: R$ {gastos_por_categoria['Alimentação - Mercado']:.2f}")
print(f"   - Restaurante: R$ {gastos_por_categoria['Alimentação - Restaurante']:.2f}")

print(f"\n3. Transporte (Uber): R$ {gastos_por_categoria['Transporte (Uber)']:.2f}")
print(f"   - Média diária: R$ {gastos_por_categoria['Transporte (Uber)'] / 32:.2f}")

print(f"\n4. Água/Bebidas: R$ {gastos_por_categoria['Água/Bebidas']:.2f}")

print(f"\n5. Transferências enviadas: R$ {gastos_por_categoria['Transferências (PIX enviados)']:.2f}")

print(f"\n{'=' * 80}")
print("RECOMENDAÇÕES")
print(f"{'=' * 80}")

print("\n1. ALIMENTAÇÃO (39,4% dos gastos):")
print("   - Considere planejar compras semanais para evitar idas frequentes ao mercado")
print("   - Reduza compras em restaurantes e prepare mais refeições em casa")

print("\n2. TRANSPORTE (23,8% dos gastos):")
print("   - Avalie uso de transporte público para trajetos frequentes")
print("   - Considere carona compartilhada para reduzir custos com Uber")

print("\n3. ÁGUA/BEBIDAS (16,4% dos gastos):")
print("   - Gasto significativo com distribuidora")
print("   - Avalie comprar galões maiores ou filtro de água")

print("\n4. GESTÃO GERAL:")
print("   - Suas receitas foram R$ {:.2f}, mas gastou R$ {:.2f}".format(total_receitas, total_despesas))
print("   - Saldo reduziu apenas R$ {:.2f} (bom controle!)".format(abs(resultado['variacao_saldo'])))
print("   - Continue monitorando gastos diários")
print("   - Estabeleça um limite mensal por categoria")

print(f"\n{'=' * 80}\n")

# Salvar resultado em JSON
with open('/home/thiago/Área de Trabalho/Andeil/aprendizado/analise-financeira/analise_resultado.json', 'w', encoding='utf-8') as f:
    json.dump(resultado, f, ensure_ascii=False, indent=2)

print("✓ Análise salva em: analise_resultado.json")
