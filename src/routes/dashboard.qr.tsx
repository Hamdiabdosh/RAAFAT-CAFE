import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadQr, fetchQrInfo } from "@/lib/cafe-api";
import { getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/dashboard/qr")({
  head: () => ({ meta: [{ title: "QR code — CaféOS" }] }),
  component: QrPage,
});

function QrPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["cafe", "qr"],
    queryFn: fetchQrInfo,
  });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.menu_url) return;
    const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
    const token = JSON.parse(localStorage.getItem("cafeos-auth") ?? "{}") as {
      state?: { token?: string };
    };
    const auth = token.state?.token;

    fetch(`${baseURL}/api/cafe/qr/download?format=png`, {
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        setQrDataUrl(URL.createObjectURL(blob));
      })
      .catch(() => setQrDataUrl(null));

    return () => {
      if (qrDataUrl) URL.revokeObjectURL(qrDataUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.menu_url]);

  const copyUrl = () => {
    if (!data?.menu_url) return;
    navigator.clipboard.writeText(data.menu_url);
    toast.success("Menu URL copied");
  };

  return (
    <>
      <PageHeader
        title="QR code"
        subtitle="Customers scan this to open your menu. The link never changes."
      />

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        <Card className="p-6 flex flex-col items-center justify-center bg-card">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="Café menu QR code" className="w-64 h-64" />
          ) : (
            <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
              QR preview unavailable
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Menu link</p>
            <div className="flex gap-2">
              <Input readOnly value={data?.menu_url ?? ""} />
              <Button type="button" variant="outline" size="icon" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Slug: <strong>{data?.slug}</strong> — print this QR and place it on tables.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await downloadQr("png", `${data?.slug ?? "cafe"}-qr.png`);
                } catch (e) {
                  toast.error(getApiErrorMessage(e));
                }
              }}
            >
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await downloadQr("pdf", `${data?.slug ?? "cafe"}-qr.pdf`);
                } catch (e) {
                  toast.error(getApiErrorMessage(e));
                }
              }}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
