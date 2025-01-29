import { Saml20 } from 'saml';
import { getCertFile, getCertKeyFile } from './getEnvVariables.mjs';
import fs from 'fs';
import { getTransformedRoleString } from './transformRoleString.mjs';

function generateUniqueID() {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function createSignedAssertion(userEmail, groupNames, appAccessToken) {
	const awsAttributes = await getTransformedRoleString(groupNames, appAccessToken)
	const options = {
		cert: fs.readFileSync(getCertFile()),
		key: fs.readFileSync(getCertKeyFile()),
		issuer: process.env.SAML_ISSUER,
		lifetimeInSeconds: 300,
		audiences: 'urn:amazon:webservices',
		attributes: {
			'https://aws.amazon.com/SAML/Attributes/Role': awsAttributes,
			'https://aws.amazon.com/SAML/Attributes/RoleSessionName': userEmail
		},
		nameIdentifier: userEmail,
		sessionIndex: `_${generateUniqueID()}`,
		nameIdentifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
		recipient: "https://signin.aws.amazon.com/saml"
	};

	var signedAssertion = Saml20.create(options);
	return signedAssertion
}

function encryptSAMLAssertion(signedXML, publicCertificate) {
	return new Promise((resolve, reject) => {
		const options = {
			rsa_pub: publicCertificate,
			pem: publicCertificate,
			encryptionAlgorithm: "http://www.w3.org/2001/04/xmlenc#aes256-cbc",
		};

		encrypt(signedXML, options, (err, encrypted) => {
			if (err) return reject(err);
			resolve(encrypted);
		});
	});
}