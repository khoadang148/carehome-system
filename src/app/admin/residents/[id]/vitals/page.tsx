"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  HeartIcon,
  ScaleIcon,
  FireIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { vitalSignsAPI, residentAPI } from '@/lib/api';

interface VitalSigns {
  id: string;
  date: string;
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  weight?: number;
  notes?: string;
  alertLevel?: string;
  measuredBy?: string;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

interface Resident {
  id: string;
  name: string;
  room?: string;
  bed?: string;
}

export default function VitalsPage() {
  const params = useParams();
  const router = useRouter();
  const residentId = params.id as string;

  const [resident, setResident] = useState<Resident | null>(null);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVital, setSelectedVital] = useState<VitalSigns | null>(null);
  const [dateFilter, setDateFilter] = useState('7days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResidentData();
    loadVitalsData();
  }, [residentId]);

  const loadResidentData = async () => {
    try {
      const residentData = await residentAPI.getById(residentId);
      setResident(residentData);
    } catch (error) {
    }
  };

  const loadVitalsData = async () => {
    try {
      setLoading(true);
      const vitalsData = await vitalSignsAPI.getByResidentId(residentId);
      setVitals(vitalsData);
    } catch (error) {
      setVitals([]);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAlertText = (level: string) => {
    switch (level) {
      case 'normal': return 'Bình thường';
      case 'warning': return 'Cần chú ý';
      case 'critical': return 'Nguy hiểm';
      default: return 'Bình thường';
    }
  };

  const getAlertLevel = (vital: VitalSigns) => {
    const heartRateNormal = vital.heartRate >= 60 && vital.heartRate <= 100;
    const temperatureNormal = vital.temperature >= 36.0 && vital.temperature <= 37.5;
    const oxygenNormal = vital.oxygenLevel >= 95 && vital.oxygenLevel <= 100;

    if (!heartRateNormal || !temperatureNormal || !oxygenNormal) {
      return 'warning';
    }
    return 'normal';
  };

  const getLatestVitals = () => {
    if (vitals.length === 0) return null;
    return vitals.reduce((latest, current) => {
      const latestDate = new Date(latest.date);
      const currentDate = new Date(current.date);
      return currentDate > latestDate ? current : latest;
    });
  };

  const latestVitals = getLatestVitals();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-base text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-base text-gray-500">Không tìm thấy thông tin người cao tuổi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <Link
                href={`/admin/residents/${residentId}`}
                className="inline-flex items-center gap-2 text-blue-600 no-underline mb-4 hover:text-blue-700 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Quay lại hồ sơ
              </Link>
              <div className="flex items-center gap-4 mb-4">
                <HeartIcon className="w-8 h-8 text-red-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent m-0">
                  Chỉ Số Sinh Hiệu
                </h1>
              </div>
              <p className="text-gray-600 m-0">
                Theo dõi các chỉ số sức khỏe của {resident.name}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm chỉ số
            </button>
          </div>
        </div>

        {latestVitals && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border-2 border-red-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 m-0">
                Chỉ số mới nhất
              </h2>
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-600">
                {getAlertText(getAlertLevel(latestVitals))}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <HeartIcon className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800 font-semibold m-0">
                    Huyết áp
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-800 m-0">
                  {latestVitals.bloodPressure}
                </p>
                <p className="text-xs text-gray-500 m-0">mmHg</p>
              </div>

              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <HeartIcon className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800 font-semibold m-0">
                    Nhịp tim
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-800 m-0">
                  {latestVitals.heartRate}
                </p>
                <p className="text-xs text-gray-500 m-0">bpm</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <FireIcon className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800 font-semibold m-0">
                    Nhiệt độ
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-800 m-0">
                  {latestVitals.temperature}
                </p>
                <p className="text-xs text-gray-500 m-0">°C</p>
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <HeartIcon className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-semibold m-0">
                    Nhịp thở
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-800 m-0">
                  {latestVitals.respiratoryRate || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 m-0">lần/phút</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <HeartIcon className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800 font-semibold m-0">
                    SpO2
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-800 m-0">
                  {latestVitals.oxygenSaturation || latestVitals.oxygenLevel}
                </p>
                <p className="text-xs text-gray-500 m-0">%</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <ScaleIcon className="w-5 h-5 text-gray-600" />
                  <p className="text-sm text-gray-800 font-semibold m-0">
                    Cân nặng
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-800 m-0">
                  {latestVitals.weight || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 m-0">kg</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2 font-semibold">
                Ghi chú:
              </p>
              <p className="text-sm text-gray-600 m-0">
                {latestVitals.notes || 'Không có ghi chú'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Đo bởi: {latestVitals.measuredBy || 'Hệ thống'} • {format(new Date(latestVitals.date), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 m-0">
              Lịch sử chỉ số
            </h2>
            <div className="flex gap-4">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="90days">3 tháng qua</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Thời gian
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700">
                    Huyết áp
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700">
                    Nhịp tim
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700">
                    Nhiệt độ
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700">
                    SpO2
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700">
                    Cân nặng
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Người đo
                  </th>
                </tr>
              </thead>
              <tbody>
                {vitals.map((vital, index) => (
                  <tr
                    key={vital.id}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${index < vitals.length - 1 ? 'border-b' : ''
                      }`}
                    onClick={() => setSelectedVital(vital)}
                  >
                    <td className="p-3 border-b border-gray-200">
                      {format(new Date(vital.date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-green-600">
                        {vital.bloodPressure}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-semibold ${(vital.heartRate > 100 || vital.heartRate < 60) ? 'text-red-500' : 'text-green-600'
                        }`}>
                        {vital.heartRate}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-semibold ${(vital.temperature > 37.2 || vital.temperature < 36.0) ? 'text-red-500' : 'text-green-600'
                        }`}>
                        {vital.temperature}°C
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-semibold ${(vital.oxygenSaturation || vital.oxygenLevel) < 95 ? 'text-red-500' : 'text-green-600'
                        }`}>
                        {(vital.oxygenSaturation || vital.oxygenLevel)}%
                      </span>
                    </td>
                    <td className="p-4 text-center font-semibold text-gray-800">
                      {vital.weight || 'N/A'} kg
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAlertLevel(vital) === 'normal'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-yellow-100 text-yellow-600'
                        }`}>
                        {getAlertText(getAlertLevel(vital))}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {vital.measuredBy || 'Hệ thống'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {vitals.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <HeartIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium m-0">
                Chưa có dữ liệu chỉ số sinh hiệu
              </p>
              <p className="mt-2">
                Bắt đầu theo dõi bằng cách thêm chỉ số đầu tiên
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 