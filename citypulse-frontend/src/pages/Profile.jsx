export default function Profile() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Mi Perfil</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold mb-2 text-citypulse-blue">Historial de Rutas</h3>
        <p className="text-gray-600">Aún no has guardado ninguna ruta. ¡Ve al mapa y empieza a explorar la ciudad!</p>
      </div>
    </div>
  );
}