import React from "react";
import { Box, styled } from "@mui/material";
import { ReportPageHeader } from "./ReportPageHeader";
import { useReportListListener } from "@nui/src/hooks/useReportListListener";
import { useFilteredSortedReports } from "@nui/src/state/reports.state";
import { ReportsListGrid } from "./ReportListGrid";
import { RepostListEmpty } from "./ReportListEmpty";

const RootStyled = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  height: "50vh",
  borderRadius: 15,
  flex: 1,
}));

const GridStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "85%",
}));

export const ReportsPageAdmin: React.FC<{ visible: boolean }> = ({ visible }) => {
  const reports = useFilteredSortedReports();

  useReportListListener();

  return (
    <RootStyled
      mt={2}
      mb={10}
      pt={4}
      px={4}
      display={visible ? "initial" : "none"}
    >
      <ReportPageHeader />
      <GridStyled>
        {reports.length ? <ReportsListGrid />  : <RepostListEmpty />}
      </GridStyled>
    </RootStyled>
  );
};
