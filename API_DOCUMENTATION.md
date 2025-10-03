# API Documentation

This document provides the necessary information to integrate a frontend application with the backend API.

## Base URL

The base URL for all API endpoints is: `http://localhost:5000/api`

---

## Articles API

The Articles API allows for the management of knowledge base articles.

### Endpoints

#### 1. Get All Articles

- **Endpoint:** `GET /articles`
- **Access:** Public
- **Description:** Retrieves a list of all articles.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `[{ "_id": "...", "title": "...", "content": "...", "category": "...", "createdAt": "...", "updatedAt": "..." }]`

#### 2. Get Article by ID

- **Endpoint:** `GET /articles/:id`
- **Access:** Public
- **Description:** Retrieves a single article by its ID.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "title": "...", "content": "...", "category": "...", "createdAt": "...", "updatedAt": "..." }`

#### 3. Create a New Article

- **Endpoint:** `POST /articles`
- **Access:** Private (Admin only)
- **Description:** Creates a new article.
- **Request Body:**
  ```json
  {
    "title": "Your Article Title",
    "content": "The content of the article.",
    "category": "education"
  }
  ```
- **Success Response:**
  - **Code:** 201 Created
  - **Content:** `{ "_id": "...", "title": "...", "content": "...", "category": "...", "createdAt": "...", "updatedAt": "..." }`

#### 4. Update an Article

- **Endpoint:** `PUT /articles/:id`
- **Access:** Private (Admin only)
- **Description:** Updates an existing article.
- **Request Body:**
  ```json
  {
    "title": "Updated Title",
    "content": "Updated content.",
    "category": "scholarship"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "title": "...", "content": "...", "category": "...", "createdAt": "...", "updatedAt": "..." }`

#### 5. Delete an Article

- **Endpoint:** `DELETE /articles/:id`
- **Access:** Private (Admin only)
- **Description:** Deletes an article by its ID.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "message": "Article removed" }`

---

## FAQs API

The FAQs API is used to manage Frequently Asked Questions.

### Endpoints

#### 1. Get All FAQs

- **Endpoint:** `GET /faqs`
- **Access:** Public
- **Description:** Retrieves a list of all FAQs.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `[{ "_id": "...", "question": "...", "answer": "...", "callbackKey": "...", "createdAt": "...", "updatedAt": "..." }]`

#### 2. Get FAQ by ID

- **Endpoint:** `GET /faqs/:id`
- **Access:** Public
- **Description:** Retrieves a single FAQ by its ID.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "question": "...", "answer": "...", "callbackKey": "...", "createdAt": "...", "updatedAt": "..." }`

#### 3. Get FAQ by Callback Key

- **Endpoint:** `GET /faqs/callback/:callbackKey`
- **Access:** Public
- **Description:** Retrieves a single FAQ by its `callbackKey`.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "question": "...", "answer": "...", "callbackKey": "...", "createdAt": "...", "updatedAt": "..." }`

#### 4. Create a New FAQ

- **Endpoint:** `POST /faqs`
- **Access:** Private (Admin only)
- **Description:** Creates a new FAQ. The `callbackKey` is automatically generated from the question.
- **Request Body:**
  ```json
  {
    "question": "How do I apply?",
    "answer": "You can apply through our website."
  }
  ```
- **Success Response:**
  - **Code:** 201 Created
  - **Content:** `{ "_id": "...", "question": "...", "answer": "...", "callbackKey": "...", "createdAt": "...", "updatedAt": "..." }`

#### 5. Update an FAQ

- **Endpoint:** `PUT /faqs/:id`
- **Access:** Private (Admin only)
- **Description:** Updates an existing FAQ.
- **Request Body:**
  ```json
  {
    "question": "Updated question?",
    "answer": "Updated answer."
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "question": "...", "answer": "...", "callbackKey": "...", "createdAt": "...", "updatedAt": "..." }`

#### 6. Delete an FAQ

- **Endpoint:** `DELETE /faqs/:id`
- **Access:** Private (Admin only)
- **Description:** Deletes an FAQ by its ID.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "message": "FAQ removed" }`

---

## User Forms API

The User Forms API handles submissions from users.

### Endpoints

#### 1. Submit a New Form

- **Endpoint:** `POST /forms/submit`
- **Access:** Public
- **Description:** Allows a user to submit a form with their information and a document. This is a `multipart/form-data` request.
- **Request Body:**
  - `full_name` (String, required)
  - `email` (String, required)
  - `phone_number` (String, required)
  - `telegram_user_name` (String)
  - `educational_status` (String, required)
  - `destination_country` (String, required)
  - `additional_information` (String)
  - `file` (File, required) - The user's document.
- **Success Response:**
  - **Code:** 201 Created
  - **Content:** `{ "message": "Form submitted successfully", "data": { ... } }`

#### 2. Get User's Own Forms

- **Endpoint:** `GET /forms/my-forms`
- **Access:** Private (User)
- **Description:** Retrieves all form submissions by the authenticated user.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `[{ "_id": "...", "full_name": "...", "status": "...", "admin_response": "...", ... }]`

#### 3. Get All Forms (Admin)

- **Endpoint:** `GET /forms`
- **Access:** Private (Admin only)
- **Description:** Retrieves a list of all form submissions with search and filtering capabilities.
- **Query Parameters:**
  - `search` (String, optional) - Search by name, email, or phone
  - `status` (String, optional) - Filter by status (pending, in_review, approved, rejected)
  - `country` (String, optional) - Filter by destination country
  - `educationStatus` (String, optional) - Filter by educational status
  - `page` (Number, optional) - Page number for pagination (default: 1)
  - `limit` (Number, optional) - Number of items per page (default: 10)
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** 
    ```json
    {
      "forms": [{ "_id": "...", "full_name": "...", ... }],
      "pagination": {
        "totalPages": 5,
        "currentPage": 1,
        "total": 50,
        "hasNext": true,
        "hasPrev": false
      }
    }
    ```

#### 4. Get Form by ID (Admin)

- **Endpoint:** `GET /forms/:id`
- **Access:** Private (Admin only)
- **Description:** Retrieves a single form submission by its ID.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "full_name": "...", ... }`

#### 5. Respond to Form (Admin)

- **Endpoint:** `PUT /forms/:id/respond`
- **Access:** Private (Admin only)
- **Description:** Allows admin to respond to a form submission and update its status.
- **Request Body:**
  ```json
  {
    "response": "Thank you for your application. We have reviewed your documents and they look good.",
    "status": "approved"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "message": "Form updated successfully and user notified", "data": { ... } }`

#### 6. Download Document (Admin)

- **Endpoint:** `GET /forms/:id/download`
- **Access:** Private (Admin only)
- **Description:** Downloads the document associated with a form submission.
- **Success Response:**
  - **Code:** 302 Redirect
  - **Description:** Redirects to the document URL

#### 7. Get Dashboard Statistics (Admin)

- **Endpoint:** `GET /forms/dashboard-stats`
- **Access:** Private (Admin only)
- **Description:** Retrieves comprehensive dashboard statistics including form counts and analytics.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "overview": {
        "totalForms": 150,
        "pendingForms": 25,
        "inReviewForms": 10,
        "approvedForms": 100,
        "rejectedForms": 15
      },
      "recentForms": [...],
      "formsByCountry": [...],
      "formsByEducation": [...]
    }
    ```

---

## Authentication API

The Authentication API handles user registration, login, and other authentication-related actions.

### Endpoints

#### 1. Register a New User

- **Endpoint:** `POST /auth/register`
- **Access:** Public
- **Description:** Creates a new user account.
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "yourpassword",
    "role": "user",
    "profileImageUrl": "http://example.com/image.jpg"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "user": { ... }, "token": "..." }`
  - **Note:** A cookie named `cookieToken` is also set in the response.

#### 2. Login

- **Endpoint:** `POST /auth/login`
- **Access:** Public
- **Description:** Authenticates a user and returns a JWT.
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "yourpassword"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "user": { ... }, "token": "..." }`
  - **Note:** A cookie named `cookieToken` is also set in the response.

#### 3. Get Current User

- **Endpoint:** `GET /auth/me`
- **Access:** Private
- **Description:** Retrieves the profile of the currently authenticated user.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "name": "...", "email": "...", ... }`

#### 4. Forgot Password

- **Endpoint:** `POST /auth/forgotPassword`
- **Access:** Private
- **Description:** Sends a password reset link to the user's email.
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "success": true, "msg": "Email sent successfully" }`

#### 5. Reset Password

- **Endpoint:** `PUT /auth/resetPassword/:token`
- **Access:** Public
- **Description:** Resets the user's password using the token from the reset email.
- **Request Body:**
  ```json
  {
    "password": "newpassword"
  }
  ```
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "user": { ... }, "token": "..." }`

#### 6. Confirm Email

- **Endpoint:** `GET /auth/confirmEmail/:token`
- **Access:** Public
- **Description:** Confirms the user's email address using the token from the confirmation email.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "msg": "Email confirmed successfully. You can now log in." }`

---

## Form Status System

The system now includes a comprehensive form status tracking system:

### Status Types:
- **pending**: Initial status when form is submitted
- **in_review**: Form is being reviewed by admin
- **approved**: Form has been approved
- **rejected**: Form has been rejected

### Admin Response System:
- Admins can respond to form submissions with custom messages
- Users receive email notifications when their form status changes
- All responses are stored and visible in the user dashboard

### User Dashboard Integration:
- Users can view all their submitted forms
- Users can see the current status of each form
- Users can read admin responses
- Real-time updates when admins respond to forms

### Key Features:
1. **Status Tracking**: Every form submission has a status that can be updated by admins
2. **Admin Responses**: Admins can provide detailed responses to form submissions
3. **Email Notifications**: Users automatically receive email notifications when their form status changes
4. **User Dashboard**: Users can track their application progress in their personal dashboard
5. **Search & Filtering**: Admins can search and filter forms by various criteria
6. **Analytics**: Comprehensive dashboard statistics for admins
7. **Document Management**: Secure document upload and download functionality
