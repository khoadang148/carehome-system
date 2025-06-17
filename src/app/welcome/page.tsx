"use client";

import Link from 'next/link';
import { 
  HeartIcon, 
  PhoneIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
  StarIcon,
  MapPinIcon,
  CalendarDaysIcon,
  BeakerIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

export default function WelcomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem 0',
        boxShadow: '0 2px 10px rgba(6, 95, 70, 0.15)'
      }}>
          <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
          justifyContent: 'space-between'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BuildingOffice2Icon style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>CareHome</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Hệ thống quản lý viện dưỡng lão chuyên nghiệp</p>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: '20rem', alignItems: 'center' }}>
            <Link href="/news" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>             </Link>
            <Link href="/contact" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>          </Link>
            <Link href="/login">
              <button style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.375rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                Đăng nhập
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '5rem 0',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{
                background: '#059669',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Chứng nhận ISO 9001:2015
              </span>
            </div>
            
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#1e293b',
              margin: '0 0 1.5rem 0',
              lineHeight: 1.2
            }}>
              Hệ thống quản lý<br />
              <span style={{ color: '#059669' }}>Viện dưỡng lão tiêu chuẩn quốc tế</span>
            </h2>
            
            <p style={{
              fontSize: '1.125rem',
              color: '#475569',
              margin: '0 0 2rem 0',
              lineHeight: 1.7
            }}>
              Ứng dụng công nghệ thông tin hiện đại trong quản lý chăm sóc người cao tuổi, 
              đảm bảo chất lượng dịch vụ theo tiêu chuẩn y tế quốc gia và quốc tế.
            </p>


            {/* Certification badges */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#f1f5f9',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0'
              }}>
                <CheckBadgeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
                <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                  Chứng nhận Bộ Y tế
                </span>
              </div>
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#f1f5f9',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0'
              }}>
                <AcademicCapIcon style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
                <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                  Đội ngũ chuyên gia
                </span>
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #d1fae5'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#065f46',
            margin: '0 0 1.5rem 0'
          }}>
              Thông số hoạt động
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { label: 'người cao tuổi đang chăm sóc', value: '847', unit: 'người' },
                { label: 'Nhân viên y tế', value: '156', unit: 'người' },
                { label: 'Bác sĩ chuyên khoa', value: '28', unit: 'người' },
                { label: 'Tỷ lệ hài lòng', value: '98.2', unit: '%' }
              ].map((stat, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{stat.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 800, 
                      color: '#059669' 
                    }}>
                      {stat.value}
                    </span>
                    <span style={{ color: '#6b7280', marginLeft: '0.25rem' }}>{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={{
        background: 'white',
        padding: '4rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h3 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 1rem 0'
            }}>Dịch vụ chăm sóc chuyên nghiệp</h3>
            <p style={{
              fontSize: '1.125rem',
              color: '#475569',
              margin: 0,
              maxWidth: '700px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Cung cấp các dịch vụ chăm sóc y tế toàn diện theo tiêu chuẩn quốc tế, 
              đảm bảo chất lượng cuộc sống tối ưu cho người cao tuổi
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: <BeakerIcon style={{ width: '2rem', height: '2rem', color: '#059669' }} />,
                title: 'Chăm sóc y tế chuyên khoa',
                description: 'Đội ngũ bác sĩ chuyên khoa geriatrics, theo dõi sức khỏe định kỳ, điều trị bệnh lý mãn tính và cấp cứu 24/7',
                features: ['Khám tổng quát hàng tuần', 'Theo dõi bệnh lý mãn tính', 'Cấp cứu 24/7', 'Tư vấn dinh dưỡng']
              },
              {
                icon: <UserGroupIcon style={{ width: '2rem', height: '2rem', color: '#0ea5e9' }} />,
                title: 'Phục hồi chức năng',
                description: 'Chương trình phục hồi chức năng cá nhân hóa với trang thiết bị vật lý trị liệu hiện đại',
                features: ['Vật lý trị liệu', 'Ngôn ngữ trị liệu', 'Trị liệu nghề nghiệp', 'Tập luyện nhận thức']
              },
              {
                icon: <ClockIcon style={{ width: '2rem', height: '2rem', color: '#8b5cf6' }} />,
                title: 'Chăm sóc điều dưỡng 24/7',
                description: 'Đội ngũ điều dưỡng được đào tạo chuyên sâu về geriatrics, túc trực 24/7 để hỗ trợ sinh hoạt',
                features: ['Điều dưỡng chuyên khoa', 'Hỗ trợ sinh hoạt cá nhân', 'Quản lý thuốc', 'Theo dõi dấu hiệu sinh tồn']
              },
              {
                icon: <ShieldCheckIcon style={{ width: '2rem', height: '2rem', color: '#f59e0b' }} />,
                title: 'An toàn & Kiểm soát nhiễm khuẩn',
                description: 'Hệ thống an toàn đa lớp và kiểm soát nhiễm khuẩn theo tiêu chuẩn bệnh viện',
                features: ['Kiểm soát nhiễm khuẩn', 'Hệ thống báo động', 'Camera giám sát', 'Kiểm soát ra vào']
              },
              {
                icon: <CalendarDaysIcon style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />,
                title: 'Kế hoạch chăm sóc cá nhân',
                description: 'Xây dựng kế hoạch chăm sóc cá nhân dựa trên đánh giá toàn diện tình trạng sức khỏe',
                features: ['Đánh giá geriatrics', 'Kế hoạch điều trị', 'Theo dõi tiến triển', 'Điều chỉnh phương án']
              },
              {
                icon: <StarIcon style={{ width: '2rem', height: '2rem', color: '#10b981' }} />,
                title: 'Dịch vụ hỗ trợ đặc biệt',
                description: 'Các dịch vụ chuyên biệt cho những tình trạng đặc thù như sa sút trí tuệ, Parkinson',
                features: ['Chăm sóc sa sút trí tuệ', 'Hỗ trợ Parkinson', 'Chăm sóc cuối đời', 'Tư vấn tâm lý']
              }
            ].map((service, index) => (
              <div key={index} style={{
                background: '#fafafa',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
                (e.currentTarget as HTMLElement).style.borderColor = '#059669';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  {service.icon}
                </div>
                <h4 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  margin: '0 0 0.75rem 0'
                }}>
                  {service.title}
                </h4>
                <p style={{
                  color: '#475569',
                  margin: '0 0 1rem 0',
                  lineHeight: 1.6
                }}>
                  {service.description}
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {service.features.map((feature, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <div style={{
                        width: '0.375rem',
                        height: '0.375rem',
                        background: '#059669',
                        borderRadius: '50%'
                      }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Standards Section */}
      <section style={{
        background: '#f8fafc',
        padding: '4rem 0'
      }}>
            <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h3 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 1rem 0'
            }}>Tiêu chuẩn chất lượng</h3>
            <p style={{
              fontSize: '1.125rem',
              color: '#475569',
              margin: 0
            }}>
              Tuân thủ nghiêm ngặt các tiêu chuẩn chất lượng quốc gia và quốc tế
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                title: 'ISO 9001:2015',
                description: 'Hệ thống quản lý chất lượng',
                status: 'Đã chứng nhận'
              },
              {
                title: 'Thông tư 15/2018/TT-BYT',
                description: 'Tiêu chuẩn chăm sóc người cao tuổi',
                status: 'Tuân thủ đầy đủ'
              },
              {
                title: 'JCI Standards',
                description: 'Tiêu chuẩn chất lượng quốc tế',
                status: 'Đang triển khai'
              },
              {
                title: 'HACCP',
                description: 'An toàn thực phẩm',
                status: 'Đã chứng nhận'
              }
            ].map((standard, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                textAlign: 'center'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  {standard.title}
                </h4>
                <p style={{
                  color: '#6b7280',
                  margin: '0 0 1rem 0',
                  fontSize: '0.875rem'
                }}>
                  {standard.description}
                </p>
                <span style={{
                  display: 'inline-block',
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {standard.status}
                </span>
            </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 0',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h3 style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            margin: '0 0 1rem 0'
          }}>
            Vì những người thân yêu của bạn
        </h3>
        <p style={{
            fontSize: '1.125rem',
            margin: '0 0 2rem 0',
            opacity: 0.9,
            lineHeight: 1.6
          }}>
            Liên hệ với đội ngũ chuyên gia để được tư vấn về giải pháp quản lý 
            viện dưỡng lão phù hợp với quy mô và nhu cầu của tổ chức bạn.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
           
            <Link href="/login">
          <button style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
            padding: '1rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
                transition: 'all 0.3s ease'
          }}>
            Đăng nhập
          </button>
        </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1e293b',
        color: 'white',
        padding: '3rem 0 2rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <BuildingOffice2Icon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>CareHome</h4>
              </div>
              <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.6, color: '#cbd5e1' }}>
                Hệ thống quản lý viện dưỡng lão chuyên nghiệp, đảm bảo chất lượng 
                chăm sóc theo tiêu chuẩn y tế quốc gia và quốc tế.
              </p>
            </div>
            
            <div>
              <h5 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
                Dịch vụ chuyên môn
              </h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                    Chăm sóc y tế chuyên khoa
                  </a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                    Phục hồi chức năng
                  </a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                    Quản lý chất lượng
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h5 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
                Thông tin liên hệ
              </h5>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <PhoneIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                <span style={{ color: '#cbd5e1' }}>Hotline: 1900 xxxx</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MapPinIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                <span style={{ color: '#cbd5e1' }}>Trụ sở: 123 Đường ABC, Quận XYZ</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                  Giờ làm việc: 8:00 - 17:00 (Thứ 2 - Thứ 6)<br/>
                  Hỗ trợ khẩn cấp: 24/7
                </span>
              </div>
            </div>
          </div>
          
          <div style={{
            borderTop: '1px solid #334155',
            paddingTop: '2rem',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <p style={{ margin: 0 }}>
              © 2024 CareHome Management System. Bảo lưu toàn bộ quyền.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
