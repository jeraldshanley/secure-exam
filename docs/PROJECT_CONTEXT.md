\# Secure Exam System — Project Context



This file is static context. Paste it into your IDE agent's persistent context

(e.g. `.cursorrules`, `AGENTS.md`, or a pinned system prompt) so it does not

need to be repeated on every task. Task-specific prompts are provided separately.



\## Goal



A secure examination ecosystem: a dedicated desktop exam client, a backend API,

and a security monitoring layer. Objective: conduct exams in a controlled

environment with security, scalability, and auditability. Built by a 3-person

team, developed incrementally with reviewable, production-quality code — not

throwaway demo code.



\## Architecture



Admin Portal ─┐

&#x20;             ├─> API Gateway ─> Backend Services ─> PostgreSQL / Redis / Object Storage

Exam Client ──┘



Backend is modular: auth, users, exams, questions, attempts (submissions), monitoring.



Core principle: never trust the client. The exam client enforces the

environment (fullscreen, focus, restricted navigation); the backend

independently validates every action. Security is defense-in-depth, not a

single mechanism.



\## Tech Stack



\- Desktop client: Tauri + React + TypeScript, Rust for native/system-level functionality

\- Backend: NestJS + TypeScript

\- Database: PostgreSQL (source of truth) via Prisma ORM

\- Cache/session: Redis

\- Auth: JWT, bcrypt password hashing

\- API: REST over HTTPS

\- Containerization: Docker

\- Testing: Jest / Playwright

\- Version control: Git + GitHub, monorepo layout



\## Repository Structure



secure-exam/

&#x20; apps/

&#x20;   exam-client/     (Tauri + React, not yet created)

&#x20;   admin-web/       (not yet created)

&#x20;   api/             (NestJS backend, in progress)

&#x20; packages/          (shared types/config, not yet created)

&#x20; infrastructure/

&#x20;   docker/

&#x20; docs/



\## Backend Conventions (apply to every module)



\- One folder per domain under src/: e.g. src/health/, src/auth/, src/exams/.

\- Each module has its own .module.ts, .controller.ts, .service.ts, and .spec.ts test file.

\- Controller → Service → Repository/DB. Controllers contain no business logic — only request handling and delegation.

\- Config loaded via @nestjs/config, ConfigModule set isGlobal: true.

\- Secrets live in .env (gitignored); .env.example documents required vars without real values.

\- Every new module needs at least a basic .spec.ts test before being considered done.



\## Core Data Models (target, not all implemented yet)



\- User: id, name, email, passwordHash, role

\- Exam: id, title, duration, status

\- Question: id, examId, questionText, options

\- Attempt: id, userId, examId, startedAt, submittedAt, status

\- Answer: id, attemptId, questionId, selectedOption

\- SecurityEvent: id, attemptId, eventType, timestamp, metadata



\## Current Status (update this section as work progresses)



\- Repo initialized, structured under apps/, packages/, infrastructure/, docs/

\- NestJS backend created at apps/api, confirmed running

\- ConfigModule wired in, .env / .env.example set up

\- HealthModule built (Controller → Service pattern), GET /health returns status/uptime

\- Fixed nested-git-repo issue, apps/api now properly tracked

\- Next up: PostgreSQL via Docker + Prisma, User model, first migration



\## Engineering Process (how every task should be done)



1\. Requirement stated clearly (one feature/module at a time — never "build everything").

2\. Acceptance criteria defined before code is written.

3\. Agent proposes a plan; human reviews the plan before implementation.

4\. Implementation happens in small, bounded diffs — no unrelated changes.

5\. Tests run and pass.

6\. Human reviews the diff.

7\. Commit with a clear conventional message (feat:, fix:, chore:).

8\. docs/ or this file updated if architecture/status changed.



\## Explicitly Out of Scope (for now)



Webcam proctoring, AI cheating detection, Kubernetes, advanced analytics,

anti-VM detection, admin portal polish. Focus is a correct, defensible core:

auth → exam → attempt → submission → persistence → basic security events.

