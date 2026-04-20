import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Image, Plus, X, Download, Trash2, Heart, Calendar, User } from 'lucide-react';

export default function GalleryPage() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    taken_at: null
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    try {
      const response = await api.get('/upload');
      if (response.data.success) {
        setPhotos(response.data.data.photos);
      }
    } catch (error) {
      console.error('Fetch photos error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('请选择照片');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadData.title || selectedFile.name);
      formData.append('description', uploadData.description || '');
      if (uploadData.taken_at) {
        formData.append('taken_at', new Date(uploadData.taken_at).getTime() / 1000);
      }

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        await fetchPhotos();
        handleClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setShowUpload(false);
    setSelectedFile(null);
    setPreview(null);
    setUploadData({ title: '', description: '', taken_at: null });
  }

  async function handleDelete(photoId) {
    if (!confirm('确定要删除这张照片吗？')) return;
    
    try {
      await api.delete(`/upload/${photoId}`);
      await fetchPhotos();
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败，请重试');
    }
  }

  async function handleDownload(photo) {
    try {
      const response = await api.get(`/upload/${photo.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', photo.title || 'photo.jpg');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-display flex items-center">
          <Image className="w-7 h-7 mr-3 text-primary-500" />
          相册
        </h2>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-pink-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">上传照片</span>
        </button>
      </div>

      {/* 照片网格 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-12 text-center shadow-glass">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Image className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 font-display mb-2">还没有照片</h3>
          <p className="text-gray-600 mb-4">上传你们的第一张合影吧</p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>上传照片</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, idx) => (
            <div 
              key={photo.id}
              className="group relative aspect-square bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl overflow-hidden shadow-glass hover:shadow-floating transition-all duration-300 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* 照片 */}
              <img
                src={photo.file_url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* 遮罩层 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                {/* 底部信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-sm truncate mb-1">{photo.title}</h3>
                  {photo.taken_at && (
                    <div className="flex items-center text-xs opacity-90">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(photo.taken_at * 1000), 'yyyy-MM-dd', { locale: zhCN })}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="absolute top-2 right-2 flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(photo);
                    }}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    className="w-8 h-8 bg-red-500/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* 上传者头像 */}
              <div className="absolute top-2 left-2 w-7 h-7 bg-gradient-to-br from-primary-400 to-pink-400 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                {photo.uploader_avatar ? (
                  <img src={photo.uploader_avatar} alt={photo.uploader_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">{photo.uploader_name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传弹窗 */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 font-display flex items-center">
                <Image className="w-5 h-5 mr-2 text-primary-500" />
                上传照片
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {/* 文件选择 */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={uploading}
                />
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  preview ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
                }`}>
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                  ) : (
                    <div className="space-y-2">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <Image className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">点击选择照片</p>
                      <p className="text-xs text-gray-500">支持 JPG、PNG、GIF 格式</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  照片标题 (可选)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  placeholder="给照片起个名字..."
                  disabled={uploading}
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  描述 (可选)
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                  rows="2"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  placeholder="记录下这个瞬间的故事..."
                  disabled={uploading}
                />
              </div>

              {/* 拍摄日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
                  拍摄日期 (可选)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                  value={uploadData.taken_at || ''}
                  onChange={(e) => setUploadData({...uploadData, taken_at: e.target.value})}
                  disabled={uploading}
                />
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className={`w-full font-medium py-3 rounded-xl shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 ${
                  selectedFile && !uploading
                    ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white hover:shadow-floating hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>上传照片</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
