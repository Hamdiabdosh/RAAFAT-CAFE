import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchCafeProfile, updateCafeStatus } from "@/lib/cafe-api";
import { getApiErrorMessage } from "@/lib/api";

export function OpenClosedToggle() {
  const queryClient = useQueryClient();
  const { data: cafe } = useQuery({
    queryKey: ["cafe", "profile"],
    queryFn: fetchCafeProfile,
  });

  const mutation = useMutation({
    mutationFn: (open: boolean) => updateCafeStatus(open ? "open" : "closed"),
    onSuccess: (_data, open) => {
      queryClient.invalidateQueries({ queryKey: ["cafe", "profile"] });
      toast.success(open ? "Café is now open" : "Café closed");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const isOpen = cafe?.status === "open";

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="cafe-open"
        checked={isOpen}
        disabled={!cafe || mutation.isPending}
        onCheckedChange={(checked) => mutation.mutate(checked)}
      />
      <Label htmlFor="cafe-open" className="text-sm font-medium cursor-pointer">
        {isOpen ? (
          <span className="text-success">Open</span>
        ) : (
          <span className="text-muted-foreground">Closed</span>
        )}
      </Label>
    </div>
  );
}
