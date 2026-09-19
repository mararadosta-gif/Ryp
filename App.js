import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://ryp-hpvu.onrender.com/chat";

const COLORS = {
  bg: "#101114",
  panel: "#181a1f",
  panel2: "#24272e",
  text: "#f4f4f5",
  muted: "#9297a3",
  accent: "#ffd400",
  user: "#315caa",
  bot: "#292d35",
  danger: "#ff5555",
  green: "#36d278",
};

const CHAT_KEY = "@ryp_saved_chats";

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

function makeTitle(messages) {
  const first = messages.find((m) => m.role === "user" && m.text);

  if (!first) return "Nový chat";

  let title = first.text.trim().replace(/\s+/g, " ");

  if (title.length > 35) {
    title = title.slice(0, 35) + "…";
  }

  return title || "Nový chat";
}

function linkify(text) {
  if (!text) return null;

  const parts = text.split(
    /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(?:cz|com|eu|org|net)\/[^\s]*)/gi
  );

  return parts.map((part, index) => {
    const isLink =
      /^https?:\/\//i.test(part) ||
      /^www\./i.test(part) ||
      /\.(cz|com|eu|org|net)\//i.test(part);

    if (!isLink) {
      return <Text key={index}>{part}</Text>;
    }

    const url = /^https?:\/\//i.test(part) ? part : `https://${part}`;

    return (
      <Text
        key={index}
        style={styles.link}
        onPress={() => Linking.openURL(url)}
      >
        {part}
      </Text>
    );
  });
}

/* =========================
   MINIHRY
========================= */

function GameScreen({ game, setGame }) {
  const [number, setNumber] = useState(() => Math.floor(Math.random() * 50) + 1);
  const [guess, setGuess] = useState("");
  const [numberResult, setNumberResult] = useState("");
  const [attempts, setAttempts] = useState(0);

  const words = [
    "KOČKA",
    "AUTO",
    "PES",
    "DŮM",
    "LES",
    "KÁVA",
    "RYBA",
    "MĚSÍC",
  ];

  const [word] = useState(
    words[Math.floor(Math.random() * words.length)]
  );

  const [wordGuess, setWordGuess] = useState("");
  const [wordResult, setWordResult] = useState("");

  const [reactionStarted, setReactionStarted] = useState(false);
  const [reactionReady, setReactionReady] = useState(false);
  const [reactionStartTime, setReactionStartTime] = useState(0);
  const [reactionResult, setReactionResult] = useState("");

  const reactionTimer = useRef(null);

  const [rpsResult, setRpsResult] = useState("");

  const [memoryNumber, setMemoryNumber] = useState(
    () => String(Math.floor(10000 + Math.random() * 90000))
  );
  const [memoryInput, setMemoryInput] = useState("");
  const [memoryResult, setMemoryResult] = useState("");
  const [memoryVisible, setMemoryVisible] = useState(true);

  const [targetScore, setTargetScore] = useState(0);

  const [snakeScore, setSnakeScore] = useState(0);

  useEffect(() => {
    return () => {
      if (reactionTimer.current) {
        clearTimeout(reactionTimer.current);
      }
    };
  }, []);

  const resetGame = () => {
    setGame(null);
  };

  /* ČÍSLO */

  const checkNumber = () => {
    const value = Number(guess);

    if (!value || value < 1 || value > 50) {
      setNumberResult("Napiš číslo 1–50 😁");
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (value === number) {
      setNumberResult(
        `🎉 Trefa! Bylo to ${number}. Pokusů: ${nextAttempts}`
      );
      return;
    }

    if (value < number) {
      setNumberResult("⬆️ Víc!");
    } else {
      setNumberResult("⬇️ Míň!");
    }
  };

  const resetNumber = () => {
    setNumber(Math.floor(Math.random() * 50) + 1);
    setGuess("");
    setAttempts(0);
    setNumberResult("");
  };

  /* SLOVO */

  const checkWord = () => {
    if (!wordGuess.trim()) {
      setWordResult("Něco napiš 😁");
      return;
    }

    if (wordGuess.trim().toUpperCase() === word) {
      setWordResult("🎉 Správně!");
    } else {
      setWordResult(`❌ Ne. Začíná to na „${word[0]}“.`);
    }
  };

  /* POSTŘEH */

  const startReaction = () => {
    setReactionStarted(true);
    setReactionReady(false);
    setReactionResult("Čekej...");

    const delay = 1200 + Math.random() * 3000;

    reactionTimer.current = setTimeout(() => {
      setReactionReady(true);
      setReactionStartTime(Date.now());
    }, delay);
  };

  const pressReaction = () => {
    if (!reactionStarted) return;

    if (!reactionReady) {
      if (reactionTimer.current) {
        clearTimeout(reactionTimer.current);
      }

      setReactionStarted(false);
      setReactionResult("😂 Moc brzo!");
      return;
    }

    const time = Date.now() - reactionStartTime;

    setReactionStarted(false);
    setReactionReady(false);
    setReactionResult(`${time} ms ⚡`);
  };

  /* KÁMEN */

  const playRps = (player) => {
    const choices = ["kámen", "nůžky", "papír"];
    const bot = choices[Math.floor(Math.random() * choices.length)];

    if (player === bot) {
      setRpsResult(`🤝 Remíza! Oba: ${bot}`);
      return;
    }

    const win =
      (player === "kámen" && bot === "nůžky") ||
      (player === "nůžky" && bot === "papír") ||
      (player === "papír" && bot === "kámen");

    setRpsResult(
      win
        ? `🎉 Vyhrál jsi! Já měl ${bot}.`
        : `😂 Prohrál jsi! Já měl ${bot}.`
    );
  };

  /* PAMĚŤ */

  const checkMemory = () => {
    if (memoryInput.trim() === memoryNumber) {
      setMemoryResult("🧠 Výborně! Paměť funguje.");
    } else {
      setMemoryResult(`❌ Špatně. Správně bylo ${memoryNumber}.`);
    }
  };

  const resetMemory = () => {
    const n = String(Math.floor(10000 + Math.random() * 90000));
    setMemoryNumber(n);
    setMemoryInput("");
    setMemoryResult("");
    setMemoryVisible(true);
  };

  /* TERČ */

  const hitTarget = () => {
    setTargetScore((value) => value + 1);
  };

  /* HAD */

  const playSnake = () => {
    setSnakeScore((value) => value + 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.gameContent}>
      {game === "number" && (
        <>
          <Text style={styles.gameBigTitle}>🔢 Hádej číslo</Text>
          <Text style={styles.gameDescription}>
            Myslím si číslo od 1 do 50.
          </Text>

          <TextInput
            value={guess}
            onChangeText={setGuess}
            keyboardType="number-pad"
            placeholder="Tvoje číslo"
            placeholderTextColor="#777"
            style={styles.gameInput}
          />

          <TouchableOpacity style={styles.gameAction} onPress={checkNumber}>
            <Text style={styles.gameActionText}>Hádat</Text>
          </TouchableOpacity>

          <Text style={styles.gameResult}>{numberResult}</Text>

          <TouchableOpacity
            style={styles.gameSecondary}
            onPress={resetNumber}
          >
            <Text style={styles.secondaryButtonText}>Nové číslo</Text>
          </TouchableOpacity>
        </>
      )}

      {game === "word" && (
        <>
          <Text style={styles.gameBigTitle}>🔤 Hádej slovo</Text>
          <Text style={styles.gameDescription}>
            Myslím si jedno jednoduché slovo.
          </Text>

          <TextInput
            value={wordGuess}
            onChangeText={setWordGuess}
            placeholder="Tvoje tipované slovo"
            placeholderTextColor="#777"
            style={styles.gameInput}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.gameAction} onPress={checkWord}>
            <Text style={styles.gameActionText}>Hádat</Text>
          </TouchableOpacity>

          <Text style={styles.gameResult}>{wordResult}</Text>
        </>
      )}

      {game === "reaction" && (
        <>
          <Text style={styles.gameBigTitle}>⚡ Postřeh</Text>
          <Text style={styles.gameDescription}>
            Počkej, až se objeví zelená, a co nejrychleji klepni.
          </Text>

          <TouchableOpacity
            style={[
              styles.reactionButton,
              reactionReady && styles.reactionReady,
            ]}
            onPress={reactionStarted ? pressReaction : startReaction}
          >
            <Text style={styles.reactionText}>
              {!reactionStarted
                ? "START"
                : reactionReady
                ? "TEĎ!"
                : "ČEKEJ..."}
            </Text>
          </TouchableOpacity>

          <Text style={styles.gameResult}>{reactionResult}</Text>
        </>
      )}

      {game === "rps" && (
        <>
          <Text style={styles.gameBigTitle}>✊ Kámen, nůžky, papír</Text>

          <View style={styles.rpsRow}>
            <TouchableOpacity
              style={styles.rpsButton}
              onPress={() => playRps("kámen")}
            >
              <Text style={styles.rpsIcon}>✊</Text>
              <Text style={styles.rpsText}>Kámen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rpsButton}
              onPress={() => playRps("nůžky")}
            >
              <Text style={styles.rpsIcon}>✌️</Text>
              <Text style={styles.rpsText}>Nůžky</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rpsButton}
              onPress={() => playRps("papír")}
            >
              <Text style={styles.rpsIcon}>✋</Text>
              <Text style={styles.rpsText}>Papír</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.gameResult}>{rpsResult}</Text>
        </>
      )}

      {game === "memory" && (
        <>
          <Text style={styles.gameBigTitle}>🧠 Paměť</Text>
          <Text style={styles.gameDescription}>
            Zapamatuj si číslo a pak ho napiš.
          </Text>

          {memoryVisible && (
            <Text style={styles.memoryNumbers}>{memoryNumber}</Text>
          )}

          <TouchableOpacity
            style={styles.gameSecondary}
            onPress={() => setMemoryVisible(false)}
          >
            <Text style={styles.secondaryButtonText}>
              Schovat číslo
            </Text>
          </TouchableOpacity>

          <TextInput
            value={memoryInput}
            onChangeText={setMemoryInput}
            keyboardType="number-pad"
            placeholder="Napiš číslo"
            placeholderTextColor="#777"
            style={styles.gameInput}
          />

          <TouchableOpacity style={styles.gameAction} onPress={checkMemory}>
            <Text style={styles.gameActionText}>Zkontrolovat</Text>
          </TouchableOpacity>

          <Text style={styles.gameResult}>{memoryResult}</Text>

          <TouchableOpacity
            style={styles.gameSecondary}
            onPress={resetMemory}
          >
            <Text style={styles.secondaryButtonText}>Nové číslo</Text>
          </TouchableOpacity>
        </>
      )}

      {game === "target" && (
        <>
          <Text style={styles.gameBigTitle}>🎯 Tref terč</Text>
          <Text style={styles.gameDescription}>
            Kolikrát dokážeš trefit terč?
          </Text>

          <Text style={styles.score}>Skóre: {targetScore}</Text>

          <TouchableOpacity
            style={styles.target}
            onPress={hitTarget}
          >
            <Text style={styles.targetText}>🎯</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameSecondary}
            onPress={() => setTargetScore(0)}
          >
            <Text style={styles.secondaryButtonText}>Reset skóre</Text>
          </TouchableOpacity>
        </>
      )}

      {game === "snake" && (
        <>
          <Text style={styles.gameBigTitle}>🐍 Had</Text>
          <Text style={styles.gameDescription}>
            Jednoduchá klikací verze hada.
          </Text>

          <Text style={styles.snakeScore}>
            Skóre: {snakeScore}
          </Text>

          <TouchableOpacity
            style={styles.snakeArea}
            onPress={playSnake}
          >
            <Text style={styles.snakeText}>🐍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameAction}
            onPress={playSnake}
          >
            <Text style={styles.gameActionText}>SEŽRAT BOD 🍎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameSecondary}
            onPress={() => setSnakeScore(0)}
          >
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.backGame} onPress={resetGame}>
        <Text style={styles.backGameText}>← Zpět na hry</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* =========================
   HLAVNÍ APLIKACE
========================= */

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModal, setImageModal] = useState(false);

  const [chatModal, setChatModal] = useState(false);
  const [gameModal, setGameModal] = useState(false);

  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(makeId());

  const [game, setGame] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    saveCurrentChat();
  }, [messages]);

  const loadChats = async () => {
    try {
      const raw = await AsyncStorage.getItem(CHAT_KEY);

      if (!raw) {
        setSavedChats([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setSavedChats(parsed);
      }
    } catch (error) {
      console.log("LOAD CHATS ERROR:", error);
    }
  };

  const saveCurrentChat = async () => {
    if (!messages.length) return;

    try {
      const raw = await AsyncStorage.getItem(CHAT_KEY);
      let chats = raw ? JSON.parse(raw) : [];

      const chat = {
        id: currentChatId,
        title: makeTitle(messages),
        messages,
        updatedAt: Date.now(),
      };

      const exists = chats.some((item) => item.id === currentChatId);

      if (exists) {
        chats = chats.map((item) =>
          item.id === currentChatId ? chat : item
        );
      } else {
        chats.unshift(chat);
      }

      chats.sort((a, b) => b.updatedAt - a.updatedAt);

      chats = chats.slice(0, 30);

      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(chats));
      setSavedChats(chats);
    } catch (error) {
      console.log("SAVE CHAT ERROR:", error);
    }
  };

  const openChat = (chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages || []);
    setChatModal(false);
  };

  const newChat = () => {
    setCurrentChatId(makeId());
    setMessages([]);
    setInput("");
    setSelectedImage(null);
    setChatModal(false);
  };

  const deleteChat = async (id) => {
    Alert.alert(
      "Smazat chat?",
      "Tahle konverzace bude odstraněna.",
      [
        {
          text: "Zrušit",
          style: "cancel",
        },
        {
          text: "Smazat",
          style: "destructive",
          onPress: async () => {
            try {
              const next = savedChats.filter(
                (chat) => chat.id !== id
              );

              setSavedChats(next);

              await AsyncStorage.setItem(
                CHAT_KEY,
                JSON.stringify(next)
              );

              if (id === currentChatId) {
                newChat();
              }
            } catch (error) {
              console.log("DELETE CHAT ERROR:", error);
            }
          },
        },
      ]
    );
  };

  /* =========================
     FOTO
  ========================= */

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Povolení",
          "Rýp potřebuje přístup k fotkám."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];

      if (!asset?.uri) return;

      setSelectedImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
    } catch (error) {
      console.log("PICK IMAGE ERROR:", error);
      Alert.alert(
        "Chyba",
        "Fotku se nepodařilo načíst."
      );
    }
  };

  const rotateImage = async () => {
    if (!selectedImage?.uri) return;

    try {
      const result = await ImageManipulator.manipulateAsync(
        selectedImage.uri,
        [{ rotate: 90 }],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setSelectedImage({
        ...selectedImage,
        uri: result.uri,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      console.log("ROTATE ERROR:", error);
    }
  };

  const flipImage = async () => {
    if (!selectedImage?.uri) return;

    try {
      const result = await ImageManipulator.manipulateAsync(
        selectedImage.uri,
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

      setSelectedImage({
        ...selectedImage,
        uri: result.uri,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      console.log("FLIP ERROR:", error);
    }
  };

  /* =========================
     ODESLÁNÍ
  ========================= */

  const sendMessage = async () => {
    const text = input.trim();

    if (!text && !selectedImage) return;

    if (loading) return;

    const imageToSend = selectedImage;

    const userMessage = {
      id: makeId(),
      role: "user",
      text,
      image: imageToSend?.uri || null,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages
            .slice(-12)
            .map((message) => ({
              role: message.role,
              content: message.text || "",
            })),
          image: imageToSend?.uri || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const reply =
        data.reply ||
        data.message ||
        data.content ||
        "Ty jo, Rýp se zasekl. Zkus to ještě jednou.";

      const botMessage = {
        id: makeId(),
        role: "assistant",
        text: String(reply),
      };

      setMessages((current) => [...current, botMessage]);
    } catch (error) {
      console.log("SEND ERROR:", error);

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          text:
            "Do prdele, server mi teď neodpovídá. Zkus to za chvíli znovu. 😁",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.role === "user";

    return (
      <View
        key={message.id}
        style={[
          styles.messageRow,
          isUser
            ? styles.messageRowUser
            : styles.messageRowBot,
        ]}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>R</Text>
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser
              ? styles.userBubble
              : styles.botBubble,
          ]}
        >
          {message.image && (
            <Image
              source={{ uri: message.image }}
              style={styles.messageImage}
            />
          )}

          {!!message.text && (
            <Text style={styles.messageText}>
              {linkify(message.text)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RÝP</Text>
          <Text style={styles.subtitle}>
            Tvůj ukecanej AI parťák
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setGameModal(true)}
          >
            <Text style={styles.headerButtonText}>🎮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setChatModal(true)}
          >
            <Text style={styles.headerButtonText}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({
            animated: true,
          })
        }
      >
        {messages.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Čau, já jsem Rýp 😁
            </Text>

            <Text style={styles.emptyText}>
              Ptej se na cokoliv. A když budeš mít
              náladu, máme i minihry.
            </Text>

            <TouchableOpacity
              style={styles.gameQuickButton}
              onPress={() => setGameModal(true)}
            >
              <Text style={styles.gameQuickText}>
                🎮 Spustit minihry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.map(renderMessage)}

        {loading && (
          <View style={styles.messageRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>R</Text>
            </View>

            <View style={styles.typing}>
              <Text style={styles.typingText}>
                Rýp přemýšlí... 🤔
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {selectedImage && (
        <View style={styles.previewBar}>
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.previewImage}
          />

          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setImageModal(true)}
          >
            <Text style={styles.previewButtonText}>
              Upravit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeImage}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputArea}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImage}
        >
          <Text style={styles.attachText}>📷</Text>
        </TouchableOpacity>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Napiš Rýpovi..."
          placeholderTextColor="#777d88"
          style={styles.input}
          multiline
          maxLength={4000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            loading && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* =========================
          EDITOR FOTEK
      ========================= */}

      <Modal
        visible={imageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageEditor}>
            <Text style={styles.modalTitle}>
              Upravit fotku
            </Text>

            {selectedImage?.uri && (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.editorImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.editorButtons}>
              <TouchableOpacity
                style={styles.editorButton}
                onPress={rotateImage}
              >
                <Text style={styles.editorButtonText}>
                  🔄 Otočit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editorButton}
                onPress={flipImage}
              >
                <Text style={styles.editorButtonText}>
                  ↔️ Převrátit
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editorButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setImageModal(false);
                  setSelectedImage(null);
                }}
              >
                <Text style={styles.editorButtonText}>
                  Zrušit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setImageModal(false)}
              >
                <Text style={styles.confirmButtonText}>
                  Hotovo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================
          ULOŽENÉ CHATY
      ========================= */}

      <Modal
        visible={chatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Moje chaty
              </Text>

              <TouchableOpacity
                onPress={() => setChatModal(false)}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.newChatButton}
              onPress={newChat}
            >
              <Text style={styles.newChatText}>
                ＋ Nový chat
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.chatList}>
              {savedChats.length === 0 ? (
                <Text style={styles.noChats}>
                  Zatím tu žádné uložené chaty nejsou.
                </Text>
              ) : (
                savedChats.map((chat) => (
                  <View
                    key={chat.id}
                    style={styles.savedChatRow}
                  >
                    <TouchableOpacity
                      style={styles.savedChatButton}
                      onPress={() => openChat(chat)}
                    >
                      <Text
                        style={styles.savedChatTitle}
                        numberOfLines={1}
                      >
                        {chat.title}
                      </Text>

                      <Text style={styles.savedChatDate}>
                        {new Date(
                          chat.updatedAt
                        ).toLocaleDateString("cs-CZ")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteChatButton}
                      onPress={() =>
                        deleteChat(chat.id)
                      }
                    >
                      <Text style={styles.deleteChatText}>
                        🗑️
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =========================
          MINIHRY
      ========================= */}

      <Modal
        visible={gameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setGameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.gameModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                🎮 Minihry
              </Text>

              <TouchableOpacity
                onPress={() => setGameModal(false)}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {game ? (
              <GameScreen
                game={game}
                setGame={setGame}
              />
            ) : (
              <ScrollView>
                <Text style={styles.gameIntro}>
                  Vyber si, čím si chceš krátit čas.
                </Text>

                {[
                  ["number", "🔢", "Hádej číslo"],
                  ["word", "🔤", "Hádej slovo"],
                  ["reaction", "⚡", "Postřeh"],
                  ["rps", "✊", "Kámen, nůžky, papír"],
                  ["memory", "🧠", "Paměť"],
                  ["target", "🎯", "Tref terč"],
                  ["snake", "🐍", "Had"],
                ].map(([id, icon, title]) => (
                  <TouchableOpacity
                    key={id}
                    style={styles.gameItem}
                    onPress={() => setGame(id)}
                  >
                    <Text style={styles.gameIcon}>
                      {icon}
                    </Text>

                    <Text style={styles.gameItemText}>
                      {title}
                    </Text>

                    <Text style={styles.gameArrow}>
                      ›
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   STYLY
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.panel,
    borderBottomWidth: 1,
    borderBottomColor: "#292c34",
  },

  logo: {
    color: COLORS.accent,
    fontSize: 25,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 11,
  },

  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.panel2,
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonText: {
    fontSize: 21,
    color: COLORS.text,
  },

  messages: {
    flex: 1,
  },

  messagesContent: {
    padding: 12,
    paddingBottom: 20,
  },

  empty: {
    alignItems: "center",
    paddingTop: 150,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 25,
  },

  gameQuickButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },

  gameQuickText: {
    color: "#111",
    fontWeight: "800",
  },

  messageRow: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-end",
  },

  messageRowUser: {
    justifyContent: "flex-end",
  },

  messageRowBot: {
    justifyContent: "flex-start",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  avatarText: {
    color: "#111",
    fontWeight: "900",
  },

  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 17,
  },

  userBubble: {
    backgroundColor: COLORS.user,
    borderBottomRightRadius: 4,
  },

  botBubble: {
    backgroundColor: COLORS.bot,
    borderBottomLeftRadius: 4,
  },

  messageText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
  },

  link: {
    color: "#62a8ff",
    textDecorationLine: "underline",
  },

  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 7,
  },

  typing: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.bot,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 15,
  },

  typingText: {
    color: COLORS.muted,
  },

  previewBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: COLORS.panel,
  },

  previewImage: {
    width: 55,
    height: 55,
    borderRadius: 9,
  },

  previewButton: {
    marginLeft: 10,
    backgroundColor: COLORS.panel2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  previewButtonText: {
    color: COLORS.text,
    fontWeight: "700",
  },

  removeImage: {
    marginLeft: "auto",
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  removeImageText: {
    color: COLORS.danger,
    fontSize: 20,
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    backgroundColor: COLORS.panel,
  },

  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.panel2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  attachText: {
    fontSize: 20,
  },

  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    backgroundColor: COLORS.panel2,
    color: COLORS.text,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 9,
    fontSize: 15,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  sendText: {
    color: "#111",
    fontSize: 22,
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },

  imageEditor: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    minHeight: "70%",
  },

  chatModal: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    height: "80%",
  },

  gameModal: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
  },

  closeText: {
    color: COLORS.text,
    fontSize: 24,
  },

  editorImage: {
    width: "100%",
    height: 300,
    marginBottom: 15,
  },

  editorButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  editorButton: {
    flex: 1,
    backgroundColor: COLORS.panel2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#444851",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  editorButtonText: {
    color: COLORS.text,
    fontWeight: "800",
  },

  confirmButtonText: {
    color: "#111",
    fontWeight: "900",
  },

  newChatButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 12,
  },

  newChatText: {
    color: "#111",
    fontWeight: "900",
  },

  chatList: {
    flex: 1,
  },

  noChats: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 30,
  },

  savedChatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.panel2,
    borderRadius: 12,
    marginBottom: 8,
  },

  savedChatButton: {
    flex: 1,
    padding: 13,
  },

  savedChatTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },

  savedChatDate: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  deleteChatButton: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteChatText: {
    fontSize: 18,
  },

  gameContent: {
    paddingBottom: 25,
  },

  gameIntro: {
    color: COLORS.muted,
    marginBottom: 12,
  },

  gameItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.panel2,
    padding: 15,
    borderRadius: 14,
    marginBottom: 8,
  },

  gameIcon: {
    fontSize: 25,
    width: 40,
  },

  gameItemText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },

  gameArrow: {
    color: COLORS.muted,
    fontSize: 25,
  },

  gameBigTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
    marginBottom: 8,
  },

  gameDescription: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 15,
  },

  gameInput: {
    backgroundColor: COLORS.panel2,
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },

  gameAction: {
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },

  gameSecondary: {
    backgroundColor: COLORS.panel2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  gameActionText: {
    color: "#111",
    fontWeight: "900",
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: "900",
  },

  gameResult: {
    color: COLORS.text,
    textAlign: "center",
    fontSize: 16,
    marginVertical: 12,
    minHeight: 24,
  },

  reactionButton: {
    height: 150,
    borderRadius: 20,
    backgroundColor: "#2d3139",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },

  reactionReady: {
    backgroundColor: COLORS.green,
  },

  reactionText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },

  rpsRow: {
    flexDirection: "row",
    gap: 8,
  },

  rpsButton: {
    flex: 1,
    backgroundColor: COLORS.panel2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  rpsIcon: {
    fontSize: 28,
  },

  rpsText: {
    color: COLORS.text,
    fontSize: 11,
    marginTop: 5,
  },

  memoryNumbers: {
    color: COLORS.accent,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 5,
    marginVertical: 20,
  },

  target: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#d83232",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    borderWidth: 15,
    borderColor: "#fff",
  },

  targetText: {
    fontSize: 65,
  },

  score: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  snakeArea: {
    height: 180,
    backgroundColor: "#172019",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },

  snakeText: {
    fontSize: 70,
  },

  snakeScore: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },

  backGame: {
    marginTop: 18,
    backgroundColor: COLORS.panel2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  backGameText: {
    color: COLORS.text,
    fontWeight: "800",
  },
});
