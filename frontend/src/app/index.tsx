import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { getApiBaseUrl, setApiBaseUrl } from '../config/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [showApiConfig, setShowApiConfig] = useState(false);

  const handleLogin = async () => {
    // Client-side validation
    if (!username.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    setApiBaseUrl(apiUrl.trim());

    try {
      const response = await fetch(`${apiUrl.trim()}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success: navigate to dashboard
        router.replace('/dashboard');
      } else {
        // Failed: display alert
        Alert.alert(
          'Login Failed',
          data.message || 'Invalid username or password. Please try again.'
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Connection Error',
        `Cannot connect to backend server at ${apiUrl}.\nPlease verify the server is running.\n\nError: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header / Brand */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>IP Final Exam 2026</Text>
          </View>
          <Text style={styles.title}>HR Manager & Analytics</Text>
          <Text style={styles.subtitle}>
            Student ID: 6730202246 • Narusorn Ruengchot
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In to Your Account</Text>
          <Text style={styles.cardSubtitle}>
            Enter administrator credentials to manage records
          </Text>

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. admin"
              placeholderTextColor="#64748b"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. password123"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Quick Credential Hint */}
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Default credentials: <Text style={styles.hintBold}>admin</Text> /{' '}
              <Text style={styles.hintBold}>password123</Text>
            </Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In to Dashboard →</Text>
            )}
          </TouchableOpacity>

          {/* API Server Config Toggle */}
          <TouchableOpacity
            style={styles.toggleConfigBtn}
            onPress={() => setShowApiConfig(!showApiConfig)}
          >
            <Text style={styles.toggleConfigText}>
              {showApiConfig ? '▼ Hide Server Settings' : '⚙ Server Settings (Backend URL)'}
            </Text>
          </TouchableOpacity>

          {showApiConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>Backend API Base URL:</Text>
              <TextInput
                style={styles.configInput}
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.quickUrls}>
                <TouchableOpacity
                  style={styles.quickUrlBtn}
                  onPress={() => setApiUrl('http://localhost:3024/api')}
                >
                  <Text style={styles.quickUrlText}>Local (3024)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickUrlBtn}
                  onPress={() => setApiUrl('http://119.59.102.161:3024/api')}
                >
                  <Text style={styles.quickUrlText}>KU Server (3024)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          Faculty of Science at Sriracha • Kasetsart University
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badgeContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hintBox: {
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  hintText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  hintBold: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleConfigBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  toggleConfigText: {
    color: '#64748b',
    fontSize: 12,
  },
  configBox: {
    marginTop: 14,
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  configLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '600',
  },
  configInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  quickUrls: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  quickUrlBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  quickUrlText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },
});
