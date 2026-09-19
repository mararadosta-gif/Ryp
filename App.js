import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://ryp-hpvu.onrender.com/chat";
const CHAT_KEY = "ryp_saved_chats_v5";

const RYP_IMAGE = require("./assets/ryp.png");

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

function extractLinks(text) {
  if (!text) return [];
  return text.match(/https?:\/\/[^\s]+/g) || [];
}

function LinkText({ text }) {
  const links = extractLinks(text);

  if (!links.length) {
    return <Text style={styles.messageText}>{text}</Text>;
  }

  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return (
    <Text style={styles.messageText}>
      {parts.map((part, index) => {
        if (part.match(/^https?:\/\//)) {
          return (
            <Text
              key={index}
              style={styles.linkText}
              onPress={() => Linking.openURL(part.replace(/[.,!?)]$/, ""))}
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

/* =========================
   HRY
========================= */

function NumberGame() {
  const [number, setNumber] = useState(null);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("Myslím si číslo od 1 do 100 😈");

  const start = () => {
    setNumber(Math.floor(Math.random() * 100) + 1);
    setGuess("");
    setMessage("Tak dělej, hádej 😈");
  };

  const check = () => {
    if (!number) {
      start();
      return;
    }

    const n = Number(guess);

    if (!n) {
      setMessage("Tohle není číslo, génie 😂");
      return;
    }

    if (n === number) {
      setMessage("🎉 Trefa! Tak tohle bylo podezřele dobrý.");
      setNumber(null);
      return;
    }

    if (n < number) {
      setMessage("Moc málo 😏");
    } else {
      setMessage("Moc 😈");
    }
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🎯 Hádej číslo</Text>
      <Text style={styles.gameText}>{message}</Text>

      <TextInput
        style={styles.gameInput}
        value={guess}
        onChangeText={setGuess}
        keyboardType="numeric"
        placeholder="Tvoje číslo"
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={styles.gameButton} onPress={check}>
        <Text style={styles.gameButtonText}>HÁDAT</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={start}>
        <Text style={styles.secondaryButtonText}>NOVÁ HRA</Text>
      </TouchableOpacity>
    </View>
  );
}

function WordGame() {
  const words = [
    "AUTO",
    "KOČKA",
    "PIZZA",
    "LES",
    "ŠKOLA",
    "ROBOT",
    "TELEFON",
    "KÁVA",
  ];

  const [word, setWord] = useState(
    words[Math.floor(Math.random() * words.length)]
  );
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("Uhádni slovo 😈");

  const newWord = () => {
    const next = words[Math.floor(Math.random() * words.length)];
    setWord(next);
    setGuess("");
    setMessage("Nové slovo. Tak makej 😂");
  };

  const check = () => {
    if (guess.trim().toUpperCase() === word) {
      setMessage("🎉 Správně!");
    } else {
      setMessage("Ani hovno 😂 Zkus znovu.");
    }
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🔤 Hádej slovo</Text>
      <Text style={styles.gameText}>{message}</Text>

      <TextInput
        style={styles.gameInput}
        value={guess}
        onChangeText={setGuess}
        placeholder="Tvoje odpověď"
        placeholderTextColor="#888"
        autoCapitalize="characters"
      />

      <TouchableOpacity style={styles.gameButton} onPress={check}>
        <Text style={styles.gameButtonText}>ZKONTROLOVAT</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={newWord}>
        <Text style={styles.secondaryButtonText}>NOVÉ SLOVO</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReactionGame() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Klikni a čekej...");
  const [startedAt, setStartedAt] = useState(null);

  const start = () => {
    setRunning(true);
    setMessage("ČEKEJ...");
    setStartedAt(null);

    const delay = 1500 + Math.random() * 3000;

    setTimeout(() => {
      setStartedAt(Date.now());
      setMessage("TEĎ!!!");
    }, delay);
  };

  const tap = () => {
    if (!running) {
      start();
      return;
    }

    if (!startedAt) {
      setMessage("MOC BRZY 😂");
      setRunning(false);
      return;
    }

    const time = Date.now() - startedAt;
    setMessage(`⚡ ${time} ms`);
    setRunning(false);
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>⚡ Reakce</Text>
      <Text style={styles.gameText}>{message}</Text>

      <TouchableOpacity style={styles.bigGameButton} onPress={tap}>
        <Text style={styles.bigGameButtonText}>
          {running ? "KLIKNI!" : "START"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function RpsGame() {
  const [result, setResult] = useState("Vyber si 😈");

  const play = (player) => {
    const options = ["kámen", "nůžky", "papír"];
    const bot = options[Math.floor(Math.random() * 3)];

    if (player === bot) {
      setResult(`Já: ${bot}. Remíza 😂`);
      return;
    }

    const win =
      (player === "kámen" && bot === "nůžky") ||
      (player === "nůžky" && bot === "papír") ||
      (player === "papír" && bot === "kámen");

    setResult(
      `Já: ${bot}. ${win ? "Vyhrál jsi 😏" : "Prohrál jsi 😂"}`
    );
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>✊ Kámen, nůžky, papír</Text>
      <Text style={styles.gameText}>{result}</Text>

      <View style={styles.choiceRow}>
        <TouchableOpacity
          style={styles.choiceButton}
          onPress={() => play("kámen")}
        >
          <Text style={styles.choiceText}>✊</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.choiceButton}
          onPress={() => play("nůžky")}
        >
          <Text style={styles.choiceText}>✌️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.choiceButton}
          onPress={() => play("papír")}
        >
          <Text style={styles.choiceText}>✋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MemoryGame() {
  const symbols = ["🍎", "🚗", "🐱", "⚽", "🍕", "🚀"];

  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);

  const newGame = () => {
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
      }));

    setCards(deck);
    setOpen([]);
    setMatched([]);
  };

  useEffect(() => {
    newGame();
  }, []);

  const pressCard = (card) => {
    if (
      open.includes(card.id) ||
      matched.includes(card.id) ||
      open.length >= 2
    ) {
      return;
    }

    const next = [...open, card.id];
    setOpen(next);

    if (next.length === 2) {
      const first = cards.find((c) => c.id === next[0]);
      const second = cards.find((c) => c.id === next[1]);

      if (first.symbol === second.symbol) {
        setMatched((m) => [...m, first.id, second.id]);
        setOpen([]);
      } else {
        setTimeout(() => {
          setOpen([]);
        }, 700);
      }
    }
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🧠 Pexeso</Text>

      <View style={styles.memoryGrid}>
        {cards.map((card) => {
          const visible =
            open.includes(card.id) || matched.includes(card.id);

          return (
            <TouchableOpacity
              key={card.id}
              style={styles.memoryCard}
              onPress={() => pressCard(card)}
            >
              <Text style={styles.memoryText}>
                {visible ? card.symbol : "?"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={newGame}>
        <Text style={styles.secondaryButtonText}>NOVÁ HRA</Text>
      </TouchableOpacity>
    </View>
  );
}

function TargetGame() {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({
    top: 80,
    left: 90,
  });

  const hit = () => {
    setScore((s) => s + 1);
    setPosition({
      top: 30 + Math.random() * 180,
      left: 20 + Math.random() * 210,
    });
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🎯 Terč</Text>
      <Text style={styles.gameText}>Skóre: {score}</Text>

      <View style={styles.targetArea}>
        <TouchableOpacity
          style={[
            styles.target,
            {
              top: position.top,
              left: position.left,
            },
          ]}
          onPress={hit}
        >
          <Text style={styles.targetText}>🎯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SnakeGame() {
  const [score, setScore] = useState(0);
  const [direction, setDirection] = useState("right");

  const move = (dir) => {
    setDirection(dir);
    setScore((s) => s + 1);
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🐍 Had</Text>
      <Text style={styles.gameText}>
        Směr: {direction} · Skóre: {score}
      </Text>

      <View style={styles.snakeBoard}>
        <Text style={styles.snakeEmoji}>🐍</Text>
      </View>

      <View style={styles.directionGrid}>
        <TouchableOpacity
          style={styles.directionButton}
          onPress={() => move("nahoru")}
        >
          <Text style={styles.directionText}>⬆️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.directionButton}
          onPress={() => move("doleva")}
        >
          <Text style={styles.directionText}>⬅️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.directionButton}
          onPress={() => move("dolů")}
        >
          <Text style={styles.directionText}>⬇️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.directionButton}
          onPress={() => move("doprava")}
        >
          <Text style={styles.directionText}>➡️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =========================
   GAME MENU
========================= */

function GamesMenu({ visible, onClose }) {
  const [game, setGame] = useState("number");

  const renderGame = () => {
    if (game === "number") return <NumberGame />;
    if (game === "word") return <WordGame />;
    if (game === "reaction") return <ReactionGame />;
    if (game === "rps") return <RpsGame />;
    if (game === "memory") return <MemoryGame />;
    if (game === "target") return <TargetGame />;
    if (game === "snake") return <SnakeGame />;
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.gamesModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎮 Minihry</Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gameTabs}
          >
            <TouchableOpacity
              style={[
                styles.gameTab,
                game === "number" && styles.gameTabActive,
              ]}
              onPress={() => setGame("number")}
            >
              <Text
                style={[
                  styles.gameTabText,
                  game === "number" && styles.gameTabTextActive,
                ]}
              >
                🎯 Číslo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gameTab,
                game === "word" && styles.gameTabActive,
              ]}
              onPress={() => setGame("word")}
            >
              <Text
                style={[
                  styles.gameTabText,
                  game === "word" && styles.gameTabTextActive,
                ]}
              >
                🔤 Slovo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gameTab,
                game === "reaction" && styles.gameTabActive,
              ]}
              onPress={() => setGame("reaction")}
            >
              <Text
                style={[
                  styles.gameTabText,
                  game === "reaction" && styles.gameTabTextActive,
                ]}
              >
                ⚡ Reakce
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gameTab,
                game === "rps" && styles.gameTabActive,
              ]}
              onPress={() => setGame("rps")}
            >
              <Text
                style={[
                  styles.gameTabText,
                  game === "rps" && styles.gameTabTextActive,
                ]}
              >
                ✊ RPS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gameTab,
                game === "memory" && styles.gameTabActive,
              ]}
              onPress={() => setGame("memory")}
            >
              <Text
                style={[
                  styles.gameTabText,
                  game === "memory" && styles.gameTabTextActive,
                ]}
              >
                🧠 Pexeso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gameTab,
                game === "target" && styles.gameTabActive,
              ]}
              onPress={() => setGame("target")}
            >
              <Text
                style={[
                  styles.gameTabText,
                  game === "target" && styles.gameTabTextActive,
                ]}
              >
                🎯 Terč
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gameTab,
                game === "snake" && styles.gameTabActive,
              ]}
              onPress={() => setGame("snake")}
            >
              <Text
                style={[
                  styles.gameTabText,
                  game === "snake" && styles.gameTabTextActive,
                ]}
              >
                🐍 Had
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <ScrollView
            style={styles.gameScroll}
            contentContainerStyle={styles.gameScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderGame()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* =========================
   MAIN APP
========================= */

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Čau 😈 Já jsem Rýp. Tak co dneska vyřešíme?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [gamesVisible, setGamesVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);

  const [savedChats, setSavedChats] = useState([]);

  const [photoUri, setPhotoUri] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const saved = await AsyncStorage.getItem(CHAT_KEY);

      if (saved) {
        setSavedChats(JSON.parse(saved));
      }
    } catch (error) {
      console.log("LOAD CHATS ERROR", error);
    }
  };

  const saveCurrentChat = async (newMessages = messages) => {
    try {
      if (!newMessages || newMessages.length <= 1) {
        return;
      }

      const firstUserMessage = newMessages.find(
        (m) => m.role === "user"
      );

      const title =
        firstUserMessage?.text?.trim().slice(0, 35) ||
        "Nový chat";

      const chat = {
        id: makeId(),
        title,
        messages: newMessages,
        createdAt: Date.now(),
      };

      const current = await AsyncStorage.getItem(CHAT_KEY);
      const existing = current ? JSON.parse(current) : [];

      const updated = [chat, ...existing].slice(0, 30);

      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      setSavedChats(updated);
    } catch (error) {
      console.log("SAVE CHAT ERROR", error);
    }
  };

  const openSavedChat = (chat) => {
    setMessages(chat.messages);
    setMoreVisible(false);
  };

  const deleteChat = async (id) => {
    Alert.alert(
      "Smazat chat?",
      "Tenhle chat fakt zmizí.",
      [
        {
          text: "Zrušit",
          style: "cancel",
        },
        {
          text: "Smazat",
          style: "destructive",
          onPress: async () => {
            const updated = savedChats.filter(
              (chat) => chat.id !== id
            );

            setSavedChats(updated);
            await AsyncStorage.setItem(
              CHAT_KEY,
              JSON.stringify(updated)
            );
          },
        },
      ]
    );
  };

  const newChat = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        text: "Nový chat 😈 Tak povídej.",
      },
    ]);

    setInput("");
    setMoreVisible(false);
  };

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const userMessage = {
      id: makeId(),
      role: "user",
      text,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const answer =
        data.reply ||
        data.message ||
        data.content ||
        "Ty vole, nějak jsem se zasekl 😂";

      const assistantMessage = {
        id: makeId(),
        role: "assistant",
        text: answer,
      };

      const finalMessages = [
        ...updatedMessages,
        assistantMessage,
      ];

      setMessages(finalMessages);

      await saveCurrentChat(finalMessages);
    } catch (error) {
      console.log("CHAT ERROR", error);

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          text:
            "Něco se posralo při spojení se serverem 😅 Zkus to za chvíli znovu.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Kamera",
          "Rýp potřebuje povolení ke kameře."
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("CAMERA ERROR", error);
      Alert.alert("Chyba", "Kameru se nepodařilo otevřít.");
    }
  };

  const openGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Galerie",
          "Rýp potřebuje povolení ke galerii."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("GALLERY ERROR", error);
      Alert.alert("Chyba", "Galerii se nepodařilo otevřít.");
    }
  };

  const rotatePhoto = async () => {
    if (!photoUri) return;

    try {
      const result =
        await ImageManipulator.manipulateAsync(
          photoUri,
          [
            {
              rotate: 90,
            },
          ],
          {
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

      setPhotoUri(result.uri);
    } catch (error) {
      console.log("ROTATE ERROR", error);
    }
  };

  const flipPhoto = async () => {
    if (!photoUri) return;

    try {
      const result =
        await ImageManipulator.manipulateAsync(
          photoUri,
          [
            {
              flip: ImageManipulator.FlipType.Horizontal,
            },
          ],
          {
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

      setPhotoUri(result.uri);
    } catch (error) {
      console.log("FLIP ERROR", error);
    }
  };

  const closePhoto = () => {
    setPhotoUri(null);
    setEditingPhoto(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}

        <View style={styles.header}>
          <Image
            source={RYP_IMAGE}
            style={styles.headerImage}
            resizeMode="contain"
          />

          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>Rýp</Text>
            <Text style={styles.headerSubtitle}>
              AI kámoš, co se s tebou nemaže 😈
            </Text>
          </View>
        </View>

        {/* CHAT */}

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={
            Platform.OS === "ios" ? "padding" : undefined
          }
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isUser = item.role === "user";

              return (
                <View
                  style={[
                    styles.messageRow,
                    isUser
                      ? styles.messageRowUser
                      : styles.messageRowAssistant,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? styles.userBubble
                        : styles.assistantBubble,
                    ]}
                  >
                    <LinkText text={item.text} />
                  </View>
                </View>
              );
            }}
          />

          {loading && (
            <View style={styles.typingBox}>
              <Text style={styles.typingText}>
                Rýp přemýšlí... 😈
              </Text>
            </View>
          )}

          {/* INPUT */}

          <View style={styles.inputArea}>
            <TouchableOpacity
              style={styles.inputIcon}
              onPress={openCamera}
            >
              <Text style={styles.inputIconText}>📷</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Napiš Rýpovi..."
              placeholderTextColor="#7d8794"
              multiline
              maxLength={2000}
              onSubmitEditing={sendMessage}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={loading}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* BOTTOM NAV */}

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              setGamesVisible(false);
              setMoreVisible(false);
            }}
          >
            <Text style={styles.navIcon}>💬</Text>
            <Text style={styles.navText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setGamesVisible(true)}
          >
            <Text style={styles.navIcon}>🎮</Text>
            <Text style={styles.navText}>Hry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={openGallery}
          >
            <Text style={styles.navIcon}>🖼️</Text>
            <Text style={styles.navText}>Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setMoreVisible(true)}
          >
            <Text style={styles.navIcon}>☰</Text>
            <Text style={styles.navText}>Další</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GAMES */}

      <GamesMenu
        visible={gamesVisible}
        onClose={() => setGamesVisible(false)}
      />

      {/* MORE */}

      <Modal
        visible={moreVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMoreVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.moreModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Další</Text>

              <TouchableOpacity
                onPress={() => setMoreVisible(false)}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={newChat}
            >
              <Text style={styles.moreButtonIcon}>➕</Text>
              <Text style={styles.moreButtonText}>
                Nový chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={openCamera}
            >
              <Text style={styles.moreButtonIcon}>📷</Text>
              <Text style={styles.moreButtonText}>
                Vyfotit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={openGallery}
            >
              <Text style={styles.moreButtonIcon}>🖼️</Text>
              <Text style={styles.moreButtonText}>
                Vybrat fotku
              </Text>
            </TouchableOpacity>

            <Text style={styles.savedTitle}>
              Uložené chaty
            </Text>

            {savedChats.length === 0 ? (
              <Text style={styles.emptyText}>
                Zatím tu nic není.
              </Text>
            ) : (
              <FlatList
                data={savedChats}
                keyExtractor={(item) => item.id}
                style={styles.savedList}
                renderItem={({ item }) => (
                  <View style={styles.savedRow}>
                    <TouchableOpacity
                      style={styles.savedChat}
                      onPress={() => openSavedChat(item)}
                    >
                      <Text
                        style={styles.savedChatTitle}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>

                      <Text style={styles.savedChatDate}>
                        {new Date(
                          item.createdAt
                        ).toLocaleDateString("cs-CZ")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteChat(item.id)}
                    >
                      <Text style={styles.deleteText}>
                        🗑️
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* PHOTO */}

      <Modal
        visible={!!photoUri}
        animationType="fade"
        transparent
        onRequestClose={closePhoto}
      >
        <View style={styles.photoOverlay}>
          <View style={styles.photoModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                📸 Fotka
              </Text>

              <TouchableOpacity onPress={closePhoto}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={styles.photoPreview}
                resizeMode="contain"
              />
            )}

            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoAction}
                onPress={rotatePhoto}
              >
                <Text style={styles.photoActionText}>
                  🔄 Otočit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoAction}
                onPress={flipPhoto}
              >
                <Text style={styles.photoActionText}>
                  ↔️ Překlopit
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closePhotoButton}
              onPress={closePhoto}
            >
              <Text style={styles.closePhotoButtonText}>
                HOTOVO
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#dceeff",
  },

  container: {
    flex: 1,
    backgroundColor: "#dceeff",
  },

  header: {
    height: 86,
    backgroundColor: "#b9ddff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#9bc9f4",
  },

  headerImage: {
    width: 66,
    height: 66,
    marginRight: 10,
  },

  headerTextBox: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#12385c",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#41627d",
    marginTop: 1,
  },

  chatContainer: {
    flex: 1,
  },

  messageList: {
    flex: 1,
  },

  messageContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },

  messageRow: {
    width: "100%",
    marginBottom: 9,
  },

  messageRowUser: {
    alignItems: "flex-end",
  },

  messageRowAssistant: {
    alignItems: "flex-start",
  },

  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 19,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  userBubble: {
    backgroundColor: "#ffffff",
    borderBottomRightRadius: 5,
  },

  assistantBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 5,
  },

  messageText: {
    color: "#111827",
    fontSize: 16,
    lineHeight: 22,
  },

  linkText: {
    color: "#1475d1",
    textDecorationLine: "underline",
  },

  typingBox: {
    paddingHorizontal: 18,
    paddingBottom: 6,
  },

  typingText: {
    color: "#45657d",
    fontSize: 13,
    fontStyle: "italic",
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 9,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: "#dceeff",
  },

  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 110,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 11,
    color: "#111827",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#b9d7ef",
  },

  inputIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  inputIconText: {
    fontSize: 23,
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#1779cf",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  sendButtonText: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "900",
  },

  bottomNav: {
    height: 69,
    backgroundColor: "#1976c9",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    elevation: 8,
  },

  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  navIcon: {
    fontSize: 21,
    marginBottom: 2,
  },

  navText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  gamesModal: {
    height: "88%",
    backgroundColor: "#dceeff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  moreModal: {
    maxHeight: "88%",
    minHeight: "55%",
    backgroundColor: "#dceeff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 20,
    overflow: "hidden",
  },

  modalHeader: {
    height: 62,
    backgroundColor: "#b9ddff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#9bc9f4",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#12385c",
  },

  closeText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#12385c",
  },

  gameTabs: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 7,
  },

  gameTab: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 17,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bdd9ef",
  },

  gameTabActive: {
    backgroundColor: "#1976c9",
    borderColor: "#1976c9",
  },

  gameTabText: {
    color: "#31546e",
    fontWeight: "800",
    fontSize: 13,
  },

  gameTabTextActive: {
    color: "#fff",
  },

  gameScroll: {
    flex: 1,
  },

  gameScrollContent: {
    padding: 12,
    paddingBottom: 30,
  },

  gameCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 17,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  gameTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#173e61",
    marginBottom: 8,
  },

  gameText: {
    color: "#41596c",
    fontSize: 15,
    marginBottom: 12,
  },

  gameInput: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#b9d7ef",
    backgroundColor: "#f5faff",
    paddingHorizontal: 14,
    color: "#111827",
    fontSize: 16,
    marginBottom: 10,
  },

  gameButton: {
    height: 47,
    backgroundColor: "#1976c9",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  gameButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  secondaryButton: {
    height: 45,
    borderRadius: 15,
    backgroundColor: "#e6f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  secondaryButtonText: {
    color: "#1976c9",
    fontWeight: "900",
    fontSize: 14,
  },

  bigGameButton: {
    height: 130,
    borderRadius: 25,
    backgroundColor: "#1976c9",
    alignItems: "center",
    justifyContent: "center",
  },

  bigGameButtonText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
  },

  choiceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  choiceButton: {
    width: 75,
    height: 75,
    borderRadius: 20,
    backgroundColor: "#e8f5ff",
    alignItems: "center",
    justifyContent: "center",
  },

  choiceText: {
    fontSize: 36,
  },

  memoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  memoryCard: {
    width: 62,
    height: 62,
    margin: 4,
    borderRadius: 14,
    backgroundColor: "#dceeff",
    alignItems: "center",
    justifyContent: "center",
  },

  memoryText: {
    fontSize: 29,
  },

  targetArea: {
    height: 270,
    borderRadius: 20,
    backgroundColor: "#e8f5ff",
    position: "relative",
    overflow: "hidden",
  },

  target: {
    position: "absolute",
    width: 55,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  targetText: {
    fontSize: 43,
  },

  snakeBoard: {
    height: 210,
    borderRadius: 20,
    backgroundColor: "#e8f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  snakeEmoji: {
    fontSize: 55,
  },

  directionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },

  directionButton: {
    width: 70,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#dceeff",
    alignItems: "center",
    justifyContent: "center",
  },

  directionText: {
    fontSize: 22,
  },

  moreButton: {
    marginHorizontal: 14,
    marginTop: 10,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  moreButtonIcon: {
    fontSize: 22,
    width: 38,
  },

  moreButtonText: {
    color: "#173e61",
    fontSize: 16,
    fontWeight: "800",
  },

  savedTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#173e61",
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 8,
  },

  savedList: {
    marginHorizontal: 14,
  },

  savedRow: {
    flexDirection: "row",
    marginBottom: 7,
  },

  savedChat: {
    flex: 1,
    minHeight: 55,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: "center",
  },

  savedChatTitle: {
    color: "#173e61",
    fontWeight: "800",
    fontSize: 15,
  },

  savedChatDate: {
    color: "#7990a3",
    fontSize: 11,
    marginTop: 2,
  },

  deleteButton: {
    width: 52,
    marginLeft: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    fontSize: 20,
  },

  emptyText: {
    marginHorizontal: 16,
    color: "#59758c",
    fontSize: 14,
  },

  photoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 12,
  },

  photoModal: {
    backgroundColor: "#dceeff",
    borderRadius: 25,
    overflow: "hidden",
    maxHeight: "90%",
  },

  photoPreview: {
    width: "100%",
    height: 430,
    backgroundColor: "#101820",
  },

  photoActions: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
  },

  photoAction: {
    flex: 1,
    height: 47,
    backgroundColor: "#fff",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  photoActionText: {
    color: "#1976c9",
    fontWeight: "900",
  },

  closePhotoButton: {
    margin: 10,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#1976c9",
    alignItems: "center",
    justifyContent: "center",
  },

  closePhotoButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});
