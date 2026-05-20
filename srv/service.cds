using leave.management as db from '../db/schema';

service LeaveManagementService {

    entity Employees     as projection on db.Employee;
    entity LeaveRequests as projection on db.LeaveRequest;

    action   approveLeave(leaveID: String)         returns String;

    action   rejectLeave(leaveID: String)          returns String;

    action   changeLeaveStatus(leaveID: String,
                               status: String)     returns String;

    function getPendingLeaves()                    returns array of LeaveRequests;

    function getEmployeeLeaves(employeeID: String) returns array of LeaveRequests;
}
