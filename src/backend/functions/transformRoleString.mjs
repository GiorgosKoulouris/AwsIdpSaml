import { createRequire } from 'module'
const require = createRequire(import.meta.url);
const axios = require("axios");
import { getSamlProviderName } from "./getEnvVariables.mjs";

function getDirectAssignmentArray(groupsArray) {
    // Regex to match the required pattern
    const regex = /^AWS-(\d{12})-(.+)$/;

    // Iterate over each string in the input array
    const outputArray = groupsArray
        .filter((grp) => grp[0].match(regex))
        .map((grp) => grp[0])

    return outputArray;
}

async function getIndirectAssignmentArray(groupsArray, appAccessToken) {
    const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";

    // Output array to store transformed strings
    const outputArray = [];

    // Regex to match the required pattern
    const parentGroupRegex = /^AWS-AccountGroup-(.+)$/;
    const parentGroups = groupsArray
        .filter((group) => group[0].match(parentGroupRegex))

    const childGroupRegex = /^AWS-(\d{12})-(.+)$/;

    // Iterate over each string in the input array
    for (let i in parentGroups) {
        const parentGroupID = parentGroups[i][1];
        const response = await axios.get(`${GRAPH_ENDPOINT}/groups/${parentGroupID}/members`, {
            headers: { Authorization: `Bearer ${appAccessToken}` },
        });
        // Get the names of the childs that are groups and their names match the pattern
        const childGroupNames = response.data.value
            .filter((group) => group["@odata.type"] === "#microsoft.graph.group")
            .map((group) => group.displayName)
            .filter((group) => group.match(childGroupRegex));

        childGroupNames.forEach(grp => {
            if (grp.match(childGroupRegex)) {
                outputArray.push(grp)
            }
        })
    }
    return outputArray
}


export async function getTransformedRoleString(groupsArray, appAccessToken) {
    const samlProviderName = getSamlProviderName();
    const directAssignments = getDirectAssignmentArray(groupsArray);
    const indirectAssignments = await getIndirectAssignmentArray(groupsArray, appAccessToken);
    // Merge the arrays
    const summedGroupArray = directAssignments;
    indirectAssignments.forEach(grp => {
        summedGroupArray.push(grp)
    })
    // Remove duplicates
    const summedGroupArrayUnique = summedGroupArray.filter(function (elem, pos) {
        return summedGroupArray.indexOf(elem) == pos;
    })
    // Construct the string used by AWS for Account and Role mapping
    const transformedStringArray = []
    summedGroupArrayUnique.forEach(grp => {
        const regex = /^AWS-(\d{12})-(.+)$/;
        const match = grp.match(regex);
        if (match) {
            const accountId = match[1];
            const roleName = match[2];
            // Construct the new string and add to the output array
            const transformedString = `arn:aws:iam::${accountId}:role/${roleName},arn:aws:iam::${accountId}:saml-provider/${samlProviderName}`;
            transformedStringArray.push(transformedString);
        }
    })

    return transformedStringArray;
}