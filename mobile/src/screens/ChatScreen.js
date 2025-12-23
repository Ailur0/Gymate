import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

import BaseScreen from '../components/BaseScreen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchMessages,
  receiveSocketMessage,
  sendMessage,
  setActiveMatch,
  receiveReadReceipt,
  receiveTypingUpdate,
  markChatRead,
  blockMatchUser,
} from '../store/slices/chatSlice';
import { initSocket } from '../services/socket';
import { updateTypingApi, reportMessageApi } from '../services/api';
import { colors, spacing, typography } from '../theme';

const ChatScreen = () => {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { matchId, partnerName, partnerId } = route.params ?? {};
  const { threads, status, typingUsers, blockedMatches } = useAppSelector((state) => state.chat);
  const { token, user } = useAppSelector((state) => state.auth);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [reportingMessageId, setReportingMessageId] = useState(null);
  const [blocking, setBlocking] = useState(false);

  const messages = useMemo(() => threads[matchId] ?? [], [threads, matchId]);
  const blockedInfo = blockedMatches[matchId];
  const isChatBlocked = blockedInfo?.isBlocked;
  const isPartnerTyping = Boolean(typingUsers[matchId]?.includes(partnerId));
  const currentUserId = user?.id;

  useEffect(() => {
    if (!matchId || !token) return;
    dispatch(setActiveMatch(matchId));
    dispatch(fetchMessages({ matchId, token }));

    const socket = initSocket({ matchId, token });
    socket.on('chat:message', ({ matchId: incomingMatchId, message }) => {
      if (incomingMatchId === matchId) {
        dispatch(receiveSocketMessage({ matchId, message }));
      }
    });
    socket.on('chat:read', ({ matchId: incomingMatchId, userId: readerId, readAt }) => {
      if (incomingMatchId === matchId) {
        dispatch(
          receiveReadReceipt({
            matchId,
            readerId,
            readAt,
            currentUserId,
          }),
        );
      }
    });
    socket.on('chat:typing', ({ matchId: incomingMatchId, typingUserIds }) => {
      if (incomingMatchId === matchId) {
        dispatch(receiveTypingUpdate({ matchId, typingUserIds }));
      }
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:read');
      socket.off('chat:typing');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (matchId && token) {
        updateTypingApi({ matchId, token, isTyping: false }).catch(() => {});
      }
    };
  }, [dispatch, matchId, token, currentUserId]);

  useEffect(() => {
    if (!matchId || !token || !partnerId) return;
    const hasUnread = messages.some((message) => message.senderId === partnerId && !message.readAt);
    if (hasUnread) {
      dispatch(markChatRead({ matchId, token }));
    }
  }, [messages, matchId, token, partnerId, dispatch]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !token) return;
    dispatch(sendMessage({ matchId, token, body: trimmed }));
    setInput('');
    if (isTyping && matchId && token) {
      updateTypingApi({ matchId, token, isTyping: false }).catch(() => {});
      setIsTyping(false);
    }
  };

  const handleTypingState = async (text) => {
    setInput(text);
    if (!matchId || !token || isChatBlocked) {
      return;
    }
    if (!isTyping) {
      setIsTyping(true);
      updateTypingApi({ matchId, token, isTyping: true }).catch(() => {});
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingApi({ matchId, token, isTyping: false }).catch(() => {});
    }, 2000);
  };

  const handleReportMessage = (message) => {
    if (!token) {
      Alert.alert('Action unavailable', 'You need to be signed in to report messages.');
      return;
    }

    Alert.alert(
      'Report message?',
      'This will flag the message for review by our moderation team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              setReportingMessageId(message.id);
              await reportMessageApi({ matchId, token, messageId: message.id, reason: null });
              Alert.alert('Reported', 'Thanks for helping keep the community safe.');
            } catch (error) {
              Alert.alert('Unable to report', error.message || 'Please try again later.');
            } finally {
              setReportingMessageId(null);
            }
          },
        },
      ],
    );
  };

  const confirmBlockUser = () => {
    if (!token || !partnerId || blocking) {
      return;
    }

    Alert.alert(
      'Block this user?',
      'They will disappear from your chats and won’t be able to contact you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              setBlocking(true);
              await dispatch(blockMatchUser({ token, blockedUserId: partnerId, matchId })).unwrap();
              Alert.alert('User blocked', `${partnerName || 'This user'} has been blocked.`);
            } catch (error) {
              Alert.alert('Unable to block', error?.message || 'Please try again later.');
            } finally {
              setBlocking(false);
            }
          },
        },
      ],
    );
  };

  const renderBlockedBanner = () => (
    <View style={styles.blockedBanner}>
      <Text style={styles.blockedTitle}>Chat unavailable</Text>
      <Text style={styles.blockedDescription}>
        {blockedInfo?.blockedByMe
          ? 'You blocked this user. Unblock them from Safety settings to resume chatting.'
          : 'Either you or your partner blocked this conversation.'}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const isOwnMessage = item.senderId === currentUserId;
    let statusLabel = null;
    if (isOwnMessage) {
      if (item.readAt) {
        statusLabel = 'Read';
      } else if (item.deliveredAt) {
        statusLabel = 'Delivered';
      } else {
        statusLabel = 'Sent';
      }
    }
    const messageContent = (
      <View
        style={[styles.messageRow, isOwnMessage ? styles.messageOwn : styles.messagePeer, item.flagged && styles.flaggedMessage]}
      >
        <Text style={styles.messageText}>{item.body}</Text>
        <View style={styles.messageMetaRow}>
          <Text style={styles.timestamp}>
            {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {statusLabel && <Text style={styles.statusLabel}>{statusLabel}</Text>}
          {item.flagged && <Text style={styles.flaggedLabel}>Flagged</Text>}
        </View>
      </View>
    );

    if (!isOwnMessage) {
      return (
        <TouchableOpacity onLongPress={() => handleReportMessage(item)} activeOpacity={0.8}>
          {messageContent}
        </TouchableOpacity>
      );
    }

    return messageContent;
  };

  return (
    <BaseScreen style={styles.fullHeight}>
      {status === 'loading' && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          inverted
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {(isChatBlocked || blocking) && renderBlockedBanner()}
        {!isChatBlocked && (
          <TouchableOpacity style={styles.blockButton} onPress={confirmBlockUser} disabled={blocking}>
            <Text style={styles.blockButtonText}>{blocking ? 'Blocking…' : 'Block user'}</Text>
          </TouchableOpacity>
        )}
        {isPartnerTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{`${partnerName || 'Partner'} is typing...`}</Text>
          </View>
        )}
        <View style={[styles.inputRow, isChatBlocked && styles.inputRowDisabled]}>
          <TextInput
            style={[styles.input, isChatBlocked && styles.inputDisabled]}
            placeholder={
              isChatBlocked
                ? 'Chat disabled for this match'
                : `Message ${partnerName || 'your match'}...`
            }
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={handleTypingState}
            editable={!isChatBlocked}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, isChatBlocked && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isChatBlocked}
          >
            <Text style={[styles.sendText, isChatBlocked && styles.sendTextDisabled]}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  fullHeight: {
    paddingHorizontal: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageRow: {
    padding: spacing.md,
    borderRadius: 16,
    maxWidth: '80%',
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
  },
  messagePeer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: 4,
  },
  timestamp: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  statusLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typingIndicator: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  typingText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  blockButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  blockButtonText: {
    fontSize: typography.caption,
    color: colors.danger || '#d9534f',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.card,
    color: colors.textPrimary,
  },
  inputRowDisabled: {
    opacity: 0.5,
  },
  inputDisabled: {
    color: colors.textSecondary,
  },
  sendButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: colors.textSecondary,
  },
  blockedBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  blockedTitle: {
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  blockedDescription: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
});

export default ChatScreen;
