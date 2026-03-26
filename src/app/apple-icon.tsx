import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#000091",
				}}
			>
				<svg width="120" height="130" viewBox="0 0 22 24" fill="none">
					{/* Bulletin (tilted rectangle coming from top) */}
					<rect x="8" y="0" width="6" height="10" rx="0" fill="#ffffff" opacity="0.85" transform="rotate(8, 11, 5)" />
					{/* Urne body */}
					<rect x="2" y="8" width="18" height="14" rx="0" fill="#ffffff" />
					{/* Fente */}
					<rect x="7" y="8" width="8" height="2" rx="0" fill="#000091" />
					{/* Shadow line */}
					<rect x="2" y="22" width="18" height="2" rx="0" fill="#ffffff" opacity="0.5" />
				</svg>
			</div>
		),
		{ ...size },
	);
}
