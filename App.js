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
        size={u(23)}
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
          style={styles.activeDot}
        />
      )}
    </TouchableOpacity>
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
        backgroundColor="#020914"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >

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
                      style={
                        styles.deleteButton
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={u(20)}
                        color="#FF6680"
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
              style={
                styles.aboutTitle
              }
            >
              RýpAI
            </Text>

            <Text
              style={
                styles.aboutText
              }
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

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: "#020914",
  },

  container: {
    flex: 1,
    backgroundColor: "#020914",
  },

  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#02070D",
    zIndex: 0,
  },

  patternLine1: {
    position: "absolute",
    width: u(320),
    height: u(2),
    backgroundColor: "#087FC2",
    opacity: 0.32,
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
    width: u(270),
    height: u(2),
    backgroundColor: "#0B8ED5",
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
    width: u(300),
    height: u(2),
    backgroundColor: "#087FC2",
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
    width: u(250),
    height: u(2),
    backgroundColor: "#0B8ED5",
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
    width: u(170),
    height: u(170),
    borderRadius: u(85),
    borderWidth: u(2),
    borderColor: "#078BD0",
    opacity: 0.20,
    top: u(250),
    right: u(-35),
  },

  patternCircle2: {
    position: "absolute",
    width: u(115),
    height: u(115),
    borderRadius: u(58),
    borderWidth: u(2),
    borderColor: "#078BD0",
    opacity: 0.16,
    bottom: u(230),
    left: u(-20),
  },

  rypalWatermark: {
    position: "absolute",
    color: "#1AA9F5",
    fontSize: u(46),
    fontWeight: "900",
    fontStyle: "italic",
    opacity: 0.075,
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
    width: u(420),
    height: u(420),
    borderRadius: u(210),
    backgroundColor: "#064A78",
    opacity: 0.24,
    top: u(-210),
    alignSelf: "center",
    zIndex: 1,
  },

  chatContent: {
    paddingTop: u(12),
    paddingBottom: u(10),
  },

  hero: {
    alignItems: "center",
    paddingTop: u(4),
    paddingBottom: u(18),
  },

  heroArtwork: {
    width: u(118),
    height: u(118),
    alignItems: "center",
    justifyContent: "center",
  },

  blueRing: {
    position: "absolute",
    width: u(112),
    height: u(112),
    borderRadius: u(56),
    borderWidth: u(2),
    borderColor: "#008FE3",
    opacity: 0.75,
  },

  heroImage: {
    width: u(105),
    height: u(105),
    borderRadius: u(53),
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: u(48),
    fontWeight: "900",
    fontStyle: "italic",
    marginTop: u(0),
  },

  logoStroke: {
    width: u(215),
    height: u(7),
    borderRadius: u(5),
    backgroundColor: "#008FD4",
    marginTop: u(-7),
    transform: [
      {
        rotate: "-2deg",
      },
    ],
  },

  slogan: {
    color: "#8EA8D1",
    fontSize: u(15),
    fontWeight: "600",
    marginTop: u(13),
    textAlign: "center",
  },

  crown: {
    color: "#A6FF00",
    fontSize: u(17),
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: u(14),
    marginBottom: u(10),
  },

  messageRowMine: {
    justifyContent: "flex-end",
  },

  messageAvatar: {
    width: u(38),
    height: u(38),
    borderRadius: u(19),
    marginRight: u(8),
  },

  messageBubble: {
    maxWidth: "78%",
    borderRadius: u(18),
    paddingHorizontal: u(14),
    paddingVertical: u(10),
  },

  aiBubble: {
    backgroundColor: "#101D2C",
    borderWidth: 1,
    borderColor: "#183650",
    borderBottomLeftRadius: u(5),
  },

  userBubble: {
    backgroundColor: "#6E9900",
    borderBottomRightRadius: u(5),
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: u(15),
    lineHeight: u(21),
  },

  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: u(10),
    paddingTop: u(8),
    paddingBottom: u(8),
    backgroundColor: "#050E18",
    borderTopWidth: 1,
    borderColor: "#102A42",
    zIndex: 4,
  },

  cameraButton: {
    width: u(48),
    height: u(48),
    borderRadius: u(16),
    backgroundColor: "#0C1D2D",
    borderWidth: 1,
    borderColor: "#1B4668",
    alignItems: "center",
    justifyContent: "center",
    marginRight: u(7),
  },

  input: {
    flex: 1,
    minHeight: u(48),
    maxHeight: u(110),
    backgroundColor: "#0A1725",
    borderWidth: 1,
    borderColor: "#173650",
    borderRadius: u(17),
    color: "#FFFFFF",
    fontSize: u(15),
    paddingHorizontal: u(14),
    paddingTop: u(12),
    paddingBottom: u(10),
  },

  sendButton: {
    width: u(48),
    height: u(48),
    borderRadius: u(16),
    backgroundColor: "#A6FF00",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: u(7),
  },

  bottomBar: {
    height: u(76),
    marginBottom:
      Platform.OS === "android"
        ? u(14)
        : 0,
    borderTopWidth: 1,
    borderColor: "#14517C",
    backgroundColor: "#081522",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: u(3),
    borderBottomLeftRadius: u(14),
    borderBottomRightRadius: u(14),
    zIndex: 5,
  },

  bottomButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingTop: u(2),
    position: "relative",
  },

  bottomLabel: {
    color: "#8EA8D1",
    fontSize: u(11),
    marginTop: u(3),
    fontWeight: "600",
  },

  bottomLabelActive: {
    color: "#A6FF00",
  },

  activeDot: {
    position: "absolute",
    bottom: u(5),
    width: u(5),
    height: u(5),
    borderRadius: u(3),
    backgroundColor: "#A6FF00",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: u(18),
    paddingVertical: u(5),
  },

  loadingAvatar: {
    width: u(30),
    height: u(30),
    borderRadius: u(15),
    marginRight: u(8),
  },

  loadingText: {
    color: "#8EA8D1",
    fontSize: u(13),
    fontStyle: "italic",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: u(20),
  },

  modalBox: {
    width: "100%",
    maxWidth: u(390),
    backgroundColor: "#081522",
    borderWidth: 1,
    borderColor: "#245074",
    borderRadius: u(22),
    padding: u(20),
  },

  photoModal: {
    width: "100%",
    maxWidth: u(390),
    backgroundColor: "#081522",
    borderWidth: 1,
    borderColor: "#245074",
    borderRadius: u(22),
    padding: u(20),
    alignItems: "center",
  },

  savedBox: {
    width: "100%",
    maxWidth: u(390),
    maxHeight: "78%",
    backgroundColor: "#081522",
    borderWidth: 1,
    borderColor: "#245074",
    borderRadius: u(22),
    padding: u(20),
  },

  aboutBox: {
    width: "100%",
    maxWidth: u(390),
    backgroundColor: "#081522",
    borderWidth: 1,
    borderColor: "#245074",
    borderRadius: u(22),
    padding: u(25),
    alignItems: "center",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: u(22),
    fontWeight: "900",
    marginBottom: u(16),
  },

  modalButton: {
    minHeight: u(52),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: u(14),
    borderRadius: u(14),
    backgroundColor: "#0E1F31",
    borderWidth: 1,
    borderColor: "#1A3B59",
    marginBottom: u(9),
  },

  modalButtonText: {
    color: "#FFFFFF",
    fontSize: u(15),
    fontWeight: "700",
    marginLeft: u(12),
  },

  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: u(13),
    marginTop: u(4),
  },

  closeText: {
    color: "#9CB5D8",
    fontSize: u(16),
    fontWeight: "800",
  },

  photoPreview: {
    width: "100%",
    height: u(260),
    borderRadius: u(15),
    marginBottom: u(14),
    backgroundColor: "#02070D",
    resizeMode: "contain",
  },

  deleteButton: {
    width: u(42),
    height: u(42),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: u(8),
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
