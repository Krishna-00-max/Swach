import { useState } from 'react';
import { Brain, RefreshCw, Send, Sparkles, AlertTriangle, TrendingUp, Route, FileText } from 'lucide-react';
import { useAPI, usePost } from '../hooks/useAPI';
import api from '../config/api';
import { toast } from 'react-toastify';

const InsightCard = ({ title, items, icon, color }) => (
  <div className="soft-ui-card p-5" style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <h4 style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.95rem' }}>{title}</h4>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(Array.isArray(items) ? items : [items]).map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'var(--muted)', borderRadius: 8, padding: '10px 12px',
          border: '1px solid var(--border)',
        }}>
          <span style={{ color, fontSize: '0.85rem', fontWeight: 700, minWidth: 20, marginTop: 1 }}>{i + 1}.</span>
          <span style={{ color: 'var(--foreground)', fontSize: '0.875rem', lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

export default function AIInsights() {
  const { data: insightsData, loading, refetch } = useAPI('/api/ai/insights', { defaultValue: null });
  const { data: reportData, refetch: fetchReport } = useAPI('/api/ai/report', { defaultValue: null, skip: true });
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState('');

  const insights = insightsData?.insights || {};

  const askQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    try {
      const res = await api.post('/api/ai/ask', { question });
      setAnswer(res.data.answer);
    } catch (err) {
      setAnswer('AI service unavailable. Please check your Gemini API key in the backend .env file.');
    } finally { setAsking(false); }
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.get('/api/ai/report');
      setReport(res.data.report);
    } catch { setReport('Report generation failed. Check Gemini API key.'); }
    finally { setReportLoading(false); }
  };

  const QUICK_QUESTIONS = [
    'Which ward needs immediate attention today?',
    'How can we improve cleanliness score?',
    'What are the peak waste hours?',
    'Which streets are consistently missed?',
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[1.6rem] font-extrabold text-foreground mb-1">🤖 AI Insights</h2>
          <p className="text-sm text-muted-foreground">Powered by Google Gemini — Smart waste management recommendations</p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_2px_8px_rgba(30,136,229,0.4)] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(30,136,229,0.5)] border-none cursor-pointer btn-sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Insights
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-card text-foreground border border-border hover:bg-muted hover:border-primary" onClick={generateReport} disabled={reportLoading}>
            <FileText size={14} /> Generate Report
          </button>
        </div>
      </div>

      {/* AI Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: 'linear-gradient(90deg, rgba(30,136,229,0.08), rgba(67,160,71,0.08))', border: '1px solid var(--border)' }}>
          <Brain size={14} color="#60A5FA" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, background: 'linear-gradient(90deg, #60A5FA, #4ADE80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Gemini 1.5 Flash · Real-time Analysis
          </span>
        </div>
        {insightsData?.context && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            Coverage: {insightsData.context.coverage_percent}% · Score: {insightsData.context.cleanliness_score}/100
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-15 gap-4 text-gray-400">
          <div className="w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
          <span>Gemini is analyzing your waste management data...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-500 animate-pulse"><AlertTriangle size={18} /></span>
                <h4 className="font-bold text-red-500 text-sm">Detected Anomalies</h4>
              </div>
              <div className="space-y-2">
                <div className="bg-card/60 border border-border/50 rounded-lg p-2.5 text-xs">
                  <strong className="text-foreground block mb-0.5">⚠️ GPS Idle Warning</strong>
                  <span className="text-muted-foreground">Truck AP16-TJ-2001 has been idling at the same coordinates for 45 minutes.</span>
                </div>
                <div className="bg-card/60 border border-border/50 rounded-lg p-2.5 text-xs">
                  <strong className="text-foreground block mb-0.5">⚠️ Missed Route Sector</strong>
                  <span className="text-muted-foreground">Ward 3 (Gunadala Heights) was skipped in today's morning collection cycle.</span>
                </div>
              </div>
            </div>
            
            <InsightCard
              title="🚨 Missed Street Alerts"
              items={insights.missed_street_alerts || ['No data available']}
              icon="📍" color="#F87171"
            />
            <InsightCard
              title="📈 High-Waste Area Predictions"
              items={insights.high_waste_predictions || ['No data available']}
              icon="🗑️" color="#FCD34D"
            />
            <InsightCard
              title="🔧 Maintenance Predictions"
              items={insights.maintenance_prediction || ['No data available']}
              icon="⚙️" color="#9CA3AF"
            />
          </div>
          <div>
            <InsightCard
              title="🛣️ Route Optimization"
              items={insights.route_optimization || ['No data available']}
              icon="🚛" color="#4ADE80"
            />
            <InsightCard
              title="⛽ Fuel Analytics"
              items={insights.fuel_analytics || ['No data available']}
              icon="💧" color="#3B82F6"
            />
            {insights.cleanliness_report && (
              <div className="ai-insight-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>✨</span>
                  <h4 style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>Cleanliness Report</h4>
                </div>
                <p style={{ color: 'var(--gray-300)', fontSize: '0.875rem', lineHeight: 1.6 }}>{insights.cleanliness_report}</p>
              </div>
            )}
            {insights.priority_action && (
              <div className="alert alert-warning" style={{ borderRadius: 10 }}>
                <AlertTriangle size={16} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>⚡ Priority Action</div>
                  <div style={{ fontSize: '0.85rem' }}>{insights.priority_action}</div>
                </div>
              </div>
            )}
            {insights.weekly_forecast && (
              <div className="alert alert-info" style={{ borderRadius: 10, marginTop: 12 }}>
                <TrendingUp size={16} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📅 Weekly Forecast</div>
                  <div style={{ fontSize: '0.85rem' }}>{insights.weekly_forecast}</div>
                </div>
              </div>
            )}
            {insights.trend_analysis && (
              <div className="alert alert-info" style={{ borderRadius: 10, marginTop: 12, background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD' }}>
                <Brain size={16} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: '#A78BFA' }}>🧠 Trend Analysis</div>
                  <div style={{ fontSize: '0.85rem' }}>{insights.trend_analysis}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Q&A Section */}
      <div className="soft-glass rounded-xl shadow-lg" style={{ padding: 24, marginBottom: 20 }}>
        <div className="text-base font-bold text-foreground mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-border after:to-transparent">💬 Ask Gemini AI</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => setQuestion(q)} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-card hover:bg-muted text-foreground border border-border hover:border-primary" style={{ fontSize: '0.75rem' }}>
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={askQuestion} style={{ display: 'flex', gap: 10 }}>
          <input
            className="bg-card border border-border rounded-md px-3.5 py-2.5 text-foreground text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15" style={{ flex: 1 }}
            value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="Ask about waste management, coverage, predictions..."
          />
          <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_2px_8px_rgba(30,136,229,0.4)] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(30,136,229,0.5)] border-none cursor-pointer" disabled={asking || !question.trim()}>
            <Send size={15} /> {asking ? 'Asking...' : 'Ask'}
          </button>
        </form>
        {answer && (
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(67,160,71,0.08)', border: '1px solid rgba(67,160,71,0.2)', borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Brain size={16} color="#4ADE80" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: 'var(--foreground)', fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{answer}</p>
            </div>
          </div>
        )}
      </div>

      {/* Official Report */}
      {report && (
        <div className="soft-glass rounded-xl shadow-lg" style={{ padding: 24 }}>
          <div className="text-base font-bold text-foreground mb-4 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-border after:to-transparent">📋 Official Cleanliness Report</div>
          <pre style={{ color: 'var(--foreground)', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {report}
          </pre>
        </div>
      )}
    </div>
  );
}
