import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../src/constants';
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

  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setLoading(false);
      console.log('[Scanner] Screen focused, ready to scan');
    }, [])
  );

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading) return;
    
    const barcode = result.data;
    console.log('[Scanner] Barcode detected:', barcode);
    
    if (lastScannedBarcode === barcode) {
      console.log('[Scanner] Same barcode already scanned, ignoring');
      return;
    }
    
    setScanned(true);
    setLoading(true);
    setLastScannedBarcode(barcode);

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
          'This product is not in our database. Would you like to add it manually?',
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
          'This product is not in our database. Would you like to add it manually?',
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
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan food barcodes
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          variant="primary"
          size="large"
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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'code93',
            'itf14',
            'codabar',
            'qr',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.flashButton}
              onPress={() => setFlashOn(!flashOn)}
              accessibilityRole="button"
              accessibilityLabel={flashOn ? 'Turn off flash' : 'Turn on flash'}
            >
              <Text style={styles.flashIcon}>{flashOn ? '⚡' : '🔦'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.instructionText}>
              {loading ? 'Searching...' : 'Point camera at barcode'}
            </Text>
            
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
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching for product...</Text>
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
            <Text style={styles.modalTitle}>Enter Barcode</Text>
            <Text style={styles.modalSubtitle}>
              Type the barcode number manually
            </Text>
            <TextInput
              style={styles.input}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Enter barcode"
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
              <Text style={styles.addProductTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
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
  permissionIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  permissionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 280,
    height: 180,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'transparent',
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
    marginBottom: SPACING.md,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
    marginBottom: SPACING.lg,
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  addProductTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textSecondary,
    padding: SPACING.sm,
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
    borderRadius: BORDER_RADIUS.md,
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