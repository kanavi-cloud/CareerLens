import { View, Text, Pressable } from 'react-native';
import { Badge, Button, Card } from "@/components/ui";
import type { SettlementChecklistItem, SettlementStatus } from "@/lib/settlement";
import { statusOptions } from "./constants";
import { statusLabel, statusTone } from "./display";

type StatusChangeHandler = (item: SettlementChecklistItem, status: SettlementStatus) => void | Promise<void>;

export function CountryPanel({
  country,
  items,
  updatingId,
  onStatusChange
}: {
  country: string;
  items: SettlementChecklistItem[];
  updatingId: number | null;
  onStatusChange: StatusChangeHandler;
}) {
  const groupedByCategory = items.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {});
  const completeRate = items.length === 0 ? 0 : Math.round((items.filter((item) => item.status === "DONE").length / items.length) * 100);

  return (
    <Card className="p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View>
          <Text className="text-xs font-bold tracking-[0.16em] text-brand">COUNTRY DOSSIER</Text>
          <Text className="mt-2 text-2xl font-semibold text-night">{country}</Text>
          <Text className="mt-1 text-sm text-slate-600">체크리스트 완료율 {completeRate}%</Text>
        </View>
        <Badge tone={completeRate >= 70 ? "success" : "warning"}>{completeRate >= 70 ? "준비 양호" : "확인 필요"}</Badge>
      </View>

      <View className="mt-5 flex-row gap-4">
        {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
          <View>
            <Text className="text-lg font-semibold text-night">{category}</Text>
            <View className="mt-4 space-y-3">
              {categoryItems.map((item) => (
                <ChecklistRow
                  key={item.item_id}
                  item={item}
                  isUpdating={updatingId === item.item_id}
                  onStatusChange={onStatusChange}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function ChecklistRow({
  item,
  isUpdating,
  onStatusChange
}: {
  item: SettlementChecklistItem;
  isUpdating: boolean;
  onStatusChange: StatusChangeHandler;
}) {
  return (
    <View className="border-b border-line pb-3 last:border-b-0 last:pb-0">
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-night">{item.checklist_title}</Text>
          <Text className="mt-1 text-sm leading-6 text-slate-600">{item.description}</Text>
        </View>
        <Badge tone={statusTone(item.status)} className={item.status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
          {statusLabel(item.status)}
        </Badge>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            
            variant={item.status === option.value ? "primary" : "secondary"}
            disabled={isUpdating}
            onPress={() => onStatusChange(item, option.value)}
            className={`min-h-9 px-3 text-xs ${option.value === "NOT_STARTED" ? "min-w-[55px]" : ""}`}
          >
            {option.label}
          </Button>
        ))}
      </View>
    </View>
  );
}
