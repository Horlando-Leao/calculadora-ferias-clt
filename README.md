# Calculadora de Viabilidade Real: CLT vs PJ

Este projeto é uma ferramenta interativa desenvolvida para auxiliar profissionais de tecnologia — com foco em Arquitetura de Software e Cloud — a tomarem decisões financeiras entre propostas CLT e contratos PJ.

## 🚀 Contexto e Motivação

- Muitas calculadoras online ignoram benefícios "invisíveis" da CLT (ex.: PLR, 13º).
- Muitos serviços e custos fixos do PJ (ex.: plano de saúde, contabilidade) também são negligenciados.
- Esta aplicação preenche essa lacuna e permite ajuste fino conforme a realidade local (ex.: Recife).

## 🛠️ Tecnologias Utilizadas

- **React.js** — Biblioteca principal para a interface.
- **Tailwind CSS** — Estilização moderna, dark mode e responsividade.
- **Lucide React** — Biblioteca de ícones.
- **useMemo** — Otimizações de performance para cálculos em tempo real.

## 📊 Regras de Negócio e Cálculos

### Modelo CLT

- **Salário Líquido**: estimado com base em INSS e IRRF.
- **13º Salário & 1/3 Férias**: provisões anuais.
- **PLR**: estimativa padrão de 1 salário bruto.
- **FGTS**: exibido como reserva patrimonial (8% mensal).

### Modelo PJ (Ajustado)

- **Imposto**: estimativa baseada no Simples Nacional (Anexo III) — ~11%.
- **Gastos Fixos Editáveis**:
	- Plano de Saúde (referência: Recife).
	- Vale Refeição (valor de mercado).
	- Contabilidade (honorários por emissão de notas).
- **Provisão de Férias**: alerta sobre meses sem faturamento.

## ⚙️ Como Utilizar

- Insira o Salário Bruto da proposta CLT.
- Insira o Faturamento Bruto da proposta PJ.
- Ajuste os sliders para seus gastos mensais reais.
- O veredito é atualizado instantaneamente com a diferença anual.

## 💡 Insight para Arquitetos

- Para profissionais de Arquitetura de Software/Cloud, o risco PJ costuma compensar quando o multiplicador sobre o bruto CLT atinge ~1.8x–2.0x.
- Desenvolvido como um artefato de análise financeira para profissionais de tecnologia.