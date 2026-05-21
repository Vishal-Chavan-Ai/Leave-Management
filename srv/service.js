const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {

    const { Employees, LeaveRequests } = this.entities;

    // VALIDATIONS
    this.before(['CREATE', 'UPDATE'], LeaveRequests, async (req) => {

        const data = req.data;

        // PATCH REQUESTS
        let existingLeave = null;

        if (req.event === 'UPDATE') {
            existingLeave = await SELECT.one
                .from(LeaveRequests)
                .where({ ID: req.data.ID });

            if (!existingLeave) {
                req.error(404, 'Leave request not found');
            }
        }

        const startDate = data.StartDate || existingLeave?.StartDate;
        const endDate = data.EndDate || existingLeave?.EndDate;
        const reason = data.Reason || existingLeave?.Reason;
        const employeeID = data.employee_ID || existingLeave?.employee_ID;

        // EMPLOYEE VALIDATION
        if (!employeeID) {
            req.error(400, 'Employee ID is mandatory');
        }

        const employeeExists = await SELECT.one
            .from(Employees)
            .where({ ID: employeeID });

        if (!employeeExists) {
            req.error(404, 'Employee not found');
        }

        // DATE VALIDATION
        if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
                req.error(400, 'EndDate cannot be earlier than StartDate');
            }
        }

        // REASON VALIDATION
        if (!reason || reason.trim() === '') {
            req.error(400, 'Reason is mandatory');
        }
    });

    // EMPLOYEE UNIQUENESS
    this.before('CREATE', Employees, async (req) => {

        const existingEmployee = await SELECT.one
            .from(Employees)
            .where({ EmployeeID: req.data.EmployeeID });

        if (existingEmployee) {
            req.error(400, 'Employee already exists');
        }
    });

    // Duplicate Leave IDs
    this.before('CREATE', LeaveRequests, async (req) => {

        const existingLeave = await SELECT.one
            .from(LeaveRequests)
            .where({ LeaveID: req.data.LeaveID });

        if (existingLeave) {
            req.error(400, 'Leave ID already exists');
        }
    });

    // APPROVE LEAVE
    this.on('approveLeave', async (req) => {

        const { leaveID } = req.data;

        const leaveRequest = await SELECT.one
            .from(LeaveRequests)
            .where({ LeaveID: leaveID });

        if (!leaveRequest) {
            req.error(404, 'Leave request not found');
        }

        await UPDATE(LeaveRequests)
            .set({ Status: 'Approved' })
            .where({ LeaveID: leaveID });

        return `Leave ${leaveID} approved`;
    });

    // REJECT LEAVE
    this.on('rejectLeave', async (req) => {

        const { leaveID } = req.data;

        const leaveRequest = await SELECT.one
            .from(LeaveRequests)
            .where({ LeaveID: leaveID });

        if (!leaveRequest) {
            req.error(404, 'Leave request not found');
        }

        await UPDATE(LeaveRequests)
            .set({ Status: 'Rejected' })
            .where({ LeaveID: leaveID });

        return `Leave ${leaveID} rejected`;
    });

    // CHANGE STATUS
    this.on('changeLeaveStatus', async (req) => {

        const { leaveID, status } = req.data;

        const validStatuses = ['Pending', 'Approved', 'Rejected'];

        if (!validStatuses.includes(status)) {
            req.error(400, 'Invalid status');
        }

        const leaveRequest = await SELECT.one
            .from(LeaveRequests)
            .where({ LeaveID: leaveID });

        if (!leaveRequest) {
            req.error(404, 'Leave request not found');
        }

        await UPDATE(LeaveRequests)
            .set({ Status: status })
            .where({ LeaveID: leaveID });

        return `Leave ${leaveID} changed to ${status}`;
    });

    // GET PENDING LEAVES
    this.on('getPendingLeaves', async () => {

        return await SELECT.from(LeaveRequests)
            .where({ Status: 'Pending' });
    });

    // GET EMPLOYEE LEAVES
    this.on('getEmployeeLeaves', async (req) => {

        const { employeeID } = req.data;

        const employee = await SELECT.one
            .from(Employees)
            .where({ EmployeeID: employeeID });

        if (!employee) {
            req.error(404, 'Employee not found');
        }

        return await SELECT.from(LeaveRequests)
            .where({ employee_ID: employee.ID });
    });

});