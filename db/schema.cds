namespace leave.management;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity Employee : cuid, managed {

    EmployeeID    : String(20) @title: 'Employee ID';
    Name          : String(100);
    Email         : String(100);
    Department    : String(100);
    Role          : String(20);
    leaveRequests : Association to many LeaveRequest
                        on leaveRequests.employee = $self;
}

type LeaveStatus : String enum {
    Pending;
    Approved;
    Rejected;
}

entity LeaveRequest : cuid, managed {
    LeaveID   : String(20);
    StartDate : Date @title: 'Start Date';
    EndDate   : Date @title: 'End Date';
    Reason    : String(500);
    Status    : LeaveStatus;
    AppliedOn : Date @title: 'Applied On';
    employee  : Association to Employee;
}
