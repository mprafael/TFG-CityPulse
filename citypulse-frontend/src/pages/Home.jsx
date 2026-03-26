import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-76px)] bg-gray-50 p-6">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          El pulso de tu ciudad, <br/><span className="text-citypulse-blue">en tiempo real</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          CityPulse centraliza VTC, autobuses, metro y taxis en un único mapa interactivo. Planifica tus rutas inteligentemente sin tener que saltar de app en app.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/map" className="bg-citypulse-blue text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg text-lg">
            Ir al Mapa Interactivo
          </Link>
          <Link to="/login" className="bg-white text-citypulse-blue border-2 border-citypulse-blue px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition text-lg">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}