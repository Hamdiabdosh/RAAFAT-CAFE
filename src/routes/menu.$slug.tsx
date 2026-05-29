import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiErrorMessage } from "@/lib/api";
import {
  fetchPublicMenu,
  formatMoney,
  modifierLineTotal,
  modifiersValid,
  placePublicOrder,
  type PublicMenuItem,
} from "@/lib/public-api";
import { useCartStore } from "@/stores/cart-store";

export const Route = createFileRoute("/menu/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Menu — ${params.slug}` }] }),
  component: CustomerMenuPage,
});

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CustomerMenuPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const loadCart = useCartStore((s) => s.loadForSlug);
  const lines = useCartStore((s) => s.lines);
  const addLine = useCartStore((s) => s.addLine);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clearCart = useCartStore((s) => s.clear);
  const cartTotal = useCartStore((s) => s.total);
  const cartCount = useCartStore((s) => s.itemCount);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<PublicMenuItem | null>(null);
  const [modifierSel, setModifierSel] = useState<Record<string, string[]>>({});
  const [detailQty, setDetailQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    loadCart(slug);
  }, [slug, loadCart]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-menu", slug],
    queryFn: () => fetchPublicMenu(slug),
    retry: false,
  });

  const categories = data?.access === "open" ? data.menu.categories : [];
  const cafe = data?.cafe;
  const orderingEnabled = data?.ordering_enabled ?? false;

  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const themeStyle = useMemo(
    () =>
      cafe
        ? ({
            "--primary": cafe.primary_color,
            backgroundColor: cafe.bg_color,
          } as React.CSSProperties)
        : undefined,
    [cafe],
  );

  const placeOrder = useMutation({
    mutationFn: () => {
      if (!cafe || lines.length === 0) throw new Error("Empty cart");
      return placePublicOrder({
        cafe_id: cafe.id,
        type: orderType,
        table_number: orderType === "dine_in" ? Number(tableNumber) : undefined,
        note: note.trim() || undefined,
        items: lines.map((l) => ({
          item_id: l.item_id,
          quantity: l.quantity,
          selected_modifiers: l.selected_modifiers.map((m) => ({
            group_id: m.group_id,
            option_ids: m.options.map((o) => o.id),
          })),
        })),
      });
    },
    onSuccess: (order) => {
      clearCart();
      setCheckoutOpen(false);
      setCartOpen(false);
      navigate({
        to: "/menu/$slug/order/$token",
        params: { slug, token: order.order_token },
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const openItem = (item: PublicMenuItem) => {
    if (item.availability === "sold_out") return;
    setDetailItem(item);
    setModifierSel({});
    setDetailQty(1);
  };

  const toggleModifier = (groupId: string, optionId: string, isMulti: boolean) => {
    setModifierSel((prev) => {
      const current = prev[groupId] ?? [];
      if (isMulti) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [groupId]: next };
      }
      return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
    });
  };

  const addToCart = () => {
    if (!detailItem || !cafe) return;
    const unit =
      detailItem.base_price + modifierLineTotal(detailItem.modifier_groups, modifierSel);
    addLine(
      slug,
      {
        id: detailItem.id,
        name: detailItem.name,
        photo_url: detailItem.photo_url,
        base_price: detailItem.base_price,
      },
      detailItem.modifier_groups,
      modifierSel,
      unit,
      detailQty,
    );
    toast.success("Added to cart");
    setDetailItem(null);
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex min-h-svh items-center justify-center text-muted-foreground">
          Loading menu…
        </div>
      </CustomerLayout>
    );
  }

  if (error || !data) {
    const msg = getApiErrorMessage(error);
    const unavailable = msg.toLowerCase().includes("unavailable");
    return (
      <CustomerLayout>
        <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-semibold">
            {unavailable ? "Café unavailable" : "Menu not found"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
        </div>
      </CustomerLayout>
    );
  }

  if (data.access === "closed") {
    const today = new Date().getDay();
    const todayHours = cafe.hours?.find((h) => h.day_of_week === today);
    return (
      <CustomerLayout style={themeStyle}>
        <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
          {cafe.logo_url && (
            <img src={cafe.logo_url} alt="" className="mb-4 h-20 w-20 rounded-full object-cover" />
          )}
          <h1 className="text-2xl font-bold">{cafe.name}</h1>
          <Badge variant="secondary" className="mt-2">
            Closed
          </Badge>
          <p className="mt-4 text-sm text-muted-foreground">
            We&apos;re closed right now. Please check back during opening hours.
          </p>
          {todayHours && !todayHours.is_closed && todayHours.open_time && (
            <p className="mt-2 text-sm">
              Today: {todayHours.open_time} – {todayHours.close_time}
            </p>
          )}
          {cafe.hours && (
            <ul className="mt-6 space-y-1 text-left text-sm text-muted-foreground">
              {cafe.hours.map((h) => (
                <li key={h.day_of_week}>
                  {DAY_NAMES[h.day_of_week]}:{" "}
                  {h.is_closed ? "Closed" : `${h.open_time} – ${h.close_time}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout style={themeStyle}>
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {cafe.logo_url && (
            <img src={cafe.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold">{cafe.name}</h1>
            <Badge variant="outline" className="text-xs">
              Open
            </Badge>
          </div>
          {orderingEnabled && (
            <Button
              size="icon"
              variant="outline"
              className="relative shrink-0"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount() > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {cartCount()}
                </span>
              )}
            </Button>
          )}
        </div>
        <ScrollArea className="mx-auto mt-3 max-w-lg">
          <div className="flex gap-2 pb-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        {categories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{cat.name}</h2>
            <div className="space-y-3">
              {cat.items.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden p-0 ${item.availability === "sold_out" ? "opacity-60" : "cursor-pointer"}`}
                  onClick={() => openItem(item)}
                >
                  <div className="flex gap-3 p-3">
                    {item.photo_url && (
                      <img
                        src={item.photo_url}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{item.name}</p>
                        <span className="shrink-0 text-sm font-medium">
                          {formatMoney(item.base_price)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.dietary_tags.map((t) => (
                          <Badge key={t.id} variant="secondary" className="text-[10px]">
                            {t.name}
                          </Badge>
                        ))}
                        {item.availability === "sold_out" && (
                          <Badge variant="destructive" className="text-[10px]">
                            Sold out
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </main>

      {orderingEnabled && cartCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
          <div className="mx-auto max-w-lg">
            <Button className="w-full" size="lg" onClick={() => setCartOpen(true)}>
              View cart · {formatMoney(cartTotal())}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(detailItem)} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle>{detailItem.name}</DialogTitle>
              </DialogHeader>
              {detailItem.photo_url && (
                <img
                  src={detailItem.photo_url}
                  alt=""
                  className="w-full rounded-lg object-cover max-h-48"
                />
              )}
              {detailItem.description && (
                <p className="text-sm text-muted-foreground">{detailItem.description}</p>
              )}
              {detailItem.modifier_groups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <Label>
                    {group.name}
                    {group.is_required && <span className="text-destructive"> *</span>}
                  </Label>
                  {group.is_multi ? (
                    group.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={(modifierSel[group.id] ?? []).includes(opt.id)}
                          onCheckedChange={() =>
                            toggleModifier(group.id, opt.id, true)
                          }
                        />
                        <span className="flex-1">{opt.name}</span>
                        {opt.price_adj > 0 && (
                          <span className="text-muted-foreground">
                            +{formatMoney(opt.price_adj)}
                          </span>
                        )}
                      </label>
                    ))
                  ) : (
                    <RadioGroup
                      value={(modifierSel[group.id] ?? [])[0] ?? ""}
                      onValueChange={(v) => setModifierSel((p) => ({ ...p, [group.id]: v ? [v] : [] }))}
                    >
                      {group.options.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value={opt.id} />
                          <span className="flex-1">{opt.name}</span>
                          {opt.price_adj > 0 && (
                            <span className="text-muted-foreground">
                              +{formatMoney(opt.price_adj)}
                            </span>
                          )}
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{detailQty}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setDetailQty((q) => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                {orderingEnabled ? (
                  <Button
                    className="w-full"
                    disabled={!modifiersValid(detailItem.modifier_groups, modifierSel)}
                    onClick={addToCart}
                  >
                    Add ·{" "}
                    {formatMoney(
                      (detailItem.base_price +
                        modifierLineTotal(detailItem.modifier_groups, modifierSel)) *
                        detailQty,
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center w-full py-2">
                    This café accepts orders in person only.
                  </p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Drawer open={cartOpen} onOpenChange={setCartOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Your cart</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[50vh] overflow-y-auto px-4 space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="flex gap-3 border-b pb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{line.name}</p>
                  {line.selected_modifiers.map((m) => (
                    <p key={m.group_id} className="text-xs text-muted-foreground">
                      {m.group_name}: {m.options.map((o) => o.name).join(", ")}
                    </p>
                  ))}
                  <p className="mt-1 text-sm">{formatMoney(line.unit_price * line.quantity)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button type="button" onClick={() => setQuantity(line.key, line.quantity - 1)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{line.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DrawerFooter>
            <Button
              className="w-full"
              disabled={lines.length === 0}
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
            >
              Checkout · {formatMoney(cartTotal())}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order type</Label>
              <RadioGroup
                value={orderType}
                onValueChange={(v) => setOrderType(v as "dine_in" | "takeaway")}
                className="mt-2 flex gap-4"
              >
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="dine_in" />
                  Dine in
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="takeaway" />
                  Takeaway
                </label>
              </RadioGroup>
            </div>
            {orderType === "dine_in" && (
              <div>
                <Label htmlFor="table">Table number</Label>
                <Input
                  id="table"
                  type="number"
                  min={1}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="rounded-md border p-3 text-sm">
              {lines.map((l) => (
                <div key={l.key} className="flex justify-between py-1">
                  <span>
                    {l.quantity}× {l.name}
                  </span>
                  <span>{formatMoney(l.unit_price * l.quantity)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatMoney(cartTotal())}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={
                placeOrder.isPending ||
                (orderType === "dine_in" && !tableNumber) ||
                lines.length === 0
              }
              onClick={() => placeOrder.mutate()}
            >
              {placeOrder.isPending ? "Placing…" : "Place order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
