import { useState } from 'react';
import { toast } from 'react-toastify';
import { Locate, Shield, Send, CheckCircle2 } from 'lucide-react';
import { usePost } from '../hooks/useAPI';

const WARD_MAPPING = [
  { id: 1, name: "Ward 1 - Benz Circle Area" },
  { id: 2, name: "Ward 2 - Patamata Block" },
  { id: 3, name: "Ward 3 - Gunadala Heights" },
  { id: 4, name: "Ward 4 - Moghalrajpuram Hills" },
  { id: 5, name: "Ward 5 - Governorpet Center" },
  { id: 6, name: "Ward 6 - Vidyadharapuram Zone" },
  { id: 7, name: "Ward 7 - Bhavanipuram Sector" },
  { id: 8, name: "Ward 8 - One Town Old Bazar" }
];

export default function ReportIssue() {
  const { post, loading: isSubmitting } = usePost();
  
  const [formData, setFormData] = useState({
    category: 'Garbage Not Collected',
    description: '',
    raised_by: '',
    raised_by_phone: '',
    address: '',
    ward_id: '1',
    lat: '',
    lng: '',
    image_url: ''
  });
  
  const [locating, setLocating] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        }));
        toast.success("GPS Coordinates retrieved!");
        setLocating(false);
      },
      (error) => {
        toast.error("Could not retrieve GPS coordinates. Please enter manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      ward_id: formData.ward_id ? parseInt(formData.ward_id) : null,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
    };

    // Note: since this is an authenticated citizen, we just use /api/complaints
    const result = await post('/api/complaints', payload);
    
    if (result.success) {
      toast.success("Complaint submitted successfully! We will notify you when it's resolved.");
      setSubmittedIssue(result.data.complaint_number);
      setFormData({
        category: 'Garbage Not Collected',
        description: '',
        raised_by: '',
        raised_by_phone: '',
        address: '',
        ward_id: '1',
        lat: '',
        lng: '',
        image_url: ''
      });
    } else {
      toast.error(result.error || "Error submitting complaint.");
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1">🚨 Report Sanitation Issue</h2>
          <p className="text-sm text-gray-400">Report waste dumping or uncollected bins to your ward officials.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {submittedIssue && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-3 items-start animate-fadeIn shadow-lg">
            <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-white text-sm">Complaint Registered Successfully</h4>
              <p className="text-xs text-gray-400 mt-1">Ticket Number: <strong className="text-green-400 font-mono text-sm">{submittedIssue}</strong></p>
              <p className="text-xs text-gray-400 mt-0.5">Please keep this ID for tracking. Officials have been notified.</p>
              <button 
                onClick={() => setSubmittedIssue(null)}
                className="mt-2 text-xs text-green-400 hover:text-green-300 font-semibold underline"
              >
                Dismiss / File another
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:border-white/[0.14]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Your Full Name *</label>
                <input 
                  required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm transition-colors"
                  placeholder="e.g., Srinivas Rao"
                  value={formData.raised_by} onChange={(e) => setFormData({...formData, raised_by: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Mobile Number *</label>
                <input 
                  required type="tel" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm transition-colors"
                  placeholder="10-digit phone number"
                  pattern="[0-9]{10}"
                  value={formData.raised_by_phone} onChange={(e) => setFormData({...formData, raised_by_phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Ward Area *</label>
                <select 
                  className="w-full bg-[#121A24] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm"
                  value={formData.ward_id} onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
                >
                  {WARD_MAPPING.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Issue Category *</label>
                <select 
                  className="w-full bg-[#121A24] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm"
                  value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Garbage Not Collected">Garbage Not Collected</option>
                  <option value="Overflowing Bin">Overflowing Bin</option>
                  <option value="Illegal Dumping">Illegal Dumping</option>
                  <option value="Dead Animal Disposal">Dead Animal Disposal</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Exact Address / Landmark *</label>
              <input 
                required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm"
                placeholder="e.g., Near Rythu Bazar, Main Road"
                value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Location coordinates (Geotag)</label>
              <div className="flex gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input 
                    type="number" step="any" placeholder="Latitude" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none text-sm"
                    value={formData.lat} onChange={(e) => setFormData({...formData, lat: e.target.value})}
                  />
                  <input 
                    type="number" step="any" placeholder="Longitude" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none text-sm"
                    value={formData.lng} onChange={(e) => setFormData({...formData, lng: e.target.value})}
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleGeolocate}
                  disabled={locating}
                  className="px-5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/20 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Locate size={16} className={locating ? "animate-spin" : ""} />
                  {locating ? 'GPS...' : 'Locate'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Photo URL (Optional)</label>
              <input 
                type="text" placeholder="https://example.com/photo.jpg" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm"
                value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Issue Description *</label>
              <textarea 
                required rows="4" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-green-500 text-sm"
                placeholder="Describe the issue so workers can identify the bin..."
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <button 
              type="submit" disabled={isSubmitting}
              className="w-full bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(34,197,94,0.5)] flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
            >
              <Send size={18} />
              {isSubmitting ? 'Submitting Issue...' : 'Submit Issue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
