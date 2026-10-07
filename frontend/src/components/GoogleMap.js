// Dipertahankan agar import lama (halaman Kontak, Admin, dll.) tetap jalan.
// Isinya sekarang peta gratis OpenStreetMap, bukan Google Maps.
import MapView, { useMapReady } from './MapView';

export { geocodeAddress, reverseGeocode } from '../lib/geocode';
export const useGoogleMaps = useMapReady;
export default MapView;
