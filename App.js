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
  Modal,
  ScrollView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL = "https://ryp-hpvu.onrender.com/chat";
const CHATS_KEY = "@ryp_saved_chats_v5";

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

const GAME_LIST = [
  ["number", "🎯 Číslo"],
  ["word", "🔤 Slovo"],
  ["reaction", "⚡ Postřeh"],
  ["rps", "✂️ KNP"],
  ["memory", "🧠 Paměť"],
  ["target", "🎯 Terč"],
  ["snake", "🐍 Had"],
];

const randomNumber = (max) => Math.floor(Math.random() * max);

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

  // =========================
  // MINIHRY
  // =========================

  const [gameOpen, setGameOpen] = useState(false);
  const [game, setGame] = useState("number");

  // HÁDEJ ČÍSLO
  const [secretNumber, setSecretNumber] = useState(
    randomNumber(20) + 1
  );

  const [guess, setGuess] = useState("");

  const [gameMessage, setGameMessage] = useState(
    "Myslím si číslo od 1 do 20. Hádej! 😈"
  );

  const [score, setScore] = useState(0);

  // HÁDEJ SLOVO
  const [word, setWord] = useState("");
  const [wordGuess, setWordGuess] = useState("");
  const [wordMessage, setWordMessage] = useState("");

  // POSTŘEH
  const [reactionStarted, setReactionStarted] = useState(false);
  const [reactionReady, setReactionReady] = useState(false);
  const [reactionStart, setReactionStart] = useState(0);
  const [reactionMessage, setReactionMessage] = useState(
    "Stiskni START."
  );

  const reactionTimer = useRef(null);

  // KÁMEN NŮŽKY PAPÍR
  const [rpsMessage, setRpsMessage] = useState("");

  // PAMĚŤ
  const [memorySequence, setMemorySequence] = useState([]);
  const [memoryInput, setMemoryInput] = useState("");
  const [memoryMessage, setMemoryMessage] = useState("");
  const [memoryRound, setMemoryRound] = useState(1);

  // TERČ
  const [targetPos, setTargetPos] = useState({
    x: 50,
    y: 40,
  });

  const [targetMessage, setTargetMessage] = useState(
    "Klepni na terč!"
  );

  // HAD
  const [snake, setSnake] = useState([
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    { x: 2, y: 4 },
  ]);

  const [snakeFood, setSnakeFood] = useState({
    x: 7,
    y: 7,
  });

  const [snakeDir, setSnakeDir] = useState({
    x: 1,
    y: 0,
  });

  const [snakeRunning, setSnakeRunning] = useState(false);

  const [snakeMessage, setSnakeMessage] = useState(
    "Stiskni START."
  );

  // =========================
  // ULOŽENÉ CHATY
  // =========================

  const [savedChats, setSavedChats] = useState([]);
  const [chatsOpen, setChatsOpen] = useState(false);

  const flatListRef = useRef(null);

  // =========================
  // START
  // =========================

  useEffect(() => {
    loadChats();

    return () => {
      if (reactionTimer.current) {
        clearTimeout(reactionTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // =========================
  // HAD
  // =========================

  useEffect(() => {
    if (!snakeRunning || game !== "snake") {
      return;
    }

    const timer = setInterval(() => {
      setSnake((oldSnake) => {
        const head = oldSnake[0];

        const next = {
          x: head.x + snakeDir.x,
          y: head.y + snakeDir.y,
        };

        if (
          next.x < 0 ||
          next.x >= 10 ||
          next.y < 0 ||
          next.y >= 8 ||
          oldSnake.some(
            (p) =>
              p.x === next.x &&
              p.y === next.y
          )
        ) {
          setSnakeRunning(false);
          setSnakeMessage(
            "💥 Konec! Stiskni START."
          );

          return oldSnake;
        }

        let nextSnake = [
          next,
          ...oldSnake,
        ];

        if (
          next.x === snakeFood.x &&
          next.y === snakeFood.y
        ) {
          setSnakeFood({
            x: randomNumber(10),
            y: randomNumber(8),
          });
        } else {
          nextSnake =
            nextSnake.slice(0, -1);
        }

        return nextSnake;
      });
    }, 220);

    return () => clearInterval(timer);
  }, [
    snakeRunning,
    snakeDir,
    snakeFood,
    game,
  ]);

  // =========================
  // SCROLL
  // =========================

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  // =========================
  // CHATY
  // =========================

  const loadChats = async () => {
    try {
      const raw =
        await AsyncStorage.getItem(
          CHATS_KEY
        );

      if (raw) {
        setSavedChats(
          JSON.parse(raw)
        );
      }
    } catch (error) {
      console.log(
        "Načtení chatů:",
        error
      );
    }
  };

  const chatTitle = (items) => {
    const first = items.find(
      (item) =>
        !item.bot &&
        item.text?.trim()
    );

    if (!first) {
      return "Nový chat";
    }

    const text = cleanText(
      first.text
    ).replace(/^📷\s*/, "");

    if (text.length > 36) {
      return (
        text.slice(0, 36) +
        "…"
      );
    }

    return text;
  };

  const saveChat = async (items) => {
    try {
      const chat = {
        id: Date.now().toString(),
        title: chatTitle(items),
        messages: items,
        updatedAt: Date.now(),
      };

      const next = [
        chat,
        ...savedChats,
      ].slice(0, 30);

      setSavedChats(next);

      await AsyncStorage.setItem(
        CHATS_KEY,
        JSON.stringify(next)
      );
    } catch (error) {
      console.log(
        "Uložení chatu:",
        error
      );
    }
  };

  const openChat = (chat) => {
    setMessages(chat.messages);
    setChatsOpen(false);
  };

  const newChat = () => {
    setMessages([
      {
        id: `${Date.now()}-welcome`,
        text:
          "Nový chat. Tak povídej. 😈",
        bot: true,
      },
    ]);

    setSelectedImage(null);
    setChatsOpen(false);
  };

  // =========================
  // MINIHRY
  // =========================

  const startGame = (selected) => {
    setGame(selected);
    setGameOpen(true);

    if (selected === "number") {
      setSecretNumber(
        randomNumber(20) + 1
      );

      setGuess("");

      setGameMessage(
        "Myslím si číslo od 1 do 20. Hádej! 😈"
      );
    }

    if (selected === "word") {
      const words = [
        "kočka",
        "auto",
        "houba",
        "pizza",
        "dům",
        "pes",
        "telefon",
        "strom",
      ];

      const chosen =
        words[
          randomNumber(words.length)
        ];

      setWord(chosen);
      setWordGuess("");

      setWordMessage(
        `Slovo má ${chosen.length} písmen. Začíná na „${chosen[0]}“.`
      );
    }

    if (selected === "reaction") {
      setReactionStarted(false);
      setReactionReady(false);

      setReactionMessage(
        "Stiskni START."
      );
    }

    if (selected === "rps") {
      setRpsMessage(
        "Vyber kámen, nůžky nebo papír."
      );
    }

    if (selected === "memory") {
      const seq =
        Array.from(
          { length: 3 },
          () => randomNumber(10)
        );

      setMemorySequence(seq);
      setMemoryInput("");
      setMemoryRound(1);

      setMemoryMessage(
        `Zapamatuj si: ${seq.join("  ")}`
      );

      setTimeout(() => {
        setMemoryMessage(
          "Teď čísla napiš za sebou."
        );
      }, 1600);
    }

    if (selected === "target") {
      setTargetPos({
        x: randomNumber(85) + 5,
        y: randomNumber(65) + 15,
      });

      setTargetMessage(
        "Klepni na terč!"
      );
    }

    if (selected === "snake") {
      setSnake([
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ]);

      setSnakeFood({
        x: 7,
        y: 6,
      });

      setSnakeDir({
        x: 1,
        y: 0,
      });

      setSnakeRunning(false);

      setSnakeMessage(
        "Stiskni START."
      );
    }
  };

  // =========================
  // HÁDEJ ČÍSLO
  // =========================

  const makeGuess = () => {
    const number = Number(
      guess
    );

    if (
      !number ||
      number < 1 ||
      number > 20
    ) {
      setGameMessage(
        "Zadej číslo od 1 do 20, šampióne. 😂"
      );

      return;
    }

    if (
      number === secretNumber
    ) {
      const newScore =
        score + 1;

      setScore(newScore);

      setGameMessage(
        `🎉 Trefa! Číslo bylo ${secretNumber}. Skóre: ${newScore}`
      );

      setTimeout(() => {
        setSecretNumber(
          randomNumber(20) + 1
        );

        setGuess("");

        setGameMessage(
          "Nové číslo! Tak ukaž, jestli máš štěstí. 😈"
        );
      }, 900);

      return;
    }

    setGameMessage(
      number < secretNumber
        ? "Moc málo! 🔽 Zkus větší číslo."
        : "Moc vysoko! 🔼 Zkus menší číslo."
    );

    setGuess("");
  };

  // =========================
  // HÁDEJ SLOVO
  // =========================

  const checkWord = () => {
    if (
      wordGuess
        .trim()
        .toLowerCase() === word
    ) {
      setWordMessage(
        "🎉 Správně!"
      );

      setTimeout(() => {
        startGame("word");
      }, 800);
    } else {
      setWordMessage(
        `Ne. Zkus to znovu. Začíná na „${word[0]}“.`
      );
    }
  };

  // =========================
  // POSTŘEH
  // =========================

  const startReaction = () => {
    setReactionStarted(true);
    setReactionReady(false);

    setReactionMessage(
      "ČEKEJ…"
    );

    const delay =
      1500 +
      Math.random() * 3000;

    reactionTimer.current =
      setTimeout(() => {
        setReactionReady(true);
        setReactionStart(
          Date.now()
        );

        setReactionMessage(
          "TEĎ!!!"
        );
      }, delay);
  };

  const hitReaction = () => {
    if (!reactionStarted) {
      return;
    }

    if (!reactionReady) {
      clearTimeout(
        reactionTimer.current
      );

      setReactionStarted(false);

      setReactionMessage(
        "Moc brzo! 😂"
      );

      return;
    }

    const ms =
      Date.now() -
      reactionStart;

    setReactionStarted(false);
    setReactionReady(false);

    setReactionMessage(
      `⚡ ${ms} ms!`
    );
  };

  // =========================
  // KÁMEN NŮŽKY PAPÍR
  // =========================

  const playRps = (choice) => {
    const choices = [
      "kámen",
      "nůžky",
      "papír",
    ];

    const bot =
      choices[
        randomNumber(3)
      ];

    let result =
      "Remíza!";

    if (
      (choice === "kámen" &&
        bot === "nůžky") ||
      (choice === "nůžky" &&
        bot === "papír") ||
      (choice === "papír" &&
        bot === "kámen")
    ) {
      result =
        "Vyhrál jsi! 😈";
    } else if (
      choice !== bot
    ) {
      result =
        "Rýp vyhrál! 😂";
    }

    setRpsMessage(
      `Rýp: ${bot}. ${result}`
    );
  };

  // =========================
  // PAMĚŤ
  // =========================

  const checkMemory = () => {
    if (
      memoryInput.replace(
        /\s/g,
        ""
      ) ===
      memorySequence.join("")
    ) {
      const nextLength =
        memorySequence.length +
        1;

      const seq =
        Array.from(
          { length: nextLength },
          () => randomNumber(10)
        );

      setMemoryRound(
        memoryRound + 1
      );

      setMemorySequence(seq);
      setMemoryInput("");

      setMemoryMessage(
        `Správně! Zapamatuj si: ${seq.join("  ")}`
      );

      setTimeout(() => {
        setMemoryMessage(
          "Teď čísla napiš za sebou."
        );
      }, 1400);
    } else {
      setMemoryMessage(
        `Špatně. Správně bylo ${memorySequence.join("")}.`
      );
    }
  };

  // =========================
  // TERČ
  // =========================

  const hitTarget = () => {
    setTargetPos({
      x: randomNumber(85) + 5,
      y: randomNumber(65) + 15,
    });

    setTargetMessage(
      "🎯 Trefa! Znovu!"
    );
  };

  // =========================
  // HAD
  // =========================

  const startSnake = () => {
    setSnake([
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ]);

    setSnakeFood({
      x: 7,
      y: 6,
    });

    setSnakeDir({
      x: 1,
      y: 0,
    });

    setSnakeMessage(
      "Chytej jídlo! 🐍"
    );

    setSnakeRunning(true);
  };

  const changeSnakeDirection = (
    dir
  ) => {
    if (
      dir.x === -snakeDir.x &&
      dir.y === -snakeDir.y
    ) {
      return;
    }

    setSnakeDir(dir);
  };

  // =========================
  // GALERIE
  // =========================

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

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
            base64: true,
          }
        );

      if (
        !result.canceled &&
        result.assets?.[0]
      ) {
        setSelectedImage(
          result.assets[0]
        );
      }
    } catch (error) {
      console.log(
        "Galerie:",
        error
      );

      Alert.alert(
        "Chyba",
        "Galerii se nepodařilo otevřít."
      );
    }
  };

  // =========================
  // FOŤÁK
  // =========================

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

      const result =
        await ImagePicker.launchCameraAsync(
          {
            allowsEditing: true,
            quality: 0.8,
            base64: true,
          }
        );

      if (
        !result.canceled &&
        result.assets?.[0]
      ) {
        setSelectedImage(
          result.assets[0]
        );
      }
    } catch (error) {
      console.log(
        "Foťák:",
        error
      );

      Alert.alert(
        "Chyba",
        "Foťák se nepodařilo otevřít."
      );
    }
  };

  // =========================
  // VÝBĚR OBRÁZKU
  // =========================

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

  // =========================
  // OTOČENÍ OBRÁZKU
  // =========================

  const rotateImage = async () => {
    if (!selectedImage?.uri) {
      return;
    }

    try {
      const result =
        await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [
            {
              rotate: 90,
            },
          ],
          {
            compress: 0.8,
            format:
              ImageManipulator.SaveFormat
                .JPEG,
            base64: true,
          }
        );

      setSelectedImage({
        ...selectedImage,
        uri: result.uri,
        base64: result.base64,
        mimeType: "image/jpeg",
      });
    } catch (error) {
      Alert.alert(
        "Chyba",
        "Obrázek se nepodařilo upravit."
      );
    }
  };

  // =========================
  // PŘEKLOPENÍ OBRÁZKU
  // =========================

  const flipImage = async () => {
    if (!selectedImage?.uri) {
      return;
    }

    try {
      const result =
        await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [
            {
              flip:
                ImageManipulator
                  .FlipType
                  .Horizontal,
            },
          ],
          {
            compress: 0.8,
            format:
              ImageManipulator.SaveFormat
                .JPEG,
            base64: true,
          }
        );

      setSelectedImage({
        ...selectedImage,
        uri: result.uri,
        base64: result.base64,
        mimeType: "image/jpeg",
      });
    } catch (error) {
      Alert.alert(
        "Chyba",
        "Obrázek se nepodařilo upravit."
      );
    }
  };

  // =========================
  // ODESLÁNÍ
  // =========================

  const sendMessage = async () => {
    if (
      (!message.trim() &&
        !selectedImage) ||
      loading
    ) {
      return;
    }

    const userText =
      message.trim() ||
      "Podívej se na tenhle obrázek.";

    const historyForServer =
      messages
        .slice(-12)
        .map((item) => ({
          role: item.bot
            ? "assistant"
            : "user",
          content: cleanText(
            item.text
          ),
        }));

    const imageToSend =
      selectedImage;

    const userMessage = {
      id: `${Date.now()}-user`,
      text: imageToSend
        ? `📷 ${userText}`
        : userText,
      bot: false,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(
      updatedMessages
    );

    setMessage("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const response =
        await fetch(
          SERVER_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message:
                userText,

              history:
                historyForServer,

              image: imageToSend
                ? {
                    base64:
                      imageToSend.base64,

                    mimeType:
                      imageToSend.mimeType ||
                      "image/jpeg",
                  }
                : null,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data =
        await response.json();

      const finalMessages = [
        ...updatedMessages,

        {
          id: `${Date.now()}-bot`,
          text:
            data.reply ||
            "Rýp nic nevrátil. 🤨",
