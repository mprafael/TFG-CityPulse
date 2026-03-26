export default function Login() {
  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="p-8 border rounded-2xl shadow-xl w-96 bg-white">
        <h2 className="text-2xl font-bold text-citypulse-blue mb-6 text-center">Entrar a CityPulse</h2>
        <div className="flex flex-col gap-4">
          <input type="email" placeholder="Correo electrónico" className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-citypulse-blue" />
          <input type="password" placeholder="Contraseña" className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-citypulse-blue" />
          <button className="w-full bg-citypulse-blue text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition mt-2">
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}