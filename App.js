import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Čau. Já jsem Rýp. Tak povídej, co zase potřebuješ. 😂",
      bot: true,
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const userText = message.trim();

    setMessages((old) => [
      ...old,
      { id: Date.now().toString(), text: userText, bot: false },
      {
        id: (Date.now() + 1).toString(),
        text: "Dobře, povídej dál. A nečekej žádné zbytečné kecy kolem. 😏",
        bot: true,
      },
    ]);

    setMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Rýp</Text>
      <Text style={styles.subtitle}>AI, která se s tebou nemaže.</Text>

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
            <Text style={styles.messageText}>{item.text}</Text>
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

        <TouchableOpacity style={styles.button} onPress={sendMessage}>
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
