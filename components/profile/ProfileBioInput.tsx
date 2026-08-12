type ProfileBioInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ProfileBioInput({ value, onChange }: ProfileBioInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      placeholder="어떤 운동을 하는 사람인지 간단히 소개해주세요."
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
    />
  );
}
