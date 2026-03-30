import React from "react";

export default function ActivityFeed({ activity = [] }) {
  return (
    <div>
      <h3>Activité</h3>
      {activity.map((item, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <strong>{item.type}</strong> — {item.label} — {item.date}
        </div>
      ))}
    </div>
  );
}
