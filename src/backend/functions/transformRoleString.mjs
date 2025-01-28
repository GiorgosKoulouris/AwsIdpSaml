import { getSamlProviderName } from "./getEnvVariables.mjs";

export function getTransformedRoleString(groupsArray) {
    const samlProviderName = getSamlProviderName();
    // Output array to store transformed strings
    const outputArray = [];

    // Regex to match the required pattern
    const regex = /^AWS-(\d{12})-(.+)$/;

    // Iterate over each string in the input array
    groupsArray.forEach(str => {
        const match = str.match(regex);
        if (match) {
            const accountId = match[1];
            const roleName = match[2];
            // Construct the new string and add to the output array
            const transformedString = `arn:aws:iam::${accountId}:role/${roleName},arn:aws:iam::${accountId}:saml-provider/${samlProviderName}`;
            outputArray.push(transformedString);
        }
    });

    return outputArray;
}



