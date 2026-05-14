export type SignupInput = {
  email: string;
  password: string;
  fullName: string;
  role: "USER" | "ADMIN";
};

export type LoginInput = {
  email: string;
  password: string;
};
