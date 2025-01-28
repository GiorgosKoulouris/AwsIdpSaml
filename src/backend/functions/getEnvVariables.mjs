import { join } from 'path';
import { createRequire } from 'module'
const require = createRequire(import.meta.url);
require("dotenv").config();

export function getSamlIssuer() {
    return process.env.SAML_ISSUER;
}
export function getSamlProviderName() {
    return process.env.SAML_PROVIDER_NAME;
}
export function getCertFile() {
    if (process.env.APP_ENV === 'local') {
        const certLocation = process.env.SAML_SIGN_CERIFICATE_DIR;
        const certFile = join(certLocation, 'certificate.crt')
        return certFile;
    } else {
        return '/home/node/app/certs/certificate.crt'
    }
}
export function getCertKeyFile() {
    if (process.env.APP_ENV === 'local') {
        const keyLocation = process.env.SAML_SIGN_CERIFICATE_DIR;
        const keyFile = join(keyLocation, 'private.key')
        return keyFile;
    } else {
        return '/home/node/app/certs/private.key'
    }
}

