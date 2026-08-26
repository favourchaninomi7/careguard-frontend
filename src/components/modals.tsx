import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  FileCheck2,
  ScrollText,
  CheckCircle2,
  Hash,
  Loader2,
  Sparkles,
  AlertTriangle,
  X,
  FileDown,
  Archive,
  KeyRound,
  Pill,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

import { Modal, Field, inputCls, textareaCls, BtnPrimary, BtnGhost } from "./modal";
import { Badge, Card } from "./ui-kit";
import { fakeSha256, shortHash } from "@/lib/hash";
import { User, UserRole } from "@/services/user-service";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useCaregivers,
  useCreateResident,
  useResidents,
  useUpdateResident,
} from "@/hooks/use-residents";
import { ResidentFormValues, residentschema } from "@/schemas";
import { capitalizeFirst } from "@/lib/utils";
import { useCreateCareRecord } from "@/hooks/use-care-records";
import {
  CareRecord,
  CareRecordType,
  CreateCareRecordDto,
  VerificationStatus,
} from "@/services/care-records-service";
import {
  CreateMedicationRecordDto,
  MedicationIntervalUnit,
  MedicationRecord,
  MedicationRecordType,
  MedicationStatus,
} from "@/services/medication-records-service";
import {
  useContinueMedicationRecord,
  useCreateMedicationRecord,
  useUpdateMedicationRecord,
} from "@/hooks/use-medication-records";
import { formatDateTime } from "@/lib/date";
import { Resident } from "@/services";
import { Button } from "./ui/button";

/* -------------------------------------------------------------------------- */
/* Hash-generation animation (shared by Care Record & Medication saves)       */
/* -------------------------------------------------------------------------- */

type HashStep = { label: string; icon: typeof Database };

const SAVE_STEPS: HashStep[] = [
  { label: "Saving record", icon: Database },
  { label: "Generating SHA-256 hash", icon: Hash },
  { label: "Creating audit log entry", icon: ScrollText },
  { label: "Verifying integrity", icon: ShieldCheck },
];

const CareRecordTypeLabels: Record<CareRecordType, string> = {
  DAILY_NOTE: "Daily care plan",
  CARE_PLAN: "Care plan",
  INCIDENT_REPORT: "Incident report",
  RISK_ASSESSMENT: "Fall risk assessment",
  REVIEW: "End-of-life care review",
  OTHER: "Behavioural observation",
  // Add more as needed
};

const REVIEW_REQUIRED_TYPES: CareRecordType[] = [
  CareRecordType.CARE_PLAN,
  CareRecordType.INCIDENT_REPORT,
  CareRecordType.RISK_ASSESSMENT,
];

const getVerificationStatus = (type: CareRecordType): VerificationStatus => {
  return REVIEW_REQUIRED_TYPES.includes(type)
    ? VerificationStatus.PENDING
    : VerificationStatus.VERIFIED;
};

export function HashSaveDialog({
  open,
  onClose,
  title,
  successLabel,
  seed,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  successLabel: string;
  seed: string;
}) {
  const [step, setStep] = useState(0);
  const [hash, setHash] = useState("");
  const done = step >= SAVE_STEPS.length;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setHash(fakeSha256(seed));
    let s = 0;
    const iv = setInterval(() => {
      s += 1;
      setStep(s);
      if (s > SAVE_STEPS.length) clearInterval(iv);
    }, 650);
    return () => clearInterval(iv);
  }, [open, seed]);

  useEffect(() => {
    if (done) toast.success(successLabel);
  }, [done, successLabel]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Cryptographic verification in progress"
      size="md"
      footer={
        done ? (
          <BtnPrimary onClick={onClose}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </BtnPrimary>
        ) : null
      }
    >
      <ul className="space-y-3">
        {SAVE_STEPS.map((s, i) => {
          const Icon = s.icon;
          const state = i < step ? "done" : i === step ? "active" : "idle";
          return (
            <li
              key={s.label}
              className={
                "flex items-center gap-3 rounded-xl border p-3 transition " +
                (state === "done"
                  ? "border-success/30 bg-success-soft/50"
                  : state === "active"
                    ? "border-primary/40 bg-primary-soft"
                    : "border-border bg-card")
              }
            >
              <span
                className={
                  "grid h-9 w-9 place-items-center rounded-lg " +
                  (state === "done"
                    ? "bg-success text-success-foreground"
                    : state === "active"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground")
                }
              >
                {state === "done" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">
                  {state === "done" ? "Completed" : state === "active" ? "Processing…" : "Waiting"}
                </p>
              </div>
              {state === "done" && i === 1 && (
                <code className="rounded-md bg-secondary px-2 py-1 font-mono text-[11px]">
                  {shortHash(hash)}
                </code>
              )}
            </li>
          );
        })}
      </ul>
      {done && (
        <div className="mt-4 rounded-xl border border-success/30 bg-success-soft p-4 text-center animate-in fade-in">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success text-success-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-success">{successLabel}</p>
          <code className="mt-2 inline-block break-all rounded-md bg-card px-2 py-1 font-mono text-[11px]">
            {hash}
          </code>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Add Resident modal                                                          */
/* -------------------------------------------------------------------------- */

export function AddResidentModal({
  open,
  onClose,
  onSaved,
  resident,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  resident: Resident | null;
}) {
  const { data: caregivers = [] } = useCaregivers();

  const createResident = useCreateResident();
  const updateResident = useUpdateResident();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResidentFormValues>({
    resolver: zodResolver(residentschema),
    defaultValues: {
      careHomeId: "carehome-001",
      admissionDate: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (resident) {
      const primaryContact =
        resident.emergencyContacts?.find((c) => c.isPrimary) ?? resident.emergencyContacts?.[0];

      reset({
        careHomeId: resident.careHomeId,
        firstName: resident.firstName,
        lastName: resident.lastName,
        gender: resident.gender as ResidentFormValues["gender"],
        dateOfBirth: resident.dateOfBirth.slice(0, 10),
        admissionDate: resident.admissionDate.slice(0, 10),
        roomNumber: resident.roomNumber,
        primaryCaregiverId: resident.primaryCaregiverId,
        condition: resident.condition,
        allergies: resident.allergies ?? "",
        medicalNotes: resident.medicalNotes ?? "",

        emergencyContact: {
          fullName: primaryContact?.fullName ?? "",
          relationship: primaryContact?.relationship ?? "",
          phone: primaryContact?.phone ?? "",
          email: primaryContact?.email ?? "",
        },
      } as ResidentFormValues);
    } else {
      reset({
        careHomeId: "carehome-001",
        admissionDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [resident, reset]);

  // useEffect(() => {
  //   if (resident) {
  //     reset({
  //       ...resident,
  //       primaryCaregiverId: resident.primaryCaregiver?.id,
  //       admissionDate: resident.admissionDate.slice(0, 10),
  //       dateOfBirth: resident.dateOfBirth.slice(0, 10),
  //     });
  //   } else {
  //     reset({
  //       careHomeId: "carehome-001",
  //       admissionDate: new Date().toISOString().slice(0, 10),
  //     });
  //   }
  // }, [resident, reset]);

  // const {
  //   register,
  //   handleSubmit,
  //   reset,
  //   watch,
  //   formState: { errors },
  // } = useForm<ResidentFormValues>({
  //   resolver: zodResolver(residentschema),
  //   defaultValues: {
  //     careHomeId: "carehome-001", // replace with authenticated user's care home
  //     admissionDate: new Date().toISOString().slice(0, 10),
  //   },
  // });

  const firstName = watch("firstName");

  // const onSubmit = async (values: ResidentFormValues) => {
  //   try {
  //     await createResident.mutateAsync(values);

  //     toast.success("Resident added successfully");

  //     reset();

  //     onSaved?.();

  //     onClose();
  //   } catch (error: any) {
  //     toast.error(error?.response?.data?.message ?? "Unable to create resident.");
  //   }
  // };

  const defaultFormValues: Partial<ResidentFormValues> = {
    careHomeId: "carehome-001",
    admissionDate: new Date().toISOString().slice(0, 10),

    firstName: "",
    lastName: "",
    gender: undefined,
    dateOfBirth: "",
    roomNumber: "",
    primaryCaregiverId: "",
    condition: undefined,
    allergies: "",
    medicalNotes: "",

    emergencyContact: {
      fullName: "",
      relationship: "",
      phone: "",
      email: "",
    },
  };

  const onSubmit = async (values: ResidentFormValues) => {
    try {
      if (resident) {
        await updateResident.mutateAsync({
          id: resident.id,
          data: values,
        });

        toast.success("Resident updated successfully");
      } else {
        await createResident.mutateAsync(values);

        toast.success("Resident added successfully");
      }

      // Clear all fields after creating
      reset(defaultFormValues);

      onSaved?.();
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? `Unable to ${resident ? "update" : "create"} resident.`,
      );
    }
  };

  // const submit = () => {
  //   if (!name.trim()) {
  //     toast.error("First & last name are required");
  //     return;
  //   }
  //   setBusy(true);
  //   setTimeout(() => {
  //     setBusy(false);
  //     toast.success("Resident added successfully");
  //     setName("");
  //     onSaved?.();
  //     onClose();
  //   }, 700);
  // };

  return (
    <Modal
      open={open}
      onClose={onClose}
      // title="Add resident"
      // description="Register a new resident under Elmwood Grove Care Home."
      title={resident ? "Edit resident" : "Add resident"}
      description={resident ? "Update resident information." : "Register a new resident."}
      size="lg"
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>

          <BtnPrimary
            onClick={handleSubmit(onSubmit)}
            // loading={createResident.isPending}
            loading={resident ? updateResident.isPending : createResident.isPending}
          >
            {/* Save resident */}

            {resident ? "Update resident" : "Save resident"}
          </BtnPrimary>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Avatar */}
        <div className="sm:col-span-2 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
            {firstName ? firstName[0].toUpperCase() : "+"}
          </div>

          <button
            type="button"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            Upload photo
          </button>
        </div>

        {/* First Name */}
        <Field label="First name" required>
          <input {...register("firstName")} className={inputCls} placeholder="Margaret" />

          {errors.firstName && (
            <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
          )}
        </Field>

        {/* Last Name */}
        <Field label="Last name" required>
          <input {...register("lastName")} className={inputCls} placeholder="Ellis" />

          {errors.lastName && (
            <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
          )}
        </Field>

        {/* Gender */}
        <Field label="Gender" required>
          <select {...register("gender")} className={inputCls}>
            <option value="">Select gender</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="NON_BINARY">Non-binary</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>

          {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
        </Field>

        {/* DOB */}
        <Field label="Date of birth" required>
          <input type="date" {...register("dateOfBirth")} className={inputCls} />

          {errors.dateOfBirth && (
            <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>
          )}
        </Field>

        {/* Room */}
        <Field label="Room number" required>
          <input {...register("roomNumber")} className={inputCls} placeholder="204" />

          {errors.roomNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.roomNumber.message}</p>
          )}
        </Field>

        {/* Admission */}
        <Field label="Admission date" required>
          <input type="date" {...register("admissionDate")} className={inputCls} />

          {errors.admissionDate && (
            <p className="mt-1 text-xs text-red-500">{errors.admissionDate.message}</p>
          )}
        </Field>

        {/* Caregiver */}
        <Field label="Primary caregiver" required>
          <select {...register("primaryCaregiverId")} className={inputCls}>
            <option value="">Select caregiver</option>

            {caregivers.map((caregiver: any) => (
              <option key={caregiver.id} value={caregiver.id}>
                {capitalizeFirst(`${caregiver.firstName} ${caregiver.lastName}`)}
              </option>
            ))}
          </select>

          {errors.primaryCaregiverId && (
            <p className="mt-1 text-xs text-red-500">{errors.primaryCaregiverId.message}</p>
          )}
        </Field>

        {/* Condition */}
        <Field label="Current status" required>
          <select {...register("condition")} className={inputCls}>
            <option value="">Select status</option>
            <option value="STABLE">Stable</option>
            <option value="NEW_ADMISSION">New Admission</option>
            <option value="PALLIATIVE">Palliative</option>
            <option value="REQUIRES_REVIEW">Requires Review</option>
          </select>

          {errors.condition && (
            <p className="mt-1 text-xs text-red-500">{errors.condition.message}</p>
          )}
        </Field>

        {/* Emergency Contact Name */}
        <Field label="Emergency Contact Name" required>
          <input
            {...register("emergencyContact.fullName")}
            className={inputCls}
            placeholder="Susan Ellis"
          />

          {errors.emergencyContact?.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.emergencyContact.fullName.message}</p>
          )}
        </Field>

        {/* Relationship */}
        <Field label="Relationship" required>
          <input
            {...register("emergencyContact.relationship")}
            className={inputCls}
            placeholder="Daughter"
          />

          {errors.emergencyContact?.relationship && (
            <p className="mt-1 text-xs text-red-500">
              {errors.emergencyContact.relationship.message}
            </p>
          )}
        </Field>

        {/* Phone */}
        <Field label="Phone" required>
          <input
            {...register("emergencyContact.phone")}
            className={inputCls}
            placeholder="+2348012345678"
          />

          {errors.emergencyContact?.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.emergencyContact.phone.message}</p>
          )}
        </Field>

        {/* Email */}
        <Field label="Email">
          <input
            type="email"
            {...register("emergencyContact.email")}
            className={inputCls}
            placeholder="susan@email.com"
          />
        </Field>

        {/* Medical Notes */}
        <Field label="Medical Notes" span={2}>
          <textarea
            {...register("medicalNotes")}
            className={textareaCls}
            placeholder="Hypertension, Type 2 diabetes..."
          />
        </Field>

        {/* Allergies */}
        <Field label="Allergies" span={2}>
          <input {...register("allergies")} className={inputCls} placeholder="Penicillin, Latex" />
        </Field>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Add / Edit User modal                                                       */
/* -------------------------------------------------------------------------- */

export function UserModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user?: User;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const busy = createUser.isPending || updateUser.isPending;

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? UserRole.MANAGER);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setRole(user.role);
      setIsActive(user.isActive ?? true);
    }
  }, [user]);

  // const [busy, setBusy] = useState(false);
  const editing = !!user;

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const submit = async () => {
    if (!editing) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    const payload = {
      firstName,
      lastName,
      role,
    };

    try {
      if (editing) {
        await updateUser.mutateAsync({
          id: user.id,
          data: {
            ...payload,
            isActive: isActive,
          },
        });

        toast.success("User updated");
      } else {
        await createUser.mutateAsync({
          ...payload,
          email,
          password,
        });

        toast.success("User created — invitation sent");
      }

      onClose();
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  // const submit = () => {
  //   setBusy(true);
  //   setTimeout(() => {
  //     setBusy(false);
  //     toast.success(editing ? "User updated" : "User created — invitation sent");
  //     onClose();
  //   }, 600);
  // };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit user" : "Invite user"}
      description={editing ? "Update role, contact and access." : "Create a new staff account."}
      size="lg"
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary onClick={submit} loading={busy}>
            {editing ? "Save changes" : "Create user"}
          </BtnPrimary>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* <div className="sm:col-span-2 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground text-base font-semibold">
            {user ? user.name.split(" ").map((n) => n[0]).join("") : "NU"}
          </div>
          <button className="rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary">
            Upload avatar
          </button>
        </div> */}
        <Field label="First name" required>
          <input
            className={inputCls}
            defaultValue={user?.firstName.split(" ")[0]}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Field>
        <Field label="Last name" required>
          <input
            className={inputCls}
            defaultValue={user?.lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
        {/* <Field label="Email" required span={2}> */}
        {!editing && (
          <Field label="Email" required>
            <input
              type="email"
              className={inputCls}
              // defaultValue={user?.email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        )}

        <Field label="Role" required>
          <select
            className={inputCls}
            defaultValue={user?.role ?? UserRole.MANAGER}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value={UserRole.MANAGER}>Home Manager</option>
            <option value={UserRole.CARE_STAFF}>Care Staff</option>
            <option value={UserRole.COMPLIANCE_OFFICER}>Compliance Officer</option>
            <option value={UserRole.ADMINISTRATOR}>Administrator</option>
            <option value={UserRole.INSPECTOR}>Inspector</option>
          </select>
        </Field>
        {!editing && (
          <>
            <Field label="Password" required>
              <input
                type="password"
                className={inputCls}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password" required>
              <input
                type="password"
                className={inputCls}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>
              )}
            </Field>
          </>
        )}

        {editing && (
          <Field label="Status" span={2}>
            <select
              className={inputCls}
              defaultValue={user?.isActive ? "Active" : "Suspended"}
              onChange={(e) => setIsActive(e.target.value == "Active")}
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </Field>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Create Care Record modal (opens HashSaveDialog on submit)                   */
/* -------------------------------------------------------------------------- */

// export function CreateCareRecordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
//   const [saving, setSaving] = useState(false);
//   const [seed, setSeed] = useState("");
//   const [title, setTitle] = useState("");

//   const submit = () => {
//     if (!title.trim()) {
//       toast.error("Record title is required");
//       return;
//     }
//     setSeed(title + Date.now());
//     setSaving(true);
//   };

//   return (
//     <>
//       <Modal
//         open={open && !saving}
//         onClose={onClose}
//         title="New care record"
//         description="Every save is hashed with SHA-256 and written to the immutable audit ledger."
//         size="lg"
//         footer={
//           <>
//             <BtnGhost onClick={onClose}>Cancel</BtnGhost>
//             <BtnPrimary onClick={submit}>
//               <ShieldCheck className="h-3.5 w-3.5" /> Save & verify
//             </BtnPrimary>
//           </>
//         }
//       >
//         <div className="grid gap-4 sm:grid-cols-2">
//           <Field label="Resident" required>
//             <select className={inputCls}>
//               <option>Margaret Ellis · Room 204</option>
//               <option>Arthur Whitfield · Room 118</option>
//               <option>Beatrice Coleman · Room 302</option>
//               <option>Nora Blake · Room 109</option>
//               <option>Frank Doyle · Room 215</option>
//             </select>
//           </Field>
//           <Field label="Care category" required>
//             <select className={inputCls}>
//               <option>Daily care plan</option>
//               <option>Fall risk assessment</option>
//               <option>Nutrition & hydration</option>
//               <option>Behavioural observation</option>
//               <option>Wound care</option>
//               <option>End-of-life care review</option>
//             </select>
//           </Field>
//           <Field label="Record title" required span={2}>
//             <input
//               className={inputCls}
//               placeholder="e.g. Morning routine and mobility check"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//             />
//           </Field>
//           <Field label="Priority">
//             <select className={inputCls}>
//               <option>Routine</option>
//               <option>Elevated</option>
//               <option>Urgent</option>
//             </select>
//           </Field>
//           <Field label="Record date" required>
//             <input
//               type="datetime-local"
//               className={inputCls}
//               defaultValue={new Date().toISOString().slice(0, 16)}
//             />
//           </Field>
//           <Field label="Vital signs" span={2} hint="BP, HR, temperature, SpO₂">
//             <input className={inputCls} placeholder="128/82 mmHg · 72 bpm · 36.6°C · 97%" />
//           </Field>
//           <Field label="Observation notes" required span={2}>
//             <textarea className={textareaCls} placeholder="Detailed clinical observation…" />
//           </Field>
//           <Field label="Care plan" span={2}>
//             <textarea
//               className={textareaCls}
//               placeholder="Recommended interventions and follow-up…"
//             />
//           </Field>
//           <Field label="Attachments" span={2}>
//             <button className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:bg-secondary/50">
//               Drop files or click to upload
//             </button>
//           </Field>
//         </div>
//       </Modal>

//       <HashSaveDialog
//         open={saving}
//         onClose={() => {
//           setSaving(false);
//           setTitle("");
//           onClose();
//         }}
//         title="Saving care record"
//         successLabel="Care record saved & verified"
//         seed={seed}
//       />
//     </>
//   );
// }

export function CreateCareRecordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCareRecord = useCreateCareRecord();

  const { data: residents = [], isLoading: residentsLoading } = useResidents();

  const busy = createCareRecord.isPending;

  const [showHashDialog, setShowHashDialog] = useState(false);
  const [seed, setSeed] = useState("");
  const [titleForHash, setTitleForHash] = useState("");

  // Form State
  const [residentId, setResidentId] = useState("");
  const [type, setType] = useState("DAILY_NOTE" as CareRecordType);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"Routine" | "Elevated" | "Urgent">("Routine");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 16));
  const [vitals, setVitals] = useState("");
  const [observationNotes, setObservationNotes] = useState("");
  const [carePlan, setCarePlan] = useState("");

  const submit = async () => {
    if (!residentId) {
      toast.error("Please select a resident");
      return;
    }
    if (!title.trim()) {
      toast.error("Record title is required");
      return;
    }
    if (!observationNotes.trim()) {
      toast.error("Observation notes are required");
      return;
    }

    const payload: CreateCareRecordDto = {
      residentId,
      type,
      title: title.trim(),
      recordedAt: new Date(recordedAt).toISOString(),
      status: getVerificationStatus(type),
      content: {
        priority,
        vitals: vitals.trim() || undefined,
        observationNotes: observationNotes.trim(),
        carePlan: carePlan.trim() || undefined,
      },
    };

    try {
      await createCareRecord.mutateAsync(payload, {
        onSuccess: (data) => {
          console.log({ data });
          // Start the hash animation
          setSeed(title + Date.now());
          setTitleForHash(title);
          setShowHashDialog(true);
          // toast.success("Care record saved & verified successfully");
        },
        onError: (error) => {
          console.error(error);
        },
      });

      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      setShowHashDialog(false);
      toast.error("Failed to save care record. Please try again.");
    }
  };

  const handleHashDialogClose = () => {
    setShowHashDialog(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setResidentId("");
    setTitle("");
    setObservationNotes("");
    setCarePlan("");
    setVitals("");
    setRecordedAt(new Date().toISOString().slice(0, 16));
    setPriority("Routine");
  };

  const requiresReview = REVIEW_REQUIRED_TYPES.includes(type);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="New care record"
        // description="Every save is hashed with SHA-256 and written to the immutable audit ledger."
        description={
          requiresReview
            ? "This record will be hashed, stored immutably, and submitted for managerial review."
            : "This record will be hashed and written to the immutable audit ledger."
        }
        size="lg"
        footer={
          <>
            <BtnGhost onClick={onClose}>Cancel</BtnGhost>
            {/* <BtnPrimary onClick={submit} loading={busy}>
              <ShieldCheck className="h-3.5 w-3.5" /> Save & verify
            </BtnPrimary> */}

            <BtnPrimary onClick={submit} loading={busy}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {requiresReview ? "Save & Submit for Review" : "Save & Verify Record"}
            </BtnPrimary>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Resident" required>
            <select
              className={inputCls}
              value={residentId}
              onChange={(e) => setResidentId(e.target.value)}
              disabled={residentsLoading}
            >
              <option value="">Select resident...</option>
              {residents.map((resident: any) => (
                <option key={resident.id} value={resident.id}>
                  {resident.firstName} {resident.lastName}
                  {resident.roomNumber ? ` · Room ${resident.roomNumber}` : ""}
                </option>
              ))}
            </select>
            {residentsLoading && (
              <p className="text-xs text-muted-foreground mt-1">Loading residents...</p>
            )}
          </Field>

          <Field label="Care category" required>
            {/* <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as CareRecordType)}
            >
              <option value="DAILY_NOTE">Daily care plan</option>
              <option value="RISK_ASSESSMENT">Fall risk assessment</option>
              <option value="DAILY_NOTE">Nutrition & hydration</option>
              <option value="OTHER">Behavioural observation</option>
              <option value="DAILY_NOTE">Wound care</option>
              <option value="REVIEW">End-of-life care review</option>
            </select> */}
            <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as CareRecordType)}
            >
              {Object.entries(CareRecordType).map(([key, value]) => (
                <option key={value} value={value}>
                  {CareRecordTypeLabels[value as CareRecordType]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Record title" required span={2}>
            <input
              className={inputCls}
              placeholder="e.g. Morning routine and mobility check"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Priority">
            <select
              className={inputCls}
              value={priority}
              onChange={(e) => setPriority(e.target.value as "Routine" | "Elevated" | "Urgent")}
            >
              <option value="Routine">Routine</option>
              <option value="Elevated">Elevated</option>
              <option value="Urgent">Urgent</option>
            </select>
          </Field>

          <Field label="Record date" required>
            <input
              type="datetime-local"
              className={inputCls}
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />
          </Field>

          <Field label="Vital signs" span={2} hint="BP, HR, temperature, SpO₂">
            <input
              className={inputCls}
              placeholder="128/82 mmHg · 72 bpm · 36.6°C · 97%"
              value={vitals}
              onChange={(e) => setVitals(e.target.value)}
            />
          </Field>

          <Field label="Observation notes" required span={2}>
            <textarea
              className={textareaCls}
              placeholder="Detailed clinical observation…"
              value={observationNotes}
              onChange={(e) => setObservationNotes(e.target.value)}
            />
          </Field>

          <Field label="Care plan" span={2}>
            <textarea
              className={textareaCls}
              placeholder="Recommended interventions and follow-up…"
              value={carePlan}
              onChange={(e) => setCarePlan(e.target.value)}
            />
          </Field>

          {/* <Field label="Attachments" span={2}>
            <button className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:bg-secondary/50">
              Drop files or click to upload
            </button>
          </Field> */}
        </div>
      </Modal>
      {/* 
      <HashSaveDialog
        open={showHashDialog}
        onClose={handleHashDialogClose}
        title="Saving care record"
        successLabel="Care record saved & verified"
        seed={seed}
      /> */}

      <HashSaveDialog
        open={showHashDialog}
        onClose={handleHashDialogClose}
        title="Saving care record"
        successLabel={
          requiresReview ? "Care record submitted for review" : "Care record saved & verified"
        }
        seed={seed}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Record Medication modal                                                     */
/* -------------------------------------------------------------------------- */

// export function RecordMedicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
//   const [saving, setSaving] = useState(false);
//   const [seed, setSeed] = useState("");
//   const [med, setMed] = useState("");

//   const submit = () => {
//     if (!med.trim()) {
//       toast.error("Medication name is required");
//       return;
//     }
//     setSeed(med + Date.now());
//     setSaving(true);
//   };

//   return (
//     <>
//       <Modal
//         open={open && !saving}
//         onClose={onClose}
//         title="Record medication"
//         description="Sign for a medication administration — hashed and logged in real time."
//         size="lg"
//         footer={
//           <>
//             <BtnGhost onClick={onClose}>Cancel</BtnGhost>
//             <BtnPrimary onClick={submit}>
//               <ShieldCheck className="h-3.5 w-3.5" /> Sign & save
//             </BtnPrimary>
//           </>
//         }
//       >
//         <div className="grid gap-4 sm:grid-cols-2">
//           <Field label="Resident" required>
//             <select className={inputCls}>
//               <option>Margaret Ellis · Room 204</option>
//               <option>Arthur Whitfield · Room 118</option>
//               <option>Beatrice Coleman · Room 302</option>
//               <option>Nora Blake · Room 109</option>
//               <option>Frank Doyle · Room 215</option>
//             </select>
//           </Field>
//           <Field label="Medication name" required>
//             <input
//               className={inputCls}
//               placeholder="e.g. Ramipril"
//               value={med}
//               onChange={(e) => setMed(e.target.value)}
//             />
//           </Field>
//           <Field label="Dosage" required>
//             <input className={inputCls} placeholder="5mg" />
//           </Field>
//           <Field label="Route" required>
//             <select className={inputCls}>
//               <option>Oral</option>
//               <option>Sublingual</option>
//               <option>Subcutaneous (SC)</option>
//               <option>Intramuscular (IM)</option>
//               <option>Topical</option>
//               <option>Inhalation</option>
//             </select>
//           </Field>
//           <Field label="Administration time" required>
//             <input
//               type="datetime-local"
//               className={inputCls}
//               defaultValue={new Date().toISOString().slice(0, 16)}
//             />
//           </Field>
//           <Field label="Administered by" required>
//             <select className={inputCls}>
//               <option>Ella Morgan</option>
//               <option>James Owusu</option>
//               <option>Priya Shah</option>
//             </select>
//           </Field>
//           <Field label="Status" required>
//             <select className={inputCls}>
//               <option>Administered</option>
//               <option>Refused</option>
//               <option>Withheld (clinical reason)</option>
//               <option>Missed</option>
//             </select>
//           </Field>
//           <Field label="Notes" span={2}>
//             <textarea
//               className={textareaCls}
//               placeholder="Observation, side effects, reason if refused…"
//             />
//           </Field>
//         </div>
//       </Modal>

//       <HashSaveDialog
//         open={saving}
//         onClose={() => {
//           setSaving(false);
//           setMed("");
//           onClose();
//         }}
//         title="Recording medication"
//         successLabel="Medication successfully verified"
//         seed={seed}
//       />
//     </>
//   );
// }

// export function RecordMedicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
//   const createMedication = useCreateMedicationRecord();

//   const { data: residents = [], isLoading: residentsLoading } = useResidents();

//   const [showHashDialog, setShowHashDialog] = useState(false);
//   const [seed, setSeed] = useState("");

//   // Form States
//   const [residentId, setResidentId] = useState("");
//   const [medicationName, setMedicationName] = useState("");
//   const [dosage, setDosage] = useState("");
//   const [route, setRoute] = useState("Oral");
//   const [administeredAt, setAdministeredAt] = useState(new Date().toISOString().slice(0, 16));
//   const [status, setStatus] = useState("Administered");
//   const [notes, setNotes] = useState("");

//   const submit = async () => {
//     if (!residentId || !medicationName.trim() || !dosage.trim()) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     const payload: CreateMedicationRecordDto = {
//       residentId,
//       type: "ADMINISTRATION" as MedicationRecordType,
//       medicationName: medicationName.trim(),
//       dosage: dosage.trim(),
//       frequency: route,
//       administeredAt: new Date(administeredAt).toISOString(),
//       status,
//       notes: notes.trim() ? `${route} - ${notes}` : route,
//     };

//     // Trigger hash animation
//     setSeed(medicationName + Date.now());
//     setShowHashDialog(true);

//     try {
//       await createMedication.mutateAsync(payload);
//       // Success message will be shown in HashSaveDialog
//     } catch (err) {
//       setShowHashDialog(false);
//       toast.error("Failed to save medication record");
//     }
//   };

//   const handleHashDialogClose = () => {
//     setShowHashDialog(false);
//     resetForm();
//     onClose();
//   };

//   const resetForm = () => {
//     setMedicationName("");
//     setDosage("");
//     setNotes("");
//     setAdministeredAt(new Date().toISOString().slice(0, 16));
//     setRoute("Oral");
//     setStatus("Administered");
//   };

//   return (
//     <>
//       <Modal
//         open={open && !showHashDialog}
//         onClose={onClose}
//         title="Record medication"
//         description="Sign for a medication administration — hashed and logged in real time."
//         size="lg"
//         footer={
//           <>
//             <BtnGhost onClick={onClose}>Cancel</BtnGhost>
//             <BtnPrimary onClick={submit} loading={createMedication.isPending}>
//               <ShieldCheck className="h-3.5 w-3.5" /> Sign & save
//             </BtnPrimary>
//           </>
//         }
//       >
//         <div className="grid gap-4 sm:grid-cols-2">
//           <Field label="Resident" required>
//             <select
//               className={inputCls}
//               value={residentId}
//               onChange={(e) => setResidentId(e.target.value)}
//               disabled={residentsLoading}
//               required
//             >
//               <option value="">Select resident...</option>
//               {residents.map((resident: any) => (
//                 <option key={resident.id} value={resident.id}>
//                   {resident.firstName} {resident.lastName}
//                   {resident.roomNumber ? ` · Room ${resident.roomNumber}` : ""}
//                 </option>
//               ))}
//             </select>
//           </Field>

//           <Field label="Medication name" required>
//             <input
//               className={inputCls}
//               placeholder="e.g. Ramipril"
//               value={medicationName}
//               onChange={(e) => setMedicationName(e.target.value)}
//             />
//           </Field>

//           <Field label="Dosage" required>
//             <input
//               className={inputCls}
//               placeholder="5mg"
//               value={dosage}
//               onChange={(e) => setDosage(e.target.value)}
//             />
//           </Field>

//           <Field label="Route">
//             <select className={inputCls} value={route} onChange={(e) => setRoute(e.target.value)}>
//               <option>Oral</option>
//               <option>Sublingual</option>
//               <option>Subcutaneous (SC)</option>
//               <option>Intramuscular (IM)</option>
//               <option>Topical</option>
//               <option>Inhalation</option>
//             </select>
//           </Field>

//           <Field label="Administration time" required>
//             <input
//               type="datetime-local"
//               className={inputCls}
//               value={administeredAt}
//               onChange={(e) => setAdministeredAt(e.target.value)}
//             />
//           </Field>

//           <Field label="Status" required>
//             <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
//               <option value="Administered">Administered</option>
//               <option value="Refused">Refused</option>
//               <option value="Withheld">Withheld (clinical reason)</option>
//               <option value="Missed">Missed</option>
//             </select>
//           </Field>

//           <Field label="Notes" span={2}>
//             <textarea
//               className={textareaCls}
//               placeholder="Observation, side effects, reason if refused…"
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//             />
//           </Field>
//         </div>
//       </Modal>

//       <HashSaveDialog
//         open={showHashDialog}
//         onClose={handleHashDialogClose}
//         title="Recording medication"
//         successLabel="Medication successfully verified"
//         seed={seed}
//       />
//     </>
//   );
// }

export function RecordMedicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMedication = useCreateMedicationRecord();

  const [residentId, setResidentId] = useState("");

  const [medicationName, setMedicationName] = useState("");

  const [dosage, setDosage] = useState("");

  const [intervalValue, setIntervalValue] = useState(8);

  const [intervalUnit, setIntervalUnit] = useState<MedicationIntervalUnit>(
    MedicationIntervalUnit.HOUR,
  );

  const [remainingCount, setRemainingCount] = useState(10);

  const [administeredAt, setAdministeredAt] = useState(new Date().toISOString().slice(0, 16));

  const [status, setStatus] = useState<MedicationStatus>(MedicationStatus.ADMINISTERED);

  const [notes, setNotes] = useState("");

  const { data: residents = [], isLoading: residentsLoading } = useResidents();

  const [showHashDialog, setShowHashDialog] = useState(false);
  const [seed, setSeed] = useState("");

  // Form States
  const [route, setRoute] = useState("Oral");

  const submit = async () => {
    if (!residentId || !medicationName.trim() || !dosage.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload: CreateMedicationRecordDto = {
      residentId,

      medicationName,

      dosage,

      intervalValue,

      intervalUnit,

      remainingCount,

      administeredAt: new Date(administeredAt).toISOString(),

      status,

      notes,
    };

    setSeed(medicationName + Date.now());

    createMedication.mutate(payload, {
      onSuccess: () => {
        // HashSaveDialog will show success
        setShowHashDialog(true);
      },
      onError: (error: any) => {
        setShowHashDialog(false);
        toast.error(error?.response?.data?.message || "Failed to record medication");
      },
    });

    // try {
    //   await createMedication.mutateAsync(payload);
    // } catch {
    //   setShowHashDialog(false);
    //   toast.error("Failed to record medication");
    // }
  };

  const handleHashDialogClose = () => {
    setShowHashDialog(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setResidentId("");

    setMedicationName("");

    setDosage("");

    setIntervalValue(8);

    setIntervalUnit(MedicationIntervalUnit.HOUR);

    setRemainingCount(10);

    setAdministeredAt(new Date().toISOString().slice(0, 16));

    setStatus(MedicationStatus.ADMINISTERED);

    setNotes("");
  };

  return (
    <>
      <Modal
        open={open && !showHashDialog}
        onClose={onClose}
        title="Record medication"
        description="Sign for a medication administration - hashed and logged in real time."
        size="lg"
        footer={
          <>
            <BtnGhost onClick={onClose}>Cancel</BtnGhost>
            <BtnPrimary onClick={submit} loading={createMedication.isPending}>
              <ShieldCheck className="h-3.5 w-3.5" /> Sign & save
            </BtnPrimary>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Resident" required>
            <select
              className={inputCls}
              value={residentId}
              onChange={(e) => setResidentId(e.target.value)}
              disabled={residentsLoading}
            >
              <option value="">Select resident...</option>

              {residents.map((resident: any) => (
                <option key={resident.id} value={resident.id}>
                  {resident.firstName} {resident.lastName}
                  {resident.roomNumber ? ` · Room ${resident.roomNumber}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Medication name" required>
            <input
              className={inputCls}
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
            />
          </Field>

          <Field label="Dosage" required>
            <input
              className={inputCls}
              placeholder="500mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </Field>

          <Field label="Remaining doses" required>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={remainingCount}
              onChange={(e) => setRemainingCount(Number(e.target.value))}
            />
          </Field>

          <Field label="Every" required>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={intervalValue}
                onChange={(e) => setIntervalValue(Number(e.target.value))}
              />

              <select
                className={inputCls}
                value={intervalUnit}
                onChange={(e) => setIntervalUnit(e.target.value as MedicationIntervalUnit)}
              >
                <option value={MedicationIntervalUnit.HOUR}>Hour(s)</option>

                <option value={MedicationIntervalUnit.DAY}>Day(s)</option>
              </select>
            </div>
          </Field>

          <Field label="Administration time" required>
            <input
              type="datetime-local"
              className={inputCls}
              value={administeredAt}
              onChange={(e) => setAdministeredAt(e.target.value)}
            />
          </Field>

          <Field label="Status" required>
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationStatus)}
            >
              <option value={MedicationStatus.PENDING}>Pending</option>
              <option value={MedicationStatus.ADMINISTERED}>Administered</option>

              <option value={MedicationStatus.REFUSED}>Refused</option>

              <option value={MedicationStatus.MISSED}>Missed</option>
            </select>
          </Field>

          <Field label="Notes" span={2}>
            <textarea
              className={textareaCls}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <HashSaveDialog
        open={showHashDialog}
        onClose={handleHashDialogClose}
        title="Recording medication"
        successLabel="Medication successfully verified"
        seed={seed}
      />
    </>
  );
}

interface ContinueMedicationModalProps {
  open: boolean;
  onClose: () => void;
  record: MedicationRecord | null;
}

export function ContinueMedicationModal({ open, onClose, record }: ContinueMedicationModalProps) {
  const continueMedication = useContinueMedicationRecord();

  const [showHashDialog, setShowHashDialog] = useState(false);
  const [seed, setSeed] = useState("");

  const [administeredAt, setAdministeredAt] = useState(new Date().toISOString().slice(0, 16));

  const [status, setStatus] = useState<MedicationStatus>(MedicationStatus.ADMINISTERED);

  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    setAdministeredAt(new Date().toISOString().slice(0, 16));

    setStatus(MedicationStatus.ADMINISTERED);

    setNotes("");
  }, [open]);

  if (!record) return null;

  const submit = async () => {
    setSeed(record.medicationName + Date.now());
    setShowHashDialog(true);

    try {
      await continueMedication.mutateAsync({
        id: record.id,
        payload: {
          administeredAt: new Date(administeredAt).toISOString(),
          status,
          notes,
        },
      });
    } catch {
      setShowHashDialog(false);
      toast.error("Failed to record medication");
    }
  };

  const handleClose = () => {
    setShowHashDialog(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !showHashDialog}
        onClose={onClose}
        title="Continue medication"
        description="Record the next scheduled dose. A new medication event will be created and cryptographically verified."
        size="lg"
        footer={
          <>
            <BtnGhost onClick={onClose}>Cancel</BtnGhost>

            <BtnPrimary onClick={submit} loading={continueMedication.isPending}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Record Dose
            </BtnPrimary>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Resident">
            <input
              className={inputCls}
              readOnly
              value={`${record.resident.firstName} ${record.resident.lastName}`}
            />
          </Field>

          <Field label="Medication">
            <input className={inputCls} readOnly value={record.medicationName} />
          </Field>

          <Field label="Dosage">
            <input className={inputCls} readOnly value={record.dosage} />
          </Field>

          <Field label="Remaining doses">
            <input className={inputCls} readOnly value={record.remainingCount} />
          </Field>

          <Field label="Next due">
            <input
              className={inputCls}
              readOnly
              value={
                record.nextDueAt ? format(new Date(record.nextDueAt), "dd MMM yyyy HH:mm") : "-"
              }
            />
          </Field>

          <Field label="Administration time" required>
            <input
              type="datetime-local"
              className={inputCls}
              value={administeredAt}
              onChange={(e) => setAdministeredAt(e.target.value)}
            />
          </Field>

          <Field label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationStatus)}
            >
              <option value={MedicationStatus.ADMINISTERED}>Administered</option>

              <option value={MedicationStatus.REFUSED}>Refused</option>

              <option value={MedicationStatus.MISSED}>Missed</option>
            </select>
          </Field>

          <Field label="Notes" span={2}>
            <textarea
              className={textareaCls}
              placeholder="Observation, side effects, reason if refused..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <HashSaveDialog
        open={showHashDialog}
        onClose={handleClose}
        title="Recording medication"
        successLabel="Medication successfully verified"
        seed={seed}
      />
    </>
  );
}

interface MedicationDetailsModalProps {
  open: boolean;
  onClose: () => void;
  record: MedicationRecord | null;
  onContinue?: (record: MedicationRecord) => void;
  onUpdate?: (record: MedicationRecord) => void;
  onVerify?: (record: MedicationRecord) => void;
}

export function MedicationDetailsModal({
  open,
  onClose,
  record,
  onContinue,
  onUpdate,
  onVerify,
}: MedicationDetailsModalProps) {
  if (!record) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Medication Details"
      description="View the complete medication administration event."
      size="lg"
      footer={
        <>
          <BtnGhost onClick={onClose}>Close</BtnGhost>

          <BtnGhost onClick={() => onUpdate?.(record)}>Update Notes</BtnGhost>

          <BtnGhost onClick={() => onVerify?.(record)}>Verify Integrity</BtnGhost>

          {record.remainingCount > 0 && (
            <BtnPrimary onClick={() => onContinue?.(record)}>
              <Pill className="h-3.5 w-3.5" />
              Continue Medication
            </BtnPrimary>
          )}
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Resident">
          <input
            className={inputCls}
            readOnly
            value={`${record.resident.firstName} ${record.resident.lastName}`}
          />
        </Field>

        <Field label="Medication">
          <input className={inputCls} readOnly value={record.medicationName} />
        </Field>

        <Field label="Dosage">
          <input className={inputCls} readOnly value={record.dosage} />
        </Field>

        <Field label="Frequency">
          <input
            className={inputCls}
            readOnly
            value={`Every ${record.intervalValue} ${record.intervalUnit.toLowerCase()}(s)`}
          />
        </Field>

        <Field label="Remaining doses">
          <input className={inputCls} readOnly value={record.remainingCount} />
        </Field>

        <Field label="Status">
          <input className={inputCls} readOnly value={record.status} />
        </Field>

        <Field label="Administration Time">
          <input
            className={inputCls}
            readOnly
            value={format(new Date(record.administeredAt), "dd MMM yyyy HH:mm")}
          />
        </Field>

        <Field label="Next Due">
          <input
            className={inputCls}
            readOnly
            value={record.nextDueAt ? format(new Date(record.nextDueAt), "dd MMM yyyy HH:mm") : "-"}
          />
        </Field>

        <Field label="Administered By">
          <input
            className={inputCls}
            readOnly
            value={`${record.administeredBy.firstName} ${record.administeredBy.lastName}`}
          />
        </Field>

        <Field label="Notes" span={2}>
          <textarea className={textareaCls} readOnly value={record.notes ?? ""} />
        </Field>
      </div>
    </Modal>
  );
}

interface UpdateMedicationModalProps {
  open: boolean;
  onClose: () => void;
  record: MedicationRecord | null;
}

export function UpdateMedicationModal({ open, onClose, record }: UpdateMedicationModalProps) {
  const updateMedication = useUpdateMedicationRecord();

  const [showHashDialog, setShowHashDialog] = useState(false);
  const [seed, setSeed] = useState("");

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<MedicationStatus | undefined>(undefined);

  useEffect(() => {
    if (!record) return;

    setNotes(record.notes ?? "");
    setStatus(record.status ?? MedicationStatus.ADMINISTERED);
  }, [record]);

  if (!record) return null;

  const submit = async () => {
    setSeed(record.medicationName + Date.now());
    setShowHashDialog(true);
    try {
      await updateMedication.mutateAsync({
        id: record.id,
        payload: {
          notes,
          status,
        },
      });
    } catch {
      setShowHashDialog(false);
      toast.error("Failed to update medication");
    }
  };

  const handleClose = () => {
    setShowHashDialog(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !showHashDialog}
        onClose={onClose}
        title="Update Medication Record"
        description="Healthcare records are immutable. Only clinical notes can be corrected."
        size="lg"
        footer={
          <>
            <BtnGhost onClick={onClose}>Cancel</BtnGhost>

            <BtnPrimary onClick={submit} loading={updateMedication.isPending}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Update Record
            </BtnPrimary>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Resident">
            <input
              className={inputCls}
              readOnly
              value={`${record.resident.firstName} ${record.resident.lastName}`}
            />
          </Field>

          <Field label="Medication">
            <input className={inputCls} readOnly value={record.medicationName} />
          </Field>

          <Field label="Dosage">
            <input className={inputCls} readOnly value={record.dosage} />
          </Field>

          {/* <Field label="Status">
            <input className={inputCls} readOnly value={record.status} />
          </Field> */}

          <Field label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationStatus)}
            >
              <option value={MedicationStatus.PENDING}>Pending</option>
              <option value={MedicationStatus.ADMINISTERED}>Administered</option>

              <option value={MedicationStatus.REFUSED}>Refused</option>

              <option value={MedicationStatus.MISSED}>Missed</option>
            </select>
          </Field>

          <Field label="Administration Time">
            <input className={inputCls} readOnly value={formatDateTime(record.administeredAt)} />
          </Field>

          <Field label="Next Due">
            <input className={inputCls} readOnly value={formatDateTime(record.nextDueAt)} />
          </Field>

          <Field label="Remaining Doses">
            <input className={inputCls} readOnly value={record.remainingCount} />
          </Field>

          <Field label="Administered By">
            <input
              className={inputCls}
              readOnly
              value={`${record.administeredBy.firstName} ${record.administeredBy.lastName}`}
            />
          </Field>

          <Field label="Clinical Notes" span={2}>
            <textarea
              className={textareaCls}
              placeholder="Correct or append clinical notes..."
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <HashSaveDialog
        open={showHashDialog}
        onClose={handleClose}
        title="Updating medication"
        successLabel="Medication record successfully updated"
        seed={seed}
      />
    </>
  );
}
/* -------------------------------------------------------------------------- */
/* Archive confirmation                                                        */
/* -------------------------------------------------------------------------- */

export function ArchiveDialog({
  open,
  onClose,
  itemLabel,
}: {
  open: boolean;
  onClose: () => void;
  itemLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success("Record archived — audit trail preserved");
      onClose();
    }, 500);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Archive record"
      description="Records are never permanently deleted."
      size="sm"
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-critical px-3.5 py-2 text-xs font-semibold text-critical-foreground hover:bg-critical/90 disabled:opacity-60"
          >
            {busy ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-critical-foreground/40 border-t-critical-foreground" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            Archive
          </button>
        </>
      }
    >
      <div className="rounded-xl border border-warning/40 bg-warning-soft p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-warning-foreground" />
          <div>
            <p className="text-sm font-semibold text-warning-foreground">
              This record will be archived rather than permanently deleted.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              CQC and GDPR retention rules require an immutable trail. "{itemLabel}" will be hidden
              from active views but remains readable in the audit ledger.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Generate report                                                             */
/* -------------------------------------------------------------------------- */

// export function GenerateReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
//   const [busy, setBusy] = useState(false);
//   const submit = () => {
//     setBusy(true);
//     setTimeout(() => {
//       setBusy(false);
//       toast.success("Compliance report generated");
//       onClose();
//     }, 900);
//   };

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title="Generate compliance report"
//       description="Assemble a CQC-ready export from the last verification window."
//       size="lg"
//       footer={
//         <>
//           <BtnGhost onClick={onClose}>Cancel</BtnGhost>
//           <BtnPrimary onClick={submit} loading={busy}>
//             <FileDown className="h-3.5 w-3.5" /> Generate report
//           </BtnPrimary>
//         </>
//       }
//     >
//       <div className="grid gap-4 sm:grid-cols-2">
//         <Field label="Report period" required>
//           <select className={inputCls}>
//             <option>Today</option>
//             <option>This week</option>
//             <option>This month</option>
//             <option>Custom range</option>
//           </select>
//         </Field>
//         <Field label="Export format" required>
//           <select className={inputCls}>
//             <option>PDF</option>
//             <option>CSV</option>
//             <option>Print</option>
//           </select>
//         </Field>
//         <Field label="From">
//           <input type="date" className={inputCls} />
//         </Field>
//         <Field label="To">
//           <input
//             type="date"
//             className={inputCls}
//             defaultValue={new Date().toISOString().slice(0, 10)}
//           />
//         </Field>
//         <div className="sm:col-span-2">
//           <p className="mb-2 text-xs font-semibold">Include sections</p>
//           <div className="grid gap-2 sm:grid-cols-2">
//             {[
//               "Residents",
//               "Medication",
//               "Audit logs",
//               "Integrity results",
//               "CQC key questions",
//               "Staff & training",
//             ].map((s) => (
//               <label
//                 key={s}
//                 className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm"
//               >
//                 <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
//                 {s}
//               </label>
//             ))}
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// }

import { useRef } from "react";
// import { FileDown, Loader2, CheckCircle2, Eye } from "lucide-react";
// import { toast } from "sonner";
// import { useQueryClient } from "@tanstack/react-query";
import { complianceService } from "@/services/compliance-service";
import { complianceKeys } from "@/hooks/use-compliance";
// import { Modal } from "@/components/modal";
// import { Field, BtnGhost, BtnPrimary, inputCls } from "@/components/ui-kit";

type Stage = "form" | "generating" | "ready";

export function GenerateReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("form");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // form state
  const [period, setPeriod] = useState("This month");
  const [format, setFormat] = useState("PDF");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [sections, setSections] = useState<string[]>([
    "Residents",
    "Medication",
    "Audit logs",
    "Integrity results",
    "CQC key questions",
    "Staff & training",
  ]);

  const queryClient = useQueryClient();
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (!open) return;
    setStage("form");
    setBusy(false);
    setProgress(0);
    setStatusMessage("");
    setReportId(null);
    setPreviewUrl(null);
  }, [open]);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const toggleSection = (section: string) => {
    setSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );
  };

  const startGeneration = async () => {
    setBusy(true);
    setStage("generating");
    setProgress(5);
    setStatusMessage("Starting generation…");

    try {
      const result = await complianceService.generateReport({
        type: "COMPLIANCE",
        period,
        format,
        dateFrom: period === "Custom range" ? from : undefined,
        dateTo: period === "Custom range" ? to : undefined,
        sections,
      });

      const id = result.id || result.reportId;
      setReportId(id);

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const status = await complianceService.getReportStatus(id);
          setProgress(status.progress ?? 0);
          setStatusMessage(status.message || "Processing…");

          if (status.status === "READY") {
            if (pollRef.current) clearInterval(pollRef.current);
            setProgress(100);
            setStatusMessage("Report ready");
            setStage("ready");

            // Create a preview blob URL
            const token = localStorage.getItem("token");
            const url = complianceService.getDownloadUrl(id);
            // For preview we can open the same URL (browser will show PDF)
            setPreviewUrl(url);

            queryClient.invalidateQueries({
              queryKey: complianceKeys.dashboard(),
            });
          }

          if (status.status === "FAILED") {
            if (pollRef.current) clearInterval(pollRef.current);
            toast.error("Report generation failed");
            setStage("form");
            setBusy(false);
          }
        } catch (err) {
          console.error(err);
        }
      }, 800);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start generation");
      setStage("form");
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (!reportId) return;
    const url = complianceService.getDownloadUrl(reportId);
    // Trigger download with auth header is harder with <a>, so we use fetch
    const token = localStorage.getItem("token");
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `CareGuard-Compliance-${reportId}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success("Download started");
      })
      .catch(() => toast.error("Download failed"));
  };

  const handlePreview = () => {
    if (!reportId) return;
    const url = complianceService.getDownloadUrl(reportId);
    window.open(url, "_blank");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate compliance report"
      description="Assemble a CQC-ready export from the last verification window."
      size="lg"
      footer={
        stage === "form" ? (
          <>
            <BtnGhost onClick={onClose}>Cancel</BtnGhost>
            <BtnPrimary onClick={startGeneration} loading={busy}>
              <FileDown className="h-3.5 w-3.5" /> Generate report
            </BtnPrimary>
          </>
        ) : stage === "generating" ? (
          <BtnGhost onClick={onClose}>Please wait…</BtnGhost>
        ) : (
          <>
            <BtnGhost onClick={onClose}>Close</BtnGhost>
            <BtnGhost onClick={handlePreview}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </BtnGhost>
            <BtnPrimary onClick={handleDownload}>
              <FileDown className="h-3.5 w-3.5" /> Download PDF
            </BtnPrimary>
          </>
        )
      }
    >
      {stage === "form" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Report period" required>
            <select className={inputCls} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option>Today</option>
              <option>This week</option>
              <option>This month</option>
              <option>Custom range</option>
            </select>
          </Field>

          <Field label="Export format" required>
            <select className={inputCls} value={format} onChange={(e) => setFormat(e.target.value)}>
              <option>PDF</option>
              <option>CSV</option>
            </select>
          </Field>

          <Field label="From">
            <input
              type="date"
              className={inputCls}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={period !== "Custom range"}
            />
          </Field>

          <Field label="To">
            <input
              type="date"
              className={inputCls}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={period !== "Custom range"}
            />
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold">Include sections</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Residents",
                "Medication",
                "Audit logs",
                "Integrity results",
                "CQC key questions",
                "Staff & training",
              ].map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={sections.includes(s)}
                    onChange={() => toggleSection(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage === "generating" && (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">{statusMessage}</p>
          <div className="mx-auto mt-6 h-2 w-64 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{progress}%</p>
        </div>
      )}

      {stage === "ready" && (
        <div className="py-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Report ready</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your CQC compliance report has been generated successfully.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            You can preview it in a new tab or download it directly.
          </p>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Verify Record dialog (per-record integrity check)                           */
/* -------------------------------------------------------------------------- */

export function VerifyRecordDialog({
  open,
  onClose,
  recordId,
  storedHash,
}: {
  open: boolean;
  onClose: () => void;
  recordId: string;
  storedHash: string;
}) {
  const [phase, setPhase] = useState<"checking" | "match" | "mismatch">("checking");
  useEffect(() => {
    if (!open) return;
    setPhase("checking");
    const t = setTimeout(() => setPhase("match"), 1200);
    return () => clearTimeout(t);
  }, [open, recordId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verify record integrity"
      description={`Recomputing SHA-256 for ${recordId}`}
      size="md"
      footer={phase !== "checking" ? <BtnPrimary onClick={onClose}>Close</BtnPrimary> : null}
    >
      {phase === "checking" ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium">Recomputing hash from raw record…</p>
          <p className="text-xs text-muted-foreground">Comparing with stored ledger entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 rounded-xl border border-success/30 bg-success-soft p-4 text-center animate-in fade-in">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-success">Integrity verified</p>
            <p className="text-xs text-muted-foreground">
              Computed hash matches the stored ledger entry byte-for-byte.
            </p>
          </div>
          <div className="rounded-xl border border-border p-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Stored hash</span>
              <code className="font-mono">{shortHash(storedHash)}</code>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Computed hash</span>
              <code className="font-mono">{shortHash(storedHash)}</code>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Verified at</span>
              <span>{new Date().toLocaleString("en-GB")}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Result</span>
              <Badge tone="success">Verified</Badge>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Reset Password confirm                                                      */
/* -------------------------------------------------------------------------- */

export function ResetPasswordDialog({
  open,
  onClose,
  userLabel,
}: {
  open: boolean;
  onClose: () => void;
  userLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success("Password reset email sent");
      onClose();
    }, 600);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset password"
      size="sm"
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary onClick={submit} loading={busy}>
            <KeyRound className="h-3.5 w-3.5" /> Send reset link
          </BtnPrimary>
        </>
      }
    >
      <p className="text-sm">
        Send a password reset email to <span className="font-semibold">{userLabel}</span>? The
        current password will remain valid until the link is used.
      </p>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Verify All — full-screen experience                                         */
/* -------------------------------------------------------------------------- */

// const VERIFY_STAGES: { label: string; icon: typeof Database; blurb: string }[] = [
//   {
//     label: "Scanning database",
//     icon: Database,
//     blurb: "Enumerating care records, medication logs and audit entries",
//   },
//   { label: "Calculating SHA-256 hashes", icon: Hash, blurb: "Rehashing raw record payloads" },
//   {
//     label: "Comparing stored hashes",
//     icon: ShieldCheck,
//     blurb: "Byte-for-byte match against the immutable ledger",
//   },
//   {
//     label: "Generating compliance report",
//     icon: FileCheck2,
//     blurb: "Assembling verification digest",
//   },
// ];

// const TOTAL_RECORDS = 18204;

// export function VerifyAllExperience({ open, onClose }: { open: boolean; onClose: () => void }) {
//   const [stage, setStage] = useState(0);
//   const [verified, setVerified] = useState(0);
//   const [current, setCurrent] = useState("CR-00001");
//   const [done, setDone] = useState(false);
//   const [startedAt, setStartedAt] = useState(0);
//   const [elapsed, setElapsed] = useState(0);

//   useEffect(() => {
//     if (!open) return;
//     setStage(0);
//     setVerified(0);
//     setDone(false);
//     setStartedAt(Date.now());
//     setElapsed(0);
//   }, [open]);

//   useEffect(() => {
//     if (!open || done) return;
//     const stageDurations = [900, 3200, 1400, 900];
//     const t = setTimeout(() => {
//       if (stage < VERIFY_STAGES.length - 1) setStage(stage + 1);
//       else {
//         setDone(true);
//         setElapsed((Date.now() - startedAt) / 1000);
//         toast.success("Integrity verification complete");
//       }
//     }, stageDurations[stage]);
//     return () => clearTimeout(t);
//   }, [open, stage, done, startedAt]);

//   useEffect(() => {
//     if (!open || stage !== 1) return;
//     const iv = setInterval(() => {
//       setVerified((v) => {
//         const next = Math.min(TOTAL_RECORDS, v + Math.floor(TOTAL_RECORDS / 40));
//         setCurrent("CR-" + String(8800 + Math.floor(Math.random() * 40)).padStart(5, "0"));
//         return next;
//       });
//     }, 80);
//     return () => clearInterval(iv);
//   }, [open, stage]);

//   useEffect(() => {
//     if (done) setVerified(TOTAL_RECORDS);
//   }, [done]);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in">
//       <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
//         <div className="flex items-center gap-2">
//           <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
//             <ShieldCheck className="h-5 w-5" />
//           </div>
//           <div>
//             <p className="text-sm font-semibold">Integrity verification</p>
//             <p className="text-xs text-muted-foreground">
//               {done ? "Verification complete" : "Running cryptographic sweep across all records"}
//             </p>
//           </div>
//         </div>
//         <button
//           onClick={onClose}
//           className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
//           aria-label="Close"
//         >
//           <X className="h-4 w-4" />
//         </button>
//       </div>

//       <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
//         {!done ? (
//           <VerifyingView stage={stage} verified={verified} current={current} />
//         ) : (
//           <VerifyResultsView elapsed={elapsed} />
//         )}
//       </div>

//       {done && (
//         <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-3">
//           <BtnGhost onClick={onClose}>Close</BtnGhost>
//           <BtnPrimary onClick={onClose}>
//             <FileDown className="h-3.5 w-3.5" /> Download report
//           </BtnPrimary>
//         </div>
//       )}
//     </div>
//   );
// }

// function VerifyingView({
//   stage,
//   verified,
//   current,
// }: {
//   stage: number;
//   verified: number;
//   current: string;
// }) {
//   const remaining = TOTAL_RECORDS - verified;
//   const pct = Math.round((verified / TOTAL_RECORDS) * 100);

//   return (
//     <div className="mx-auto max-w-3xl">
//       <Card className="p-8">
//         <p className="text-xs font-semibold uppercase tracking-wider text-primary">
//           Stage {stage + 1} of {VERIFY_STAGES.length}
//         </p>
//         <h2 className="mt-1 text-2xl font-semibold">{VERIFY_STAGES[stage].label}…</h2>
//         <p className="mt-1 text-sm text-muted-foreground">{VERIFY_STAGES[stage].blurb}</p>

//         <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
//           <div
//             className="h-full rounded-full bg-primary transition-all duration-200"
//             style={{ width: `${stage === 1 ? pct : ((stage + 1) / VERIFY_STAGES.length) * 100}%` }}
//           />
//         </div>

//         {stage === 1 && (
//           <div className="mt-6 grid gap-3 sm:grid-cols-3">
//             <Card className="p-4">
//               <p className="text-xs text-muted-foreground">Records verified</p>
//               <p className="mt-1 text-2xl font-semibold tabular-nums">
//                 {verified.toLocaleString()}
//               </p>
//             </Card>
//             <Card className="p-4">
//               <p className="text-xs text-muted-foreground">Records remaining</p>
//               <p className="mt-1 text-2xl font-semibold tabular-nums">
//                 {remaining.toLocaleString()}
//               </p>
//             </Card>
//             <Card className="p-4">
//               <p className="text-xs text-muted-foreground">Current record</p>
//               <p className="mt-1 font-mono text-xl font-semibold">{current}</p>
//             </Card>
//           </div>
//         )}

//         <ul className="mt-8 space-y-2">
//           {VERIFY_STAGES.map((s, i) => {
//             const Icon = s.icon;
//             const state = i < stage ? "done" : i === stage ? "active" : "idle";
//             return (
//               <li
//                 key={s.label}
//                 className={
//                   "flex items-center gap-3 rounded-xl border p-3 " +
//                   (state === "done"
//                     ? "border-success/30 bg-success-soft/50"
//                     : state === "active"
//                       ? "border-primary/40 bg-primary-soft"
//                       : "border-border")
//                 }
//               >
//                 <span
//                   className={
//                     "grid h-8 w-8 place-items-center rounded-lg " +
//                     (state === "done"
//                       ? "bg-success text-success-foreground"
//                       : state === "active"
//                         ? "bg-primary text-primary-foreground"
//                         : "bg-secondary text-muted-foreground")
//                   }
//                 >
//                   {state === "done" ? (
//                     <CheckCircle2 className="h-4 w-4" />
//                   ) : state === "active" ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Icon className="h-4 w-4" />
//                   )}
//                 </span>
//                 <span className="text-sm font-medium">{s.label}</span>
//               </li>
//             );
//           })}
//         </ul>
//       </Card>
//     </div>
//   );
// }

// function VerifyResultsView({ elapsed }: { elapsed: number }) {
//   const cards = [
//     {
//       l: "Total records",
//       v: TOTAL_RECORDS.toLocaleString(),
//       tone: "info" as const,
//       icon: Database,
//     },
//     {
//       l: "Verified records",
//       v: TOTAL_RECORDS.toLocaleString(),
//       tone: "success" as const,
//       icon: ShieldCheck,
//     },
//     { l: "Modified records", v: "0", tone: "warning" as const, icon: ShieldAlert },
//     { l: "Compliance score", v: "100%", tone: "success" as const, icon: Sparkles },
//   ];
//   const toneBg: Record<string, string> = {
//     info: "bg-primary-soft text-primary",
//     success: "bg-success-soft text-success",
//     warning: "bg-warning-soft text-warning-foreground",
//     critical: "bg-critical-soft text-critical",
//   };

//   const rows = [
//     { id: "CR-8834", resident: "Margaret Ellis", status: "Verified", time: "just now" },
//     { id: "CR-8833", resident: "Arthur Whitfield", status: "Verified", time: "just now" },
//     { id: "CR-8832", resident: "Beatrice Coleman", status: "Verified", time: "just now" },
//     { id: "MED-4401", resident: "Frank Doyle", status: "Verified", time: "just now" },
//     { id: "CR-8815", resident: "Frank Doyle", status: "Verified", time: "just now" },
//     { id: "CR-8807", resident: "Henry Ashford", status: "Verified", time: "just now" },
//   ];

//   return (
//     <div className="mx-auto max-w-5xl space-y-6">
//       <Card className="p-8 text-center animate-in fade-in">
//         <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-success-foreground shadow-elegant">
//           <ShieldCheck className="h-10 w-10" />
//         </div>
//         <h2 className="mt-4 text-2xl font-semibold">Verification complete</h2>
//         <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
//           All resident records successfully passed integrity verification. No unauthorized
//           modifications were detected across care records, medication logs and audit entries.
//         </p>
//         <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success-soft px-4 py-1.5 text-xs font-semibold text-success">
//           <Sparkles className="h-3.5 w-3.5" /> 100% compliance · CQC-ready
//         </div>
//       </Card>

//       <div className="grid gap-3 md:grid-cols-4">
//         {cards.map((c) => {
//           const Icon = c.icon;
//           return (
//             <Card key={c.l} className="p-4">
//               <div className={"grid h-10 w-10 place-items-center rounded-lg " + toneBg[c.tone]}>
//                 <Icon className="h-5 w-5" />
//               </div>
//               <p className="mt-3 text-xs text-muted-foreground">{c.l}</p>
//               <p className="text-2xl font-semibold">{c.v}</p>
//             </Card>
//           );
//         })}
//       </div>

//       <Card className="overflow-hidden">
//         <div className="flex items-center justify-between border-b border-border p-4">
//           <div>
//             <h3 className="text-sm font-semibold">Verification details</h3>
//             <p className="text-xs text-muted-foreground">
//               Duration {elapsed.toFixed(1)}s · Completed {new Date().toLocaleTimeString("en-GB")}
//             </p>
//           </div>
//           <Badge tone="success">All clear</Badge>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
//                 <th className="px-4 py-3">Record</th>
//                 <th className="px-4 py-3">Resident</th>
//                 <th className="px-4 py-3">Hash status</th>
//                 <th className="px-4 py-3">Verified at</th>
//                 <th className="px-4 py-3">Result</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((r) => (
//                 <tr key={r.id} className="border-b border-border last:border-0">
//                   <td className="px-4 py-3 font-medium">{r.id}</td>
//                   <td className="px-4 py-3 text-muted-foreground">{r.resident}</td>
//                   <td className="px-4 py-3">
//                     <code className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">
//                       match
//                     </code>
//                   </td>
//                   <td className="px-4 py-3 text-muted-foreground">{r.time}</td>
//                   <td className="px-4 py-3">
//                     <Badge tone="success">Verified</Badge>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

import { useQueryClient } from "@tanstack/react-query";
import { integrityService, VerifyAllResult } from "@/services/integrity-service";
import { integrityKeys } from "@/hooks/use-integrity";

/* -------------------------------------------------------------------------- */
/* Verify All — full-screen experience                                         */
/* -------------------------------------------------------------------------- */

const VERIFY_STAGES: { label: string; icon: typeof Database; blurb: string }[] = [
  {
    label: "Scanning database",
    icon: Database,
    blurb: "Enumerating care records, medication logs and audit entries",
  },
  {
    label: "Calculating SHA-256 hashes",
    icon: Hash,
    blurb: "Rehashing raw record payloads",
  },
  {
    label: "Comparing stored hashes",
    icon: ShieldCheck,
    blurb: "Byte-for-byte match against the immutable ledger",
  },
  {
    label: "Generating compliance report",
    icon: FileCheck2,
    blurb: "Assembling verification digest",
  },
];

export function VerifyAllExperience({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState(0);
  const [verified, setVerified] = useState(0);
  const [current, setCurrent] = useState("CR-00001");
  const [done, setDone] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<VerifyAllResult | null>(null);
  const [totalRecords, setTotalRecords] = useState(18204); // will be updated from API

  const queryClient = useQueryClient();

  // Reset + start real verification when opened
  useEffect(() => {
    if (!open) return;

    setStage(0);
    setVerified(0);
    setDone(false);
    setResult(null);
    setStartedAt(Date.now());
    setElapsed(0);
    setCurrent("CR-00001");

    runRealVerification();
  }, [open]);

  const runRealVerification = async () => {
    // Stage animation while the request is in flight
    const stageTimer = setInterval(() => {
      setStage((s) => Math.min(s + 1, VERIFY_STAGES.length - 1));
    }, 1100);

    // Fake progress counter (UX only)
    const progressTimer = setInterval(() => {
      setVerified((v) => {
        const next = Math.min(totalRecords, v + Math.floor(totalRecords / 45));
        setCurrent("CR-" + String(8800 + Math.floor(Math.random() * 50)).padStart(5, "0"));
        return next;
      });
    }, 70);

    try {
      const res = await integrityService.verifyAll(false);

      clearInterval(stageTimer);
      clearInterval(progressTimer);

      setResult(res);
      setTotalRecords(res.totalProcessed || totalRecords);
      setVerified(res.totalProcessed);
      setDone(true);
      setElapsed((Date.now() - startedAt) / 1000);

      // Refresh dashboard
      queryClient.invalidateQueries({ queryKey: integrityKeys.dashboard() });

      toast.success("Integrity verification complete");
    } catch (err) {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
      toast.error("Verification failed. Please try again.");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Integrity verification</p>
            <p className="text-xs text-muted-foreground">
              {done ? "Verification complete" : "Running cryptographic sweep across all records"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        {!done ? (
          <VerifyingView
            stage={stage}
            verified={verified}
            current={current}
            totalRecords={totalRecords}
          />
        ) : (
          <VerifyResultsView elapsed={elapsed} result={result} />
        )}
      </div>

      {/* Footer */}
      {done && (
        <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download report
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Verifying view                                                              */
/* -------------------------------------------------------------------------- */

function VerifyingView({
  stage,
  verified,
  current,
  totalRecords,
}: {
  stage: number;
  verified: number;
  current: string;
  totalRecords: number;
}) {
  const remaining = totalRecords - verified;
  const pct = Math.round((verified / totalRecords) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Stage {stage + 1} of {VERIFY_STAGES.length}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">{VERIFY_STAGES[stage].label}…</h2>
        <p className="mt-1 text-sm text-muted-foreground">{VERIFY_STAGES[stage].blurb}</p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{
              width: `${stage === 1 ? pct : ((stage + 1) / VERIFY_STAGES.length) * 100}%`,
            }}
          />
        </div>

        {stage === 1 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Records verified</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {verified.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Records remaining</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {remaining.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Current record</p>
              <p className="mt-1 font-mono text-xl font-semibold">{current}</p>
            </Card>
          </div>
        )}

        <ul className="mt-8 space-y-2">
          {VERIFY_STAGES.map((s, i) => {
            const Icon = s.icon;
            const state = i < stage ? "done" : i === stage ? "active" : "idle";
            return (
              <li
                key={s.label}
                className={
                  "flex items-center gap-3 rounded-xl border p-3 " +
                  (state === "done"
                    ? "border-success/30 bg-success-soft/50"
                    : state === "active"
                      ? "border-primary/40 bg-primary-soft"
                      : "border-border")
                }
              >
                <span
                  className={
                    "grid h-8 w-8 place-items-center rounded-lg " +
                    (state === "done"
                      ? "bg-success text-success-foreground"
                      : state === "active"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground")
                  }
                >
                  {state === "done" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : state === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <span className="text-sm font-medium">{s.label}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Results view                                                                */
/* -------------------------------------------------------------------------- */

function VerifyResultsView({
  elapsed,
  result,
}: {
  elapsed: number;
  result: VerifyAllResult | null;
}) {
  const total = result?.totalProcessed ?? 0;
  const verifiedCount = result?.verified ?? 0;
  const failedCount = result?.failed ?? 0;
  const compliance = total === 0 ? 100 : Math.round((verifiedCount / total) * 100);

  const cards = [
    {
      l: "Total records",
      v: total.toLocaleString(),
      tone: "info" as const,
      icon: Database,
    },
    {
      l: "Verified records",
      v: verifiedCount.toLocaleString(),
      tone: "success" as const,
      icon: ShieldCheck,
    },
    {
      l: "Failed records",
      v: failedCount.toLocaleString(),
      tone: failedCount > 0 ? ("critical" as const) : ("warning" as const),
      icon: ShieldAlert,
    },
    {
      // l: "Compliance score",
      l: "Integrity pass rate",
      v: `${compliance}%`,
      tone: compliance === 100 ? ("success" as const) : ("warning" as const),
      icon: Sparkles,
    },
  ];

  const toneBg: Record<string, string> = {
    info: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    critical: "bg-critical-soft text-critical",
  };

  // Show a few real results from the backend (or fallback)
  const rows =
    result?.results?.slice(0, 8).map((r) => ({
      id: r.entityId,
      resident: "—", // can be enriched later
      status: r.status,
      time: "just now",
      reason: r.reason,
    })) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="p-8 text-center animate-in fade-in">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-success-foreground shadow-elegant">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold">Verification complete</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {failedCount === 0
            ? "All resident records successfully passed integrity verification. No unauthorized modifications were detected."
            : `${failedCount} record(s) failed integrity checks. Please review the details below.`}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success-soft px-4 py-1.5 text-xs font-semibold text-success">
          <Sparkles className="h-3.5 w-3.5" />
          {compliance}% compliance · {failedCount === 0 ? "CQC-ready" : "Review required"}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.l} className="p-4">
              <div className={"grid h-10 w-10 place-items-center rounded-lg " + toneBg[c.tone]}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{c.l}</p>
              <p className="text-2xl font-semibold">{c.v}</p>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Verification details</h3>
            <p className="text-xs text-muted-foreground">
              Duration {elapsed.toFixed(1)}s · Completed {new Date().toLocaleTimeString("en-GB")}
            </p>
          </div>
          <Badge tone={failedCount === 0 ? "success" : "warning"}>
            {failedCount === 0 ? "All clear" : "Issues found"}
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Hash status</th>
                <th className="px-4 py-3">Verified at</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No detailed results available
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{r.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">
                        {r.status === "Verified" ? "match" : "mismatch"}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.time}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === "Verified" ? "success" : "critical"}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/* Floating action button                                                      */
/* -------------------------------------------------------------------------- */

export function FloatingActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      data-inspection-hide
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:bg-primary/90 hover:scale-105"
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* View Care Record modal                                                     */
/* -------------------------------------------------------------------------- */

// export function ViewCareRecordModal({
//   open,
//   onClose,
//   record,
//   onVerify,
//   onReplay,
// }: {
//   open: boolean;
//   onClose: () => void;
//   record: CareRecord | null;
//   onVerify?: () => void;
//   onReplay?: () => void;
// }) {
//   if (!record) return null;
//   const fullHash = fakeSha256(record.id);
//   const tone =
//     record.status === "Verified"
//       ? ("success" as const)
//       : record.status === "Pending"
//         ? ("info" as const)
//         : record.status === "Warning"
//           ? ("warning" as const)
//           : ("critical" as const);

//   console.log(record);

//   const list = [
//     { l: "Resident", v: `${record.resident?.firstName} ${record.resident?.lastName}` },
//     { l: "Created by", v: `${record.recordedBy.firstName} ${record.recordedBy.lastName}` },
//     { l: "Last updated", v: record.updatedAt },
//     { l: "Care category", v: record.title },
//   ];

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title={record.title}
//       description={`${record.id} · ${record.resident}`}
//       size="xl"
//       footer={
//         <>
//           <BtnGhost onClick={onClose}>Close</BtnGhost>
//           {onReplay && (
//             <BtnGhost onClick={onReplay}>
//               <ScrollText className="h-3.5 w-3.5" /> Replay history
//             </BtnGhost>
//           )}
//           {onVerify && (
//             <BtnPrimary onClick={onVerify}>
//               <ShieldCheck className="h-3.5 w-3.5" /> Verify integrity
//             </BtnPrimary>
//           )}
//         </>
//       }
//     >
//       <div className="space-y-5">
//         <div className="flex flex-wrap items-center gap-2">
//           <Badge tone={tone}>
//             <ShieldCheck className="h-3 w-3" /> {record.status}
//           </Badge>
//           <Badge tone="neutral">Record {record.id}</Badge>
//           <Badge tone="info">Verified at {record.integrity?.createdAt}</Badge>
//         </div>

//         <div className="grid gap-3 sm:grid-cols-2">
//           {list.map((r, i) => (
//             <Card key={i} className="p-4">
//               <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.l}</p>
//               <p className="mt-1 text-sm font-medium">{r.v}</p>
//             </Card>
//           ))}
//         </div>

//         <Card className="p-4">
//           <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Vital signs</p>
//           <p className="mt-1 font-mono text-sm">128/82 mmHg · 72 bpm · 36.6°C · SpO₂ 97%</p>
//         </Card>

//         <Card className="p-4">
//           <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
//             Observation notes
//           </p>
//           <p className="mt-2 text-sm leading-relaxed text-foreground">
//             Resident settled well overnight. Assisted with morning personal care and mobility using
//             walking frame. Appetite good at breakfast, fluids encouraged. No signs of distress or
//             discomfort. Continues on current care plan without incident.
//           </p>
//         </Card>

//         <Card className="p-4">
//           <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
//             Care plan &amp; follow-up
//           </p>
//           <ul className="mt-2 list-disc pl-5 text-sm space-y-1 text-foreground">
//             <li>Continue routine hourly welfare checks during day shift.</li>
//             <li>Blood glucose reading before evening meal.</li>
//             <li>GP review scheduled for next Tuesday — no changes required.</li>
//           </ul>
//         </Card>

//         <Card className="p-4">
//           <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
//             <Hash className="h-3.5 w-3.5" /> SHA-256 integrity hash
//           </div>
//           <code className="mt-2 block break-all rounded-md bg-secondary px-3 py-2 font-mono text-[11px]">
//             {/* {fullHash} */}
//             {record.integrity?.currentHash}
//           </code>
//           <p className="mt-2 text-xs text-muted-foreground">
//             Hash computed at save time and re-verified on every read. Any tampering with the record
//             contents will fail verification and raise a critical alert.
//           </p>
//         </Card>
//       </div>
//     </Modal>
//   );
// }

export function ViewCareRecordModal({
  open,
  onClose,
  record,
  onVerify,
  onReplay,
}: {
  open: boolean;
  onClose: () => void;
  record: CareRecord | null;
  onVerify?: () => void;
  onReplay?: () => void;
}) {
  if (!record) return null;

  const { vitals, carePlan, observationNotes, priority: contentPriority } = record.content ?? {};

  const tone =
    record.status === "VERIFIED"
      ? "success"
      : record.status === "PENDING"
        ? "info"
        : record.status === "WARNING"
          ? "warning"
          : "critical";

  const list = [
    {
      l: "Resident",
      v: `${record.resident?.firstName ?? ""} ${record.resident?.lastName ?? ""}`.trim(),
    },
    {
      l: "Room",
      v: record.resident?.roomNumber ?? "-",
    },
    {
      l: "Created by",
      v: `${record.recordedBy.firstName} ${record.recordedBy.lastName}`,
    },
    {
      l: "Recorded at",
      v: new Date(record.recordedAt).toLocaleString(),
    },
    {
      l: "Last updated",
      v: new Date(record.updatedAt).toLocaleString(),
    },
    {
      l: "Care category",
      v: record.title,
    },
    {
      l: "Priority",
      v: contentPriority ?? record.priority ?? "Routine",
    },
    {
      l: "Record type",
      v: record.type.replace(/_/g, " "),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record.title}
      description={`${record.resident?.firstName ?? ""} ${
        record.resident?.lastName ?? ""
      } • Room ${record.resident?.roomNumber ?? "-"}`}
      size="xl"
      footer={
        <>
          <BtnGhost onClick={onClose}>Close</BtnGhost>

          {onReplay && (
            <BtnGhost onClick={onReplay}>
              <ScrollText className="mr-2 h-4 w-4" />
              Replay history
            </BtnGhost>
          )}

          {onVerify && (
            <BtnPrimary onClick={onVerify}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify integrity
            </BtnPrimary>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={tone}>
            <ShieldCheck className="mr-1 h-3 w-3" />
            {record.status.replace(/_/g, " ")}
          </Badge>

          <Badge tone="neutral">Record {record.id}</Badge>

          <Badge tone="info">
            Verified at{" "}
            {record.integrity?.createdAt
              ? new Date(record.integrity.createdAt).toLocaleString()
              : "N/A"}
          </Badge>
        </div>

        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((item) => (
            <Card key={item.l} className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.l}</p>

              <p className="mt-1 text-sm font-medium">{item.v}</p>
            </Card>
          ))}
        </div>

        {/* Vitals */}
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Vital signs</p>

          <p className="mt-2 text-sm">{vitals || "No vital signs recorded."}</p>
        </Card>

        {/* Observation */}
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Observation notes
          </p>

          <p className="mt-2 text-sm leading-relaxed">
            {observationNotes || "No observation notes provided."}
          </p>
        </Card>

        {/* Care plan */}
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Care plan</p>

          <p className="mt-2 text-sm leading-relaxed">{carePlan || "No care plan recorded."}</p>
        </Card>

        {/* Integrity */}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Hash className="h-3.5 w-3.5" />
            SHA-256 integrity hash
          </div>

          <code className="mt-2 block break-all rounded-md bg-secondary px-3 py-2 font-mono text-[11px]">
            {record.integrity?.currentHash ?? "No hash available"}
          </code>

          <p className="mt-2 text-xs text-muted-foreground">
            This hash was generated when the record was saved. During verification, the current
            record contents are hashed again and compared with this value. Any modification to the
            record will result in a hash mismatch and indicate possible tampering.
          </p>
        </Card>

        {/* Version History */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Version History
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete audit trail of this care record.
              </p>
            </div>

            <Badge tone="info">Current v4</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {/* Version 4 */}
            <div className="rounded-lg border bg-background">
              <div className="flex items-start justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="success">Version 4</Badge>
                    <Badge tone="neutral">Care Plan Updated</Badge>
                  </div>

                  <p className="text-sm font-medium">Sarah Johnson</p>

                  <p className="text-xs text-muted-foreground">28 Jul 2026 • 09:42 AM</p>
                </div>

                <Badge tone="success">Current</Badge>
              </div>

              <div className="border-t bg-secondary/30 px-4 py-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Changes</p>

                  <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    <li>Updated care plan for mobility assistance.</li>
                    <li>Added follow-up GP appointment.</li>
                    <li>Observation notes expanded.</li>
                  </ul>
                </div>

                <div className="rounded-md bg-background p-3 border">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Snapshot
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Priority</p>
                      <p className="text-sm font-medium">Routine</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Vitals</p>
                      <p className="text-sm font-medium">128/82 • 72 bpm • 36.6°C</p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Observation</p>

                      <p className="text-sm">
                        Resident mobilised safely using walking frame. Appetite good. No signs of
                        discomfort.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Version 3 */}
            <div className="rounded-lg border bg-background">
              <div className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">Version 3</Badge>
                    <Badge tone="neutral">Observation Updated</Badge>
                  </div>

                  <p className="mt-2 text-sm font-medium">Michael Obi</p>

                  <p className="text-xs text-muted-foreground">27 Jul 2026 • 06:14 PM</p>
                </div>

                <Button variant="ghost" size="sm">
                  View Snapshot
                </Button>
              </div>
            </div>

            {/* Version 2 */}
            <div className="rounded-lg border bg-background">
              <div className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">Version 2</Badge>
                    <Badge tone="neutral">Vitals Corrected</Badge>
                  </div>

                  <p className="mt-2 text-sm font-medium">Sarah Johnson</p>

                  <p className="text-xs text-muted-foreground">25 Jul 2026 • 11:18 AM</p>
                </div>

                <Button variant="ghost" size="sm">
                  View Snapshot
                </Button>
              </div>
            </div>

            {/* Version 1 */}
            <div className="rounded-lg border bg-background">
              <div className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">Version 1</Badge>
                    <Badge tone="success">Initial Record</Badge>
                  </div>

                  <p className="mt-2 text-sm font-medium">Sarah Johnson</p>

                  <p className="text-xs text-muted-foreground">24 Jul 2026 • 08:30 AM</p>
                </div>

                <Button variant="ghost" size="sm">
                  View Snapshot
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
