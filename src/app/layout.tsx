import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { fr } from "@codegouvfr/react-dsfr";
import { getHtmlAttributes, DsfrHead } from "../dsfr-bootstrap/server-only-index";
import { DsfrProvider } from "../dsfr-bootstrap";

export default function RootLayout({ children }: { children: React.ReactNode; }) {

	const lang = "fr";

	return (
		<html {...getHtmlAttributes({ lang })}>
			<head>
				<title>republique.vote — Plateforme de vote en ligne transparente</title>
				<meta name="description" content="Plateforme de vote en ligne transparente pour les citoyens français" />
				<DsfrHead
					preloadFonts={[
						"Marianne-Regular",
						"Marianne-Medium",
						"Marianne-Bold"
					]}
				/>
			</head>
			<body
				style={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column"
				}}
			>
				<AppRouterCacheProvider>
					<DsfrProvider lang={lang}>
						<MuiDsfrThemeProvider>
							<Header
								brandTop={<>République<br />Française</>}
								serviceTitle="republique.vote"
								serviceTagline="Plateforme de vote en ligne transparente"
								homeLinkProps={{
									href: "/",
									title: "republique.vote — Accueil"
								}}
								quickAccessItems={[
									headerFooterDisplayItem,
									{
										iconId: "fr-icon-account-circle-line",
										linkProps: {
											href: "/login"
										},
										text: "Se connecter"
									}
								]}
							/>
							<div
								style={{
									flex: 1,
									margin: "auto",
									maxWidth: 1000,
									...fr.spacing("padding", {
										topBottom: "10v"
									})
								}}>
								{children}
							</div>
							<Footer
								brandTop={<>République<br />Française</>}
								homeLinkProps={{
									href: "/",
									title: "republique.vote — Accueil"
								}}
								accessibility="non compliant"
								contentDescription="republique.vote est un proof of concept open source de vote en ligne transparent pour les citoyens français. Chaque vote est chiffré, publié publiquement et vérifiable par tous."
								bottomItems={[
									headerFooterDisplayItem,
									{
										text: "Code source",
										linkProps: {
											href: "https://github.com/antoinekm",
											target: "_blank"
										}
									}
								]}
							/>
						</MuiDsfrThemeProvider>
					</DsfrProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
