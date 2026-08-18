/**
 * Life OS & Vault - Activity Log Modal Component
 * Security audit trail displaying the last 100 system events and clear log action
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ShieldAlert,
  Clock,
  Trash2,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Modal, Button, Card } from '../ui';
import { dbService } from '../../services/db';
import { AuditLog } from '../../types/models';

export interface ActivityLogModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await dbService.getAuditLogs(100);
      setLogs(data);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Activity Log?',
      'This will delete all security event records permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await dbService.clearAuditLogs();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            await loadLogs();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Security Activity Trail"
      subtitle={`Last ${logs.length} system audit events`}
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {logs.length > 0 && (
          <Button
            title="Clear Activity Log"
            variant="outline"
            size="sm"
            iconLeft={<Trash2 size={14} color={colors.danger} />}
            onPress={handleClear}
            style={{ marginBottom: spacing.md, borderColor: colors.dangerBg }}
            textStyle={{ color: colors.danger }}
          />
        )}

        <ScrollView style={{ maxHeight: 380 }}>
          {logs.length === 0 ? (
            <Card variant="outlined" style={styles.emptyBox}>
              <Activity size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.sm }]}>
                No audit events recorded yet.
              </Text>
            </Card>
          ) : (
            logs.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.logRow,
                  {
                    borderBottomColor: colors.borderSubtle,
                    borderBottomWidth: idx < logs.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.logLeft}>
                  <Text style={[styles.logAction, { color: colors.textPrimary, fontSize: typography.sm }]}>
                    {item.action.replace(/_/g, ' ')}
                  </Text>
                  {item.entity_type && (
                    <Text style={[styles.logEntity, { color: colors.textTertiary, fontSize: typography.xs }]}>
                      Type: {item.entity_type} {item.entity_id ? `(${item.entity_id.slice(0, 12)}...)` : ''}
                    </Text>
                  )}
                </View>

                <Text style={[styles.logTime, { color: colors.textMuted, fontSize: 10 }]}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  • {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  logLeft: {
    flex: 1,
    paddingRight: 8,
  },
  logAction: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  logEntity: {
    marginTop: 2,
  },
  logTime: {
    fontWeight: '500',
  },
});
