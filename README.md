# La Liga 2024 Statistics (API-Football + Node.js)

Production-ready Node.js application that fetches La Liga 2024 fixtures from API-Football, collects team statistics for finished matches, and calculates:

- Average yellow cards by team
- Total corners by team

It prints both rankings in console tables and exports an Excel report.

## Project Structure

```text
project/
├── src/
│   ├── services/
│   │   └── footballApi.js
│   ├── utils/
│   │   └── delay.js
│   ├── calculations/
│   │   └── statistics.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## Requirements

- Node.js 18+
- API-Football API key

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
API_FOOTBALL_KEY=your_api_key_here
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
REQUEST_DELAY_MS=350
```

> `REQUEST_DELAY_MS` helps respect API rate limits.

## Usage

Run once:

```bash
npm start
```

Run in dev mode (auto-restart):

```bash
npm run dev
```

## Output

1. Console output:
   - `Average Yellow Cards by Team` table
   - `Total Corners by Team` table

2. Excel file:
   - `la-liga-2024-statistics.xlsx`
   - Sheet 1: `Average Yellow Cards`
   - Sheet 2: `Total Corners`

## Notes on Data Quality

- Only finished fixtures are processed (`FT`, `AET`, `PEN`).
- Missing statistics values are safely treated as `0`.
- Calculations use `Map` for clean and efficient team aggregation.
- API errors are handled with readable messages and graceful exit.
