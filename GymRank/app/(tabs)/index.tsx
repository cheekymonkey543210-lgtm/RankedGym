import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WorkoutScreen() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>GYMRANK</Text>
        <Text style={styles.title}>Log your workout</Text>
        <Text style={styles.subtitle}>
          Build a workout, track every set and get stronger.
        </Text>
      </View>

      <Pressable
        style={styles.startCard}
        onPress={() => router.push('/workout-builder')}
      >
        <View>
          <Text style={styles.cardTitle}>Start empty workout</Text>
          <Text style={styles.cardSubtitle}>
            Build your workout from scratch
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Routines</Text>

      <View style={styles.emptyRoutine}>
        <Text style={styles.emptyTitle}>No routines yet</Text>
        <Text style={styles.emptyText}>
          Your saved and imported routines will appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    padding: 20,
    paddingTop: 70,
  },

  eyebrow: {
    color: '#77777F',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },

  subtitle: {
    color: '#88888F',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 330,
  },

  startCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardTitle: {
    color: '#0B0B0D',
    fontSize: 18,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: '#66666D',
    fontSize: 13,
    marginTop: 5,
  },

  arrow: {
    color: '#0B0B0D',
    fontSize: 30,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    marginTop: 34,
    marginBottom: 12,
  },

  emptyRoutine: {
    backgroundColor: '#151519',
    borderRadius: 16,
    padding: 22,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  emptyText: {
    color: '#77777F',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
});