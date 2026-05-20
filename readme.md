# Leave Management System Documentation

## Project Overview

Simple Leave Management Backend Application using the SAP Cloud Application Programming Model (CAP) on SAP BTP. The application allows employees to apply for leave and enables administrators/managers to approve or reject leave requests.

The application demonstrates:

* CDS Data Modeling
* Custom Event Handlers
* Actions and Functions
* Validation Logic
* Role-Based Authorization (yet to complete)
* SAP HANA Cloud Integration

---

# Technology Stack

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| SAP CAP        | Backend framework              |
| Node.js        | Runtime                        |
| CDS            | Data modeling                  |
| OData V4       | API protocol                   |
| SAP HANA Cloud | Database                       |
| SAP BTP        | Cloud platform                 |
| XSUAA          | Authentication & Authorization |

---

# Project Structure

```text
leave-management/
│
├── app/
├── db/
│   └── schema.cds
│
├── srv/
│   ├── leave-service.cds
│   └── leave-service.js
│
├── package.json
├── xs-security.json
├── mta.yaml
└── test.http
```

---

# Functional Requirements

The application supports the following functionalities:

## Employee Management

* Create Employees
* View Employees

## Leave Management

* Apply for leave
* Update leave requests
* Approve leave requests (Admin)
* Reject leave requests (Admin)
* Fetch pending leave requests

## Validation Logic

* Mandatory reason validation
* End date validation
* Unique employee validation

---

# CDS Data Modeling

## Namespace

```cds
namespace leave.management;
```

The namespace uniquely identifies CDS artifacts and prevents naming conflicts.

---

# Entities

## Employee Entity

```cds
entity Employee : cuid, managed
```

### Features Used

* `cuid`

  * Automatically generates UUID primary key (`ID`)
* `managed`

  * Automatically maintains:

    * createdAt
    * createdBy
    * modifiedAt
    * modifiedBy

### Fields

| Field      | Type        | Description                |
| ---------- | ----------- | -------------------------- |
| EmployeeID | String(20)  | Unique employee identifier |
| Name       | String(100) | Employee name              |
| Email      | String(100) | Employee email             |
| Department | String(100) | Employee department        |
| Role       | String(20)  | Employee role              |

---

## LeaveRequest Entity

```cds
entity LeaveRequest : cuid, managed
```

### Fields

| Field     | Type        | Description              |
| --------- | ----------- | ------------------------ |
| LeaveID   | String(20)  | Leave request identifier |
| StartDate | Date        | Leave start date         |
| EndDate   | Date        | Leave end date           |
| Reason    | String(500) | Reason for leave         |
| Status    | LeaveStatus | Leave status             |
| AppliedOn | Date        | Application date         |

---

# Enum Type

## LeaveStatus

```cds
type LeaveStatus : String enum {
    Pending;
    Approved;
    Rejected;
}
```

Used to restrict leave status values.

---

# Association

## Employee → LeaveRequest

```cds
leaveRequests : Association to many LeaveRequest
    on leaveRequests.employee = $self;
```

### Relationship

One employee can have multiple leave requests.

### Why Association?

Association is used because:

* Employee and LeaveRequest can exist independently.
* Loose coupling exists between entities.

---

# CAP Service Layer

## Service Definition

```cds
service LeaveManagementService
```

The service exposes OData APIs for:

* Employees
* Leave Requests
* Actions
* Functions

---

# Exposed Entities

| Entity        | Purpose                  |
| ------------- | ------------------------ |
| Employees     | Employee operations      |
| LeaveRequests | Leave request operations |

---

# Custom Actions

## approveLeave()

Approves a leave request.

### Input

```json
{
  "leaveID": "L001"
}
```

### Output

```text
Leave L001 approved
```

---

## rejectLeave()

Rejects a leave request.

### Input

```json
{
  "leaveID": "L001"
}
```

---

# Custom Function

## getPendingLeaves()

Returns all leave requests having status:

```text
Pending
```

---

# Event Handlers

The application implements custom business logic using CAP event handlers.

---

# Before Handlers

## LeaveRequest Validation

### Validation 1 — Date Validation

```javascript
if (new Date(data.EndDate) < new Date(data.StartDate))
```

### Purpose

Ensures leave end date is not earlier than start date.

---

## Validation 2 — Mandatory Reason

```javascript
if (!data.Reason || data.Reason.trim() === '')
```

### Purpose

Ensures leave reason is mandatory.

---

## Employee Uniqueness Validation

```javascript
const existingEmployee = await SELECT.one
```

### Purpose

Prevents duplicate employee records.

---

# After Handler

## Auto Status Update

```javascript
.set({ Status: 'Pending' })
```

### Purpose

Automatically sets leave request status to:

```text
Pending
```

after successful creation.

---

# Actions Implementation

## Approve Leave

```javascript
this.on('approveLeave', async (req) => {
```

### Logic

* Checks leave existence
* Updates status to Approved

---

## Reject Leave

```javascript
this.on('rejectLeave', async (req) => {
```

### Logic

* Validates leave request existence
* Updates status to Rejected

---

# Function Implementation

## Get Pending Leaves

```javascript
SELECT.from(LeaveRequests)
    .where({ Status: 'Pending' });
```

### Purpose

Returns only pending leave requests.

---

# API Endpoints

Base URL:

```text
http://localhost:4004/odata/v4/leave-management
```

---

# Employee APIs

## Get Employees

```http
GET /Employees
```

---

## Create Employee

```http
POST /Employees
```

### Sample Payload

```json
{
  "EmployeeID": "EMP106",
  "Name": "Vishal Chavan",
  "Email": "vishal@test.com",
  "Department": "IT",
  "Role": "User"
}
```

---

# Leave Request APIs

## Create Leave Request

```http
POST /LeaveRequests
```

### Sample Payload

```json
{
  "LeaveID": "L001",
  "StartDate": "2026-05-20",
  "EndDate": "2026-05-22",
  "Reason": "Medical Leave",
  "AppliedOn": "2026-05-19",
  "employee_ID": "<employee-guid>"
}
```

---

# Validation Test APIs

## Empty Reason Validation

Expected:

```text
400 Bad Request
```

---

## Invalid Date Validation

Expected:

```text
EndDate cannot be earlier than StartDate
```

---

# Action APIs

## Approve Leave

```http
POST /approveLeave
```

---

## Reject Leave

```http
POST /rejectLeave
```

---

# Function API

## Get Pending Leaves

```http
GET /getPendingLeaves()
```

---

# Authentication & Authorization

The application uses XSUAA for authentication and role-based authorization.

---

# Roles

| Role  | Permissions                    |
| ----- | ------------------------------ |
| User  | Create and view leave requests |
| Admin | Approve/reject leave requests  |

---

# xs-security.json

Defines:

* scopes
* role templates
* authorization model

---

# SAP HANA Cloud Integration

The application is deployed to:

* SAP HANA Cloud
* HDI Container

### Database Binding

Local CAP service is connected to HANA using:

```bash
cds bind --to <hdi-container>
```

---

# Deployment Steps

## Build Project

```bash
cds build
```

---

## Build MTA Archive

```bash
mbt build
```

---

## Deploy Application

```bash
cf deploy mta_archives/leave-management_1.0.0.mtar
```

---

# Challenges Faced

| Challenge                 | Solution                              |
| ------------------------- | ------------------------------------- |
| CAP route mismatch        | Used actual generated OData path      |
| Authorization issues      | Configured XSUAA roles correctly      |
| Local HANA binding        | Used cds bind                         |

---

# Learnings

* Understanding CAP architecture
* CDS modeling concepts
* OData service generation
* Event-driven validation
* Actions and functions
* XSUAA integration
* SAP HANA Cloud deployment
