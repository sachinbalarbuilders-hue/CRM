# DESIGN.md

# Design Philosophy

The platform should feel like a modern SaaS application used daily by sales teams.

The design should prioritize:

* Simplicity
* Consistency
* Readability
* Speed
* Usability
* Responsiveness

The platform should look professional and business-oriented.

Avoid overly decorative interfaces.

Avoid flashy colors, excessive gradients, unnecessary animations, and visually noisy screens.

The design should resemble modern business software rather than a marketing website.

---

# Design Principles

## Reuse First

Always reuse existing UI components before creating new ones.

Preferred order:

1. Existing Component
2. Extended Existing Component
3. New Component

Avoid duplicate components with similar behavior.

---

## Consistency

All modules should feel like they belong to the same application.

Maintain consistency in:

* Colors
* Typography
* Spacing
* Buttons
* Forms
* Tables
* Filters
* Dialogs
* Icons

Users should not feel like they are using different applications inside the platform.

---

# Layout Structure

## Application Layout

Desktop Layout:

Header
↓
Sidebar Navigation
↓
Content Area

Mobile Layout:

Top Navigation
↓
Collapsible Menu
↓
Content Area

---

# Navigation

Navigation should remain consistent across all modules.

Primary Navigation:

* Dashboard
* Inbox
* Leads
* Projects
* Follow-Ups
* Site Visits
* Flow Builder
* Templates
* Campaigns
* Reports
* Settings

The active page should always be clearly visible.

---

# Color System

Use a restrained color palette.

Primary Color:

* Brand Color

Secondary Color:

* Neutral Supporting Color

Success:

* Green

Warning:

* Amber

Error:

* Red

Info:

* Blue

Avoid using excessive colors on the same screen.

Color should communicate meaning.

---

# Typography

Typography should prioritize readability.

Requirements:

* Clear hierarchy
* Consistent font sizing
* Consistent font weights
* Consistent spacing

Text hierarchy:

Page Title
Section Title
Card Title
Body Text
Helper Text

Avoid excessive font variations.

---

# Cards

Cards should be used for:

* Dashboard Metrics
* Statistics
* Summaries
* Quick Actions

Card design should remain consistent throughout the platform.

---

# Tables

Tables are a primary CRM component.

Requirements:

* Sorting
* Filtering
* Pagination
* Search
* Bulk Actions

Responsive behavior:

Desktop:

* Full table

Mobile:

* Card view or adaptive layout

---

# Forms

All forms should use a consistent layout.

Requirements:

* Labels
* Validation
* Error Messages
* Helper Text

Form controls should appear identical throughout the application.

---

# Dialogs

Use dialogs for:

* Confirmation Actions
* Quick Editing
* Create Actions

Avoid creating full pages when a dialog is sufficient.

---

# WhatsApp Inbox Design

The inbox is one of the most important modules.

Requirements:

* Familiar messaging layout
* Fast message rendering
* Clear conversation list
* Easy assignment controls
* Internal notes panel

The inbox should feel similar to:

* WhatsApp Web
* Interakt
* WATI
* Gallabox

Without copying their designs.

---

# Dashboard Design

Dashboard should provide information at a glance.

Components:

* KPI Cards
* Charts
* Recent Activity
* Notifications
* Tasks

Avoid cluttering the dashboard.

Focus on actionable information.

---

# Flow Builder Design

The Flow Builder should feel visual and intuitive.

Requirements:

* Drag and Drop
* Zoom Controls
* Minimap
* Node Configuration Panel
* Responsive Canvas

Nodes should remain visually consistent.

---

# Campaign Builder Design

Campaign creation should follow a wizard-like flow.

Steps:

1. Select Template
2. Select Audience
3. Configure Variables
4. Schedule
5. Review
6. Launch

Users should never feel overwhelmed.

---

# Mobile Experience

The platform must be fully usable on mobile devices.

Requirements:

* Touch Friendly Controls
* Responsive Tables
* Responsive Forms
* Responsive Inbox
* Responsive Dashboard

No feature should be desktop-only.

---

# Loading States

All pages should support:

* Skeleton Loading
* Empty States
* Error States

Never leave blank screens while data loads.

---

# Notifications

Notifications should be:

* Non-intrusive
* Informative
* Actionable

Support:

* Toast Notifications
* Notification Center

---

# Component Library Rules

Create reusable components for:

* Buttons
* Inputs
* Selects
* Tables
* Dialogs
* Cards
* Badges
* Avatars
* Notifications
* Charts

Business modules should assemble reusable components rather than creating unique UI patterns.

---

# Accessibility

Support:

* Keyboard Navigation
* Proper Labels
* Focus States
* Readable Contrast

Accessibility should not be treated as optional.

---

# Design Goal

The final product should feel like a premium business application used daily by sales teams.

The interface should be:

* Clean
* Fast
* Professional
* Consistent
* Responsive
* Easy to learn

The user experience should prioritize productivity over visual decoration.
