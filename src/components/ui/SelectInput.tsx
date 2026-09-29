import React from "react";
import { Text, View } from "react-native";

interface SelectInputProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export const SelectInput = ({
  label,
  children,
  className = "",
}: SelectInputProps) => {
  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-slate-700">
          {label}
        </Text>
      )}
      <View className="rounded-lg border border-line bg-white px-3 py-2">
        {children}
      </View>
    </View>
  );
};

export default SelectInput;
