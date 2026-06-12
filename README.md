# Estante Viva — Application Prototype

A book-lending web application. Users can browse books, borrow them, and track their loans.

## Structure

```
Application-Prototype/
├── back-end/       # Bun + TypeScript REST API
├── front-end/      # Vue 3 + Vite SPA
└── docs/           # Prototype diagrams
```

### Back-end (`back-end/`)

- Runtime: [Bun](https://bun.sh)
- Database: SQLite (`Estante_Vive.sqlite`)
- Port: `3000`

Layered as `src/repository/` → `src/service/` → `src/index.ts` (router).

| Endpoint | Methods |
|---|---|
| `/login` | POST |
| `/users` | GET, POST |
| `/users/:id` | GET |
| `/books` | GET, POST |
| `/books/:id` | GET |
| `/loans` | GET, POST |
| `/loans/:id` | GET, PATCH |

### Front-end (`front-end/`)

- Framework: Vue 3 + Vue Router
- Build tool: Vite
- Styling: [PicoCSS](https://picocss.com)
- Port: `5173` (dev)

Views: `LoginView`, `SignUpView`, `LibraryView`, `ProfileView`.

## Getting started

```bash
# Back-end
cd back-end
bun run dev

# Front-end (separate terminal)
cd front-end
bun install
bun run dev
```

## Minimal architecture

[mermaid diagram](https://mermaid.live/edit#pako:eNp9VFGTmjAQ_ivMPp0z6olwKDx0ppzt9YFOr0HuodCHKDlN1cQJ0NY6_veGBFSEOx7Y3XzJt9_uBo6w5CkBDwxjJfB-bcxnCTPUkxULvfRZcJYTlsYJKHcgfePupSDDX1kvgZ_1gfIJ-IqyWL1fKPnTwEK6YtE-1qaFBnQhsDjElW3hz4K_0i2JK9vCnwos0hjxIifab-Ym4jddkiyuHSPAByLknhaHMRh80HW8AWmB3WClrit1N28D1a15-3A7cwO_SS7HdCnvPE0fLzd6mKWnZ-kX7HaQURhHGRF1ggbmh7HP-aYTC0I5fcw6sQhpTkT2vEmINGELCJBmq4CmQFVzhJrK1KKPmpJ099D7jZn5sifh94Dm5LYXUnQW3xWl6TWFS9USWZSmd_MhYCaRbWl6N9IVptWXlN2Qou5UfDVzI4Hnb-HcuN-qe5UwHSmlMnr6VAf3Hk0T0DnDbiK1WVVy5qmjC3TF47_Ho-o-85yjj_PHL1V4xRSEl-Ii1G6Mj9odCVD1PUkq6MNK0BS8XBSkDzsidrgM4VjuTiBfk52cqSfdFItNAgk7yTN7zH5wvquPCV6s1uC94m0mo2Kf4pzMKJaXY3deFXIQRDzyguXg2ZOpIgHvCH9l6Axdc-y4ztSaWpOpO3L6cADPdKdDxzUfTGvkmA9jy7ZPffin8o6Grm3bI2fiTsbWyLJMuw8kpTkXX_VPWf2bT_8BMkScAg)
