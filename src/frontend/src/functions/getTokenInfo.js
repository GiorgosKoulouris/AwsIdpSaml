import { jwtDecode } from "jwt-decode";

function getDecodedToken(token) {
    return jwtDecode(token);
}

export function getUserName(token) {
    return(getDecodedToken(token).name)
}
export function getUserEmail(token) {
    return(getDecodedToken(token).preferred_username)
}
export function getUserGroups(token) {
    return(getDecodedToken(token).groups)
}
export function getUserID(token) {
    return(getDecodedToken(token).oid)
}
