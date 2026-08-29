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
  Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

function MessageText({ text }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return (
    <Text style={styles.messageText} selectable={true}>
      {parts.map((part, index) => {
        if (/^https?:\/\//.test(part)) {
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
  const [selectedImage, setSelectedImage] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Čau. Já jsem Rýp. Tak povídej, co zase potřebuješ. 😂",
      bot: true,
    },
  ]);

  const flatListRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }, [messages, loading]);

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Přístup ke galerii",
          "Rýp potřebuje přístup k fotografiím."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.log("Galerie:", error);
      Alert.alert("Chyba", "Galerii se nepodařilo otevřít.");
    }
  };

  const takePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Přístup ke kameře",
          "Rýp potřebuje přístup ke kameře."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.log("Foťák:", error);
      Alert.alert("Chyba", "Foťák se nepodařilo otevřít.");
    }
  };

  const chooseImage = () => {
    Alert.alert(
      "Rýp 📷",
      "Odkud chceš obrázek?",
      [
        {
          text: "📷 Foťák",
          onPress: takePhoto,
        },
        {
          text: "🖼️ Galerie",
          onPress: pickImage,
        },
        {
          text: "Zrušit",
          style: "cancel",
        },
      ]
    );
  };

  const sendMessage = async () => {
    if ((!message.trim() && !selectedImage) || loading) {
      return;
    }

    const userText =
      message.trim() || "Podívej se na tenhle obrázek.";

    const historyForServer = messages
      .slice(-12)
      .map((item) => ({
        role: item.bot ? "assistant" : "user",
        content: item.text,
      }));

    const imageToSend = selectedImage;

    const userMessage = {
      id: `${Date.now()}-user`,
      text: imageToSend
        ? `📷 ${userText}`
        : userText,
      bot: false,
      imageUri: imageToSend?.uri || null,
    };

    setMessages((old) => [...old, userMessage]);
    setMessage("");
    setSelectedImage(null);
    setLoading(true);

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
            image: imageToSend
              ? {
                  base64: imageToSend.base64,
                  mimeType:
                    imageToSend.mimeType || "image/jpeg",
                }
              : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      setMessages((old) => [
        ...old,
        {
          id: `${Date.now()}-bot`,
          text:
            data.reply ||
            "Rýp nic nevrátil. 🤨",
          bot: true,
        },
      ]);
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

        <Text style={styles.title}>Rýp</Text>

        <Text style={styles.subtitle}>
          AI, která se s tebou nemaže.
        </Text>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chat}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.bot
                  ? styles.botMessage
                  : styles.userMessage,
              ]}
            >
              {item.imageUri && (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.chatImage}
                />
              )}

              <MessageText text={item.text} />
            </View>
          )}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator
              size="small"
              color="#b7d900"
            />
            <Text style={styles.loadingText}>
              Rýp přemýšlí... 🤔
            </Text>
          </View>
        )}

        {selectedImage && (
          <View style={styles.previewBox}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
            />

            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={chooseImage}
            disabled={loading}
          >
            <Text style={styles.imageButtonText}>
              📷
            </Text>
          </TouchableOpacity>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Napiš Rýpovi..."
            placeholderTextColor="#777"
            style={styles.input}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={sendMessage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>➤</Text>
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

  chatImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 5,
  },

  loadingText: {
    color: "#999",
    marginLeft: 8,
    fontSize: 14,
  },

  previewBox: {
    marginHorizontal: 12,
    marginBottom: 6,
    position: "relative",
    alignSelf: "flex-start",
  },

  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },

  removeImage: {
    position: "absolute",
    right: -8,
    top: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },

  removeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
  },

  imageButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  imageButtonText: {
    fontSize: 23,
  },

  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: "#252525",
    color: "#fff",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
