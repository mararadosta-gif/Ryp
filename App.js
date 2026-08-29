import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ryp_chat_history";

function MessageText({ text }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return (
    <Text style={styles.messageText} selectable={true}>
      {parts.map((part, index) => {
        if (part.match(/^https?:\/\//)) {
          return (
            <Text
              key={index}
              style={styles.link}
              onPress={() => Linking.openURL(part)}
            >
              {part}
            </Text>
          );
        }

        return part;
      })}
    </Text>
  );
}

export default function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Čau. Já jsem Rýp. Tak povídej, co zase potřebuješ. 😂",
      bot: true,
    },
  ]);

  const flatListRef = useRef(null);

  // Načtení uložené konverzace
  useEffect(() => {
    loadMessages();
  }, []);

  // Uložení konverzace při každé změně
  useEffect(() => {
    saveMessages();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.log("Chyba při načítání chatu:", error);
    }
  };

  const saveMessages = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.log("Chyba při ukládání chatu:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userText = message.trim();

    const userMessage = {
      id: `${Date.now()}-user`,
      text: userText,
      bot: false,
    };

    // Historie před přidáním nové zprávy
    const historyForServer = messages
      .slice(-12)
      .map((item) => ({
        role: item.bot ? "assistant" : "user",
        content: item.text,
      }));

    setMessages((old) => [...old, userMessage]);
    setMessage("");
    setLoading(true);

    scrollToBottom();

    try {
      const response = await fetch(
        "https://ryp-hpvu.onrender.com/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userText,
            history: historyForServer,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      const botMessage = {
        id: `${Date.now()}-bot`,
        text:
          data.reply ||
          "Rýp nic nevrátil. 🤨",
        bot: true,
      };

      setMessages((old) => [
        ...old,
        botMessage,
      ]);

      scrollToBottom();

    } catch (error) {
      console.log("Chyba komunikace:", error);

      setMessages((old) => [
        ...old,
        {
          id: `${Date.now()}-error`,
          text: "Server mi neodpovídá. 🤦",
          bot: true,
        },
      ]);

      scrollToBottom();

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        <Image
          source={require(
            "./file_00000000bf8881f4bf38d7b531a7d6eb.png"
          )}
          style={styles.avatar}
        />

        <Text style={styles.title}>
          Rýp
        </Text>

        <Text style={styles.subtitle}>
          AI, která se s tebou nemaže.
        </Text>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chat}
          onContentSizeChange={scrollToBottom}
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.bot
                  ? styles.botMessage
                  : styles.userMessage,
              ]}
            >
              <MessageText text={item.text} />
            </View>
          )}
        />

        {loading && (
          <View style={styles.thinking}>
            <ActivityIndicator
              size="small"
              color="#b7d900"
            />

            <Text style={styles.thinkingText}>
              Rýp přemýšlí... 🤔
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Napiš Rýpovi..."
            placeholderTextColor="#777"
            style={styles.input}
            multiline={false}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={sendMessage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "…" : "➤"}
            </Text>
          </TouchableOpacity>

        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginTop: 10,
  },

  title: {
    color: "#b7d900",
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5,
  },

  subtitle: {
    color: "#999",
    textAlign: "center",
    marginBottom: 10,
  },

  chat: {
    padding: 15,
    paddingBottom: 10,
  },

  message: {
    padding: 14,
    borderRadius: 18,
    marginVertical: 6,
    maxWidth: "85%",
  },

  botMessage: {
    backgroundColor: "#252525",
    alignSelf: "flex-start",
  },

  userMessage: {
    backgroundColor: "#b7d900",
    alignSelf: "flex-end",
  },

  messageText: {
    color: "#fff",
    fontSize: 16,
  },

  link: {
    color: "#5eb6ff",
    textDecorationLine: "underline",
  },

  thinking: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 5,
  },

  thinkingText: {
    color: "#888",
    marginLeft: 8,
    fontSize: 14,
  },

  inputRow: {
    flexDirection: "row",
    padding: 12,
  },

  input: {
    flex: 1,
    backgroundColor: "#252525",
    color: "#fff",
    borderRadius: 25,
    paddingHorizontal: 18,
    fontSize: 16,
  },

  button: {
    width: 52,
    height: 52,
    marginLeft: 8,
    borderRadius: 26,
    backgroundColor: "#b7d900",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    fontSize: 24,
    color: "#111",
  },
});
