
# Job Monitor with Intelligence

This project has been transformed from "World Monitor" to "Job Monitor".

## Features

1.  **Job Monitoring Dashboard**:
    - Tracks new job postings (Currently simulated polling every 10 minutes).
    - Status tracking (New, Applied, Rejected, etc.).

2.  **Resume Intelligence**:
    - AI-powered job description analysis (using `@xenova/transformers` locally).
    - Tailoring suggestions based on job keywords.

3.  **Risk Analysis**:
    - Monitors "Days Since Last Role".
    - Market Stability metrics.

4.  **Preparation**:
    - Interview checklist and task manager.

## How to Run

1.  `npm install` (if not done capabilities).
2.  `npm run dev`
3.  Open `http://localhost:5173`.

## Architecture

- **`src/services/job-monitor.ts`**: Core service for job fetching and AI analysis.
- **`src/components/jobs/`**: UI Components for the dashboard.
- **`src/App.ts`**: Main entry point wiring the dashboard.

## Note on AI
The project uses `@xenova/transformers` for local inference. The first time you run it, it may download the model (approx 40MB).
