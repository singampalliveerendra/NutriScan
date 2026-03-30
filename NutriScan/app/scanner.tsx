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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../src/constants';
import { GradientButton, GlassCard, AnimatedPress } from '../src/components';
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
  const { colors } = useTheme();
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const lastScanTime = useRef(0);
  const SCAN_DEBOUNCE_MS = 2000;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    let pulseAnimation: Animated.CompositeAnimation;
    let rotateAnimation: Animated.CompositeAnimation;
    
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

      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
    }
    return () => {
      if (animation) animation.stop();
      if (pulseAnimation) pulseAnimation.stop();
      if (rotateAnimation) rotateAnimation.stop();
    };
  }, [scanned, loading]);

  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setLoading(false);
      setLastScannedBarcode('');
      lastScanTime.current = 0;
    }, [])
  );

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading) return;

    const now = Date.now();
    if (now - lastScanTime.current < SCAN_DEBOUNCE_MS) return;
    
    const barcode = result.data;
    if (!barcode || barcode.trim() === '') return;
    
    if (lastScannedBarcode === barcode) return;
    
    lastScanTime.current = now;
    setScanned(true);
    setLoading(true);
    setLastScannedBarcode(barcode);
    Vibration.vibrate(80);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setScanned(false);
      Alert.alert('Timeout', 'The request took too long. Please try again.');
    }, 15000);

    try {
      const product = await fetchProductByBarcode(barcode);
      clearTimeout(timeoutId);
      Vibration.vibrate([0, 50, 50, 50]);
      
      router.replace({
        pathname: '/product/[id]',
        params: { id: encodeURIComponent(product.barcode), product: JSON.stringify(product) },
      });
    } catch (error) {
      if (error instanceof ManualProductRequiredError) {
        setScanned(false);
        setLoading(false);
        Alert.alert(
          'Product Not Found',
          "We couldn't find this product in our database. Would you like to add it manually?",
          [
            { text: 'Add Manually', onPress: () => setShowAddProduct(true) },
            { text: 'Search Instead', onPress: () => router.push('/search') },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch product. Please check your internet connection.');
        setScanned(false);
        setLoading(false);
      }
    }
  };

  const handleManualSearch = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Error', 'Please enter a valid barcode');
      return;
    }

    const barcode = manualBarcode.trim();
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
      clearTimeout(timeoutId);
      
      router.replace({
        pathname: '/product/[id]',
        params: { id: encodeURIComponent(product.barcode), product: JSON.stringify(product) },
      });
    } catch (error) {
      if (error instanceof ManualProductRequiredError) {
        setScanned(false);
        Alert.alert(
          'Product Not Found',
          "We couldn't find this product. Would you like to add it manually?",
          [
            { text: 'Add Manually', onPress: () => setShowAddProduct(true) },
            { text: 'Search Instead', onPress: () => router.push('/search') },
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.permissionIconContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
        </View>
        <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Permission</Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          We need camera access to scan food barcodes
        </Text>
        <GradientButton
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
          <Text style={[styles.manualButtonText, { color: colors.primary }]}>Enter Barcode Manually</Text>
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
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flashButton, flashOn && styles.flashButtonActive]}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Text style={styles.flashIcon}>{flashOn ? '⚡' : '🔦'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanArea}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.scanFrame}>
                <View style={styles.scanFrameInner}>
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
              </View>
            </Animated.View>
            
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                {loading ? 'Scanning...' : 'Align barcode inside the frame'}
              </Text>
              <Text style={styles.instructionSubtext}>
                Position the barcode within the frame for best results
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.manualEntryButton, { backgroundColor: colors.surface }]}
              onPress={() => setShowManualInput(true)}
            >
              <View style={[styles.manualEntryIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={styles.manualEntryEmoji}>⌨️</Text>
              </View>
              <View style={styles.manualEntryContent}>
                <Text style={[styles.manualEntryTitle, { color: colors.text }]}>Enter Barcode</Text>
                <Text style={[styles.manualEntrySubtitle, { color: colors.textSecondary }]}>Type manually</Text>
              </View>
              <Text style={[styles.chevronIcon, { color: colors.textTertiary }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Searching...</Text>
            <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
              Looking for product info
            </Text>
          </GlassCard>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Barcode</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Type the barcode number manually
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={styles.inputIcon}>🔢</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={manualBarcode}
                onChangeText={setManualBarcode}
                placeholder="Enter barcode number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <GradientButton
                title="Cancel"
                onPress={() => {
                  setShowManualInput(false);
                  setManualBarcode('');
                }}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <GradientButton
                title="Search"
                onPress={handleManualSearch}
                variant="primary"
                loading={loading}
                style={{ flex: 1 }}
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
          style={[styles.addProductContainer, { backgroundColor: colors.background }]}
        >
          <ScrollView style={styles.addProductScroll}>
            <View style={[styles.addProductHeader, { backgroundColor: colors.surface }]}>
              <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.addProductTitle, { color: colors.text }]}>Add New Product</Text>
              <View style={{ width: 60 }} />
            </View>
            
            <Text style={[styles.addProductSubtitle, { color: colors.textSecondary }]}>
              Add nutrition info per 100g serving
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Product Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={manualForm.name}
                onChangeText={(text) => setManualForm({ ...manualForm, name: text })}
                placeholder="e.g., Maggi Noodles"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={manualForm.brand}
                onChangeText={(text) => setManualForm({ ...manualForm, brand: text })}
                placeholder="e.g., Nestle"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Calories (kcal)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={manualForm.calories}
                  onChangeText={(text) => setManualForm({ ...manualForm, calories: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Protein (g)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={manualForm.protein}
                  onChangeText={(text) => setManualForm({ ...manualForm, protein: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Carbs (g)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={manualForm.carbohydrates}
                  onChangeText={(text) => setManualForm({ ...manualForm, carbohydrates: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Fat (g)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={manualForm.fat}
                  onChangeText={(text) => setManualForm({ ...manualForm, fat: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Sugar (g)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={manualForm.sugar}
                  onChangeText={(text) => setManualForm({ ...manualForm, sugar: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Sodium (mg)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={manualForm.sodium}
                  onChangeText={(text) => setManualForm({ ...manualForm, sodium: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Saturated Fat (g)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={manualForm.saturatedFat}
                onChangeText={(text) => setManualForm({ ...manualForm, saturatedFat: text })}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formButtons}>
              <GradientButton
                title="Cancel"
                onPress={() => {
                  setShowAddProduct(false);
                  setManualForm(initialFormState);
                }}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <GradientButton
                title="Add Product"
                onPress={handleAddManualProduct}
                variant="primary"
                loading={loading}
                style={{ flex: 1 }}
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
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.large,
  },
  permissionIcon: {
    fontSize: 56,
  },
  permissionTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  manualButton: {
    marginTop: SPACING.lg,
  },
  manualButtonText: {
    fontSize: FONT_SIZE.md,
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
    paddingTop: SPACING.xxl,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  flashButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonActive: {
    backgroundColor: '#10B981',
  },
  flashIcon: {
    fontSize: 24,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  scanFrameInner: {
    width: 280,
    height: 180,
    backgroundColor: 'transparent',
    position: 'relative',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderTopColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  scanLine: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  instructionContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  instructionText: {
    fontSize: FONT_SIZE.xl,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  instructionSubtext: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
  manualEntryIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  manualEntryEmoji: {
    fontSize: 24,
  },
  manualEntryContent: {
    flex: 1,
  },
  manualEntryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  manualEntrySubtitle: {
    fontSize: FONT_SIZE.sm,
  },
  chevronIcon: {
    fontSize: 28,
    marginLeft: 'auto',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  loadingSubtext: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
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
  },
  modalClose: {
    fontSize: FONT_SIZE.xl,
    padding: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
  },
  inputIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  addProductContainer: {
    flex: 1,
  },
  addProductScroll: {
    flex: 1,
  },
  addProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  addProductTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  addProductSubtitle: {
    fontSize: FONT_SIZE.sm,
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
    marginBottom: SPACING.xs,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
});
