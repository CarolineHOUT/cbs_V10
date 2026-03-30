import React from "react";

export default function NotificationBadge({ notifications = [] }) {
  if (!notifications.length) return null;

  return (
    <div style={{ background: "#ffe0e0", padding: 8, marginBottom: 10 }}>
      ⚠️ {notifications.length} éléments à traiter
    </div>
  );
}