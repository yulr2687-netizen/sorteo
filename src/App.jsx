
import { useState } from 'react';
import Lottie from 'lottie-react';
import loading from './animations/loading.json';
import alAguaAnimacion from './animations/alAguaAnimacion.json';
import premiadoAnimacion from './animations/premiadoAnimacion.json';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';

export default function App() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [numAlAgua, setNumAlAgua] = useState("");
  const [numPremiados, setNumPremiados] = useState("");
  const [cantidadSorteos, setCantidadSorteos] = useState("");
  const [pool, setPool] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [drawSteps, setDrawSteps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [sorteoActual, setSorteoActual] = useState(1);
  const [width, height] = useWindowSize();
  const [reasignando, setReasignando] = useState(false);
  const [nombresTexto, setNombresTexto] = useState("");

  // Modalidad del sorteo: números o participantes
  const [modoSorteo, setModoSorteo] = useState("numeros");

  // Procesar los nombres ingresados, uno por línea
  const nombres = nombresTexto
    .split(/\r?\n/)
    .map((nombre) => nombre.trim())
    .filter((nombre) => nombre !== "");

  // Calcular cuántos números existen en el rango
  const cantidadNumeros =
    start !== "" && end !== "" && end >= start
      ? end - start + 1
      : 0;

  // Asociar automáticamente cada nombre con su número
  const asignaciones = Array.from(
    { length: cantidadNumeros },
    (_, i) => ({
      number: start + i,
      name: nombres[i] || "",
    })
  );

  // Obtener el nombre correspondiente a un número
  const obtenerNombre = (numero) =>
    nombres[numero - start] || "";

  const getRandom = (list) =>
    list[Math.floor(Math.random() * list.length)];

  // Restablecer todos los campos al terminar
  const resetearSorteo = () => {
    setShowModal(false);
    setDrawSteps([]);
    setCurrentIndex(-1);
    setSorteoActual(1);
    setPool([]);
    setStart("");
    setEnd("");
    setNumAlAgua("");
    setNumPremiados("");
    setCantidadSorteos("");
    setNombresTexto("");
    setModoSorteo("numeros");
    setIsRunning(false);
    setReasignando(false);
  };

  const startDraw = async () => {
    // Validación básica
    if (
      !start ||
      !end ||
      numAlAgua <= 0 ||
      numPremiados <= 0 ||
      cantidadSorteos <= 0
    ) {
      return alert("Por favor complete todos los campos antes de iniciar.");
    }

    if (numAlAgua <= 0 || numPremiados <= 0) {
      return alert("Los números deben ser mayores a cero.");
    }

    if (end <= start) {
      return alert("El rango es inválido.");
    }

    // Validar cantidad de nombres solamente en modo participantes
    if (
      modoSorteo === "nombres" &&
      nombres.length !== cantidadNumeros
    ) {
      return alert(
        `La cantidad de nombres no coincide con la cantidad de números.\n\n` +
        `Números disponibles: ${cantidadNumeros}\n` +
        `Nombres ingresados: ${nombres.length}\n\n` +
        `Por favor, corrija la lista antes de iniciar.`
      );
    }

    // Crear el pool si está vacío
    let currentPool =
      pool.length > 0
        ? [...pool]
        : Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
          );

    if (pool.length === 0) {
      setPool(currentPool);
    }

    const totalNecesarios = numAlAgua + numPremiados;

    if (currentPool.length < totalNecesarios) {
      return alert("No hay suficientes números disponibles para el sorteo.");
    }

    // Mostrar animación de carga
    setIsRunning(true);
    setShowModal(true);

    // Esperar 10 segundos
    await new Promise((resolve) => setTimeout(resolve, 10000));

    let tempPool = [...currentPool];
    let seleccionados = [];

    // Elegir números al agua
    for (let i = 0; i < numAlAgua; i++) {
      const alAgua = getRandom(tempPool);

      seleccionados.push({
        type: "Al agua",
        number: alAgua,
        name: modoSorteo === "nombres" ? obtenerNombre(alAgua) : "",
      });

      tempPool = tempPool.filter((n) => n !== alAgua);
    }

    // Elegir números premiados
    let nuevosPremiados = [];

    for (let i = 0; i < numPremiados; i++) {
      const premiado = getRandom(tempPool);

      seleccionados.push({
        type: "Premiado",
        number: premiado,
        name: modoSorteo === "nombres" ? obtenerNombre(premiado) : "",
      });

      nuevosPremiados.push(premiado);
      tempPool = tempPool.filter((n) => n !== premiado);
    }

    // Actualizar pool eliminando premiados y números al agua
    const eliminados = [
      ...nuevosPremiados,
      ...seleccionados
        .filter((s) => s.type === "Al agua")
        .map((s) => s.number),
    ];

    const updatePool = currentPool.filter(
      (n) => !eliminados.includes(n)
    );

    setPool(updatePool);

    // Guardar resultados
    setDrawSteps(seleccionados);
    setCurrentIndex(0);
    setIsRunning(false);
  };

  // Avanzar al siguiente resultado
  const nextStep = async () => {
    if (currentIndex < drawSteps.length - 1) {
      setIsRunning(true);

      // Esperar 10 segundos
      await new Promise((resolve) => setTimeout(resolve, 10000));

      setCurrentIndex(currentIndex + 1);
      setIsRunning(false);
    }
  };

  // Pasar al siguiente sorteo
  const siguienteSorteo = () => {
    if (sorteoActual >= cantidadSorteos) {
      resetearSorteo();
      return;
    }

    const next = sorteoActual + 1;

    setSorteoActual(next);
    startDraw();
  };

  // Volver a sortear el número premiado
  const regenerarPremiado = async () => {
    if (pool.length === 0) {
      return alert("No quedan números disponibles para reasignar.");
    }

    setReasignando(true);
    setIsRunning(true);

    // Esperar 10 segundos mostrando nuevamente la animación
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const tempPool = [...pool];
    const nuevo = getRandom(tempPool);

    // Reemplazar el resultado premiado
    const copia = [...drawSteps];

    copia[copia.length - 1] = {
      type: "Premiado",
      number: nuevo,
      name: modoSorteo === "nombres" ? obtenerNombre(nuevo) : "",
    };

    setDrawSteps(copia);

    // Retirar el nuevo número del pool para evitar repetirlo
    setPool(tempPool.filter((n) => n !== nuevo));

    setIsRunning(false);
    setReasignando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex flex-col items-center justify-center p-6">

      <h1 className="text-3xl font-extrabold text-blue-900 mb-6 text-center tracking-wide">
        🎉 Sorteo 🎉
      </h1>

      {/* Distribución adaptable según la modalidad */}
      <div
        className={`w-full ${
          modoSorteo === "nombres"
            ? "max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
            : "max-w-md"
        }`}
      >

        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full space-y-6">

          {/* Selector de modalidad */}
          <div className="space-y-3 text-left">
            <label className="block font-semibold text-gray-700">
              Modalidad del sorteo
            </label>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => setModoSorteo("numeros")}
                disabled={isRunning}
                className={`py-3 px-3 rounded-lg font-semibold border-2 transition-all duration-200 ${
                  modoSorteo === "numeros"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                🔢 Solo números
              </button>

              <button
                type="button"
                onClick={() => setModoSorteo("nombres")}
                disabled={isRunning}
                className={`py-3 px-3 rounded-lg font-semibold border-2 transition-all duration-200 ${
                  modoSorteo === "nombres"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                👥 Con participantes
              </button>

            </div>
          </div>

          {/* Rango de números */}
          <div className="flex gap-4">
            <input
              type="number"
              value={start}
              onChange={(e) => setStart(parseInt(e.target.value))}
              placeholder="Desde"
              className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <input
              type="number"
              value={end}
              onChange={(e) => setEnd(parseInt(e.target.value))}
              placeholder="Hasta"
              className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          {/* Cantidad de números al agua y premiados */}
          <div className="flex gap-2">
            <input
              type="number"
              value={numAlAgua}
              onChange={(e) => setNumAlAgua(parseInt(e.target.value))}
              placeholder="N° al agua"
              className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <input
              type="number"
              value={numPremiados}
              onChange={(e) => setNumPremiados(parseInt(e.target.value))}
              placeholder="N° premiados"
              className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          {/* Cantidad de sorteos */}
          <input
            type="number"
            value={cantidadSorteos}
            onChange={(e) => setCantidadSorteos(parseInt(e.target.value))}
            placeholder="Cantidad de sorteos"
            className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400 outline-none"
          />

          {/* Ingreso de nombres: solamente en modo participantes */}
          {modoSorteo === "nombres" && (
            <div className="space-y-3 text-left">

              <label className="block font-semibold text-gray-700">
                Nombres de los participantes
              </label>

              <textarea
                value={nombresTexto}
                onChange={(e) => setNombresTexto(e.target.value)}
                placeholder={"Ingrese un nombre por línea:\n\nJuan Pérez\nMaría González\nPedro Soto"}
                rows={6}
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 outline-none resize-y"
              />

              <p className="text-xs text-gray-500">
                Ingrese un nombre por cada número del rango seleccionado.
              </p>

            </div>
          )}

          {/* Botón iniciar */}
          <button
            onClick={startDraw}
            disabled={isRunning}
            className={`relative w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out
              ${
                isRunning
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 shadow-lg"
              }`}
          >
            🎁 Iniciar Sorteo
          </button>

        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        {modoSorteo === "nombres" && (
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full space-y-4">

            <div>
              <h2 className="text-xl font-bold text-blue-900">
                Vista previa de asignación
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Compruebe que cada número tenga el participante correcto.
              </p>
            </div>

            {/* Validación de cantidades */}
            {cantidadNumeros > 0 ? (
              <>
                <div
                  className={`rounded-lg p-3 text-sm ${
                    nombres.length === cantidadNumeros
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <p>
                    <strong>Números disponibles:</strong> {cantidadNumeros}
                  </p>

                  <p>
                    <strong>Nombres ingresados:</strong> {nombres.length}
                  </p>

                  {nombres.length === cantidadNumeros ? (
                    <p className="font-semibold mt-2">
                      ✓ La cantidad de nombres y números coincide correctamente.
                    </p>
                  ) : nombres.length < cantidadNumeros ? (
                    <p className="font-semibold mt-2">
                      ⚠ Faltan {cantidadNumeros - nombres.length} nombres.
                    </p>
                  ) : (
                    <p className="font-semibold mt-2">
                      ⚠ Sobran {nombres.length - cantidadNumeros} nombres.
                    </p>
                  )}
                </div>

                {/* Tabla de asignaciones */}
                <div className="border rounded-lg overflow-hidden">

                  <div className="max-h-[500px] overflow-y-auto">

                    <table className="w-full text-sm text-left">

                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-3 border-b w-24">
                            Número
                          </th>

                          <th className="p-3 border-b">
                            Participante
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {asignaciones.map((item) => (
                          <tr
                            key={item.number}
                            className="hover:bg-blue-50"
                          >
                            <td className="p-3 border-b font-bold text-indigo-600">
                              {item.number}
                            </td>

                            <td className="p-3 border-b">
                              {item.name ? (
                                item.name
                              ) : (
                                <span className="text-red-500 italic">
                                  Nombre pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                    </table>

                  </div>

                  {/* Nombres sobrantes */}
                  {nombres.length > cantidadNumeros && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm border-t">

                      <p className="font-bold mb-2">
                        Nombres que no tienen número asignado:
                      </p>

                      <ul className="list-disc pl-5">
                        {nombres.slice(cantidadNumeros).map((nombre, index) => (
                          <li key={index}>{nombre}</li>
                        ))}
                      </ul>

                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="rounded-lg bg-blue-50 p-6 text-center text-blue-700">
                <p className="text-3xl mb-2">📋</p>
                <p className="font-semibold">
                  Ingresa el rango de números para visualizar las asignaciones.
                </p>
              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL EMERGENTE */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-all p-3">

          <div className="relative bg-white bg-opacity-95 rounded-3xl p-6 md:p-10 shadow-2xl text-center w-full max-w-2xl min-h-[320px] flex flex-col justify-between animate-fadeIn overflow-hidden">

            {/* Confeti solamente cuando se muestra un resultado premiado */}
            {!isRunning &&
              drawSteps.length > 0 &&
              currentIndex >= 0 &&
              drawSteps[currentIndex].type === "Premiado" && (
                <Confetti
                  width={width}
                  height={height}
                  numberOfPieces={200}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: 60,
                  }}
                />
              )}

            <header className="mb-6 border-b border-gray-300 pb-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {isRunning
                  ? "¡Sorteando!"
                  : `Resultado - Sorteo ${sorteoActual} / ${cantidadSorteos}`}
              </h2>
            </header>

            {/* Animación de carga */}
            {isRunning ? (
              <div className="flex flex-col justify-center items-center h-48">
                <Lottie
                  animationData={loading}
                  loop={true}
                  className="w-40 h-40"
                />
              </div>
            ) : (
              <>
                {/* Mostrar resultado */}
                {drawSteps.length > 0 && currentIndex >= 0 && (
                  <div className="flex flex-col items-center space-y-4">

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">

                      {/* Texto del resultado */}
                      <div className="max-w-full">

                        <p className="text-xl font-semibold text-gray-700 mb-2">
                          {drawSteps[currentIndex].type}
                        </p>

                        <p className="text-3xl md:text-4xl font-bold text-indigo-600 break-words">
                          {drawSteps[currentIndex].number}

                          {modoSorteo === "nombres" && (
                            <>
                              <span className="mx-2">|</span>
                              {drawSteps[currentIndex].name}
                            </>
                          )}
                        </p>

                      </div>

                      {/* Animación según el tipo */}
                      <Lottie
                        animationData={
                          drawSteps[currentIndex].type === "Al agua"
                            ? alAguaAnimacion
                            : premiadoAnimacion
                        }
                        loop={true}
                        className="w-40 h-40"
                      />

                    </div>

                  </div>
                )}

                <div className="mt-8 flex justify-center">

                  {currentIndex < drawSteps.length - 1 ? (
                    <button
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <>
                      {/* Si el resultado final es premiado */}
                      {drawSteps[currentIndex]?.type === "Premiado" && (
                        <div className="flex flex-col items-center space-y-4">

                          <button
                            onClick={siguienteSorteo}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out w-64"
                          >
                            Sí, premiado asignado
                          </button>

                          <button
                            onClick={regenerarPremiado}
                            disabled={reasignando}
                            className={`${
                              reasignando
                                ? "bg-gray-400"
                                : "bg-yellow-500 hover:bg-yellow-600"
                            } text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out w-64`}
                          >
                            {reasignando
                              ? "Generando nuevo..."
                              : "No, volver a sortear"}
                          </button>

                        </div>
                      )}

                      {/* Si el resultado final no es premiado */}
                      {drawSteps[currentIndex]?.type !== "Premiado" && (
                        <>
                          {sorteoActual < cantidadSorteos && (
                            <button
                              onClick={siguienteSorteo}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out"
                            >
                              Iniciar siguiente sorteo
                            </button>
                          )}

                          {sorteoActual >= cantidadSorteos && (
                            <button
                              onClick={resetearSorteo}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out"
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
