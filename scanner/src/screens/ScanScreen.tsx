import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useScannerStore } from "../stores/scannerStore";
import {
  isSHLUrl,
  parseSHLPayload,
  isSHLExpired,
} from "../lib/shl-utils";

const { width } = Dimensions.get("window");
const SCAN_FRAME_SIZE = width * 0.7;

interface ScanScreenProps {
  navigation: any;
}

export function ScanScreen({ navigation }: ScanScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { flashEnabled, toggleFlash, setLastScan } = useScannerStore();

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    // Check if it's an SHL
    if (!isSHLUrl(data)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Invalid QR Code",
        "This QR code doesn't contain a valid health link.",
        [{ text: "Scan Again", onPress: () => setScanned(false) }]
      );
      return;
    }

    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const payload = parseSHLPayload(data);

      // Check expiration
      if (isSHLExpired(payload)) {
        Alert.alert(
          "Link Expired",
          "This health link has expired and can no longer be viewed.",
          [{ text: "Scan Another", onPress: () => setScanned(false) }]
        );
        return;
      }

      // Store and navigate to confirm
      setLastScan(data, payload);
      navigation.navigate("Confirm");
    } catch (error) {
      Alert.alert(
        "Invalid Link",
        error instanceof Error ? error.message : "Could not process this link",
        [{ text: "Scan Again", onPress: () => setScanned(false) }]
      );
    }
  };

  const handleHistoryPress = () => {
    navigation.navigate("History");
  };

  // Permission not yet determined
  if (permission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashEnabled}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top section */}
        <View style={styles.overlaySection}>
          <Text style={styles.title}>Scan Patient QR Code</Text>
          <Text style={styles.subtitle}>
            Position the QR code within the frame
          </Text>
        </View>

        {/* Scan frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            {/* Corner decorations */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom section with controls */}
        <View style={styles.overlaySection}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <Text style={styles.controlIcon}>{flashEnabled ? "🔦" : "💡"}</Text>
              <Text style={styles.controlLabel}>
                {flashEnabled ? "Flash On" : "Flash Off"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleHistoryPress}
            >
              <Text style={styles.controlIcon}>📋</Text>
              <Text style={styles.controlLabel}>History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  overlaySection: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
  },
  frameContainer: {
    flexDirection: "row",
  },
  frame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#0d9488",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
  },
  controlButton: {
    alignItems: "center",
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 12,
  },
});
