import { Close } from "@mui/icons-material";
import { Box, DialogTitle, IconButton, styled } from "@mui/material";
import { ReportData, ServerReportStatus } from "@nui/src/hooks/useReportListListener";

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(2),
}));

interface ReportDataWMessages extends ReportData {
    messages: {
        message: string;
        author_name: string;
        author_license: string;
        timestamp: number;
    }[];
}

type ReportModalProps = {
  onClose: () => void;
  reportId: string;
};
const PlayerModal: React.FC<ReportModalProps> = ({ onClose }) => {
//   const playerDetails = usePlayerDetailsValue();
//   const assocPlayer = useAssociatedPlayerValue();

    const reportDetails: ReportDataWMessages = {
        id: "example-id-3",
        subject: "weeeeeee",
        status: ServerReportStatus.INPROGRESS,
        reporter_license: "license:3",
        reporter_name: "Cooper",
        ts_opened: Date.now(),
        ts_lastaction: Date.now(),
        messages: [
            {
                message: 'msg 1',
                author_name: 'Plutarch',
                author_license: 'web-admin',
                timestamp: Date.now(),
            }
        ]
    };

  if (!reportDetails) return null;

  const error = (reportDetails as any).error;

  return (
    <>
      <DialogTitle style={{ borderBottom: "1px solid rgba(221,221,221,0.54)" }}>
        {reportDetails?.subject ?? reportDetails.id}
        <StyledCloseButton onClick={onClose} size="large">
          <Close />
        </StyledCloseButton>
      </DialogTitle>
      <Box display="flex" px={2} pb={2} pt={2} flexGrow={1} overflow="hidden">

      </Box>
    </>
  );
};

export default PlayerModal;