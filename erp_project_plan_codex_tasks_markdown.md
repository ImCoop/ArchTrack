# ArchTrack — Project Plan and Codex Task Breakdown

## Project Overview

Build ArchTrack, a modern, web-based ERP platform for a drafting and design company.

The system should support:

- Project management
- Customer management (CRM)
- Employee/task management
- File/document management
- Time tracking
- Quoting and invoicing
- Scheduling
- Email notifications and workflows
- Google Workspace integration (Gmail OAuth + notifications)
- Role-based permissions
- Dashboard analytics
- Internal communication/logging

The platform should be:

- Multi-user
- Browser-based
- Mobile responsive
- Secure
- Modular
- Scalable
- Self-hostable initially

---

# Recommended Tech Stack

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- React Query / TanStack Query
- Zustand or Context API
- Axios

## Backend

- Node.js
- Express.js
- TypeScript
- JWT Authentication
- Google OAuth 2.0
- REST API architecture

## Database

- InstantDB (primary)
- PostgreSQL-compatible modeling principles

## File Storage

- Local storage initially
- Abstracted storage provider for future S3/Azure support

## Authentication

- JWT
- Refresh tokens
- Google OAuth login
- Role-based authorization

## DevOps

- Docker
- Docker Compose
- GitHub Actions
- Nginx reverse proxy

---

# Core ERP Modules

## 1. Authentication & User Management

Features:

- Login/logout
- Password reset
- Google sign-in
- MFA-ready architecture
- Role permissions
- User profiles
- Department assignment

Roles:

- Admin
- Project Manager
- Designer
- Drafter
- Estimator
- Accounting
- Viewer

---

## 2. CRM Module

Features:

- Customer database
- Contacts
- Communication history
- Notes
- Project linking
- Quote history
- Email logging

---

## 3. Project Management Module

Features:

- Project creation
- Milestones
- Deadlines
- Status tracking
- Priority levels
- Assignments
- Gantt/timeline view
- Kanban board
- Attachments
- Internal comments

---

## 4. Task Management Module

Features:

- Task assignments
- Subtasks
- Due dates
- Notifications
- Time estimates
- Actual time logging
- Dependencies
- Task comments

---

## 5. File & Revision Management

Features:

- Drawing uploads
- PDF management
- Version control
- File locking/check-out
- Revision history
- Approval workflows
- Markups/comments

Supported File Types:

- DWG
- DXF
- PDF
- STEP
- DOCX
- XLSX
- ZIP

---

## 6. Time Tracking

Features:

- Clock in/out
- Manual time entries
- Billable vs non-billable
- Time by project
- Time approval workflows
- Productivity reports

---

## 7. Estimating & Quotes

Features:

- Quote generation
- Labor calculations
- Material tracking
- Revision tracking
- PDF export
- Approval status

---

## 8. Invoicing Module

Features:

- Invoice generation
- Tax calculations
- Payment tracking
- Export to PDF
- Customer statements
- Outstanding balance tracking

---

## 9. Scheduling Module

Features:

- Employee scheduling
- Resource planning
- Deadline calendar
- Shared calendars
- Project timeline planning

---

## 10. Reporting & Analytics

Features:

- Revenue dashboards
- Project profitability
- Employee utilization
- Task completion metrics
- Quote conversion metrics
- Export to CSV/PDF

---

## 11. Notification System

Features:

- In-app notifications
- Gmail notifications
- Assignment alerts
- Deadline reminders
- Mention/tag system
- Configurable notification preferences

---

# Google Integration Plan

## Gmail Integration

Features:

- OAuth sign-in
- Send notification emails
- Sync sent notifications
- Optional inbox linking
- Email templates
- Thread linking to projects

## Google APIs Required

- Google OAuth API
- Gmail API
- Google Calendar API (future)
- Google Drive API (future)

## OAuth Flow

1. User clicks Google Sign-In
2. Redirect to Google OAuth
3. Receive auth code
4. Exchange for tokens
5. Store encrypted refresh token
6. Use Gmail API for notifications

---

# Suggested System Architecture

## Frontend Structure

```text
/src
  /api
  /components
  /features
  /layouts
  /pages
  /routes
  /hooks
  /store
  /types
  /utils
```

## Backend Structure

```text
/server
  /src
    /config
    /controllers
    /middleware
    /models
    /routes
    /services
    /repositories
    /utils
    /jobs
```

---

# Database Design (High Level)

## Core Tables

### users

- id
- email
- password_hash
- first_name
- last_name
- role_id
- department_id
- google_id
- created_at

### roles

- id
- name

### customers

- id
- company_name
- billing_address
- phone
- email

### projects

- id
- customer_id
- project_name
- description
- status
- due_date
- created_by

### tasks

- id
- project_id
- assigned_to
- title
- description
- status
- priority
- due_date

### files

- id
- project_id
- file_name
- file_path
- revision
- uploaded_by

### time_entries

- id
- user_id
- project_id
- task_id
- hours
- billable

### quotes

- id
- customer_id
- project_id
- total
- status

### invoices

- id
- customer_id
- project_id
- total
- status
- due_date

### notifications

- id
- user_id
- type
- message
- read_status

---

# Security Requirements

## Must Implement

- JWT authentication
- Refresh token rotation
- Password hashing (bcrypt)
- CSRF protection
- Rate limiting
- File upload validation
- Audit logging
- Permission middleware
- HTTPS enforcement
- Secure cookie handling

---

# Development Phases

# Phase 1 — Foundation

Goals:

- Repository setup
- Docker environment
- Backend API foundation
- Frontend shell
- Authentication system
- Database setup

Deliverables:

- Login system
- User roles
- Base layout
- API framework

---

# Phase 2 — Core Operations

Goals:

- CRM
- Projects
- Tasks
- Notifications
- File management

Deliverables:

- Working ERP core
- Project workflow
- Assignment system

---

# Phase 3 — Business Operations

Goals:

- Quotes
- Invoices
- Time tracking
- Reporting

Deliverables:

- Financial workflows
- Reporting dashboards

---

# Phase 4 — Integrations & Scaling

Goals:

- Gmail integration
- Calendar sync
- Automation
- Background jobs
- Performance optimization

Deliverables:

- Email automation
- Production-ready deployment

---

# Codex Task Breakdown

# TASK 001 — Initialize Monorepo

## Objective

Create the base project structure.

## Requirements

- Setup frontend and backend folders
- Configure TypeScript
- Configure Docker Compose
- Configure ESLint and Prettier
- Create shared environment variable system

## Acceptance Criteria

- Frontend starts successfully
- Backend starts successfully
- Docker environment works

---

# TASK 002 — Create Authentication Backend

## Objective

Implement authentication APIs.

## Requirements

- JWT auth
- Refresh tokens
- Login route
- Register route
- Password hashing
- Auth middleware

## Acceptance Criteria

- User can register
- User can login
- Protected routes function

---

# TASK 003 — Create React Authentication UI

## Objective

Build login and registration pages.

## Requirements

- Login page
- Register page
- Protected routes
- Auth context/store
- Token persistence

## Acceptance Criteria

- User can authenticate
- Session persists on refresh

---

# TASK 004 — Implement Role-Based Permissions

## Objective

Create backend and frontend permission handling.

## Requirements

- Role middleware
- Permission guards
- Restricted UI routes

## Acceptance Criteria

- Unauthorized users blocked
- Roles function correctly

---

# TASK 005 — Build Main Application Layout

## Objective

Create the ERP shell.

## Requirements

- Sidebar navigation
- Top bar
- Responsive layout
- Dark/light theme support

## Acceptance Criteria

- Navigation works
- Layout responsive

---

# TASK 006 — Create User Management Module

## Objective

Build user administration.

## Requirements

- User CRUD
- Role assignment
- Department assignment
- User search/filter

## Acceptance Criteria

- Admin can manage users

---

# TASK 007 — Create CRM Module

## Objective

Build customer management system.

## Requirements

- Customer CRUD
- Contact management
- Customer notes
- Search/filter

## Acceptance Criteria

- Customers manageable through UI

---

# TASK 008 — Build Project Management Module

## Objective

Implement project workflows.

## Requirements

- Project CRUD
- Status management
- Assignments
- Milestones
- Attachments

## Acceptance Criteria

- Projects manageable end-to-end

---

# TASK 009 — Build Task Management System

## Objective

Implement task workflows.

## Requirements

- Task CRUD
- Assignment system
- Comments
- Priority handling
- Due dates

## Acceptance Criteria

- Tasks fully manageable

---

# TASK 010 — Create Notification Engine

## Objective

Implement notification services.

## Requirements

- In-app notifications
- Email queue
- Notification preferences
- Read/unread tracking

## Acceptance Criteria

- Notifications sent properly

---

# TASK 011 — Implement Google OAuth

## Objective

Allow Google authentication.

## Requirements

- Google OAuth flow
- Account linking
- Token storage
- Login integration

## Acceptance Criteria

- Users can login with Google

---

# TASK 012 — Implement Gmail Notification Service

## Objective

Send Gmail-based notifications.

## Requirements

- Gmail API integration
- Email templates
- Background sending queue
- Retry handling

## Acceptance Criteria

- Emails send successfully

---

# TASK 013 — Build File Management System

## Objective

Implement document workflows.

## Requirements

- File upload API
- File versioning
- Revision history
- File locking/check-out

## Acceptance Criteria

- Files securely uploaded and tracked

---

# TASK 014 — Build Time Tracking Module

## Objective

Implement employee time tracking.

## Requirements

- Time entries
- Running timer
- Reports
- Billable tracking

## Acceptance Criteria

- Time accurately tracked

---

# TASK 015 — Build Estimating System

## Objective

Implement quote generation.

## Requirements

- Quote builder
- Labor calculations
- PDF generation
- Approval workflow

## Acceptance Criteria

- Quotes generated successfully

---

# TASK 016 — Build Invoicing System

## Objective

Implement invoice workflows.

## Requirements

- Invoice generation
- Payment status tracking
- Tax handling
- PDF export

## Acceptance Criteria

- Invoices manageable

---

# TASK 017 — Build Reporting Dashboard

## Objective

Implement analytics and reporting.

## Requirements

- Revenue charts
- Productivity charts
- Project profitability
- Export tools

## Acceptance Criteria

- Reports render correctly

---

# TASK 018 — Build Audit Logging System

## Objective

Track critical system actions.

## Requirements

- Login logs
- File activity logs
- Project activity logs
- User action history

## Acceptance Criteria

- Logs searchable and retained

---

# TASK 019 — Add Background Job Processing

## Objective

Implement asynchronous processing.

## Requirements

- Job queue
- Email workers
- Scheduled reminders
- Retry logic

## Acceptance Criteria

- Jobs process reliably

---

# TASK 020 — Production Deployment

## Objective

Deploy production-ready environment.

## Requirements

- Docker production setup
- Nginx reverse proxy
- HTTPS
- CI/CD pipeline
- Backup strategy

## Acceptance Criteria

- Production deployment operational

---

# Recommended Future Enhancements

## Future Modules

- Mobile app
- CAD preview rendering
- AI-assisted estimating
- AI project summaries
- OCR document ingestion
- E-signature workflows
- Client portal
- Vendor portal
- Inventory tracking
- Purchasing system
- Payroll integration

---

# Suggested Development Order

1. Authentication
2. Layout/UI shell
3. User management
4. CRM
5. Projects
6. Tasks
7. Notifications
8. File management
9. Time tracking
10. Quotes
11. Invoices
12. Reporting
13. Google integrations
14. Deployment hardening

---

# Important Engineering Recommendations

## Keep Modules Isolated

Each ERP module should:

- Have its own API routes
- Have its own services
- Have isolated frontend state
- Share reusable UI components

## Use Feature-Based Frontend Structure

Avoid giant shared folders.

Preferred:

```text
/features/projects
/features/tasks
/features/crm
```

## Use Service Layer Pattern

Avoid business logic inside controllers.

Use:

- Controllers
- Services
- Repositories

## Build APIs Versioned From Day One

Example:

```text
/api/v1/projects
```

## Build for Multi-Tenancy Later

Even if single-company initially.

Add:

- organization_id columns
- tenant-aware middleware

---

# MVP Definition

The MVP should include:

- Authentication
- User management
- CRM
- Projects
- Tasks
- Notifications
- File management
- Gmail notifications
- Time tracking

Everything else can be iterative after MVP launch.

---

# Final Recommendation

Do not try to build the full ERP all at once.

Complete:

1. Authentication
2. CRM
3. Projects
4. Tasks
5. Notifications

before expanding into financials and advanced automation.

The biggest failure point in ERP projects is trying to build every feature before users can actually use the system.
