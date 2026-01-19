import React, { memo } from "react";
import { styled } from "@mui/material/styles";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { AccessTime, Fingerprint } from "@mui/icons-material";
import { AvTimer, CheckCircle, Help } from "@mui/icons-material";
import { useTranslate } from "react-polyglot";
import { ReportData, ServerReportStatus } from "@nui/src/hooks/useReportListListener";
// import { useSetReportModalVisibility } from "@nui/src/state/reportModal.state";

const PREFIX = "ReportCard";

const classes = {
  paper: `${PREFIX}-paper`,
  barBackground: `${PREFIX}-barBackground`,
  barInner: `${PREFIX}-barInner`,
  icon: `${PREFIX}-icon`,
  tooltipOverride: `${PREFIX}-tooltipOverride`,
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`& .${classes.paper}`]: {
    padding: 20,
    borderRadius: 10,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.selected,
    },
  },

  [`& .${classes.barBackground}`]: {
    background: theme.palette.primary.dark,
    height: 5,
    borderRadius: 10,
    overflow: "hidden",
  },

  [`& .${classes.barInner}`]: {
    height: "100%",
    background: theme.palette.primary.main,
  },

  [`& .${classes.icon}`]: {
    paddingRight: 7,
    color: theme.palette.primary.main,
  },

  [`& .${classes.tooltipOverride}`]: {
    fontSize: 12,
  },
}));

const formatTimestamp = (ts: number) => {
  try {
    return (new Date(ts)).toLocaleString();
  } catch (e) {
    return "Invalid Date";
  }
};

const ReportCard: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  // const setModalOpen = useSetReportModalVisibility();
  // const setAssociatedPlayer = useSetAssociatedPlayer();
  // const t = useTranslate();

  const statusIcon: { [K in ServerReportStatus]: JSX.Element | null } = {
    ['in-progress']: <AvTimer color="info" />,
    ['open']: <Help color="warning" />,
    ['resolved']: <CheckCircle color="success" />,
    ['all']: null,
  };

  const handleReportClick = () => {
    // setAssociatedPlayer(reportData);
    // setModalOpen(true);
  };

  const upperCaseStatus = reportData.status.charAt(0).toUpperCase() + reportData.status.slice(1);

  return (
    <StyledBox p={1}>
      <div onClick={handleReportClick}>
        <Paper className={classes.paper} elevation={1} style={{ padding: '12px' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Tooltip
              title={upperCaseStatus}
              placement="top"
              arrow
              classes={{ tooltip: classes.tooltipOverride }}
            >
              <Box component="span" mr={1.5} display="flex">
                {statusIcon[reportData.status]}
              </Box>
            </Tooltip>
            <Typography
              noWrap
              variant="subtitle1"
              color="textPrimary"
              style={{ fontWeight: 600, fontSize: '1rem' }}
            >
              {reportData.subject}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" mb={2}>
            <AccessTime style={{ fontSize: 14, marginRight: 4, opacity: 0.6 }} />
            <Typography variant="caption" color="textSecondary">
              {formatTimestamp(reportData.ts_opened)}
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ margin: '0 8px' }}>
              •
            </Typography>
            <Typography variant="caption" color="textSecondary" noWrap>
              {reportData.reporter_name}
            </Typography>
          </Box>

          <Box 
            display="flex" 
            alignItems="center" 
            pt={1} 
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Fingerprint style={{ fontSize: 12, marginRight: 4, opacity: 0.5 }} />
            <Typography
              variant="caption"
              style={{ 
                fontFamily: 'monospace', 
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                opacity: 0.5 
              }}
            >
              {reportData.id}
            </Typography>
          </Box>

        </Paper>
      </div>
    </StyledBox>
  );
};

export default memo(ReportCard);
