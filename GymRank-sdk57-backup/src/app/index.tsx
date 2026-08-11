import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.title}>GymRank</Text>
          </View>

          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>D</Text>
          </View>
        </View>

        <View style={styles.rankCard}>
          <View>
            <Text style={styles.cardLabel}>YOUR RANK</Text>
            <Text style={styles.rank}>IRON III</Text>
            <Text style={styles.rankSubtext}>Keep pushing to reach Bronze</Text>
          </View>

          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>III</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's workout</Text>
          <Text style={styles.sectionLink}>View plan</Text>
        </View>

        <View style={styles.workoutCard}>
          <View style={styles.workoutIcon}>
            <Text style={styles.workoutIconText}>P</Text>
          </View>

          <View style={styles.workoutInfo}>
            <Text style={styles.workoutTitle}>Push Day</Text>
            <Text style={styles.workoutMeta}>Chest • Shoulders • Triceps</Text>
            <Text style={styles.workoutMeta}>6 exercises • ~55 min</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>START WORKOUT</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>WORKOUTS</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  eyebrow: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 3,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rankCard: {
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#292929',
    marginBottom: 30,
  },
  cardLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  rank: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 5,
  },
  rankSubtext: {
    color: '#888888',
    fontSize: 13,
    marginTop: 5,
  },
  rankBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#242424',
    borderWidth: 2,
    borderColor: '#555555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionLink: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '600',
  },
  workoutCard: {
    backgroundColor: '#171717',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292929',
  },
  workoutIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  workoutIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  workoutMeta: {
    color: '#858585',
    fontSize: 12,
    marginTop: 2,
  },
  startButton: {
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  arrow: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#171717',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292929',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
  statLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.7,
  },
});