"use client";

import { motion } from "framer-motion";

interface ActivityItem {
  id: string;
  time: string;
  agent: string;
  action: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="vf-activity-feed">
        <p className="vf-muted" style={{ padding: "var(--space-4)", fontSize: "var(--text-sm)" }}>
          No recent activity. Agent actions will appear here in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="vf-activity-feed">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className="vf-activity-item"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="vf-activity-time">{item.time}</span>
          <span className="vf-activity-text">
            <strong>{item.agent}</strong> {item.action}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
