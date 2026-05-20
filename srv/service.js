const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { Employees, LeaveRequests } = this.entities;

    // BEFORE HANDLERS
    this.before(['CREATE', 'UPDATE'], LeaveRequests, async (req) => {

        const data = req.data;

        // Validate dates
        if (data.StartDate && data.EndDate) {
            // new Date(data.EndDate). Convert strings into Date objects. CAP usually receives dates as strings from the request payload.
            if (new Date(data.EndDate) < new Date(data.StartDate)) {
                req.error(400, 'EndDate cannot be earlier than StartDate');
            }
        }

        // Validate reason
        if (!data.Reason || data.Reason.trim() === '') {
            req.error(400, 'Reason is mandatory');
        }
    });

    // Employee uniqueness validation
    this.before('CREATE', Employees, async (req) => {

        const existingEmployee = await SELECT.one
            .from(Employees)
            .where({ EmployeeID: req.data.EmployeeID });

        if (existingEmployee) {
            req.error(400, 'Employee already exists');
        }
    });

    // AFTER HANDLER
    this.after('CREATE', LeaveRequests, async (data) => {

        await UPDATE(LeaveRequests)
            .set({ Status: 'Pending' })
            .where({ ID: data.ID });

        console.log(`Leave request created successfully for ${data.LeaveID}`);
    });

    // ACTIONS
    this.on('approveLeave', async (req) => {

        const { leaveID } = req.data;

        const updated = await UPDATE(LeaveRequests)
            .set({ Status: 'Approved' })
            .where({ LeaveID: leaveID });

        // Check Invalid ID
        if (!updated) {
            req.error(404, 'Leave request not found');
        }

        return `Leave ${leaveID} approved`;
    });

    this.on('rejectLeave', async (req) => {

        const { leaveID } = req.data;

        // Check if leave request exists
        const leaveRequest = await SELECT.one.from(LeaveRequests).where({ LeaveID: leaveID });
        if (!leaveRequest) {
            req.error(404, 'Leave request not found');
        }

        await UPDATE(LeaveRequests)
            .set({ Status: 'Rejected' })
            .where({ LeaveID: leaveID });

        return `Leave ${leaveID} rejected`;
    });

    // FUNCTION
    this.on('getPendingLeaves', async () => {

        return await SELECT.from(LeaveRequests)
            .where({ Status: 'Pending' });
    });

});