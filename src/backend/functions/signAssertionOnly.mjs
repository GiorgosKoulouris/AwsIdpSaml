import fs from "fs";
import { SignedXml } from "xml-crypto";
import { getCertFile, getCertKeyFile } from "./getEnvVariables.mjs";

export function signAssertionOnly(samlResponseXml) {
    // Load the private key and certificate
    const certificate = fs.readFileSync(getCertFile(), "utf8");
    const privateKey = fs.readFileSync(getCertKeyFile(), "utf8");

    const sig = new SignedXml({ privateKey: privateKey });

    sig.addReference({
        xpath: "//*[local-name(.)='Assertion']",
        transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"],
        digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
    });

    sig.signingKey = privateKey;
    sig.canonicalizationAlgorithm = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";

    // Add KeyInfo with the certificate
    sig.keyInfoProvider = {
        getKeyInfo() {
            return `<X509Data><X509Certificate>${certificate
                .replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, "")
                .trim()}</X509Certificate></X509Data>`;
        },
    };

    sig.computeSignature(samlResponseXml, {
        prefix: 'ds'
    });

    const signedXml = sig.getSignedXml();
    return signedXml;
}
