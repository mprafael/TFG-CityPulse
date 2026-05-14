import { Popup } from 'react-map-gl/mapbox';
import { X, User, Star, Bus, TrainFront, CarFront } from 'lucide-react';

/**
 * Component to display vehicle metadata in a Mapbox Popup.
 * Dynamically renders different UI layouts based on the vehicle type.
 * * @param {Object} props.vehicle - The selected vehicle object containing metadata.
 * @param {Function} props.onClose - Handler to clear the selected vehicle state.
 */
export default function VehiclePopup({ vehicle, onClose }) {
  if (!vehicle) return null;

  // Local UI helpers for the popup
  const renderIcon = (type) => {
    if (type === 'bus') return <Bus size={16} />;
    if (type === 'metro') return <TrainFront size={16} />;
    if (type === 'vtc' || type === 'taxi') return <CarFront size={16} />;
    return <div className="w-4 h-4 rounded-full bg-red-500" />;
  };

  const getMarkerColor = (type) => {
    if (type === 'bus') return 'bg-blue-500 text-white';
    if (type === 'metro') return 'bg-emerald-500 text-white';
    if (type === 'vtc') return 'bg-slate-900 text-white';
    if (type === 'taxi') return 'bg-yellow-400 text-black';
    return 'bg-gray-500 text-white';
  };

  return (
    <Popup 
      longitude={vehicle.lng} 
      latitude={vehicle.lat} 
      anchor="bottom" 
      onClose={onClose} 
      closeOnClick={true} 
      closeButton={false} 
      offset={15} 
      className="z-50"
    >
      <div className="relative p-1 min-w-[200px]">
        
        {/* Close Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
        
        {/* Header: Vehicle Type & Label */}
        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2 pr-6">
          <div className={`p-1.5 rounded-md shadow-sm ${getMarkerColor(vehicle.type)}`}>
            {renderIcon(vehicle.type)}
          </div>
          <div>
            <span className="font-extrabold text-gray-900 block leading-tight">{vehicle.label}</span>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{vehicle.type}</span>
          </div>
        </div>

        {/* Public Transport Layout (Bus & Metro) */}
        {(vehicle.type === 'bus' || vehicle.type === 'metro') && (
          <div className="px-1 pb-1">
            <p className="text-xs text-gray-500 font-semibold mb-0.5">Dirección / Destino</p>
            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100">
              {vehicle.metadata?.destination || 'Ruta Circular'}
            </p>
          </div>
        )}

        {/* Taxi Layout */}
        {vehicle.type === 'taxi' && (
          <div className="px-1 pb-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <User size={14} className="text-gray-400" /> {vehicle.metadata?.driver}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vehicle.metadata?.occupied ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {vehicle.metadata?.occupied ? 'OCUPADO' : 'LIBRE'}
              </span>
            </div>
            <div className="bg-gray-50 p-1.5 rounded-md border border-gray-100 text-center">
              <span className="text-xs font-mono font-bold tracking-widest text-gray-600">{vehicle.metadata?.license}</span>
            </div>
          </div>
        )}

        {/* VTC Layout (Uber/Cabify) */}
        {vehicle.type === 'vtc' && (
          <div className="px-1 pb-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <User size={14} className="text-gray-400" /> {vehicle.metadata?.driver}
              </div>
              <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-yellow-700">{vehicle.metadata?.rating}</span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-md border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">{vehicle.metadata?.carModel}</p>
                <p className="text-[10px] text-slate-500">{vehicle.metadata?.carColor}</p>
              </div>
              <div className="bg-white px-1.5 py-1 rounded shadow-sm border border-gray-200">
                <span className="text-[10px] font-mono font-bold tracking-widest text-gray-800">{vehicle.metadata?.license}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
}