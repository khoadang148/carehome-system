"use client";

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MedicationReminder {
  residentName: string;
  medication: string;
  time: string;
  status: 'overdue' | 'due' | 'upcoming';
}

interface UpcomingAppointment {
  residentName: string;
  type: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface HighPriorityNote {
  residentName: string;
  note: string;
  timestamp: string;
  priority: string;
}

export default function StaffDashboardWidgets() {
  return null;
} 
