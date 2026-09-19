import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

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
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://ryp-hpvu.onrender.com/chat";
const CHAT_KEY = "ryp_saved_chats_v7";

const RYP_IMAGE = require(
  "./file_00000000e44c81f4b86b60e21106fc88.png"
);

function makeId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).slice(2)
  );
}

function LinkText({ text }) {
  if (!text) return null;

  const parts = text.split(
    /(https?:\/\/[^\s]+)/g
  );

  return (
    <Text style={styles.messageText}>
      {parts.map((part, index) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <Text
              key={index}
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(
                  part.replace(/[.,!?)]$/, "")
                )
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

  useEffect(() => {
    loadSavedChats();
  }, []);

  const loadSavedChats = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(CHAT_KEY);

      if (saved) {
        setSavedChats(JSON.parse(saved));
      }
    } catch (error) {
      console.log(
        "Načtení chatů:",
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
        "Uložení chatů:",
        error
      );
    }
  };

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

  const saveCurrentChat = async () => {
    const firstUser = messages.find(
      (message) =>
        message.role === "user"
    );

    const title =
      firstUser?.content?.slice(0, 40) ||
      "Nový chat";

    const chat = {
      id: makeId(),
      title,
      messages,
      createdAt:
        new Date().toISOString(),
    };

    const updated = [
      chat,
      ...savedChats,
    ].slice(0, 30);

    setSavedChats(updated);
    await persistChats(updated);

    setMoreVisible(false);

    Alert.alert(
      "Hotovo",
      "Chat byl uložen 😈"
    );
  };

  const deleteChat = async (id) => {
    const updated =
      savedChats.filter(
        (chat) => chat.id !== id
      );

    setSavedChats(updated);
    await persistChats(updated);
  };

  const openSavedChat = (chat) => {
    setMessages(chat.messages);
    setSavedVisible(false);
  };

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

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
            messages:
              nextMessages
                .slice(-12)
                .map((message) => ({
                  role: message.role,
                  content:
                    message.content,
                })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Server error"
        );
      }

      const data =
        await response.json();

      const answer =
        data?.reply ||
        data?.message ||
        data?.response ||
        "Rýp se zasekl. Zkus to znovu 😈";

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
        "API chyba:",
        error
      );

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content:
            "Ty vole, server mi zrovna neodpovídá. Zkus to za chvíli znovu. 😅",
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
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.9,
        });

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        setPhotoUri(
          result.assets[0].uri
        );
        setPhotoVisible(true);
      }
    } catch (error) {
      console.log(
        "Kamera:",
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
          "Rýp potřebuje přístup k fotkám."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.9,
        });

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        setPhotoUri(
          result.assets[0].uri
        );
        setPhotoVisible(true);
      }
    } catch (error) {
      console.log(
        "Galerie:",
        error
      );
    }
  };

  const rotatePhoto = async () => {
    if (!photoUri) return;

    try {
      const result =
        await ImageManipulator.manipulateAsync(
          photoUri,
          [{ rotate: 90 }],
          {
            compress: 0.9,
            format:
              ImageManipulator.SaveFormat.JPEG,
          }
        );

      setPhotoUri(result.uri);
    } catch (error) {
      console.log(
        "Rotace:",
        error
      );
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
              flip:
                ImageManipulator.FlipType
                  .Horizontal,
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
        "Překlopení:",
        error
      );
    }
  };
  const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#080808",
  },

  container: {
    flex: 1,
    backgroundColor: "#080808",
  },

  header: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1B1B1B",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 11,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },

  online: {
    color: "#B8F500",
    fontSize: 11,
    marginTop: 1,
    fontWeight: "600",
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
  },

  chat: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
  },

  messageRow: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 13,
  },

  aiRow: {
    justifyContent: "flex-start",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  smallLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginTop: 2,
  },

  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
  },

  aiBubble: {
    backgroundColor: "#171717",
    borderBottomLeftRadius: 5,
  },

  userBubble: {
    backgroundColor: "#B8F500",
    borderBottomRightRadius: 5,
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },

  linkText: {
    color: "#B8F500",
    textDecorationLine: "underline",
  },

  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  typingBubble: {
    backgroundColor: "#171717",
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  typingText: {
    color: "#777",
    fontSize: 14,
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 9,
    borderTopWidth: 1,
    borderTopColor: "#1B1B1B",
    backgroundColor: "#080808",
  },

  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    backgroundColor: "#151515",
    color: "#FFFFFF",
    borderRadius: 23,
    paddingHorizontal: 17,
    paddingVertical: 11,
    fontSize: 16,
    marginRight: 8,
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#B8F500",
    alignItems: "center",
    justifyContent: "center",
  },

  sendDisabled: {
    opacity: 0.35,
  },

  bottomNav: {
    height: 67,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#1B1B1B",
    backgroundColor: "#0D0D0D",
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 75,
  },

  navText: {
    color: "#777",
    fontSize: 11,
    marginTop: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },

  photoModal: {
    backgroundColor: "#101010",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 18,
    maxHeight: "90%",
  },

  moreModal: {
    backgroundColor: "#101010",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 18,
    paddingBottom: 28,
  },

  savedModal: {
    backgroundColor: "#101010",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 18,
    height: "78%",
  },

  infoModal: {
    backgroundColor: "#101010",
    borderRadius: 25,
    padding: 20,
    margin: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  photoPreview: {
    width: "100%",
    height: 350,
    borderRadius: 18,
    backgroundColor: "#050505",
  },

  photoTools: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },

  toolButton: {
    alignItems: "center",
    marginHorizontal: 25,
  },

  toolText: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 4,
  },

  closePhotoButton: {
    backgroundColor: "#B8F500",
    borderRadius: 20,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  closePhotoText: {
    color: "#101010",
    fontSize: 16,
    fontWeight: "800",
  },

  moreItem: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1D1D1D",
  },

  moreText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 15,
  },

  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#1D1D1D",
  },

  savedOpen: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  savedTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    marginLeft: 12,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#777",
    fontSize: 15,
    marginTop: 12,
  },

  settingBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1D1D1D",
  },

  settingTextBox: {
    flex: 1,
    marginLeft: 14,
  },

  settingTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  settingDescription: {
    color: "#777",
    fontSize: 12,
    marginTop: 3,
  },

  aboutLogo: {
    width: 85,
    height: 85,
    borderRadius: 43,
    alignSelf: "center",
    marginBottom: 10,
  },

  aboutTitle: {
    color: "#B8F500",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },

  aboutText: {
    color: "#CCC",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
  },

  versionText: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    marginTop: 18,
  },
});
