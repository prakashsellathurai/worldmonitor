# Job Monitor Transformation

## Objective
Transform the existing "World Monitor" application into a "Job Monitor with Intelligence". The new application will focus on tracking job postings, managing resumes, providing intelligence/analytics on opportunities, and monitoring career risks.

## Features
1.  **Real-time Job Tracking**: 
    - Monitor specified company websites/feeds for new roles.
    - Polling interval: 10 minutes.
    - Visual indicators for "New" roles.
2.  **Resume Intelligence**:
    - Maintain specific resumes for each job post (or tailored versions).
    - Match analysis (Job vs. Resume score).
3.  **Risk Analysis**:
    - "Days till last job" tracker.
    - Market stability metrics.
4.  **Preparation Dashboard**:
    - Application status tracking.
    - Interview preparation checklist.
5.  **Dashboard UI**:
    - Replace the global map view with a job-centric dashboard (kanban/list + analytics charts).
    - Optional: Keep a map view for job locations.

## Granularity
- Updates up to the last 10 minutes.

## Technical Approach
- **Frontend**: Vite + TypeScript (modify existing).
- **Desktop Runtime**: Tauri (keep existing for FS access/notifications).
- **Backend/Service**: Client-side polling + Local Storage / Tauri FS.
- **AI**: `@xenova/transformers` (existing) for local text analysis.
