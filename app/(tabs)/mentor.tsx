import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

interface Conversation {
  id: number;
  title: string;
  context?: string;
  messages: Message[];
}

const SUGGESTED_PROMPTS = [
  "What does this passage teach about God's character?",
  "How does this verse relate to the gospel?",
  "What is the historical context of this passage?",
  "What are the key Hebrew/Greek words in this verse?",
  "How does this connect to other passages in Scripture?",
];

export default function MentorScreen() {
  const colors = useColors();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // tRPC queries and mutations
  const { data: conversations } = trpc.mentor.listConversations.useQuery();
  const createConversationMutation = trpc.mentor.createConversation.useMutation();
  const addMessageMutation = trpc.mentor.addMessage.useMutation();
  const { data: messagesData } = trpc.mentor.getMessages.useQuery(
    { conversationId: currentConversation?.id || 0 },
    { enabled: !!currentConversation }
  );
  const askMentorMutation = trpc.mentor.askMentor.useMutation();

  // Initialize or load conversation
  useEffect(() => {
    if (!currentConversation && conversations && conversations.length > 0) {
      loadConversation(conversations[0]);
    } else if (!currentConversation && conversations?.length === 0) {
      startNewConversation();
    }
  }, [conversations]);

  // Update messages when query data changes
  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData]);

  const loadConversation = async (conversation: any) => {
    try {
      setCurrentConversation({
        id: conversation.id,
        title: conversation.title,
        context: conversation.context,
        messages: [],
      });
      // Messages will be loaded via useQuery
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const startNewConversation = async () => {
    try {
      const conversationId = await createConversationMutation.mutateAsync({
        title: "New Conversation",
      });
      setCurrentConversation({
        id: conversationId,
        title: "New Conversation",
        messages: [],
      });
      setMessages([]);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentConversation) return;

    const userMessage: Message = {
      role: "user",
      content: inputText,
    };

    const questionText = inputText;

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Save user message to database
      await addMessageMutation.mutateAsync({
        conversationId: currentConversation.id,
        role: "user",
        content: questionText,
      });

      // Call Grok API for response
      const result = await askMentorMutation.mutateAsync({
        conversationId: currentConversation.id,
        question: questionText,
        context: currentConversation.context,
      });

      // Add assistant response to UI
      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Show error message to user
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, there was an error processing your message: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        className={cn(
          "flex-row mb-3",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <View
          className={cn(
            "max-w-xs rounded-lg px-4 py-3",
            isUser
              ? "bg-primary"
              : "bg-surface border border-border"
          )}
        >
          <Text
            className={cn(
              "text-base leading-relaxed",
              isUser ? "text-background" : "text-foreground"
            )}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">
            Manus AI Mentor
          </Text>
          <Text className="text-sm text-muted mt-1">
            Ask questions about Bible study and theology
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={scrollViewRef as any}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-lg font-semibold text-foreground mb-4">
                Welcome to Manus AI Mentor
              </Text>
              <Text className="text-muted text-center mb-6">
                Ask questions about Bible study, theology, and Scripture.
              </Text>
              <Text className="text-sm font-semibold text-foreground mb-3">
                Try asking:
              </Text>
              <View className="gap-2 w-full">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setInputText(prompt)}
                    className="bg-surface border border-border rounded-lg px-3 py-2"
                  >
                    <Text className="text-sm text-foreground">{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />

        {/* Input Area */}
        <View className="px-4 py-4 border-t border-border bg-surface">
          <View className="flex-row items-end gap-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
              editable={!isLoading}
              className={cn(
                "flex-1 bg-background rounded-lg px-4 py-3 text-foreground",
                "border border-border"
              )}
              style={{
                maxHeight: 100,
                minHeight: 40,
              }}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className={cn(
                "rounded-lg px-4 py-3 items-center justify-center",
                isLoading || !inputText.trim()
                  ? "bg-muted opacity-50"
                  : "bg-primary"
              )}
              style={{ minHeight: 40, minWidth: 40 }}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text className="text-background font-semibold">Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
