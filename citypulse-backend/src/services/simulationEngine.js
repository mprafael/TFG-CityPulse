// --- CONFIGURATION ---
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; 

// Initial route coordinates
const ROUTE_ENDPOINTS = {
  alameda: { start: "-4.4253,36.7169", end: "-4.4103,36.7205" },
  victoria: { start: "-4.4168,36.7237", end: "-4.4111,36.7278" },
  maritimo: { start: "-4.4093,36.7188", end: "-4.3982,36.7215" },
  carmen: { start: "-4.4300,36.7170", end: "-4.4235,36.7160" }
};

// Metadata generators
const busDestinations = ['El Palo', 'Alameda Principal', 'Teatinos', 'Ciudad Jardín', 'Campanillas', 'Huelin', 'Paseo del Parque'];
const driverNames = ['Carlos R.', 'Lucía M.', 'Antonio G.', 'Marta F.', 'Javier L.', 'Elena S.', 'Miguel Á.', 'Sofía P.'];
const vtcCars = ['Toyota Corolla', 'Skoda Superb', 'Kia Octavia', 'Tesla Model 3', 'Hyundai Kona'];
const carColors = ['Negro', 'Blanco', 'Gris Oscuro', 'Azul Marino'];
const plateLetters = ['LXT', 'KZZ', 'JTR', 'MDX', 'LMW', 'KPS'];

/**
 * Generates realistic metadata for a given vehicle type.
 */
const generateMetadata = (type, label) => {
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomPlate = () => `${Math.floor(1000 + Math.random() * 9000)} ${randomItem(plateLetters)}`;

  switch (type) {
    case 'bus':
      return { destination: randomItem(busDestinations) };
    case 'metro':
      return { destination: label === 'Línea 1' ? 'Atarazanas / Andalucía Tech' : 'Guadalmedina / Palacio Deportes' };
    case 'taxi':
      return { 
        driver: randomItem(driverNames), 
        occupied: Math.random() > 0.4, 
        license: randomPlate() 
      };
    case 'vtc':
      return { 
        driver: randomItem(driverNames), 
        rating: (4.2 + Math.random() * 0.8).toFixed(1),
        carModel: randomItem(vtcCars), 
        carColor: randomItem(carColors), 
        license: randomPlate() 
      };
    default:
      return {};
  }
};

let activeVehicles = [];
let vehicleIdCounter = 1;
let PATHS = {};

/**
 * Densifies a given coordinate path to ensure smooth CSS transitions on the client.
 */
const densifyPath = (coords) => {
  const dense = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    dense.push(p1);
    
    const dist = Math.sqrt(Math.pow(p2.lng - p1.lng, 2) + Math.pow(p2.lat - p1.lat, 2));
    const steps = Math.ceil(dist / 0.0001); 
    
    for (let j = 1; j < steps; j++) {
      dense.push({
        lat: p1.lat + (p2.lat - p1.lat) * (j / steps),
        lng: p1.lng + (p2.lng - p1.lng) * (j / steps)
      });
    }
  }
  dense.push(coords[coords.length - 1]);
  return [...dense, ...dense.slice().reverse()];
};

/**
 * Fetches routing geometry from Mapbox Directions API.
 */
const fetchRealStreetPath = async (startCoords, endCoords) => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords};${endCoords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.routes && data.routes.length > 0) {
      const rawCoords = data.routes[0].geometry.coordinates.map(c => ({ lng: c[0], lat: c[1] }));
      return densifyPath(rawCoords);
    }
  } catch (error) {
    console.error("Mapbox API Error:", error);
  }
  return [];
};

/**
 * Factory function for creating a vehicle entity.
 */
const createVehicle = (type, label, path, color) => ({
  id: `${type}-${vehicleIdCounter++}`,
  type, label, color, path,
  currentStep: Math.floor(Math.random() * path.length),
  lat: 0, lng: 0,
  metadata: generateMetadata(type, label)
});

/**
 * Initializes the simulation engine by fetching geometries and populating base vehicles.
 */
export const initSimulation = async () => {
  console.log("[SimulationEngine] Fetching street geometries...");
  
  PATHS.alameda = await fetchRealStreetPath(ROUTE_ENDPOINTS.alameda.start, ROUTE_ENDPOINTS.alameda.end);
  PATHS.victoria = await fetchRealStreetPath(ROUTE_ENDPOINTS.victoria.start, ROUTE_ENDPOINTS.victoria.end);
  PATHS.maritimo = await fetchRealStreetPath(ROUTE_ENDPOINTS.maritimo.start, ROUTE_ENDPOINTS.maritimo.end);
  PATHS.carmen = await fetchRealStreetPath(ROUTE_ENDPOINTS.carmen.start, ROUTE_ENDPOINTS.carmen.end);

  if (!PATHS.alameda || PATHS.alameda.length === 0) {
    console.warn("[SimulationEngine] Warning: Mapbox token missing or invalid. Simulation will not run correctly.");
    return;
  }

  activeVehicles.push(createVehicle('metro', 'Línea 1', PATHS.carmen, 'bg-emerald-500'));
  activeVehicles.push(createVehicle('metro', 'Línea 2', PATHS.carmen, 'bg-emerald-500'));

  for(let i=1; i<=6; i++) activeVehicles.push(createVehicle('bus', `Línea ${i}`, PATHS.alameda, 'bg-blue-500'));
  for(let i=7; i<=10; i++) activeVehicles.push(createVehicle('bus', `Línea ${i}`, PATHS.victoria, 'bg-blue-500'));
  
  for(let i=1; i<=3; i++) activeVehicles.push(createVehicle('vtc', `Uber ${i}`, PATHS.maritimo, 'bg-slate-900'));
  for(let i=4; i<=5; i++) activeVehicles.push(createVehicle('vtc', `Cabify ${i}`, PATHS.carmen, 'bg-slate-900'));
  
  for(let i=1; i<=5; i++) activeVehicles.push(createVehicle('taxi', `Taxi ${i}`, PATHS.alameda, 'bg-yellow-400'));

  console.log("[SimulationEngine] Simulation initialized with base vehicles.");
};

/**
 * Spawns additional vehicles near the provided coordinates.
 */
export const spawnVehiclesNear = async (coords) => {
    const userCoords = `${coords.lng},${coords.lat}`;
    const dynamicPath = await fetchRealStreetPath(userCoords, ROUTE_ENDPOINTS.alameda.end);
    
    if (dynamicPath.length > 0) {
      activeVehicles.push(createVehicle('taxi', 'Taxi Cercano', dynamicPath, 'bg-yellow-400'));
      activeVehicles.push(createVehicle('vtc', 'VTC Cercano', dynamicPath, 'bg-slate-900'));
    }
    return activeVehicles;
};

/**
 * Advances the simulation by one tick.
 */
export const updateSimulationState = () => {
    if (activeVehicles.length === 0) return [];
  
    activeVehicles.forEach(vehicle => {
      if (vehicle.path && vehicle.path.length > 0) {
        vehicle.lat = vehicle.path[vehicle.currentStep].lat;
        vehicle.lng = vehicle.path[vehicle.currentStep].lng;
        vehicle.currentStep = (vehicle.currentStep + 1) % vehicle.path.length;
      }
    });
    return activeVehicles;
};

export const getActiveVehicles = () => activeVehicles;