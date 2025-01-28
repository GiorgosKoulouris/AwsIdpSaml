
export function getClientID() {
    return window.frontendConfig.REACT_APP_AZ_CLIENT_ID
}
export function getTenantID() {
    return window.frontendConfig.REACT_APP_AZ_AUTHORITY
}
export function getAppURL() {
    return window.frontendConfig.REACT_APP_APP_URL
}

export const msalConfig = {
    auth: {
        clientId: getClientID(), // This is the ONLY mandatory field that you need to supply.
        authority: `https://login.microsoftonline.com/${getTenantID()}`, // Defaults to "https://login.microsoftonline.com/common"
        redirectUri: '/', // Points to window.location.origin. You must register this URI on Azure Portal/App Registration.
        postLogoutRedirectUri: '/', // Indicates the page to navigate after logout.
        navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
    },
    cache: {
        cacheLocation: 'sessionStorage', // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};

export const loginRequest = {
    scopes: ["openid", "profile", "User.Read", "GroupMember.Read.All"], // Scopes to request
};
