import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { ReportData, ServerReportStatus } from "../hooks/useReportListListener";
import { debugData } from "../utils/debugData";
import { Report } from "@mui/icons-material";

export enum ReportDataFilter {
  All = "all",
  Active = "active",
  Open = "open",
  InProgress = "in-progress",
  Resolved = "resolved",
}

export enum ReportDataSort {
  OpenedAt = "openedAt",
  LastAction = "lastAction",
}

const reportsState = {
  reportData: atom<ReportData[]>({
    default: [],
    key: "reportStates",
  }),
  reportFilterType: atom<ReportDataFilter>({
    default: ReportDataFilter.All,
    key: "reportFilterType",
  }),
  reportSortType: atom<ReportDataSort>({
    default: ReportDataSort.OpenedAt,
    key: "reportSortType",
  }),
  filterReportInput: atom({
    key: "filterReportInput",
    default: "",
  }),
  sortedAndFilteredReportData: selector({
    key: "sortedAndFilteredReportStates",
    get: ({ get }) => {
      const filterType = get(reportsState.reportFilterType);
      const sortType = get(reportsState.reportSortType);
      const unfilteredReports = get(reportsState.reportData);
      const searchInput = get(reportsState.filterReportInput).toLowerCase().trim();

      let filtered = unfilteredReports.filter((r) => {
        const matchesSearch = r.subject.toLowerCase().includes(searchInput) || 
                              r.reporter_name.toLowerCase().includes(searchInput);
        
        let matchesStatus;
        if (filterType === ReportDataFilter.All) matchesStatus = true;
        else if (filterType === ReportDataFilter.Active) matchesStatus = [ReportDataFilter.Open, ReportDataFilter.InProgress].includes(r.status);
        else matchesStatus = r.status === filterType;
        
        return matchesSearch && matchesStatus;
      });

      return [...filtered].sort((a, b) => {
        if (sortType === ReportDataSort.LastAction) {
          return b.ts_lastaction - a.ts_lastaction;
        }
        return b.ts_opened - a.ts_opened;
      });
    },
  }),
};

export const useReportsState = () => useRecoilValue(reportsState.reportData);

export const useSetReportsState = () => useSetRecoilState(reportsState.reportData);

export const useReportsFilterBy = () => useRecoilState(reportsState.reportFilterType);

export const useReportsSortBy = () => useRecoilState(reportsState.reportSortType);

export const useReportsSearch = () => useRecoilState(reportsState.filterReportInput);

export const useFilteredSortedReports = (): ReportData[] =>
  useRecoilValue(reportsState.sortedAndFilteredReportData);

debugData<ReportData[]>(
  [
    {
      action: "setReportList",
      data: [
        {
          id: "example-id-1",
          subject: "weeeeeee",
          status: ServerReportStatus.OPEN,
          reporter_license: "license:1",
          reporter_name: "Dumbledore",
          ts_opened: Date.now(),
          ts_lastaction: Date.now(),
        },
        {
          id: "example-id-2",
          subject: "Test Report",
          status: ServerReportStatus.INPROGRESS,
          reporter_license: "license:2",
          reporter_name: "Alfred",
          ts_opened: Date.now(),
          ts_lastaction: Date.now(),
        },
        {
          id: "example-id-3",
          subject: "weeeeeee",
          status: ServerReportStatus.RESOLVED,
          reporter_license: "license:3",
          reporter_name: "Cooper",
          ts_opened: Date.now(),
          ts_lastaction: Date.now(),
        },
      ],
    },
  ],
  750
);
