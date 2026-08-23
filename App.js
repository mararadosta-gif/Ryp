import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
} from "react-native";

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
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Čau. Já jsem Rýp. Tak povídej, co zase potřebuješ. 😂",
      bot: true,
    },
  ]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userText = message.trim();

    setMessages((old) => [
      ...old,
      {
        id: Date.now().toString(),
        text: userText,
        bot: false,
      },
    ]);

    setMessage("");

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
          }),
        }
      );

      const data = await response.json();

      setMessages((old) => [
        ...old,
        {
          id: (Date.now() + 1).toString(),
          text: data.reply || "Rýp nic nevrátil. 🤨",
          bot: true,
        },
      ]);
    } catch (error) {
      setMessages((old) => [
        ...old,
        {
          id: (Date.now() + 1).toString(),
          text: "Server mi neodpovídá. 🤦",
          bot: true,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Rýp</Text>

      <Text style={styles.subtitle}>
        AI, která se s tebou nemaže.
      </Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chat}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.bot ? styles.botMessage : styles.userMessage,
            ]}
          >
            <MessageText text={item.text} />
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Napiš Rýpovi..."
          placeholderTextColor="#777"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={sendMessage}
        >
          <Text style={styles.buttonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },

  title: {
    color: "#b7d900",
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },

  subtitle: {
    color: "#999",
    textAlign: "center",
    marginBottom: 10,
  },

  chat: {
    padding: 15,
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

  buttonText: {
    fontSize: 24,
    color: "#111",
  },
});
