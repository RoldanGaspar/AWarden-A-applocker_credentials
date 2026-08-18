/**
 * Life OS & Vault - Reusable Credential Form Component
 * Used for both Add and Edit flows across Vault and QuickActions
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
  Sparkles,
  Folder as FolderIcon,
  Star,
  Plus,
  X,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, Tag, Switch, Card, ProgressBar } from '../ui';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';
import { dbService } from '../../services/db';
import { VaultItem, Folder } from '../../types/models';
import { CryptoService } from '../../services/cryptoService';

export interface CredentialFormProps {
  initialItem?: VaultItem | null;
  onSave: (item: Omit<VaultItem, 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  submitButtonTitle?: string;
}

export const CredentialForm: React.FC<CredentialFormProps> = ({
  initialItem,
  onSave,
  onCancel,
  submitButtonTitle = 'Save Credential',
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [title, setTitle] = useState(initialItem?.title || '');
  const [username, setUsername] = useState(initialItem?.username || '');
  const [password, setPassword] = useState(initialItem?.password || '');
  const [url, setUrl] = useState(initialItem?.url || '');
  const [notes, setNotes] = useState(initialItem?.notes || '');
  const [folderId, setFolderId] = useState<string | null>(initialItem?.folder_id || null);
  const [tags, setTags] = useState<string[]>(initialItem?.tags || []);
  const [isFavorite, setIsFavorite] = useState(initialItem?.is_favorite || false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [generatorVisible, setGeneratorVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await dbService.getFolders('vault');
      setFolders(data);
      if (!folderId && data.length > 0) {
        setFolderId(data[0].id);
      }
    } catch (e) {
      console.warn('Failed to load folders:', e);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (tags.length >= 5) {
      setError('Maximum 5 tags allowed');
      return;
    }
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
    setShowTagInput(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title / Service Name is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        id: initialItem?.id || `item_${Date.now()}`,
        folder_id: folderId,
        title: title.trim(),
        username: username.trim(),
        password,
        url: url.trim() || null,
        notes: notes.trim() || null,
        tags,
        is_favorite: isFavorite,
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to save credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = CryptoService.evaluatePasswordStrength(password);

  return (
    <View style={styles.container}>
      <Input
        label="Service / Website Title *"
        placeholder="e.g. Google, GitHub, Netflix"
        value={title}
        onChangeText={setTitle}
        autoFocus={!initialItem}
      />

      <Input
        label="Username / Email"
        placeholder="e.g. user@example.com"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Password with Generator Button */}
      <View style={styles.passwordRow}>
        <View style={{ flex: 1 }}>
          <Input
            label="Password *"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            isPassword
          />
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setGeneratorVisible(true);
          }}
          style={[
            styles.generatorBtn,
            { backgroundColor: accent.primaryBgLight, borderColor: accent.primary, borderRadius: radius.md },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open password generator"
        >
          <Sparkles size={18} color={accent.primary} />
        </TouchableOpacity>
      </View>

      {password.length > 0 && (
        <View style={{ marginTop: -8, marginBottom: 12 }}>
          <View style={styles.strengthRow}>
            <Text style={{ color: colors.textTertiary, fontSize: typography.xs }}>
              Strength: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{strength.label}</Text>
            </Text>
          </View>
          <ProgressBar
            progress={strength.score / 4}
            status={strength.score <= 1 ? 'danger' : strength.score === 2 ? 'warning' : 'success'}
            height={5}
            style={{ marginTop: 4 }}
          />
        </View>
      )}

      <Input
        label="Website URL (Optional)"
        placeholder="https://example.com"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      {/* Folder Picker */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
        Folder Category
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {folders.map((f) => {
          const isSelected = folderId === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFolderId(f.id);
              }}
              style={[
                styles.folderChip,
                {
                  backgroundColor: isSelected ? f.color : colors.bgSecondary,
                  borderColor: isSelected ? f.color : colors.borderSubtle,
                  borderRadius: radius.full,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select folder ${f.name}`}
            >
              <View
                style={[
                  styles.folderDot,
                  { backgroundColor: isSelected ? '#FFFFFF' : f.color },
                ]}
              />
              <Text
                style={[
                  styles.folderChipText,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: typography.sm },
                ]}
              >
                {f.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tags */}
      <View style={styles.tagHeaderRow}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
          Tags ({tags.length}/5)
        </Text>
        {!showTagInput && tags.length < 5 && (
          <TouchableOpacity
            onPress={() => setShowTagInput(true)}
            style={styles.addTagBtn}
            accessibilityRole="button"
            accessibilityLabel="Add new tag"
          >
            <Plus size={14} color={accent.primary} />
            <Text style={[styles.addTagText, { color: accent.primary, fontSize: typography.xs }]}>
              Add Tag
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showTagInput && (
        <View style={styles.tagInputRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Tag name (e.g. Work, Social)"
              value={newTagInput}
              onChangeText={setNewTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
          </View>
          <Button
            title="Add"
            size="sm"
            onPress={handleAddTag}
            style={{ marginLeft: 8, height: 44, marginTop: -16 }}
          />
        </View>
      )}

      <View style={styles.tagsContainer}>
        {tags.map((t) => (
          <Tag key={t} label={t} onRemove={() => handleRemoveTag(t)} />
        ))}
      </View>

      {/* Favorite Toggle */}
      <View style={[styles.switchContainer, { borderTopColor: colors.borderSubtle, borderTopWidth: 1, marginTop: 12 }]}>
        <Switch
          label="Favorite Credential"
          subtitle="Star this account for priority access"
          value={isFavorite}
          onValueChange={setIsFavorite}
        />
      </View>

      <Input
        label="Encrypted Secret Notes"
        placeholder="Recovery questions, PINs, or secondary codes (encrypted with AES-256)"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        inputStyle={{ height: 80, textAlignVertical: 'top' }}
        errorText={error}
      />

      {/* Form Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={onCancel}
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title={submitButtonTitle}
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={{ flex: 2 }}
        />
      </View>

      {/* CSPRNG Password Generator Modal */}
      <PasswordGeneratorModal
        visible={generatorVisible}
        onClose={() => setGeneratorVisible(false)}
        onSelectPassword={(pwd) => {
          setPassword(pwd);
          setError('');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  generatorBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 24,
  },
  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sectionLabel: {
    fontWeight: '600',
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  folderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  folderChipText: {
    fontWeight: '600',
  },
  tagHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagText: {
    fontWeight: '600',
    marginLeft: 2,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  switchContainer: {
    paddingTop: 12,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
});
