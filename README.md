# webapp

DemoTest

Table of Contents
Introduction
User Requirements 📝
Prerequisites
Required Dependencies
Available Scripts
API Endpoints
HTTP Response Codes
Instructions
Testing the Service
Introduction
Node.js is a server-side JavaScript runtime environment that empowers developers to create high-performance and scalable network applications.

User Requirements
Users should be able to create a new account by providing their email address, password, first name, and last name.
The "account_created" field for the user should be set to the current time upon successful account creation.
Users cannot set values for "account_created" and "account_updated." Any provided values for these fields will be ignored. Passwords must never be returned in the response payload.
If a user account with the same email address already exists, the application must return a 400 Bad Request HTTP response code.
Passwords should be securely stored using the BCrypt password hashing scheme with a salt.
Users can update their account information, including their First Name, Last Name, and Password.
Attempting to update any other field should result in a 400 Bad Request HTTP response code.
The "account_updated" field for the user should be updated upon successful account updates.
Users can only update their own account information.
Retrieve user information.
Users should be able to retrieve their account information. The response payload should include all fields for the user except the password.
Prerequisites:
VSCode (Integrated Development Environment)
POSTMAN (API Testing Tool)
MySQL (Database)
Node.js (JavaScript Runtime)
Digital Ocean (Cloud Hosting Platform)
Required Dependencies
Express
mysql2
bcrypt
body-parser
nodemon
dotenv
jest
supertest
Available Scripts
npm start: Start the development server.
npx jest: Run the test suite.
API Endpoints
The application offers the following endpoints for various operations:

GET - http://localhost:3000/healthz/
GET - http://localhost:3000/v1/assignments/
POST - http://localhost:3000/v1/assignments/
GET - http://localhost:3000/v1/assignments/{id}
DELETE - http://localhost:3000/v1/assignments/{id}
PUT - http://localhost:3000/v1/assignments/{id}




HTTP Response Codes
"200 OK" - The request succeeded.
"201 Created" - The request succeeded, and a new resource was created (typically used for POST requests or some PUT requests).
"204 No Content" - The request succeeded, but the client doesn't need to navigate away from its current page.
"400 Bad Request" - The server couldn't understand the request due to invalid syntax.
"401 Unauthorized" - Although the HTTP standard specifies "unauthorized," this response means "unauthenticated." The client must authenticate itself to get the requested response.
"403 Forbidden" - The request contained valid data, but the server is refusing the action due to insufficient permissions or prohibited actions.
"500 Internal Server Error" - The server encountered a situation it doesn't know how to handle.
"503 Service Unavailable" - The server isn't ready to handle the request.



Instructions
Clone the repository or download and unzip the source repository.
Create the necessary files in your IDE and write the code.
Download the required Node.js modules and install dependencies. Start the server using the command npm start. Use Postman to test the APIs.
Check the database after each API call to see the status.
Verify that the returned HTTP status codes match the requirements.
Testing the Service
To confirm that the service is up and running, perform the following checks:

Access http://localhost:3000/healthz/ in your browser, where you should see "200 OK."

Access http://localhost:3000/v1/assignments/self, and you should receive a "204 No Content" response.

Access http://localhost:3000/v1/assignments/self using Postman, and again, you should receive a "204 No Content" response.
