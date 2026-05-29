import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/public-api";
import {
  createMenuItem,
  createModifierGroup,
  createModifierOption,
  deleteModifierGroup,
  deleteModifierOption,
  fetchDietaryTags,
  type MenuCategory,
  type MenuItem,
  updateMenuItem,
  uploadItemPhoto,
} from "@/lib/menu-api";
import { getApiErrorMessage } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: MenuCategory | null;
  item: MenuItem | null;
  onSaved: () => void;
};

export function ItemFormDialog({ open, onOpenChange, category, item, onSaved }: Props) {
  const isEdit = Boolean(item);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupRequired, setGroupRequired] = useState(true);
  const [groupMulti, setGroupMulti] = useState(false);
  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState("0");

  const { data: tagsData } = useQuery({
    queryKey: ["menu", "tags"],
    queryFn: fetchDietaryTags,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (item) {
      setName(item.name);
      setDescription(item.description ?? "");
      setPrice(String(item.base_price));
      setTagIds(item.dietary_tags.map((t) => t.id));
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setTagIds([]);
    }
  }, [open, item]);

  const saveItem = useMutation({
    mutationFn: async () => {
      const base_price = parseFloat(price);
      if (Number.isNaN(base_price) || base_price <= 0) {
        throw new Error("Enter a valid price greater than 0");
      }
      if (isEdit && item) {
        return updateMenuItem(item.id, {
          name,
          description: description || null,
          base_price,
          dietary_tag_ids: tagIds,
        });
      }
      if (!category) throw new Error("No category selected");
      return createMenuItem({
        category_id: category.id,
        name,
        description: description || null,
        base_price,
        dietary_tag_ids: tagIds,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Item updated" : "Item created");
      onSaved();
      if (!isEdit) onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const addGroup = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("Save item first");
      return createModifierGroup(item.id, {
        name: groupName,
        is_required: groupRequired,
        is_multi: groupMulti,
      });
    },
    onSuccess: () => {
      setGroupName("");
      toast.success("Modifier group added");
      onSaved();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const addOption = useMutation({
    mutationFn: async (groupId: string) => {
      const price_adj = parseFloat(optPrice);
      if (Number.isNaN(price_adj) || price_adj < 0) throw new Error("Invalid price adjustment");
      return createModifierOption(groupId, { name: optName, price_adj });
    },
    onSuccess: () => {
      setOptName("");
      setOptPrice("0");
      toast.success("Option added");
      onSaved();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add menu item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-price">Base price</Label>
            <Input
              id="item-price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {isEdit && item && (
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <Input
                type="file"
                accept="image/png,image/jpeg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await uploadItemPhoto(item.id, file);
                    toast.success("Photo uploaded");
                    onSaved();
                  } catch (err) {
                    toast.error(getApiErrorMessage(err));
                  }
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Dietary tags</Label>
            <div className="flex flex-wrap gap-2">
              {tagsData?.tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={tagIds.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          {isEdit && item && item.modifier_groups.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <Label>Modifier groups</Label>
              {item.modifier_groups.map((g) => (
                <div key={g.id} className="rounded-md border p-3 text-sm space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.is_required ? "Required" : "Optional"} ·{" "}
                        {g.is_multi ? "Multi-select" : "Single-select"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={async () => {
                        try {
                          await deleteModifierGroup(item.id, g.id);
                          toast.success("Group removed");
                          onSaved();
                        } catch (e) {
                          toast.error(getApiErrorMessage(e));
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <ul className="space-y-1">
                    {g.options.map((o) => (
                      <li key={o.id} className="flex justify-between text-muted-foreground">
                        <span>
                          {o.name}{" "}
                          {o.price_adj > 0 && (
                            <Badge variant="secondary">+{formatMoney(o.price_adj)}</Badge>
                          )}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline"
                          onClick={async () => {
                            try {
                              await deleteModifierOption(g.id, o.id);
                              toast.success("Option removed");
                              onSaved();
                            } catch (e) {
                              toast.error(getApiErrorMessage(e));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Option name"
                      value={optName}
                      onChange={(e) => setOptName(e.target.value)}
                      className="h-8"
                    />
                    <Input
                      placeholder="+0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      value={optPrice}
                      onChange={(e) => setOptPrice(e.target.value)}
                      className="h-8 w-20"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!optName.trim()}
                      onClick={() => addOption.mutate(g.id)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isEdit && item && (
            <div className="space-y-3 border-t pt-4">
              <Label>Add modifier group</Label>
              <Input
                placeholder="e.g. Size"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={groupRequired} onCheckedChange={setGroupRequired} />
                  Required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={groupMulti} onCheckedChange={setGroupMulti} />
                  Multi-select
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!groupName.trim() || addGroup.isPending}
                onClick={() => addGroup.mutate()}
              >
                Add group
              </Button>
              <p className="text-xs text-muted-foreground">
                Add at least 2 options per group after creating it.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveItem.mutate()}
            disabled={!name.trim() || saveItem.isPending}
          >
            {saveItem.isPending ? "Saving…" : isEdit ? "Save changes" : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
