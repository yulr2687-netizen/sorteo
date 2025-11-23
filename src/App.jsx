import { useState } from 'react';
import Lottie from 'lottie-react';
import loading from './animations/loading.json';
import alAguaAnimacion from './animations/alAguaAnimacion.json';
import premiadoAnimacion from './animations/premiadoAnimacion.json';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size'; 

export default function App(){
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [numAlAgua, setNumAlAgua] = useState("");
  const [numPremiados, SetNumPremiados] = useState("");
  const [cantidadSorteos, setCantidadSorteos] = useState("");
  const [pool, setPool] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [drawSteps, setDrawSteps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [sorteoActual, setSorteoActual] = useState(1);
  const [widht, height] = useWindowSize();
  const [reasignando, setReasignando] = useState(false);


  const getRandom = (list) => list [Math.floor(Math.random() * list.length)];

  const startDraw = async (sorteoIndex = null) => {
  // usa el parámetro si viene, si no usa el estado actual
  const currentSorteo = sorteoIndex ?? sorteoActual;

  if(!start || !end || numAlAgua <= 0 || numPremiados <= 0 || cantidadSorteos <= 0) {
    return alert("Por favor complete todos los campos antes de iniciar.");
  }
  if(end <= start) {
    return alert("El rango es inválido.");
  }

  // Crear pool si está vacío (no sobrescribir pool si ya hay)
  let currentPool = pool.length > 0 
    ? [...pool] 
    : Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // Si queremos proteger el 41 en sorteos previos al 4°, lo excluimos temporalmente
  if (cantidadSorteos === 4 && currentSorteo < 4) {
    currentPool = currentPool.filter(n => n !== 41);
  }

  // Asegurar que 41 esté en pool si vamos a ejecutar el sorteo 4
  if (cantidadSorteos === 4 && currentSorteo === 4 && !currentPool.includes(41)) {
    currentPool.push(41);
    // opcional: ordenar
    currentPool.sort((a,b)=>a-b);
  }

  // sólo setear pool si estaba vacío inicialmente
  if (pool.length === 0) {
    setPool(currentPool);
  }

  const totalNecesarios = numAlAgua + numPremiados;
  if (currentPool.length < totalNecesarios) {
    return alert("No hay suficientes números disponibles para el sorteo.");
  }

  setIsRunning(true);
  setShowModal(true);

  //Simular carga durante 3 segundos
  await new Promise((resolve) => setTimeout(resolve, 3000));

  let tempPool = [...currentPool];
  let seleccionados = [];

  // Caso: último sorteo forzado con 41
  if (cantidadSorteos === 4 && currentSorteo === 4) {
    // Elegir al agua sin incluir 41
    for (let i = 0; i < numAlAgua; i++) {
      const poolSin41 = tempPool.filter(n => n !== 41);
      const alAgua = getRandom(poolSin41);
      seleccionados.push({ type: "Al agua", number: alAgua });
      tempPool = tempPool.filter((n) => n !== alAgua);
    }

    // premiado fijo 41
    seleccionados.push({ type: "Premiado", number: 41 });
    tempPool = tempPool.filter((n) => n !== 41);
  } else {
    // Sorteo normal
    for (let i = 0; i < numAlAgua; i++) {
      const alAgua = getRandom(tempPool);
      seleccionados.push({ type: "Al agua", number: alAgua });
      tempPool = tempPool.filter((n) => n !== alAgua);
    }

    let nuevosPremiados = [];
    for (let i = 0; i < numPremiados; i++) {
      const premiado = getRandom(tempPool);
      seleccionados.push({ type: "Premiado", number: premiado });
      nuevosPremiados.push(premiado);
      tempPool = tempPool.filter((n) => n !== premiado);
    }
  }

  // Actualizar pool eliminando LOS seleccionados de esta ronda (al agua + premiados)
  const eliminados = seleccionados.map((s) => s.number);
  const updatePool = currentPool.filter((n) => !eliminados.includes(n));
  setPool(updatePool);

  // Mostrar paso a paso
  setDrawSteps(seleccionados);
  setCurrentIndex(0);
  setIsRunning(false);
};

  const nextStep = async () => {
    if(currentIndex < drawSteps.length -1){
      setIsRunning(true); //Se muestra la animación de cargando

      //Esperar 2 segundos
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setCurrentIndex(currentIndex + 1);
      setIsRunning(false); //Mostrar el nuevo número
    }
  };

  const siguienteSorteo = () => {
    const next = sorteoActual + 1;
    if (next <= cantidadSorteos) {
      setSorteoActual(next);
      startDraw(next); //Aqui permite iniciar el siguiente sorteo
    }
  };

  const regenerarPremiado = async () => {
    setReasignando(true);

    //Se simula la animacion de carga por 2 segundos
    await new Promise(r => setTimeout(r, 2000));

    const temPool = [...pool];
    const nuevo = getRandom(temPool);

    //Reemplazar el resultado final del sorteo
    const copia = [...drawSteps];
    copia[copia.length - 1] = { type: "Premiado", number: nuevo};

    setDrawSteps(copia);
    setReasignando(false);
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex flex-col items-center justify-center p-6'>
      <h1 className='text-3xl font-extrabold text-blue-900 mb-6 text-center tracking-wide'>
        🎉 Sorteo Rifa 🎉
      </h1>
      <div className='bg-white rounded-xl shadow-2xl p-8 w-full max-w-md space-y-6'>
        <div className='flex gap-4'>
          <input
            type='number'
            value={start}
            onChange={(e) => setStart(parseInt(e.target.value))}
            placeholder='Desde'
            className='border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none'
          />
          <input
            type='number'
            value={end}
            onChange={(e) => setEnd(parseInt(e.target.value))}
            placeholder='Hasta'
            className='border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none'
          />
        </div>

        <div className='flex gap-2'>
          <input
            type='number'
            value={numAlAgua}
            onChange={(e) => setNumAlAgua(parseInt(e.target.value))}
            placeholder='N° al agua'
            className='border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none'
          />
          <input
            type='number'
            value={numPremiados}
            onChange={(e) => SetNumPremiados(parseInt(e.target.value))}
            placeholder='N° premiados'
            className='border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none'
          />
        </div>
        <input
          type="number"
          value={cantidadSorteos}
          onChange={(e) => setCantidadSorteos(parseInt(e.target.value))}
          placeholder="Cantidad de sorteos"
          className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <button
        onClick={() => {
          setSorteoActual(1);
          startDraw(1);
        }}
        disabled={isRunning}
        className={`relative w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out
        ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 shadow-lg'}`}>
          🎁 Iniciar Sorteo
        </button>
      </div>

      {/* Modal emergente */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sd flex items-center justify-center z-50 transition-all'>
          <div className='bg-white bg-opacity-95 rounded-3xl p-10 shadow-2xl text-center w-full max-w-2xl min-h-[320px] flex flex-col justify-between animate-fadeIn'>
            {drawSteps.length > 0 && 
              currentIndex >= 0 &&
              drawSteps[currentIndex].type === "Premiado" && (
              <Confetti 
              width={widht} 
              height={height}
              numberOfPieces={200}
              style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}/>
            )}
            <header className='mb-6 border-b border-gray-300 pb-3'>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {isRunning ? "¡Sorteando!" : `Resultado - Sorteo ${sorteoActual} / ${cantidadSorteos}`}
              </h2>
            </header>
            {isRunning ?(
              <div className='flex flex-col justify-center items-center h-48'>
                <Lottie animationData={loading} loop={true} className='w-40 h-40'/>
              </div>
            ) : (
              <>
                {drawSteps.length > 0 && currentIndex >= 0 && (
                  <div className='flex flex-col items-center space-y-4'>
                    <div className='flex items-center space-x-4'>
                      {/* Texto del resultado */}
                      <div>
                        <p className='text-xl font-semibold text-gray-700'>{drawSteps[currentIndex].type}</p>
                        <p className='text-4xl font-bold text-indigo-600'>{drawSteps[currentIndex].number}</p>
                      </div>

                      {/* Animación segun el tipo */}
                      <Lottie
                        animationData={drawSteps[currentIndex].type === "Al agua"
                          ? alAguaAnimacion 
                          : premiadoAnimacion
                        }
                        loop={true}
                        className='w-40 h-40'
                      />
                    </div>
                  </div>
                )}
                <div className='mt-8 flex justify-center'>
                  {currentIndex < drawSteps.length - 1 ? (
                    <button
                      onClick={nextStep}
                      className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out'>
                      Siguiente
                    </button>
                  ):(
                    <>
                    {/** Si el resultado final es premiado mostrar los dos botones */}
                    {drawSteps[currentIndex].type === "Premiado" 
                    && (
                      <div className='flex flex-col items-center space-y-4'>
                        {/**Boton SI asignado */}
                        <button
                          onClick={siguienteSorteo}
                          className='bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out w-64'
                          >
                            Sí, premiado asignado
                        </button>
                        {/**Boton NO asignado */}
                        <button
                          onClick={regenerarPremiado}
                          disabled={reasignando}
                          className={`${reasignando ? "bg-gray-400" : "bg-yellow-500 hover:bg-yellow-600"} 
                                    text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out w-64`}
                          >
                            {reasignando ? "Generando nuevo..." : "No, volver a sortear"}
                        </button>
                      </div>
                    )}

                    {/*Cuando ya no queden sorteos */}
                    {drawSteps[currentIndex].type !== "Premiado"
                    && (
                      <>
                        {sorteoActual < cantidadSorteos && (
                          <button
                            onClick={siguienteSorteo}
                            className='bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out'
                            >
                            Iniciar siguiente sorteo
                          </button>
                        )}

                        {sorteoActual >= cantidadSorteos && (
                        <button
                          onClick={() => {setShowModal(false);
                                          setDrawSteps([]);
                                          setCurrentIndex(-1);
                                          setSorteoActual(1);
                          }}
                          className='bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out'
                          >
                          Cerrar
                        </button>
                      )}
                      </>
                    )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}