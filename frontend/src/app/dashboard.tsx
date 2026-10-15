import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { getApiBaseUrl } from '../config/api';
import { showAlert, showConfirm } from '../utils/alert';

interface Employee {
  id: string | number;
  name: string;
  position: string;
  status: 'Active' | 'On Leave';
  salary: number;
}

interface ClusterResult {
  group: string;
  centroid: number;
  count: number;
  members?: Array<{ name: string; salary: number; position: string }>;
}

export default function DashboardScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form states for Add Employee
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Phase 2: K-Means Clustering states
  const [clusters, setClusters] = useState<ClusterResult[]>([]);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const API_URL = getApiBaseUrl();

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Fetch Employees [GET /api/employees]
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/employees`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showAlert('Fetch Error', `Failed to load employees: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Add Employee [POST /api/employees] (with Client-Side Validation)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddEmployee = async () => {
    // Client-side validation: prevent submission if fields are empty
    if (!name.trim()) {
      showAlert('Validation Error', 'Please enter employee name.');
      return;
    }
    if (!position.trim()) {
      showAlert('Validation Error', 'Please enter employee position.');
      return;
    }
    if (!salary.trim() || isNaN(Number(salary)) || Number(salary) <= 0) {
      showAlert('Validation Error', 'Please enter a valid positive salary number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          position: position.trim(),
          salary: Number(salary),
        }),
      });

      const newEmp = await res.json();

      if (!res.ok) {
        showAlert('Error', newEmp.message || 'Failed to add employee');
        return;
      }

      // Success: clear inputs and refresh list
      setName('');
      setPosition('');
      setSalary('');
      showAlert('Success', `Added employee "${newEmp.name}" successfully!`);
      fetchEmployees();
    } catch (err: any) {
      showAlert('Network Error', `Could not add employee: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Toggle Status [PUT /api/employees/:id/status]
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleToggleStatus = async (emp: Employee) => {
    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}/status`, {
        method: 'PUT',
      });
      const updated = await res.json();

      if (res.ok) {
        // Optimistically or state update
        setEmployees((prev) =>
          prev.map((e) => (String(e.id) === String(emp.id) ? updated : e))
        );
      } else {
        showAlert('Error', updated.message || 'Failed to update status');
      }
    } catch (err: any) {
      showAlert('Error', `Network failure: ${err.message}`);
    }
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Delete Employee [DELETE /api/employees/:id] with Alert Confirmation
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDeleteEmployee = (emp: Employee) => {
    // Confirmation dialog ("Are you sure?") required by exam
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${emp.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/employees/${emp.id}`, {
                method: 'DELETE',
              });
              const result = await res.json();
              if (res.ok) {
                setEmployees((prev) =>
                  prev.filter((e) => String(e.id) !== String(emp.id))
                );
                showAlert('Deleted', result.message || 'Employee removed.');
              } else {
                showAlert('Error', result.message || 'Failed to delete');
              }
            } catch (err: any) {
              showAlert('Error', `Delete request failed: ${err.message}`);
            }
          },
        },
      ]
    );
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Phase 2: K-Means Salary Clustering [GET /api/employees/salary-clusters]
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAnalyzeSalary = async () => {
    setClusteringLoading(true);
    setHasAnalyzed(true);

    try {
      const res = await fetch(`${API_URL}/employees/salary-clusters`);
      const data = await res.json();

      if (res.ok && data.success) {
        setClusters(data.clusters || []);
      } else {
        Alert.alert(
          'Analysis Notice',
          data.message || 'Failed to calculate clusters. (Need at least 3 employees).'
        );
      }
    } catch (err: any) {
      showAlert('Error', `Could not fetch clustering analytics: ${err.message}`);
    } finally {
      setClusteringLoading(false);
    }
  };

  // Stats calculation
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const avgSalary =
    totalEmployees > 0
      ? Math.round(
          employees.reduce((sum, e) => sum + Number(e.salary || 0), 0) /
            totalEmployees
        )
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#38bdf8"
        />
      }
    >
      {/* Header bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>HR Management System</Text>
          <Text style={styles.appSubtitle}>
            Std: 6730202246 â€¢ à¸™à¸£à¸¸à¸ªà¸£à¸“à¹Œ à¹€à¸£à¸·à¸­à¸‡à¹‚à¸Šà¸•à¸´
          </Text>
        </View>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Staff</Text>
          <Text style={styles.statValue}>{totalEmployees}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={[styles.statValue, { color: '#34d399' }]}>
            {activeCount}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>On Leave</Text>
          <Text style={[styles.statValue, { color: '#fbbf24' }]}>
            {onLeaveCount}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Salary</Text>
          <Text style={[styles.statValue, { color: '#60a5fa', fontSize: 15 }]}>
            à¸¿{avgSalary.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* PHASE 2: K-Means Salary Clustering Section                           */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>Phase 2: AI Analytics</Text>
            </View>
            <Text style={styles.sectionTitle}>Automated Salary Clustering</Text>
            <Text style={styles.sectionSubtitle}>
              1D K-Means Algorithm (k=3) groups compensation into 3 tiers
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, clusteringLoading && styles.btnDisabled]}
          onPress={handleAnalyzeSalary}
          disabled={clusteringLoading}
        >
          {clusteringLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.analyzeBtnText}>Analyzing Clusters...</Text>
            </View>
          ) : (
            <Text style={styles.analyzeBtnText}>
              âš¡ Analyze Salary Structure (K-Means)
            </Text>
          )}
        </TouchableOpacity>

        {/* Cluster Results: Summary Cards */}
        {clusteringLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38bdf8" size="large" />
            <Text style={styles.loadingText}>
              Processing 1D K-Means clustering algorithm...
            </Text>
          </View>
        )}

        {!clusteringLoading && hasAnalyzed && clusters.length > 0 && (
          <View style={styles.clustersContainer}>
            <Text style={styles.clustersHeader}>Clustering Results (3 Tiers):</Text>
            <View style={styles.tierCardsRow}>
              {clusters.map((cl, idx) => {
                const tierColor =
                  idx === 0 ? '#38bdf8' : idx === 1 ? '#a855f7' : '#f59e0b';
                const tierBg =
                  idx === 0
                    ? 'rgba(56, 189, 248, 0.1)'
                    : idx === 1
                    ? 'rgba(168, 85, 247, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)';

                return (
                  <View
                    key={idx}
                    style={[
                      styles.tierCard,
                      { borderColor: tierColor, backgroundColor: tierBg },
                    ]}
                  >
                    <View style={styles.tierBadge}>
                      <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                        {cl.group || `Tier ${idx + 1}`}
                      </Text>
                    </View>
                    <Text style={styles.tierCentroidLabel}>Average (Centroid)</Text>
                    <Text style={[styles.tierCentroidValue, { color: tierColor }]}>
                      à¸¿{cl.centroid.toLocaleString()}
                    </Text>
                    <View style={styles.tierCountBadge}>
                      <Text style={styles.tierCountText}>
                        ðŸ‘¥ {cl.count} {cl.count === 1 ? 'Person' : 'People'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* PHASE 1: Add Employee Form                                           */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <View style={[styles.phaseBadge, { borderColor: '#10b981' }]}>
              <Text style={[styles.phaseBadgeText, { color: '#34d399' }]}>
                Phase 1: Create
              </Text>
            </View>
            <Text style={styles.sectionTitle}>Add New Employee</Text>
            <Text style={styles.sectionSubtitle}>
              Client-side validation strictly enforces non-empty fields
            </Text>
          </View>
        </View>

        <View style={styles.formGrid}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. à¸ªà¸¡à¸¨à¸±à¸à¸”à¸´à¹Œ à¸¡à¸µà¸ªà¸¸à¸‚"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Position *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Frontend Engineer"
              placeholderTextColor="#64748b"
              value={position}
              onChangeText={setPosition}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Salary (THB / Mo) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 45000"
              placeholderTextColor="#64748b"
              value={salary}
              onChangeText={setSalary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, submitting && styles.btnDisabled]}
          onPress={handleAddEmployee}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.addBtnText}>+ Add Employee to System</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* PHASE 1: Employee List (CRUD UI)                                      */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.sectionCard}>
        <View style={styles.listHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Employee Directory</Text>
            <Text style={styles.sectionSubtitle}>
              {employees.length} records in server memory
            </Text>
          </View>
          <TouchableOpacity onPress={fetchEmployees} style={styles.refreshIconBtn}>
            <Text style={styles.refreshIconText}>â†» Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading && employees.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38bdf8" />
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No employees found.</Text>
            <Text style={styles.emptySubtext}>Use the form above to add one.</Text>
          </View>
        ) : (
          employees.map((emp) => {
            const isActive = emp.status === 'Active';
            return (
              <View key={String(emp.id)} style={styles.empCard}>
                <View style={styles.empMain}>
                  <View style={styles.empHeaderRow}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isActive ? styles.statusActive : styles.statusLeave,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isActive ? styles.statusTextActive : styles.statusTextLeave,
                        ]}
                      >
                        â— {emp.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.empPosition}>{emp.position}</Text>
                  <Text style={styles.empSalary}>
                    Salary:{' '}
                    <Text style={styles.salaryHighlight}>
                      à¸¿{Number(emp.salary).toLocaleString()}
                    </Text>
                  </Text>
                </View>

                {/* Actions: Toggle Status & Delete */}
                <View style={styles.empActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      isActive ? styles.btnLeave : styles.btnActive,
                    ]}
                    onPress={() => handleToggleStatus(emp)}
                  >
                    <Text style={styles.actionBtnText}>
                      {isActive ? 'Mark On Leave' : 'Set Active'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnDelete]}
                    onPress={() => handleDeleteEmployee(emp)}
                  >
                    <Text style={[styles.actionBtnText, styles.deleteBtnText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  signOutText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  sectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  phaseBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  analyzeBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  analyzeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  clustersContainer: {
    marginTop: 16,
  },
  clustersHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  tierCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  tierBadge: {
    marginBottom: 6,
  },
  tierBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tierCentroidLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  tierCentroidValue: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 4,
  },
  tierCountBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierCountText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  formGrid: {
    gap: 10,
    marginBottom: 14,
  },
  inputWrap: {},
  inputLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshIconBtn: {
    padding: 4,
  },
  refreshIconText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  empCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  empMain: {
    marginBottom: 10,
  },
  empHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#34d399',
  },
  statusTextLeave: {
    color: '#fbbf24',
  },
  empPosition: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  empSalary: {
    fontSize: 12,
    color: '#64748b',
  },
  salaryHighlight: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  empActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#d97706',
  },
  btnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  btnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  deleteBtnText: {
    color: '#f87171',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
});
