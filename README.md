# Tablemark - Restaurant Rating and Review Platform

A MERN application where customers discover restaurants and leave ratings and reviews, restaurant owners manage their listing and see feedback, and administrators manage the whole platform.

- **Backend:** Node.js, Express, MongoDB with Mongoose, JWT, bcryptjs
- **Frontend:** React 18 (Vite), React Router, plain CSS

## Project structure

```
restaurant-platform/
├── server/
│   ├── .env.example
│   └── src/
│       ├── config/        db connection
│       ├── models/        User, Restaurant, Review (Mongoose schemas)
│       ├── middleware/    auth (JWT + roles + ObjectId checks), error handler
│       ├── controllers/   auth, restaurants, reviews, admin
│       ├── routes/        auth, restaurants, reviews, owner, admin
│       ├── utils/         validators, rating aggregation helpers, ApiError
│       ├── seed/seed.js   creates the 3 sample login accounts
│       ├── app.js
│       └── server.js
├── client/
│   ├── .env.example
│   └── src/
│       ├── components/    Navbar, Stars, RatingDistribution, shared UI
│       ├── pages/         public, owner and admin screens
│       ├── api.js         fetch wrapper (attaches JWT, normalises errors)
│       ├── auth.jsx       auth context
│       └── styles.css
└── docs/Tablemark.postman_collection.json
```

## Setup

**Prerequisites:** Node.js 18+ and a running MongoDB (local, or an Atlas connection string).

### Get the code

```bash
git clone https://github.com/pavanteja78/Restaurant-Rating-and-Review-Platform.git
cd Restaurant-Rating-and-Review-Platform
```

Prerequisites: Node.js 18+ and a running MongoDB (local, or an Atlas connection string).

git clone https://github.com/pavanteja78/Restaurant-Rating-and-Review-Platform

### 1. API

```bash
cd server
npm install
cp .env.example .env      # then edit MONGO_URI and JWT_SECRET
npm run seed              
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

In development Vite proxies `/api` to `http://localhost:5000`, so no frontend env file is needed. For a production build set `VITE_API_URL` (see `client/.env.example`) and run `npm run build`.

## Sample login credentials (created by `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@tablemark.com | Admin@1234 |
| Restaurant owner | owner@tablemark.com | Owner@1234 |
| Customer | customer@tablemark.com | Customer@1234 |

`npm run seed` inserts only these three accounts (re-running it is safe). It does **not** insert restaurants or reviews: the application has no hard-coded or mock data, and everything shown comes from MongoDB.

### First steps after seeding

The seed creates only login accounts, so the app starts with no restaurants or reviews. Add them through the app:

1. Log in as the administrator (`admin@tablemark.com`) and open **Manage restaurants**.
2. Click **Add restaurant**, fill in the name, location and cuisine, and in the **Owner** field select the seeded owner account, `Omar Owner (owner@tablemark.com)`.
3. Log out and log in as the owner (`owner@tablemark.com`). The **My restaurant** page now shows the restaurant you created.
4. Log in or register as a customer, search for the restaurant, then rate and review it. Go back to the owner and admin accounts to see the review appear.

## Database design

```
users        { name, email (unique), password (bcrypt hash, select:false), role: admin|customer|owner, isActive, timestamps }
restaurants  { name, location, cuisine, address, description, phone, openingHours, owner -> users (nullable), timestamps }
reviews      { customer -> users, restaurant -> restaurants, rating 1..5 (integer), comment, timestamps }
```

Relationships and indexes:

- `reviews.customer` and `reviews.restaurant` are ObjectId references (`ref`), populated where names are needed.
- **Unique compound index `{ customer: 1, restaurant: 1 }`** on reviews enforces "one review per customer per restaurant" in the database. The API checks first and returns a friendly 409; a race between two simultaneous requests hits the index (E11000) and is also mapped to 409.
- Unique index on `users.email`.
- Partial unique index on `restaurants.owner` so an owner can have only one restaurant while many restaurants can be unowned.
- Indexes on restaurant `name`, `location`, `cuisine` support search and filters.

## Rating calculations (MongoDB aggregation)

- **Per-restaurant average and count:** `restaurantPipeline` in `server/src/utils/ratings.js` uses `$lookup` on reviews with `$avg`, `$size` and `$round` to return `averageRating` (null when there are no reviews, shown as "No ratings yet"), `reviewCount`, and `myRating` for the signed-in customer.
- **Rating distribution:** `getDistribution` runs `$match` then `$group` by rating and fills missing star levels with 0. It powers the breakdown on the restaurant page, the owner dashboard (per restaurant) and the admin dashboard (platform-wide).

## API overview

All paths are prefixed with `/api`. "Auth" means `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | /auth/register | public | Register a customer |
| POST | /auth/login | public | Log in, receive JWT |
| GET | /auth/me | any user | Current user |
| GET | /restaurants?search=&location=&cuisine=&sort=&page=&limit= | public (token adds `myRating`) | Search, filter, sort, paginate (server-side) |
| GET | /restaurants/filters | public | Distinct locations and cuisines |
| GET | /restaurants/:id | public | Detail, stats, distribution, own review |
| GET | /restaurants/:id/distribution | public | Rating distribution |
| GET | /restaurants/:id/reviews | public | Paginated reviews |
| POST | /restaurants/:id/reviews | customer | Create review (409 if one already exists) |
| PUT | /reviews/:id | customer (own review) | Update review |
| DELETE | /reviews/:id | customer (own) or admin (any) | Delete review |
| GET | /owner/restaurant | owner | Own restaurant, stats, distribution |
| GET | /owner/reviews | owner | Reviews with the customers who wrote them |
| PUT | /restaurants/:id | owner (own, limited fields) or admin | Update restaurant |
| POST | /restaurants | admin | Create restaurant |
| PUT | /restaurants/:id/owner | admin | Assign or unassign an owner |
| DELETE | /restaurants/:id | admin | Delete restaurant and its reviews |
| GET | /admin/stats | admin | Totals, platform average, distribution |
| GET/POST | /admin/users | admin | List/search/filter users; create any role (incl. owners) |
| PUT/DELETE | /admin/users/:id | admin | Edit role/status/details; delete user |
| GET | /admin/reviews?search=&rating= | admin | Search and filter all reviews |

### Status codes used

`200` OK, `201` created, `400` validation / malformed ID / invalid JSON, `401` missing or invalid token or bad credentials, `403` authenticated but not allowed (wrong role, someone else's review or restaurant, deactivated account), `404` not found, `409` duplicate (email, review, owner already assigned), `500` unexpected error. Error bodies look like `{ "message": "You have already reviewed this restaurant...", "errors": { "field": "reason" } }`.

## Security and validation

- Passwords are hashed with bcryptjs in a Mongoose `pre('save')` hook and are excluded from queries by default (`select: false`). Plain text is never stored or returned.
- JWTs are verified by `authenticate` on every protected route. The user is re-loaded from the database on each request, so deleted or deactivated accounts lose access immediately and the role is never trusted from the token alone.
- Authorization is enforced in Express: `authorize(...roles)` on routes plus ownership checks in controllers (customers can only edit/delete their own reviews; owners can only edit their own restaurant and only the permitted fields: location, cuisine, address, description, phone, opening hours). Hiding buttons in React is only a convenience.
- Public registration always creates a `customer`; the role field is ignored. Owners and admins are created by an administrator.
- Backend validation covers required fields, email format and uniqueness, password strength (8-16 chars with upper, lower, number, special), rating (whole number 1-5 as a JSON number, rejecting 0, 6, -1, 3.5, empty and non-numeric values), review text length (5-1000), and ObjectId format on every `:id` param. The React forms mirror these rules for quick feedback.
- Search input is regex-escaped before it reaches MongoDB.

## Testing the API

Import `docs/Tablemark.postman_collection.json` into Postman (Bruno can import it too). With the API running and `npm run seed` done, run the whole collection in order using the Collection Runner.

- Folder 1 logs in as each role, registers a second customer and creates its own test restaurants, so no data needs to exist beforehand.
- Every request asserts its expected status code (200, 201, 400, 401, 403, 404, 409), so the runner shows pass or fail.
- Folder 6 deletes the test restaurants and users it created.

## Notes and decisions

- One restaurant per owner (enforced by a unique index), matching "view their restaurant" in the brief.
- Deleting a user deletes their reviews and frees any restaurant they owned; deleting a restaurant deletes its reviews.
- Admins can deactivate an account instead of deleting it.
