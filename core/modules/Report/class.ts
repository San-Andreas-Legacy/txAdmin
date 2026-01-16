import { DB } from "@modules/SqlLiteDatabase";
import { ServerReportDto, ServerReportStatus } from "@shared/reportApiTypes";
import { randomUUID } from "crypto";

export type ReportMember = {
    name: string;
    license: string;
}

export class ServerReport {
    // Store the report at it's id key
    static activeReports: Map<string, ServerReport> = new Map();

    static newReport(
        reporter: ReportMember,
        subject: string,
        initialMessage: string,
    ) {
        const id = randomUUID();
        const date = Date.now();

        const report = new ServerReport({
            id,
            reporter,
            subject,
            messages: [{
                message: initialMessage,
                author: reporter,
                ts: date,
            }],
            status: ServerReportStatus.OPEN,
            tsOpened: date,
            tsLastAction: date,
        });

        this.activeReports.set(id, report);

        return report;
    }

    static getReport(id: string) {
        const report = this.activeReports.get(id);

        return report ?? false;
    }

    static closeReport(id: string, author: ReportMember) {
        const report = this.getReport(id);

        if (!report) return { error: `No report found with id: ${id}` };

        report.closeTicket(author);

        return { success: true };
    }

    private id: ServerReportDto['id'];
    private reporter: ServerReportDto['reporter'];
    private subject: ServerReportDto['subject'];
    private status: ServerReportDto['status'];
    private messages: ServerReportDto['messages'];
    private tsOpened: ServerReportDto['tsOpened'];
    private tsLastAction: ServerReportDto['tsLastAction'];

    private database: DB;
    /**
     * Create a new report
     */
    constructor(reportDto: ServerReportDto) {
        this.id = reportDto.id;
        this.reporter = reportDto.reporter;
        this.subject = reportDto.subject;
        this.status = reportDto.status;
        this.messages = reportDto.messages;
        this.tsOpened = reportDto.tsOpened;
        this.tsLastAction = reportDto.tsLastAction;

        this.database = new DB();

        this.initialDBSave();
    }

    initialDBSave() {
        const exists = this.database.query<{ '1': 1 }>('SELECT 1 FROM reports WHERE `id` = ?', [this.id]);

        if (exists) return;

        this.database.insert('reports', {
            id: this.id,
            reporter_license: this.reporter.license,
            reporter_name: this.reporter.name,
            subject: this.subject,
            status: this.status,
            ts_opened: this.tsOpened,
            ts_lastaction: this.tsLastAction
        });

        for (const msg of this.messages) {
            this.database.insert('reports_messages', {
                report_id: this.id,
                author_license: msg.author.license,
                author_name: msg.author.name,
                message: msg.message,
                timestamp: msg.ts
            });
        }
    }

    newMessage(message: string, author: ReportMember, isAdmin: boolean = false) {
        const ts = Date.now();
        
        const msgObj = { message, author, ts };
        this.messages.push(msgObj);
        this.tsLastAction = ts;

        this.database.insert('reports_messages', {
            report: this.id,
            author_license: author.license,
            author_name: author.name,
            message: message,
            timestamp: ts
        });

        const sql = `UPDATE reports SET ts_lastaction = ? WHERE id = ?`;
        this.database.query(sql, [ts, this.id]);

        if (this.status === ServerReportStatus.OPEN && isAdmin) {
            this.status = ServerReportStatus.INPROGRESS;

            const sql = `UPDATE reports SET status = ? WHERE id = ?`;
            this.database.query(sql, [this.status, this.id]);
        }

        txCore.webServer.webSocket.sendReportMessage(this.id, {
            message, author, ts,
        });
    }

    closeTicket(author: ReportMember) {
        this.newMessage('Ticket has been closed', author);

        const sql = `UPDATE reports SET ts_lastaction = ? WHERE id = ?`;
        this.database.query(sql, [this.id]);
    }

    getData(): ServerReportDto {
        return {
            id: this.id,
            reporter: this.reporter,
            subject: this.subject,
            status: this.status,
            messages: this.messages,
            tsOpened: this.tsOpened,
            tsLastAction: this.tsLastAction,
        }
    }
}
