import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  User, 
  Info,
  ShieldCheck,
  CreditCard,
  HeartPulse,
  Calculator,
  DollarSign
} from 'lucide-react';


// Funções de cálculo de impostos CLT (2024)
const calcularINSS = (salarioBruto) => {
  if (salarioBruto <= 0) return 0;

  // Tabela de contribuição progressiva do INSS 2024
  let inss = 0;
  if (salarioBruto <= 1412.00) {
    inss = salarioBruto * 0.075;
  } else if (salarioBruto <= 2666.68) {
    inss = (1412.00 * 0.075) + ((salarioBruto - 1412.00) * 0.09);
  } else if (salarioBruto <= 4000.03) {
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((salarioBruto - 2666.68) * 0.12);
  } else if (salarioBruto <= 7786.02) {
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((salarioBruto - 4000.03) * 0.14);
  } else {
    // Para salários acima do teto, a contribuição é fixa no teto do INSS (R$ 908,85 em 2024)
    inss = 908.85; 
  }
  return inss;
};

const calcularIRRF = (salarioBruto, inss) => {
  if (salarioBruto <= 0) return 0;

  // Base de cálculo = Salário Bruto - Contribuição INSS (sem dependentes)
  const baseCalculo = salarioBruto - inss;
  let irrf = 0;

  // Tabela IRRF 2024
  if (baseCalculo <= 2259.20) {
    irrf = 0;
  } else if (baseCalculo <= 2826.65) {
    irrf = (baseCalculo * 0.075) - 169.44;
  } else if (baseCalculo <= 3751.05) {
    irrf = (baseCalculo * 0.15) - 381.44;
  } else if (baseCalculo <= 4664.68) {
    irrf = (baseCalculo * 0.225) - 662.77;
  } else {
    irrf = (baseCalculo * 0.275) - 896.00;
  }

  return Math.max(irrf, 0); // Garante que o imposto não seja negativo
};


const App = () => {
  // Estados Dinâmicos
  const [cltBruto, setCltBruto] = useState(7500);
  const [pjBruto, setPjBruto] = useState(10000);
  
  const [gastosFixos, setGastosFixos] = useState({
    planoSaude: 450,
    valeRefeicao: 1000,
    contador: 250,
  });

  const handleGastoChange = (field, value) => {
    setGastosFixos(prev => ({ ...prev, [field]: Number(value) }));
  };

  // Cálculo CLT com impostos dinâmicos
  const cltCalculos = useMemo(() => {
    const cltBrutoNumber = Number(cltBruto);
    const inss = calcularINSS(cltBrutoNumber);
    const irrf = calcularIRRF(cltBrutoNumber, inss);
    const liquidoMensal = cltBrutoNumber - inss - irrf;
    
    // Benefícios e provisões anuais
    // Para simplificar, 13º e férias são calculados sobre o líquido, o que é uma aproximação.
    const decimoTerceiro = liquidoMensal;
    const feriasTerco = liquidoMensal / 3;
    const plrEstimada = cltBrutoNumber * 1; // Estimativa de 1 salário bruto
    const fgtsAnual = (cltBrutoNumber * 0.08) * 12;

    const totalAnualLiquido = (liquidoMensal * 12) + decimoTerceiro + feriasTerco + plrEstimada;
    
    return {
      mensal: liquidoMensal,
      anual: totalAnualLiquido,
      detalhes: [
        { label: 'Salário Líquido (após INSS/IRRF)', value: liquidoMensal },
        { label: '13º Salário (est.)', value: decimoTerceiro },
        { label: '1/3 Férias (est.)', value: feriasTerco },
        { label: 'PLR (est. 1 sal.)', value: plrEstimada },
      ],
      patrimonio: fgtsAnual
    };
  }, [cltBruto]);


  // Cálculo PJ Dinâmico
  const pjCalculos = useMemo(() => {
    // Alíquota média (pode variar de 6% a 15% dependendo do fator R, usamos 11% conforme imagem)
    const pjBrutoNumber = Number(pjBruto);
    const impostoPj = pjBrutoNumber * 0.11;
    const liquidoBrutoPj = pjBrutoNumber - impostoPj;
    
    const totalGastosFixos = gastosFixos.planoSaude + gastosFixos.valeRefeicao + gastosFixos.contador;
    const realLiquidoMensal = liquidoBrutoPj - totalGastosFixos;
    const anualLiquido = realLiquidoMensal * 12;

    return {
      mensal: realLiquidoMensal,
      anual: anualLiquido,
      imposto: impostoPj,
      gastos: totalGastosFixos,
      detalhes: [
        { label: 'Faturamento Bruto', value: pjBrutoNumber },
        { label: 'Imposto Est. (11%)', value: -impostoPj },
        { label: 'Custos Operacionais', value: -totalGastosFixos },
      ]
    };
  }, [pjBruto, gastosFixos]);

  const diferencaAnual = pjCalculos.anual - cltCalculos.anual;
  const isPjBetter = diferencaAnual > 0;

  const formatCurrency = (val) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Interativo */}
        <header className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Calculadora de Viabilidade Real
            </h1>
            <p className="text-slate-400 mt-2 italic">Ajuste os valores para simular seu cenário</p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 uppercase font-bold mb-1 ml-1 text-purple-400">Salário CLT Bruto</label>
              <input 
                type="number" 
                value={cltBruto} 
                onChange={(e) => setCltBruto(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white w-32 focus:border-purple-500 outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 uppercase font-bold mb-1 ml-1 text-cyan-400">Faturamento PJ</label>
              <input 
                type="number" 
                value={pjBruto} 
                onChange={(e) => setPjBruto(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white w-32 focus:border-cyan-500 outline-none transition-colors"
              />
            </div>
          </div>
        </header>

        {/* Resumo de Decisão */}
        <div className={`mb-8 p-6 rounded-2xl border transition-all duration-500 ${isPjBetter ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full transition-colors duration-500 ${isPjBetter ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {isPjBetter ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Veredito: {isPjBetter ? 'O modelo PJ é financeiramente superior' : 'A CLT protege melhor sua renda'}
              </h2>
              <p className="text-slate-300">
                Diferença anual de <span className="font-bold underline">{formatCurrency(Math.abs(diferencaAnual))}</span> no bolso.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs de Gastos Fixos PJ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3 text-rose-400 font-medium text-sm">
                <HeartPulse size={16} /> Saúde (Para uma pessoa de 25 anos)
              </div>
              <input 
                type="range" min="0" max="2000" step="50"
                value={gastosFixos.planoSaude}
                onChange={(e) => handleGastoChange('planoSaude', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 mb-2"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Estimativa Mensal</span>
                <span className="font-mono font-bold text-white">{formatCurrency(gastosFixos.planoSaude)}</span>
              </div>
           </div>

           <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3 text-orange-400 font-medium text-sm">
                <CreditCard size={16} /> Alimentação (VR)
              </div>
              <input 
                type="range" min="0" max="3000" step="100"
                value={gastosFixos.valeRefeicao}
                onChange={(e) => handleGastoChange('valeRefeicao', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-2"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Custo Desejado</span>
                <span className="font-mono font-bold text-white">{formatCurrency(gastosFixos.valeRefeicao)}</span>
              </div>
           </div>

           <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-medium text-sm">
                <Calculator size={16} /> Contabilidade
              </div>
              <input 
                type="range" min="0" max="1000" step="50"
                value={gastosFixos.contador}
                onChange={(e) => handleGastoChange('contador', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Serviços Mensais</span>
                <span className="font-mono font-bold text-white">{formatCurrency(gastosFixos.contador)}</span>
              </div>
           </div>
        </div>

        {/* Painéis de Comparação */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* Coluna CLT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
            <div className="flex items-center gap-2 mb-6 text-purple-400 font-semibold border-b border-slate-800 pb-2">
              <ShieldCheck size={20} />
              <h3>Balanço CLT</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm text-slate-400">Disponível p/ Mês</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(cltCalculos.mensal)}</p>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-800/50">
                {cltCalculos.detalhes.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-300">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <p className="text-xs text-purple-400 uppercase font-bold mb-1">Total Líquido Anual</p>
                <p className="text-2xl font-black text-purple-100">{formatCurrency(cltCalculos.anual)}</p>
                <p className="text-[10px] text-purple-500 mt-2">+ {formatCurrency(cltCalculos.patrimonio)} de FGTS (Reserva Oculta)</p>
              </div>
            </div>
          </div>

          {/* Coluna PJ */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
            <div className="flex items-center gap-2 mb-6 text-cyan-400 font-semibold border-b border-slate-800 pb-2">
              <User size={20} />
              <h3>Balanço PJ Ajustado</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm text-slate-400">Líquido Real p/ Mês</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(pjCalculos.mensal)}</p>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-800/50">
                <div className="flex justify-between text-sm italic">
                  <span className="text-slate-500">Bruto Mensal</span>
                  <span className="font-medium text-slate-300">{formatCurrency(pjBruto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Imposto de Notas</span>
                  <span className="text-rose-400">-{formatCurrency(pjCalculos.imposto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium text-red-100">Custo Manutenção</span>
                  <span className="text-rose-400">-{formatCurrency(pjCalculos.gastos)}</span>
                </div>
              </div>
              <div className="mt-6 bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl">
                <p className="text-xs text-cyan-400 uppercase font-bold mb-1">Total Líquido Anual</p>
                <p className="text-2xl font-black text-cyan-100">{formatCurrency(pjCalculos.anual)}</p>
                <p className="text-[10px] text-cyan-600 mt-2">Considerando 12 meses de faturamento pleno</p>
              </div>
            </div>
          </div>

        </div>

        {/* Alerta de Arquiteto Cloud */}
        <div className="bg-slate-900 border border-blue-900/50 p-6 rounded-2xl flex gap-4 items-start">
          <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400">
            <Info size={24} />
          </div>
          <div>
            <h4 className="font-bold text-blue-300 mb-1">
              Insight p/ Arquiteto de Software
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Diferente da CLT, o PJ não paga quando você para. Se quiser tirar 30 dias de férias (faturamento zero no mês), seu balanço anual real cai para <span className="text-white font-bold">{formatCurrency(pjCalculos.anual - (pjBruto - pjCalculos.imposto))}</span>. 
              Como Desenvolvedor, lembre-se que seu conhecimento vale mais: em negociações PJ, tente sempre atingir o <strong>multiplicador de 1.8x a 2.0x</strong> sobre o bruto CLT para valer o risco.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
