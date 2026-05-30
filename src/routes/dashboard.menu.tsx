import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowDown, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ItemFormDialog } from "@/components/menu/item-form-dialog";
import { formatMoney } from "@/lib/public-api";
import {
  createCategory,
  deleteCategory,
  deleteMenuItem,
  fetchMenu,
  publishMenu,
  setItemAvailability,
  type MenuCategory,
  type MenuItem,
} from "@/lib/menu-api";
import { getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/dashboard/menu")({
  head: () => ({ meta: [{ title: "Menu builder — CaféOS" }] }),
  component: MenuBuilderPage,
});

function MenuBuilderPage() {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    category: MenuCategory | null;
    item: MenuItem | null;
  }>({ open: false, category: null, item: null });
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["menu"] });

  const addCategory = useMutation({
    mutationFn: () => createCategory(newCategoryName.trim()),
    onSuccess: () => {
      setNewCategoryName("");
      invalidate();
      toast.success("Category created");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const togglePublish = useMutation({
    mutationFn: (published: boolean) =>
      publishMenu(published ? "published" : "unpublished"),
    onSuccess: (_, published) => {
      invalidate();
      toast.success(published ? "Menu published" : "Menu unpublished");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const removeCategory = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      setDeleteCategoryId(null);
      invalidate();
      toast.success("Category deleted");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const isPublished = data?.menu.status === "published";

  return (
    <>
      <PageHeader
        title="Menu builder"
        subtitle="Categories, items, modifiers, and publish control."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="publish"
                checked={isPublished}
                disabled={!data || togglePublish.isPending}
                onCheckedChange={(checked) => togglePublish.mutate(checked)}
              />
              <Label htmlFor="publish" className="text-sm">
                {isPublished ? "Published" : "Draft"}
              </Label>
            </div>
          </div>
        }
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading menu…</p>}

      {data && (
        <>
          <Card className="p-4 mb-6 flex flex-wrap gap-2 items-end bg-card">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label htmlFor="cat-name">New category</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Hot Drinks"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <Button
              disabled={newCategoryName.trim().length < 2 || addCategory.isPending}
              onClick={() => addCategory.mutate()}
            >
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          </Card>

          {!isLoading && (!data?.categories || data.categories.length === 0) && (
            <Card className="p-8 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-gold-dim border border-gold-soft flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-semibold text-lg">Build your first menu</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start by creating a category — like &quot;Coffee&quot;, &quot;Food&quot;, or &quot;Cold Drinks&quot;.
                Then add items inside each category.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
                <ArrowDown className="h-4 w-4 text-gold animate-bounce" />
                <span>Type a category name below and press Create</span>
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {data.categories.map((category) => (
              <Card key={category.id} className="p-5 bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-lg font-semibold">{category.name}</h2>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setItemDialog({ open: true, category, item: null })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Add item
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteCategoryId(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {category.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt=""
                              className="h-12 w-12 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-muted shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatMoney(item.base_price)}
                              {item.modifier_groups.length > 0 &&
                                ` · ${item.modifier_groups.length} modifier group(s)`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              item.availability === "available" ? "secondary" : "outline"
                            }
                          >
                            {item.availability === "available" ? "Available" : "Sold out"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const next =
                                  item.availability === "available"
                                    ? "sold_out"
                                    : "available";
                                await setItemAvailability(item.id, next);
                                invalidate();
                              } catch (e) {
                                toast.error(getApiErrorMessage(e));
                              }
                            }}
                          >
                            Toggle stock
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setItemDialog({ open: true, category, item })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={async () => {
                              if (!confirm(`Delete "${item.name}"?`)) return;
                              try {
                                await deleteMenuItem(item.id);
                                invalidate();
                                toast.success("Item deleted");
                              } catch (e) {
                                toast.error(getApiErrorMessage(e));
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      <ItemFormDialog
        open={itemDialog.open}
        onOpenChange={(open) => setItemDialog((s) => ({ ...s, open }))}
        category={itemDialog.category}
        item={itemDialog.item}
        onSaved={async () => {
          await invalidate();
          if (itemDialog.item) {
            const fresh = await fetchMenu();
            const cat = fresh.categories.find((c) =>
              c.items.some((i) => i.id === itemDialog.item?.id),
            );
            const updated = cat?.items.find((i) => i.id === itemDialog.item?.id) ?? null;
            setItemDialog((s) => ({ ...s, item: updated }));
          }
        }}
      />

      <AlertDialog
        open={Boolean(deleteCategoryId)}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category and all items inside it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCategoryId && removeCategory.mutate(deleteCategoryId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
