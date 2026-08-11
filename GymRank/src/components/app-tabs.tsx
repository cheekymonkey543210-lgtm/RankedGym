import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Workout</Label>
        <Icon sf="dumbbell.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Label>Rankings</Label>
        <Icon sf="chart.bar.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}