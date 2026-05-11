import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Map, Zap, Smartphone, User, Code } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import bgMap from '../assets/bg-map.png';

import busImg from '../assets/bus.png';
import metroImg from '../assets/metro.png';
import miFoto from '../assets/mi-foto.jpg';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainContainer = useRef(null);
  const heroRef = useRef(null);

  useGSAP(() => {
    // Animación del Hero vinculada al scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",      // Empieza cuando el hero toca el tope
        end: "bottom top",     // Termina cuando el hero sale de la pantalla
        scrub: 1,              // El 1 hace que la animación siga suavemente el scroll
      }
    });

    // Movimiento del Autobús: entra por la izquierda y se hace grande
    tl.to(".bus-anim", {
      x: 300,        // Se mueve a la derecha
      y: 50,         // Baja un poco
      scale: 2.5,    // Se acerca al usuario
      opacity: 0,    // Se desvanece al salir
      ease: "none"
    }, 0);

    // Movimiento del Metro: entra por la derecha y se hace grande
    tl.to(".metro-anim", {
      x: -300,       // Se mueve a la izquierda
      y: 50,
      scale: 2.5,
      opacity: 0,
      ease: "none"
    }, 0);

  }, { scope: mainContainer });

  return (
    // Contenedor principal sin altura fija para permitir scroll
    <div ref={mainContainer} className="flex flex-col bg-white">
      
      {/* 1. SECCIÓN HERO CON MAPA DE FONDO */}
      <section 
        ref={heroRef} 
        // Eliminamos el bg-gray-50 y añadimos relative y overflow-hidden
        className="relative flex flex-col items-center justify-center min-h-[calc(100vh-76px)] overflow-hidden border-b border-gray-100 p-6"
      >
        
        {/* NUEVO: Capa 1 - La imagen del mapa de fondo */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgMap})` }}
        ></div>

        {/* NUEVO: Capa 2 - Filtro semi-transparente y desenfoque (Glassmorphism) */}
        {/* bg-white/80 la hace un 80% blanca, y backdrop-blur-sm difumina el mapa debajo */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0"></div>

        {/* Capa 3: Contenedor de las imágenes animadas de GSAP (El bus y el metro) */}
        <div className="hidden md:flex absolute inset-0 pointer-events-none items-center justify-center overflow-hidden z-10">
          <img 
            src={busImg} 
            className="bus-anim absolute left-[0%] w-[450px] opacity-20 md:opacity-40" 
            alt="Autobús animado" 
          />
          <img 
            src={metroImg} 
            className="metro-anim absolute right-[0%] w-[425px] opacity-20 md:opacity-40" 
            alt="Metro animado" 
          />
        </div>

        {/* Capa 4: Contenido de Texto y Botones (Z-20 para que estén siempre arriba) */}
        <div className="relative z-20 max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-sm">
            El pulso de tu ciudad, <br/>
            <span className="text-citypulse-blue">en tiempo real</span>
          </h1>
          <p className="text-xl text-gray-800 font-medium mb-10 max-w-2xl mx-auto drop-shadow-sm">
            CityPulse centraliza VTC, autobuses, metro y taxis en un único mapa interactivo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/map" className="bg-citypulse-blue text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg text-lg">
              Ir al Mapa Interactivo
            </Link>
            <Link to="/login" state={{ isRegister: true }} className="bg-white text-citypulse-blue border-2 border-citypulse-blue px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition text-lg">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN INFO / CARACTERÍSTICAS */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900">Una movilidad más inteligente</h2>
          <p className="mt-4 text-gray-500 text-lg">Toda la información que necesitas, centralizada y sin complicaciones.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Tarjeta 1 */}
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-citypulse-blue rounded-xl flex items-center justify-center mb-6">
              <Map size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Mapa Unificado</h3>
            <p className="text-gray-600 leading-relaxed">
              Olvídate de abrir 4 aplicaciones distintas. Observa taxis, VTC y autobuses públicos conviviendo en una única pantalla.
            </p>
          </div>

          {/* Tarjeta 2 */}
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-citypulse-blue rounded-xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">En Tiempo Real</h3>
            <p className="text-gray-600 leading-relaxed">
              Datos precisos y actualizados al segundo para que sepas exactamente cuánto tardará tu transporte en llegar a tu ubicación.
            </p>
          </div>

          {/* Tarjeta 3 */}
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-citypulse-blue rounded-xl flex items-center justify-center mb-6">
              <Smartphone size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Diseño Intuitivo</h3>
            <p className="text-gray-600 leading-relaxed">
              Una interfaz limpia, moderna y pensada para que cualquier persona pueda utilizarla de forma rápida mientras camina por la calle.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN SOBRE EL PROYECTO */}
      <section className="py-24 bg-citypulse-blue text-white px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          
          {/* Avatar / Icono */}
          <div className="flex-shrink-0">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
              <img 
                src={miFoto} 
                alt="Rafael Macías" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Texto de presentación */}
          <div>
            <h2 className="text-3xl font-extrabold mb-4">El proyecto detrás de CityPulse</h2>
            <p className="text-blue-50 text-lg mb-6 leading-relaxed">
              Hola, soy <strong>Rafael Macías</strong>. CityPulse nace como mi Proyecto Final para el grado de Desarrollo de Aplicaciones Web (2º DAW). 
              La idea surgió de una necesidad real: la frustración de tener que saltar entre diferentes apps para ver si me compensaba coger un bus, un metro o pedir un uber. Mi objetivo es construir un "hub" central que devuelva el control del tiempo al usuario.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <a href="https://github.com/mprafael" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white text-citypulse-blue hover:bg-gray-50 rounded-lg font-bold transition-colors shadow-sm">
                <Code size={20} /> GitHub
              </a>
              <span className="text-blue-100 font-medium">IES Portada Alta (2025/2026)</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}