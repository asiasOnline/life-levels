import { SKIN_TONES, SkinToneKey } from "@/lib/types/character"

interface SkinToneProps {
  value: SkinToneKey;
  onChange: (value: SkinToneKey) => void;
}

export function SkinTonePicker({ value, onChange }: SkinToneProps) {
  return (
    <div className="flex gap-2">
      {(Object.keys(SKIN_TONES) as SkinToneKey[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`w-8 h-8 rounded-full border-2 transition-colors ${
            value === key ? "border-primary" : "border-transparent"
          }`}
          style={{ backgroundColor: SKIN_TONES[key].base }}
          aria-label={key}
        />
      ))}
    </div>
  );
}