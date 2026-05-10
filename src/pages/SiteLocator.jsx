import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, LayoutDashboard, Activity, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 16);
  return null;
}

export default function SiteLocator() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('omniCellUser') || 'Engineer';
  const [coords, setCoords] = useState({ lat: 15.212014, lng: 120.819354 }); 
  const [inputLat, setInputLat] = useState('15.212014');
  const [inputLng, setInputLng] = useState('120.819354');
  const [address, setAddress] = useState('Fetching address...');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAddress = async (lat, lon) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      setAddress(data.display_name || 'Address not found for these coordinates.');
    } catch (error) {
      setAddress('Error connecting to satellite database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newLat = parseFloat(inputLat);
    const newLng = parseFloat(inputLng);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setCoords({ lat: newLat, lng: newLng });
      fetchAddress(newLat, newLng);
    } else {
      alert("Please enter valid coordinates.");
    }
  };

  useEffect(() => { fetchAddress(coords.lat, coords.lng); }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('omniCellAuth');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 shadow-2xl flex-col z-20">
        <div className="p-6 flex items-center gap-3 text-white font-bold text-xl border-b border-slate-800 tracking-tight">
          <Activity className="text-blue-500 animate-pulse" /> JAHS-Tracker
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800 transition-colors"><LayoutDashboard size={20} /> Dashboard</button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-md shadow-blue-900/20"><MapPin size={20} /> Map Locator</button>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors w-full p-2 rounded-lg hover:bg-slate-800"><LogOut size={18} /> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-6 justify-between items-center text-white">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2"><MapPin className="text-blue-500"/> Site Geolocation</h1>
              <p className="text-slate-400 text-sm mt-1">Enter telemetry data to locate deployment zones.</p>
            </div>
            
            <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Latitude</label>
                <input type="text" value={inputLat} onChange={e => setInputLat(e.target.value)} className="bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-32" />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Longitude</label>
                <input type="text" value={inputLng} onChange={e => setInputLng(e.target.value)} className="bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-32" />
              </div>
              <div className="flex flex-col justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"><Search size={18} /> Locate</button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-0">
              <MapContainer center={[coords.lat, coords.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeView center={[coords.lat, coords.lng]} />
                <Marker position={[coords.lat, coords.lng]}><Popup>Deployment Site<br/>{coords.lat}, {coords.lng}</Popup></Marker>
              </MapContainer>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6"><Navigation size={24} /></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Verified Address</h3>
              {isLoading ? <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div> : <p className="text-xl font-bold text-slate-800 leading-snug">{address}</p>}
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Coordinates</h3>
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-100"><span className="font-semibold text-slate-600">LAT</span><span className="font-mono font-bold text-slate-900">{coords.lat}</span></div>
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 mt-2"><span className="font-semibold text-slate-600">LNG</span><span className="font-mono font-bold text-slate-900">{coords.lng}</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}