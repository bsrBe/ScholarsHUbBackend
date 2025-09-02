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

#### 2. Create a New Article

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

#### 3. Get Article by ID

- **Endpoint:** `GET /articles/:id`
- **Access:** Public
- **Description:** Retrieves a single article by its ID.
- **Success Response:**
  - **Code:** 200 OK
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

#### 2. Create a New FAQ

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

#### 3. Get FAQ by ID

- **Endpoint:** `GET /faqs/:id`
- **Access:** Public
- **Description:** Retrieves a single FAQ by its ID.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "question": "...", "answer": "...", "callbackKey": "...", "createdAt": "...", "updatedAt": "..." }`

#### 4. Get FAQ by Callback Key

- **Endpoint:** `GET /faqs/callback/:callbackKey`
- **Access:** Public
- **Description:** Retrieves a single FAQ by its `callbackKey`.
- **Success Response:**
  - **Code:** 200 OK
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

#### 2. Get All Forms

- **Endpoint:** `GET /forms/allForms`
- **Access:** Private (Admin only - *Note: currently not protected*)
- **Description:** Retrieves a list of all form submissions.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `[{ "_id": "...", "full_name": "...", ... }]`

#### 3. Get Form by ID

- **Endpoint:** `GET /forms/forms/:id`
- **Access:** Private (Admin only - *Note: currently not protected*)
- **Description:** Retrieves a single form submission by its ID.
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** `{ "_id": "...", "full_name": "...", ... }`

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
