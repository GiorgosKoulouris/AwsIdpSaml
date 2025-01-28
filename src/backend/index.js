import { createRequire } from 'module'
const require = createRequire(import.meta.url);
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
import { constructSamlResponse } from "./functions/constructSamlResponse.mjs"
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Microsoft Graph API Endpoint
const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";

// Generate an OAuth2 token for the app
async function getAppAccessToken() {
    const tokenUrl = `https://login.microsoftonline.com/${process.env.AZ_AUTH_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: process.env.AZ_AUTH_CLIENT_ID,
        client_secret: process.env.AZ_AUTH_CLIENT_SECRET,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
    });

    try {
        const response = await axios.post(tokenUrl, params.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return response.data.access_token;
    } catch (error) {
        console.error("Error fetching app access token:", error.response.data);
        throw new Error("Failed to get app access token");
    }
}

// Verify the user's access token (optional, for extra validation)
function verifyAccessToken(token) {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new Error("Invalid token");
    return decoded.payload;
}

// Endpoint to get user's group names
app.post("/getSamlAssertion", async (req, res) => {
    const { userAccessToken } = req.body;

    if (!userAccessToken) {
        return res.status(400).send("User access token is required");
    }

    try {
        // Optional: Verify the user's access token
        const userPayload = verifyAccessToken(userAccessToken);
        const userId = userPayload.oid; // User's object ID in Azure AD

        // Get app access token
        const appAccessToken = await getAppAccessToken();

        // Call Microsoft Graph API to fetch user's group names
        const response = await axios.get(`${GRAPH_ENDPOINT}/users/${userId}/memberOf`, {
            headers: { Authorization: `Bearer ${appAccessToken}` },
        });

        // Extract group names
        const groupNames = response.data.value
            .filter((group) => group["@odata.type"] === "#microsoft.graph.group")
            .map((group) => group.displayName);

        const samlAssertion = await constructSamlResponse(userAccessToken, groupNames)
        res.json({
            data: samlAssertion
        })

    } catch (error) {
        console.error("Error fetching user groups:", error.response?.data || error.message);
        res.status(500).send("Failed to fetch user groups");
    }
});

// Start the server
const PORT = process.env.APP_TCP_PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
