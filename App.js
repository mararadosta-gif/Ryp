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
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://ryp-hpvu.onrender.com/chat";
const CHAT_KEY = "ryp_saved_chats_v7";

const RYP_IMAGE = require(
  "./file_00000000e44c81f4b86b60e21106fc88.png"
);

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Čau. Já jsem Rýp. Tak povídej, co zase potřebuješ. 😉",
};

function makeId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).slice(2)
  );
}

function MessageText({ text, user }) {
  return (
    <Text
      style={[
        styles.messageText,
        user && styles.userMessageText,
      ]}
    >
      {text}
    </Text>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    welcomeMessage,
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("chat");

  const [gamesVisible, setGamesVisible] =
    useState(false);

  const [moreVisible, setMoreVisible] =
    useState(false);

  const [photoVisible, setPhotoVisible] =
    useState(false);

  const [savedVisible, setSavedVisible] =
    useState(false);

  const [settingsVisible, setSettingsVisible] =
    useState(false);

  const [aboutVisible, setAboutVisible] =
    useState(false);

  const [savedChats, setSavedChats] = useState([]);

  const [photoUri, setPhotoUri] = useState(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const data =
        await AsyncStorage.getItem(CHAT_KEY);

      if (data) {
        setSavedChats(JSON.parse(data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveChats = async (chats) => {
    try {
      await AsyncStorage.setItem(
        CHAT_KEY,
        JSON.stringify(chats)
      );
    } catch (error) {
      console.log(error);
    }
  };

  const newChat = () => {
    setMessages([welcomeMessage]);
    setInput("");
    setActiveTab("chat");
  };

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage = {
      id: makeId(),
      role: "user",
      content: text,
    };

    const conversation = [
      ...messages,
      userMessage,
    ];

    setMessages(conversation);
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
            messages: conversation
              .slice(-12)
              .map((item) => ({
                role: item.role,
                content: item.content,
              })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data =
        await response.json();

      const answer =
        data?.reply ||
        data?.message ||
        data?.response ||
        "Rýp se někde zasekl. Zkus to znovu.";

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      console.log(error);

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content:
            "Ty vole, server mi teď neodpovídá. Zkus to za chvíli.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openGallery = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Povolení",
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
      setPhotoUri(result.assets[0].uri);
      setPhotoVisible(true);
    }
  };

  const openCamera = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Povolení",
        "Rýp potřebuje přístup ke kameře."
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
      setPhotoUri(result.assets[0].uri);
      setPhotoVisible(true);
    }
  };

  const saveCurrentChat = async () => {
    const firstUser = messages.find(
      (item) => item.role === "user"
    );

    const title =
      firstUser?.content?.slice(0, 45) ||
      "Nový chat";

    const newSavedChat = {
      id: makeId(),
      title,
      messages,
      date: new Date().toISOString(),
    };

    const updated = [
      newSavedChat,
      ...savedChats,
    ].slice(0, 30);

    setSavedChats(updated);
    await saveChats(updated);

    Alert.alert(
      "Uloženo",
      "Chat je uložený."
    );
  };

  const deleteChat = async (id) => {
    const updated =
      savedChats.filter(
        (item) => item.id !== id
      );

    setSavedChats(updated);
    await saveChats(updated);
  };

  const selectTab = (tab) => {
    setActiveTab(tab);

    if (tab === "chat") {
      setGamesVisible(false);
      setMoreVisible(false);
      setPhotoVisible(false);
    }

    if (tab === "games") {
      setGamesVisible(true);
    }

    if (tab === "photo") {
      openGallery();
    }

    if (tab === "more") {
      setMoreVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        {/* HLAVNÍ OBRAZOVKA */}

        <View style={styles.hero}>
          <View style={styles.blueMarkLeft}>
            <Text style={styles.markText}>
              〽
            </Text>
          </View>

          <View style={styles.heroLogoWrap}>
            <Image
              source={RYP_IMAGE}
              style={styles.heroLogo}
            />

            <View style={styles.logoRing} />
          </View>

          <Text style={styles.heroTitle}>
            Rýp
          </Text>

          <View style={styles.heroUnderline}>
            <View
              style={styles.heroStroke}
            />
          </View>

          <Text style={styles.heroSubtitle}>
            AI, která se s tebou nemaže.
          </Text>

          <Text style={styles.crown}>
            ♕
          </Text>
        </View>

        {/* CHAT */}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.chat}
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
                  : styles.aiRow,
              ]}
            >
              {item.role !== "user" && (
                <Image
                  source={RYP_IMAGE}
                  style={styles.chatAvatar}
                />
              )}

              <View
                style={[
                  styles.messageBubble,
                  item.role === "user"
                    ? styles.userBubble
                    : styles.aiBubble,
                ]}
              >
                <MessageText
                  text={item.content}
                  user={
                    item.role === "user"
                  }
                />
              </View>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <View style={styles.aiRow}>
                <Image
                  source={RYP_IMAGE}
                  style={styles.chatAvatar}
                />

                <View
                  style={styles.aiBubble}
                >
                  <Text
                    style={styles.typing}
                  >
                    Rýp píše...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* PSANÍ */}

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={openCamera}
          >
            <Ionicons
              name="camera"
              size={31}
              color="#EAF3FF"
            />
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Napiš Rýpovi..."
            placeholderTextColor="#91A8CA"
            style={styles.input}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || loading) &&
                styles.sendDisabled,
            ]}
            onPress={sendMessage}
            disabled={
              !input.trim() || loading
            }
          >
            <Ionicons
              name="send"
              size={30}
              color="#061000"
            />
          </TouchableOpacity>
        </View>

        {/* SPODNÍ MENU */}

        <View style={styles.bottomNav}>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              selectTab("chat")
            }
          >
            <Ionicons
              name="chatbubble"
              size={31}
              color={
                activeTab === "chat"
                  ? "#8CFF00"
                  : "#91A8CA"
              }
            />

            <Text
              style={[
                styles.navText,
                activeTab === "chat" &&
                  styles.navActiveText,
              ]}
            >
              Chat
            </Text>

            {activeTab === "chat" && (
              <View
                style={styles.activeLine}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              selectTab("games")
            }
          >
            <Ionicons
              name="game-controller"
              size={31}
              color={
                activeTab === "games"
                  ? "#8CFF00"
                  : "#91A8CA"
              }
            />

            <Text
              style={[
                styles.navText,
                activeTab === "games" &&
                  styles.navActiveText,
              ]}
            >
              Hry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              selectTab("photo")
            }
          >
            <Ionicons
              name="camera-outline"
              size={34}
              color={
                activeTab === "photo"
                  ? "#8CFF00"
                  : "#91A8CA"
              }
            />

            <Text
              style={[
                styles.navText,
                activeTab === "photo" &&
                  styles.navActiveText,
              ]}
            >
              Foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              selectTab("more")
            }
          >
            <Ionicons
              name="menu"
              size={36}
              color={
                activeTab === "more"
                  ? "#8CFF00"
                  : "#91A8CA"
              }
            />

            <Text
              style={[
                styles.navText,
                activeTab === "more" &&
                  styles.navActiveText,
              ]}
            >
              Další
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
      {/d}
              onPress={() => {
                Alert.alert(
                  "Hádej číslo",
                  "Tahle hra bude brzy zpátky 😈"
                );
              }}
            >
              <View
                style={styles.gameIcon}
              >
                <Ionicons
                  name="help-circle"
                  size={34}
                  color="#8CFF00"
                />
              </View>

              <View
                style={styles.gameInfo}
              >
                <Text
                  style={styles.gameTitle}
                >
                  Hádej číslo
                </Text>

                <Text
                  style={styles.gameDescription}
                >
                  Zkus uhádnout číslo, které si
                  Rýp myslí.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={25}
                color="#91A8CA"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gameCard}
              onPress={() =>
                Alert.alert(
                  "Další hra",
                  "Přidáme později 😈"
                )
              }
            >
              <View
                style={styles.gameIcon}
              >
                <Ionicons
                  name="game-controller"
                  size={32}
                  color="#4DB8FF"
                />
              </View>

              <View
                style={styles.gameInfo}
              >
                <Text
                  style={styles.gameTitle}
                >
                  Další hry
                </Text>

                <Text
                  style={styles.gameDescription}
                >
                  Něco dalšího vymyslíme.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={25}
                color="#91A8CA"
              />
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* FOTO */}

      <Modal
        visible={photoVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setPhotoVisible(false)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.bottomModal}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Foto
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setPhotoVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.photoPreview}
                resizeMode="contain"
              />
            ) : (
              <View
                style={styles.noPhoto}
              >
                <Ionicons
                  name="image-outline"
                  size={65}
                  color="#4DB8FF"
                />

                <Text
                  style={styles.noPhotoText}
                >
                  Vyber nebo vyfoť fotku
                </Text>
              </View>
            )}

            <View
              style={styles.photoButtons}
            >
              <TouchableOpacity
                style={styles.photoButton}
                onPress={openGallery}
              >
                <Ionicons
                  name="images-outline"
                  size={25}
                  color="#8CFF00"
                />

                <Text
                  style={styles.photoButtonText}
                >
                  Galerie
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={openCamera}
              >
                <Ionicons
                  name="camera-outline"
                  size={25}
                  color="#8CFF00"
                />

                <Text
                  style={styles.photoButtonText}
                >
                  Kamera
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* DALŠÍ */}

      <Modal
        visible={moreVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setMoreVisible(false)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.bottomModal}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Další
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setMoreVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMoreVisible(false);
                setSavedVisible(true);
              }}
            >
              <Ionicons
                name="bookmark-outline"
                size={27}
                color="#8CFF00"
              />

              <Text
                style={styles.menuText}
              >
                Uložené chaty
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={saveCurrentChat}
            >
              <Ionicons
                name="save-outline"
                size={27}
                color="#8CFF00"
              />

              <Text
                style={styles.menuText}
              >
                Uložit tento chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMoreVisible(false);
                setSettingsVisible(true);
              }}
            >
              <Ionicons
                name="settings-outline"
                size={27}
                color="#4DB8FF"
              />

              <Text
                style={styles.menuText}
              >
                Nastavení
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMoreVisible(false);
                setAboutVisible(true);
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={27}
                color="#4DB8FF"
              />

              <Text
                style={styles.menuText}
              >
                O Rýpovi
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ULOŽENÉ CHATY */}

      <Modal
        visible={savedVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSavedVisible(false)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.savedModal}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Uložené chaty
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSavedVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {savedChats.length === 0 ? (
              <View
                style={styles.emptyState}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={55}
                  color="#4DB8FF"
                />

                <Text
                  style={styles.emptyText}
                >
                  Zatím nemáš žádný uložený chat.
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
                renderItem={({ item }) => (
                  <View
                    style={styles.savedRow}
                  >
                    <TouchableOpacity
                      style={styles.savedOpen}
                      onPress={() => {
                        setMessages(
                          item.messages
                        );
                        setSavedVisible(false);
                        setActiveTab("chat");
                      }}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={23}
                        color="#8CFF00"
                      />

                      <Text
                        style={styles.savedTitle}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        deleteChat(item.id)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={23}
                        color="#777"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

          </View>
        </View>
      </Modal>

      {/* NASTAVENÍ */}

      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSettingsVisible(false)
        }
      >
        <View style={styles.centerOverlay}>
          <View style={styles.infoModal}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Nastavení
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSettingsVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Ionicons
                name="moon-outline"
                size={27}
                color="#8CFF00"
              />

              <View
                style={styles.settingContent}
              >
                <Text
                  style={styles.settingTitle}
                >
                  Tmavý režim
                </Text>

                <Text
                  style={styles.settingDescription}
                >
                  Rýp má rád tmu. 😈
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Ionicons
                name="save-outline"
                size={27}
                color="#4DB8FF"
              />

              <View
                style={styles.settingContent}
              >
                <Text
                  style={styles.settingTitle}
                >
                  Ukládání chatů
                </Text>

                <Text
                  style={styles.settingDescription}
                >
                  Chaty se ukládají přímo v telefonu.
                </Text>
              </View>
            </View>

          </View>
        </View>
      </Modal>

      {/* O RÝPOVI */}

      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setAboutVisible(false)
        }
      >
        <View style={styles.centerOverlay}>
          <View style={styles.infoModal}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                O Rýpovi
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setAboutVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <Image
              source={RYP_IMAGE}
              style={styles.aboutLogo}
            />

            <Text
              style={styles.aboutTitle}
            >
              Rýp AI
            </Text>

            <Text
              style={styles.aboutText}
            >
              AI parťák pro puberťáky.
              Poradí, pokecá a občas si
              do tebe trochu rýpne.
            </Text>

            <Text
              style={styles.version}
            >
              V7
            </Text>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: "#050A12",
  },

  container: {
    flex: 1,
    backgroundColor: "#050A12",
  },

  hero: {
    height: 245,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07101D",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    overflow: "hidden",
  },

  blueMarkLeft: {
    position: "absolute",
    left: 18,
    top: 28,
  },

  markText: {
    color: "#4DB8FF",
    fontSize: 34,
    fontWeight: "900",
  },

  heroLogoWrap: {
    width: 91,
    height: 91,
    alignItems: "center",
    justifyContent: "center",
  },

  heroLogo: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },

  logoRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "#8CFF00",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 43,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 3,
  },

  heroUnderline: {
    width: 115,
    height: 5,
    marginTop: 3,
    overflow: "hidden",
  },

  heroStroke: {
    width: 115,
    height: 3,
    backgroundColor: "#8CFF00",
    borderRadius: 3,
  },

  heroSubtitle: {
    color: "#A9BDD8",
    fontSize: 13,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  crown: {
    position: "absolute",
    right: 20,
    top: 23,
    color: "#8CFF00",
    fontSize: 30,
  },

  chat: {
    flex: 1,
  },

  chatContent: {
    padding: 15,
    paddingBottom: 10,
  },

  messageRow: {
    flexDirection: "row",
    marginBottom: 14,
    width: "100%",
  },

  aiRow: {
    justifyContent: "flex-start",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    marginTop: 2,
  },

  messageBubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  aiBubble: {
    backgroundColor: "#101B2A",
    borderWidth: 1,
    borderColor: "#1D344E",
    borderBottomLeftRadius: 5,
  },

  userBubble: {
    backgroundColor: "#8CFF00",
    borderBottomRightRadius: 5,
  },

  messageText: {
    color: "#EAF3FF",
    fontSize: 16,
    lineHeight: 22,
  },

  userMessageText: {
    color: "#071000",
    fontWeight: "600",
  },

  typing: {
    color: "#91A8CA",
    fontSize: 14,
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#050A12",
    borderTopWidth: 1,
    borderTopColor: "#142337",
  },

  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0E1B2B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#203A57",
  },

  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    backgroundColor: "#0E1B2B",
    color: "#FFFFFF",
    borderRadius: 27,
    paddingHorizontal: 18,
    paddingVertical: 13,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#203A57",
    marginRight: 8,
  },

  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#8CFF00",
    alignItems: "center",
    justifyContent: "center",
  },

  sendDisabled: {
    opacity: 0.35,
  },

  bottomNav: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#07101D",
    borderTopWidth: 1,
    borderTopColor: "#142337",
  },

  navItem: {
    width: 75,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  navText: {
    color: "#91A8CA",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
  },

  navActiveText: {
    color: "#8CFF00",
  },

  activeLine: {
    position: "absolute",
    bottom: 0,
    width: 35,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#8CFF00",
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  centerOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.78)",
    padding: 20,
  },

  bottomModal: {
    backgroundColor: "#08111E",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: "#1B3956",
  },

  savedModal: {
    height: "78%",
    backgroundColor: "#08111E",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  infoModal: {
    backgroundColor: "#08111E",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1B3956",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E1B2B",
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1D344E",
  },

  gameIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: "#07101D",
    alignItems: "center",
    justifyContent: "center",
  },

  gameInfo: {
    flex: 1,
    marginLeft: 13,
  },

  gameTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  gameDescription: {
    color: "#91A8CA",
    fontSize: 12,
    marginTop: 3,
  },

  photoPreview: {
    width: "100%",
    height: 330,
    borderRadius: 20,
    backgroundColor: "#03070D",
  },
  photoPreview: {
    width: "100%",
    height: 330,
    borderRadius: 20,
    backgroundColor: "#03070D",
  },

  noPhoto: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E1B2B",
    borderRadius: 20,
  },

  noPhotoText: {
    color: "#91A8CA",
    fontSize: 15,
    marginTop: 12,
  },

  photoButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },

  photoButton: {
    width: 130,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#0E1B2B",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#203A57",
  },

  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  menuItem: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#142337",
  },

  menuText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 15,
  },

  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#142337",
  },

  savedOpen: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  savedTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#91A8CA",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#142337",
  },

  settingContent: {
    flex: 1,
    marginLeft: 14,
  },

  settingTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  settingDescription: {
    color: "#91A8CA",
    fontSize: 12,
    marginTop: 4,
  },

  aboutLogo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 12,
  },

  aboutTitle: {
    color: "#8CFF00",
    textAlign: "center",
    fontSize: 27,
    fontWeight: "900",
  },

  aboutText: {
    color: "#C1D0E4",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
  },

  version: {
    color: "#536984",
    fontSize: 12,
    textAlign: "center",
    marginTop: 18,
  },
});
