# AutoApply AI - Project Rules & Guidelines

This directory contains the rules and behavioral constraints for the **AutoApply AI** workspace. Any AI agent collaborating on this project should adhere to the following specifications:

## 1. Execution Environment
- **Local Dev Server**: Bypasses missing Node/Python environments by running a native PowerShell HTTP listener ([server.ps1](file:///C:/Users/HOME/.gemini/antigravity/scratch/job-tailor-applicator/server.ps1)) on port 3000. Bypasses execution restrictions using `-ExecutionPolicy Bypass`.
- **Client-Side Libraries**: Avoid npm dependencies. Use bundled or locally loaded assets like Mammoth.js and PDF.js for parsing files.

## 2. Core Functional Requirements
- **Scraper Playback Controls**: The background monitor starts in `stopped` status on load and requires manual activation. The header Play/Pause/Stop controllers toggle state and audio feedback.
- **Target Title Filter**: Matches must align with comma-separated target titles in the Resume Manager. Unmatched roles are skipped in logs.
- **Active Cache (Max 5)**: Store up to 5 tailored resumes. Evict the oldest on overflow, and delete the resume from the cache immediately upon application success.
- **Email Receipts**: Launch native email drafts programmatically on application completion using the email in settings (defaults to `willieekams@aol.com`).
- **24-Hour Reset Cycle**: Clear active cache, applied history, and metrics when 24 hours have elapsed.

## 3. Tech Stack & Styling
- Pure HTML, CSS (no TailwindCSS), and Vanilla JavaScript.
- Maintain Obsidian-themed dark mode glassmorphic grids, custom scrollbars, and keyframed flickering pulse status indicators.
- **Theme Toggle Mode**: Supports toggling between Dark Mode and Light Mode using variable values defined in styles.css under `:root` and `body.light-theme` with custom radial gradients. Persist the selection dynamically in local storage.
