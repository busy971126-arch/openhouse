# OpenHouse MVP Routes

## Public

| URL | Screen | Auth |
|-----|--------|------|
| `/` | Home | — |
| `/login` | Login | guest |
| `/login/recover` | Find email / reset password email | guest |
| `/login/reset-password` | Set new password (email link) | guest |
| `/signup` | Sign up | guest |
| `/events` | Event list + filters (type, region, sport, date) | — |
| `/events/[id]` | Event detail, apply, announcements | — |

## Member (login required)

| URL | Screen |
|-----|--------|
| `/my` | My page hub |
| `/my/profile` | Profile view (+ gym & schedule ops if owner) |
| `/my/profile/edit` | Profile edit |
| `/my/registrations` | My applications |
| `/my/notifications` | In-app notifications |
| `/my/settings` | Settings |
| `/my/settings/password` | Change password (logged in) |
| `/my/terms` | Terms (stub) |
| `/my/withdraw` | Account withdrawal (delete auth user + cascaded data) |
| `/my/wishlist` | Wishlist (V2 stub) |

## Operator (gym owner)

| URL | Screen |
|-----|--------|
| `/my/profile` | Gym info, schedule ops, participant mgmt entry |
| `/events/new` | Create event |
| `/events/[id]/edit` | Edit event |
| `/events/[id]/participants` | Participant management |
| `/gym/new` | Register gym |
| `/gym/[id]/edit` | Edit gym |
| `/my/operator` | Redirect → `/my/profile` |
| `/dashboard` | Redirect → `/my/profile` |

## Filters (`/events`)

| Query | Description |
|-------|-------------|
| `type` | open_mat, seminar, competition |
| `region` | Partial match |
| `sport` | Partial match |
| `date` | Exact date |
| `past=1` | Include ended events |

## Mobile-first UI

- Event cards: type, sport, region, date, recruitment status badge
- My page: single-account hub; operator menu if gym owner
- Operator dashboard: event status, over-capacity waitlist warning
