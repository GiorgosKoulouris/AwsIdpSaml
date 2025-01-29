import { getSamlIssuer } from "./getEnvVariables.mjs";
import { getUserEmail } from "./getTokenInfo.mjs";
import { createSignedAssertion } from "./createSignedAssertion.mjs";

function generateUniqueID() {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function constructSamlResponse(token, groupNames, appAccessToken) {
	const userEmail = getUserEmail(token);
	const samlIssuer = getSamlIssuer();
	const confirmationRecipient = "https://signin.aws.amazon.com/saml";
	const validityStartTime = new Date().toISOString().split('.')[0] + "Z";;

	const signedAssertion = await createSignedAssertion(userEmail, groupNames, appAccessToken)
	const samlResponse = `
	<saml2p:Response
			xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol"
			xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
			ID="_${generateUniqueID()}"
			Version="2.0"
			IssueInstant="${validityStartTime}"
			Destination="${confirmationRecipient}"
			InResponseTo="_${generateUniqueID()}">
	<saml2:Issuer>${samlIssuer}</saml2:Issuer>
	<saml2p:Status>
		<saml2p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success" />
	</saml2p:Status>
	${signedAssertion}
	</saml2p:Response>`

	const base64EncodedXml = Buffer.from(samlResponse).toString('base64');
	return base64EncodedXml;
}
