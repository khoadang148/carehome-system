'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';
import { 
  billsAPI, 
  careNotesAPI, 
  vitalSignsAPI, 
  activityParticipationsAPI,
  visitsAPI,
  staffAssignmentsAPI,
  bedAssignmentsAPI,
  residentAPI
} from '@/lib/api';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'hóa đơn' | 'health' | 'care' | 'activity' | 'visit' | 'assignment' | 'system';
  actionUrl?: string;
  metadata?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const generateNotificationId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create a unique key for notification deduplication
const createNotificationKey = (title: string, message: string, category: string) => {
  return `${title}_${message}_${category}`.toLowerCase().replace(/\s+/g, '_');
};

const createNotification = (
  type: Notification['type'],
  title: string,
  message: string,
  category: Notification['category'],
  actionUrl?: string,
  metadata?: any
): Notification => ({
  id: generateNotificationId(),
  type,
  title,
  message,
  timestamp: new Date(),
  read: false,
  category,
  actionUrl,
  metadata
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification = createNotification(
      notification.type,
      notification.title,
      notification.message,
      notification.category,
      notification.actionUrl,
      notification.metadata
    );
    
    setNotifications(prev => {
      // Check for duplicate notifications based on content and recent time
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const newNotificationKey = createNotificationKey(notification.title, notification.message, notification.category);
      
      const isDuplicate = prev.some(existing => {
        const existingKey = createNotificationKey(existing.title, existing.message, existing.category);
        return existingKey === newNotificationKey && existing.timestamp > oneHourAgo;
      });
      
      if (isDuplicate) {
        return prev; // Don't add duplicate
      }
      
      return [newNotification, ...prev];
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    if (user?.role === 'family') {
      // For family members, only clear notifications related to their family
      setNotifications(prev => 
        prev.filter(n => !n.metadata?.familyId || n.metadata.familyId !== user.id)
      );
    } else if (user?.role === 'staff') {
      // For staff, only clear notifications related to them
      setNotifications(prev => 
        prev.filter(n => !n.metadata?.staffId || n.metadata.staffId !== user.id)
      );
    } else if (user?.role === 'admin') {
      // For admin, only clear notifications related to them
      setNotifications(prev => 
        prev.filter(n => !n.metadata?.adminId || n.metadata.adminId !== user.id)
      );
    } else {
      // Fallback: clear all
    setNotifications([]);
    }
  }, [user]);

  // Generate notifications based on real API data
  const generateRoleBasedNotifications = useCallback(async () => {
    if (!user) return;

    const newNotifications: Notification[] = [];

    const isForbidden = (err: any) => err?.response?.status === 403;

    try {
      switch (user.role) {
        case 'family':
          // Resolve resident IDs linked to this family member to avoid 403 on global endpoints
          let residentIds: string[] = [];
          try {
            const residents = await residentAPI.getByFamilyMemberId?.(user.id);
            if (Array.isArray(residents)) {
              residentIds = residents.map((r: any) => r.id || r.resident_id || r._id).filter(Boolean);
            }
          } catch (error) {
            if (!isForbidden(error)) console.error('Error fetching residentIds for family:', error);
          }

          // Bills for this family member - ensure proper filtering
          try {
            // Lấy tất cả bills và filter theo family_member_id để đảm bảo chính xác
            const allBills = await billsAPI.getAll();
            
            // Filter bills theo family_member_id của user hiện tại
            const userBills = allBills.filter((bill: any) => {
              const billFamilyId = bill.family_member_id?._id || bill.family_member_id;
              return billFamilyId === user.id;
            });
            
                         // Check for unpaid bills
             const unpaidBills = userBills.filter((bill: any) => bill.status === 'pending');
             if (unpaidBills.length > 0) {
               // Tính tổng số tiền cần thanh toán
               const totalUnpaidAmount = unpaidBills.reduce((sum: number, bill: any) => 
                 sum + (bill.amount || 0), 0
               );
               
               // Nhân với 10000 để hiển thị đúng giá tiền
               const displayUnpaidAmount = totalUnpaidAmount * 10000;
               
               newNotifications.push(createNotification(
                 'warning',
                 'Hóa đơn cần thanh toán',
                 `Bạn có ${unpaidBills.length} hóa đơn chưa thanh toán với tổng số tiền ${displayUnpaidAmount.toLocaleString('vi-VN')} VNĐ. Vui lòng kiểm tra và thanh toán sớm.`,
                 'hóa đơn',
                 '/family/finance',
                 { bills: unpaidBills, totalUnpaidAmount, displayUnpaidAmount, familyId: user.id }
               ));
             }
            
            // Check for recently paid bills (within last 24 hours)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentlyPaidBills = userBills.filter((bill: any) => 
              bill.status === 'paid' && 
              new Date(bill.updated_at || bill.paid_at || bill.created_at) > oneDayAgo
            );
            
                         if (recentlyPaidBills.length > 0) {
               const totalAmount = recentlyPaidBills.reduce((sum: number, bill: any) => 
                 sum + (bill.amount || 0), 0
               );
               
               // Nhân với 10000 để hiển thị đúng giá tiền
               const displayAmount = totalAmount * 10000;
               
               newNotifications.push(createNotification(
                 'success',
                 'Thanh toán thành công',
                 `Bạn đã thanh toán thành công ${recentlyPaidBills.length} hóa đơn với tổng số tiền ${displayAmount.toLocaleString('vi-VN')} VNĐ.`,
                 'hóa đơn',
                 '/family/finance',
                 { bills: recentlyPaidBills, totalAmount, displayAmount, familyId: user.id }
               ));
             }
          } catch (error) {
            if (!isForbidden(error)) console.error('Error fetching bills:', error);
          }

          // Care notes for linked residents - ensure proper filtering by resident IDs
          try {
            if (residentIds.length > 0) {
              // Lấy tất cả care notes và filter theo resident IDs để đảm bảo chính xác
              const allCareNotes = await careNotesAPI.getAll();
              
              // Filter care notes theo resident IDs của family member
              const userCareNotes = allCareNotes.filter((note: any) => {
                const noteResidentId = note.resident_id?._id || note.resident_id;
                return residentIds.includes(noteResidentId);
              });
              
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              const recentCareNotes = userCareNotes.filter((note: any) => 
                new Date(note.created_at || note.date) > oneDayAgo
              );
              
              if (recentCareNotes.length > 0) {
                newNotifications.push(createNotification(
                  'info',
                  'Ghi chú chăm sóc mới',
                  `Có ${recentCareNotes.length} ghi chú chăm sóc mới cho người thân của bạn.`,
                  'care',
                  '/family',
                  { careNotes: recentCareNotes, familyId: user.id, residentIds }
                ));
              }
            }
          } catch (error) {
            if (!isForbidden(error)) console.error('Error fetching care notes:', error);
          }

          // Vital signs per resident - ensure proper filtering by resident IDs
          try {
            if (residentIds.length > 0) {
              // Lấy tất cả vital signs và filter theo resident IDs để đảm bảo chính xác
              const allVitalSigns = await vitalSignsAPI.getAll();
              
              // Filter vital signs theo resident IDs của family member
              const userVitalSigns = allVitalSigns.filter((vital: any) => {
                const vitalResidentId = vital.resident_id?._id || vital.resident_id;
                return residentIds.includes(vitalResidentId);
              });
              
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              const recentVitalSigns = userVitalSigns.filter((v: any) => 
                new Date(v.dateTime || v.created_at) > oneDayAgo
              );
              
              if (recentVitalSigns.length > 0) {
                newNotifications.push(createNotification(
                  'info',
                  'Chỉ số sức khỏe mới',
                  `Có ${recentVitalSigns.length} chỉ số sức khỏe mới được cập nhật.`,
                  'health',
                  '/family',
                  { vitalSigns: recentVitalSigns, familyId: user.id, residentIds }
                ));
              }
            }
          } catch (error) {
            if (!isForbidden(error)) console.error('Error fetching vital signs:', error);
          }

          // Visits upcoming for this family member - ensure proper filtering
          try {
            const visits = await visitsAPI.getAll({ family_member_id: user.id });
            const now = new Date();
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const upcomingVisits = visits.filter((visit: any) => {
              const visitDate = new Date(visit.visit_date || visit.date);
              return visitDate > now && visitDate <= oneWeekFromNow && visit.status === 'confirmed';
            });
            if (upcomingVisits.length > 0) {
              newNotifications.push(createNotification(
                'info',
                'Lịch thăm sắp tới',
                `Bạn có ${upcomingVisits.length} lịch thăm trong tuần tới.`,
                'visit',
                '/family/schedule-visit/history',
                { visits: upcomingVisits, familyId: user.id }
              ));
            }
          } catch (error) {
            if (!isForbidden(error)) console.error('Error fetching visits:', error);
          }
          break;

        case 'staff':
          // Check for new assignments - filter by staff_id
          try {
            const assignments = await staffAssignmentsAPI.getAll({ staff_id: user.id });
            const newAssignments = assignments.filter((assignment: any) => {
              const assignmentDate = new Date(assignment.created_at);
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              return assignmentDate > oneDayAgo && assignment.status === 'active';
            });

            if (newAssignments.length > 0) {
              newNotifications.push(createNotification(
                'info',
                'Phân công mới',
                `Bạn được phân công chăm sóc ${newAssignments.length} người cao tuổi mới.`,
                'assignment',
                '/staff/residents',
                { assignments: newAssignments, staffId: user.id, role: 'staff' }
              ));
            }
          } catch (error) {
            console.error('Error fetching assignments:', error);
          }

          // Check for pending care notes
          try {
            const pendingCareNotes = await careNotesAPI.getAll();
            const staffPendingNotes = pendingCareNotes.filter((note: any) => 
              !note.conducted_by && note.status === 'pending'
            );

            if (staffPendingNotes.length > 0) {
              newNotifications.push(createNotification(
                'warning',
                'Ghi chú chăm sóc chờ xử lý',
                `Có ${staffPendingNotes.length} ghi chú chăm sóc cần được xử lý.`,
                'care',
                '/staff/assessments',
                { careNotes: staffPendingNotes, staffId: user.id, role: 'staff' }
              ));
            }
          } catch (error) {
            console.error('Error fetching pending care notes:', error);
          }

          // Check for today's activities
          try {
            // Lấy danh sách staff assignments để biết staff được phân công chăm sóc resident nào
            const staffAssignments = await staffAssignmentsAPI.getMyAssignments();
            const assignedResidentIds = Array.isArray(staffAssignments) 
              ? staffAssignments
                  .filter((assignment: any) => assignment.status === 'active' && assignment.resident_id)
                  .map((assignment: any) => 
                    typeof assignment.resident_id === 'object' 
                      ? assignment.resident_id._id 
                      : assignment.resident_id
                  )
              : [];

            if (assignedResidentIds.length > 0) {
              // Lấy tất cả hoạt động trong ngày hôm nay
            const activities = await activityParticipationsAPI.getAll();
            const today = new Date().toISOString().split('T')[0];
              
              // Đếm số hoạt động duy nhất trong ngày (không trùng lặp theo activity_id)
              const uniqueTodayActivities = new Set();
              activities.forEach((activity: any) => {
                const activityDate = activity.date ? new Date(activity.date).toISOString().split('T')[0] : null;
                const activityId = activity.activity_id?._id || activity.activity_id;
                
                if (activityDate === today && activityId) {
                  uniqueTodayActivities.add(activityId);
                }
              });

              const todayActivitiesCount = uniqueTodayActivities.size;

              if (todayActivitiesCount > 0) {
              newNotifications.push(createNotification(
                'info',
                'Hoạt động hôm nay',
                  `Có ${todayActivitiesCount} hoạt động được lên lịch hôm nay.`,
                'activity',
                '/staff/activities',
                  { activitiesCount: todayActivitiesCount, staffId: user.id, role: 'staff' }
              ));
              }
            }
          } catch (error) {
            console.error('Error fetching activities:', error);
          }
          break;

        case 'admin':
          // Check for pending bills
          try {
            const allBills = await billsAPI.getAll();
            const pendingBills = allBills.filter((bill: any) => bill.status === 'pending');

            if (pendingBills.length > 0) {
              newNotifications.push(createNotification(
                'warning',
                'Hóa đơn chờ xử lý',
                `Có ${pendingBills.length} hóa đơn đang chờ xử lý.`,
                'hóa đơn',
                '/admin/financial-reports',
                { bills: pendingBills, adminId: user.id, role: 'admin' }
              ));
            }
          } catch (error) {
            console.error('Error fetching pending bills:', error);
          }

          // Check for new residents
          try {
            const recentResidents = await residentAPI.getAll();
            const newResidents = recentResidents.filter((resident: any) => {
              const admissionDate = new Date(resident.admission_date || resident.created_at);
              const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return admissionDate > oneWeekAgo;
            });

            if (newResidents.length > 0) {
              newNotifications.push(createNotification(
                'success',
                'Người cao tuổi mới',
                `Có ${newResidents.length} người cao tuổi mới được nhận vào viện.`,
                'system',
                '/admin/residents',
                { residents: newResidents, adminId: user.id, role: 'admin' }
              ));
            }
          } catch (error) {
            console.error('Error fetching new residents:', error);
          }

          // Check for bed assignments
          try {
            const bedAssignments = await bedAssignmentsAPI.getAll();
            const pendingAssignments = bedAssignments.filter((assignment: any) => 
              assignment.status === 'pending'
            );

            if (pendingAssignments.length > 0) {
              newNotifications.push(createNotification(
                'warning',
                'Phân công giường chờ xử lý',
                `Có ${pendingAssignments.length} yêu cầu phân công giường cần xử lý.`,
                'assignment',
                '/admin/residents',
                { assignments: pendingAssignments, adminId: user.id, role: 'admin' }
              ));
            }
          } catch (error) {
            console.error('Error fetching bed assignments:', error);
          }

          // Check for system alerts
          try {
            const recentResidents = await residentAPI.getAll();
            const bedAssignments = await bedAssignmentsAPI.getAll();
            
            const totalResidents = recentResidents.length;
            const occupiedBeds = bedAssignments.filter((assignment: any) => 
              assignment.status === 'active'
            ).length;
            
            if (totalResidents > 0) {
              const occupancyRate = (occupiedBeds / totalResidents) * 100;

              if (occupancyRate > 90) {
                newNotifications.push(createNotification(
                  'warning',
                  'Cảnh báo sức chứa',
                  `Tỷ lệ sử dụng giường đã đạt ${occupancyRate.toFixed(1)}%. Cần kiểm tra và mở rộng.`,
                  'system',
                  '/admin/residents',
                  { occupancyRate, totalResidents, occupiedBeds, adminId: user.id, role: 'admin' }
                ));
              }
            }
          } catch (error) {
            console.error('Error calculating occupancy rate:', error);
          }
          break;
      }

      // Add new notifications to the list, avoiding duplicates
      setNotifications(prev => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Filter existing notifications to only show those for current user
        const userSpecificNotifications = prev.filter(existing => {
          // If notification has familyId metadata, only show if it matches current user (for family members)
          if (existing.metadata?.familyId) {
            return existing.metadata.familyId === user.id;
          }
          // If notification has staffId metadata, only show if it matches current user (for staff)
          if (existing.metadata?.staffId) {
            return existing.metadata.staffId === user.id;
          }
          // If notification has adminId metadata, only show if it matches current user (for admin)
          if (existing.metadata?.adminId) {
            return existing.metadata.adminId === user.id;
          }
          // If no specific ID metadata, only show for admin/staff (global notifications)
          return user.role === 'admin' || user.role === 'staff';
        });
        
        const uniqueNewNotifications = newNotifications.filter(newNotif => {
          // Check if this notification already exists (by content and recent time)
          const newNotifKey = createNotificationKey(newNotif.title, newNotif.message, newNotif.category);
          
          const isDuplicate = userSpecificNotifications.some(existing => {
            const existingKey = createNotificationKey(existing.title, existing.message, existing.category);
            return existingKey === newNotifKey && existing.timestamp > oneHourAgo;
          });
          
          return !isDuplicate;
        });
        
        return [...uniqueNewNotifications, ...userSpecificNotifications];
      });

    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await generateRoleBasedNotifications();
    } finally {
      setLoading(false);
    }
  }, [generateRoleBasedNotifications]);

  // Auto-refresh notifications every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshNotifications();
    }
  }, [user, refreshNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll,
    loading,
    refreshNotifications
  }), [
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll,
    loading,
    refreshNotifications
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
