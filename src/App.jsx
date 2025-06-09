import { useState, useRef, useEffect } from 'react';

export default function App() {
  // State for container selection
  const [container, setContainer] = useState('HC40');
  
  // State for input parameters
  const [granel, setGranel] = useState(0);
  const [estibado, setEstibado] = useState(0);
  const [granelNuevo, setGranelNuevo] = useState(0);
  const [estibadoNuevo, setEstibadoNuevo] = useState(0);
  
  // State for references
  const [references, setReferences] = useState([{
    nombre: '',
    largo: '',
    ancho: '',
    alto: '',
    peso: '',
    cantidad: ''
  }]);
  
  // State for results
  const [results, setResults] = useState('');
  
  // Refs for result text area
  const resultsRef = useRef(null);
  
  // Container dimensions
  const contenedores = {
    'HC40': { largo: 1200, ancho: 235, alto: 252, peso_max: 26400 },
    '20ft': { largo: 589, ancho: 235, alto: 233, peso_max: 21700 }
  };
  
  // Add a new reference
  const agregarReferencia = () => {
    setReferences([...references, {
      nombre: '',
      largo: '',
      ancho: '',
      alto: '',
      peso: '',
      cantidad: ''
    }]);
  };
  
  // Remove a reference
  const removerReferencia = (index) => {
    if (references.length > 1) {
      const nuevasReferencias = [...references];
      nuevasReferencias.splice(index, 1);
      setReferences(nuevasReferencias);
    }
  };
  
  // Clear all fields
  const limpiarCampos = () => {
    setGranel(0);
    setEstibado(0);
    setGranelNuevo(0);
    setEstibadoNuevo(0);
    
    // Keep only the first reference and clear its fields
    const primerReferencia = [{
      nombre: '',
      largo: '',
      ancho: '',
      alto: '',
      peso: '',
      cantidad: ''
    }];
    setReferences(primerReferencia);
    
    // Clear results
    setResults('');
  };
  
  // Calculate the simulation
  const ejecutarCalculo = () => {
    try {
      // Get container specs
      const cont = contenedores[container];
      
      // Process references - filter out empty ones
      const referenciasValidas = references.filter(ref => 
        ref.cantidad && ref.nombre && ref.largo && ref.ancho && ref.alto && ref.peso
      );
      
      if (referenciasValidas.length === 0) {
        alert("Debe ingresar al menos una referencia válida");
        return;
      }
      
      // Extract values
      const nombres = [];
      const largo = [];
      const ancho = [];
      const alto = [];
      const peso = [];
      const cantidadDeseada = [];
      
      referenciasValidas.forEach(ref => {
        nombres.push(ref.nombre);
        largo.push(parseFloat(ref.largo) || 0);
        ancho.push(parseFloat(ref.ancho) || 0);
        alto.push(parseFloat(ref.alto) || 0);
        peso.push(parseFloat(ref.peso) || 0);
        cantidadDeseada.push(parseInt(ref.cantidad) || 0);
      });
      
      // Calculate units per layer
      const capa1 = largo.map((val, i) => 
        Math.floor(120 / val) * Math.floor(100 / ancho[i])
      );
      
      const capa2 = largo.map((val, i) => 
        Math.floor(120 / ancho[i]) * Math.floor(100 / val)
      );
      
      const unidadesCapa = capa1.map((val, i) => 
        Math.max(val, capa2[i])
      );
      
      // Calculate units by height
      const unidadesAltura = alto.map(val => 
        Math.floor(cont.alto / val)
      );
      
      // Total units per pallet
      const unidadesEstiba = unidadesCapa.map((val, i) => 
        val * unidadesAltura[i]
      );
      
      // Total desired quantity
      const totalDeseado = cantidadDeseada.reduce((sum, val) => sum + val, 0);
      
      // Proportion for each item
      const proporcion = cantidadDeseada.map(val => 
        val / totalDeseado
      );
      
      // Volume calculations
      const volumenRef = largo.map((val, i) => 
        val * ancho[i] * alto[i]
      );
      
      const volumenTotalDeseado = volumenRef.reduce((sum, val, i) => 
        sum + (val * cantidadDeseada[i]), 0
      );
      
      // Weight calculations
      const pesoTotalDeseado = peso.reduce((sum, val, i) => 
        sum + (val * cantidadDeseada[i]), 0
      );
      
      // Volume limit
      const limiteVolumen = (cont.largo * cont.ancho * cont.alto) / 
                           (volumenTotalDeseado / totalDeseado);
      
      // Weight limit
      const limitePeso = cont.peso_max / (pesoTotalDeseado / totalDeseado);
      
      // Pallet limits
      const estibasLargo = Math.floor(cont.largo / 120);
      const estibasAncho = Math.floor(cont.ancho / 100);
      const totalEstibas = estibasLargo * estibasAncho;
      
      const sumProporcionEstiba = cantidadDeseada.reduce((sum, val, i) => 
        sum + (val / (unidadesEstiba[i] * totalDeseado)), 0
      );
      
      const limiteEstibas = totalEstibas / sumProporcionEstiba;
      
      // Determine limiting factor
      const factorLimitante = Math.min(
        limiteVolumen,
        limitePeso,
        limiteEstibas,
        totalDeseado
      );
      
      // Apply adjustment factors
      const factorAjuste = (1 + granel/100 + estibado/100 + granelNuevo/100 + estibadoNuevo/100)/4;
      const factorFinal = factorLimitante * factorAjuste;
      
      // Final quantities
      const cantidadFinal = proporcion.map((prop, i) => 
        Math.min(
          Math.floor(prop * factorFinal),
          unidadesEstiba[i] * Math.floor(prop * factorFinal / unidadesEstiba[i])
        )
      );
      
      // Pallets used
      const estibasUsadas = cantidadFinal.map((cant, i) => 
        Math.ceil(cant / unidadesEstiba[i])
      );
      
      // Additional calculations
      const volumenOcupado = cantidadFinal.map((cant, i) => 
        cant * volumenRef[i]
      );
      
      const pesoOcupado = cantidadFinal.map((cant, i) => 
        cant * peso[i]
      );
      
      const volumenTotalOcupado = volumenOcupado.reduce((sum, val) => sum + val, 0);
      const pesoTotalOcupado = pesoOcupado.reduce((sum, val) => sum + val, 0);
      const volumenContenedor = cont.largo * cont.ancho * cont.alto;
      const espacioRestante = volumenContenedor - volumenTotalOcupado;
      const pesoRestante = cont.peso_max - pesoTotalOcupado;
      const totalEstibasUsadas = estibasUsadas.reduce((sum, val) => sum + val, 0);
      
      // Generate report
      let reporte = [
        "RESULTADO FINAL:",
        "-".repeat(40)
      ];
      
      for (let i = 0; i < referenciasValidas.length; i++) {
        reporte = reporte.concat([
          `Referencia: ${nombres[i]}`,
          `  Cantidad deseada: ${cantidadDeseada[i]}`,
          `  Cantidad final: ${cantidadFinal[i]}`,
          `  Unidades por estiba: ${unidadesEstiba[i]}`,
          `  Estibas usadas: ${estibasUsadas[i]}`,
          `  Volumen ocupado: ${volumenOcupado[i].toLocaleString('es')} cm³`,
          `  Peso ocupado: ${pesoOcupado[i].toLocaleString('es', { maximumFractionDigits: 1 })} kg`,
          "-".repeat(40)
        ]);
      }
      
      reporte = reporte.concat([
        "TOTALES:",
        "",
        `  Volumen total ocupado: ${volumenTotalOcupado.toLocaleString('es')} cm³`,
        `  Peso total ocupado: ${pesoTotalOcupado.toLocaleString('es', { maximumFractionDigits: 1 })} kg`,
        `  Estibas totales usadas: ${totalEstibasUsadas} de ${totalEstibas}`,
        `  Espacio restante: ${espacioRestante.toLocaleString('es')} cm³`,
        `  Peso restante: ${pesoRestante.toLocaleString('es', { maximumFractionDigits: 1 })} kg`,
        "-".repeat(40)
      ]);
      
      // Set results
      setResults(reporte.join('\n'));
      
      // Scroll to results
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Error en simulación:", error);
      alert(`Error en simulación: ${error.message}`);
    }
  };
  
  // Handle reference input changes
  const handleReferenceChange = (index, field, value) => {
    const nuevasReferencias = [...references];
    nuevasReferencias[index][field] = value;
    setReferences(nuevasReferencias);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Simulación de Empaque Avanzada</h1>
          <p className="text-blue-200 max-w-2xl mx-auto">
            Optimiza la distribución de mercancía en contenedores con esta herramienta de simulación
          </p>
        </header>
        
        {/* Main form */}
        <div className="space-y-6">
          {/* Configuration Parameters Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-semibold mb-4 border-b border-blue-600 pb-2">Parámetros de Configuración</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block mb-1 text-blue-100">Contenedor:</label>
                <select 
                  value={container}
                  onChange={(e) => setContainer(e.target.value)}
                  className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="HC40">HC40</option>
                  <option value="20ft">20ft</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1 text-blue-100">Granel (%):</label>
                <input
                  type="number"
                  value={granel}
                  min="0"
                  max="100"
                  onChange={(e) => setGranel(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-blue-100">Estibado (%):</label>
                <input
                  type="number"
                  value={estibado}
                  min="0"
                  max="100"
                  onChange={(e) => setEstibado(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-blue-100">Granel Nuevo (%):</label>
                <input
                  type="number"
                  value={granelNuevo}
                  min="0"
                  max="100"
                  onChange={(e) => setGranelNuevo(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-blue-100">Estibado Nuevo (%):</label>
                <input
                  type="number"
                  value={estibadoNuevo}
                  min="0"
                  max="100"
                  onChange={(e) => setEstibadoNuevo(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* References Section */}
          <div className="bg-blue-800/80 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold border-b border-blue-600 pb-2">Datos de Referencias</h2>
              <button
                onClick={agregarReferencia}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-white flex items-center"
              >
                <span className="mr-1">+</span> Agregar
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {references.map((ref, idx) => (
                <div key={idx} className="mb-4 p-4 bg-blue-900/50 rounded-xl border border-blue-700">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <label className="block text-sm mb-1 text-blue-200">Nombre:</label>
                      <input
                        type="text"
                        value={ref.nombre}
                        placeholder="Nombre ref."
                        onChange={(e) => handleReferenceChange(idx, 'nombre', e.target.value)}
                        className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 text-blue-200">Largo (cm):</label>
                      <input
                        type="number"
                        value={ref.largo}
                        min="0.1"
                        step="0.1"
                        placeholder="Largo"
                        onChange={(e) => handleReferenceChange(idx, 'largo', e.target.value)}
                        className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 text-blue-200">Ancho (cm):</label>
                      <input
                        type="number"
                        value={ref.ancho}
                        min="0.1"
                        step="0.1"
                        placeholder="Ancho"
                        onChange={(e) => handleReferenceChange(idx, 'ancho', e.target.value)}
                        className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 text-blue-200">Alto (cm):</label>
                      <input
                        type="number"
                        value={ref.alto}
                        min="0.1"
                        step="0.1"
                        placeholder="Alto"
                        onChange={(e) => handleReferenceChange(idx, 'alto', e.target.value)}
                        className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 text-blue-200">Peso (kg):</label>
                      <input
                        type="number"
                        value={ref.peso}
                        min="0.1"
                        step="0.1"
                        placeholder="Peso"
                        onChange={(e) => handleReferenceChange(idx, 'peso', e.target.value)}
                        className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 text-blue-200">Cantidad:</label>
                      <input
                        type="number"
                        value={ref.cantidad}
                        min="1"
                        placeholder="Cantidad"
                        onChange={(e) => handleReferenceChange(idx, 'cantidad', e.target.value)}
                        className="w-full p-2 rounded-lg bg-blue-900/70 border border-blue-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  {/* Remove button (except for last reference) */}
                  {references.length > 1 && (
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => removerReferencia(idx)}
                        className="px-3 py-1 text-sm bg-red-700/50 hover:bg-red-600 rounded-lg text-red-100 flex items-center"
                      >
                        <span className="mr-1">×</span> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={ejecutarCalculo}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium shadow-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Calcular
            </button>
            
            <button
              onClick={limpiarCampos}
              className="px-5 py-3 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 rounded-lg text-white font-medium shadow-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Limpiar
            </button>
            
            <button
              onClick={() => {
                if (results.trim()) {
                  window.print();
                } else {
                  alert("No hay resultados para imprimir");
                }
              }}
              className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg text-white font-medium shadow-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Imprimir
            </button>
          </div>
          
          {/* Results Section */}
          <div 
            ref={resultsRef}
            className="bg-blue-800/80 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-xl mt-6"
          >
            <h2 className="text-xl font-semibold mb-4 border-b border-blue-600 pb-2">Resultados de Simulación</h2>
            <div className="bg-blue-900/50 p-4 rounded-lg min-h-[300px] max-h-[500px] overflow-auto font-mono text-sm whitespace-pre-wrap border border-blue-700">
              {results || (
                <div className="text-blue-300 h-full flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Los resultados aparecerán aquí después de realizar el cálculo</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-blue-300 text-sm">
          <p>© {new Date().getFullYear()} Simulación de Empaque Avanzada | Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  );
}
