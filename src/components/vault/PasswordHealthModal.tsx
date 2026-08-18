/**
 * Life OS & Vault - Password Health Auditor Modal
 * Analyzes stored credentials for weak and reused passwords
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Edit,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Card, Button, ProgressBar, Tag } from '../ui';
import { dbService } from '../../services/db';
import { PasswordHealthReport, PasswordHealthIssue, VaultItem } from '../../types/models';

export interface PasswordHealthModalProps {
  visible: boolean;
  onClose: () => void;
  onFixCredential: (itemId: string) => void;
}

export const PasswordHealthModal: React.FC<PasswordHealthModalProps> = ({
  visible,
  onClose,
  onFixCredential,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [report, setReport] = useState<PasswordHealthReport>({
    totalCount: 0,
    weakCount: 0,
    duplicateCount: 0,
    healthScore: 100,
    issues: [],
  });
  const [loading, setLoading] = useState(false);

  const loadHealth = async () => {
    if (!masterKey) return;
    setLoading(true);
    try {
      const data = await dbService.getPasswordHealth(masterKey);
      setReport(data);
    } catch (e) {
      console.warn('Failed to load password health:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadHealth();
    }
  }, [visible]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Password Health Auditor"
      subtitle="Local zero-cloud cryptographic security check"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {/* Overall Score Card */}
        <Card
          variant="elevated"
          style={[styles.scoreCard, { backgroundColor: colors.bgSecondary }]}
        >
          <View style={styles.scoreRow}>
            <View>
              <Text style={[styles.scoreLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
                VAULT SECURITY SCORE
              </Text>
              <Text
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(report.healthScore), fontSize: typography.hero },
                ]}
              >
                {report.healthScore}%
              </Text>
            </View>

            <View
              style={[
                styles.scoreIconBox,
                {
                  backgroundColor:
                    report.healthScore >= 80 ? colors.successBg : colors.warningBg,
                  borderRadius: radius.xl,
                },
              ]}
            >
              {report.healthScore >= 80 ? (
                <ShieldCheck size={36} color={colors.success} />
              ) : (
                <ShieldAlert size={36} color={colors.warning} />
              )}
            </View>
          </View>

          <ProgressBar
            progress={report.healthScore / 100}
            status={report.healthScore >= 80 ? 'success' : report.healthScore >= 50 ? 'warning' : 'danger'}
            height={8}
            style={{ marginVertical: spacing.sm }}
          />

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={{ color: colors.textTertiary, fontSize: typography.xs }}>Total Accounts</Text>
              <Text style={{ color: colors.textPrimary, fontSize: typography.md, fontWeight: '700' }}>
                {report.totalCount}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={{ color: colors.textTertiary, fontSize: typography.xs }}>Weak Passwords</Text>
              <Text style={{ color: colors.danger, fontSize: typography.md, fontWeight: '700' }}>
                {report.weakCount}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={{ color: colors.textTertiary, fontSize: typography.xs }}>Reused Passwords</Text>
              <Text style={{ color: colors.warning, fontSize: typography.md, fontWeight: '700' }}>
                {report.duplicateCount}
              </Text>
            </View>
          </View>
        </Card>

        {/* Issues List */}
        <Text
          style={[
            styles.issuesHeading,
            { color: colors.textPrimary, fontSize: typography.base, marginTop: spacing.lg, marginBottom: spacing.xs },
          ]}
        >
          Security Issues ({report.issues.length})
        </Text>

        {report.issues.length === 0 ? (
          <Card variant="outlined" style={{ padding: spacing.lg, alignItems: 'center' }}>
            <ShieldCheck size={40} color={colors.success} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: typography.base, fontWeight: '700' }}>
              All Passwords Look Great!
            </Text>
            <Text style={{ color: colors.textTertiary, fontSize: typography.xs, textAlign: 'center', marginTop: 4 }}>
              No weak or duplicate passwords detected across your vault items.
            </Text>
          </Card>
        ) : (
          <ScrollView style={{ maxHeight: 300 }}>
            {report.issues.map((issue, idx) => (
              <Card
                key={`${issue.itemId}_${idx}`}
                variant="outlined"
                style={[styles.issueCard, { marginBottom: spacing.sm }]}
              >
                <View style={styles.issueRow}>
                  <View style={styles.issueInfo}>
                    <View style={styles.issueTitleRow}>
                      <Text style={[styles.issueTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                        {issue.title}
                      </Text>
                      <Tag
                        label={issue.issueType.toUpperCase()}
                        size="sm"
                        color={issue.issueType === 'weak' ? colors.danger : colors.warning}
                      />
                    </View>
                    <Text style={[styles.issueReason, { color: colors.textSecondary, fontSize: typography.xs }]}>
                      {issue.reason}
                    </Text>
                  </View>

                  <Button
                    title="Fix"
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      onClose();
                      onFixCredential(issue.itemId);
                    }}
                  />
                </View>
              </Card>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  scoreCard: {
    padding: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontWeight: '800',
  },
  scoreIconBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metric: {
    alignItems: 'center',
  },
  issuesHeading: {
    fontWeight: '700',
  },
  issueCard: {
    padding: 12,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  issueInfo: {
    flex: 1,
    paddingRight: 8,
  },
  issueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  issueTitle: {
    fontWeight: '700',
  },
  issueReason: {
    lineHeight: 16,
  },
});
