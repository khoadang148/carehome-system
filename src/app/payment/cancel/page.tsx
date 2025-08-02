"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { XCircleIcon } from "@heroicons/react/24/outline";

export default function PaymentCancelPage() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/finance");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
        padding: 0,
        animation: "fadeIn 0.8s"
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: none; }
        }
        .fail-card {
          background: white;
          border-radius: 2.5rem;
          padding: 4rem 4.5rem 3.2rem 4.5rem;
          box-shadow: 0 16px 64px rgba(239,68,68,0.15);
          text-align: center;
          max-width: 720px;
          min-width: 520px;
          width: 100%;
          border: 2px solid #fecaca;
          animation: fadeIn 1.1s 0.1s both;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .fail-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #fecaca;
          color: #dc2626;
          font-weight: 600;
          font-size: 1.05rem;
          border-radius: 9999px;
          padding: 0.18rem 1.1rem 0.18rem 0.7rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(239,68,68,0.08);
          letter-spacing: 0.01em;
          animation: fadeIn 1.2s 0.2s both;
        }
        .fail-icon {
          width: 110px;
          height: 110px;
          color: #dc2626;
          margin-bottom: 36px;
          filter: drop-shadow(0 2px 12px #fecaca);
          animation: pop 0.7s cubic-bezier(.17,.67,.83,.67);
        }
        @keyframes pop {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        .fail-title {
          color: #dc2626;
          font-weight: 800;
          font-size: 2.7rem;
          margin-bottom: 1.1rem;
          letter-spacing: -0.01em;
        }
        .fail-desc {
          color: #64748b;
          font-size: 1.25rem;
          margin-bottom: 2.2rem;
        }
        .redirecting {
          color: #dc2626;
          font-weight: 600;
          font-size: 1.18rem;
          margin-bottom: 2.2rem;
        }
        .back-btn {
          background: linear-gradient(90deg, #f87171 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 1.1rem;
          padding: 1.1rem 2.8rem;
          font-weight: 600;
          font-size: 1.18rem;
          box-shadow: 0 2px 12px rgba(239,68,68,0.10);
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          margin-top: 0.2rem;
        }
        .back-btn:hover {
          background: linear-gradient(90deg, #dc2626 0%, #f87171 100%);
          transform: translateY(-2px) scale(1.03);
        }
        @media (max-width: 1100px) {
          .fail-card { min-width: 0; max-width: 98vw; padding: 2.5rem 0.5rem; }
        }
        @media (max-width: 700px) {
          .fail-card { padding: 1.5rem 0.7rem; border-radius: 1.2rem; }
          .fail-title { font-size: 1.3rem; }
        }
      `}</style>
      <div className="fail-card">
        <div className="fail-badge">
          <XCircleIcon style={{ width: 26, height: 26, color: "#dc2626" }} />
          Giao dịch thất bại
        </div>
        <XCircleIcon className="fail-icon" />
        <div className="fail-title">Thanh toán thất bại!</div>
        <div className="fail-desc">
          Giao dịch đã bị hủy hoặc thất bại.<br />Bạn sẽ được chuyển về trang hóa đơn trong giây lát.
        </div>
        <div className="redirecting">Đang chuyển hướng...</div>
        <button
          className="back-btn"
          onClick={() => router.push("/family/finance")}
        >
          Xem hóa đơn
        </button>
      </div>
    </div>
  );
} 