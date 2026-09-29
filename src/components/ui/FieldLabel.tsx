import { View, Text, Pressable } from 'react-native';
export function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <Text className="mb-1.5 flex-row items-center justify-between gap-2 text-sm font-medium text-slate-700">
      <Text>{label}</Text>
      {helper && <Text className="text-xs font-normal text-slate-400">{helper}</Text>}
    </Text>
  );
}
