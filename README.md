# Shift Scheduler

**Shift Scheduler** is an intelligent platform designed to automate and manage shift scheduling for clinics and hospitals. It helps managers create, edit, and generate monthly shift rosters, respecting staff preferences, workload limits, and availability constraints.

## Features

- User registration and login with email and password
- Manage multiple establishments (e.g., clinics, hospitals) per user
- Create groups within establishments (e.g., lab technicians, biochemists)
- Add staff members with shift preferences and availability restrictions
- Define shift types (Day, Night, 24h shifts starting day or night)
- Automatic monthly shift generation respecting:
  - Staff shift preferences
  - Exact monthly workload (in hours)
  - Maximum consecutive working hours (24h max)
  - Minimum rest shifts after consecutive work
  - Staff availability (blocked days and custom restrictions)
  - At least one technician per shift
  - Balanced distribution of shifts across staff
- Visualize schedules in a calendar grid (staff vs. days)
- Manual schedule editing with alerts for conflicts or preference violations
- Confirm schedule and prevent multiple confirmed schedules per group/month
- Export schedules as PDF and Excel files