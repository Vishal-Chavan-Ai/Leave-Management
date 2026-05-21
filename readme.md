# Leave Management System Documentation

# Project Overview

Simple Leave Management Backend Application using the **SAP Cloud Application Programming Model (CAPM)** on SAP BTP. The application allows employees to apply for leave and enables admin to approve or reject leave requests.

The application demonstrates:

* CDS Data Modeling
* Custom Event Handlers
* Actions and Functions
* Validation Logic
* HTTP Request Handling
* SAP HANA Cloud Integration
* XSUAA Authentication & Authorization

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
│   ├── schema.cds
│   └── data/
│
├── srv/
│   ├── service.cds
│   └── service.js
│
├── package.json
├── xs-security.json
├── mta.yaml
├── test.http
└── README.md
```

---

# Functional Requirements

## Employee Management

* Create employees
* View employees
* Validate unique employees

## Leave Management

* Apply for leave
* Update leave requests
* Approve leave requests
* Reject leave requests
* Change leave status dynamically
* Fetch pending leave requests
* Fetch leave requests for a particular employee

## Validation Logic

* Employee existence validation
* Mandatory reason validation
* End date validation
* Duplicate employee prevention
* Invalid leave request handling

---

# CDS Data Modeling

## Employee Entity

```cds
entity Employee : cuid, managed
```

### Features Used

* `cuid` → Automatically generates UUID primary key (`ID`)
* `managed` → Automatically maintains audit fields

### Fields

| Field      | Type        |
| ---------- | ----------- |
| EmployeeID | String(20)  |
| Name       | String(100) |
| Email      | String(100) |
| Department | String(100) |
| Role       | String(20)  |

---

## LeaveRequest Entity

```cds
entity LeaveRequest : cuid, managed
```

### Fields

| Field     | Type        |
| --------- | ----------- |
| LeaveID   | String(20)  |
| StartDate | Date        |
| EndDate   | Date        |
| Reason    | String(500) |
| Status    | LeaveStatus |
| AppliedOn | Date        |
| employee  | Association |

---

# Composition Relationship

```cds
leaveRequests : Composition of many LeaveRequest
    on leaveRequests.employee = $self;
```

Composition is used because LeaveRequest is lifecycle-dependent on Employee.

If an employee is deleted, associated leave requests are also deleted.

---

# CAP Service Layer

## Service Definition

```cds
service LeaveManagementService {

    entity Employees     as projection on db.Employee;
    entity LeaveRequests as projection on db.LeaveRequest;

    action approveLeave(leaveID: String) returns String;

    action rejectLeave(leaveID: String) returns String;

    action changeLeaveStatus(
        leaveID : String,
        status  : String
    ) returns String;

    function getPendingLeaves()
        returns array of LeaveRequests;

    function getEmployeeLeaves(employeeID : String)
        returns array of LeaveRequests;
}
```

---

# Custom Actions

## approveLeave()

```json
{
  "leaveID": "LV1002"
}
```

---

## rejectLeave()

```json
{
  "leaveID": "LV1005"
}
```

---

## changeLeaveStatus()

```json
{
  "leaveID": "LV1002",
  "status": "Rejected"
}
```

Supported Status Values:

* Pending
* Approved
* Rejected

---

# Custom Functions

## getPendingLeaves()

Returns all pending leave requests.

---

## getEmployeeLeaves()

```http
GET /getEmployeeLeaves(employeeID='EMP1001')
```

Returns all leave requests for a particular employee.

---

# Event Handlers

## LeaveRequest Validation

### Employee Validation

```javascript
if (!employeeID)
```

Ensures every leave request belongs to an employee.

---

### Employee Existence Check

```javascript
const employeeExists = await SELECT.one
```

Ensures leave requests cannot be created for invalid employees.

---

### Date Validation

```javascript
if (new Date(endDate) < new Date(startDate))
```

Ensures leave end date is not earlier than start date.

---

### Mandatory Reason Validation

```javascript
if (!reason || reason.trim() === '')
```

Ensures leave reason is mandatory.

---

### Unique Employee Validation

```javascript
const existingEmployee = await SELECT.one
```

Prevents duplicate employee records.

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
  "EmployeeID": "EMP1006",
  "Name": "Vishal Chavan",
  "Email": "vishal@test.com",
  "Department": "IT",
  "Role": "Employee"
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
  "LeaveID": "LV1006",
  "StartDate": "2026-06-20",
  "EndDate": "2026-06-22",
  "Reason": "Medical Leave",
  "AppliedOn": "2026-06-15",
  "employee_ID": "13829769-36c4-4e19-be07-07c72a37c609"
}
```

---

## Update Leave Request

```http
PATCH /LeaveRequests(<UUID>)
```

### Sample Payload

```json
{
  "Reason": "Updated medical leave reason"
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

## Invalid Employee Validation

Expected:

```text
Employee not found
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

## Change Leave Status

```http
POST /changeLeaveStatus
```

---

# Function APIs

## Get Pending Leaves

```http
GET /getPendingLeaves()
```

---

## Get Employee Leaves

```http
GET /getEmployeeLeaves(employeeID='EMP1001')
```

---

# Authentication & Authorization

The application uses XSUAA for authentication and role-based authorization.

---

# Roles

| Role     | Permissions                    |
| -------- | ------------------------------ |
| Employee | Create and view leave requests |
| Admin    | Approve/reject leave requests  |

---

# Challenges Faced

| Challenge                       | Solution                                            |
| ------------------------------- | --------------------------------------------------- |
| Authorization issues            | Configured XSUAA roles correctly                    |
| Local HANA binding              | Used cds bind                                       |
| PATCH request validation issues | Merged existing DB data with incoming PATCH payload |
| Composition lifecycle handling  | Replaced associations with composition              |

---

# Learnings

* SAP CAP architecture
* CDS entity modeling
* Composition vs Association
* Event-driven validation
* HTTP request handling
* CAP actions and functions
* Business validation implementation
* SAP HANA Cloud integration
* XSUAA authentication