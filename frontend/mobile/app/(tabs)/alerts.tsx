import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePriceAlerts }   from '../../hooks/usePriceAlerts';
import { useAuth }          from '../../src/context/AuthContext';
import { registerForPushNotifications } from '../../src/services/notificationService';
import {
  AlertHistoryItemRow,
  CreateAlertSheet,
  EmptyAlerts,
  PriceAlertCard,
} from '../../components/PriceAlerts';
import { AlertHistoryItem } from '../../src/services/priceAlertService';
import { formatAlertDate }  from '../../src/utils/timeAgo';

type Tab = 'active' | 'history';

// ── Group history items by date ──────────────────────────────
function groupByDate(items: AlertHistoryItem[]) {
  const groups: Record<string, AlertHistoryItem[]> = {};
  for (const item of items) {
    const day = new Date(item.triggered_at).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function AlertsScreen() {
  const { user }                                    = useAuth();
  const { alerts, history, loading, historyLoading,
          error, creating, refresh, create,
          toggle, remove }                          = usePriceAlerts();
  const [tab,          setTab]          = useState<Tab>('active');
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const tabIndicator                    = useRef(new Animated.Value(0)).current;

  // Register for push notifications on first load
  useEffect(() => {
    if (user?.id) registerForPushNotifications(user.id);
  }, [user?.id]);

  // Animate tab indicator
  const switchTab = (t: Tab) => {
    setTab(t);
    Animated.spring(tabIndicator, {
      toValue:         t === 'active' ? 0 : 1,
      useNativeDriver: false,
      tension:         80, friction:  12,
    }).start();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const activeAlerts  = alerts.filter(a => a.is_active);
  const pausedAlerts  = alerts.filter(a => !a.is_active);
  const historySections = groupByDate(history);

  const indicatorLeft = tabIndicator.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '50%'],
  });

  // ── Active tab content ──────────────────────────────────────
  const renderActive = () => {
    if (loading) {
      return (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color="#2D7A3A" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centre}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (alerts.length === 0) {
      return <EmptyAlerts onAdd={() => setSheetOpen(true)} />;
    }

    const sections = [
      ...(activeAlerts.length  > 0 ? [{ key: 'active',  label: `Active  (${activeAlerts.length})`,  data: activeAlerts }]  : []),
      ...(pausedAlerts.length > 0 ? [{ key: 'paused',  label: `Paused  (${pausedAlerts.length})`,  data: pausedAlerts }] : []),
    ];

    return (
      <FlatList
        data={sections}
        keyExtractor={s => s.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2D7A3A" />}
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionHeader}>{section.label}</Text>
            {section.data.map(alert => (
              <PriceAlertCard
                key={alert.id}
                alert={alert}
                onToggle={toggle}
                onDelete={remove}
              />
            ))}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    );
  };

  // ── History tab content ─────────────────────────────────────
  const renderHistory = () => {
    if (historyLoading) {
      return (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color="#2D7A3A" />
        </View>
      );
    }
    if (history.length === 0) {
      return (
        <View style={styles.centre}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No alerts triggered yet</Text>
          <Text style={styles.emptySub}>Your alert history will appear here{'\n'}once prices hit your targets.</Text>
        </View>
      );
    }
    return (
      <SectionList
        sections={historySections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => <AlertHistoryItemRow item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2D7A3A" />}
        contentContainerStyle={{ paddingBottom: 32 }}
        stickySectionHeadersEnabled
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top bar ───────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>Price Alerts</Text>
          <Text style={styles.subheading}>
            {alerts.length === 0
              ? 'No alerts set'
              : `${activeAlerts.length} active · ${history.length} triggered`}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setSheetOpen(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab switcher ─────────────────────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => switchTab('active')}>
          <Text style={[styles.tabLabel, tab === 'active' && styles.tabLabelActive]}>
            My Alerts
            {activeAlerts.length > 0 && (
              <Text style={styles.tabBadge}> {activeAlerts.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => switchTab('history')}>
          <Text style={[styles.tabLabel, tab === 'history' && styles.tabLabelActive]}>
            History
            {history.length > 0 && (
              <Text style={styles.tabBadge}> {history.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
        <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
      </View>

      {/* ── Content ──────────────────────────────────────── */}
      {tab === 'active' ? renderActive() : renderHistory()}

      {/* ── FAB (visible when there are already alerts) ── */}
      {alerts.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setSheetOpen(true)}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

      {/* ── Create sheet ─────────────────────────────────── */}
      <CreateAlertSheet
        visible={sheetOpen}
        creating={creating}
        onClose={() => setSheetOpen(false)}
        onCreate={create}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  heading:    { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  subheading: { fontSize: 12, color: '#888', marginTop: 2 },
  addBtn:     {
    backgroundColor: '#2D7A3A', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
    position: 'relative',
  },
  tabItem:       { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabLabel:      { fontSize: 14, color: '#AAAAAA', fontWeight: '500' },
  tabLabelActive:{ color: '#2D7A3A', fontWeight: '700' },
  tabBadge:      { color: '#2D7A3A', fontWeight: '700' },
  tabIndicator:  {
    position: 'absolute', bottom: 0, width: '50%', height: 3,
    backgroundColor: '#2D7A3A', borderTopLeftRadius: 2, borderTopRightRadius: 2,
  },

  // Section headers inside active list
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6,
  },

  // History date headers
  dateHeader: {
    backgroundColor: '#F5F5F5', paddingHorizontal: 16,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  dateHeaderText: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Empty / loading / error states
  centre:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText:  { color: '#D32F2F', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn:   { backgroundColor: '#2D7A3A', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:  { color: '#fff', fontWeight: '600' },
  emptyIcon:  { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

  // FAB
  fab: {
    position: 'absolute', right: 20, bottom: 28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2D7A3A', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2D7A3A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
