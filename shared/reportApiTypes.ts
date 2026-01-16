import { GenericApiErrorResp } from "./genericApiTypes";
import { BanTemplatesDataType } from "./otherTypes";

//Already compliant with new db specs
// export type PlayerHistoryItem = {
//     id: string;
//     type: "ban" | "warn";
//     author: string;
//     reason: string;
//     ts: number;
//     exp?: number;
//     revokedBy?: string;
//     revokedAt?: number;
// }

// export type PlayerModalPlayerData = {
//     //common
//     displayName: string;
//     pureName: string;
//     isRegistered: boolean;
//     isConnected: boolean;
//     idsOffline: string[];
//     idsOnline: string[]; //empty if not-registered or offline
//     hwidsOffline: string[];
//     hwidsOnline: string[]; //empty if not-registered or offline
//     license: string | null;
//     actionHistory: PlayerHistoryItem[]; //can be empty

//     //only if server player
//     netid?: number;
//     sessionTime?: number; //calcular baseado no tsConnected

//     //only if registered
//     tsJoined?: number;
//     tsWhitelisted?: number;
//     playTime?: number;
//     notesLog?: string;
//     notes?: string;
//     tsLastConnection?: number; //only show if offline
// }

// export type PlayerModalSuccess = {
//     serverTime: number; //required to calculate if bans have expired on frontend
//     banTemplates: BanTemplatesDataType[]; //TODO: move this to websocket push
//     player: PlayerModalPlayerData;
// }
// export type PlayerModalResp = PlayerModalSuccess | GenericApiErrorResp;


/**
 * Used in the report page
 */
export type ReportsStatsResp = {
    total: number;
    resolved: number;
    unanswered: number;
    inprogress: number;
} | GenericApiErrorResp;


export type ReportTableSearchType = {
    value: string;
    type: string;
}

export type ReportsTableFiltersType = string[];

export type ReportsTableSortingType = {
    key: 'tsOpened' | 'tsLastAction';
    desc: boolean;
};

export type ReportsTableReqType = {
    search: ReportTableSearchType;
    filters: ReportsTableFiltersType;
    sorting: ReportsTableSortingType;
    //NOTE: the query needs to be offset.param inclusive, but ignore offset.license
    // therefore, optimistically always limit to x + 1
    offset?: {
        param: number;
    }
};

export type ReportsTablePlayerType = {
    id: string;
    subject: string;
    reporter: {
        license: string;
        name: string;
        online: boolean;
    };
    status: 'open' | 'in-progress' | 'resolved';
    tsOpened: number;
    tsLastAction: number;
}

export type ReportsTableSearchResp = {
    reports: ReportsTablePlayerType[];
    hasReachedEnd: boolean;
} | GenericApiErrorResp;

export enum ServerReportStatus {
    OPEN = 'open',
    INPROGRESS = 'in-progress',
    RESOLVED = 'resolved',
};

export interface ServerReportMessage {
    message: string;
    timestamp: number;
    author_license: string;
    author_name: string;
}

export interface ServerReportDto {
    id: string;
    reporter_license: string;
    reporter_name: string;
    subject: string;
    status: ServerReportStatus;
    messages: ServerReportMessage[];
    ts_opened: number;
    ts_lastaction: number;
}