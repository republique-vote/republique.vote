"use client";

import styles from "./skeleton.module.css";

export function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius = "4px",
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function PollDetailSkeleton() {
  return (
    <div style={{ width: "100%", alignSelf: "stretch" }}>
      <Skeleton width="80px" height="24px" borderRadius="12px" />
      <Skeleton width="70%" height="2.5rem" style={{ marginTop: "16px" }} />
      <Skeleton width="100%" height="1rem" style={{ marginTop: "16px" }} />
      <Skeleton width="90%" height="1rem" style={{ marginTop: "8px" }} />
      <Skeleton width="120px" height="0.875rem" style={{ marginTop: "24px" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "32px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              padding: "16px 20px",
              border: "1px solid hsl(var(--border))",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Skeleton width="20px" height="20px" borderRadius="50%" />
              <Skeleton width="100px" height="1rem" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Skeleton width="40px" height="1.25rem" />
              <Skeleton width="30px" height="0.875rem" />
            </div>
          </div>
        ))}
        <Skeleton width="80px" height="40px" borderRadius="4px" style={{ marginTop: "4px" }} />
      </div>
    </div>
  );
}

export function PollListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div
            style={{
              padding: "24px",
              border: "1px solid hsl(var(--border))",
              borderRadius: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Skeleton width="70px" height="20px" borderRadius="12px" />
              <Skeleton width="50px" height="14px" />
            </div>
            <Skeleton width="85%" height="1.25rem" style={{ marginBottom: "8px" }} />
            <Skeleton width="100%" height="0.875rem" style={{ marginBottom: "6px" }} />
            <Skeleton width="90%" height="0.875rem" style={{ marginBottom: "6px" }} />
            <Skeleton width="40%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
