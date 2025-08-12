"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function PaymentSuccessPage() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/family/finance");
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
          "linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)",
        padding: 0,
        animation: "fadeIn 0.8s"
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: none; }
        }
        .success-card {
          background: white;
          border-radius: 2.5rem;
          padding: 4rem 4.5rem 3.2rem 4.5rem;
          box-shadow: 0 16px 64px rgba(16,185,129,0.15);
          text-align: center;
          max-width: 720px;
          min-width: 520px;
          width: 100%;
          border: 2px solid #bbf7d0;
          animation: fadeIn 1.1s 0.1s both;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #bbf7d0;
          color: #16a34a;
          font-weight: 600;
          font-size: 1.05rem;
          border-radius: 9999px;
          padding: 0.18rem 1.1rem 0.18rem 0.7rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(16,185,129,0.08);
          letter-spacing: 0.01em;
          animation: fadeIn 1.2s 0.2s both;
        }
        .success-icon {
          width: 110px;
          height: 110px;
          color: #22c55e;
          margin-bottom: 36px;
          filter: drop-shadow(0 2px 12px #bbf7d0);
          animation: pop 0.7s cubic-bezier(.17,.67,.83,.67);
        }
        @keyframes pop {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        .success-title {
          color: #16a34a;
          font-weight: 800;
          font-size: 2.7rem;
          margin-bottom: 1.1rem;
          letter-spacing: -0.01em;
        }
        .success-desc {
          color: #64748b;
          font-size: 1.25rem;
          margin-bottom: 2.2rem;
        }
        .redirecting {
          color: #16a34a;
          font-weight: 600;
          font-size: 1.18rem;
          margin-bottom: 2.2rem;
        }
        .back-btn {
          background: linear-gradient(90deg, #22d3ee 0%, #16a34a 100%);
          color: white;
          border: none;
          border-radius: 1.1rem;
          padding: 1.1rem 2.8rem;
          font-weight: 600;
          font-size: 1.18rem;
          box-shadow: 0 2px 12px rgba(34,211,238,0.10);
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          margin-top: 0.2rem;
        }
        .back-btn:hover {
          background: linear-gradient(90deg, #16a34a 0%, #22d3ee 100%);
          transform: translateY(-2px) scale(1.03);
        }
        @media (max-width: 1100px) {
          .success-card { min-width: 0; max-width: 98vw; padding: 2.5rem 0.5rem; }
        }
        @media (max-width: 700px) {
          .success-card { padding: 1.5rem 0.7rem; border-radius: 1.2rem; }
          .success-title { font-size: 1.3rem; }
        }
      `}</style>
      <div className="success-card">
        <div className="success-badge">
          <CheckCircleIcon style={{ width: 26, height: 26, color: "#16a34a" }} />
          Giao dịch thành công
        </div>
        <CheckCircleIcon className="success-icon" />
        <div className="success-title">Thanh toán thành công!</div>
        <div className="success-desc">
          Cảm ơn bạn đã thanh toán.<br />Bạn sẽ được chuyển về trang hóa đơn trong giây lát.
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