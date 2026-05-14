export type UserProfileDto = {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
};
