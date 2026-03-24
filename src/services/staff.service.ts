import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { createError } from '../utils/AppError';
import { UserRole, StaffStatus } from '@prisma/client';

export const staffService = {
  async getAllStaff() {
    const staff = await prisma.staffProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
    return staff;
  },

  async createStaff(data: {
    username: string;
    password: string;
    role: UserRole;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    shiftStart?: string;
    shiftEnd?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw createError.conflict('Username already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        role: data.role,
        profile: {
          create: {
            fullName: data.fullName,
            phone: data.phone,
            avatarUrl: data.avatarUrl,
            shiftStart: data.shiftStart,
            shiftEnd: data.shiftEnd,
          },
        },
      },
      include: { profile: true },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async getStaffById(id: string) {
    const staff = await prisma.staffProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!staff) {
      throw createError.notFound('Staff member not found');
    }

    return staff;
  },

  async updateStaff(
    id: string,
    data: {
      role?: UserRole;
      fullName?: string;
      phone?: string;
      avatarUrl?: string;
      status?: StaffStatus;
      shiftStart?: string;
      shiftEnd?: string;
    }
  ) {
    const staff = await prisma.staffProfile.findUnique({
      where: { id },
    });

    if (!staff) {
      throw createError.notFound('Staff member not found');
    }

    const { role, ...profileData } = data;

    const updatedStaff = await prisma.staffProfile.update({
      where: { id },
      data: profileData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (role) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { role },
      });
    }

    return updatedStaff;
  },

  async deleteStaff(id: string) {
    const staff = await prisma.staffProfile.findUnique({
      where: { id },
    });

    if (!staff) {
      throw createError.notFound('Staff member not found');
    }

    await prisma.user.delete({
      where: { id: staff.userId },
    });

    return { success: true, message: 'Staff member deleted' };
  },
};
