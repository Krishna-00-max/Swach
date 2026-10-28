import { useState } from 'react';
import { toast } from 'react-toastify';
import { Info, Star } from 'lucide-react';
import { useAPI } from '../hooks/useAPI';

export default function TrackIssue() {
  const [trackId, setTrackId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Rating State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleTrackComplaint = async (e) => {
    e.preventDefault();
    if(!trackId.trim()) return;
    setIsTracking(true);
    try {
      // Using public track API since it works seamlessly
      const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
      const res = await fetch(`${API_URL}/api/complaints/public/track/${trackId}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingResult(data);
      } else {
        toast.error('Complaint not found. Please check your ID.');
        setTrackingResult(null);
      }
    } catch(err) {
      toast.error('Failed to track complaint.');
    } finally {
      setIsTracking(false);
    }
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    // Mock API Call
    toast.success('Thank you! Your feedback helps us improve.');
    setIsSubmitted(true);
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-white mb-1">🔍 Track Your Issue</h2>
          <p className="text-sm text-gray-400">Enter your complaint ticket number to view its live status and resolution notes.</p>
        </div>
      </div>

      <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:border-white/[0.14]">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Info size={18} className="text-blue-400" /> Enter Ticket Number
        </h3>
        
        <form onSubmit={handleTrackComplaint} className="flex gap-3">
          <input 
            type="text" 
            placeholder="e.g., CMP-123456" 
            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500 text-sm transition-colors"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isTracking || !trackId.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_20px_rgba(37,99,235,0.2)] hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(37,99,235,0.4)] disabled:opacity-50"
          >
            {isTracking ? 'Tracking...' : 'Track Issue'}
          </button>
        </form>
        
        {trackingResult && (
          <div className="mt-6 p-5 rounded-xl bg-white/5 border border-white/10 animate-fadeIn space-y-4 shadow-inner">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-sm text-gray-400 font-mono tracking-wider font-semibold">{trackingResult.complaint_number}</span>
              <span className={`px-3 py-1.5 rounded-full text-[0.75rem] font-bold uppercase tracking-wider ${
                trackingResult.status === 'Resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                trackingResult.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                trackingResult.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {trackingResult.status}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">{trackingResult.category}</h4>
              <p className="text-sm text-gray-300">{trackingResult.description}</p>
            </div>
            {trackingResult.resolution_notes && (
              <div className="pt-3">
                <p className="text-[0.75rem] font-bold text-gray-400 uppercase tracking-wider mb-2">Resolution Notes</p>
                <div className="text-sm text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20 italic leading-relaxed">
                  {trackingResult.resolution_notes}
                </div>
              </div>
            )}
            
            {trackingResult.status === 'Resolved' && (
              <div className="pt-5 mt-5 border-t border-white/10">
                <p className="text-[0.75rem] font-bold text-gray-400 uppercase tracking-wider mb-4">Rate Resolution Quality</p>
                {isSubmitted ? (
                  <div className="text-sm text-blue-400 bg-blue-500/10 p-4 rounded-lg text-center border border-blue-500/20">
                    🎉 Thank you for your feedback!
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex gap-2 mb-4 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          size={32}
                          className={`cursor-pointer transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        />
                      ))}
                    </div>
                    <textarea 
                      placeholder="Optional comments about the resolution quality..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500 text-sm transition-colors min-h-[80px] mb-3 resize-none"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors border border-white/20"
                    >
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
