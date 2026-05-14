/**
 * Static Terms and Conditions page.
 * Outlines application usage guidelines and data privacy policies.
 */
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones de CityPulse</h1>
      
      <div className="prose prose-blue text-gray-600 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-gray-800">1. Introducción</h2>
          <p>Bienvenido a CityPulse. Al acceder y utilizar nuestra plataforma de movilidad urbana, aceptas cumplir con los siguientes términos y condiciones. CityPulse es un proyecto académico de Trabajo Fin de Grado (TFG) diseñado para simular y mejorar la gestión del transporte.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800">2. Privacidad y Datos de Usuario</h2>
          <p>La privacidad de nuestros usuarios es primordial. Los datos personales proporcionados (nombre, correo electrónico) se utilizan exclusivamente para la autenticación y el funcionamiento de la aplicación. En cualquier momento puedes solicitar la eliminación de tu perfil desde los ajustes de cuenta. Los datos de rutas se anonimizarán para fines estadísticos.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800">3. Uso del servicio</h2>
          <p>CityPulse es una herramienta en fase beta. No garantizamos la precisión en tiempo real de los vehículos (autobuses, VTC, taxis, metro) ya que actualmente operan mediante un entorno simulado con fines de demostración académica.</p>
        </section>
        
        <p className="text-sm text-gray-400 mt-8">Última actualización: Mayo 2026</p>
      </div>
    </div>
  );
}