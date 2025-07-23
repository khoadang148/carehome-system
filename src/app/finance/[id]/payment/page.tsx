"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function PaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const billId = params.id;

  useEffect(() => {
    const fetchPaymentLink = async () => {
      setLoading(true);
      setError(null);
      try {
        const accessToken = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null;
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/payment`,
          { bill_id: billId },
          {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
              "Content-Type": "application/json",
              Accept: "*/*",
            },
          }
        );
        setPaymentData(response.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.desc || "Không thể tạo link thanh toán. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    if (billId) fetchPaymentLink();
  }, [billId]);

  // Helper for formatting currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ fontSize: 20, color: "#64748b", fontWeight: 500 }}>Đang tạo link thanh toán...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ color: "#dc2626", fontSize: 18, fontWeight: 600 }}>{error}</div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)", display: "flex", flexDirection: "column" }}>
      {/* Header Branding */}
      <header style={{
        width: "100%",
        background: "#fff",
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
        padding: "1.5rem 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/globe.svg" alt="Logo" style={{ width: 40, height: 40 }} />
          <span style={{ fontWeight: 800, fontSize: 22, color: "#2563eb", letterSpacing: 1 }}>CareHome Pay</span>
        </div>
      </header>

      {/* Step Indicator */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center", margin: "2rem 0 1.5rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>1</div>
            <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, marginTop: 4 }}>Tạo link</span>
          </div>
          <div style={{ width: 36, height: 2, background: "#2563eb", borderRadius: 2 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: paymentData.status === "PENDING" ? "#2563eb" : "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>2</div>
            <span style={{ fontSize: 13, color: paymentData.status === "PENDING" ? "#2563eb" : "#16a34a", fontWeight: 600, marginTop: 4 }}>Thanh toán</span>
          </div>
          <div style={{ width: 36, height: 2, background: paymentData.status === "PENDING" ? "#e5e7eb" : "#16a34a", borderRadius: 2 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: paymentData.status === "PENDING" ? "#e5e7eb" : "#16a34a", color: paymentData.status === "PENDING" ? "#64748b" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>3</div>
            <span style={{ fontSize: 13, color: paymentData.status === "PENDING" ? "#64748b" : "#16a34a", fontWeight: 600, marginTop: 4 }}>Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* Main Payment Card */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 8px 32px rgba(37,99,235,0.08)",
          padding: "2.5rem 2.5rem 2rem 2.5rem",
          maxWidth: 480,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h2 style={{ fontWeight: 800, fontSize: 26, color: "#1e293b", marginBottom: 8, letterSpacing: -1 }}>Thanh toán hóa đơn</h2>
          <div style={{ color: "#64748b", fontWeight: 500, fontSize: 15, marginBottom: 24, textAlign: "center" }}>
            Vui lòng kiểm tra kỹ thông tin trước khi thanh toán. Hỗ trợ chuyển khoản nhanh qua mã QR hoặc online.
          </div>

          {/* Payment Summary */}
          <div style={{
            width: "100%",
            background: "#f8fafc",
            borderRadius: 16,
            padding: "1.25rem 1rem 1.5rem 1rem",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(16,185,129,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 16 }}>
              <span>Số tiền cần thanh toán</span>
              <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 20 }}>{formatCurrency(paymentData.amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 15 }}>
              <span>Chủ tài khoản</span>
              <span style={{ fontWeight: 600 }}>{paymentData.accountName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 15 }}>
              <span>Số tài khoản</span>
              <span style={{ fontWeight: 600 }}>{paymentData.accountNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 15 }}>
              <span>Ngân hàng</span>
              <span style={{ fontWeight: 600 }}>{paymentData.bin}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 15 }}>
              <span>Nội dung chuyển khoản</span>
              <span style={{ fontWeight: 600, color: "#2563eb" }}>{paymentData.description}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 15 }}>
              <span>Trạng thái</span>
              <span style={{ fontWeight: 600, color: paymentData.status === "PENDING" ? "#f59e42" : "#16a34a" }}>{paymentData.status === "PENDING" ? "Chờ thanh toán" : paymentData.status}</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div style={{ width: "100%", marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Quét mã QR để thanh toán</div>
            <div style={{ background: "#f3f4f6", borderRadius: 12, padding: 16, marginBottom: 8, boxShadow: "0 2px 8px rgba(59,130,246,0.06)" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentData.qrCode)}`}
                alt="QR Code"
                style={{ width: 220, height: 220, background: "#fff", borderRadius: 8 }}
              />
            </div>
            <div style={{ color: "#64748b", fontSize: 13, textAlign: "center" }}>
              Sử dụng app ngân hàng để quét mã hoặc nhập thông tin chuyển khoản bên trên.
            </div>
          </div>

          {/* Online Payment Button */}
          <a
            href={paymentData.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "white",
              padding: "0.9rem 1.5rem",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 17,
              textDecoration: "none",
              marginBottom: 12,
              textAlign: "center",
              width: "100%",
              boxShadow: "0 2px 8px rgba(16,185,129,0.08)",
              transition: "background 0.18s"
            }}
          >
            Thanh toán online qua PayOS
          </a>

          {/* Back Button */}
          <button
            onClick={() => router.push("/finance")}
            style={{
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: 10,
              padding: "0.8rem 2rem",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              marginTop: 8,
              width: "100%",
              transition: "background 0.18s"
            }}
          >
            Quay lại trang tài chính
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        width: "100%",
        background: "#fff",
        borderTop: "1px solid #e5e7eb",
        padding: "1.25rem 0",
        textAlign: "center",
        color: "#64748b",
        fontSize: 14,
        fontWeight: 500
      }}>
        © {new Date().getFullYear()} CareHome Pay. Bảo mật & an toàn thanh toán.
      </footer>
    </div>
  );
} 