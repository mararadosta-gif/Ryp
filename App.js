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

/* =========================
   ODKAZY
========================= */

function LinkText({ text }) {
  if (!text) {
    return null;
  }

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
     ULOŽENÉ CHATY
  ========================= */

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

  const saveCurrentChat = async () => {
    if (!messages.length) {
      return;
    }

    const firstUserMessage =
      messages.find(
        (message) =>
          message.role === "user"
      );

    const title =
      firstUserMessage?.content?.slice(
        0,
        40
      ) || "Nový chat";

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

      const data =
        await response.json();

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
     KAMERA
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

  /* =========================
     GALERIE
  ========================= */

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

  /* =========================
     OTOČENÍ FOTKY
  ========================= */

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

  /* =========================
     PŘEVRÁCENÍ FOTKY
  ========================= */

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
        "Převrácení chyba:",
        error
      );
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        {/* HLAVIČKA */}

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

              <Text
                style={styles.subtitleText}
              >
                AI kámoš, co se s tebou nemaže 😈
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={newChat}
          >
            <Text
              style={styles.headerButtonText}
            >
              ＋
            </Text>
          </TouchableOpacity>
        </View>

        {/* CHAT */}

        <FlatList
          data={messages}
          keyExtractor={(item) =>
            item.id
          }
          style={styles.chatList}
          contentContainerStyle={
            styles.chatContent
          }
          showsVerticalScrollIndicator={
            false
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.role === "user"
                  ? styles.userRow
                  : styles.assistantRow,
              ]}
            >
              {item.role ===
                "assistant" && (
                <Image
                  source={RYP_IMAGE}
                  style={
                    styles.messageAvatar
                  }
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

        {/* LOADING */}

        {loading && (
          <View
            style={styles.loadingRow}
          >
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

        {/* INPUT */}

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={openCamera}
          >
            <Text
              style={styles.cameraIcon}
            >
              📷
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Napiš Rýpovi..."
            placeholderTextColor="#68778B"
            multiline
            maxLength={4000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() ||
                loading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={
              !input.trim() || loading
            }
          >
            <Text
              style={styles.sendIcon}
            >
              ➤
            </Text>
          </TouchableOpacity>
        </View>

        {/* SPODNÍ NAVIGACE */}

        <View style={styles.bottomNav}>

          <TouchableOpacity
            style={styles.navItem}
            onPress={newChat}
          >
            <Text
              style={[
                styles.navIcon,
                styles.navIconActive,
              ]}
            >
              💬
            </Text>

            <Text
              style={[
                styles.navText,
                styles.navActiveText,
              ]}
            >
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setPhotoVisible(true)
            }
          >
            <Text
              style={styles.navIcon}
            >
              📷
            </Text>

            <Text
              style={styles.navText}
            >
              Foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setSavedVisible(true)
            }
          >
            <Text
              style={styles.navIcon}
            >
              💾
            </Text>

            <Text
              style={styles.navText}
            >
              Chaty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setMoreVisible(true)
            }
          >
            <Text
              style={styles.navIcon}
            >
              ☰
            </Text>

            <Text
              style={styles.navText}
            >
              Další
            </Text>
          </TouchableOpacity>

        </View>

        {/* FOTO */}

        <Modal
          visible={photoVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setPhotoVisible(false)
          }
        >
          <View
            style={styles.modalOverlay}
          >
            <View
              style={styles.photoModal}
            >

              <View
                style={styles.modalHeader}
              >
                <Text
                  style={styles.modalTitle}
                >
                  📷 Foto
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setPhotoVisible(false)
                  }
                >
                  <Text
                    style={
                      styles.closeText
                    }
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {photoUri ? (
                <Image
                  source={{
                    uri: photoUri,
                  }}
                  style={
                    styles.photoPreview
                  }
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={styles.noPhoto}
                >
                  <Text
                    style={
                      styles.noPhotoText
                    }
                  >
                    Vyfoť nebo vyber fotku 😈
                  </Text>
                </View>
              )}

              <View
                style={
                  styles.photoButtons
                }
              >
                <TouchableOpacity
                  style={
                    styles.photoButton
                  }
                  onPress={openCamera}
                >
                  <Text
                    style={
                      styles.photoButtonText
                    }
                  >
                    📷 Kamera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.photoButton
                  }
                  onPress={openGallery}
                >
                  <Text
                    style={
                      styles.photoButtonText
                    }
                  >
                    🖼 Galerie
                  </Text>
                </TouchableOpacity>
              </View>

              {photoUri && (
                <View
                  style={
                    styles.photoButtons
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.photoButton
                    }
                    onPress={
                      rotatePhoto
                    }
                  >
                    <Text
                      style={
                        styles.photoButtonText
                      }
                    >
                      🔄 Otočit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.photoButton
                    }
                    onPress={
                      flipPhoto
                    }
                  >
                    <Text
                      style={
                        styles.photoButtonText
                      }
                    >
                      ↔ Převrátit
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

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
          <View
            style={styles.modalOverlay}
          >
            <View
              style={styles.moreModal}
            >

              <View
                style={styles.modalHeader}
              >
                <Text
                  style={styles.modalTitle}
                >
                  ☰ Další
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setMoreVisible(false)
                  }
                >
                  <Text
                    style={
                      styles.closeText
                    }
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMoreVisible(false);
                  setSavedVisible(true);
                }}
              >
                <Text
                  style={
                    styles.menuIcon
                  }
                >
                  💾
                </Text>

                <Text
                  style={
                    styles.menuText
                  }
                >
                  Uložené chaty
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={saveCurrentChat}
              >
                <Text
                  style={
                    styles.menuIcon
                  }
                >
                  📌
                </Text>

                <Text
                  style={
                    styles.menuText
                  }
                >
                  Uložit aktuální chat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMoreVisible(false);
                  setSettingsVisible(true);
                }}
              >
                <Text
                  style={
                    styles.menuIcon
                  }
                >
                  ⚙️
                </Text>

                <Text
                  style={
                    styles.menuText
                  }
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
                <Text
                  style={
                    styles.menuIcon
                  }
                >
                  ℹ️
                </Text>

                <Text
                  style={
                    styles.menuText
                  }
                >
                  O aplikaci
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
          <View
            style={styles.modalOverlay}
          >
            <View
              style={styles.moreModal}
            >

              <View
                style={styles.modalHeader}
              >
                <Text
                  style={styles.modalTitle}
                >
                  💾 Uložené chaty
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setSavedVisible(false)
                  }
                >
                  <Text
                    style={
                      styles.closeText
                    }
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {savedChats.length ===
              0 ? (
                <View
                  style={
                    styles.emptyState
                  }
                >
                  <Text
                    style={
                      styles.emptyText
                    }
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
                        styles.savedRow
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.savedOpen
                        }
                        onPress={() =>
                          openSavedChat(
                            item
                          )
                        }
                      >
                        <Text
                          style={
                            styles.savedTitle
                          }
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>

                        <Text
                          style={
                            styles.savedDate
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
                        onPress={() =>
                          deleteChat(
                            item.id
                          )
                        }
                      >
                        <Text
                          style={
                            styles.deleteText
                          }
                        >
                          🗑
                        </Text>
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
          <View
            style={styles.modalOverlay}
          >
            <View
              style={styles.infoModal}
            >

              <Text
                style={styles.infoTitle}
              >
                ⚙️ Nastavení
              </Text>

              <Text
                style={styles.infoText}
              >
                RýpAI
              </Text>

              <Text
                style={styles.infoSmall}
              >
                Nastavení budeme postupně přidávat.
              </Text>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setSettingsVisible(false)
                }
              >
                <Text
                  style={
                    styles.closeButtonText
                  }
                >
                  Zavřít
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

        {/* O APLIKACI */}

        <Modal
          visible={aboutVisible}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setAboutVisible(false)
          }
        >
          <View
            style={styles.modalOverlay}
          >
            <View
              style={styles.infoModal}
            >

              <Image
                source={RYP_IMAGE}
                style={styles.aboutLogo}
              />

              <Text
                style={styles.aboutTitle}
              >
                RýpAI
              </Text>

              <Text
                style={styles.aboutText}
              >
                Tvůj AI kámoš, co se s tebou nemaže 😈
              </Text>

              <Text
                style={styles.version}
              >
                Verze 1.1
              </Text>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setAboutVisible(false)
                }
              >
                <Text
                  style={
                    styles.closeButtonText
                  }
                >
                  Zavřít
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================
   STYLY
========================= */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#080C12",
  },

  container: {
    flex: 1,
    backgroundColor: "#080C12",
  },

  header: {
    height: 78,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B1119",
    borderBottomWidth: 1,
    borderBottomColor: "#182433",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  logoText: {
    color: "#8CFF00",
    fontSize: 25,
    fontWeight: "900",
  },

  subtitleText: {
    color: "#91A8CA",
    fontSize: 11,
    marginTop: 2,
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111D2A",
    borderWidth: 1,
    borderColor: "#20344A",
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonText: {
    color: "#8CFF00",
    fontSize: 28,
    lineHeight: 30,
  },

  chatList: {
    flex: 1,
    paddingHorizontal: 12,
  },

  chatContent: {
    paddingTop: 14,
    paddingBottom: 12,
  },

  messageRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-end",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  assistantRow: {
    justifyContent: "flex-start",
  },

  messageAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
  },

  userBubble: {
    backgroundColor: "#193329",
    borderBottomRightRadius: 5,
  },

  assistantBubble: {
    backgroundColor: "#111B27",
    borderWidth: 1,
    borderColor: "#1D3045",
    borderBottomLeftRadius: 5,
  },

  messageText: {
    color: "#EAF0F7",
    fontSize: 15,
    lineHeight: 22,
  },

  linkText: {
    color: "#4DB8FF",
    textDecorationLine: "underline",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  loadingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },

  loadingBubble: {
    backgroundColor: "#111B27",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  loadingText: {
    color: "#91A8CA",
    fontSize: 13,
  },

  inputArea: {
    marginHorizontal: 10,
    marginBottom: 8,
    minHeight: 58,
    maxHeight: 120,
    borderRadius: 20,
    backgroundColor: "#101923",
    borderWidth: 1,
    borderColor: "#203247",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
  },

  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraIcon: {
    fontSize: 22,
  },

  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    paddingHorizontal: 7,
    paddingVertical: 10,
    maxHeight: 100,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#8CFF00",
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    opacity: 0.35,
  },

  sendIcon: {
    color: "#071008",
    fontSize: 23,
    fontWeight: "900",
  },

  bottomNav: {
    height: 68,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 22,
    backgroundColor: "#0F1823",
    borderWidth: 1,
    borderColor: "#203247",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  navItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  navIcon: {
    fontSize: 20,
    opacity: 0.7,
  },

  navIconActive: {
    opacity: 1,
  },

  navText: {
    color: "#6F8198",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  navActiveText: {
    color: "#8CFF00",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
  },

  photoModal: {
    width: "96%",
    maxHeight: "90%",
    backgroundColor: "#0D1621",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#203247",
    padding: 16,
  },

  moreModal: {
    width: "94%",
    backgroundColor: "#0D1621",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#203247",
    padding: 18,
  },

  infoModal: {
    width: "90%",
    backgroundColor: "#0D1621",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#203247",
    padding: 22,
    alignItems: "center",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  closeText: {
    color: "#8CFF00",
    fontSize: 25,
    fontWeight: "800",
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
    backgroundColor: "#08111D",
    borderRadius: 20,
  },

  noPhotoText: {
    color: "#91A8CA",
    fontSize: 15,
  },

  photoButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  photoButton: {
    flex: 1,
    minHeight: 48,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "#132235",
    borderWidth: 1,
    borderColor: "#203B58",
    alignItems: "center",
    justifyContent: "center",
  },

  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  menuItem: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#192A3D",
  },

  menuIcon: {
    fontSize: 21,
    width: 38,
  },

  menuText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#192A3D",
    paddingVertical: 13,
  },

  savedOpen: {
    flex: 1,
    marginRight: 10,
  },

  savedTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  savedDate: {
    color: "#657A92",
    fontSize: 11,
    marginTop: 4,
  },

  deleteText: {
    fontSize: 19,
    padding: 8,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyText: {
    color: "#91A8CA",
    fontSize: 14,
  },

  infoTitle: {
    color: "#8CFF00",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 12,
  },

  infoText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  infoSmall: {
    color: "#91A8CA",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  aboutLogo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 10,
  },

  aboutTitle: {
    color: "#8CFF00",
    fontSize: 28,
    fontWeight: "900",
  },

  aboutText: {
    color: "#C5D2E2",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
  },

  version: {
    color: "#657A92",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 20,
  },

  closeButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#8CFF00",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    color: "#071008",
    fontSize: 15,
    fontWeight: "900",
  },

});
