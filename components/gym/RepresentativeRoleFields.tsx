import { SignupField, SignupInput } from "@/components/SignupField";
import {
  GYM_REPRESENTATIVE_ROLE_OPTIONS,
  isGymRepresentativeRoleOther,
} from "@/lib/constants/gym-representative";

type RepresentativeRoleFieldsProps = {
  role: string;
  onRoleChange: (value: string) => void;
  customRole: string;
  onCustomRoleChange: (value: string) => void;
  required?: boolean;
};

const selectClassName =
  "w-full rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export function RepresentativeRoleFields({
  role,
  onRoleChange,
  customRole,
  onCustomRoleChange,
  required = true,
}: RepresentativeRoleFieldsProps) {
  return (
    <>
      <SignupField label="담당자 직책" required={required}>
        <select
          required={required}
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">선택하세요</option>
          {GYM_REPRESENTATIVE_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </SignupField>

      {isGymRepresentativeRoleOther(role) && (
        <SignupField label="직책 직접 입력" required={required}>
          <SignupInput
            required={required}
            value={customRole}
            onChange={(e) => onCustomRoleChange(e.target.value)}
            placeholder="예: 헤드코치, 팀장"
          />
        </SignupField>
      )}
    </>
  );
}
