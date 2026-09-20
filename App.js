import React, { useEffect, useState } from "react";
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
  StatusBar,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://ryp-hpvu.onrender.com/chat";
const CHAT_KEY = "ryp_saved_chats_v7";

const RYP_IMAGE = require(
  "./file_00000000e44c81f4b86b60e21106fc88.png"
);

const { width } = Dimensions.get("window");
const UI = Math.min(width / 390, 1);

function u(value) {
  return Math.round(value * UI);
}

function makeId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).slice(2)
  );
}

const WELCOME = {
  id: "welcome",
  role: "assistant",
  content:
    "Čau 😈 Já jsem Rýp. Tak co dneska vyřešíme?",
};

function Message({ item }) {
  const mine = item.role === "user";

  return (
    <View
      style={[
        styles.messageRow,
        mine && styles.messageRowMine,
      ]}
    >
      {!mine && (
        <Image
          source={RYP_IMAGE}
          style={styles.messageAvatar}
        />
      )}

      <View
        style={[
          styles.messageBubble,
          mine
            ? styles.userBubble
            : styles.aiBubble,
        ]}
      >
        <Text style={styles.messageText}>
          {item.content}
        </Text>
      </View>
    </View>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    WELCOME,
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedChats, setSavedChats] = useState([]);

  const [activeTab, setActiveTab] =
    useState("chat");

  const [modal, setModal] =
    useState(null);

  const [photo, setPhoto] =
    useState(null);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    try {
      const raw =
        await AsyncStorage.getItem(CHAT_KEY);

      if (raw) {
        setSavedChats(
          JSON.parse(raw)
        );
      }
    } catch (e) {
      console.log("Load chats:", e);
    }
  }

  async function persistChats(chats) {
    try {
      setSavedChats(chats);

      await AsyncStorage.setItem(
        CHAT_KEY,
        JSON.stringify(chats)
      );
    } catch (e) {
      console.log("Save chats:", e);
    }
  }

  function newChat() {
    setMessages([
      {
        ...WELCOME,
        id: makeId(),
      },
    ]);

    setInput("");
    setPhoto(null);
    setModal(null);
    setActiveTab("chat");
  }

  async function saveChat() {
    if (messages.length <= 1) {
      Alert.alert(
        "Rýp",
        "Nejdřív si s Rýpem něco napiš 😈"
      );
      return;
    }

    const firstUser =
      messages.find(
        (m) => m.role === "user"
      );

    const title =
      firstUser?.content?.slice(
        0,
        35
      ) || "Nový chat";

    const chat = {
      id: makeId(),
      title,
      date:
        new Date().toLocaleString(
          "cs-CZ"
        ),
      messages,
    };

    await persistChats([
      chat,
      ...savedChats,
    ]);

    Alert.alert(
      "Hotovo",
      "Chat je uložený 😈"
    );
  }

  async function deleteChat(id) {
    const next =
      savedChats.filter(
        (c) => c.id !== id
      );

    await persistChats(next);
  }

  function openChat(chat) {
    setMessages(
      chat.messages?.length
        ? chat.messages
        : [WELCOME]
    );

    setModal(null);
    setActiveTab("chat");
  }

  async function sendMessage() {
    const text =
      input.trim();

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
      const history =
        nextMessages
          .slice(-12)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

      const response =
        await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: text,
            history,
          }),
        });

      const data =
        await response.json();

      const answer =
        data?.reply ||
        data?.message ||
        data?.response ||
        "Rýp se zasekl. Zkus to ještě jednou 😈";

      setMessages(
        (current) => [
          ...current,
          {
            id: makeId(),
            role: "assistant",
            content: answer,
          },
        ]
      );
    } catch (e) {
      console.log("API:", e);

      setMessages(
        (current) => [
          ...current,
          {
            id: makeId(),
            role: "assistant",
            content:
              "Teď mi to nějak nejede. Zkus to za chvíli znovu 😈",
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  async function pickPhoto(
    camera = false
  ) {
    try {
      let result;

      if (camera) {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Foto",
            "Rýp potřebuje povolení ke kameře."
          );
          return;
        }

        result =
          await ImagePicker.launchCameraAsync(
            {
              mediaTypes: ["images"],
              quality: 0.8,
            }
          );
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Foto",
            "Rýp potřebuje přístup k fotkám."
          );
          return;
        }

        result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ["images"],
              quality: 0.8,
            }
          );
      }

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        setPhoto(
          result.assets[0].uri
        );

        setModal("photo");
      }
    } catch (e) {
      Alert.alert(
        "Foto",
        "Fotku se nepodařilo otevřít."
      );
    }
  }

  function selectTab(tab) {
    setActiveTab(tab);

    if (tab === "chat") {
      setModal(null);
    }

    if (tab === "photo") {
      setModal("photoMenu");
    }

    if (tab === "more") {
      setModal("more");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#02070D"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >

        {/* DECENTNÍ MODRO-ČERNÉ POZADÍ */}

        <View
          pointerEvents="none"
          style={styles.backgroundPattern}
        >
          <View
            style={styles.patternLine1}
          />
          <View
            style={styles.patternLine2}
          />
          <View
            style={styles.patternLine3}
          />
          <View
            style={styles.patternLine4}
          />

          <View
            style={styles.patternCircle1}
          />

          <View
            style={styles.patternCircle2}
          />

          <Text
            style={styles.rypalWatermark}
          >
            Rýpal
          </Text>
        </View>

        <View
          style={styles.backgroundGlow}
        />

        <FlatList
          data={messages}
          keyExtractor={(item) =>
            item.id
          }
          renderItem={({ item }) => (
            <Message item={item} />
          )}
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.chatContent
          }
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.hero}>

              <View
                style={
                  styles.heroArtwork
                }
              >
                <View
                  style={styles.blueRing}
                />

                <Image
                  source={RYP_IMAGE}
                  style={styles.heroImage}
                />
              </View>

              <Text
                style={styles.logoText}
              >
                Rýp
              </Text>

              <View
                style={styles.logoStroke}
              />

              <Text
                style={styles.slogan}
              >
                AI, která se s tebou
                nemaže.
                <Text
                  style={styles.crown}
                >
                  {" "}♕
                </Text>
              </Text>

            </View>
          }
        />

        {loading && (
          <View
            style={styles.loadingRow}
          >
            <Image
              source={RYP_IMAGE}
              style={
                styles.loadingAvatar
              }
            />

            <Text
              style={styles.loadingText}
            >
              Rýp přemýšlí… 😈
            </Text>
          </View>
        )}

        <View
          style={styles.composerRow}
        >

          <TouchableOpacity
            style={
              styles.cameraButton
            }
            onPress={() =>
              pickPhoto(true)
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="camera-outline"
              size={u(25)}
              color="#EAF4FF"
            />
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={
              sendMessage
            }
            placeholder="Napiš Rýpovi..."
            placeholderTextColor="#8EA8D1"
            style={styles.input}
            multiline
            maxLength={2000}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={
              styles.sendButton
            }
            onPress={sendMessage}
            activeOpacity={0.75}
            disabled={
              !input.trim() ||
              loading
            }
          >
            <Ionicons
              name="send"
              size={u(24)}
              color="#071000"
            />
          </TouchableOpacity>

        </View>

        {/* SPODNÍ MENU – BEZ HER */}

        <View
          style={styles.bottomBar}
        >

          <BottomButton
            active={
              activeTab === "chat"
            }
            icon="chatbubble"
            label="Chat"
            onPress={() =>
              selectTab("chat")
            }
          />

          <BottomButton
            active={
              activeTab === "photo"
            }
            icon="camera"
            label="Foto"
            onPress={() =>
              selectTab("photo")
            }
          />

          <BottomButton
            active={
              activeTab === "more"
            }
            icon="menu"
            label="Další"
            onPress={() =>
              selectTab("more")
            }
          />

        </View>

      </KeyboardAvoidingView>

      {/* FOTO MENU */}

      <Modal
        visible={
          modal === "photoMenu"
        }
        transparent
        animationType="fade"
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={styles.modalBox}
          >

            <Text
              style={styles.modalTitle}
            >
              Foto
            </Text>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() =>
                pickPhoto(true)
              }
            >
              <Ionicons
                name="camera"
                size={u(22)}
                color="#8BB8FF"
              />

              <Text
                style={
                  styles.modalButtonText
                }
              >
                Vyfotit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() =>
                pickPhoto(false)
              }
            >
              <Ionicons
                name="images"
                size={u(22)}
                color="#8BB8FF"
              />

              <Text
                style={
                  styles.modalButtonText
                }
              >
                Vybrat z galerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setModal(null)
              }
            >
              <Text
                style={styles.closeText}
              >
                Zavřít
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* FOTO */}

      <Modal
        visible={
          modal === "photo"
        }
        transparent
        animationType="slide"
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={styles.photoModal}
          >

            <Text
              style={styles.modalTitle}
            >
              Tvoje fotka
            </Text>

            {photo && (
              <Image
                source={{
                  uri: photo,
                }}
                style={
                  styles.photoPreview
                }
              />
            )}

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() => {
                setModal(null);
                setInput(
                  "Podívej se na tuhle fotku a řekni mi, co na ní vidíš."
                );
                setActiveTab(
                  "chat"
                );
              }}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={u(22)}
                color="#A6FF00"
              />

              <Text
                style={
                  styles.modalButtonText
                }
              >
                Použít v chatu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setModal(null)
              }
            >
              <Text
                style={styles.closeText}
              >
                Zavřít
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* DALŠÍ */}

      <Modal
        visible={
          modal === "more"
        }
        transparent
        animationType="slide"
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={styles.modalBox}
          >

            <Text
              style={styles.modalTitle}
            >
              Další
            </Text>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() =>
                setModal("saved")
              }
            >
              <Ionicons
                name="bookmark"
                size={u(22)}
                color="#8BB8FF"
              />

              <Text
                style={
                  styles.modalButtonText
                }
              >
                Uložené chaty
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={saveChat}
            >
              <Ionicons
                name="save"
                size={u(22)}
                color="#A6FF00"
              />

              <Text
                style={
                  styles.modalButtonText
                }
              >
                Uložit tento chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={newChat}
            >
              <Ionicons
                name="add-circle"
                size={u(22)}
                color="#8BB8FF"
              />

              <Text
                style={
                  styles.modalButtonText
                }
              >
                Nový chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() =>
                setModal("about")
              }
            >
              <Ionicons
                name="information-circle"
                size={u(22)}
                color="#8BB8FF"
              />

              <Text
                style={
                  styles.modalButtonText
                }
              >
                O Rýpovi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setModal(null)
              }
            >
              <Text
                style={styles.closeText}
              >
                Zavřít
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ULOŽENÉ CHATY */}

      <Modal
        visible={
          modal === "saved"
        }
        transparent
        animationType="slide"
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={styles.savedBox}
          >

            <Text
              style={styles.modalTitle}
            >
              Uložené chaty
            </Text>

            {savedChats.length ===
            0 ? (
              <Text
                style={
                  styles.emptyText
                }
              >
                Zatím tu nic není.
              </Text>
            ) : (
              <FlatList
                data={savedChats}
                keyExtractor={(
                  item
                ) => item.id}
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
                      style={{
                        flex: 1,
                      }}
                      onPress={() =>
                        openChat(item)
                      }
                    >
                      <Text
                        style={
                          styles.savedTitle
                        }
                        numberOfLines={
                          2
                        }
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={
                          styles.savedDate
                        }
                      >
                        {item.date}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        deleteChat(
                          item.id
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={u(21)}
                        color="#FF657A"
                      />
                    </TouchableOpacity>

                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setModal(null)
              }
            >
              <Text
                style={styles.closeText}
              >
                Zavřít
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* O RÝPOVI */}

      <Modal
        visible={
          modal === "about"
        }
        transparent
        animationType="fade"
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={styles.aboutBox}
          >

            <Image
              source={RYP_IMAGE}
              style={
                styles.aboutImage
              }
            />

            <Text
              style={styles.aboutTitle}
            >
              RýpAI
            </Text>

            <Text
              style={styles.aboutText}
            >
              AI, která se s tebou
              nemaže. 😈
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
                setModal(null)
              }
            >
              <Text
                style={styles.closeText}
              >
                Zavřít
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function BottomButton({
  active,
  icon,
  label,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.bottomButton}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons
        name={icon}
        size={u(24)}
        color={
          active
            ? "#A6FF00"
            : "#8EA8D1"
        }
      />

      <Text
        style={[
          styles.bottomLabel,
          active &&
            styles.bottomLabelActive,
        ]}
      >
        {label}
      </Text>

      {active && (
        <View
          style={
            styles.activeLine
          }
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#02070D",
  },

  container: {
    flex: 1,
    backgroundColor: "#02070D",
  },

  /* DECENTNÍ MODRO-ČERNÝ VZOR */

  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#02070D",
    zIndex: 0,
  },

  patternLine1: {
    position: "absolute",
    width: u(260),
    height: u(1),
    backgroundColor: "#0A3558",
    opacity: 0.35,
    top: u(180),
    left: u(-55),
    transform: [
      {
        rotate: "-24deg",
      },
    ],
  },

  patternLine2: {
    position: "absolute",
    width: u(210),
    height: u(1),
    backgroundColor: "#0B426C",
    opacity: 0.28,
    top: u(330),
    right: u(-45),
    transform: [
      {
        rotate: "-24deg",
      },
    ],
  },

  patternLine3: {
    position: "absolute",
    width: u(240),
    height: u(1),
    backgroundColor: "#0A3558",
    opacity: 0.25,
    bottom: u(190),
    left: u(-70),
    transform: [
      {
        rotate: "-24deg",
      },
    ],
  },

  patternLine4: {
    position: "absolute",
    width: u(190),
    height: u(1),
    backgroundColor: "#0B426C",
    opacity: 0.24,
    bottom: u(100),
    right: u(-50),
    transform: [
      {
        rotate: "-24deg",
      },
    ],
  },

  patternCircle1: {
    position: "absolute",
    width: u(95),
    height: u(95),
    borderRadius: u(48),
    borderWidth: u(1),
    borderColor: "#0A4C7C",
    opacity: 0.22,
    top: u(250),
    right: u(-35),
  },

  patternCircle2: {
    position: "absolute",
    width: u(65),
    height: u(65),
    borderRadius: u(33),
    borderWidth: u(1),
    borderColor: "#0A4C7C",
    opacity: 0.18,
    bottom: u(230),
    left: u(-20),
  },

  rypalWatermark: {
    position: "absolute",
    color: "#1689C9",
    fontSize: u(38),
    fontWeight: "900",
    fontStyle: "italic",
    opacity: 0.055,
    top: "47%",
    alignSelf: "center",
    transform: [
      {
        rotate: "-12deg",
      },
    ],
  },

  backgroundGlow: {
    position: "absolute",
    width: u(300),
    height: u(300),
    borderRadius: u(150),
    backgroundColor: "#06233A",
    opacity: 0.18,
    top: u(-150),
    alignSelf: "center",
    zIndex: 1,
  },

  chatContent: {
    paddingTop: 0,
    paddingBottom: u(8),
  },

  hero: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: u(8),
  },

  heroArtwork: {
    width: u(160),
    height: u(160),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  blueRing: {
    position: "absolute",
    width: u(148),
    height: u(148),
    borderRadius: u(74),
    borderWidth: u(4),
    borderColor: "#00A8FF",
  },

  heroImage: {
    width: u(142),
    height: u(142),
    borderRadius: u(71),
    resizeMode: "cover",
  },

  logoText: {
    marginTop: u(-3),
    color: "#FFFFFF",
    fontSize: u(50),
    lineHeight: u(55),
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -u(2),
    textShadowColor: "#009EFF",
    textShadowOffset: {
      width: u(4),
      height: u(3),
    },
    textShadowRadius: 0,
  },

  logoStroke: {
    width: u(125),
    height: u(7),
    backgroundColor: "#00A8FF",
    borderRadius: u(8),
    transform: [
      {
        rotate: "-5deg",
      },
    ],
    marginTop: u(-2),
    marginLeft: u(24),
  },

  slogan: {
    color: "#8EA8D1",
    fontSize: u(15),
    fontWeight: "600",
    marginTop: u(7),
    textAlign: "center",
  },

  crown: {
    color: "#00A8FF",
    fontSize: u(18),
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: u(16),
    marginTop: u(5),
    marginBottom: u(5),
  },

  messageRowMine: {
    justifyContent: "flex-end",
  },

  messageAvatar: {
    width: u(42),
    height: u(42),
    borderRadius: u(21),
    borderWidth: u(2),
    borderColor: "#00A8FF",
    marginRight: u(8),
  },

  messageBubble: {
    maxWidth: "79%",
    paddingHorizontal: u(14),
    paddingVertical: u(10),
    borderRadius: u(19),
  },

  aiBubble: {
    backgroundColor: "#182231",
    borderWidth: 1,
    borderColor: "#23344A",
  },

  userBubble: {
    backgroundColor: "#A6FF00",
  },

  messageText: {
    color: "#F2F7FF",
    fontSize: u(16),
    lineHeight: u(22),
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: u(18),
    marginBottom: u(5),
  },

  loadingAvatar: {
    width: u(27),
    height: u(27),
    borderRadius: u(14),
    marginRight: u(7),
  },

  loadingText: {
    color: "#8EA8D1",
    fontSize: u(13),
  },

  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: u(13),
    paddingTop: u(5),
    paddingBottom: u(7),
    backgroundColor: "transparent",
    zIndex: 5,
  },

  cameraButton: {
    width: u(53),
    height: u(53),
    borderRadius: u(27),
    borderWidth: 1.5,
    borderColor: "#0D73B9",
    backgroundColor: "#091522",
    alignItems: "center",
    justifyContent: "center",
    marginRight: u(7),
  },

  input: {
    flex: 1,
    minHeight: u(50),
    maxHeight: u(88),
    backgroundColor: "#101B29",
    borderWidth: 1.5,
    borderColor: "#1C426D",
    borderRadius: u(26),
    paddingHorizontal: u(16),
    paddingVertical: u(11),
    color: "#F2F7FF",
    fontSize: u(16),
  },

  sendButton: {
    width: u(53),
    height: u(53),
    borderRadius: u(27),
    backgroundColor: "#A6FF00",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: u(7),
  },

  bottomBar: {
    height: u(70),
    borderTopWidth: 1,
    borderColor: "#12304F",
    backgroundColor: "#07111C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: u(3),
    zIndex: 5,
  },

  bottomButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
  },

  bottomLabel: {
    color: "#8EA8D1",
    fontSize: u(11),
    fontWeight: "700",
    marginTop: u(2),
  },

  bottomLabelActive: {
    color: "#A6FF00",
  },

  activeLine: {
    position: "absolute",
    bottom: u(3),
    width: u(40),
    height: u(3),
    borderRadius: u(3),
    backgroundColor: "#A6FF00",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#0B1623",
    borderTopLeftRadius: u(25),
    borderTopRightRadius: u(25),
    borderWidth: 1,
    borderColor: "#244464",
    padding: u(20),
    paddingBottom: u(25),
  },

  photoModal: {
    backgroundColor: "#0B1623",
    borderTopLeftRadius: u(25),
    borderTopRightRadius: u(25),
    padding: u(18),
    paddingBottom: u(25),
    maxHeight: "90%",
  },

  savedBox: {
    backgroundColor: "#0B1623",
    borderTopLeftRadius: u(25),
    borderTopRightRadius: u(25),
    padding: u(20),
    paddingBottom: u(25),
    maxHeight: "80%",
  },

  aboutBox: {
    backgroundColor: "#0B1623",
    marginHorizontal: u(25),
    borderRadius: u(25),
    borderWidth: 1,
    borderColor: "#244464",
    padding: u(22),
    alignItems: "center",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: u(23),
    fontWeight: "900",
    marginBottom: u(15),
  },

  modalButton: {
    minHeight: u(50),
    borderRadius: u(15),
    backgroundColor: "#111F30",
    borderWidth: 1,
    borderColor: "#213B58",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: u(15),
    marginBottom: u(8),
  },

  modalButtonText: {
    color: "#F1F6FF",
    fontSize: u(16),
    fontWeight: "700",
    marginLeft: u(10),
  },

  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: u(44),
    marginTop: u(5),
  },

  closeText: {
    color: "#8EA8D1",
    fontSize: u(15),
    fontWeight: "700",
  },

  photoPreview: {
    width: "100%",
    height: u(300),
    borderRadius: u(18),
    backgroundColor: "#02070D",
    marginBottom: u(12),
    resizeMode: "contain",
  },

  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111F30",
    borderWidth: 1,
    borderColor: "#213B58",
    borderRadius: u(15),
    padding: u(12),
    marginBottom: u(7),
  },

  savedTitle: {
    color: "#FFFFFF",
    fontSize: u(15),
    fontWeight: "700",
  },

  savedDate: {
    color: "#7892B8",
    fontSize: u(11),
    marginTop: u(3),
  },

  emptyText: {
    color: "#8EA8D1",
    fontSize: u(14),
    textAlign: "center",
    paddingVertical: u(25),
  },

  aboutImage: {
    width: u(85),
    height: u(85),
    borderRadius: u(43),
    borderWidth: 2,
    borderColor: "#00A8FF",
    marginBottom: u(9),
  },

  aboutTitle: {
    color: "#A6FF00",
    fontSize: u(28),
    fontWeight: "900",
  },

  aboutText: {
    color: "#C7D7ED",
    fontSize: u(15),
    marginTop: u(5),
    textAlign: "center",
  },

  version: {
    color: "#7188A8",
    fontSize: u(11),
    marginTop: u(9),
  },
});
