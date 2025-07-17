"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

// Define types for resident data
export interface Resident {
  id: string; // Changed to string to match API ObjectIds
  name: string;
  room: string;
  photo: string;
  age: number;
  status: string;
  activities?: any[];
  vitals?: any;
  careNotes?: any[];
  medications?: any[];
  appointments?: any[];
}

interface ResidentsContextType {
  residents: Resident[];
  selectedResident: Resident | null;
  setSelectedResident: (resident: Resident | null) => void;
  getResidentById: (id: string) => Resident | undefined;
  getResidentByName: (name: string) => Resident | undefined;
}

const ResidentsContext = createContext<ResidentsContextType | undefined>(undefined);

// Mock residents data - sync with family page
// Using API ObjectIds where known, generating others for consistency
const mockResidents: Resident[] = [
  { 
    id: 'resident_alice_johnson', // Temporary ID for Alice Johnson
    name: 'Alice Johnson', 
    room: '101', 
    photo: 'https://randomuser.me/api/portraits/women/72.jpg',
    age: 78,
    status: 'Ổn định',
    activities: [
      { id: 1, name: 'Tập thể dục buổi sáng', time: '08:00 AM', endTime: '09:00 AM', participated: true },
      { id: 2, name: 'Nghệ thuật & Thủ công', time: '10:30 AM', endTime: '11:30 AM', participated: true },
      { id: 3, name: 'Liệu pháp âm nhạc', time: '02:00 PM', endTime: '03:00 PM', participated: false }
    ],
    vitals: {
      lastUpdated: '2023-05-10 09:30 AM',
      bloodPressure: '130/85',
      heartRate: 72,
      temperature: 36.8,
      weight: '65 kg'
    },
    careNotes: [
      { id: 1, date: '2023-05-10', note: 'Tham gia tập thể dục buổi sáng rất tích cực. Ăn hết 100% bữa sáng.', staff: 'John Smith, RN' },
      { id: 2, date: '2023-05-09', note: 'Báo cáo khó chịu nhẹ ở đầu gối phải. Đã áp dụng túi chườm nóng. Sẽ theo dõi.', staff: 'Sarah Johnson, CNA' },
      { id: 3, date: '2023-05-08', note: 'Được con gái Emily thăm. Tâm trạng cải thiện rõ rệt sau chuyến thăm.', staff: 'David Wilson' }
    ],
    medications: [
      { id: 1, name: 'Lisinopril', dosage: '10mg', schedule: 'Mỗi ngày một lần', lastAdministered: '2023-05-10 08:00 AM' },
      { id: 2, name: 'Simvastatin', dosage: '20mg', schedule: 'Mỗi ngày một lần trước giờ đi ngủ', lastAdministered: '2023-05-09 09:00 PM' },
      { id: 3, name: 'Vitamin D', dosage: '1000 IU', schedule: 'Mỗi ngày một lần', lastAdministered: '2023-05-10 08:00 AM' }
    ],
    appointments: [
      { id: 1, type: 'Khám bác sĩ', date: '2023-05-15', time: '10:00 AM', provider: 'Dr. Robert Brown' },
      { id: 2, type: 'Vật lý trị liệu', date: '2023-05-12', time: '02:30 PM', provider: 'Michael Stevens, PT' }
    ]
  },
  { 
    id: '686907bf5790b3201332f4e3', // Actual API ID for Nguyễn Văn Nam
    name: 'Nguyễn Văn Nam', 
    room: '102', 
    photo: 'https://randomuser.me/api/portraits/men/65.jpg',
    age: 82,
    status: 'Ổn định'
  },
  { 
    id: 'resident_tran_thi_lan', // Temporary ID for Trần Thị Lan
    name: 'Trần Thị Lan', 
    room: '103', 
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    age: 75,
    status: 'Cần theo dõi'
  },
  { 
    id: 'resident_le_van_minh', // Temporary ID for Lê Văn Minh
    name: 'Lê Văn Minh', 
    room: '104', 
    photo: 'https://randomuser.me/api/portraits/men/70.jpg',
    age: 80,
    status: 'Ổn định'
  }
];

export function ResidentsProvider({ children }: { children: ReactNode }) {
  const [residents] = useState<Resident[]>(mockResidents);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(residents[0]);

  const getResidentById = (id: string) => {
    return residents.find(resident => resident.id === id);
  };

  const getResidentByName = (name: string) => {
    return residents.find(resident => resident.name === name);
  };

  return (
    <ResidentsContext.Provider value={{
      residents,
      selectedResident,
      setSelectedResident,
      getResidentById,
      getResidentByName
    }}>
      {children}
    </ResidentsContext.Provider>
  );
}

export function useResidents() {
  const context = useContext(ResidentsContext);
  if (context === undefined) {
    throw new Error('useResidents must be used within a ResidentsProvider');
  }
  return context;
} 
