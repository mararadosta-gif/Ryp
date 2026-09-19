import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL = "https://ryp-hpvu.onrender.com/chat";
const CHATS_KEY = "@ryp_saved_chats_v5";

const cleanText = (text) =>
  String(text || "")
    .replace(/\*\*/g, "")
    .replace(/###/g, "")
    .trim();

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Čau! Já jsem Rýp 😎 Co dneska vymyslíme?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGames, setShowGames] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [game, setGame] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    try {
      const saved = await AsyncStorage.getItem(CHATS_KEY);
      if (saved) setSavedChats(JSON.parse(saved));
    } catch (e) {
      console.log(e);
    }
  }

  async function saveCurrentChat(chatMessages) {
    try {
      const useful = chatMessages.filter((m) => m.id !== "welcome");

      if (!useful.length) return;

      const firstUser = useful.find((m) => m.role === "user");
      const title =
        firstUser?.text?.slice(0, 35) ||
        "Nový chat";

      const newChat = {
        id: Date.now().toString(),
        title,
        date: new Date().toISOString(),
        messages: chatMessages,
      };

      const updated = [newChat, ...savedChats].slice(0, 30);

      setSavedChats(updated);
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log(e);
    }
  }

  async function pickImage(fromCamera = false) {
    try {
      let result;

      if (fromCamera) {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert("Rýp", "Potřebuju povolení ke kameře.");
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert("Rýp", "Potřebuju povolení ke galerii.");
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });
      }

      if (result.canceled) return;

      const asset = result.assets[0];

      const edited = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      setSelectedImage({
        uri: edited.uri,
        base64: edited.base64,
      });
    } catch (e) {
      Alert.alert("Rýp", "Fotku se nepodařilo načíst.");
    }
  }

  async function rotateImage() {
    if (!selectedImage) return;

    const result = await ImageManipulator.manipulateAsync(
      selectedImage.uri,
      [{ rotate: 90 }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    setSelectedImage({
      uri: result.uri,
      base64: result.base64,
    });
  }

  async function flipImage() {
    if (!selectedImage) return;

    const result = await ImageManipulator.manipulateAsync(
      selectedImage.uri,
      [
        {
          flip: ImageManipulator.FlipType.Horizontal,
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    setSelectedImage({
      uri: result.uri,
      base64: result.base64,
    });
  }

  async function sendMessage() {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userText = input.trim();

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      text: userText || "Podívej se na tuhle fotku.",
      image: selectedImage?.uri || null,
    };

    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const history = newMessages.slice(-12).map((m) => ({
        role: m.role,
        content: m.text || "",
      }));

      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText || "Podívej se na obrázek.",
          image: userMessage.image
            ? `data:image/jpeg;base64,${await uriToBase64(userMessage.image)}`
            : null,
          history,
        }),
      });

      const data = await response.json();

      const answer =
        data.reply ||
        data.message ||
        "Ty vole, nějak jsem se zasekl. 😅";

      const assistantMessage = {
        id: Date.now().toString() + "_bot",
        role: "assistant",
        text: cleanText(answer),
      };

      const finalMessages = [...newMessages, assistantMessage];

      setMessages(finalMessages);

      // Uloží pouze aktuální konverzaci jako jednu položku.
      await updateSavedChat(finalMessages);
    } catch (e) {
      console.log(e);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: "Server zrovna chrápe. Zkus to za chvíli. 😂",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function uriToBase64(uri) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return result.base64 || "";
    } catch {
      return "";
    }
  }

  async function updateSavedChat(chatMessages) {
    try {
      const firstUser = chatMessages.find(
        (m) => m.role === "user"
      );

      if (!firstUser) return;

      const title =
        firstUser.text?.slice(0, 35) || "Nový chat";

      const existing = [...savedChats];

      if (
        existing.length > 0 &&
        existing[0].messages?.some(
          (m) => m.id === chatMessages[0].id
        )
      ) {
        existing[0] = {
          ...existing[0],
          title,
          messages: chatMessages,
          date: new Date().toISOString(),
        };
      } else {
        existing.unshift({
          id: Date.now().toString(),
          title,
          messages: chatMessages,
          date: new Date().toISOString(),
        });
      }

      const limited = existing.slice(0, 30);

      setSavedChats(limited);
      await AsyncStorage.setItem(
        CHATS_KEY,
        JSON.stringify(limited)
      );
    } catch (e) {
      console.log(e);
    }
  }

  function openChat(chat) {
    setMessages(chat.messages);
    setShowChats(false);
  }

  async function deleteChat(id) {
    const updated = savedChats.filter((chat) => chat.id !== id);
    setSavedChats(updated);
    await AsyncStorage.setItem(
      CHATS_KEY,
      JSON.stringify(updated)
    );
  }

  function renderMessage({ item }) {
    return (
      <View
        style={[
          styles.message,
          item.role === "user"
            ? styles.userMessage
            : styles.botMessage,
        ]}
      >
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.messageImage}
          />
        )}

        <Text style={styles.messageText}>
          {item.text}
        </Text>
      </View>
    );
  }

  function playGame(type) {
    setGame(type);
    setShowGames(false);
  }

  function GameScreen() {
    const [number, setNumber] = useState(
      Math.floor(Math.random() * 20) + 1
    );
    const [guess, setGuess] = useState("");
    const [result, setResult] = useState("");

    const [word, setWord] = useState("");
    const [wordResult, setWordResult] = useState("");

    const [reaction, setReaction] = useState("Čekej...");
    const reactionTimer = useRef(null);

    const [rpsResult, setRpsResult] = useState("");
    const [target, setTarget] = useState(
      Math.floor(Math.random() * 10) + 1
    );
    const [targetGuess, setTargetGuess] = useState("");
    const [targetResult, setTargetResult] = useState("");

    function resetNumber() {
      setNumber(Math.floor(Math.random() * 20) + 1);
      setGuess("");
      setResult("");
    }

    function checkNumber() {
      const n = Number(guess);

      if (!n || n < 1 || n > 20) {
        setResult("Napiš číslo 1–20.");
        return;
      }

      if (n === number) {
        setResult("🎉 Trefa! Jsi dobrej.");
      } else if (n < number) {
        setResult("⬆️ Moc málo.");
      } else {
        setResult("⬇️ Moc hodně.");
      }
    }

    function startReaction() {
      setReaction("ČEKEJ...");
      const delay = 1500 + Math.random() * 3000;

      reactionTimer.current = setTimeout(() => {
        setReaction("TEĎ!");
      }, delay);
    }

    function rps(choice) {
      const choices = ["kámen", "nůžky", "papír"];
      const bot =
        choices[Math.floor(Math.random() * choices.length)];

      if (choice === bot) {
        setRpsResult(`Já: ${bot}. Remíza 😁`);
      } else if (
        (choice === "kámen" && bot === "nůžky") ||
        (choice === "nůžky" && bot === "papír") ||
        (choice === "papír" && bot === "kámen")
      ) {
        setRpsResult(`Já: ${bot}. Vyhrál jsi! 😎`);
      } else {
        setRpsResult(`Já: ${bot}. Dostal jsi na prdel. 😂`);
      }
    }

    function checkTarget() {
      const n = Number(targetGuess);

      if (n === target) {
        setTargetResult("🎯 Zásah!");
      } else {
        setTargetResult(
          n < target ? "⬆️ Zkus vyšší." : "⬇️ Zkus nižší."
        );
      }
    }

    return (
      <View style={styles.gameBox}>
        {game === "number" && (
          <>
            <Text style={styles.gameTitle}>🔢 Hádej číslo</Text>
            <Text style={styles.gameText}>
              Myslím si číslo od 1 do 20.
            </Text>

            <TextInput
              value={guess}
              onChangeText={setGuess}
              keyboardType="numeric"
              placeholder="Tvoje číslo"
              placeholderTextColor="#777"
              style={styles.gameInput}
            />

            <TouchableOpacity
              style={styles.gameButton}
              onPress={checkNumber}
            >
              <Text style={styles.gameButtonText}>
                Hádat
              </Text>
            </TouchableOpacity>

            <Text style={styles.result}>{result}</Text>

            <TouchableOpacity onPress={resetNumber}>
              <Text style={styles.link}>Nová hra</Text>
            </TouchableOpacity>
          </>
        )}

        {game === "word" && (
          <>
            <Text style={styles.gameTitle}>🔤 Slovo</Text>
            <Text style={styles.gameText}>
              Napiš slovo začínající na písmeno R.
            </Text>

            <TextInput
              value={word}
              onChangeText={setWord}
              placeholder="Tvoje slovo"
              placeholderTextColor="#777"
              style={styles.gameInput}
            />

            <TouchableOpacity
              style={styles.gameButton}
              onPress={() =>
                setWordResult(
                  word.toLowerCase().startsWith("r")
                    ? "✅ Dobře!"
                    : "❌ To nezačíná na R."
                )
              }
            >
              <Text style={styles.gameButtonText}>
                Zkontrolovat
              </Text>
            </TouchableOpacity>

            <Text style={styles.result}>{wordResult}</Text>
          </>
        )}

        {game === "reaction" && (
          <>
            <Text style={styles.gameTitle}>
              ⚡ Reakce
            </Text>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={startReaction}
            >
              <Text style={styles.reactionText}>
                {reaction}
              </Text>
            </TouchableOpacity>

            <Text style={styles.gameText}>
              Klikni až když se objeví TEĎ!
            </Text>
          </>
        )}

        {game === "rps" && (
          <>
            <Text style={styles.gameTitle}>
              ✊ Kámen nůžky papír
            </Text>

            <View style={styles.row}>
              {["kámen", "nůžky", "papír"].map((x) => (
                <TouchableOpacity
                  key={x}
                  style={styles.smallButton}
                  onPress={() => rps(x)}
                >
                  <Text style={styles.smallButtonText}>
                    {x}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.result}>
              {rpsResult}
            </Text>
          </>
        )}

        {game === "memory" && (
          <>
            <Text style={styles.gameTitle}>
              🧠 Paměť
            </Text>

            <Text style={styles.bigEmoji}>
              🐱 🐶 🦊 🐸 🐵
            </Text>

            <Text style={styles.gameText}>
              Zapamatuj si pořadí. Za chvíli ho zkus napsat.
            </Text>

            <TouchableOpacity
              style={styles.gameButton}
              onPress={() =>
                Alert.alert(
                  "Rýp",
                  "Pořadí bylo: 🐱 🐶 🦊 🐸 🐵"
                )
              }
            >
              <Text style={styles.gameButtonText}>
                Zobrazit výsledek
              </Text>
            </TouchableOpacity>
          </>
        )}

        {game === "target" && (
          <>
            <Text style={styles.gameTitle}>
              🎯 Terč
            </Text>

            <Text style={styles.gameText}>
              Hádej číslo 1–10.
            </Text>

            <TextInput
              value={targetGuess}
              onChangeText={setTargetGuess}
              keyboardType="numeric"
              placeholder="Tip"
              placeholderTextColor="#777"
              style={styles.gameInput}
            />

            <TouchableOpacity
              style={styles.gameButton}
              onPress={checkTarget}
            >
              <Text style={styles.gameButtonText}>
                Střílet
              </Text>
            </TouchableOpacity>

            <Text style={styles.result}>
              {targetResult}
            </Text>
          </>
        )}

        {game === "snake" && (
          <>
            <Text style={styles.gameTitle}>
              🐍 Had
            </Text>

            <Text style={styles.gameText}>
              Minihra s hadem bude dál rozšiřovaná.
            </Text>

            <Text style={styles.bigEmoji}>
              🐍🍎
            </Text>
          </>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setGame(null)}
        >
          <Text style={styles.closeText}>
            Zavřít hru
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("./file_00000000e44c81f4b86b60e21106fc88.png")}
            style={styles.avatar}
          />

          <Text style={styles.title}>Rýp</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setShowChats(true)}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowGames(true)}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>🎮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={scrollRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({
            animated: true,
          })
        }
      />

      {selectedImage && (
        <View style={styles.previewBox}>
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.preview}
          />

          <View style={styles.editRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={rotateImage}
            >
              <Text style={styles.editText}>↻</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={flipImage}
            >
              <Text style={styles.editText}>↔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.editText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={() =>
            Alert.alert(
              "Fotka",
              "Vyber zdroj",
              [
                {
                  text: "Galerie",
                  onPress: () => pickImage(false),
                },
                {
                  text: "Fotoaparát",
                  onPress: () => pickImage(true),
                },
                {
                  text: "Zrušit",
                  style: "cancel",
                },
              ]
            )
          }
        >
          <Text style={styles.photoText}>📷</Text>
        </TouchableOpacity>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Napiš Rýpovi..."
          placeholderTextColor="#777"
          multiline
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.sendText}>
            {loading ? "…" : "➤"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showGames}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGames(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              🎮 Rýpovy hry
            </Text>

            {[
              ["number", "🔢 Hádej číslo"],
              ["word", "🔤 Slovo"],
              ["reaction", "⚡ Reakce"],
              ["rps", "✊ Kámen nůžky papír"],
              ["memory", "🧠 Paměť"],
              ["target", "🎯 Terč"],
              ["snake", "🐍 Had"],
            ].map(([id, title]) => (
              <TouchableOpacity
                key={id}
                style={styles.menuButton}
                onPress={() => playGame(id)}
              >
   
