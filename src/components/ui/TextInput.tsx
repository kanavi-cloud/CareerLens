import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  Text,
  View,
} from "react-native";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const TextInput = ({
  label,
  error,
  className = "",
  ...props
}: TextInputProps) => {
  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-slate-700">
          {label}
        </Text>
      )}
      <RNTextInput
        className="min-h-11 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-night focus:border-brand"
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
};

export default TextInput;
