import { DB } from "@modules/SqlLiteDatabase";
import { ReportCloseResp, ReportsTableSearchResp, ServerReportDto, ServerReportMessage, ServerReportStatus } from "@shared/reportApiTypes";
import { randomUUID } from "crypto";

const DEFAULT_LIMIT = 100;

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
        let report = this.activeReports.get(id);

        if (report) return {
            active: true,
            report,
        };

        const dbReport = this.database.single<ServerReportDto>('SELECT * FROM reports WHERE id = ?', [id]);

        if (!dbReport) return false;

        const dbMessages = this.database.query<ServerReportMessage>(`
            SELECT * FROM reports_messages
            WHERE report_id = ?
            ORDER BY timestamp ASC,`
        );

        report = new ServerReport({
            id: dbReport.id,
            reporter_license: dbReport.reporter_license,
            reporter_name: dbReport.reporter_name,
            subject: dbReport.subject,
            status: dbReport.status as ServerReportStatus,
            ts_opened: dbReport.ts_opened,
            ts_lastaction: dbReport.ts_lastaction,
            messages: dbMessages,
        });

        return {
            active: false,
            report,
        };
    }

    static closeReport(id: string, author: ReportMember): ReportCloseResp {
        const data = this.getReport(id);

        if (!data || !data.active) return { error: `No report found with id: ${id}` };

        data.report.closeTicket(author);

        this.activeReports.delete(id);

        return { success: true };
    }

    /**
     * Search and filter reports from the database
     */
    static searchReports(
        searchValue?: string,
        searchType?: string,
        filters?: string,
        sortingKey: string = 'ts_opened',
        sortingDesc: boolean = true,
        offsetParam?: string
    ): ReportsTableSearchResp {
        let sql = `SELECT * FROM reports WHERE 1=1`;
        const params: any[] = [];

        // 1. Status Filtering
        if (filters && filters.length) {
            const validFilters = filters.split(',').map(f => {
                if (f === 'statusOpen') return ServerReportStatus.OPEN;
                if (f === 'statusInProgress') return ServerReportStatus.INPROGRESS;
                if (f === 'statusResolved') return ServerReportStatus.RESOLVED;
                return null;
            }).filter(Boolean);

            if (validFilters.length) {
                const placeholders = validFilters.map(() => '?').join(',');
                sql += ` AND status IN (${placeholders})`;
                params.push(...validFilters);
            }
        }

        // 2. Simple Search (SQL LIKE)
        if (searchValue && searchValue.trim().length) {
            if (searchType === 'subject') {
                sql += ` AND subject LIKE ?`;
                params.push(`%${searchValue}%`);
            } else if (searchType === 'reporter') {
                sql += ` AND (reporter_name LIKE ? OR reporter_license LIKE ?)`;
                params.push(`%${searchValue}%`, `%${searchValue}%`);
            }
        }

        // 3. Sorting & Pagination Logic
        // Map incoming sorting key to DB column name
        const dbSortKey = sortingKey === 'tsLastAction' ? 'ts_lastaction' : 'ts_opened';
        
        if (offsetParam) {
            const parsedOffset = parseInt(offsetParam);
            if (!isNaN(parsedOffset)) {
                const operator = sortingDesc ? '<' : '>';
                sql += ` AND ${dbSortKey} ${operator} ?`;
                params.push(parsedOffset);
            }
        }

        const direction = sortingDesc ? 'DESC' : 'ASC';
        sql += ` ORDER BY ${dbSortKey} ${direction} LIMIT ?`;
        params.push(DEFAULT_LIMIT + 1);

        // 4. Execution
        const rows = this.database.query<any>(sql, params);
        const hasReachedEnd = rows.length <= DEFAULT_LIMIT;
        const reportsData = rows.slice(0, DEFAULT_LIMIT);

        // 5. Mapping to ServerReportDto
        // Since the 'reports' table doesn't have messages, we return an empty array for the list
        // or you can perform a secondary query if messages are needed in the table view.
        const reports: ServerReportDto[] = reportsData.map(r => ({
            id: r.id,
            reporter_license: r.reporter_license,
            reporter_name: r.reporter_name,
            subject: r.subject,
            status: r.status as ServerReportStatus,
            messages: [], // Typically messages aren't needed for the table list view
            ts_opened: r.ts_opened,
            ts_lastaction: r.ts_lastaction,
        }));

        return {
            reports,
            hasReachedEnd
        };
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

    static loadFromDatabase() {// 1. Fetch all reports that are NOT resolved
        const reports = this.database.query<any>(`
            SELECT * FROM reports 
            WHERE status != 'resolved'
        `);

        if (!reports.length) return;

        // 2. Fetch all messages for these specific reports
        const reportIds = reports.map(r => r.id);
        const placeholders = reportIds.map(() => '?').join(',');
        const allMessages = this.database.query<any>(`
            SELECT * FROM reports_messages 
            WHERE report_id IN (${placeholders})
            ORDER BY timestamp ASC
        `, reportIds);

        // 3. Group messages by their report_id
        const messagesMap = new Map<string, ServerReportMessage[]>();
        for (const msg of allMessages) {
            if (!messagesMap.has(msg.report_id)) {
                messagesMap.set(msg.report_id, []);
            }
            messagesMap.get(msg.report_id)!.push({
                message: msg.message,
                author_license: msg.author_license,
                author_name: msg.author_name,
                timestamp: msg.timestamp
            });
        }

        // 4. Instantiate and store in the activeReports Map
        for (const r of reports) {
            const report = new ServerReport({
                id: r.id,
                reporter_license: r.reporter_license,
                reporter_name: r.reporter_name,
                subject: r.subject,
                status: r.status as ServerReportStatus,
                ts_opened: r.ts_opened,
                ts_lastaction: r.ts_lastaction,
                messages: messagesMap.get(r.id) || []
            });

            this.activeReports.set(r.id, report);
        }
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

ServerReport.loadFromDatabase();
