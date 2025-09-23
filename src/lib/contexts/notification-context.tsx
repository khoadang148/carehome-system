'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';
import { 
  billsAPI, 
  careNotesAPI, 
  vitalSignsAPI, 
  activityParticipationsAPI,
  visitsAPI,
  staffAssignmentsAPI,
  bedAssignmentsAPI,
  residentAPI,
  userAPI
} from '@/lib/api';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date; // Track when the notification was marked as read
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
  hideReadNotification: (id: string) => void;
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
      prev.map(n => {
        if (n.id === id) {
          // If this is a stored notification, remove it from localStorage
          if (n.metadata?.storedNotificationId) {
            try {
              const storedNotifications = JSON.parse(localStorage.getItem('familyNotifications') || '[]');
              const updatedNotifications = storedNotifications.filter((stored: any) => stored.id !== n.metadata.storedNotificationId);
              localStorage.setItem('familyNotifications', JSON.stringify(updatedNotifications));
            } catch (error) {
              console.error('Error removing stored notification:', error);
            }
          }
          return { ...n, read: true, readAt: new Date() };
        }
        return n;
      })
    );
  }, []);

  // Hide read notifications after a delay to prevent them from reappearing
  const hideReadNotification = useCallback((id: string) => {
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 1000); // Hide after 1 second
  }, []);

  const markAllAsRead = useCallback(() => {
    const now = new Date();
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true, readAt: now }))
    );
    // Hide all read notifications after a delay
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => !n.read));
    }, 1000);
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

    // Check if current user is pending approval (for family users)
    if (user.role === 'family' && user.status === 'pending') {
      // Only create this notification if it doesn't already exist and hasn't been read
      const existingPendingNotification = notifications.find(n => 
        n.title === 'Tài khoản đang chờ phê duyệt' && 
        n.category === 'system' && 
        n.metadata?.userId === user.id
      );
      
      if (!existingPendingNotification) {
        newNotifications.push(createNotification(
          'warning',
          'Tài khoản đang chờ phê duyệt',
          'Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng kiên nhẫn chờ đợi.',
          'system',
          undefined,
          { userId: user.id, role: 'family', status: 'pending' }
        ));
      }
    }

    const isForbidden = (err: any) => err?.response?.status === 403;

    try {
      switch (user.role) {
        case 'family':
          // Load notifications from localStorage first
          try {
            const storedNotifications = JSON.parse(localStorage.getItem('familyNotifications') || '[]');
            const userNotifications = storedNotifications.filter((n: any) => n.userId === user.id);
            
            userNotifications.forEach((storedNotif: any) => {
              newNotifications.push(createNotification(
                storedNotif.type,
                storedNotif.title,
                storedNotif.message,
                storedNotif.category,
                undefined,
                { familyId: user.id, storedNotificationId: storedNotif.id }
              ));
            });
          } catch (error) {
            console.error('Error loading stored notifications:', error);
          }

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
            
            // Check for unpaid bills - only notify if not already read
            const unpaidBills = userBills.filter((bill: any) => bill.status === 'pending');
            if (unpaidBills.length > 0) {
              const totalUnpaidAmount = unpaidBills.reduce((sum: number, bill: any) => 
                sum + (bill.amount || 0), 0
              );
              
              // Check if this notification already exists and hasn't been read
              const existingUnpaidNotification = notifications.find(n => 
                n.title === 'Hóa đơn cần thanh toán' && 
                n.category === 'hóa đơn' && 
                n.metadata?.familyId === user.id &&
                !n.read
              );
              
              if (!existingUnpaidNotification) {
                newNotifications.push(createNotification(
                  'warning',
                  'Hóa đơn cần thanh toán',
                  `Bạn có ${unpaidBills.length} hóa đơn chưa thanh toán với tổng số tiền ${formatDisplayCurrency(totalUnpaidAmount)}. Vui lòng kiểm tra và thanh toán sớm.`,
                  'hóa đơn',
                  '/family/finance',
                  { bills: unpaidBills, totalAmount: totalUnpaidAmount, familyId: user.id }
                ));
              }
            }
            
            // Check for recently paid bills (within last 24 hours) - only notify if not already read
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentlyPaidBills = userBills.filter((bill: any) => 
              bill.status === 'paid' && 
              new Date(bill.updated_at || bill.paid_at || bill.created_at) > oneDayAgo
            );
            
            if (recentlyPaidBills.length > 0) {
              const totalAmount = recentlyPaidBills.reduce((sum: number, bill: any) => 
                sum + (bill.amount || 0), 0
              );
              
              // Check if this notification already exists and hasn't been read
              const existingPaidNotification = notifications.find(n => 
                n.title === 'Thanh toán thành công' && 
                n.category === 'hóa đơn' && 
                n.metadata?.familyId === user.id &&
                !n.read
              );
              
              if (!existingPaidNotification) {
                newNotifications.push(createNotification(
                  'success',
                  'Thanh toán thành công',
                  `Bạn đã thanh toán thành công ${recentlyPaidBills.length} hóa đơn với tổng số tiền ${formatDisplayCurrency(totalAmount)}.`,
                  'hóa đơn',
                  '/family/finance',
                  { bills: recentlyPaidBills, totalAmount, familyId: user.id }
                ));
              }
            }
          } catch (error) {
            if (!isForbidden(error)) console.warn('Error fetching bills:', error);
          }

          // Care notes for linked residents - fetch per resident to avoid 500 on BE when resident_id is missing
          try {
            if (residentIds.length > 0) {
              const settled = await Promise.allSettled(
                residentIds.map((rid) => careNotesAPI.getAll({ resident_id: rid }))
              );

              const userCareNotes: any[] = [];
              for (const r of settled) {
                if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                  userCareNotes.push(...r.value);
                }
              }

              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              const recentCareNotes = userCareNotes.filter((note: any) =>
                new Date(note.created_at || note.date) > oneDayAgo
              );

              if (recentCareNotes.length > 0) {
                // Check if this notification already exists and hasn't been read
                const existingCareNotesNotification = notifications.find(n => 
                  n.title === 'Ghi chú chăm sóc mới' && 
                  n.category === 'care' && 
                  n.metadata?.familyId === user.id &&
                  !n.read
                );
                
                if (!existingCareNotesNotification) {
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
            }
          } catch (error) {
            if (!isForbidden(error)) console.warn('Error fetching care notes:', error);
          }

          // Vital signs per resident - bỏ qua để tránh lỗi 403
          // try {
          //   if (residentIds.length > 0) {
          //     // Lấy tất cả vital signs và filter theo resident IDs để đảm bảo chính xác
          //     const allVitalSigns = await vitalSignsAPI.getAll();
          //     
          //     // Filter vital signs theo resident IDs của family member
          //     const userVitalSigns = allVitalSigns.filter((vital: any) => {
          //       const vitalResidentId = vital.resident_id?._id || vital.resident_id;
          //       return residentIds.includes(vitalResidentId);
          //     });
          //     
          //     const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          //     const recentVitalSigns = userVitalSigns.filter((v: any) => 
          //       new Date(v.dateTime || v.created_at) > oneDayAgo
          //     );
          //     
          //     if (recentVitalSigns.length > 0) {
          //       newNotifications.push(createNotification(
          //         'info',
          //         'Chỉ số sức khỏe mới',
          //         `Có ${recentVitalSigns.length} chỉ số sức khỏe mới được cập nhật.`,
          //         'health',
          //         '/family',
          //         { vitalSigns: recentVitalSigns, familyId: user.id, residentIds }
          //       ));
          //     }
          //   }
          // } catch (error) {
          //   if (!isForbidden(error)) console.error('Error fetching vital signs:', error);
          // }

          // Visits upcoming for this family member - use correct endpoint
          try {
            const visits = await visitsAPI.getByFamily(user.id);
            const now = new Date();
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const upcomingVisits = visits.filter((visit: any) => {
              const visitDate = new Date(visit.visit_date || visit.date);
              return visitDate > now && visitDate <= oneWeekFromNow && visit.status === 'confirmed';
            });
            if (upcomingVisits.length > 0) {
              // Check if this notification already exists and hasn't been read
              const existingVisitNotification = notifications.find(n => 
                n.title === 'Lịch thăm sắp tới' && 
                n.category === 'visit' && 
                n.metadata?.familyId === user.id &&
                !n.read
              );
              
              if (!existingVisitNotification) {
                newNotifications.push(createNotification(
                  'info',
                  'Lịch thăm sắp tới',
                  `Bạn có ${upcomingVisits.length} lịch thăm trong tuần tới.`,
                  'visit',
                  '/family/schedule-visit/history',
                  { visits: upcomingVisits, familyId: user.id }
                ));
              }
            }
          } catch (error) {
            if (!isForbidden(error)) console.warn('Error fetching visits:', error);
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
            console.warn('Error fetching assignments:', error);
          }

          // Check for pending care notes - use staff assignments to get assigned residents first
          try {
            // Get staff assignments to find assigned residents
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
              // Fetch care notes for assigned residents only
              const settled = await Promise.allSettled(
                assignedResidentIds.map((rid) => careNotesAPI.getAll({ resident_id: rid }))
              );

              const allCareNotes: any[] = [];
              for (const r of settled) {
                if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                  allCareNotes.push(...r.value);
                }
              }

              const staffPendingNotes = allCareNotes.filter((note: any) => 
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
            }
          } catch (error) {
            console.warn('Error fetching pending care notes:', error);
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
            console.warn('Error fetching activities:', error);
          }
          break;

        case 'admin':
          // Check for very recent successful payments (within last 30 minutes only)
          try {
            const allBills = await billsAPI.getAll();
            const veryRecentPaidBills = allBills.filter((bill: any) => {
              if (bill.status !== 'paid') return false;
              const paymentDate = new Date(bill.updated_at || bill.paid_at || bill.created_at);
              const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
              return paymentDate > thirtyMinutesAgo;
            });

            if (veryRecentPaidBills.length > 0) {
              const totalAmount = veryRecentPaidBills.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0);
              newNotifications.push(createNotification(
                'success',
                'Thanh toán thành công',
                `Có ${veryRecentPaidBills.length} giao dịch thanh toán thành công với tổng số tiền ${formatDisplayCurrency(totalAmount)}.`,
                'hóa đơn',
                '/admin/financial-reports',
                { bills: veryRecentPaidBills, totalAmount, adminId: user.id, role: 'admin' }
              ));
            }
          } catch (error) {
            console.warn('Error fetching recent payments:', error);
          }

          // Check for new residents
          try {
            const recentResidentsRaw = await residentAPI.getAll();
            const recentResidents = Array.isArray(recentResidentsRaw) ? recentResidentsRaw : [];
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

            // Check for very recent new residents (within last hour)
            const veryRecentResidents = recentResidents.filter((resident: any) => {
              const admissionDate = new Date(resident.admission_date || resident.created_at);
              const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
              return admissionDate > oneHourAgo;
            });

            if (veryRecentResidents.length > 0) {
              newNotifications.push(createNotification(
                'info',
                'Người cao tuổi mới được thêm',
                `Có ${veryRecentResidents.length} người cao tuổi mới vừa được thêm vào hệ thống.`,
                'system',
                '/admin/residents',
                { residents: veryRecentResidents, adminId: user.id, role: 'admin' }
              ));
            }
          } catch (error) {
            console.warn('Error fetching new residents:', error);
          }

          // Check for pending user approvals
          try {
            const pendingUsers = await userAPI.getByRoleWithStatus("family", "pending");
            if (Array.isArray(pendingUsers) && pendingUsers.length > 0) {
              newNotifications.push(createNotification(
                'warning',
                'Yêu cầu phê duyệt tài khoản',
                `Có ${pendingUsers.length} yêu cầu phê duyệt tài khoản người dùng mới cần xử lý.`,
                'system',
                '/admin/approvals',
                { users: pendingUsers, adminId: user.id, role: 'admin' }
              ));
            }
          } catch (error) {
            console.warn('Error fetching pending users:', error);
          }

          // Check for bed assignments
          try {
            const bedAssignmentsRaw = await bedAssignmentsAPI.getAll();
            const bedAssignments = Array.isArray(bedAssignmentsRaw) ? bedAssignmentsRaw : [];
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
            console.warn('Error fetching bed assignments:', error);
          }

          // Check for system alerts
          try {
            const recentResidentsRaw2 = await residentAPI.getAll();
            const bedAssignmentsRaw2 = await bedAssignmentsAPI.getAll();
            const recentResidents2 = Array.isArray(recentResidentsRaw2) ? recentResidentsRaw2 : [];
            const bedAssignments2 = Array.isArray(bedAssignmentsRaw2) ? bedAssignmentsRaw2 : [];
            
            const totalResidents = recentResidents2.length;
            const occupiedBeds = bedAssignments2.filter((assignment: any) => 
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
            console.warn('Error calculating occupancy rate:', error);
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
      console.warn('Error generating notifications:', error);
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

  // Auto-hide read notifications after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
        const now = new Date();
        return prev.filter(n => {
          if (n.read && n.readAt) {
            const timeSinceRead = now.getTime() - n.readAt.getTime();
            // Hide read notifications after 30 seconds
            return timeSinceRead < 30000;
          }
          return true;
        });
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

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
    refreshNotifications,
    hideReadNotification
  }), [
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll,
    loading,
    refreshNotifications,
    hideReadNotification
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
