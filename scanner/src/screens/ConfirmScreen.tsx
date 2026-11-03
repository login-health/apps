import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { useScannerStore } from "../stores/scannerStore";
import {
  buildViewerUrl,
  getManifestHost,
  getViewerHost,
  requiresPasscode,
  isLongTermShare,
  formatExpiration,
} from "../lib/shl-utils";
import { saveToHistory } from "../lib/history";

interface ConfirmScreenProps {
  navigation: any;
}

export function ConfirmScreen({ navigation }: ConfirmScreenProps) {
  const { lastScan, clearLastScan } = useScannerStore();
  const [isOpening, setIsOpening] = useState(false);

  if (!lastScan) {
    // Should not happen, but handle gracefully
    navigation.goBack();
    return null;
  }

  const { data, payload } = lastScan;
  const hasPasscode = requiresPasscode(payload);
  const isLongTerm = isLongTermShare(payload);
  const expirationText = formatExpiration(payload.exp);
  const manifestHost = getManifestHost(payload);
  const viewerHost = getViewerHost();

  const handleViewRecords = async () => {
    setIsOpening(true);

    try {
      const fullUrl = buildViewerUrl(data);

      // Save to history before opening (label and host only, never the link)
      await saveToHistory(manifestHost, payload.label);

      // Open in browser
      await WebBrowser.openBrowserAsync(fullUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: "#0d9488",
        toolbarColor: "#ffffff",
        dismissButtonStyle: "close",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Could not open viewer"
      );
    } finally {
      setIsOpening(false);
    }
  };

  const handleScanAnother = () => {
    clearLastScan();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Success icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✅</Text>
      </View>

      <Text style={styles.title}>Health Link Detected</Text>

      {/* Label if present */}
      {payload.label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{payload.label}</Text>
        </View>
      )}

      {/* Status badges */}
      <View style={styles.badges}>
        {hasPasscode && (
          <View style={[styles.badge, styles.badgeInfo]}>
            <Text style={styles.badgeText}>🔐 Passcode Required</Text>
          </View>
        )}

        {isLongTerm && (
          <View style={[styles.badge, styles.badgeInfo]}>
            <Text style={styles.badgeText}>♾️ Long-term Share</Text>
          </View>
        )}

        <View style={[styles.badge, styles.badgeExpiry]}>
          <Text style={styles.badgeText}>⏱️ {expirationText}</Text>
        </View>
      </View>

      {/* Where the data comes from and where it opens */}
      <View style={styles.hostContainer}>
        <Text style={styles.hostLabel}>Data will be fetched from:</Text>
        <Text style={styles.hostValue}>{manifestHost}</Text>
        <Text style={styles.hostLabel}>Opens in viewer:</Text>
        <Text style={styles.hostValueSecondary}>{viewerHost}</Text>
      </View>

      {/* Info text */}
      <Text style={styles.infoText}>
        This link will open in a secure viewer where you can access the patient's
        shared health records.
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleViewRecords}
          disabled={isOpening}
        >
          {isOpening ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>View Records</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleScanAnother}
          disabled={isOpening}
        >
          <Text style={styles.secondaryButtonText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 16,
  },
  labelContainer: {
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0d9488",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeInfo: {
    backgroundColor: "#e0f2fe",
  },
  badgeExpiry: {
    backgroundColor: "#fef3c7",
  },
  badgeText: {
    fontSize: 14,
    color: "#333",
  },
  hostContainer: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  hostLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  hostValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  hostValueSecondary: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#0d9488",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
  },
});
