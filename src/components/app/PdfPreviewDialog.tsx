import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveBlob } from "@/lib/quotePdf";

export type PdfPreview = { url: string; fileName: string; blob: Blob };

/** Visor de PDF dentro del dashboard, con botón de descarga. */
export const PdfPreviewDialog = ({ preview, onClose }: { preview: PdfPreview | null; onClose: () => void }) => (
  <Dialog open={!!preview} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="max-w-5xl w-[95vw] h-[92vh] p-0 gap-0 flex flex-col rounded-none">
      <DialogHeader className="px-5 py-3 border-b border-border flex-row items-center justify-between space-y-0">
        <DialogTitle className="font-display text-navy text-base truncate pr-4">{preview?.fileName}</DialogTitle>
        <Button
          size="sm"
          onClick={() => preview && saveBlob(preview.blob, preview.fileName)}
          className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-9 mr-8 shrink-0"
        >
          <FileDown className="h-4 w-4 mr-2" /> Descargar
        </Button>
      </DialogHeader>
      {preview && <iframe title="Vista previa del documento" src={preview.url} className="flex-1 w-full bg-secondary" />}
    </DialogContent>
  </Dialog>
);
