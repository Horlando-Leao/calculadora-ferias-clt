import React, { useState, useCallback } from 'react';
import { Calculator, Calendar, DollarSign, TrendingUp, AlertTriangle, Gift, Plus, Minus } from 'lucide-react';

// Funções de cálculo de impostos CLT (2024)
const calcularINSS = (baseDeCalculo) => {
  if (baseDeCalculo <= 0) return 0;

  // Tabela de contribuição progressiva do INSS 2024
  let inss = 0;
  const teto = 7786.02;
  const salario = Math.min(baseDeCalculo, teto);

  if (salario <= 1412.00) {
    inss = salario * 0.075;
  } else if (salario <= 2666.68) {
    inss = (1412.00 * 0.075) + ((salario - 1412.00) * 0.09);
  } else if (salario <= 4000.03) {
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((salario - 2666.68) * 0.12);
  } else { // Acima de 4000.03 até o teto
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((salario - 4000.03) * 0.14);
  }
  return inss;
};

const calcularIRRF = (baseDeCalculo) => {
  if (baseDeCalculo <= 0) return 0;
  
  // Tabela IRRF 2024 (sem dedução por dependentes)
  const baseCalculo = baseDeCalculo;
  let irrf = 0;

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

// Tabela de IRRF específica para PLR (2024)
const calcularIRRF_PLR = (valorPLR) => {
  if (valorPLR <= 7640.80) {
    return 0;
  } else if (valorPLR <= 9922.28) {
    return (valorPLR * 0.075) - 573.06;
  } else if (valorPLR <= 13167.00) {
    return (valorPLR * 0.15) - 1317.23;
  } else if (valorPLR <= 16380.38) {
    return (valorPLR * 0.225) - 2304.76;
  } else {
    return (valorPLR * 0.275) - 3123.78;
  }
};


const App = () => {
  // 2. Estado do Componente
  const [salarioBruto, setSalarioBruto] = useState(5000);
  const [diasFerias, setDiasFerias] = useState(20);
  const [diasVendidos, setDiasVendidos] = useState(10);
  const [adiantamento13, setAdiantamento13] = useState(true);
  const [incluirPLR, setIncluirPLR] = useState(true);
  const [plrPorcentagem, setPlrPorcentagem] = useState(100);
  const [calculos, setCalculos] = useState(null);
  const [erros, setErros] = useState({});

  // Função para formatar valores em moeda brasileira
  const formatarMoeda = (valor) => {
    if (typeof valor !== 'number' || isNaN(valor)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  // 3. Lógica de Cálculo
  const calcularFerias = useCallback(() => {
    setCalculos(null);
    const novosErros = {};

    const salario = parseFloat(salarioBruto);
    const ferias = parseInt(diasFerias, 10);
    const vendidos = parseInt(diasVendidos, 10);
    
    let plrPerc = 0;
    if (incluirPLR) {
      plrPerc = parseFloat(plrPorcentagem) || 0;
    }

    // a) Valide as entradas
    if (isNaN(salario) || salario < 1412) {
      novosErros.salarioBruto = 'Salário deve ser de no mínimo R$ 1.412,00.';
    }
    if (isNaN(ferias) || ferias < 1 || ferias > 30) {
      novosErros.diasFerias = 'Dias a gozar devem ser entre 1 e 30.';
    }
    if (isNaN(vendidos) || vendidos < 0 || vendidos > 10) {
      novosErros.diasVendidos = 'A venda é limitada a 10 dias.';
    }
    if (ferias + vendidos > 30) {
        novosErros.diasFerias = 'A soma de dias a gozar e dias vendidos não pode exceder 30.';
    }
    if (vendidos > 0 && ferias < 15) {
      novosErros.diasFerias = 'Ao vender férias, você deve gozar de no mínimo 15 dias.';
    }
    if (incluirPLR && plrPerc < 0) {
      novosErros.plr = 'A porcentagem da PLR não pode ser negativa.';
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }
    setErros({});

    // b) Calcule os valores
    const valorDiaFerias = salario / 30;

    const diasGozados = ferias;
    const valorFeriasGozadas = valorDiaFerias * diasGozados;
    const adicionalFerias = valorFeriasGozadas / 3;
    const subtotalFeriasGozadas = valorFeriasGozadas + adicionalFerias;

    let valorAbonoPecuniario = 0, adicionalAbono = 0, subtotalAbono = 0;
    if (vendidos > 0) {
      valorAbonoPecuniario = valorDiaFerias * vendidos;
      adicionalAbono = valorAbonoPecuniario / 3;
      subtotalAbono = valorAbonoPecuniario + adicionalAbono;
    }

    let valorAdiantamento13 = 0;
    if (adiantamento13) {
      valorAdiantamento13 = salario * 0.5;
    }
    
    const valorPLR = incluirPLR ? salario * (plrPerc / 100) : 0;

    // c) Calcule Impostos
    const inssFerias = calcularINSS(subtotalFeriasGozadas);
    const irrfFerias = calcularIRRF(subtotalFeriasGozadas - inssFerias);
    const irrfPLR = calcularIRRF_PLR(valorPLR);

    // d) Calcule Totais
    const subtotalFerias = subtotalFeriasGozadas + subtotalAbono;
    const totalBruto = subtotalFerias + valorAdiantamento13 + valorPLR;
    const totalDescontos = inssFerias + irrfFerias + irrfPLR;
    const totalLiquido = totalBruto - totalDescontos;
    
    // e) Armazene os resultados
    setCalculos({
      diasGozados, valorFeriasGozadas, adicionalFerias, subtotalFeriasGozadas,
      diasVendidos: vendidos, valorAbonoPecuniario, adicionalAbono, subtotalAbono,
      subtotalFerias, valorAdiantamento13,
      valorPLR, irrfPLR, plrLiquido: valorPLR - irrfPLR,
      totalBruto,
      inss: inssFerias,
      irrf: irrfFerias,
      totalDescontos,
      totalLiquido,
    });

  }, [salarioBruto, diasFerias, diasVendidos, adiantamento13, plrPorcentagem, incluirPLR]);
  
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setCalculos(null);
    setErros({});
  };
  
  const handlePlrChange = (amount) => {
    setPlrPorcentagem(prev => Math.max(0, (Number(prev) || 0) + amount));
    setCalculos(null);
    setErros({});
  };

  const handleCheckboxChange = (setter) => (e) => {
    setter(e.target.checked);
    setCalculos(null);
    setErros({});
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full p-3 mb-4">
            <Calculator size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Calculadora de Férias e PLR
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Simule o cálculo de suas férias, incluindo abono, 13º e PLR, conforme a CLT.
          </p>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Atualizado em 29/02/2026 com as últimas regras de impostos e benefícios.
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            
            <div className="flex flex-col">
              <label htmlFor="salarioBruto" className="font-semibold mb-2 flex items-center">
                <DollarSign size={16} className="mr-2 text-gray-500" /> Salário Bruto Mensal
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">R$</span>
                <input id="salarioBruto" type="number" value={salarioBruto} onChange={handleInputChange(setSalarioBruto)} placeholder="5000.00" min="1412"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 ${erros.salarioBruto ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                />
              </div>
              {erros.salarioBruto && <p className="text-red-600 text-sm mt-1">{erros.salarioBruto}</p>}
            </div>

            <div className="flex flex-col">
              <label htmlFor="diasFerias" className="font-semibold mb-2 flex items-center">
                <Calendar size={16} className="mr-2 text-gray-500" /> Dias de Férias a Gozar
              </label>
              <input id="diasFerias" type="number" value={diasFerias} onChange={handleInputChange(setDiasFerias)} min="1" max="30"
                className={`w-full px-4 py-2 rounded-lg border-2 ${erros.diasFerias ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
              />
              {erros.diasFerias && <p className="text-red-600 text-sm mt-1">{erros.diasFerias}</p>}
            </div>

            <div className="flex flex-col">
              <label htmlFor="diasVendidos" className="font-semibold mb-2">Dias para Vender (Abono)</label>
              <input id="diasVendidos" type="number" value={diasVendidos} onChange={handleInputChange(setDiasVendidos)} min="0" max="10"
                className={`w-full px-4 py-2 rounded-lg border-2 ${erros.diasVendidos ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
              />
              <p className="text-sm text-gray-500 mt-1">Máximo 1/3 do período (até 10 dias).</p>
              {erros.diasVendidos && <p className="text-red-600 text-sm mt-1">{erros.diasVendidos}</p>}
            </div>

            {/* Opções */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 h-full">
                  <input id="adiantamento13" type="checkbox" checked={adiantamento13} onChange={handleCheckboxChange(setAdiantamento13)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="adiantamento13" className="ml-3 font-medium text-gray-800">
                    Adiantar 1ª Parcela do 13º?
                  </label>
                </div>
                 <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 h-full">
                  <input id="incluirPLR" type="checkbox" checked={incluirPLR} onChange={handleCheckboxChange(setIncluirPLR)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="incluirPLR" className="ml-3 font-medium text-gray-800">
                    Adicionar PLR no cálculo?
                  </label>
                </div>
            </div>

            {/* PLR Input Condicional */}
            {incluirPLR && (
              <div className="flex flex-col md:col-span-2">
                <label htmlFor="plr" className="font-semibold mb-2 flex items-center"><Gift size={16} className="mr-2 text-gray-500" /> PLR (% do Salário)</label>
                <div className="flex">
                  <button onClick={() => handlePlrChange(-10)} className="px-3 bg-gray-200 text-gray-700 rounded-l-lg hover:bg-gray-300 transition-colors"><Minus size={16}/></button>
                  <div className="relative flex-grow">
                    <input id="plr" type="number" value={plrPorcentagem} onChange={handleInputChange(setPlrPorcentagem)}
                      className={`w-full text-center py-2 border-y-2 pr-8 ${erros.plr ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-500">%</span>
                  </div>
                  <button onClick={() => handlePlrChange(10)} className="px-3 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"><Plus size={16}/></button>
                </div>
                <p className="text-sm text-gray-500 mt-1">A Participação nos Lucros e Resultados (PLR) é um bônus pago pela empresa.</p>
                {erros.plr && <p className="text-red-600 text-sm mt-1">{erros.plr}</p>}
              </div>
            )}
            
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <button onClick={calcularFerias}
              className="w-full md:w-auto bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto"
            >
              <TrendingUp size={20} className="mr-2" />
              Calcular Valores
            </button>
          </div>
        </div>

        {calculos && (
          <div className="space-y-6 mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-center">Resultado do Cálculo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Férias Gozadas</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span>Dias gozados:</span> <span className="font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">{calculos.diasGozados} dias</span></li>
                  <li className="flex justify-between"><span>Valor das Férias:</span> <span className="font-mono">{formatarMoeda(calculos.valorFeriasGozadas)}</span></li>
                  <li className="flex justify-between"><span>1/3 Constitucional:</span> <span className="font-mono">{formatarMoeda(calculos.adicionalFerias)}</span></li>
                </ul>
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-semibold">Subtotal (Tributável):</span>
                  <span className="text-lg font-bold text-blue-800">{formatarMoeda(calculos.subtotalFeriasGozadas)}</span>
                </div>
              </div>

              {calculos.diasVendidos > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold mb-4 text-green-800">Abono Pecuniário (Venda)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span>Dias vendidos:</span> <span className="font-bold bg-green-100 text-green-800 px-2 py-1 rounded">{calculos.diasVendidos} dias</span></li>
                    <li className="flex justify-between"><span>Valor do Abono:</span> <span className="font-mono">{formatarMoeda(calculos.valorAbonoPecuniario)}</span></li>
                    <li className="flex justify-between"><span>1/3 sobre Abono:</span> <span className="font-mono">{formatarMoeda(calculos.adicionalAbono)}</span></li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-semibold">Subtotal (Isento):</span>
                    <span className="text-lg font-bold text-green-800">{formatarMoeda(calculos.subtotalAbono)}</span>
                  </div>
                </div>
              )}
              
              {adiantamento13 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold mb-4 text-amber-800">Adiantamento 13º Salário</h3>
                   <div className="flex justify-between items-center">
                     <span className="text-sm">1ª Parcela (50%, Isento):</span>
                     <span className="text-lg font-bold text-amber-800">{formatarMoeda(calculos.valorAdiantamento13)}</span>
                   </div>
                </div>
              )}
              
              {calculos.valorPLR > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <h3 className="text-lg font-semibold mb-4 text-purple-800">PLR (Participação nos Lucros)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span>Valor Bruto:</span> <span className="font-mono">{formatarMoeda(calculos.valorPLR)}</span></li>
                    <li className="flex justify-between text-red-600"><span>IRRF sobre PLR:</span> <span className="font-mono">-{formatarMoeda(calculos.irrfPLR)}</span></li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-semibold">Líquido da PLR:</span>
                    <span className="text-lg font-bold text-purple-800">{formatarMoeda(calculos.plrLiquido)}</span>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 flex flex-col justify-center items-center text-center">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">TOTAL BRUTO A RECEBER</h3>
                <p className="text-3xl lg:text-4xl font-bold tracking-tighter text-blue-600">
                  {formatarMoeda(calculos.totalBruto)}
                </p>
                <p className="text-sm text-gray-500 mt-1">(Soma de todos os proventos brutos)</p>
              </div>

              <div className="md:col-span-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-2xl p-6 flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold mb-2">VALOR LÍQUIDO FINAL</h3>
                <p className="text-4xl lg:text-5xl font-black tracking-tighter">
                  {formatarMoeda(calculos.totalLiquido)}
                </p>
                <div className="w-full mt-4 pt-3 border-t border-green-500/50 flex flex-wrap justify-around text-xs">
                  <div className="text-center p-1">
                    <span className="font-bold block opacity-80">(-) {formatarMoeda(calculos.inss)}</span>
                    <span className="opacity-80">INSS Férias</span>
                  </div>
                  <div className="text-center p-1">
                    <span className="font-bold block opacity-80">(-) {formatarMoeda(calculos.irrf)}</span>
                    <span className="opacity-80">IRRF Férias</span>
                  </div>
                   {calculos.irrfPLR > 0 && <div className="text-center p-1">
                    <span className="font-bold block opacity-80">(-) {formatarMoeda(calculos.irrfPLR)}</span>
                    <span className="opacity-80">IRRF PLR</span>
                  </div>}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-center mb-6">Informações Importantes (CLT)</h3>
          <ul className="space-y-4 text-gray-600 max-w-3xl mx-auto text-sm">
            <li className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Prazo de Pagamento:</strong> O pagamento das férias, incluindo o terço constitucional, deve ser feito até 2 dias antes do início do período de descanso.
              </span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Descontos (INSS/IRRF):</strong> O valor das férias (férias gozadas + 1/3) sofre descontos de INSS e IRRF. O abono pecuniário é isento de ambos.
              </span>
            </li>
             <li className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>
                <strong>PLR (Lucros e Resultados):</strong> A PLR não tem desconto de INSS e possui uma tabela de Imposto de Renda (IRRF) exclusiva, calculada em separado do salário.
              </span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>
                <strong>13º Salário:</strong> A 2ª parcela, paga até 20 de dezembro, terá os descontos de INSS e IRRF sobre o valor integral do 13º.
              </span>
            </li>
          </ul>
        </footer>

      </div>
    </div>
  );
};

export default App;
