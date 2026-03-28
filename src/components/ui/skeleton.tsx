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
      <Skeleton borderRadius="12px" height="24px" width="80px" />
      <Skeleton height="2.5rem" style={{ marginTop: "16px" }} width="70%" />
      <Skeleton height="1rem" style={{ marginTop: "16px" }} width="100%" />
      <Skeleton height="1rem" style={{ marginTop: "8px" }} width="90%" />
      <Skeleton height="0.875rem" style={{ marginTop: "24px" }} width="120px" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "32px",
        }}
      >
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
              <Skeleton borderRadius="50%" height="20px" width="20px" />
              <Skeleton height="1rem" width="100px" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Skeleton height="1.25rem" width="40px" />
              <Skeleton height="0.875rem" width="30px" />
            </div>
          </div>
        ))}
        <Skeleton
          borderRadius="4px"
          height="40px"
          style={{ marginTop: "4px" }}
          width="80px"
        />
      </div>
    </div>
  );
}

export function PollListSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div
            style={{
              padding: "24px",
              border: "1px solid hsl(var(--border))",
              borderRadius: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Skeleton borderRadius="12px" height="20px" width="70px" />
              <Skeleton height="14px" width="50px" />
            </div>
            <Skeleton
              height="1.25rem"
              style={{ marginBottom: "8px" }}
              width="85%"
            />
            <Skeleton
              height="0.875rem"
              style={{ marginBottom: "6px" }}
              width="100%"
            />
            <Skeleton
              height="0.875rem"
              style={{ marginBottom: "6px" }}
              width="90%"
            />
            <Skeleton height="0.875rem" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
