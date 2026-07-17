import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const QRCodeView = ({ value, size = 200, fgColor = "#1e293b", bgColor = "#ffffff" }) => {
  if (!value) return null;
  
  return (
    <div style={{ display: "inline-flex", padding: "12px", background: bgColor, borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <QRCodeCanvas
        value={value}
        size={size}
        fgColor={fgColor}
        bgColor={bgColor}
        level={"M"}
        marginSize={0}
      />
    </div>
  );
};

export default QRCodeView;
