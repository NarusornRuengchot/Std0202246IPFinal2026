import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { getApiBaseUrl, setApiBaseUrl } from '../config/api';
import { showAlert } from '../utils/alert';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [showApiConfig, setShowApiConfig] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('Validation Error', 'Please enter your username and password.');
      return;
    }

    setLoading(true);
    const targetUrl = apiUrl.trim();
    setApiBaseUrl(targetUrl);

    try {
      const response = await fetch(`${targetUrl}/login`, {
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
        router.replace('/dashboard');
      } else {
        showAlert(
          'Authentication Failed',
          data.message || 'Invalid username or password. Please try again.'
        );
      }
    } catch (err: any) {
      showAlert(
        'Connection Error',
        `Unable to reach the server at ${targetUrl}.\nPlease ensure the service is running and accessible.`
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
            <Text style={styles.badgeText}>Enterprise HR Platform</Text>
          </View>
          <Text style={styles.title}>HR Manager & Analytics</Text>
          <Text style={styles.subtitle}>
            Enterprise Workforce Management & Compensation Intelligence
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Access your human resources and analytics management console
          </Text>

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your corporate username"
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
              placeholder="Enter your account password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
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
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Server Config Toggle (Discreet) */}
          <TouchableOpacity
            style={styles.toggleConfigBtn}
            onPress={() => setShowApiConfig(!showApiConfig)}
          >
            <Text style={styles.toggleConfigText}>
              {showApiConfig ? 'Hide Gateway Settings' : 'Network Settings'}
            </Text>
          </TouchableOpacity>

          {showApiConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>API Endpoint Gateway:</Text>
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
                  onPress={() => setApiUrl('http://119.59.102.161:3024/api')}
                >
                  <Text style={styles.quickUrlText}>Primary Server (3024)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickUrlBtn}
                  onPress={() => setApiUrl('http://localhost:3024/api')}
                >
                  <Text style={styles.quickUrlText}>Localhost (3024)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          © 2026 HRMS Enterprise Solutions Inc. All rights reserved.
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
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
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
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
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
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    marginTop: 6,
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
    marginTop: 20,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  toggleConfigText: {
    color: '#475569',
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
    cursor: 'pointer' as any,
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
