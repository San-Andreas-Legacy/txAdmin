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
    static database = new DB();

    static newReport(
        reporter: ReportMember,
        subject: string,
        initialMessage: string,
    ) {
        const id = randomUUID();
        const date = Date.now();

        const report = new ServerReport({
            id,
            reporter_license: reporter.license,
            reporter_name: reporter.name,
            subject,
            messages: [{
                message: initialMessage,
                author_license: reporter.license,
                author_name: reporter.name,
                timestamp: date,
            }],
            status: ServerReportStatus.OPEN,
            ts_opened: date,
            ts_lastaction: date,
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

    static getStats() {
        const response = this.database.single<{
            total: number;
            resolved: number;
            unanswered: number;
            inprogress: number;
        }>(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'open') AS unanswered,
                COUNT(*) FILTER (WHERE status = 'in-progress') AS inprogress,
                COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
                COUNT(*) AS total
            FROM reports;`
        );

        return response;
    }

    private id: ServerReportDto['id'];
    private reporter_license: ServerReportDto['reporter_license'];
    private reporter_name: ServerReportDto['reporter_name'];
    private subject: ServerReportDto['subject'];
    private status: ServerReportDto['status'];
    private messages: ServerReportDto['messages'];
    private ts_opened: ServerReportDto['ts_opened'];
    private ts_lastaction: ServerReportDto['ts_lastaction'];

    /**
     * Create a new report
     */
    constructor(reportDto: ServerReportDto) {
        this.id = reportDto.id;
        this.reporter_license = reportDto.reporter_license;
        this.reporter_name = reportDto.reporter_name;
        this.subject = reportDto.subject;
        this.status = reportDto.status;
        this.messages = reportDto.messages;
        this.ts_opened = reportDto.ts_opened;
        this.ts_lastaction = reportDto.ts_lastaction;

        this.initialDBSave();
    }

    initialDBSave() {
        const exists = ServerReport.database.query<{ '1': 1 }>('SELECT 1 FROM reports WHERE `id` = ?', [this.id]);

        if (exists) return;

        ServerReport.database.insert('reports', {
            id: this.id,
            reporter_license: this.reporter_license,
            reporter_name: this.reporter_name,
            subject: this.subject,
            status: this.status,
            ts_opened: this.ts_opened,
            ts_lastaction: this.ts_lastaction
        });

        for (const msg of this.messages) {
            ServerReport.database.insert('reports_messages', {
                report_id: this.id,
                author_license: msg.author_license,
                author_name: msg.author_name,
                message: msg.message,
                timestamp: msg.timestamp
            });
        }
    }

    newMessage(message: string, author: ReportMember, isAdmin: boolean = false) {
        const timestamp = Date.now();
        
        this.messages.push({
            message,
            author_license: author.license,
            author_name: author.name,
            timestamp
        });
        this.ts_lastaction = timestamp;

        ServerReport.database.insert('reports_messages', {
            report: this.id,
            author_license: author.license,
            author_name: author.name,
            message: message,
            timestamp
        });

        const sql = `UPDATE reports SET ts_lastaction = ? WHERE id = ?`;
        ServerReport.database.query(sql, [timestamp, this.id]);

        if (this.status === ServerReportStatus.OPEN && isAdmin) {
            this.status = ServerReportStatus.INPROGRESS;

            const sql = `UPDATE reports SET status = ? WHERE id = ?`;
            ServerReport.database.query(sql, [this.status, this.id]);
        }

        txCore.webServer.webSocket.sendReportMessage(this.id, {
            message, timestamp,
            author_license: author.license,
            author_name: author.name,
        });
    }

    closeTicket(author: ReportMember) {
        this.newMessage('Ticket has been closed', author);

        const sql = `UPDATE reports SET ts_lastaction = ? WHERE id = ?`;
        ServerReport.database.query(sql, [this.id]);
    }

    getData(): ServerReportDto {
        return {
            id: this.id,
            reporter_license: this.reporter_license,
            reporter_name: this.reporter_name,
            subject: this.subject,
            status: this.status,
            messages: this.messages,
            ts_opened: this.ts_opened,
            ts_lastaction: this.ts_lastaction,
        }
    }
}
