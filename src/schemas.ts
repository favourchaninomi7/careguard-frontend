import { z } from "zod";

export const residentschema = z.object({
  careHomeId: z.string().min(1),
  //   firstName: z.string().min(1, "First name is required"),
  //   lastName: z.string().min(1, "Last name is required"),
  //   dateOfBirth: z.string().min(1),
  //   admissionDate: z.string().min(1),
  //   roomNumber: z.string().min(1),
  //   medicalNotes: z.string().optional(),
  //   primaryCaregiverId: z.string().min(1, "Primary caregiver is required"),
  // });

  // const residentschema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]),
  dateOfBirth: z.string().min(1),
  admissionDate: z.string().min(1),
  roomNumber: z.string().min(1),
  condition: z.enum(["STABLE", "NEW_ADMISSION", "PALLIATIVE", "REQUIRES_REVIEW"]),
  primaryCaregiverId: z.string().min(1),
  medicalNotes: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContact: z.object({
    fullName: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
  }),
});

export type ResidentFormValues = z.infer<typeof residentschema>;
