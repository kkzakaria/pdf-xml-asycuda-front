"use server";

import { prisma } from "./db";
import { hashPassword } from "./password";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types/auth";

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Non autorisé");
  }
  return session;
}

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUser(id: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function createUser(input: CreateUserInput) {
  await requireAdmin();

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error("Un utilisateur avec cet email existe déjà");
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name || null,
      password: hashedPassword,
      role: input.role,
      isActive: input.isActive ?? true,
    },
  });

  revalidatePath("/admin/users");
  return { id: user.id };
}

export async function updateUser(id: string, input: UpdateUserInput) {
  await requireAdmin();

  if (input.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email,
        NOT: { id },
      },
    });

    if (existingUser) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }
  }

  const data: Record<string, unknown> = {};

  if (input.email !== undefined) data.email = input.email;
  if (input.name !== undefined) data.name = input.name || null;
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  if (input.password) {
    data.password = await hashPassword(input.password);
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();

  // Empêcher l'auto-suppression
  if (session.user.id === id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte");
  }

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/admin/users");
}
