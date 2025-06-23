"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";

const mockPhotos = [
  { id: 1, url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop', caption: 'Hoạt động tập thể dục buổi sáng', date: '2024-01-15' },
  { id: 2, url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&h=400&fit=crop', caption: 'Bữa ăn tối cùng bạn bè', date: '2024-01-14' },
  { id: 3, url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop', caption: 'Chăm sóc vườn hoa', date: '2024-01-13' },
  { id: 4, url: 'https://images.unsplash.com/photo-1573764446-fbca3cefb9c9?w=600&h=400&fit=crop', caption: 'Sinh nhật tháng 1', date: '2024-01-12' },
  { id: 5, url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&h=400&fit=crop', caption: 'Thư giãn đọc sách', date: '2024-01-11' },
  { id: 6, url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&h=400&fit=crop', caption: 'Hoạt động vẽ tranh', date: '2024-01-10' }
];

export default function FamilyPhotosPage() {
  const router = useRouter();
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [detailPhoto, setDetailPhoto] = useState<any | null>(null);

  // CSS animations
  const styles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes modalScale {
      from { 
        transform: scale(0.9);
        opacity: 0;
      }
      to { 
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;

  useEffect(() => {
    try {
      const uploadedPhotos = localStorage.getItem("uploadedPhotos");
      if (uploadedPhotos) {
        const parsedPhotos = JSON.parse(uploadedPhotos);
        const residentPhotos = parsedPhotos.map((photo: any) => ({
          id: `uploaded_${photo.id}`,
          url: photo.url,
          caption: photo.caption,
          date: new Date(photo.uploadDate).toISOString().split("T")[0],
          uploadedBy: photo.uploadedBy,
          isUploaded: true,
        }));
        const combinedPhotos = [...mockPhotos, ...residentPhotos];
        combinedPhotos.sort((a, b) => new Date(b.date).getTime() - new Date(a).getTime());
        setAllPhotos(combinedPhotos);
      } else {
        setAllPhotos(mockPhotos);
      }
    } catch (error) {
      setAllPhotos(mockPhotos);
    }
  }, []);

  // Filter/search logic
  const filteredPhotos = useMemo(() =>
    allPhotos.filter((photo: any) => {
      const matchSearch =
        photo.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (photo.uploadedBy && photo.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        photo.date.includes(searchTerm);
      return matchSearch;
    }),
    [allPhotos, searchTerm]
  );

  // Group by date
  const groupedPhotos = useMemo(
    () =>
      filteredPhotos.reduce((groups: Record<string, any[]>, photo: any) => {
        const date = photo.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(photo);
        return groups;
      }, {} as Record<string, any[]>),
    [filteredPhotos]
  );
  const sortedDates = useMemo(
    () => Object.keys(groupedPhotos).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedPhotos]
  );

  // Lightbox navigation
  const openLightbox = (photoId: any) => {
    const idx = filteredPhotos.findIndex((p: any) => p.id === photoId);
    setLightboxIndex(idx);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const nextLightbox = () => setLightboxIndex(i => (i !== null && i < filteredPhotos.length - 1 ? i + 1 : i));

  // Download
  const downloadPhoto = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "photo.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", padding: "0", fontFamily: 'Inter, sans-serif' }}>
      <style>{styles}</style>
      {/* Header */}
<div style={{
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
  border: '1px solid #e2e8f0',
  borderRadius: '2rem',
  padding: '1.5rem 2rem',
  marginBottom: '2rem',
  width: '100%',
  maxWidth: 1240,
  marginLeft: 'auto',
  marginRight: 'auto',
  fontFamily: 'Inter, Roboto, Arial, Helvetica, sans-serif',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(10px)',
  marginTop: '30px'
}}>

  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
    {/* Trái: Icon + Tiêu đề */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
      <button
        onClick={() => router.push("/family")}
        title="Quay lại trang chính"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e0e7ef 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(30,41,59,0.06)',
          transition: 'background 0.18s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg, #e0e7ef 0%, #c7d2fe 100%)'}
        onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e0e7ef 100%)'}
      >
        <ArrowLeftIcon style={{ height: 24, width: 24 }} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{
          width: 54,
          height: 54,
          background: 'linear-gradient(135deg, #ffb347 0%, #ff5858 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(255,88,88,0.15)'
        }}>
          <PhotoIcon style={{ width: 32, height: 32, color: 'white' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e42 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
            letterSpacing: '-0.025em'
          }}>
            Nhật ký hình ảnh
          </span>
          <span style={{
            fontSize: '1.125rem',
            color: '#64748b',
            fontWeight: 500
          }}>
            Khoảnh khắc đáng nhớ của người thân tại viện
          </span>
        </div>
      </div>
    </div>

    {/* Phải: Ô tìm kiếm */}
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 300 }}>
      <div style={{ position: 'relative', minWidth: 320, maxWidth: 420, width: '100%' }}>
        <span style={{
          position: 'absolute',
          left: 22,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#cbd5e1',
          fontSize: 24,
          pointerEvents: 'none',
          zIndex: 2
        }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm ảnh, chú thích, người gửi..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '1.05rem 1.3rem 1.05rem 3.3rem',
            borderRadius: '2.2rem',
            border: '1.5px solid #e5e7eb',
            fontSize: '1.13rem',
            background: '#f8fafc',
            color: '#374151',
            boxShadow: '0 2px 8px rgba(30,41,59,0.04)',
            outline: 'none',
            fontWeight: 500,
            letterSpacing: '0.01em',
            transition: 'border 0.2s, box-shadow 0.2s',
            fontFamily: 'inherit'
          }}
          onFocus={e => {
            e.currentTarget.style.border = '1.5px solid #ff5858';
            e.currentTarget.style.boxShadow = '0 0 0 2px #ffe4e6';
          }}
          onBlur={e => {
            e.currentTarget.style.border = '1.5px solid #e5e7eb';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,41,59,0.04)';
          }}
        />
      </div>
    </div>
  </div>
</div>

      {/* Gallery */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 2.5rem 3rem 2.5rem' }}>
        {sortedDates.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280", fontSize: "1.2rem", margin: "2.5rem 0" }}>Không tìm thấy ảnh phù hợp.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} style={{ marginBottom: "2.5rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.13rem", color: "#64748b", margin: "0 0 1.2rem 0", letterSpacing: "0.01em", textShadow: "0 1px 4px rgba(30,41,59,0.07)" }}>{new Date(date).toLocaleDateString("vi-VN")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2.1rem" }}>
                {groupedPhotos[date].map(photo => (
                  <div
                    key={photo.id}
                    style={{ position: "relative", borderRadius: "14px", overflow: "hidden", background: '#f8fafc', boxShadow: '0 2px 12px rgba(30,41,59,0.07)', fontFamily: 'Inter, Roboto, Arial, Helvetica, sans-serif' }}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      onClick={() => setDetailPhoto(photo)}
                      style={{ 
                        width: "100%", 
                        height: "220px", 
                        objectFit: "cover", 
                        display: "block", 
                        background: "#f3f4f6", 
                        borderRadius: "14px",
                        cursor: "pointer",
                        transition: "transform 0.2s ease"
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
                      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                    
                    {/* Nút tải ảnh */}
                      <button
                      onClick={() => downloadPhoto(photo.url, photo.caption || "photo.jpg")}
                      style={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                        border: '1.5px solid #ef4444', 
                        borderRadius: '8px', 
                        color: '#ef4444', 
                        padding: '6px', 
                        cursor: 'pointer', 
                        fontSize: '1em', 
                        fontWeight: 500, 
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)', 
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)'
                      }}
                      onMouseOver={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; 
                        e.currentTarget.style.color = '#ffffff'; 
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3), 0 2px 6px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseOut={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'; 
                        e.currentTarget.style.color = '#ef4444'; 
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)';
                      }}
                      title="Tải ảnh xuống"
                    >
                      <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
                      </button>
                    
                    {/* Nút xem chi tiết */}
                    <button
                      onClick={() => setDetailPhoto(photo)}
                      title="Xem chi tiết ảnh"
                      style={{ 
                        position: 'absolute', 
                        top: 52, 
                        right: 12, 
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                        border: '1.5px solid #3b82f6', 
                        borderRadius: '8px', 
                        color: '#3b82f6', 
                        padding: '6px', 
                        cursor: 'pointer', 
                        fontSize: '1em', 
                        fontWeight: 500, 
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)', 
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)'
                      }}
                      onMouseOver={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; 
                        e.currentTarget.style.color = '#ffffff'; 
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3), 0 2px 6px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseOut={e => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'; 
                        e.currentTarget.style.color = '#3b82f6'; 
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      <EyeIcon style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Lightbox */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(30,41,59,0.93)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }} onClick={closeLightbox}>

          <button onClick={closeLightbox}
           title="Đóng"
           style={{
             position: "absolute",
             top: 100,
             right: 60,
             background: "rgba(255, 255, 255, 0.25)",
             color: "white",
             border: "1px solid rgba(255, 255, 255, 0.2)",
             borderRadius: "50%",
             fontSize: 18,
             cursor: "pointer",
             zIndex: 10,
             padding: 16,
             fontWeight: 200,
             backdropFilter: "blur(10px)",
             WebkitBackdropFilter: "blur(10px)",
             boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
             transition: "all 0.3s ease",
             display: "flex",
             alignItems: "center",
             justifyContent: "center"
           }}
           onMouseOver={e => {
             e.currentTarget.style.transform = "translateY(-2px)";
             e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
             e.currentTarget.style.background = "rgba(255, 255, 255, 0.35)";
           }}
           onMouseOut={e => {
             e.currentTarget.style.transform = "translateY(0)";
             e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
             e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
           }}
         >
           <XMarkIcon style={{ width: 15, height: 15 }} />
         </button>
         
          <button onClick={e => { e.stopPropagation(); prevLightbox(); }} style={{ position: "absolute", left: 38, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.13)', color: 'white', border: 'none', borderRadius: 18, fontSize: 36, cursor: 'pointer', zIndex: 10, padding: '0 22px', fontWeight: 700, boxShadow: '0 2px 8px rgba(239,68,68,0.10)' }}><ChevronLeftIcon style={{width: 36, height: 36}} /></button>
          <img src={filteredPhotos[lightboxIndex].url} alt={filteredPhotos[lightboxIndex].caption} style={{ maxWidth: "84vw", maxHeight: "84vh", borderRadius: 28, boxShadow: "0 12px 48px rgba(0,0,0,0.30)", background: "#fff", objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          <button onClick={e => { e.stopPropagation(); nextLightbox(); }} style={{ position: "absolute", right: 38, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.13)', color: 'white', border: 'none', borderRadius: 18, fontSize: 36, cursor: 'pointer', zIndex: 10, padding: '0 22px', fontWeight: 700, boxShadow: '0 2px 8px rgba(239,68,68,0.10)' }}><ChevronRightIcon style={{width: 36, height: 36}} /></button>
          <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, textAlign: "center", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ background: "rgba(30,41,59,0.68)", borderRadius: 20, padding: "22px 36px", display: "inline-block", color: "#fff", minWidth: 260, fontWeight: 700, textShadow: "0 2px 8px rgba(30,41,59,0.5)", fontSize: '1.18rem' }}>
              <div style={{ fontSize: "1.32rem", fontWeight: 700, marginBottom: 10 }}>{filteredPhotos[lightboxIndex].caption}</div>
              {filteredPhotos[lightboxIndex].uploadedBy && (
                <div style={{ fontSize: "1.09em", fontWeight: 500, opacity: 0.92, marginBottom: 6 }}>Người gửi: {filteredPhotos[lightboxIndex].uploadedBy}</div>
              )}
              <div style={{ fontSize: "1.09em", fontWeight: 500, opacity: 0.92 }}>Ngày gửi: {filteredPhotos[lightboxIndex].date && new Date(filteredPhotos[lightboxIndex].date).toLocaleDateString("vi-VN")}</div>
              <button
                onClick={e => { e.stopPropagation(); downloadPhoto(filteredPhotos[lightboxIndex].url, filteredPhotos[lightboxIndex].caption || "photo.jpg"); }}
                style={{ marginTop: 18, background: 'linear-gradient(90deg, #ff5858 0%, #ffb347 100%)', color: 'white', border: 'none', borderRadius: 14, padding: '12px 34px', fontWeight: 700, fontSize: '1.13rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,88,88,0.08)', transition: 'background 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #ff5858 0%, #ff9147 100%)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #ff5858 0%, #ffb347 100%)'; }}
                title="Tải ảnh này"
              >
                <ArrowDownTrayIcon style={{ width: 22, height: 22, marginRight: 10, verticalAlign: 'middle' }} /> Tải ảnh
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal xem chi tiết ảnh */}
      {detailPhoto && (
        <div 
          onClick={() => setDetailPhoto(null)} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(15, 23, 42, 0.92)', 
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 3000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            padding: '20px',
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
              borderRadius: '20px', 
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)', 
              padding: '0', 
              minWidth: '360px', 
              maxWidth: '450px', 
              width: '100%', 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              transform: 'scale(0.95)',
              animation: 'modalScale 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            }}
          >
            {/* Header với nút đóng */}
            <div style={{ 
              position: 'relative', 
              padding: '18px 18px 0 18px', 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                onClick={() => setDetailPhoto(null)} 
                style={{ 
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px', 
                  color: '#64748b', 
                  padding: '8px', 
                  cursor: 'pointer', 
                  fontSize: '16px',
                  fontWeight: 500,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', 
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }} 
                title="Đóng"
                onMouseOver={e => { 
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; 
                  e.currentTarget.style.color = '#fff'; 
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseOut={e => { 
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'; 
                  e.currentTarget.style.color = '#64748b'; 
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                }}
              >
                <XMarkIcon style={{ width: 20, height: 20 }} />
            </button>
            </div>

            {/* Ảnh chính */}
            <div style={{ padding: '0 18px', marginTop: '8px' }}>
              <div style={{ 
                position: 'relative',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)'
              }}>
                <img 
                  src={detailPhoto.url} 
                  alt={detailPhoto.caption} 
                  style={{ 
                    width: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'cover', 
                    display: 'block',
                    background: '#f1f5f9'
                  }} 
                />
                {/* Gradient overlay subtle */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 100%)'
                }} />
              </div>
            </div>

            {/* Thông tin ảnh */}
            <div style={{ 
              padding: '20px 18px 18px 18px', 
              textAlign: 'center',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
            }}>
              <h3 style={{ 
                fontWeight: 700, 
                fontSize: '1.3rem', 
                marginBottom: '12px', 
                color: '#0f172a', 
                letterSpacing: '-0.025em', 
                lineHeight: 1.3,
                margin: '0 0 12px 0'
              }}>
                {detailPhoto.caption}
              </h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px', 
                marginBottom: '18px',
                padding: '12px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#475569', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Ngày gửi: {new Date(detailPhoto.date).toLocaleDateString('vi-VN')}
                </div>
                
                {detailPhoto.uploadedBy && (
                  <div style={{ 
                    fontSize: '1rem', 
                    color: '#475569', 
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Người gửi: {detailPhoto.uploadedBy}
                  </div>
                )}
              </div>

              {/* Nút tải ảnh */}
            <button
              onClick={() => downloadPhoto(detailPhoto.url, detailPhoto.caption || "photo.jpg")}
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '12px 24px', 
                  fontWeight: 600, 
                  fontSize: '1rem', 
                  cursor: 'pointer', 
                  boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  letterSpacing: '0.025em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  minWidth: '160px'
                }}
                onMouseOver={e => { 
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'; 
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4), 0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={e => { 
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'; 
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
                title="Tải ảnh xuống máy"
              >
                <ArrowDownTrayIcon style={{ width: 18, height: 18 }} />
                Tải ảnh xuống
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 