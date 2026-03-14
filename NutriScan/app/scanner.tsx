import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../src/constants';
import { Button } from '../src/components';
import { fetchProductByBarcode, addManualProduct, ManualProductRequiredError } from '../src/services/foodApi';
import { Product } from '../src/types';

interface ManualProductForm {
  name: string;
  brand: string;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
  sugar: string;
  sodium: string;
  saturatedFat: string;
}

const initialFormState: ManualProductForm = {
  name: '',
  brand: '',
  calories: '',
  protein: '',
  carbohydrates: '',
  fat: '',
  sugar: '',
  sodium: '',
  saturatedFat: '',
};

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [manualForm, setManualForm] = useState<ManualProductForm>(initialFormState);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const lastScanTime = useRef(0);
  const SCAN_DEBOUNCE_MS = 2000;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (!scanned && !loading) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [scanned, loading]);

  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setLoading(false);
      setLastScannedBarcode('');
      lastScanTime.current = 0;
      console.log('[Scanner] Screen focused, ready to scan');
    }, [])
  );

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading) return;
    
    const now = Date.now();
    if (now - lastScanTime.current < SCAN_DEBOUNCE_MS) {
      console.log('[Scanner] Debouncing - scan too soon after last scan');
      return;
    }
    
    const barcode = result.data;
    console.log('[Scanner] Barcode detected:', barcode);
    
    if (lastScannedBarcode === barcode) {
      console.log('[Scanner] Same barcode already scanned, ignoring');
      return;
    }
    
    lastScanTime.current = now;
    
    setScanned(true);
    setLoading(true);
    setLastScannedBarcode(barcode);
    Vibration.vibrate(100);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setScanned(false);
      Alert.alert('Timeout', 'The request took too long. Please try again.');
    }, 15000);

    try {
      console.log('[Scanner] Fetching product for barcode:', barcode);
      const product = await fetchProductByBarcode(barcode);
      console.log('[Scanner] Product found:', product.name);
      
      router.replace({
        pathname: '/product/[id]',
        params: { id: encodeURIComponent(product.barcode), product: JSON.stringify(product) },
      });
    } catch (error) {
      console.log('[Scanner] Error fetching product:', error);
      
      if (error instanceof ManualProductRequiredError) {
        Alert.alert(
          'Product Not Found',
          'We couldn\'t find this product yet. Would you like to add it?',
          [
            {
              text: 'Search Instead',
              onPress: () => {
                setScanned(false);
                router.push('/search');
              },
            },
            {
              text: 'Add Manually',
              onPress: () => {
                setScanned(false);
                setShowAddProduct(true);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch product. Please try again.');
        setScanned(false);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Error', 'Please enter a valid barcode');
      return;
    }

    const barcode = manualBarcode.trim();
    console.log('[Scanner] Manual search for barcode:', barcode);
    
    setLoading(true);
    setShowManualInput(false);
    setScanned(true);
    setLastScannedBarcode(barcode);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setScanned(false);
      Alert.alert('Timeout', 'The request took too long. Please try again.');
    }, 15000);

    try {
      const product = await fetchProductByBarcode(barcode);
      console.log('[Scanner] Manual search found product:', product.name);
      
      router.replace({
        pathname: '/product/[id]',
        params: { id: encodeURIComponent(product.barcode), product: JSON.stringify(product) },
      });
    } catch (error) {
      console.log('[Scanner] Manual search error:', error);
      
      if (error instanceof ManualProductRequiredError) {
        Alert.alert(
          'Product Not Found',
          'We couldn\'t find this product yet. Would you like to add it?',
          [
            {
              text: 'Search Instead',
              onPress: () => {
                setScanned(false);
                router.push('/search');
              },
            },
            {
              text: 'Add Manually',
              onPress: () => {
                setScanned(false);
                setShowAddProduct(true);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch product. Please try again.');
        setScanned(false);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setManualBarcode('');
    }
  };

  const handleAddManualProduct = async () => {
    if (!manualForm.name.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }

    setLoading(true);

    try {
      const product = await addManualProduct(
        manualForm.name.trim(),
        manualForm.brand.trim(),
        {
          calories: parseFloat(manualForm.calories) || 0,
          protein: parseFloat(manualForm.protein) || 0,
          carbohydrates: parseFloat(manualForm.carbohydrates) || 0,
          fat: parseFloat(manualForm.fat) || 0,
          sugar: parseFloat(manualForm.sugar) || 0,
          sodium: parseFloat(manualForm.sodium) || 0,
          saturatedFat: parseFloat(manualForm.saturatedFat) || 0,
          fiber: 0,
        },
        manualForm.brand.trim() || undefined
      );

      setShowAddProduct(false);
      setManualForm(initialFormState);

      router.replace({
        pathname: '/product/[id]',
        params: { id: encodeURIComponent(product.barcode), product: JSON.stringify(product) },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIconContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
        </View>
        <Text style={styles.permissionTitle}>Camera Permission</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan food barcodes
        </Text>
        <Button
          title="Enable Camera"
          onPress={requestPermission}
          variant="primary"
          size="large"
          fullWidth
        />
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.manualButtonText}>Enter Barcode Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanLinePosition = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        focusMode="auto"
        preset="high"
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flashButton, flashOn && styles.flashButtonActive]}
              onPress={() => setFlashOn(!flashOn)}
              accessibilityRole="button"
              accessibilityLabel={flashOn ? 'Turn off flash' : 'Turn on flash'}
            >
              <Text style={styles.flashIcon}>{flashOn ? '⚡' : '🔦'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {!scanned && !loading && (
                <Animated.View 
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLinePosition }] }
                  ]} 
                />
              )}
            </View>
            <Text style={styles.instructionText}>
              {loading ? 'Searching...' : 'Align barcode inside the frame'}
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.manualEntryButton}
              onPress={() => setShowManualInput(true)}
              accessibilityRole="button"
              accessibilityLabel="Enter barcode manually"
            >
              <Text style={styles.manualEntryText}>Enter Barcode Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching for product...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      )}

      <Modal
        visible={showManualInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualInput(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Barcode</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Type the barcode number manually
            </Text>
            <TextInput
              style={styles.input}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="e.g., 5000159484695"
              keyboardType="numeric"
              autoFocus
              accessibilityLabel="Barcode input"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowManualInput(false);
                  setManualBarcode('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Search"
                onPress={handleManualSearch}
                variant="primary"
                loading={loading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAddProduct}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddProduct(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.addProductContainer}
        >
          <ScrollView style={styles.addProductScroll}>
            <View style={styles.addProductHeader}>
              <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                <Text style={styles.backButton}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.addProductTitle}>Add New Product</Text>
              <View style={{ width: 60 }} />
            </View>
            
            <Text style={styles.addProductSubtitle}>
              Add nutrition info per 100g serving
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                value={manualForm.name}
                onChangeText={(text) => setManualForm({ ...manualForm, name: text })}
                placeholder="e.g., Maggi Noodles"
                accessibilityLabel="Product name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.formInput}
                value={manualForm.brand}
                onChangeText={(text) => setManualForm({ ...manualForm, brand: text })}
                placeholder="e.g., Nestle"
                accessibilityLabel="Brand"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Calories (kcal)</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualForm.calories}
                  onChangeText={(text) => setManualForm({ ...manualForm, calories: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualForm.protein}
                  onChangeText={(text) => setManualForm({ ...manualForm, protein: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualForm.carbohydrates}
                  onChangeText={(text) => setManualForm({ ...manualForm, carbohydrates: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualForm.fat}
                  onChangeText={(text) => setManualForm({ ...manualForm, fat: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Sugar (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualForm.sugar}
                  onChangeText={(text) => setManualForm({ ...manualForm, sugar: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Sodium (mg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualForm.sodium}
                  onChangeText={(text) => setManualForm({ ...manualForm, sodium: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Saturated Fat (g)</Text>
              <TextInput
                style={styles.formInput}
                value={manualForm.saturatedFat}
                onChangeText={(text) => setManualForm({ ...manualForm, saturatedFat: text })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowAddProduct(false);
                  setManualForm(initialFormState);
                }}
                variant="outline"
                style={styles.formButton}
              />
              <Button
                title="Add Product"
                onPress={handleAddManualProduct}
                variant="primary"
                loading={loading}
                style={styles.formButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  permissionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  permissionIcon: {
    fontSize: 48,
  },
  permissionTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  manualButton: {
    marginTop: SPACING.lg,
  },
  manualButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '600',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonActive: {
    backgroundColor: COLORS.primary,
  },
  flashIcon: {
    fontSize: 22,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BORDER_RADIUS.lg,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
    fontWeight: '600',
    marginTop: SPACING.lg,
  },
  manualEntryButton: {
    padding: SPACING.md,
  },
  manualEntryText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingSubtext: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textSecondary,
    padding: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceAlt,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
  },
  addProductContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addProductScroll: {
    flex: 1,
  },
  addProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  addProductTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  addProductSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    backgroundColor: COLORS.white,
  },
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  formButton: {
    flex: 1,
  },
});
