import React, { useState, useEffect } from 'react';
import { FileText, FileBadge, Car, Image as ImageIcon, Video, FolderOpen, Upload, Search, Download, Plus, X, Loader2 } from 'lucide-react';
import api from '../config/api';

const DocumentCenter = () => {
  const [activeTab, setActiveTab] = useState('vehicle');
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('vehicle');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/documents?category=${activeTab}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) {
      setErrorMsg('Please enter a title and select a file.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('category', uploadCategory);

    try {
      await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      setTitle('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (doc) => {
    if (doc.url.startsWith('http')) {
      window.open(doc.url, '_blank');
    } else {
      const baseURL = api.defaults.baseURL || 'http://localhost:8000';
      window.open(`${baseURL}${doc.url}`, '_blank');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('vehicle') || t === 'insurance' || t === 'puc') return <Car className="text-blue-400" />;
    if (t.includes('employee') || t === 'driver license') return <FileBadge className="text-green-400" />;
    if (t === 'gov order') return <FileText className="text-purple-400" />;
    if (t.includes('photo') || t.includes('image')) return <ImageIcon className="text-yellow-400" />;
    if (t === 'video') return <Video className="text-red-400" />;
    return <FileText className="text-gray-400" />;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="text-blue-400" /> Digital Document Center
          </h1>
          <p className="text-gray-400">Securely store and retrieve official municipal documents</p>
        </div>
        <button 
          onClick={() => {
            setUploadCategory(activeTab);
            setShowUploadModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow flex items-center gap-2 transition-all"
        >
          <Upload size={18} /> Upload Document
        </button>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-6 pb-2">
        {['vehicle', 'employee', 'gov', 'media'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded capitalize transition-all ${
              activeTab === tab 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'vehicle' && 'Vehicle Documents'}
            {tab === 'employee' && 'Employee KYC'}
            {tab === 'gov' && 'Gov Orders & Memos'}
            {tab === 'media' && 'Media & Evidence'}
          </button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search documents by title or keyword..." 
            className="w-full bg-black/20 border border-white/10 rounded py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <p className="text-gray-400 text-sm">Loading documents...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-gray-400 text-sm">
                <th className="p-4 border-b border-white/10">Document Title</th>
                <th className="p-4 border-b border-white/10">Type</th>
                <th className="p-4 border-b border-white/10">Date Uploaded</th>
                <th className="p-4 border-b border-white/10">Size</th>
                <th className="p-4 border-b border-white/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-4 text-white flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded">
                      {renderIcon(doc.type)}
                    </div>
                    {doc.title}
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded">{doc.type}</span>
                  </td>
                  <td className="p-4 text-gray-400">{doc.date}</td>
                  <td className="p-4 text-gray-400">{doc.size}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" 
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No documents found for this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={20} className="text-blue-500" /> Upload Document
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Document Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. AP16 Z 1234 - Registration (RC)"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50 text-sm"
                >
                  <option value="vehicle">Vehicle Document</option>
                  <option value="employee">Employee KYC</option>
                  <option value="gov">Gov Order & Memo</option>
                  <option value="media">Media & Evidence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">File</label>
                <input 
                  type="file" 
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
