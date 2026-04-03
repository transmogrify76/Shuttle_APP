export const getRouteBetweenStops = async (startLat, startLng, endLat, endLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok') {
      return data.routes[0].geometry.coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0],
      }));
    }
    return [];
  } catch (error) {
    console.error('Routing error:', error);
    return [];
  }
};