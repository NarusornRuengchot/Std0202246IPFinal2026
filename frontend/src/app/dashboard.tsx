import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Modal,
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

interface ClusterMember {
  id?: string | number;
  name: string;
  salary: number;
  position: string;
  status?: string;
}

interface ClusterResult {
  group: string;
  centroid: number;
  count: number;
  members?: ClusterMember[];
}

// Currency formatter: Thai Baht
const formatTHB = (amount: number | string) => {
  return `\u0E3F${Number(amount || 0).toLocaleString()}`;
};

export default function DashboardScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'On Leave'>('All');

  // Form states for Add Employee
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Employee State (Modal)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'On Leave'>('Active');
  const [editSaving, setEditSaving] = useState(false);

  // Phase 2: K-Means Clustering states
  const [clusters, setClusters] = useState<ClusterResult[]>([]);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [clusterViewMode, setClusterViewMode] = useState<'table' | 'cards'>('table');

  const API_URL = getApiBaseUrl();

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Employees [GET /api/employees]
  // ───────────────────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/employees`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
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

  // ───────────────────────────────────────────────────────────────────────────
  // Add Employee [POST /api/employees]
  // ───────────────────────────────────────────────────────────────────────────
  const handleAddEmployee = async () => {
    if (!name.trim()) {
      showAlert('Validation Error', 'Please enter employee name.');
      return;
    }
    if (!position.trim()) {
      showAlert('Validation Error', 'Please enter employee position.');
      return;
    }
    if (!salary.trim() || isNaN(Number(salary)) || Number(salary) <= 0) {
      showAlert('Validation Error', 'Please enter a valid positive salary amount.');
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

  // ───────────────────────────────────────────────────────────────────────────
  // Edit Employee [PUT /api/employees/:id]
  // ───────────────────────────────────────────────────────────────────────────
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditPosition(emp.position);
    setEditSalary(String(emp.salary));
    setEditStatus(emp.status);
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;

    if (!editName.trim()) {
      showAlert('Validation Error', 'Employee name cannot be empty.');
      return;
    }
    if (!editPosition.trim()) {
      showAlert('Validation Error', 'Position cannot be empty.');
      return;
    }
    if (!editSalary.trim() || isNaN(Number(editSalary)) || Number(editSalary) <= 0) {
      showAlert('Validation Error', 'Valid positive salary is required.');
      return;
    }

    try {
      setEditSaving(true);
      const res = await fetch(`${API_URL}/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          position: editPosition.trim(),
          salary: Number(editSalary),
          status: editStatus,
        }),
      });

      let updated;
      const textResponse = await res.text();
      try {
        updated = JSON.parse(textResponse);
      } catch (e) {
        showAlert(
          'Server Notice',
          'Server route was not updated. Please upload server.js to FileZilla and restart node server.js.'
        );
        return;
      }

      if (!res.ok) {
        showAlert('Update Error', updated.message || 'Failed to update employee');
        return;
      }

      setEmployees((prev) =>
        prev.map((e) => (String(e.id) === String(editingEmployee.id) ? updated : e))
      );
      setEditingEmployee(null);
      showAlert('Success', `Updated "${updated.name}" successfully!`);
    } catch (err: any) {
      showAlert('Error', `Network update failed: ${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Toggle Status [PUT /api/employees/:id/status]
  // ───────────────────────────────────────────────────────────────────────────
  const handleToggleStatus = async (emp: Employee) => {
    try {
      const res = await fetch(`${API_URL}/employees/${emp.id}/status`, {
        method: 'PUT',
      });
      const updated = await res.json();

      if (res.ok) {
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

  // ───────────────────────────────────────────────────────────────────────────
  // Delete Employee [DELETE /api/employees/:id]
  // ───────────────────────────────────────────────────────────────────────────
  const handleDeleteEmployee = (emp: Employee) => {
    showConfirm(
      'Confirm Delete',
      `Are you sure you want to delete "${emp.name}"? This action cannot be undone.`,
      async () => {
        try {
          let res = await fetch(`${API_URL}/employees/${emp.id}`, {
            method: 'DELETE',
          });

          if (!res.ok && res.status === 405) {
            res = await fetch(`${API_URL}/employees/${emp.id}/delete`, {
              method: 'POST',
            });
          }

          const result = await res.json();
          if (res.ok) {
            setEmployees((prev) =>
              prev.filter((e) => String(e.id) !== String(emp.id))
            );
            showAlert('Deleted', result.message || 'Employee deleted successfully.');
          } else {
            showAlert('Delete Error', result.message || 'Failed to delete employee.');
          }
        } catch (err: any) {
          showAlert('Network Error', `Delete request failed: ${err.message}`);
        }
      }
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Phase 2: K-Means Salary Clustering [GET /api/employees/salary-clusters]
  // ───────────────────────────────────────────────────────────────────────────
  const handleAnalyzeSalary = async () => {
    setClusteringLoading(true);
    setHasAnalyzed(true);

    try {
      const res = await fetch(`${API_URL}/employees/salary-clusters`);
      const data = await res.json();

      if (res.ok && data.success) {
        setClusters(data.clusters || []);
      } else {
        showAlert(
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

  // Filtered employees list based on search and status
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      emp.name.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      String(emp.salary).includes(q);

    const matchesStatus =
      statusFilter === 'All' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
            Corporate Workforce Directory & Compensation Analytics
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
          <Text style={[styles.statValue, { color: '#60a5fa', fontSize: 16 }]}>
            {formatTHB(avgSalary)}
          </Text>
        </View>
      </View>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* PHASE 2: K-Means Salary Clustering Section                           */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>AI Analytics Engine</Text>
            </View>
            <Text style={styles.sectionTitle}>Automated Salary Clustering (K-Means)</Text>
            <Text style={styles.sectionSubtitle}>
              1D K-Means Algorithm (k=3) groups compensation into 3 salary tiers
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
              [ Run 1D K-Means Clustering Analytics ]
            </Text>
          )}
        </TouchableOpacity>

        {/* Cluster Results */}
        {clusteringLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38bdf8" size="large" />
            <Text style={styles.loadingText}>
              Calculating 1D K-Means clustering algorithm...
            </Text>
          </View>
        )}

        {!clusteringLoading && hasAnalyzed && clusters.length > 0 && (
          <View style={styles.clustersContainer}>
            {/* View Switcher: Table vs Cards */}
            <View style={styles.viewToggleRow}>
              <Text style={styles.clustersHeader}>Clustering Results (3 Tiers):</Text>
              <View style={styles.toggleButtons}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    clusterViewMode === 'table' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setClusterViewMode('table')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      clusterViewMode === 'table' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Table View
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    clusterViewMode === 'cards' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setClusterViewMode('cards')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      clusterViewMode === 'cards' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Cards View
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mode 1: Cards View */}
            {clusterViewMode === 'cards' && (
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
                      <Text style={styles.tierCentroidLabel}>Average Centroid</Text>
                      <Text style={[styles.tierCentroidValue, { color: tierColor }]}>
                        {formatTHB(cl.centroid)}
                      </Text>
                      <View style={styles.tierCountBadge}>
                        <Text style={styles.tierCountText}>
                          {cl.count} {cl.count === 1 ? 'Employee' : 'Employees'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Mode 2: Table View */}
            {clusterViewMode === 'table' && (
              <View style={styles.tableWrapper}>
                {/* 1. Summary Table */}
                <Text style={styles.subTableTitle}>
                  1. Tier Summary Table (Centroids & Distribution)
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 1.2 }]}>Tier Group</Text>
                    <Text style={[styles.th, { flex: 1.6, textAlign: 'right' }]}>
                      Centroid (Avg Salary)
                    </Text>
                    <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>
                      Headcount
                    </Text>
                    <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>
                      Share %
                    </Text>
                  </View>
                  {clusters.map((cl, idx) => {
                    const tierColor =
                      idx === 0 ? '#38bdf8' : idx === 1 ? '#a855f7' : '#f59e0b';
                    const share =
                      totalEmployees > 0
                        ? Math.round((cl.count / totalEmployees) * 100)
                        : 0;
                    return (
                      <View key={idx} style={styles.tableRow}>
                        <View
                          style={[
                            styles.td,
                            {
                              flex: 1.2,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            },
                          ]}
                        >
                          <View
                            style={[styles.colorDot, { backgroundColor: tierColor }]}
                          />
                          <Text style={[styles.tdTextBold, { color: tierColor }]}>
                            {cl.group}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.td,
                            styles.tdText,
                            {
                              flex: 1.6,
                              textAlign: 'right',
                              color: '#f8fafc',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {formatTHB(cl.centroid)}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdText,
                            { flex: 1, textAlign: 'center' },
                          ]}
                        >
                          {cl.count} Persons
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdText,
                            { flex: 1, textAlign: 'right', color: '#94a3b8' },
                          ]}
                        >
                          {share}%
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* 2. Detailed Member List by Tier Table */}
                <Text style={[styles.subTableTitle, { marginTop: 16 }]}>
                  2. Detailed Employee Tier Classification
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 0.6 }]}>#</Text>
                    <Text style={[styles.th, { flex: 1.6 }]}>Employee Name</Text>
                    <Text style={[styles.th, { flex: 1.4 }]}>Position</Text>
                    <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>
                      Salary
                    </Text>
                    <Text style={[styles.th, { flex: 1.1, textAlign: 'center' }]}>
                      Assigned Tier
                    </Text>
                  </View>

                  {clusters.flatMap((cl, cIdx) => {
                    const tierColor =
                      cIdx === 0 ? '#38bdf8' : cIdx === 1 ? '#a855f7' : '#f59e0b';
                    return (cl.members || []).map((m, mIdx) => (
                      <View key={`${cIdx}-${mIdx}`} style={styles.tableRow}>
                        <Text
                          style={[
                            styles.td,
                            styles.tdText,
                            { flex: 0.6, color: '#64748b' },
                          ]}
                        >
                          {mIdx + 1}
                        </Text>
                        <Text style={[styles.td, styles.tdTextBold, { flex: 1.6 }]}>
                          {m.name}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdText,
                            { flex: 1.4, color: '#94a3b8' },
                          ]}
                        >
                          {m.position}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdText,
                            {
                              flex: 1.4,
                              textAlign: 'right',
                              color: '#38bdf8',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {formatTHB(m.salary)}
                        </Text>
                        <View style={[styles.td, { flex: 1.1, alignItems: 'center' }]}>
                          <View
                            style={[
                              styles.tierTag,
                              {
                                backgroundColor: `${tierColor}20`,
                                borderColor: tierColor,
                              },
                            ]}
                          >
                            <Text style={[styles.tierTagText, { color: tierColor }]}>
                              {cl.group}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ));
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* PHASE 1: Add Employee Form                                           */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <View style={[styles.phaseBadge, { borderColor: '#10b981' }]}>
              <Text style={[styles.phaseBadgeText, { color: '#34d399' }]}>
                Employee Onboarding
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
              placeholder="e.g. John Smith"
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

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* PHASE 1: Employee List (CRUD UI) with SEARCH & FILTER                 */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.listHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Employee Directory</Text>
            <Text style={styles.sectionSubtitle}>
              Showing {filteredEmployees.length} of {employees.length} records in database
            </Text>
          </View>
          <TouchableOpacity onPress={fetchEmployees} style={styles.refreshIconBtn}>
            <Text style={styles.refreshIconText}>[ Refresh ]</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR & STATUS FILTER CHIPS */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, position, or salary..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter Chips */}
          <View style={styles.filterChipRow}>
            {(['All', 'Active', 'On Leave'] as const).map((filter) => {
              const isActive = statusFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading && employees.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38bdf8" />
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        ) : filteredEmployees.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No matching employees found.</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery.length > 0
                ? 'Try a different search term or clear filters.'
                : 'Use the form above to add an employee.'}
            </Text>
          </View>
        ) : (
          filteredEmployees.map((emp) => {
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
                        {emp.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.empPosition}>{emp.position}</Text>
                  <Text style={styles.empSalary}>
                    Salary:{' '}
                    <Text style={styles.salaryHighlight}>
                      {formatTHB(emp.salary)}
                    </Text>
                  </Text>
                </View>

                {/* Actions: Toggle Status, Edit & Delete */}
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
                    style={[styles.actionBtn, styles.btnEdit]}
                    onPress={() => openEditModal(emp)}
                  >
                    <Text style={[styles.actionBtnText, styles.editBtnText]}>
                      Edit
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

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* EDIT EMPLOYEE MODAL                                                   */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={editingEmployee !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingEmployee(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Employee Details</Text>
            <Text style={styles.modalSubtitle}>
              Update information for ID: {editingEmployee?.id}
            </Text>

            <View style={styles.modalForm}>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Position</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPosition}
                  onChangeText={setEditPosition}
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Salary (THB)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editSalary}
                  onChangeText={setEditSalary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusToggleGroup}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      editStatus === 'Active' && styles.statusToggleBtnActive,
                    ]}
                    onPress={() => setEditStatus('Active')}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        editStatus === 'Active' && styles.statusToggleTextActive,
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      editStatus === 'On Leave' && styles.statusToggleBtnLeave,
                    ]}
                    onPress={() => setEditStatus('On Leave')}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        editStatus === 'On Leave' && styles.statusToggleTextLeave,
                      ]}
                    >
                      On Leave
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingEmployee(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, editSaving && styles.btnDisabled]}
                onPress={handleSaveEdit}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  signOutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    cursor: 'pointer' as any,
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
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
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
  viewToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clustersHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  toggleBtnActive: {
    backgroundColor: '#2563eb',
  },
  toggleBtnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 4,
  },
  tierCountBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierCountText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  tableWrapper: {
    marginTop: 4,
  },
  subTableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  table: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.6)',
    alignItems: 'center',
  },
  td: {
    fontSize: 12,
  },
  tdText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  tdTextBold: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formGrid: {
    gap: 10,
    marginBottom: 14,
  },
  inputWrap: {
    marginBottom: 8,
  },
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
    cursor: 'pointer' as any,
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
    cursor: 'pointer' as any,
  },
  refreshIconText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  searchSection: {
    marginBottom: 14,
    gap: 8,
  },
  searchBarWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 40,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
    cursor: 'pointer' as any,
  },
  clearSearchText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    cursor: 'pointer' as any,
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  filterChipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
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
    cursor: 'pointer' as any,
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
  btnEdit: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#2563eb',
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
  editBtnText: {
    color: '#60a5fa',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  modalForm: {
    gap: 8,
    marginBottom: 16,
  },
  statusToggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    cursor: 'pointer' as any,
  },
  statusToggleBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  statusToggleBtnLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
  },
  statusToggleText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statusToggleTextActive: {
    color: '#34d399',
    fontWeight: '700',
  },
  statusToggleTextLeave: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  modalCancelText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 13,
  },
  modalSaveBtn: {
    flex: 1.5,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
