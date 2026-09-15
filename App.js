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

const SERVER_URL = "https://ryp-hpvu.onrender.com/chat";

function cleanText(text) {
  if (!text) return "";

  return text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^#{1,6}\s?/gm, "")
    .trim();
}

function MessageText({ text }) {
  const cleanedText = cleanText(text);
  const parts = cleanedText.split(/(https?:\/\/[^\s]+)/g);

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

  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Čau. Já jsem Rýp. Tak povídej, co zase potřebuješ. 😂",
      bot: true,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // 🎮 MINI HRA
  const [gameOpen, setGameOpen] = useState(false);
  const [secretNumber, setSecretNumber] = useState(
    Math.floor(Math.random() * 20) + 1
  );
  const [guess, setGuess] = useState("");
  const [gameMessage, setGameMessage] = useState(
    "Myslím si číslo od 1 do 20. Hádej! 😈"
  );
  const [score, setScore] = useState(0);

  const flatListRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  // 🎮 NOVÁ HRA
  const startGame = () => {
    setSecretNumber(Math.floor(Math.random() * 20) + 1);
    setGuess("");
    setGameMessage("Myslím si číslo od 1 do 20. Hádej! 😈");
    setGameOpen(true);
  };

  // 🎮 HÁDÁNÍ
  const makeGuess = () => {
    const number = Number(guess);

    if (!number || number < 1 || number > 20) {
      setGameMessage("Zadej číslo od 1 do 20, šampióne. 😂");
      return;
    }

    if (number === secretNumber) {
      const newScore = score + 1;
      setScore(newScore);

      setGameMessage(
        `🎉 Trefa! Číslo bylo ${secretNumber}. Skóre: ${newScore}`
      );

      setTimeout(() => {
        setSecretNumber(Math.floor(Math.random() * 20) + 1);
        setGuess("");
        setGameMessage("Nové číslo! Tak ukaž, jestli máš štěstí. 😈");
      }, 1200);

      return;
    }

    if (number < secretNumber) {
      setGameMessage("Moc málo! 🔽 Zkus větší číslo.");
    } else {
      setGameMessage("Moc vysoko! 🔼 Zkus menší číslo.");
    }

    setGuess("");
  };

  // GALERIE
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

  // FOŤÁK
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

  // NABÍDKA FOŤÁK / GALERIE
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

  // ODESLÁNÍ ZPRÁVY
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
        content: cleanText(item.text),
      }));

    const imageToSend = selectedImage;

    const userMessage = {
      id: `${Date.now()}-user`,
      text: imageToSend
        ? `📷 ${userText}`
        : userText,
      bot: false,
    };

    setMessages((old) => [...old, userMessage]);

    setMessage("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await fetch(SERVER_URL, {
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
      });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
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
            : "height"
        }
      >

        {/* HLAVIČKA */}
        <View style={styles.header}>
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

          {/* 🎮 MINIHRY */}
          <TouchableOpacity
            style={styles.gameButton}
            onPress={startGame}
          >
            <Text style={styles.gameButtonText}>
              🎮 MINIHRY
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🎮 HRA */}
        {gameOpen && (
          <View style={styles.gameBox}>
            <View style={styles.gameTop}>
              <Text style={styles.gameTitle}>
                🎮 Hádej číslo
              </Text>

              <TouchableOpacity
                onPress={() => setGameOpen(false)}
              >
                <Text style={styles.gameClose}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.gameMessage}>
              {gameMessage}
            </Text>

            <View style={styles.guessRow}>
              <TextInput
                value={guess}
                onChangeText={setGuess}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="1–20"
                placeholderTextColor="#777"
                style={styles.guessInput}
              />

              <TouchableOpacity
                style={styles.guessButton}
                onPress={makeGuess}
              >
                <Text style={styles.guessButtonText}>
                  HÁDAT
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.score}>
              🏆 Skóre: {score}
            </Text>
          </View>
        )}

        {/* CHAT */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chat}
          keyboardShouldPersistTaps="handled"
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

        {/* PŘEMÝŠLENÍ */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="small"
              color="#b7d900"
            />

            <Text style={styles.loadingText}>
              Rýp přemýšlí… 😈
            </Text>
          </View>
        )}

        {/* NÁHLED OBRÁZKU */}
        {selectedImage && (
          <View style={styles.previewBox}>
            <Image
              source={{
                uri: selectedImage.uri,
              }}
              style={styles.previewImage}
            />

            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageText}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={chooseImage}
            disabled={loading}
          >
            <Text style={styles.cameraText}>
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
            maxLength={4000}
            editable={!loading}
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
              ➤
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

  header: {
    alignItems: "center",
    paddingTop: 10,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    marginBottom: 8,
  },

  gameButton: {
    backgroundColor: "#b7d900",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    marginBottom: 8,
  },

  gameButtonText: {
    color: "#111",
    fontWeight: "bold",
    fontSize: 15,
  },

  gameBox: {
    backgroundColor: "#202020",
    marginHorizontal: 12,
    marginBottom: 5,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#333",
  },

  gameTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  gameTitle: {
    color: "#b7d900",
    fontSize: 20,
    fontWeight: "bold",
  },

  gameClose: {
    color: "#fff",
    fontSize: 20,
    padding: 5,
  },

  gameMessage: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 12,
  },

  guessRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  guessInput: {
    flex: 1,
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 18,
  },

  guessButton: {
    backgroundColor: "#b7d900",
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    marginLeft: 8,
  },

  guessButtonText: {
    color: "#111",
    fontWeight: "bold",
  },

  score: {
    color: "#aaa",
    marginTop: 10,
    textAlign: "center",
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
    lineHeight: 22,
  },

  link: {
    color: "#5eb6ff",
    textDecorationLine: "underline",
  },

  loadingBox: {
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
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },

  removeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingTop: 6,
  },

  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  cameraText: {
    fontSize: 23,
  },

  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 52,
    backgroundColor: "#252525",
    color: "#fff",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
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
})
