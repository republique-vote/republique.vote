import { ImageResponse } from "next/og";

export const alt = "republique.vote — Le vote, partout, pour tous.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
	const figtree = await fetch(
		"https://fonts.gstatic.com/s/figtree/v9/_Xmz-HUzqDCFdgfMsYiV_F7wfS-Bs_eYR15e.ttf",
	).then((res) => res.arrayBuffer());

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					backgroundColor: "#000091",
					color: "#ffffff",
					padding: "80px",
					fontFamily: "Figtree",
					position: "relative",
				}}
			>
				{/* Top: title + badge */}
				<div style={{ display: "flex", flexDirection: "column" }}>
					<div
						style={{
							display: "flex",
							alignItems: "baseline",
							gap: "8px",
							marginBottom: "20px",
						}}
					>
						<span
							style={{
								fontSize: 72,
								fontWeight: 700,
								letterSpacing: "2px",
								textTransform: "uppercase",
							}}
						>
							REPUBLIQUE
						</span>
						<span
							style={{
								fontSize: 72,
								fontWeight: 700,
								letterSpacing: "2px",
								textTransform: "uppercase",
							}}
						>
							.VOTE
						</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							marginBottom: "32px",
						}}
					>
						<div
							style={{
								backgroundColor: "#fbbf24",
								color: "#000000",
								fontSize: 18,
								fontWeight: 700,
								padding: "6px 16px",
								textTransform: "uppercase",
								letterSpacing: "1px",
							}}
						>
							Proof of concept
						</div>
					</div>
					<p
						style={{
							fontSize: 34,
							fontWeight: 400,
							color: "#c3c3f5",
							lineHeight: 1.4,
							maxWidth: "700px",
						}}
					>
						Le vote, partout, pour tous. Par le peuple, pour le peuple.
					</p>
				</div>

				{/* Bottom row: disclaimer left + urne right */}
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						justifyContent: "space-between",
						width: "100%",
					}}
				>
					<p
						style={{
							fontSize: 16,
							fontWeight: 400,
							color: "#8585f6",
						}}
					>
						Projet de recherche open source. Ce site n&apos;est pas un service officiel du gouvernement.
					</p>

					{/* Urne icon */}
					<svg width="80" height="88" viewBox="0 0 32 32" fill="none">
						<rect x="12" y="2" width="8" height="12" fill="#ffffff" opacity="0.85" transform="rotate(8, 16, 8)" />
						<rect x="5" y="11" width="22" height="16" fill="#ffffff" />
						<rect x="11" y="11" width="10" height="3" fill="#000091" />
						<rect x="5" y="27" width="22" height="2" fill="#ffffff" opacity="0.5" />
					</svg>
				</div>
			</div>
		),
		{
			...size,
			fonts: [
				{
					name: "Figtree",
					data: figtree,
					style: "normal",
					weight: 700,
				},
			],
		},
	);
}
