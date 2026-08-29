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

  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

  // Otevře galerii
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
    }
  };

  // Otevře foťák
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
    }
  };

  // Nabídka fotoaparát / galerie
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
      message.trim() ||
      "Podívej se na tenhle obrázek.";

    const historyForServer = messages
      .slice(-12)
      .map((item) => ({
        role: item.bot ? "assistant" : "user",
        content: item.text,
      }));

    const userMessage = {
      id: `${Date.now()}-user`,
      text: selectedImage
        ? `📷 ${userText}`
        : userText,
      bot: false,
    };

    setMessages((old) => [...old, userMessage]);
    setMessage("");
    setLoading(true);

    const imageToSend = selectedImage;

    setSelectedImage(null);

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
                    imageToSend.mimeType ||
                    "image/jpeg",
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
         
