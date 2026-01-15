import { cloneDeep } from 'lodash-es';
import { DbInstance, SavePriority } from "../instance";
import { DatabaseReportType } from "../databaseTypes";
import { DuplicateKeyError } from "../dbUtils";
import consoleFactory from '@lib/console';
const console = consoleFactory('DatabaseDao');


/**
 * Data access object for the database "reports" collection.
 */
export default class ReportssDao {
    constructor(private readonly db: DbInstance) { }

    private get dbo() {
        if (!this.db.obj || !this.db.isReady) throw new Error(`database not ready yet`);
        return this.db.obj;
    }

    private get chain() {
        if (!this.db.obj || !this.db.isReady) throw new Error(`database not ready yet`);
        return this.db.obj.chain;
    }


    /**
     * Searches for a report in the database by the id, returns null if not found or false in case of error
     */
    findOne(id: string): DatabaseReportType | null {
        //Performing search
        const p = this.chain.get('reports')
            .find({ id })
            .cloneDeep()
            .value();
        return (typeof p === 'undefined') ? null : p;
    }


    /**
     * Find multiple reports with a filter function
     */
    findMany(filter: object | Function): DatabaseReportType[] {
        return this.chain.get('reports')
            .filter(filter as any)
            .cloneDeep()
            .value();
    }

    /**
     * Register a report to the database
     */
    register(report: DatabaseReportType): void {
        const found = this.chain.get('reports')
            .filter({ id: report.id })
            .value();
        if (found.length) throw new DuplicateKeyError(`this id is already registered`);

        this.db.writeFlag(SavePriority.LOW);
        this.chain.get('reports')
            .push(report)
            .value();
    }
}
