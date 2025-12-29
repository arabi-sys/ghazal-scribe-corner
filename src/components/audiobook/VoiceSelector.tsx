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
  { id: "alloy", name: "Alloy", description: "Neutral, balanced voice" },
  { id: "echo", name: "Echo", description: "Warm, conversational male voice" },
  { id: "fable", name: "Fable", description: "Expressive, British accent" },
  { id: "onyx", name: "Onyx", description: "Deep, authoritative male voice" },
  { id: "nova", name: "Nova", description: "Friendly, engaging female voice" },
  { id: "shimmer", name: "Shimmer", description: "Clear, expressive female voice" },
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
