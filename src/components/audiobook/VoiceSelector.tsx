import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Voice {
  id: string;
  name: string;
  description: string;
}

const voices: Voice[] = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm, narrative male voice" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft, engaging female voice" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Clear, expressive female voice" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep, authoritative male voice" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "British, professional male voice" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Friendly, conversational female voice" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Young, dynamic female voice" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Calm, storytelling male voice" },
];

interface VoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
}

export function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  const selectedVoice = voices.find((v) => v.id === value);

  return (
    <div className="space-y-2">
      <Label>Narrator Voice</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex flex-col">
                <span className="font-medium">{voice.name}</span>
                <span className="text-xs text-muted-foreground">{voice.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedVoice && (
        <p className="text-xs text-muted-foreground">{selectedVoice.description}</p>
      )}
    </div>
  );
}
