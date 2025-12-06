import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  getHistory,
  clearHistory,
  deleteHistoryItem,
  formatScanDate,
  ScanHistoryItem,
} from "../lib/history";
import { normalizeToFullUrl, formatExpiration } from "../lib/shl-utils";

interface HistoryScreenProps {
  navigation: any;
}

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const items = await getHistory();
    setHistory(items);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleOpenItem = async (item: ScanHistoryItem) => {
    try {
      const fullUrl = normalizeToFullUrl(item.scannedData);
      await WebBrowser.openBrowserAsync(fullUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: "#0d9488",
      });
    } catch (error) {
      Alert.alert("Error", "Could not open this link");
    }
  };

  const handleDeleteItem = (item: ScanHistoryItem) => {
    Alert.alert(
      "Delete Scan",
      "Remove this scan from history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteHistoryItem(item.id);
            loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear History",
      "Remove all scans from history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => {
    const isExpired = item.expiration && Date.now() / 1000 > item.expiration;

    return (
      <TouchableOpacity
        style={[styles.item, isExpired && styles.itemExpired]}
        onPress={() => handleOpenItem(item)}
        onLongPress={() => handleDeleteItem(item)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemLabel} numberOfLines={1}>
            {item.label || "Health Link"}
          </Text>
          <Text style={styles.itemDate}>{formatScanDate(item.scannedAt)}</Text>
          {item.expiration && (
            <Text style={[styles.itemExpiry, isExpired && styles.expiredText]}>
              {isExpired ? "Expired" : formatExpiration(item.expiration)}
            </Text>
          )}
        </View>
        <Text style={styles.itemArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Scan History</Text>
      <Text style={styles.emptyText}>
        Scanned QR codes will appear here for easy access later.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.emptyButtonText}>Scan a QR Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {history.length} scan{history.length !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={history.length === 0 && styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Text style={styles.hint}>Long press to delete a scan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerText: {
    fontSize: 14,
    color: "#6b7280",
  },
  clearButton: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "500",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemExpired: {
    opacity: 0.6,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  itemExpiry: {
    fontSize: 12,
    color: "#0d9488",
    marginTop: 4,
  },
  expiredText: {
    color: "#ef4444",
  },
  itemArrow: {
    fontSize: 24,
    color: "#9ca3af",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
});
