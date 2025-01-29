# AWS Federation

## Overview

AWS Federation is a web application that acts as a centralized idP for multiple AWS accounts. Application users are authenticated through EntraID. After a successful login, a user will be redirected to AWS sign in page, where, based on their EntraID group memberships, a list of possible IAM roles will be available to consume.

### Components

The app consists of 2 main components:

- **Frontend application:** This is a lightweight client-side app that handles the EntraID login and redirects the user to AWS
- **Backend application:** This component evaluates the EntraID token and constructs and signs the SAML response. This response is then sent to the frontend and used for AWS authentication

## Prerequisites

Prerequisites for successfully deploying the app:

- An Entra ID tenant with an application configured for authenticating users against the application
- Appropriate access to all AWS accounts you want to configure the application as an external idP

**Important note:** As of now, the external SAML idP name must be the same on all AWS accounts. This may change in the future.

## Deployment

### Clone the repo

```bash
git clone https://github.com/GiorgosKoulouris/AwsIdpSaml.git
cd AwsIdpSaml
```

### EntraID

- Create a new App Registration. During creation,on Redirect URL select Single-Page application and fill the link that the application will be hosted. For example: *https://my-domain.com*
- Create a new Secret for the registration
- On App Registration's Token configuration, add a groups claim. Select security groups. On the ID section, select 'sAMAccountName' and untick 'Emit groups as role claims'.
- On App Registration's Token configuration, add an optional claim. Select ID and add the preferred_username
- On App Registration's API permissions add the following permissions (These are application permissions, not delegated permissions):
    - Microsoft Graph > Group.Read.All
    - Microsoft Graph > User.Read.All

### Create your certificate used for SAML Assertion signing

```bash
# While being on the repo's root directory
cd certs/SAML
openssl req -new -newkey rsa:2048 -x509 -sha256 \
    -nodes \
    -days 180 \
    -keyout private.key \
    -out certificate.crt
```

### XML Creation

You need to create an XML containing all the useful metadata for the application. This file is imported to the AWS SAML external provider.

```bash
# While being on the repo's root directory
cd certs/SAML
MY_ISSUER_ID='https://sub.my-domain.com' # Modify this. Add the domain (FQDN) of your app
MY_CERT_MD="$(awk 'NF && $0 !~ /-----/ {printf "%s", $0}' certificate.crt)"
# Define the validity period in days
validityDays=180
endDate=$(python3 -c "from datetime import datetime, timedelta; print((datetime.utcnow() + timedelta(days=${validityDays})).strftime('%Y-%m-%dT%H:%M:%SZ'))")
sed "s|https://my-domain.com|$MY_ISSUER_ID|g" templateMetadata.xml | \
    sed "s|CERT_REDUCTED|$MY_CERT_MD|g" | \
    sed "s/validUntil=\"[^\"]*\"/validUntil=\"$endDate\"/" | \
    > myMetadata.xml
```

**Important Note:** These files must be named exactly as documented here, or the container will fail to sign the SAML Assertion

### Configuration on AWS
On each AWS account you want to use this app, create SAML idP and import *myMetadata.xml* file as the provider's metadata XML.

**Note:** The IAM roles you will populate through the application must have the SAML provider you created listed in their trust relationships. Example:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::<AccountID>:saml-provider/<ProviderName>"
            },
            "Action": "sts:AssumeRoleWithSAML",
            "Condition": {
                "StringEquals": {
                    "SAML:aud": "https://signin.aws.amazon.com/saml"
                }
            }
        }
    ]
}
```


### Create your SSL certificate

To create a self-signed certificate, execute the following:

```bash
# While being on the repo's root directory
cd certs/SSL
openssl req -new -newkey rsa:2048 -x509 -sha256 \
    -nodes \
    -days 180 \
    -keyout domain-key.pem \
    -out domain.pem
```
**Note:** If you place your existing cert, or if you name the certificate and/or key differently, make sure to modify the nginx configuration file accordingly (conf/awsFed.conf).


### Modify env variables and deploy

The following environment variables need to be modified before deploying the stack:

- **AZ_AUTH_CLIENT_ID:** The EntraID application ID that you use for authentication
- **AZ_AUTH_CLIENT_SECRET:** The secret of the App Registration
- **AZ_AUTH_TENANT_ID:** The tenant ID
- **SAML_ISSUER:** A unique identifier of the SAML issuer for the application. Use the full URL of the application
- **SAML_PROVIDER_NAME:** The name of the IDP you created on the AWS accounts. The name **must** be the same on all accounts
- **SAML_SIGN_CERIFICATE_DIR:** The directory containing the certificates for SAML Assertion signing.
- **SSL_CERIFICATE_DIR:** The directory containing the SSL certificates for the web application

```bash
# While being on the repo's root directory
cp template.env .env
vi .env # Edit accordingly
source .env
docker-compose up -d
```

## AWS role assignment

AWS roles are populated to users based on their EntraID group memberships. Each EntraID group represents a role on an AWS account. 
There is no way to populate an AWS account/role without having the respective EntraID group.
The group naming structure is the following:

*AWS-\<myAccountID>-\<myRoleName>*

### Example

For example, the app is configured as an IDP on AWS account. On that account you have created 2 IAM roles.

- Account ID: **123465789012**
- Role 1 Name: **MyRole**
- Role 2 Name: **MyOtherRole**

If you want to populate these roles to a user, you must create the following 2 Groups in EntraID and make the user a group of them.

- Group name for Role 1: **AWS-123465789012-MyRole**
- Group name for Role 2: **AWS-123465789012-MyOtherRole**

### Group Nesting

By default, group nesting is not supported, so if a user is a member of groupA and groupA is a member of groupB, the user will not be able to use the role mapped to groupB.
In order to make user assignments manageable, a *parent* group can be created that will contain all groups related to AWS accounts/roles.
When a user is a member of this *parent* group, they will have access to all the AWS accounts/Roles that have their respective EntraID groups as a member of the *parent* group.

The group naming structure must be the following:

**AWS-AccountGroup-\<myGroupName>**

#### Example

For example, there are 2 AWS accounts. AWS account A has 2 configured IAM roles and AWS account B has 1 IAM 1 IAM role configured.

- Account A ID: **123456789012**
- Account B ID: **456789123078**
- Role A in Account A: **RoleA**
- Role B in Account A: **RoleB**
- Role A in Account B: **RoleA**

For the 3 accounts, we need the 3 EntraID groups:

- AWS-123456789012-RoleA
- AWS-123456789012-RoleB
- AWS-456789123078-RoleA

Create a group that we be the parent of these 3 groups. For example, based on the naming rule:

- Parent Group: **AWS-AccountGroup-MyAdmins**

Make the 3 groups members of the parent group *AWS-AccountGroup-MyAdmins*.
Each user that will be a member of the parent group, will have access to all 3 roles even if they are not a direct a member of the individual groups.




