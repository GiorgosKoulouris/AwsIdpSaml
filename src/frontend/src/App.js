import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./configs/authConfig";
import './App.css'

function App() {
    const { instance, accounts } = useMsal();

    const handleLogin = async () => {
        instance.loginPopup(loginRequest)
            .then((response) => {
                fetchGroups(response.accessToken); // Fetch groups after login
            })
            .catch((error) => console.error(error));
    };

    const fetchGroups = async (userAccessToken) => {
        try {
            const backendURL = `${window.location.origin}/getSamlAssertion`
            const response = await fetch(backendURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userAccessToken }),
            });

            if (response.ok) {
                const res = await response.json();
                const base64Xml = res.data
                // Create the form for redirection
                const form = document.createElement("form");
                form.method = "POST";
                form.action = "https://signin.aws.amazon.com/saml";

                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "SAMLResponse";
                input.value = base64Xml;

                form.appendChild(input);
                document.body.appendChild(form);

                // Submit the form to redirect to AWS
                form.submit();
            } else {
                console.error("Failed to fetch groups:", await response.text());
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    const handleLogout = () => {
        instance.logoutPopup().catch((error) => console.error(error));
    };

    return (
        <div className="root-container">
            <h1 className="hero-text">TCOP AWS Federation</h1>
            {accounts.length > 0 ? (
                <div>
                    <button className="login-button" onClick={handleLogin}>View Accounts</button>
                    <button className="login-button last-button" onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <button className="login-button last-button" onClick={handleLogin}>Login</button>
            )}
        </div>
    );
}

export default App;
