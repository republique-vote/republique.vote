import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { fr } from "@codegouvfr/react-dsfr";
import { getHtmlAttributes, DsfrHead } from "../dsfr-bootstrap/server-only-index";
import { DsfrProvider } from "../dsfr-bootstrap";
import { SWRProvider } from "./swr-provider";
import { HeaderAuthItem } from "@/components/auth/header-auth-item";

export default function RootLayout({ children }: { children: React.ReactNode; }) {

	const lang = "fr";

	return (
		<html {...getHtmlAttributes({ lang })}>
			<head>
				<title>republique.vote — Le vote, partout, pour tous</title>
				<meta name="description" content="Le vote, partout, pour tous pour les citoyens français" />
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
						<SWRProvider>
							<Notice
								isClosable={false}
								title="republique.vote est un projet de recherche open source. Ce site n'est pas un service officiel du gouvernement français."
							/>
							<Header
								brandTop={<>République<br />Française</>}
								serviceTitle="republique.vote"
								serviceTagline="Le vote, partout, pour tous"
								homeLinkProps={{
									href: "/",
									title: "republique.vote — Accueil"
								}}
								quickAccessItems={[
									headerFooterDisplayItem,
									<HeaderAuthItem key="auth" />,
								]}
							/>
							<main className="fr-container" style={{ flex: 1, ...fr.spacing("padding", { topBottom: "10v" }) }}>
								{children}
							</main>
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
						</SWRProvider>
						</MuiDsfrThemeProvider>
					</DsfrProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
