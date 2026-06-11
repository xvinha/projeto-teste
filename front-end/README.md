# Estante Viva — Front-end

Vue 3 SPA for the Estante Viva shared library system.

## Stack

- [Vue 3](https://vuejs.org) (Composition API + `<script setup>`)
- [Vue Router 5](https://router.vuejs.org)
- [Vite 8](https://vite.dev)
- [Pico CSS](https://picocss.com) — classless base styles
- TypeScript
- Bun (package manager and dev runner)

## Getting started

```bash
bun install
bun dev        # dev server at http://localhost:5173
bun run build  # type-check + production build → dist/
bun preview    # preview the production build locally
bun lint       # run oxlint + eslint with auto-fix
bun format     # run prettier on src/
```

**Required environment variable**

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Back-end base URL |

Create a `.env.local` file to override:

```
VITE_API_BASE_URL=http://localhost:3000
```

## Project structure

```
src/
├── main.ts                         # App entry point
├── App.vue                         # Root component (router outlet)
├── style.css                       # Global styles
│
├── types/
│   └── index.ts                    # Shared TypeScript interfaces
│
├── utils/
│   └── index.ts                    # Date formatting, label helpers, email validator
│
├── router/
│   ├── index.ts                    # Route definitions
│   └── guards.ts                   # Navigation guard (auth check)
│
├── services/
│   ├── api.ts                      # Base HTTP client (fetch wrapper)
│   ├── auth.ts                     # Auth state and login/logout logic
│   └── index.ts                    # userService and bookService
│
├── components/
│   └── common/
│       ├── AuthenticatedLayout.vue # Layout wrapper for protected pages
│       └── Header.vue              # Top nav with route links and logout
│
└── views/
    ├── LoginView.vue               # Login form (unauthenticated)
    ├── ProfileView.vue             # User profile and donated books
    └── LibraryView.vue             # Full book catalogue with filters
```

## Routes

| Path | Name | Auth required | View |
|---|---|---|---|
| `/login` | `login` | No | `LoginView` |
| `/dashboard` | `dashboard` | Yes | `ProfileView` |
| `/profile` | `profile` | Yes | `ProfileView` |
| `/library` | `library` | Yes | `LibraryView` |
| `/` | — | — | redirects to `/dashboard` |

The navigation guard in `router/guards.ts` redirects unauthenticated users to `/login` and redirects authenticated users away from `/login`.

## Services

### `services/api.ts` — HTTP client

Thin wrapper around `fetch`. All methods return typed promises. Base URL is read from `VITE_API_BASE_URL`.

```ts
apiClient.get<T>(endpoint)
apiClient.post<T>(endpoint, data)
apiClient.put<T>(endpoint, data)
apiClient.delete<T>(endpoint)
```

### `services/auth.ts` — Auth state

Module-level reactive state (shared across all components via `useAuth()`).

Because the back-end has no authentication endpoint, login works by calling `GET /users` and finding a matching email + password. The matched user object is stored in `localStorage`.

```ts
const { user, isAuthenticated, isLoading, error, login, logout, loadStoredUser } = useAuth()
```

### `services/index.ts` — Domain services

```ts
// Users
userService.getUser(id)            // GET /users/:id
userService.getAllUsers()           // GET /users

// Books
bookService.getAllBooks()           // GET /books
bookService.getBook(id)            // GET /books/:id
bookService.createBook(data)       // POST /books

// Loans
loanService.getAllLoans()                   // GET /loans
loanService.getUserLoans(userId)            // GET /loans → filtered by user_id
loanService.borrowBook(userId, bookId)      // POST /loans
loanService.returnBook(loanId)              // PATCH /loans/:id
```

## Types

Defined in `src/types/index.ts`, mirroring the back-end schema.

```ts
User    { id, name, email, password?, role, points, institution, created_at }
Book    { id, title, author, release_date, edition?, status, created_at }
Loan    { id, user_id, book_id, return_date, returned_at }
Comment { id, user_id, content, created_at }
```

Valid `User.role` values: `student` · `teacher` · `donator` · `admin`  
Valid `Book.status` values: `available` · `lent`
