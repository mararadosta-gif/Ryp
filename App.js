import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://ryp-hpvu.onrender.com/chat";
const CHAT_KEY = "ryp_saved_chats_v5";

const RYP_IMAGE = require("./file_00000000e44c81f4b86b60e21106fc88.png");

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

/* =========================
   TEXT + LINKS
========================= */

function LinkText({ text }) {
  if (!text) {
    return null;
  }

  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return (
    <Text style={styles.messageText}>
      {parts.map((part, index) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <Text
              key={index}
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(part.replace(/[.,!?)]$/, ""))
              }
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
  const [message, setMessage] = useState(
    "Myslím si číslo od 1 do 100 😈"
  );

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
      setMessage("🎉 Trefa!");
      setNumber(null);
      return;
    }

    setMessage(n < number ? "Moc málo 😏" : "Moc 😈");
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

      <TouchableOpacity
        style={styles.gameButton}
        onPress={check}
      >
        <Text style={styles.gameButtonText}>HÁDAT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={start}
      >
        <Text style={styles.secondaryButtonText}>
          NOVÁ HRA
        </Text>
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
    setWord(
      words[Math.floor(Math.random() * words.length)]
    );
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

      <TouchableOpacity
        style={styles.gameButton}
        onPress={check}
      >
        <Text style={styles.gameButtonText}>
          ZKONTROLOVAT
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={newWord}
      >
        <Text style={styles.secondaryButtonText}>
          NOVÉ SLOVO
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ReactionGame() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(
    "Klikni a čekej..."
  );
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

    const reaction = Date.now() - startedAt;

    setMessage(`⚡ ${reaction} ms`);

    setRunning(false);
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>⚡ Reakce</Text>

      <Text style={styles.gameText}>
        {message}
      </Text>

      <TouchableOpacity
        style={[
          styles.reactionButton,
          startedAt && styles.reactionReady,
        ]}
        onPress={tap}
      >
        <Text style={styles.reactionButtonText}>
          {startedAt ? "TEĎ!" : "START"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function RpsGame() {
  const [result, setResult] = useState(
    "Vyber si 😈"
  );

  const choices = ["✊", "✌️", "✋"];

  const play = (player) => {
    const computer =
      choices[Math.floor(Math.random() * choices.length)];

    if (player === computer) {
      setResult(`Já: ${computer} — Remíza 😂`);
      return;
    }

    const win =
      (player === "✊" && computer === "✌️") ||
      (player === "✌️" && computer === "✋") ||
      (player === "✋" && computer === "✊");

    setResult(
      `Já: ${computer} — ${
        win ? "Vyhrál jsi 😏" : "Prohrál jsi 😂"
      }`
    );
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>
        ✊ Kámen, nůžky, papír
      </Text>

      <Text style={styles.gameText}>{result}</Text>

      <View style={styles.rpsRow}>
        {choices.map((choice) => (
          <TouchableOpacity
            key={choice}
            style={styles.rpsButton}
            onPress={() => play(choice)}
          >
            <Text style={styles.rpsEmoji}>
              {choice}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MemoryGame() {
  const symbols = [
    "🍎",
    "🚗",
    "🐱",
    "⚽",
    "🍕",
    "🚀",
  ];

  const makeCards = () =>
    [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        open: false,
        matched: false,
      }));

  const [cards, setCards] = useState(makeCards());
  const [selected, setSelected] = useState([]);

  const reset = () => {
    setCards(makeCards());
    setSelected([]);
  };

  const pressCard = (index) => {
    if (
      selected.length === 2 ||
      cards[index].open ||
      cards[index].matched
    ) {
      return;
    }

    const nextCards = [...cards];

    nextCards[index].open = true;

    const nextSelected = [...selected, index];

    setCards(nextCards);
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      const [a, b] = nextSelected;

      if (
        nextCards[a].symbol ===
        nextCards[b].symbol
      ) {
        setTimeout(() => {
          setCards((current) =>
            current.map((card, i) =>
              i === a || i === b
                ? { ...card, matched: true }
                : card
            )
          );

          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((current) =>
            current.map((card, i) =>
              i === a || i === b
                ? { ...card, open: false }
                : card
            )
          );

          setSelected([]);
        }, 700);
      }
    }
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🧠 Pexeso</Text>

      <View style={styles.memoryGrid}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            style={styles.memoryCard}
            onPress={() => pressCard(index)}
          >
            <Text style={styles.memoryText}>
              {card.open || card.matched
                ? card.symbol
                : "❓"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={reset}
      >
        <Text style={styles.secondaryButtonText}>
          NOVÁ HRA
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TargetGame() {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({
    top: 40,
    left: 40,
  });

  const hit = () => {
    setScore((s) => s + 1);

    setPosition({
      top: Math.random() * 180,
      left: Math.random() * 180,
    });
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🎯 Terč</Text>

      <Text style={styles.gameText}>
        Skóre: {score}
      </Text>

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

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setScore(0);
          setPosition({
            top: 40,
            left: 40,
          });
        }}
      >
        <Text style={styles.secondaryButtonText}>
          RESET
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SnakeGame() {
  const [snake, setSnake] = useState([
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    { x: 2, y: 4 },
  ]);

  const [direction, setDirection] = useState({
    x: 1,
    y: 0,
  });

  const [food, setFood] = useState({
    x: 7,
    y: 7,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSnake((current) => {
        const head = current[0];

        const newHead = {
          x: head.x + direction.x,
          y: head.y + direction.y,
        };

        if (
          newHead.x < 0 ||
          newHead.x > 9 ||
          newHead.y < 0 ||
          newHead.y > 9
        ) {
          return [
            { x: 4, y: 4 },
            { x: 3, y: 4 },
            { x: 2, y: 4 },
          ];
        }

        const ate =
          newHead.x === food.x &&
          newHead.y === food.y;

        const next = [
          newHead,
          ...current,
        ];

        if (!ate) {
          next.pop();
        } else {
          setFood({
            x: Math.floor(Math.random() * 10),
            y: Math.floor(Math.random() * 10),
          });
        }

        return next;
      });
    }, 180);

    return () => clearInterval(timer);
  }, [direction, food]);

  const cell = (x, y) => {
    const isSnake = snake.some(
      (part) =>
        part.x === x && part.y === y
    );

    const isFood =
      food.x === x && food.y === y;

    return (
      <View
        key={`${x}-${y}`}
        style={[
          styles.snakeCell,
          isSnake && styles.snakeBody,
          isFood && styles.snakeFood,
        ]}
      />
    );
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>🐍 Had</Text>

      <View style={styles.snakeBoard}>
        {Array.from({ length: 10 }).map((_, y) =>
          Array.from({ length: 10 }).map((_, x) =>
            cell(x, y)
          )
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() =>
            setDirection({ x: 0, y: -1 })
          }
        >
          <Text style={styles.arrowText}>▲</Text>
        </TouchableOpacity>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() =>
              setDirection({ x: -1, y: 0 })
            }
          >
            <Text style={styles.arrowText}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() =>
              setDirection({ x: 1, y: 0 })
            }
          >
            <Text style={styles.arrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() =>
            setDirection({ x: 0, y: 1 })
          }
        >
          <Text style={styles.arrowText}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
          }function GamesMenu({ visible, onClose }) {
  const [game, setGame] = useState("number");

  const games = [
    { id: "number", label: "🎯 Číslo" },
    { id: "word", label: "🔤 Slovo" },
    { id: "reaction", label: "⚡ Reakce" },
    { id: "rps", label: "✊ KNP" },
    { id: "memory", label: "🧠 Pexeso" },
    { id: "target", label: "🎯 Terč" },
    { id: "snake", label: "🐍 Had" },
  ];

  const renderGame = () => {
    switch (game) {
      case "word":
        return <WordGame />;

      case "reaction":
        return <ReactionGame />;

      case "rps":
        return <RpsGame />;

      case "memory":
        return <MemoryGame />;

      case "target":
        return <TargetGame />;

      case "snake":
        return <SnakeGame />;

      default:
        return <NumberGame />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.gamesModal}>
          <View style={styles.gamesHeader}>
            <Text style={styles.gamesHeaderTitle}>
              🎮 Minihry
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gameTabs}
            contentContainerStyle={styles.gameTabsContent}
          >
            {games.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.gameTab,
                  game === item.id &&
                    styles.gameTabActive,
                ]}
                onPress={() => setGame(item.id)}
              >
                <Text
                  style={[
                    styles.gameTabText,
                    game === item.id &&
                      styles.gameTabTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={
              styles.gameContentContainer
            }
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
   HLAVNÍ APLIKACE
========================= */

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: makeId(),
      role: "assistant",
      content:
        "Čau 😈 Já jsem Rýp. Tak co dneska vyřešíme?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [gamesVisible, setGamesVisible] =
    useState(false);

  const [savedChats, setSavedChats] = useState([]);
  const [savedVisible, setSavedVisible] =
    useState(false);

  const [photoUri, setPhotoUri] = useState(null);
  const [photoVisible, setPhotoVisible] =
    useState(false);

  const [moreVisible, setMoreVisible] =
    useState(false);

  const [settingsVisible, setSettingsVisible] =
    useState(false);

  const [aboutVisible, setAboutVisible] =
    useState(false);

  /* =========================
     NAČTENÍ ULOŽENÝCH CHATŮ
  ========================= */

  useEffect(() => {
    loadSavedChats();
  }, []);

  const loadSavedChats = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        CHAT_KEY
      );

      if (saved) {
        setSavedChats(JSON.parse(saved));
      }
    } catch (error) {
      console.log(
        "Chyba při načítání chatů:",
        error
      );
    }
  };

  const persistChats = async (chats) => {
    try {
      await AsyncStorage.setItem(
        CHAT_KEY,
        JSON.stringify(chats)
      );
    } catch (error) {
      console.log(
        "Chyba při ukládání chatů:",
        error
      );
    }
  };

  /* =========================
     ULOŽENÍ CHatu
  ========================= */

  const saveCurrentChat = async () => {
    if (
      !messages ||
      messages.length === 0
    ) {
      return;
    }

    const firstUserMessage = messages.find(
      (message) =>
        message.role === "user"
    );

    const title =
      firstUserMessage?.content
        ?.slice(0, 35) ||
      "Nový chat";

    const chat = {
      id: makeId(),
      title,
      messages,
      createdAt: new Date().toISOString(),
    };

    const updated = [
      chat,
      ...savedChats,
    ].slice(0, 30);

    setSavedChats(updated);

    await persistChats(updated);

    Alert.alert(
      "Hotovo",
      "Chat byl uložen 😈"
    );
  };

  const deleteChat = async (id) => {
    const updated = savedChats.filter(
      (chat) => chat.id !== id
    );

    setSavedChats(updated);
    await persistChats(updated);
  };

  const openSavedChat = (chat) => {
    setMessages(chat.messages);
    setSavedVisible(false);
  };

  /* =========================
     NOVÝ CHAT
  ========================= */

  const newChat = () => {
    setMessages([
      {
        id: makeId(),
        role: "assistant",
        content:
          "Čau 😈 Já jsem Rýp. Tak co dneska vyřešíme?",
      },
    ]);

    setInput("");
  };

  /* =========================
     POSLÁNÍ ZPRÁVY
  ========================= */

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const userMessage = {
      id: makeId(),
      role: "user",
      content: text,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            messages: nextMessages
              .slice(-12)
              .map((message) => ({
                role: message.role,
                content: message.content,
              })),
          }),
        }
      );

      const data = await response.json();

      const answer =
        data?.reply ||
        data?.message ||
        "Rýp momentálně mlčí. 🤨";

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      console.log(
        "Chyba API:",
        error
      );

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content:
            "Kurva, spojení se mnou nějak chcíplo. Zkus to znovu 😅",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FOTO
  ========================= */

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
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

      if (!result.canceled) {
        const uri =
          result.assets?.[0]?.uri;

        if (uri) {
          setPhotoUri(uri);
          setPhotoVisible(true);
        }
      }
    } catch (error) {
      console.log(
        "Kamera chyba:",
        error
      );
    }
  };

  const openGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Galerie",
          "Rýp potřebuje povolení k fotkám."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

      if (!result.canceled) {
        const uri =
          result.assets?.[0]?.uri;

        if (uri) {
          setPhotoUri(uri);
          setPhotoVisible(true);
        }
      }
    } catch (error) {
      console.log(
        "Galerie chyba:",
        error
      );
    }
  };

  const rotatePhoto = async () => {
    if (!photoUri) {
      return;
    }

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
            format:
              ImageManipulator.SaveFormat.JPEG,
          }
        );

      setPhotoUri(result.uri);
    } catch (error) {
      console.log(
        "Rotace chyba:",
        error
      );
    }
  };

  const flipPhoto = async () => {
    if (!photoUri) {
      return;
    }

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
            format:
              ImageManipulator.SaveFormat.JPEG,
          }
        );

      setPhotoUri(result.uri);
    } catch (error) {
      console.log(
        "Převrácení chyba:",
        error
      );
    }
  };  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* =========================
            HLAVIČKA
        ========================= */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={RYP_IMAGE}
              style={styles.headerAvatar}
              resizeMode="cover"
            />

            <View>
              <Text style={styles.logoText}>
                RýpAI
              </Text>

              <Text style={styles.subtitleText}>
                AI kámoš, co se s tebou nemaže 😈
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={newChat}
          >
            <Text style={styles.headerButtonText}>
              ＋
            </Text>
          </TouchableOpacity>
        </View>

        {/* =========================
            CHAT
        ========================= */}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          contentContainerStyle={
            styles.chatContent
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.role === "user"
                  ? styles.userRow
                  : styles.assistantRow,
              ]}
            >
              {item.role === "assistant" && (
                <Image
                  source={RYP_IMAGE}
                  style={styles.messageAvatar}
                />
              )}

              <View
                style={[
                  styles.messageBubble,
                  item.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <LinkText
                  text={item.content}
                />
              </View>
            </View>
          )}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <Image
              source={RYP_IMAGE}
              style={styles.loadingAvatar}
            />

            <View
              style={styles.loadingBubble}
            >
              <Text
                style={styles.loadingText}
              >
                Rýp přemýšlí... 😈
              </Text>
            </View>
          </View>
        )}

        {/* =========================
            INPUT
        ========================= */}

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={openCamera}
          >
            <Text style={styles.cameraIcon}>
              📷
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Napiš Rýpovi..."
            placeholderTextColor="#777"
            multiline
            maxLength={4000}
            onSubmitEditing={sendMessage}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || loading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={
              !input.trim() || loading
            }
          >
            <Text style={styles.sendIcon}>
              ➤
            </Text>
          </TouchableOpacity>
        </View>

        {/* =========================
            SPODNÍ NAVIGACE
        ========================= */}

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setMoreVisible(false);
              setSavedVisible(false);
            }}
          >
            <Text style={styles.navIcon}>
              💬
            </Text>

            <Text style={styles.navText}>
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setGamesVisible(true)
            }
          >
            <Text style={styles.navIcon}>
              🎮
            </Text>

            <Text style={styles.navText}>
              Hry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setPhotoVisible(true)
            }
          >
            <Text style={styles.navIcon}>
              📷
            </Text>

            <Text style={styles.navText}>
              Foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setMoreVisible(true)
            }
          >
            <Text style={styles.navIcon}>
              ☰
            </Text>

            <Text style={styles.navText}>
              Další
            </Text>
          </TouchableOpacity>
        </View>

        {/* =========================
            HRY
        ========================= */}

        <GamesMenu
          visible={gamesVisible}
          onClose={() =>
            setGamesVisible(false)
          }
        />

        {/* =========================
            FOTO MODAL
        ========================= */}

        <Modal
          visible={photoVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setPhotoVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.photoModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  📷 Foto
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setPhotoVisible(false)
                  }
                >
                  <Text
                    style={styles.closeButton}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={styles.emptyPhoto}
                >
                  <Text
                    style={styles.emptyPhotoText}
                  >
                    Vyfoť nebo vyber fotku 😈
                  </Text>
                </View>
              )}

              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.photoAction}
                  onPress={openCamera}
                >
                  <Text
                    style={styles.photoActionText}
                  >
                    📷 Kamera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoAction}
                  onPress={openGallery}
                >
                  <Text
                    style={styles.photoActionText}
                  >
                    🖼️ Galerie
                  </Text>
                </TouchableOpacity>
              </View>

              {photoUri && (
                <View
                  style={styles.photoButtons}
                >
                  <TouchableOpacity
                    style={styles.photoAction}
                    onPress={rotatePhoto}
                  >
                    <Text
                      style={
                        styles.photoActionText
                      }
                    >
                      🔄 Otočit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoAction}
                    onPress={flipPhoto}
                  >
                    <Text
                      style={
                        styles.photoActionText
                      }
                    >
                      ↔️ Převrátit
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* =========================
            DALŠÍ
        ========================= */}

        <Modal
          visible={moreVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setMoreVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.moreModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  ☰ Další
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setMoreVisible(false)
                  }
                >
                  <Text
                    style={styles.closeButton}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  setMoreVisible(false);
                  setSavedVisible(true);
                }}
              >
                <Text style={styles.menuButtonIcon}>
                  💾
                </Text>

                <Text style={styles.menuButtonText}>
                  Uložené chaty
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={saveCurrentChat}
              >
                <Text style={styles.menuButtonIcon}>
                  📌
                </Text>

                <Text style={styles.menuButtonText}>
                  Uložit aktuální chat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  setMoreVisible(false);
                  setSettingsVisible(true);
                }}
              >
                <Text style={styles.menuButtonIcon}>
                  ⚙️
                </Text>

                <Text style={styles.menuButtonText}>
                  Nastavení
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  setMoreVisible(false);
                  setAboutVisible(true);
                }}
              >
                <Text style={styles.menuButtonIcon}>
                  ℹ️
                </Text>

                <Text style={styles.menuButtonText}>
                  O aplikaci
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* =========================
            ULOŽENÉ CHATY
        ========================= */}

        <Modal
          visible={savedVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setSavedVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.moreModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  💾 Uložené chaty
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setSavedVisible(false)
                  }
                >
                  <Text
                    style={styles.closeButton}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {savedChats.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={styles.emptyStateText}
                  >
                    Zatím tu nic není 😈
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={savedChats}
                  keyExtractor={(item) =>
                    item.id
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                  renderItem={({
                    item,
                  }) => (
                    <View
                      style={
                        styles.savedChatRow
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.savedChatOpen
                        }
                        onPress={() =>
                          openSavedChat(item)
                        }
                      >
                        <Text
                          style={
                            styles.savedChatTitle
                          }
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>

                        <Text
                          style={
                            styles.savedChatDate
                          }
                        >
                          {new Date(
                            item.createdAt
                          ).toLocaleDateString(
                            "cs-CZ"
                          )}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.deleteChatButton
                        }
                        onPress={() =>
                          deleteChat(item.id)
                        }
                      >
                        <Text
                          style={
                            styles.deleteChatText
                          }
                        >
                          🗑️
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>    {/* O aplikaci */}
    <Modal
      visible={moreModal === "about"}
      transparent
      animationType="fade"
      onRequestClose={() => setMoreModal(null)}
    >
      <View style={styles.overlay}>
        <View style={styles.moreBox}>
          <Text style={styles.moreTitle}>Rýp AI</Text>
          <Text style={styles.moreText}>
            Tvůj AI kámoš, co se s tebou nemaže 😈
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setMoreModal(null)}
          >
            <Text style={styles.closeButtonText}>Zavřít</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Nastavení */}
    <Modal
      visible={moreModal === "settings"}
      transparent
      animationType="fade"
      onRequestClose={() => setMoreModal(null)}
    >
      <View style={styles.overlay}>
        <View style={styles.moreBox}>
          <Text style={styles.moreTitle}>Nastavení</Text>

          <Text style={styles.moreText}>
            Rýp AI • verze 1.1
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setMoreModal(null)}
          >
            <Text style={styles.closeButtonText}>Zavřít</Text>
          </TouchableOpacity>
        </View>
      </View>    </Modal>
      </KeyboardAvoidingView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080B10",
  },

  header: {
    height: 78,
    paddingHorizontal: 18,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#151B23",
    backgroundColor: "#0B0F15",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  headerTitle: {
    color: "#F5F7FA",
    fontSize: 25,
    fontWeight: "900",
  },

  headerSub: {
    color: "#7F8996",
    fontSize: 12,
    marginTop: 1,
  },

  chatList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  messageRow: {
    marginVertical: 5,
    flexDirection: "row",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  botRow: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
  },

  userBubble: {
    backgroundColor: "#18232B",
    borderBottomRightRadius: 5,
  },

  botBubble: {
    backgroundColor: "#111820",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#1D2731",
  },

  messageText: {
    color: "#E9EDF2",
    fontSize: 16,
    lineHeight: 22,
  },

  inputArea: {
    marginHorizontal: 12,
    marginBottom: 8,
    minHeight: 58,
    maxHeight: 120,
    borderRadius: 20,
    backgroundColor: "#11161D",
    borderWidth: 1,
    borderColor: "#202A34",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  cameraButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraText: {
    fontSize: 23,
  },

  input: {
    flex: 1,
    color: "#F2F4F7",
    fontSize: 16,
    paddingHorizontal: 7,
    paddingVertical: 10,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#B8F500",
    alignItems: "center",
    justifyContent: "center",
  },

  sendText: {
    color: "#080B10",
    fontSize: 20,
    fontWeight: "900",
  },

  bottomNav: {
    height: 66,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 22,
    backgroundColor: "#10161D",
    borderWidth: 1,
    borderColor: "#202A34",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },

  navIcon: {
    fontSize: 21,
  },

  navText: {
    color: "#737E8B",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "700",
  },

  navTextActive: {
    color: "#B8F500",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },

  moreBox: {
    width: "92%",
    backgroundColor: "#111820",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#27313C",
    padding: 22,
  },

  moreTitle: {
    color: "#F4F6F8",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },

  moreText: {
    color: "#AAB3BD",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  closeButton: {
    backgroundColor: "#B8F500",
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: "center",
  },

  closeButtonText: {
    color: "#080B10",
    fontWeight: "900",
    fontSize: 15,
  },

  gameBox: {
    width: "94%",
    maxHeight: "86%",
    backgroundColor: "#10161D",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#26313C",
    padding: 18,
  },

  gameTitle: {
    color: "#F4F6F8",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 15,
  },

  gameButton: {
    backgroundColor: "#182129",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#26323D",
  },

  gameButtonText: {
    color: "#E8EDF1",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },

  closeGame: {
    marginTop: 12,
    backgroundColor: "#B8F500",
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: "center",
  },

  closeGameText: {
    color: "#080B10",
    fontWeight: "900",
  },

  photoImage: {
    width: "100%",
    height: 360,
    resizeMode: "contain",
    borderRadius: 18,
    backgroundColor: "#080B10",
  },

  photoButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  photoButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#182129",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  photoButtonText: {
    color: "#E8EDF1",
    fontWeight: "800",
  },

  savedItem: {
    backgroundColor: "#182129",
    borderRadius: 15,
    padding: 14,
    marginBottom: 8,
  },

  savedTitle: {
    color: "#F2F5F7",
    fontSize: 16,
    fontWeight: "800",
  },

  savedDate: {
    color: "#75808C",
    fontSize: 12,
    marginTop: 4,
  },
});
