"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { serviceRequestsAPI, carePlansAPI } from "@/lib/api";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, UserIcon, CalendarDaysIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function ServiceRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any | null>(null);
  const [groupPreview, setGroupPreview] = useState<any | null>(null);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [planDetails, setPlanDetails] = useState<Record<string, any>>({});
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem("serviceRequestPreview") : null;
      if (cached) setGroupPreview(JSON.parse(cached));
    } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        try {
          const data = await serviceRequestsAPI.getById(id);
          if (mounted) setRequest(data);
        } catch (err: any) {
          // Fallback: some backends don't support getById -> fetch all and find
          try {
            const all = await (serviceRequestsAPI.getAll ? serviceRequestsAPI.getAll() : Promise.resolve([]));
            const found = Array.isArray(all) ? all.find((x: any) => x?._id === id) : null;
            if (mounted && found) setRequest(found);
          } catch {}
        }
      } catch (_) {
        /* noop */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const grouped = useMemo(() => groupPreview?.groupedRequests || (request ? [request] : []), [groupPreview, request]);
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "---");
  const typeLabel = (t?: string) => t === 'room_change' ? 'Đổi phòng' : t === 'service_date_change' ? 'Gia hạn dịch vụ' : t === 'care_plan_change' ? 'Đổi gói dịch vụ' : (t || '---');
  const typeColor = (t?: string) => t === 'room_change' ? 'from-orange-500 to-red-600' : t === 'service_date_change' ? 'from-emerald-500 to-teal-600' : 'from-violet-500 to-indigo-600';
  const formatCurrency = (n?: number) => typeof n === 'number' ? n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }) : '---';

  // Fetch care plan details when needed
  useEffect(() => {
    const uniquePlanIds = Array.from(new Set((grouped || [])
      .filter((r: any) => r?.request_type === 'care_plan_change')
      .map((r: any) => r?.target_service_package_id?._id || r?.target_service_package_id)
      .filter(Boolean)));
    if (uniquePlanIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const updates: Record<string, any> = {};
      for (const pid of uniquePlanIds) {
        if (planDetails[pid as string]) continue;
        try {
          const detail = await carePlansAPI.getById(pid as string);
          if (!cancelled) updates[pid as string] = detail;
        } catch {}
      }
      if (!cancelled && Object.keys(updates).length) {
        setPlanDetails(prev => ({ ...prev, ...updates }));
      }
    })();
    return () => { cancelled = true; };
  }, [grouped]);

  const approve = async () => {
    try {
      setBusy("approve");
      for (const r of grouped) await serviceRequestsAPI.approve(r._id);
      router.replace("/admin/approvals?tab=service-requests");
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    try {
      setBusy("reject");
      for (const r of grouped) await serviceRequestsAPI.reject(r._id);
      router.replace("/admin/approvals?tab=service-requests");
    } finally {
      setBusy(null);
    }
  };

  const Arrow = () => (<span className="mx-2 text-slate-400 font-bold">→</span>);
  function ChangePreview({ label, from, to, tone }: { label: string; from?: string | null; to?: string | null; tone: 'orange' | 'violet' | 'emerald' }) {
    const toColor = tone === 'orange' ? 'text-orange-700' : tone === 'emerald' ? 'text-emerald-700' : 'text-violet-700';
    return (
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</div>
        {(from && to) ? (
          <div className="flex items-center flex-wrap">
            <span className="font-bold text-slate-700">{from}</span>
            <Arrow />
            <span className={`font-bold ${toColor}`}>{to}</span>
          </div>
        ) : (
          <div className={`font-bold ${toColor}`}>{to || from || '---'}</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-white via-white to-violet-50 rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-violet-700">Chi tiết yêu cầu dịch vụ</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={approve} disabled={busy!==null} className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md disabled:opacity-50">
                {busy==="approve" ? <ArrowPathIcon className="w-4 h-4 animate-spin inline"/> : <CheckCircleIcon className="w-4 h-4 inline"/>} Phê duyệt
              </button>
              <button onClick={reject} disabled={busy!==null} className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md disabled:opacity-50">
                {busy==="reject" ? <ArrowPathIcon className="w-4 h-4 animate-spin inline"/> : <XCircleIcon className="w-4 h-4 inline"/>} Từ chối
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/50 p-6">
          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200/70 rounded w-1/3"></div>
              <div className="h-24 bg-slate-200/70 rounded"></div>
              <div className="h-24 bg-slate-200/70 rounded"></div>
            </div>
          )}
          {!loading && grouped.length === 0 && (
            <div className="text-center text-slate-600">Không tìm thấy yêu cầu.</div>
          )}
          {!loading && grouped.length > 0 && (
            <div className="space-y-5">
              {grouped.map((r: any, idx: number) => {
                const planId = r?.target_service_package_id?._id || r?.target_service_package_id;
                const plan = planId ? planDetails[planId] : null;
                return (
                  <div key={r._id || idx} className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-white via-white to-slate-50">
                    {/* Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-full bg-gradient-to-r ${typeColor(r.request_type)}`}>{typeLabel(r.request_type)}</span>
                      <span className="text-xs font-semibold text-slate-600 px-2.5 py-1 rounded-full bg-slate-100">Ngày gửi: {formatDate(r.createdAt || r.created_at)}</span>
                      {plan && (
                        <span className="text-xs font-semibold text-slate-600 px-2.5 py-1 rounded-full bg-slate-100">Giá: {formatCurrency(plan.price || plan.plan_price || plan.monthly_price)}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Người cao tuổi</div>
                        <div className="font-bold text-slate-800 flex items-center gap-2"><UserIcon className="w-4 h-4" /> {r.resident_id?.full_name || "---"}</div>
                      </div>

                      {r.request_type === 'room_change' && (
                        <ChangePreview
                          label="Đổi chỗ ở"
                          tone="orange"
                          from={r.current_room && r.current_bed ? `Phòng ${r.current_room} • Giường ${r.current_bed}` : undefined}
                          to={`${r.target_room_id?.room_number ? `Phòng ${r.target_room_id?.room_number}` : '---'}${r.target_bed_id?.bed_number ? ` • Giường ${r.target_bed_id?.bed_number}` : ''}`}
                        />
                      )}

                      {r.request_type === 'service_date_change' && (
                        <ChangePreview label="Gia hạn đến" tone="emerald" to={formatDate(r.new_end_date)} />
                      )}

                      {r.request_type === 'care_plan_change' && (
                        <div className="space-y-3">
                          <ChangePreview label="Đổi gói dịch vụ" tone="violet" to={r.target_service_package_id?.plan_name || plan?.plan_name || '---'} />
                          {/* Full plan details - mirror family page style */}
                          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="min-w-[200px]">
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Tên gói</div>
                                <div className="font-bold text-slate-800 text-lg">{plan?.plan_name || r.target_service_package_id?.plan_name || '---'}</div>
                              </div>
                              <div className="text-right ml-auto">
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Giá mỗi tháng</div>
                                <div className="text-blue-700 font-extrabold text-xl">{formatCurrency(plan?.monthly_price || plan?.plan_price || plan?.price)}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                              <div>
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Thời hạn/Billing</div>
                                <div className="font-bold text-slate-800">{plan?.duration ? `${plan.duration} ngày` : (plan?.billing_cycle || 'Hàng tháng')}</div>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Loại phòng áp dụng</div>
                                <div className="font-bold text-slate-800">{plan?.room_type || plan?.roomCategory || '---'}</div>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Mã gói</div>
                                <div className="font-bold text-slate-800">{plan?._id || '---'}</div>
                              </div>
                            </div>
                            {plan?.description && (
                              <div className="mt-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Mô tả</div>
                                <div className="text-slate-700 leading-relaxed text-sm">{plan.description}</div>
                              </div>
                            )}
                            {Array.isArray(plan?.services_included || plan?.services || plan?.features) && ((plan?.services_included?.length || plan?.services?.length || plan?.features?.length)) ? (
                              <div className="mt-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Dịch vụ bao gồm</div>
                                <div className="flex flex-wrap gap-2">
                                  {(plan.services_included || plan.services || plan.features)
                                    .slice(0, expandedServices[String(plan?._id)] ? undefined : 6)
                                    .map((s: any, i: number) => (
                                      <span key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                        {typeof s === 'string' ? s : (s?.name || s?.title || JSON.stringify(s))}
                                      </span>
                                    ))}
                                  {((plan.services_included || plan.services || plan.features)?.length || 0) > 6 && (
                                    <button onClick={() => setExpandedServices(prev => ({ ...prev, [String(plan?._id)]: !prev[String(plan?._id)] }))} className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-semibold hover:bg-blue-200">
                                      {expandedServices[String(plan?._id)] ? 'Thu gọn' : `+${((plan.services_included || plan.services || plan.features)?.length || 0) - 6} dịch vụ`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {r.note && (
                        <div className="md:col-span-2">
                          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Ghi chú</div>
                          <div className="font-semibold text-slate-800">{r.note}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
