import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoursEditor } from "@/components/cafe/hours-editor";
import {
  fetchCafeProfile,
  updateCafeHours,
  updateCafeProfile,
  updateCafeTheme,
  uploadCafeLogo,
} from "@/lib/cafe-api";
import { getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Café settings — CaféOS" }] }),
  component: CafeSettingsPage,
});

function CafeSettingsPage() {
  const queryClient = useQueryClient();
  const { data: cafe, isLoading } = useQuery({
    queryKey: ["cafe", "profile"],
    queryFn: fetchCafeProfile,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  useEffect(() => {
    if (!cafe) return;
    setName(cafe.name);
    setDescription(cafe.description ?? "");
    setAddress(cafe.address ?? "");
    setPhone(cafe.phone ?? "");
    setPrimaryColor(cafe.primary_color);
    setBgColor(cafe.bg_color);
  }, [cafe]);

  const saveProfile = useMutation({
    mutationFn: () =>
      updateCafeProfile({
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe", "profile"] });
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const saveTheme = useMutation({
    mutationFn: () => updateCafeTheme(primaryColor, bgColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe", "profile"] });
      toast.success("Theme saved");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const saveHours = useMutation({
    mutationFn: (hours: Parameters<typeof updateCafeHours>[0]) => updateCafeHours(hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe", "profile"] });
      toast.success("Hours saved");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadCafeLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe", "profile"] });
      toast.success("Logo uploaded");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading café settings…</p>;
  }

  return (
    <>
      <PageHeader
        title="Café settings"
        subtitle="Profile, hours, and customer menu appearance."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/qr">QR code</Link>
          </Button>
        }
      />

      {!cafe?.profile_complete && (
        <Card className="p-4 mb-6 border-gold-border bg-gold-dim text-sm">
          Complete your profile (name + address) before customers can view your menu.
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="p-6 bg-card space-y-6">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                {cafe?.logo_url ? (
                  <img src={cafe.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-display text-gold">{name.charAt(0) || "?"}</span>
                )}
              </div>
              <div>
                <Label htmlFor="logo" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>Upload logo</span>
                  </Button>
                </Label>
                <input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) logoMutation.mutate(file);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">JPG or PNG, max 2MB</p>
              </div>
            </div>

            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile.mutate();
              }}
            >
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Café name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Menu URL (slug does not change)</Label>
                <Input value={`/menu/${cafe?.slug}`} readOnly className="text-muted-foreground" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  maxLength={200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? "Saving…" : "Save profile"}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="mt-6">
          <Card className="p-6 bg-card">
            <HoursEditor
              hours={cafe?.hours}
              saving={saveHours.isPending}
              onSave={async (rows) => {
                await saveHours.mutateAsync(
                  rows.map((r) => ({
                    day_of_week: r.day_of_week,
                    is_closed: r.is_closed,
                    open_time: r.is_closed ? null : r.open_time,
                    close_time: r.is_closed ? null : r.close_time,
                  })),
                );
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <Card className="p-6 bg-card space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="primary">Primary color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bg">Background color</Label>
              <div className="flex gap-2">
                <Input
                  id="bg"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
              </div>
            </div>
            <div
              className="rounded-lg border p-4 text-center"
              style={{ backgroundColor: bgColor, color: primaryColor }}
            >
              Menu preview
            </div>
            <Button onClick={() => saveTheme.mutate()} disabled={saveTheme.isPending}>
              {saveTheme.isPending ? "Saving…" : "Save theme"}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
