import { Router } from "express";
import * as menuService from "../modules/menu/menu.service.js";
import {
  availabilitySchema,
  categoryNameSchema,
  categoryReorderSchema,
  createItemSchema,
  modifierGroupSchema,
  modifierGroupUpdateSchema,
  modifierOptionSchema,
  modifierOptionUpdateSchema,
  publishMenuSchema,
  updateItemSchema,
} from "../modules/menu/menu.schemas.js";
import { requireOwner, type AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import { upload } from "../lib/uploads.js";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export const menuRouter = Router();

menuRouter.use(requireOwner);

menuRouter.get("/", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await menuService.getFullMenu(user.sub);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

menuRouter.get("/tags", async (_req, res, next) => {
  try {
    const tags = await menuService.listDietaryTags();
    sendSuccess(res, { tags });
  } catch (e) {
    next(e);
  }
});

menuRouter.patch("/publish", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { status } = publishMenuSchema.parse(req.body);
    const data = await menuService.publishMenu(user.sub, status);
    sendSuccess(res, data, status === "published" ? "Menu published" : "Menu unpublished");
  } catch (e) {
    next(e);
  }
});

menuRouter.post("/categories", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { name } = categoryNameSchema.parse(req.body);
    const category = await menuService.createCategory(user.sub, name);
    sendSuccess(res, { category }, "Category created", 201);
  } catch (e) {
    next(e);
  }
});

menuRouter.patch("/categories/reorder", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { order } = categoryReorderSchema.parse(req.body);
    await menuService.reorderCategories(user.sub, order);
    sendSuccess(res, null, "Reordered");
  } catch (e) {
    next(e);
  }
});

menuRouter.patch("/categories/:id", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { name } = categoryNameSchema.parse(req.body);
    const category = await menuService.updateCategory(user.sub, paramId(req.params.id), name);
    sendSuccess(res, { category }, "Category updated");
  } catch (e) {
    next(e);
  }
});

menuRouter.delete("/categories/:id", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    await menuService.deleteCategory(user.sub, paramId(req.params.id));
    sendSuccess(res, null, "Category and all items deleted");
  } catch (e) {
    next(e);
  }
});

menuRouter.get("/items/:id", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const item = await menuService.getItem(user.sub, paramId(req.params.id));
    sendSuccess(res, { item });
  } catch (e) {
    next(e);
  }
});

menuRouter.post("/items", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = createItemSchema.parse(req.body);
    const item = await menuService.createItem(user.sub, body);
    sendSuccess(res, { item }, "Item created", 201);
  } catch (e) {
    next(e);
  }
});

menuRouter.patch("/items/:id", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = updateItemSchema.parse(req.body);
    const item = await menuService.updateItem(user.sub, paramId(req.params.id), body);
    sendSuccess(res, { item }, "Item updated");
  } catch (e) {
    next(e);
  }
});

menuRouter.delete("/items/:id", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    await menuService.deleteItem(user.sub, paramId(req.params.id));
    sendSuccess(res, null, "Item deleted");
  } catch (e) {
    next(e);
  }
});

menuRouter.patch("/items/:id/availability", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { availability } = availabilitySchema.parse(req.body);
    const data = await menuService.setItemAvailability(
      user.sub,
      paramId(req.params.id),
      availability,
    );
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

menuRouter.post("/items/:id/photo", upload.single("photo"), async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    if (!req.file) throw new ValidationError("Photo file is required");
    const item = await menuService.uploadItemPhoto(user.sub, paramId(req.params.id), req.file);
    sendSuccess(res, { item }, "Photo uploaded");
  } catch (e) {
    next(e);
  }
});

menuRouter.post("/items/:id/modifiers", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = modifierGroupSchema.parse(req.body);
    const modifier_group = await menuService.createModifierGroup(
      user.sub,
      paramId(req.params.id),
      body,
    );
    sendSuccess(res, { modifier_group }, "Modifier group created", 201);
  } catch (e) {
    next(e);
  }
});

menuRouter.patch("/items/:id/modifiers/:groupId", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = modifierGroupUpdateSchema.parse(req.body);
    const modifier_group = await menuService.updateModifierGroup(
      user.sub,
      paramId(req.params.id),
      paramId(req.params.groupId),
      body,
    );
    sendSuccess(res, { modifier_group }, "Modifier group updated");
  } catch (e) {
    next(e);
  }
});

menuRouter.delete("/items/:id/modifiers/:groupId", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    await menuService.deleteModifierGroup(
      user.sub,
      paramId(req.params.id),
      paramId(req.params.groupId),
    );
    sendSuccess(res, null, "Modifier group deleted");
  } catch (e) {
    next(e);
  }
});

menuRouter.post("/modifiers/:groupId/options", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = modifierOptionSchema.parse(req.body);
    const option = await menuService.createModifierOption(
      user.sub,
      paramId(req.params.groupId),
      body,
    );
    sendSuccess(res, { option }, "Option created", 201);
  } catch (e) {
    next(e);
  }
});

menuRouter.patch("/modifiers/:groupId/options/:optionId", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = modifierOptionUpdateSchema.parse(req.body);
    const option = await menuService.updateModifierOption(
      user.sub,
      paramId(req.params.groupId),
      paramId(req.params.optionId),
      body,
    );
    sendSuccess(res, { option }, "Option updated");
  } catch (e) {
    next(e);
  }
});

menuRouter.delete("/modifiers/:groupId/options/:optionId", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    await menuService.deleteModifierOption(
      user.sub,
      paramId(req.params.groupId),
      paramId(req.params.optionId),
    );
    sendSuccess(res, null, "Option deleted");
  } catch (e) {
    next(e);
  }
});
