"use client";

import Link from 'next/link';
import { ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';

const newsArticles = [
  {
    id: 1,
    title: "Chăm sóc tận tâm tại CareHome",
    excerpt: "Hệ thống dưỡng lão CareHome mang đến dịch vụ chăm sóc chuyên nghiệp và tình thương yêu cho người cao tuổi.",
    date: "06/12/2024",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop&crop=center"
  },
  {
    id: 2,
    title: "Hoạt động vui chơi hàng ngày",
    excerpt: "Các hoạt động giải trí đa dạng giúp người cao tuổi có cuộc sống vui vẻ và ý nghĩa.",
    date: "05/12/2024",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop&crop=center"
  },
  {
    id: 3,
    title: "Dịch vụ y tế chuyên nghiệp",
    excerpt: "Đội ngũ y bác sĩ giàu kinh nghiệm chăm sóc sức khỏe 24/7 cho người cao tuổi.",
    date: "04/12/2024",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center"
  }
];

export default function NewsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <Link href="/welcome" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#667eea',
          textDecoration: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          marginBottom: '1rem'
        }}>
          <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          Quay lại
        </Link>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1f2937',
          margin: '0 0 0.5rem 0',
          textAlign: 'center'
        }}>
          Tin tức
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#6b7280',
          textAlign: 'center',
          margin: 0
        }}>
          Cập nhật những thông tin mới nhất từ CareHome
        </p>
      </div>

      {/* News List */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {newsArticles.map((article) => (
          <article
            key={article.id}
            style={{
              background: 'white',
              borderRadius: '1rem',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'row',
              height: '200px'
            }}
          >
            {/* Image */}
            <div style={{
              width: '250px',
              minWidth: '250px',
              height: '100%',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={article.image}
                alt={article.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280;">
                        <div style="width: 3rem; height: 3rem; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                          <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                        <p style="font-size: 0.875rem; text-align: center; margin: 0;">Hình ảnh tin tức</p>
                      </div>
                    `;
                  }
                }}
              />
            </div>

            {/* Content */}
            <div style={{ 
              padding: '1.5rem',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  margin: '0 0 0.75rem 0',
                  lineHeight: 1.4
                }}>
                  {article.title}
                </h3>
                
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  {article.excerpt}
                </p>
              </div>

              {/* Date */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#9ca3af',
                marginTop: '1rem'
              }}>
                <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                {article.date}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
} 
