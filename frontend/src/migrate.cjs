const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const classMap = {
  'page-header': 'flex items-start justify-between mb-6 gap-4 flex-wrap',
  'page-title': 'text-[1.6rem] font-extrabold text-white mb-1',
  'page-subtitle': 'text-sm text-gray-400',
  'page-actions': 'flex gap-2.5 items-center flex-wrap',
  
  'btn btn-ghost btn-sm': 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[0.8rem] font-semibold transition-colors bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white',
  'btn btn-primary': 'inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_2px_8px_rgba(30,136,229,0.4)] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(30,136,229,0.5)] border-none cursor-pointer',
  'btn btn-success': 'inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors bg-gradient-to-br from-green-600 to-green-800 text-white shadow-[0_2px_8px_rgba(67,160,71,0.4)] hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(67,160,71,0.5)] border-none cursor-pointer',
  
  'kpi-grid': 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] mb-6',
  'charts-grid': 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(380px,1fr))] mb-6',
  'two-col': 'grid gap-4 grid-cols-1 lg:grid-cols-2',
  'three-col': 'grid gap-4 grid-cols-1 md:grid-cols-3',
  
  'glass-card': 'bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl transition-all hover:border-white/[0.14] hover:shadow-lg',
  
  'section-title': 'text-base font-bold text-gray-100 mb-4 flex items-center gap-2 after:content-[\'\'] after:flex-1 after:h-px after:bg-gradient-to-r after:from-white/10 after:to-transparent',
  
  'data-table-wrapper': 'overflow-x-auto rounded-lg',
  'data-table': 'w-full border-collapse text-sm',
  
  'form-group': 'flex flex-col gap-1.5',
  'form-label': 'text-[0.82rem] font-semibold text-gray-300 tracking-[0.02em]',
  'form-control': 'bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 text-gray-100 text-sm transition-fast w-full focus:outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:ring-[3px] focus:ring-blue-500/15',
  
  'loading-overlay': 'flex flex-col items-center justify-center p-15 gap-4 text-gray-400',
  'spinner': 'w-9 h-9 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin',
  
  'map-container': 'rounded-lg overflow-hidden bg-white/5 border border-white/10',
};

// Also apply to AppLayout and Components
const dirsToScan = [
  path.join(__dirname, 'pages'),
  path.join(__dirname, 'components'),
  path.join(__dirname, 'components', 'Layout'),
];

for (const directory of dirsToScan) {
  if (!fs.existsSync(directory)) continue;
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.jsx'));
  for (const file of files) {
    const filePath = path.join(directory, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace exact matches in className="..."
    for (const [cls, tw] of Object.entries(classMap)) {
      // Regex to match className="cls" or className={'cls'} or className={`cls`}
      const regex = new RegExp(`className=(["'\`])([^"'\`]*)(\\b${cls}\\b)([^"'\`]*)(["'\`])`, 'g');
      content = content.replace(regex, (match, p1, p2, p3, p4, p5) => {
        return `className=${p1}${p2}${tw}${p4}${p5}`;
      });
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Migration completed for basic classes.');
